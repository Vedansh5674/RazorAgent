import { db } from '../config/database.js';
import { AuditService } from './auditService.js';

export class PolicyService {
  /**
   * Retrieves merchant policy configuration
   */
  static async getMerchantPolicy(merchantId) {
    const result = await db.query(
      `SELECT * FROM merchant_policies WHERE merchant_id = $1 LIMIT 1`,
      [merchantId]
    );

    if (result.rows.length === 0) {
      // Default fallback policy
      return {
        merchant_id: merchantId,
        max_discount_percent: 10.00,
        max_discount_amount: 500.00,
        max_campaign_budget: 5000.00,
        max_messages_per_customer: 1,
        recovery_window_hours: 24,
        requires_merchant_approval: true,
        allowed_actions: ['send_whatsapp_recovery', 'retry_payment_reminder', 'recommend_product_bundle']
      };
    }

    const policy = result.rows[0];
    if (typeof policy.allowed_actions === 'string') {
      try {
        policy.allowed_actions = JSON.parse(policy.allowed_actions);
      } catch (e) {
        policy.allowed_actions = ['send_whatsapp_recovery'];
      }
    }
    return policy;
  }

  /**
   * Updates merchant policy
   */
  static async updateMerchantPolicy(merchantId, updates) {
    const current = await this.getMerchantPolicy(merchantId);
    const updated = {
      max_discount_percent: updates.maxDiscountPercent ?? current.max_discount_percent,
      max_discount_amount: updates.maxDiscountAmount ?? current.max_discount_amount,
      max_campaign_budget: updates.maxCampaignBudget ?? current.max_campaign_budget,
      max_messages_per_customer: updates.maxMessagesPerCustomer ?? current.max_messages_per_customer,
      recovery_window_hours: updates.recoveryWindowHours ?? current.recovery_window_hours,
      requires_merchant_approval: updates.requiresMerchantApproval ?? current.requires_merchant_approval,
      allowed_actions: updates.allowedActions ?? current.allowed_actions
    };

    await db.query(
      `UPDATE merchant_policies
       SET max_discount_percent = $1,
           max_discount_amount = $2,
           max_campaign_budget = $3,
           max_messages_per_customer = $4,
           recovery_window_hours = $5,
           requires_merchant_approval = $6,
           allowed_actions = $7,
           updated_at = $8
       WHERE merchant_id = $9`,
      [
        updated.max_discount_percent,
        updated.max_discount_amount,
        updated.max_campaign_budget,
        updated.max_messages_per_customer,
        updated.recovery_window_hours,
        updated.requires_merchant_approval,
        JSON.stringify(updated.allowed_actions),
        new Date().toISOString(),
        merchantId
      ]
    );

    await AuditService.recordEvent({
      merchantId,
      actorType: 'merchant',
      eventType: 'policy_updated',
      entityType: 'merchant_policy',
      entityId: merchantId,
      inputData: updates,
      outputData: updated,
      status: 'success'
    });

    return updated;
  }

  /**
   * Validates an intended action against all merchant policy guardrails
   */
  static async validateAction({
    merchantId,
    actionType,
    discountPercent = 0,
    discountAmount = 0,
    customerId,
    cartId,
    merchantApproved = false
  }) {
    const policy = await this.getMerchantPolicy(merchantId);

    // 1. Check if action is allowed
    const allowedActions = Array.isArray(policy.allowed_actions) ? policy.allowed_actions : [];
    if (!allowedActions.includes(actionType)) {
      return {
        status: 'blocked',
        reason: `The requested action type '${actionType}' is not permitted by merchant policy.`,
        allowedActions
      };
    }

    // 2. Check discount percent limit
    if (Number(discountPercent) > Number(policy.max_discount_percent)) {
      return {
        status: 'blocked',
        reason: `The requested discount percentage (${discountPercent}%) exceeds the merchant policy limit.`,
        allowedMaximum: Number(policy.max_discount_percent),
        requested: discountPercent
      };
    }

    // 3. Check discount maximum amount limit
    if (Number(discountAmount) > Number(policy.max_discount_amount)) {
      return {
        status: 'blocked',
        reason: `The calculated discount amount (₹${discountAmount}) exceeds the maximum cap allowed per order.`,
        allowedMaximum: Number(policy.max_discount_amount),
        requested: discountAmount
      };
    }

    // 4. Check merchant approval requirement
    if (policy.requires_merchant_approval && !merchantApproved) {
      return {
        status: 'blocked',
        reason: 'Merchant approval is required before executing this revenue recovery action.',
        requiresApproval: true
      };
    }

    // 5. Verify customer consent (WhatsApp Opt-in check)
    if (actionType === 'send_whatsapp_recovery' && customerId) {
      const consentResult = await db.query(
        `SELECT * FROM customer_consents WHERE customer_id = $1 AND merchant_id = $2 LIMIT 1`,
        [customerId, merchantId]
      );

      if (consentResult.rows.length === 0 || !consentResult.rows[0].opted_in) {
        return {
          status: 'blocked',
          reason: 'Customer has not provided WhatsApp opt-in consent or has opted out.',
          optedIn: false
        };
      }
    }

    // 6. Check duplicate recovery messages for this cart or customer
    if (actionType === 'send_whatsapp_recovery' && customerId) {
      const msgResult = await db.query(
        `SELECT * FROM whatsapp_messages WHERE customer_id = $1 AND merchant_id = $2`,
        [customerId, merchantId]
      );

      // Filter successful or pending messages for this customer
      const priorCount = msgResult.rows.filter(m => m.status !== 'failed').length;
      if (priorCount >= (policy.max_messages_per_customer || 1)) {
        return {
          status: 'blocked',
          reason: `Customer has already received the maximum allowed recovery messages (${policy.max_messages_per_customer}).`,
          messagesSent: priorCount,
          maxAllowed: policy.max_messages_per_customer
        };
      }
    }

    // 7. Check checkout age / recovery window
    if (cartId) {
      const cartResult = await db.query(
        `SELECT * FROM carts WHERE id = $1 AND merchant_id = $2 LIMIT 1`,
        [cartId, merchantId]
      );

      if (cartResult.rows.length > 0) {
        const cart = cartResult.rows[0];
        const checkoutTime = new Date(cart.abandoned_at || cart.checkout_started_at || cart.created_at).getTime();
        const ageHours = (Date.now() - checkoutTime) / (1000 * 60 * 60);

        if (ageHours > Number(policy.recovery_window_hours)) {
          return {
            status: 'blocked',
            reason: `The checkout is ${ageHours.toFixed(1)} hours old, which exceeds the maximum recovery window of ${policy.recovery_window_hours} hours.`,
            recoveryWindowHours: policy.recovery_window_hours,
            checkoutAgeHours: parseFloat(ageHours.toFixed(1))
          };
        }
      }
    }

    return {
      status: 'approved',
      reason: 'All policy rules and guardrails successfully passed.'
    };
  }
}
