import { RecoveryAgent } from '../agent/recoveryAgent.js';
import { PolicyService } from './policyService.js';
import { AuditService } from './auditService.js';
import { WhatsAppService } from './whatsappService.js';
import { EmailService } from './emailService.js';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

export class AutopilotEngine {
  /**
   * Retrieves merchant autopilot configuration or seeds default settings
   */
  static async getSettings(merchantId) {
    if (!merchantId) throw new Error('merchantId is required');

    const result = await db.query(
      `SELECT * FROM autopilot_settings WHERE merchant_id = $1 LIMIT 1`,
      [merchantId]
    );

    if (result.rows.length === 0) {
      const defaultSettings = {
        id: `auto_set_${merchantId}`,
        merchant_id: merchantId,
        mode: 'SEMI_AUTOPILOT',
        is_paused: false,
        auto_approve_threshold: 0.80,
        max_auto_discount: 10.00,
        channels: ['whatsapp', 'email'],
        require_cart_value_min: 0.00,
        recovery_window_hours: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.query(
        `INSERT INTO autopilot_settings (
          id, merchant_id, mode, is_paused, auto_approve_threshold,
          max_auto_discount, channels, require_cart_value_min, recovery_window_hours,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          defaultSettings.id,
          defaultSettings.merchant_id,
          defaultSettings.mode,
          defaultSettings.is_paused,
          defaultSettings.auto_approve_threshold,
          defaultSettings.max_auto_discount,
          JSON.stringify(defaultSettings.channels),
          defaultSettings.require_cart_value_min,
          defaultSettings.recovery_window_hours,
          defaultSettings.created_at,
          defaultSettings.updated_at
        ]
      );

      return defaultSettings;
    }

    const row = result.rows[0];
    let channels = ['whatsapp', 'email'];
    if (typeof row.channels === 'string') {
      try { channels = JSON.parse(row.channels); } catch (e) {}
    } else if (Array.isArray(row.channels)) {
      channels = row.channels;
    }

    return {
      ...row,
      is_paused: Boolean(row.is_paused),
      auto_approve_threshold: Number(row.auto_approve_threshold || 0.80),
      max_auto_discount: Number(row.max_auto_discount || 10.00),
      require_cart_value_min: Number(row.require_cart_value_min || 0),
      recovery_window_hours: Number(row.recovery_window_hours || 24),
      channels
    };
  }

  /**
   * Updates merchant autopilot configuration
   */
  static async updateSettings(merchantId, updates = {}) {
    if (!merchantId) throw new Error('merchantId is required');

    const current = await this.getSettings(merchantId);

    const validModes = ['MANUAL_ASSIST', 'SEMI_AUTOPILOT', 'FULL_AUTOPILOT'];
    if (updates.mode && !validModes.includes(updates.mode)) {
      throw new Error(`Invalid mode: ${updates.mode}. Must be one of: ${validModes.join(', ')}`);
    }

    const mode = updates.mode || current.mode;
    const isPaused = updates.is_paused !== undefined ? Boolean(updates.is_paused) : current.is_paused;
    const threshold = updates.auto_approve_threshold !== undefined
      ? Math.max(0.1, Math.min(1.0, Number(updates.auto_approve_threshold)))
      : current.auto_approve_threshold;
    const maxDiscount = updates.max_auto_discount !== undefined
      ? Math.max(0, Math.min(100, Number(updates.max_auto_discount)))
      : current.max_auto_discount;
    const channels = Array.isArray(updates.channels) && updates.channels.length > 0
      ? updates.channels
      : current.channels;
    const requireCartValueMin = updates.require_cart_value_min !== undefined
      ? Number(updates.require_cart_value_min)
      : current.require_cart_value_min;
    const recoveryWindowHours = updates.recoveryWindowHours !== undefined
      ? Number(updates.recoveryWindowHours)
      : current.recovery_window_hours;

    const now = new Date().toISOString();

    await db.query(
      `UPDATE autopilot_settings
       SET mode = $1, is_paused = $2, auto_approve_threshold = $3,
           max_auto_discount = $4, channels = $5, require_cart_value_min = $6,
           recovery_window_hours = $7, updated_at = $8
       WHERE merchant_id = $9`,
      [
        mode,
        isPaused,
        threshold,
        maxDiscount,
        JSON.stringify(channels),
        requireCartValueMin,
        recoveryWindowHours,
        now,
        merchantId
      ]
    );

    // Record audit and event log
    await this.recordEvent(merchantId, {
      event_type: 'SETTINGS_CHANGED',
      severity: 'info',
      summary: `Autopilot configuration updated: Mode=${mode}, Paused=${isPaused}, Threshold=${Math.round(threshold * 100)}%, MaxDiscount=${maxDiscount}%`,
      details: { mode, isPaused, threshold, maxDiscount, channels }
    });

    return await this.getSettings(merchantId);
  }

  /**
   * Records a structured event in the Autopilot telemetry stream
   */
  static async recordEvent(merchantId, { event_type, severity = 'info', summary, details = {} }) {
    const id = `evt_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const now = new Date().toISOString();
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

    await db.query(
      `INSERT INTO autopilot_events (id, merchant_id, event_type, severity, summary, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, merchantId, event_type, severity, summary, detailsStr, now]
    );

    return {
      id,
      merchant_id: merchantId,
      event_type,
      severity,
      summary,
      details,
      created_at: now
    };
  }

  /**
   * Retrieves live activity stream for Mission Control
   */
  static async getActivityStream(merchantId, limit = 50) {
    if (!merchantId) throw new Error('merchantId is required');

    const result = await db.query(
      `SELECT * FROM autopilot_events WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [merchantId, Number(limit) || 50]
    );

    return result.rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details || '{}') : (row.details || {})
    }));
  }

  /**
   * Executes a full autonomous scan, guardrail evaluation, and multi-channel dispatch cycle
   */
  static async runAutopilotCycle(merchantId, options = {}) {
    if (!merchantId) throw new Error('merchantId is required');

    const settings = await this.getSettings(merchantId);
    const cycleId = `cycle_${Date.now()}_${crypto.randomUUID().slice(0, 4)}`;

    // 1. Check if paused
    if (settings.is_paused) {
      await this.recordEvent(merchantId, {
        event_type: 'CYCLE_HALTED_PAUSED',
        severity: 'warning',
        summary: 'Autopilot cycle paused. Merchant emergency stop is currently active.',
        details: { cycleId, mode: settings.mode }
      });

      return {
        cycleId,
        status: 'paused',
        message: 'Autopilot engine is currently paused by merchant.',
        cycleSummary: {
          scanned: 0,
          autoApproved: 0,
          dispatchedWhatsApp: 0,
          dispatchedEmail: 0,
          heldForManualReview: 0,
          blockedByGuardrail: 0,
          recoveredProjectedValue: 0
        }
      };
    }

    // 2. Log cycle start
    await this.recordEvent(merchantId, {
      event_type: 'CYCLE_STARTED',
      severity: 'info',
      summary: `Autonomous Autopilot scan started in ${settings.mode} mode. Channels: ${settings.channels.join(' & ')}.`,
      details: { cycleId, mode: settings.mode, threshold: settings.auto_approve_threshold }
    });

    // 3. Trigger Discovery Scan via RecoveryAgent
    const agent = new RecoveryAgent(merchantId);
    const scanResult = await agent.scanAndAnalyze();

    // 4. Fetch all pending opportunities for merchant
    const oppsRes = await db.query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              ca.total_amount as cart_total, ca.recovery_token
       FROM opportunities o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN carts ca ON o.cart_id = ca.id
       WHERE o.merchant_id = $1 AND o.status = 'pending_approval'
       ORDER BY o.created_at DESC`,
      [merchantId]
    );

    const pendingOpps = oppsRes.rows.map(opp => ({
      ...opp,
      evidence: typeof opp.evidence === 'string' ? JSON.parse(opp.evidence || '{}') : (opp.evidence || {}),
      recommended_action: typeof opp.recommended_action === 'string' ? JSON.parse(opp.recommended_action || '{}') : (opp.recommended_action || {}),
      projected_impact: typeof opp.projected_impact === 'string' ? JSON.parse(opp.projected_impact || '{}') : (opp.projected_impact || {})
    }));

    // Fetch store name
    const merchantRes = await db.query(`SELECT store_name FROM merchants WHERE id = $1 LIMIT 1`, [merchantId]);
    const storeName = merchantRes.rows[0]?.store_name || 'TrendVault India';

    // 5. If in MANUAL_ASSIST mode, do not auto-approve anything
    if (settings.mode === 'MANUAL_ASSIST') {
      await this.recordEvent(merchantId, {
        event_type: 'CYCLE_COMPLETED_MANUAL',
        severity: 'info',
        summary: `Scanned ${pendingOpps.length} checkouts. In MANUAL_ASSIST mode: all opportunities routed to Merchant Approval Queue.`,
        details: { cycleId, totalPending: pendingOpps.length }
      });

      return {
        cycleId,
        status: 'manual_mode',
        mode: settings.mode,
        scanned: pendingOpps.length,
        autoApproved: 0,
        dispatchedWhatsApp: 0,
        dispatchedEmail: 0,
        heldForManualReview: pendingOpps.length,
        blockedByGuardrail: 0,
        recoveredProjectedValue: 0,
        message: 'Opportunities ready for human review in Approval Queue.'
      };
    }

    // 6. SEMI_AUTOPILOT or FULL_AUTOPILOT Evaluation Loop
    let autoApproved = 0;
    let dispatchedWhatsApp = 0;
    let dispatchedEmail = 0;
    let heldForManualReview = 0;
    let blockedByGuardrail = 0;
    let recoveredProjectedValue = 0;

    for (const opp of pendingOpps) {
      const cartValue = Number(opp.cart_total || 0);
      const actionDetails = opp.recommended_action || {};
      const discountPercent = Number(actionDetails.discountPercent || 0);
      const discountAmount = Math.round((cartValue * discountPercent) / 100);
      const confidenceScore = Number(actionDetails.confidenceScore || opp.evidence?.confidenceScore || 0.85);

      // Cart value minimum filter
      if (settings.require_cart_value_min > 0 && cartValue < settings.require_cart_value_min) {
        heldForManualReview++;
        continue;
      }

      // 6a. Policy Guardrail Validation
      const validation = await PolicyService.validateAction({
        merchantId,
        actionType: actionDetails.type || 'send_whatsapp_recovery',
        discountPercent,
        discountAmount,
        customerId: opp.customer_id,
        cartId: opp.cart_id,
        merchantApproved: true
      });

      if (validation.status === 'blocked') {
        blockedByGuardrail++;
        await this.recordEvent(merchantId, {
          event_type: 'GUARDRAIL_BLOCKED',
          severity: 'warning',
          summary: `Guardrail blocked cart #${opp.cart_id?.slice(-8)} (${opp.customer_name}): ${validation.reason}`,
          details: { cartId: opp.cart_id, customerId: opp.customer_id, reason: validation.reason, discountPercent }
        });
        continue;
      }

      // 6b. Autopilot Policy Threshold Checks
      let isEligibleForAutoApproval = false;

      if (settings.mode === 'FULL_AUTOPILOT') {
        // Full Autopilot: Auto-approves all safe actions meeting discount policy
        isEligibleForAutoApproval = discountPercent <= settings.max_auto_discount;
      } else if (settings.mode === 'SEMI_AUTOPILOT') {
        // Semi-Autopilot: Auto-approves high-confidence low-risk recovery within strict thresholds
        const meetsConfidence = confidenceScore >= settings.auto_approve_threshold;
        const meetsDiscountCap = discountPercent <= settings.max_auto_discount;
        isEligibleForAutoApproval = meetsConfidence && meetsDiscountCap;
      }

      if (!isEligibleForAutoApproval) {
        heldForManualReview++;
        await this.recordEvent(merchantId, {
          event_type: 'HELD_FOR_REVIEW',
          severity: 'info',
          summary: `Opportunity for ${opp.customer_name} (₹${cartValue.toLocaleString('en-IN')}) held for merchant review (Confidence: ${Math.round(confidenceScore * 100)}%, Offer: ${discountPercent}%).`,
          details: { cartId: opp.cart_id, confidenceScore, discountPercent, threshold: settings.auto_approve_threshold }
        });
        continue;
      }

      // 6c. Execute Autonomous Approval & Dispatch
      const now = new Date().toISOString();
      await db.query(
        `UPDATE opportunities SET status = 'executed', updated_at = $1 WHERE id = $2`,
        [now, opp.id]
      );

      // Create action record
      const actionId = `act_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
      await db.query(
        `INSERT INTO actions (
          id, merchant_id, customer_id, opportunity_id, action_type,
          channel, status, parameters, executed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          actionId,
          merchantId,
          opp.customer_id,
          opp.id,
          actionDetails.type || 'send_whatsapp_recovery',
          settings.channels.join('+'),
          'completed',
          JSON.stringify({ discountPercent, discountAmount, cartValue, channels: settings.channels }),
          now,
          now,
          now
        ]
      );

      await AuditService.recordEvent({
        merchantId,
        actorType: 'ai_agent',
        actorId: 'razoragent_autopilot',
        eventType: 'autopilot_auto_approved_action',
        entityType: 'opportunity',
        entityId: opp.id,
        inputData: { opportunityId: opp.id, mode: settings.mode, confidenceScore, discountPercent },
        outputData: { approved: true, channels: settings.channels },
        status: 'success'
      });

      const checkoutUrl = `${config.appBaseUrl}/checkout/${opp.recovery_token}`;

      // Multi-channel dispatch 1: WhatsApp
      if (settings.channels.includes('whatsapp') && opp.customer_phone) {
        try {
          const waRes = await WhatsAppService.sendCartRecoveryMessage({
            merchantId,
            customerId: opp.customer_id,
            opportunityId: opp.id,
            phoneNumber: opp.customer_phone,
            customerName: opp.customer_name,
            merchantName: storeName,
            cartValue,
            discountPercent,
            discountAmount,
            recoveryUrl: checkoutUrl
          });

          if (waRes.status === 'sent' || waRes.status === 'delivered') {
            dispatchedWhatsApp++;
          }
        } catch (waErr) {
          console.error('[AutopilotEngine] WhatsApp dispatch error:', waErr.message);
        }
      }

      // Multi-channel dispatch 2: Email
      if (settings.channels.includes('email') && opp.customer_email) {
        try {
          let items = [];
          if (opp.cart_id) {
            const itemsRes = await db.query(
              `SELECT ci.*, p.title FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`,
              [opp.cart_id]
            );
            items = itemsRes.rows;
          }

          const emailRes = await EmailService.sendCartRecoveryEmail({
            merchantId,
            cartId: opp.cart_id,
            customerId: opp.customer_id,
            customerName: opp.customer_name,
            customerEmail: opp.customer_email,
            merchantName: storeName,
            cartValue,
            discountPercent,
            discountAmount,
            recoveryUrl: checkoutUrl,
            items
          });

          if (emailRes.success) {
            dispatchedEmail++;
          }
        } catch (emailErr) {
          console.error('[AutopilotEngine] Email dispatch error:', emailErr.message);
        }
      }

      autoApproved++;
      recoveredProjectedValue += cartValue;

      await this.recordEvent(merchantId, {
        event_type: 'OPPORTUNITY_AUTO_APPROVED',
        severity: 'success',
        summary: `Autonomous recovery dispatched for ${opp.customer_name} (₹${cartValue.toLocaleString('en-IN')}) via ${settings.channels.join(' & ')}.`,
        details: {
          opportunityId: opp.id,
          cartValue,
          discountPercent,
          channels: settings.channels,
          checkoutUrl
        }
      });
    }

    // 7. Cycle Summary Event
    await this.recordEvent(merchantId, {
      event_type: 'CYCLE_COMPLETED',
      severity: autoApproved > 0 ? 'success' : 'info',
      summary: `Cycle complete: ${autoApproved} checkouts auto-recovered (₹${recoveredProjectedValue.toLocaleString('en-IN')}), ${heldForManualReview} held for review, ${blockedByGuardrail} blocked.`,
      details: {
        cycleId,
        mode: settings.mode,
        autoApproved,
        dispatchedWhatsApp,
        dispatchedEmail,
        heldForManualReview,
        blockedByGuardrail,
        recoveredProjectedValue
      }
    });

    return {
      cycleId,
      status: 'completed',
      mode: settings.mode,
      scanned: pendingOpps.length,
      autoApproved,
      dispatchedWhatsApp,
      dispatchedEmail,
      heldForManualReview,
      blockedByGuardrail,
      recoveredProjectedValue,
      channels: settings.channels,
      timestamp: new Date().toISOString()
    };
  }
}
