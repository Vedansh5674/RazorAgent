import { config } from '../config/env.js';
import { db } from '../config/database.js';
import { AuditService } from './auditService.js';
import crypto from 'crypto';

export class WhatsAppService {
  /**
   * Evaluates whether service operates in real Cloud API mode or certified Demo mode
   */
  static getMode() {
    if (config.whatsappAccessToken && config.whatsappPhoneNumberId && !config.whatsappDemoMode) {
      return 'cloud_api';
    }
    return 'demo';
  }

  /**
   * Verifies incoming Meta Webhook subscription challenge
   */
  static verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Formats the approved WhatsApp 'cart_recovery' template text
   */
  static formatRecoveryMessage({ customerName, merchantName, cartValue, discountAmount, discountPercent, checkoutUrl }) {
    return {
      header: `Exclusive Cart Recovery Offer from ${merchantName}`,
      body: `Hi ${customerName},\n\nYou left some items in your cart (Total: ₹${cartValue.toLocaleString('en-IN')}).\n` +
            (discountAmount > 0 
              ? `Good news! We've applied an exclusive ${discountPercent}% discount (Save ₹${discountAmount.toLocaleString('en-IN')}) just for you.\n\n`
              : `Your items are reserved and waiting for you.\n\n`) +
            `Complete your purchase using the link below:\n${checkoutUrl}\n\n` +
            `Reply STOP to opt out of WhatsApp updates.`,
      footer: `${merchantName} • RazorAgent WhatsApp Commerce`
    };
  }

  /**
   * Main entrypoint to dispatch a WhatsApp Recovery Template
   */
  static async sendCartRecoveryMessage({
    merchantId,
    customerId,
    opportunityId,
    phoneNumber,
    customerName,
    merchantName = 'TrendVault India',
    cartValue,
    discountPercent = 10,
    discountAmount = 0,
    recoveryUrl,
    simulateFailure = false // for demonstrating failure scenarios
  }) {
    const mode = this.getMode();

    // 1. Phone number validation
    const cleanPhone = (phoneNumber || '').replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        status: 'failed',
        message: 'Invalid customer phone number provided.',
        retryable: false,
        fallback: 'Verify phone number formatting in customer profile.'
      };
    }

    // 2. Validate WhatsApp Opt-in Consent
    const consentRes = await db.query(
      `SELECT * FROM customer_consents WHERE customer_id = $1 AND merchant_id = $2 LIMIT 1`,
      [customerId, merchantId]
    );
    if (consentRes.rows.length === 0 || !consentRes.rows[0].opted_in) {
      await AuditService.recordEvent({
        merchantId,
        actorType: 'whatsapp_service',
        eventType: 'whatsapp_send_blocked_optout',
        entityType: 'customer',
        entityId: customerId,
        inputData: { customerId, phoneNumber },
        outputData: { reason: 'Customer opted out or missing consent' },
        status: 'blocked'
      });

      return {
        status: 'blocked',
        message: 'WhatsApp delivery blocked: Customer has opted out or has not provided consent.',
        retryable: false,
        fallback: 'Consent required prior to initiating WhatsApp messages.'
      };
    }

    // 3. Duplicate Message Prevention
    const existingRes = await db.query(
      `SELECT * FROM whatsapp_messages WHERE customer_id = $1 AND merchant_id = $2 AND status IN ('sent', 'delivered', 'read')`,
      [customerId, merchantId]
    );
    if (existingRes.rows.length > 0) {
      return {
        status: 'blocked',
        message: 'Duplicate message prevention triggered. Recovery message was already delivered to this customer.',
        retryable: false,
        fallback: 'Policy allows at most 1 recovery message per checkout cycle.'
      };
    }

    const messageId = `wamsg_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const templateName = 'cart_recovery';
    const parameters = {
      customerName,
      merchantName,
      cartValue,
      discountPercent,
      discountAmount,
      recoveryUrl
    };

    // 4. Intentional Failure Scenario Testing
    if (simulateFailure) {
      await db.query(
        `INSERT INTO whatsapp_messages (id, merchant_id, customer_id, opportunity_id, phone_number, template_name, status, failure_reason, recovery_url, parameters, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          messageId,
          merchantId,
          customerId,
          opportunityId,
          cleanPhone,
          templateName,
          'failed',
          'WhatsApp Cloud API error 131026: Message undeliverable to recipient or rate limit reached',
          recoveryUrl,
          JSON.stringify(parameters),
          now,
          now
        ]
      );

      await AuditService.recordEvent({
        merchantId,
        actorType: 'whatsapp_service',
        actorId: 'meta_cloud_api',
        eventType: 'whatsapp_message_failed',
        entityType: 'whatsapp_message',
        entityId: messageId,
        inputData: { phoneNumber: cleanPhone, template: templateName },
        outputData: { error: 'Cloud API rejected message delivery', retryable: true },
        status: 'failed'
      });

      return {
        status: 'failed',
        message: 'The WhatsApp provider could not accept the message.',
        retryable: true,
        fallback: 'The opportunity remains available for retry.',
        messageId
      };
    }

    // 5. Cloud API Mode or Demo Mode Execution
    if (mode === 'cloud_api') {
      try {
        const url = `https://graph.facebook.com/${config.whatsappApiVersion}/${config.whatsappPhoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: customerName },
                  { type: 'text', text: merchantName },
                  { type: 'text', text: String(cartValue) },
                  { type: 'text', text: String(discountAmount) },
                  { type: 'text', text: recoveryUrl }
                ]
              }
            ]
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.whatsappAccessToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'Meta Cloud API error');
        }

        const providerMsgId = data.messages?.[0]?.id || `wamid.${crypto.randomUUID()}`;

        await db.query(
          `INSERT INTO whatsapp_messages (id, merchant_id, customer_id, opportunity_id, phone_number, template_name, status, provider_message_id, recovery_url, parameters, sent_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            messageId,
            merchantId,
            customerId,
            opportunityId,
            cleanPhone,
            templateName,
            'sent',
            providerMsgId,
            recoveryUrl,
            JSON.stringify(parameters),
            now,
            now,
            now
          ]
        );

        await AuditService.recordEvent({
          merchantId,
          actorType: 'whatsapp_service',
          actorId: 'meta_cloud_api',
          eventType: 'whatsapp_message_sent',
          entityType: 'whatsapp_message',
          entityId: messageId,
          inputData: { mode: 'cloud_api', templateName, recipient: cleanPhone },
          outputData: { providerMsgId, status: 'sent' },
          status: 'success'
        });

        return {
          status: 'success',
          mode: 'cloud_api',
          messageId,
          providerMsgId,
          message: 'Approved WhatsApp recovery message dispatched successfully via Meta Cloud API.'
        };
      } catch (cloudErr) {
        console.error('[WhatsAppService] Meta Cloud API Error:', cloudErr.message);
        return {
          status: 'failed',
          message: `The WhatsApp provider could not accept the message: ${cloudErr.message}`,
          retryable: true,
          fallback: 'The opportunity remains available for retry.'
        };
      }
    }

    // 6. Demo Mode Execution (Fully simulated with realistic webhook progression)
    const providerMsgId = `wamid.demo.${crypto.randomUUID().slice(0, 10)}`;

    await db.query(
      `INSERT INTO whatsapp_messages (id, merchant_id, customer_id, opportunity_id, phone_number, template_name, status, provider_message_id, recovery_url, parameters, sent_at, delivered_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        messageId,
        merchantId,
        customerId,
        opportunityId,
        cleanPhone,
        templateName,
        'delivered',
        providerMsgId,
        recoveryUrl,
        JSON.stringify(parameters),
        now,
        now,
        now,
        now
      ]
    );

    await AuditService.recordEvent({
      merchantId,
      actorType: 'whatsapp_service',
      actorId: 'whatsapp_demo_simulator',
      eventType: 'whatsapp_message_sent',
      entityType: 'whatsapp_message',
      entityId: messageId,
      inputData: { mode: 'demo', templateName, recipient: cleanPhone, discountPercent },
      outputData: { providerMsgId, status: 'delivered', label: 'Demo Mode — WhatsApp message simulated' },
      status: 'success'
    });

    return {
      status: 'success',
      mode: 'demo',
      label: 'Demo Mode — WhatsApp message simulated',
      messageId,
      providerMsgId,
      preview: this.formatRecoveryMessage({
        customerName,
        merchantName,
        cartValue,
        discountAmount,
        discountPercent,
        checkoutUrl: recoveryUrl
      })
    };
  }

  /**
   * Updates message status based on Meta or simulated Webhook
   */
  static async handleStatusWebhook({ messageId, status, failureReason }) {
    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) return null;

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();
    if (status === 'read') updates.read_at = new Date().toISOString();
    if (status === 'failed') updates.failure_reason = failureReason || 'Provider rejected delivery';

    const res = await db.query(
      `UPDATE whatsapp_messages 
       SET status = $1, 
           delivered_at = COALESCE($2, delivered_at),
           read_at = COALESCE($3, read_at),
           failure_reason = COALESCE($4, failure_reason),
           updated_at = $5
       WHERE id = $6 OR provider_message_id = $6
       RETURNING *`,
      [
        updates.status,
        updates.delivered_at || null,
        updates.read_at || null,
        updates.failure_reason || null,
        updates.updated_at,
        messageId
      ]
    );

    if (res.rows.length > 0) {
      const msg = res.rows[0];
      await AuditService.recordEvent({
        merchantId: msg.merchant_id,
        actorType: 'whatsapp_service',
        actorId: 'meta_webhook',
        eventType: `message_${status}`,
        entityType: 'whatsapp_message',
        entityId: msg.id,
        inputData: { status },
        outputData: { status, failureReason },
        status: status === 'failed' ? 'failed' : 'success'
      });
      return msg;
    }

    return null;
  }
}
