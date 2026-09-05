import { RecoveryAgent } from '../agent/recoveryAgent.js';
import { TaskAgent } from '../agent/taskAgent.js';
import { db } from '../config/database.js';
import { PolicyService } from '../services/policyService.js';
import { AuditService } from '../services/auditService.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { AutopilotEngine } from '../services/autopilotEngine.js';
import { RevenueAgent } from '../services/revenueAgent.js';
import { config } from '../config/env.js';

export class AutopilotController {
  static async scan(req, res, next) {
    try {
      const agent = new RecoveryAgent(req.merchantId);
      const result = await agent.scanAndAnalyze();
      res.json({
        message: `AI scan completed: ${result.opportunitiesCreated} recovery opportunities discovered.`,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOpportunities(req, res, next) {
    try {
      const result = await db.query(
        `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
                ca.total_amount as cart_total, ca.recovery_token
         FROM opportunities o
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN carts ca ON o.cart_id = ca.id
         WHERE o.merchant_id = $1
         ORDER BY o.created_at DESC`,
        [req.merchantId]
      );

      const parsed = result.rows.map(opp => ({
        ...opp,
        evidence: typeof opp.evidence === 'string' ? JSON.parse(opp.evidence) : opp.evidence,
        recommended_action: typeof opp.recommended_action === 'string' ? JSON.parse(opp.recommended_action) : opp.recommended_action,
        projected_impact: typeof opp.projected_impact === 'string' ? JSON.parse(opp.projected_impact) : opp.projected_impact
      }));

      res.json(parsed);
    } catch (err) {
      next(err);
    }
  }

  static async getOpportunityById(req, res, next) {
    try {
      const { id } = req.params;
      const oppRes = await db.query(
        `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
                ca.total_amount as cart_total, ca.recovery_token
         FROM opportunities o
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN carts ca ON o.cart_id = ca.id
         WHERE o.id = $1 AND o.merchant_id = $2 LIMIT 1`,
        [id, req.merchantId]
      );

      if (oppRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Opportunity not found' });
      }

      const opp = oppRes.rows[0];
      opp.evidence = typeof opp.evidence === 'string' ? JSON.parse(opp.evidence) : opp.evidence;
      opp.recommended_action = typeof opp.recommended_action === 'string' ? JSON.parse(opp.recommended_action) : opp.recommended_action;
      opp.projected_impact = typeof opp.projected_impact === 'string' ? JSON.parse(opp.projected_impact) : opp.projected_impact;

      // Get recommendation details
      const recRes = await db.query(`SELECT * FROM recommendations WHERE opportunity_id = $1 LIMIT 1`, [id]);
      if (recRes.rows.length > 0) {
        const rec = recRes.rows[0];
        rec.explanation = typeof rec.explanation === 'string' ? JSON.parse(rec.explanation) : rec.explanation;
        opp.recommendation = rec;
      }

      // Get cart items
      if (opp.cart_id) {
        const itemsRes = await db.query(
          `SELECT ci.*, p.title, p.image_url 
           FROM cart_items ci
           LEFT JOIN products p ON ci.product_id = p.id
           WHERE ci.cart_id = $1`,
          [opp.cart_id]
        );
        opp.cart_items = itemsRes.rows;
      }

      res.json(opp);
    } catch (err) {
      next(err);
    }
  }

  static async approveOpportunity(req, res, next) {
    try {
      const { id } = req.params;
      const now = new Date().toISOString();

      const oppRes = await db.query(
        `SELECT o.*, c.name as customer_name, c.phone as customer_phone, ca.total_amount, ca.recovery_token
         FROM opportunities o
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN carts ca ON o.cart_id = ca.id
         WHERE o.id = $1 AND o.merchant_id = $2 LIMIT 1`,
        [id, req.merchantId]
      );

      if (oppRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Opportunity not found' });
      }

      const opp = oppRes.rows[0];
      const actionDetails = typeof opp.recommended_action === 'string' ? JSON.parse(opp.recommended_action) : opp.recommended_action;
      const cartValue = Number(opp.total_amount || 0);
      const discountPercent = Number(actionDetails.discountPercent || 0);
      const discountAmount = Math.round((cartValue * discountPercent) / 100);

      // 1. Strict Policy Validation
      const validation = await PolicyService.validateAction({
        merchantId: req.merchantId,
        actionType: actionDetails.type || 'send_whatsapp_recovery',
        discountPercent,
        discountAmount,
        customerId: opp.customer_id,
        cartId: opp.cart_id,
        merchantApproved: true
      });

      if (validation.status === 'blocked') {
        return res.status(422).json({
          status: 'blocked',
          reason: validation.reason,
          allowedMaximum: validation.allowedMaximum,
          policyNotice: 'Action blocked by merchant guardrail policies.'
        });
      }

      // 2. Mark Opportunity Approved
      await db.query(
        `UPDATE opportunities SET status = 'approved', updated_at = $1 WHERE id = $2`,
        [now, id]
      );

      await AuditService.recordEvent({
        merchantId: req.merchantId,
        actorType: 'merchant',
        actorId: req.user.id,
        eventType: 'merchant_approved_action',
        entityType: 'opportunity',
        entityId: id,
        inputData: { opportunityId: id, discountPercent },
        outputData: { approved: true },
        status: 'success'
      });

      // 3. Execute approved WhatsApp recovery action
      const merchantRes = await db.query(`SELECT store_name FROM merchants WHERE id = $1 LIMIT 1`, [req.merchantId]);
      const storeName = merchantRes.rows[0]?.store_name || 'TrendVault India';
      const checkoutUrl = `${config.appBaseUrl}/checkout/${opp.recovery_token}`;

      const waResult = await WhatsAppService.sendCartRecoveryMessage({
        merchantId: req.merchantId,
        customerId: opp.customer_id,
        opportunityId: id,
        phoneNumber: opp.customer_phone,
        customerName: opp.customer_name,
        merchantName: storeName,
        cartValue,
        discountPercent,
        discountAmount,
        recoveryUrl: checkoutUrl
      });

      if (waResult.status === 'failed') {
        await db.query(
          `UPDATE opportunities SET status = 'failed', updated_at = $1 WHERE id = $2`,
          [now, id]
        );
        return res.status(502).json({
          status: 'failed',
          message: waResult.message,
          retryable: waResult.retryable,
          fallback: waResult.fallback
        });
      }

      await db.query(
        `UPDATE opportunities SET status = 'executed', updated_at = $1 WHERE id = $2`,
        [now, id]
      );

      res.json({
        message: 'Opportunity approved and WhatsApp recovery message dispatched successfully.',
        opportunityId: id,
        status: 'executed',
        whatsapp: waResult
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectOpportunity(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const now = new Date().toISOString();

      const result = await db.query(
        `UPDATE opportunities SET status = 'rejected', updated_at = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
        [now, id, req.merchantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Opportunity not found' });
      }

      await AuditService.recordEvent({
        merchantId: req.merchantId,
        actorType: 'merchant',
        actorId: req.user.id,
        eventType: 'merchant_rejected_action',
        entityType: 'opportunity',
        entityId: id,
        inputData: { reason: reason || 'Merchant dismissed' },
        outputData: { status: 'rejected' },
        status: 'success'
      });

      res.json({ message: 'Opportunity rejected successfully.', opportunityId: id, status: 'rejected' });
    } catch (err) {
      next(err);
    }
  }

  static async getActions(req, res, next) {
    try {
      const result = await db.query(
        `SELECT a.*, o.title as opportunity_title, o.risk_level, o.cart_id, o.customer_id
         FROM actions a
         LEFT JOIN opportunities o ON a.opportunity_id = o.id
         WHERE a.merchant_id = $1
         ORDER BY a.created_at DESC`,
        [req.merchantId]
      );

      const parsed = result.rows.map(a => ({
        ...a,
        payload: typeof a.payload === 'string' ? JSON.parse(a.payload) : a.payload
      }));

      res.json(parsed);
    } catch (err) {
      next(err);
    }
  }

  static async executeAction(req, res, next) {
    try {
      const { id } = req.params;
      const { simulateFailure = false } = req.body;

      const actRes = await db.query(
        `SELECT a.*, o.customer_id, o.cart_id, c.name as customer_name, c.phone as customer_phone, ca.total_amount, ca.recovery_token
         FROM actions a
         LEFT JOIN opportunities o ON a.opportunity_id = o.id
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN carts ca ON o.cart_id = ca.id
         WHERE a.id = $1 AND a.merchant_id = $2 LIMIT 1`,
        [id, req.merchantId]
      );

      if (actRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Action not found' });
      }

      const action = actRes.rows[0];
      const payload = typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload;
      const discountPercent = payload.recommendedAction?.discountPercent || 10;
      const cartValue = Number(action.total_amount || 2000);
      const discountAmount = Math.round((cartValue * discountPercent) / 100);

      // Validate policy
      const validation = await PolicyService.validateAction({
        merchantId: req.merchantId,
        actionType: action.type,
        discountPercent,
        discountAmount,
        customerId: action.customer_id,
        cartId: action.cart_id,
        merchantApproved: true
      });

      if (validation.status === 'blocked') {
        await db.query(
          `UPDATE actions SET status = 'blocked', error_message = $1, updated_at = $2 WHERE id = $3`,
          [validation.reason, new Date().toISOString(), id]
        );
        return res.status(422).json(validation);
      }

      const merchantRes = await db.query(`SELECT store_name FROM merchants WHERE id = $1 LIMIT 1`, [req.merchantId]);
      const storeName = merchantRes.rows[0]?.store_name || 'TrendVault India';
      const checkoutUrl = `${config.appBaseUrl}/checkout/${action.recovery_token}`;

      const waResult = await WhatsAppService.sendCartRecoveryMessage({
        merchantId: req.merchantId,
        customerId: action.customer_id,
        opportunityId: action.opportunity_id,
        phoneNumber: action.customer_phone,
        customerName: action.customer_name,
        merchantName: storeName,
        cartValue,
        discountPercent,
        discountAmount,
        recoveryUrl: checkoutUrl,
        simulateFailure
      });

      const now = new Date().toISOString();
      if (waResult.status === 'failed') {
        await db.query(
          `UPDATE actions SET status = 'failed', error_message = $1, retryable = true, updated_at = $2 WHERE id = $3`,
          [waResult.message, now, id]
        );
        return res.status(502).json(waResult);
      }

      await db.query(
        `UPDATE actions SET status = 'completed', executed_at = $1, updated_at = $1 WHERE id = $2`,
        [now, id]
      );

      res.json({ message: 'Action executed successfully', whatsapp: waResult });
    } catch (err) {
      next(err);
    }
  }

  static async approveAction(req, res, next) {
    try {
      const { id } = req.params;
      const now = new Date().toISOString();
      const result = await db.query(
        `UPDATE actions SET status = 'approved', updated_at = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
        [now, id, req.merchantId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Action not found' });
      }
      res.json({ message: 'Action approved successfully', action: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  static async rejectAction(req, res, next) {
    try {
      const { id } = req.params;
      const now = new Date().toISOString();
      const result = await db.query(
        `UPDATE actions SET status = 'rejected', updated_at = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
        [now, id, req.merchantId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Action not found' });
      }
      res.json({ message: 'Action rejected', action: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  static async createAction(req, res, next) {
    try {
      const { type, title, reason, priority = 'Medium', estimatedImpact = 0, targetCustomers = 0, channel = 'WhatsApp', payload = {} } = req.body;
      const id = `act_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
      const now = new Date().toISOString();

      const fullPayload = {
        ...payload,
        title,
        reason,
        priority,
        estimatedImpact,
        targetCustomers,
        channel
      };

      const result = await db.query(
        `INSERT INTO actions (id, merchant_id, type, status, payload, executed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, req.merchantId, type || 'custom_campaign', 'suggested', JSON.stringify(fullPayload), null, now, now]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  static async getRevenueAnalysis(req, res, next) {
    try {
      const q = req.query.q || req.body?.prompt || req.body?.question || 'How can I increase my revenue this week?';
      const agent = new RevenueAgent(req.merchantId);
      const analysis = await agent.answerMerchantQuery(q);
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  }

  static async promoteOpportunity(req, res, next) {
    try {
      const oppId = req.body.opportunityId || req.body.opportunity?.id || req.body.id;
      const settings = req.body.settings || req.body.customSettings || {};
      const agent = new RevenueAgent(req.merchantId);
      const result = await agent.promoteOpportunityToAction(oppId, settings);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async executeTask(req, res, next) {
    try {
      const { task, parameters = {} } = req.body;
      if (!task || typeof task !== 'string' || task.trim().length === 0) {
        return res.status(400).json({ error: 'BadRequest', message: 'Task requirement string is required' });
      }

      const taskAgent = new TaskAgent(req.merchantId, req.user);
      const result = await taskAgent.executeTask({ task, parameters });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getTaskHistory(req, res, next) {
    try {
      const result = await db.query(
        `SELECT id, actor_type, actor_id, event_type, entity_type, entity_id, input_data, output_data, status, created_at
         FROM audit_logs
         WHERE merchant_id = $1 AND event_type = 'agent_task_executed'
         ORDER BY created_at DESC
         LIMIT 20`,
        [req.merchantId]
      );

      const tasks = result.rows.map(r => {
        const inputData = typeof r.input_data === 'string' ? JSON.parse(r.input_data) : (r.input_data || {});
        const outputData = typeof r.output_data === 'string' ? JSON.parse(r.output_data) : (r.output_data || {});
        return {
          id: r.id,
          status: r.status,
          createdAt: r.created_at,
          task: inputData.task || 'Autonomous Task',
          intent: outputData.intent || r.entity_type,
          summary: outputData.summary || 'Task executed successfully.'
        };
      });

      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }

  static async getSettings(req, res, next) {
    try {
      const settings = await AutopilotEngine.getSettings(req.merchantId);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const updated = await AutopilotEngine.updateSettings(req.merchantId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async triggerCycle(req, res, next) {
    try {
      const result = await AutopilotEngine.runAutopilotCycle(req.merchantId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getActivityStream(req, res, next) {
    try {
      const limit = Number(req.query.limit) || 50;
      const events = await AutopilotEngine.getActivityStream(req.merchantId, limit);
      res.json(events);
    } catch (err) {
      next(err);
    }
  }
}
