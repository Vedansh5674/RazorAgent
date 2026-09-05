import { EmailService } from '../services/emailService.js';
import { db } from '../config/database.js';

export class EmailController {
  /**
   * GET /api/email/communications
   * List communications for the authenticated merchant
   */
  static async getCommunications(req, res, next) {
    try {
      const merchantId = req.user?.merchant_id || req.query.merchantId || 'merchant_trendvault_01';
      const { direction, templateType, customerId, search, limit = 50, offset = 0 } = req.query;

      const result = await EmailService.getCommunications({
        merchantId,
        direction,
        templateType,
        customerId,
        search,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/email/stats
   * Aggregated communications metrics
   */
  static async getStats(req, res, next) {
    try {
      const merchantId = req.user?.merchant_id || req.query.merchantId || 'merchant_trendvault_01';
      const stats = await EmailService.getStats(merchantId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/email/send
   * Merchant sends a custom or templated email to a customer
   */
  static async sendEmail(req, res, next) {
    try {
      const merchantId = req.user?.merchant_id || req.body.merchantId || 'merchant_trendvault_01';
      const { recipientEmail, recipientName, customerId, subject, bodyText, bodyHtml, templateType = 'custom', metadata } = req.body;

      if (!recipientEmail || !subject || (!bodyText && !bodyHtml)) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'recipientEmail, subject, and body text/html are required.'
        });
      }

      const result = await EmailService.sendEmail({
        merchantId,
        customerId,
        direction: 'outbound',
        recipientEmail,
        recipientName: recipientName || recipientEmail,
        subject,
        bodyText,
        bodyHtml,
        templateType,
        metadata: metadata || {}
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/email/inquiry (Public for Shoppers on Checkout)
   * Client submits an inquiry to Store Owner
   */
  static async submitInquiry(req, res, next) {
    try {
      const {
        merchantId = 'merchant_trendvault_01',
        customerName,
        customerEmail,
        customerPhone,
        message,
        cartToken,
        cartValue
      } = req.body;

      if (!customerEmail || !message) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'customerEmail and message are required.'
        });
      }

      const result = await EmailService.submitCustomerInquiry({
        merchantId,
        customerName,
        customerEmail,
        customerPhone,
        message,
        cartToken,
        cartValue
      });

      res.status(201).json({
        success: true,
        message: 'Inquiry received by store owner. A confirmation and response will be sent to your email.',
        inquiry: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/email/reply
   * Store Owner replies directly to a client inquiry
   */
  static async replyToClient(req, res, next) {
    try {
      const merchantId = req.user?.merchant_id || req.body.merchantId || 'merchant_trendvault_01';
      const { emailId, replyMessage, customerEmail, customerName, originalSubject } = req.body;

      if (!replyMessage || !customerEmail) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'replyMessage and customerEmail are required.'
        });
      }

      const result = await EmailService.sendMerchantReply({
        merchantId,
        emailId,
        replyMessage,
        customerEmail,
        customerName,
        originalSubject
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/email/recovery/:cartId
   * Send Cart Recovery Email for a specific cart
   */
  static async sendCartRecovery(req, res, next) {
    try {
      const merchantId = req.user?.merchant_id || req.body.merchantId || 'merchant_trendvault_01';
      const { cartId } = req.params;
      const { discountPercent = 10 } = req.body;

      // Find cart
      const cartRes = await db.query(
        'SELECT * FROM carts WHERE id = $1 AND merchant_id = $2 LIMIT 1',
        [cartId, merchantId]
      );
      if (cartRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Cart not found' });
      }
      const cart = cartRes.rows[0];

      // Find customer
      const custRes = await db.query(
        'SELECT * FROM customers WHERE id = $1 LIMIT 1',
        [cart.customer_id]
      );
      const customer = custRes.rows[0] || { name: 'Valued Shopper', email: 'shopper@example.com' };

      // Find items
      const itemsRes = await db.query(
        'SELECT ci.*, p.title FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1',
        [cart.id]
      );

      const cartValue = Number(cart.total_amount);
      const discountAmount = Math.round((cartValue * discountPercent) / 100);

      const result = await EmailService.sendCartRecoveryEmail({
        merchantId,
        cartId: cart.id,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        cartValue,
        discountPercent,
        discountAmount,
        recoveryUrl: `http://localhost:5173/checkout/${cart.recovery_token || cart.id}`,
        items: itemsRes.rows || []
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/email/preview/:id
   * Get raw HTML preview for an email
   */
  static async getPreview(req, res, next) {
    try {
      const { id } = req.params;
      const emailRes = await db.query('SELECT * FROM emails WHERE id = $1 LIMIT 1', [id]);
      if (emailRes.rows.length === 0) {
        return res.status(404).send('<p>Email not found</p>');
      }
      res.setHeader('Content-Type', 'text/html');
      res.send(emailRes.rows[0].body_html || '<p>No HTML body available</p>');
    } catch (err) {
      next(err);
    }
  }
}
