import { WhatsAppService } from '../services/whatsappService.js';
import { WhatsAppSalesAgent } from '../services/whatsappSalesAgent.js';
import { db } from '../config/database.js';
import { AuditService } from '../services/auditService.js';

export class WhatsAppController {
  static async sendMessage(req, res, next) {
    try {
      const { customerId, opportunityId, phoneNumber, customerName, cartValue, discountPercent, recoveryUrl, simulateFailure } = req.body;
      const merchantRes = await db.query(`SELECT store_name FROM merchants WHERE id = $1 LIMIT 1`, [req.merchantId]);
      const merchantName = merchantRes.rows[0]?.store_name || 'TrendVault India';

      const result = await WhatsAppService.sendCartRecoveryMessage({
        merchantId: req.merchantId,
        customerId,
        opportunityId,
        phoneNumber,
        customerName,
        merchantName,
        cartValue: Number(cartValue || 0),
        discountPercent: Number(discountPercent || 10),
        discountAmount: Math.round((Number(cartValue || 0) * Number(discountPercent || 10)) / 100),
        recoveryUrl,
        simulateFailure
      });

      if (result.status === 'failed') {
        return res.status(502).json(result);
      }
      if (result.status === 'blocked') {
        return res.status(422).json(result);
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getMessages(req, res, next) {
    try {
      const result = await db.query(
        `SELECT m.*, c.name as customer_name, c.email as customer_email 
         FROM whatsapp_messages m
         LEFT JOIN customers c ON m.customer_id = c.id
         WHERE m.merchant_id = $1 
         ORDER BY m.created_at DESC`,
        [req.merchantId]
      );

      const parsed = result.rows.map(m => ({
        ...m,
        parameters: typeof m.parameters === 'string' ? JSON.parse(m.parameters) : m.parameters
      }));

      // Calculate funnel metrics
      const total = parsed.length;
      const pending = parsed.filter(m => m.status === 'pending').length;
      const delivered = parsed.filter(m => ['delivered', 'read'].includes(m.status)).length;
      const read = parsed.filter(m => m.status === 'read').length;
      const failed = parsed.filter(m => m.status === 'failed').length;

      res.json({
        totalMessages: total,
        pendingMessages: pending,
        deliveredMessages: delivered,
        readMessages: read,
        failedMessages: failed,
        messages: parsed
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMessageById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT m.*, c.name as customer_name, c.email as customer_email 
         FROM whatsapp_messages m
         LEFT JOIN customers c ON m.customer_id = c.id
         WHERE m.id = $1 AND m.merchant_id = $2 LIMIT 1`,
        [id, req.merchantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Message not found' });
      }

      const msg = result.rows[0];
      msg.parameters = typeof msg.parameters === 'string' ? JSON.parse(msg.parameters) : msg.parameters;
      res.json(msg);
    } catch (err) {
      next(err);
    }
  }

  // Meta Webhook Verification Handshake
  static verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifiedChallenge = WhatsAppService.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      return res.status(200).send(verifiedChallenge);
    }
    return res.status(403).send('Forbidden');
  }

  // Meta Webhook Event Receiver
  static async handleWebhook(req, res, next) {
    try {
      const body = req.body;
      
      // Standard Meta Cloud API webhook format
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const statusObj = value?.statuses?.[0];

        if (statusObj) {
          const providerMsgId = statusObj.id;
          const status = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
          const failureReason = statusObj.errors?.[0]?.message;

          await WhatsAppService.handleStatusWebhook({
            messageId: providerMsgId,
            status,
            failureReason
          });
        }
      }

      // Also support direct test webhook calls
      if (body.messageId && body.status) {
        await WhatsAppService.handleStatusWebhook({
          messageId: body.messageId,
          status: body.status,
          failureReason: body.failureReason
        });
      }

      res.status(200).json({ status: 'received' });
    } catch (err) {
      next(err);
    }
  }

  static async optIn(req, res, next) {
    try {
      const { customerId, phoneNumber } = req.body;
      const now = new Date().toISOString();

      await db.query(
        `UPDATE customer_consents 
         SET opted_in = TRUE, opt_in_at = $1, opt_out_at = NULL, updated_at = $1 
         WHERE (customer_id = $2 OR phone_number = $3) AND merchant_id = $4`,
        [now, customerId, phoneNumber, req.merchantId]
      );

      await AuditService.recordEvent({
        merchantId: req.merchantId,
        actorType: 'customer',
        actorId: customerId || 'guest',
        eventType: 'whatsapp_opted_in',
        entityType: 'customer_consent',
        entityId: customerId,
        inputData: { phoneNumber },
        outputData: { optedIn: true },
        status: 'success'
      });

      res.json({ message: 'WhatsApp consent enabled successfully.', optedIn: true });
    } catch (err) {
      next(err);
    }
  }

  static async optOut(req, res, next) {
    try {
      const { customerId, phoneNumber } = req.body;
      const now = new Date().toISOString();

      await db.query(
        `UPDATE customer_consents 
         SET opted_in = FALSE, opt_out_at = $1, updated_at = $1 
         WHERE (customer_id = $2 OR phone_number = $3) AND merchant_id = $4`,
        [now, customerId, phoneNumber, req.merchantId]
      );

      await AuditService.recordEvent({
        merchantId: req.merchantId,
        actorType: 'customer',
        actorId: customerId || 'guest',
        eventType: 'whatsapp_opted_out',
        entityType: 'customer_consent',
        entityId: customerId,
        inputData: { phoneNumber },
        outputData: { optedIn: false },
        status: 'success'
      });

      res.json({ message: 'WhatsApp consent revoked successfully.', optedIn: false });
    } catch (err) {
      next(err);
    }
  }

  static async handleSalesMessage(req, res, next) {
    try {
      const { message, customerId, cartId, history } = req.body;
      const merchantId = req.merchantId || 'merchant_trendvault_01';
      const response = await WhatsAppSalesAgent.processCustomerMessage({
        merchantId,
        customerId: customerId || 'cust_01',
        message,
        cartId,
        history
      });
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}
