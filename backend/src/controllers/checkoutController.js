import { RazorpayService } from '../services/razorpayService.js';
import { db } from '../config/database.js';
import crypto from 'crypto';
import { config } from '../config/env.js';

export class CheckoutController {
  /**
   * Public Cart Recovery lookup by unique recovery token
   */
  static async getCartByToken(req, res, next) {
    try {
      let { token } = req.params;

      // Handle friendly demo aliases
      if (token === 'demo_token_aarav' || token === 'demo_aarav' || token === 'aarav') {
        token = 'recov_tok_aarav_4298';
      } else if (token === 'demo_token_priya' || token === 'demo_priya' || token === 'priya') {
        token = 'recov_tok_priya_3298';
      }

      let cartRes = await db.query(
        `SELECT c.*, m.store_name, m.currency as merchant_currency, cust.name as customer_name, cust.email as customer_email, cust.phone as customer_phone
         FROM carts c
         LEFT JOIN merchants m ON c.merchant_id = m.id
         LEFT JOIN customers cust ON c.customer_id = cust.id
         WHERE (c.recovery_token = $1 OR c.id = $1) LIMIT 1`,
        [token]
      );

      // Graceful fallback for demo tokens: if token includes 'aarav', find Aarav's cart
      if (cartRes.rows.length === 0 && token && token.toLowerCase().includes('aarav')) {
        cartRes = await db.query(
          `SELECT c.*, m.store_name, m.currency as merchant_currency, cust.name as customer_name, cust.email as customer_email, cust.phone as customer_phone
           FROM carts c
           LEFT JOIN merchants m ON c.merchant_id = m.id
           LEFT JOIN customers cust ON c.customer_id = cust.id
           WHERE cust.name ILIKE '%Aarav%' AND c.status = 'abandoned' LIMIT 1`
        );
      }

      if (cartRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Cart recovery link is invalid or has expired.' });
      }

      const cart = cartRes.rows[0];

      // Retrieve items
      const itemsRes = await db.query(
        `SELECT ci.*, p.title, p.image_url, p.description 
         FROM cart_items ci
         LEFT JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = $1`,
        [cart.id]
      );

      // Check if there is an active recovery opportunity offer with discount
      const oppRes = await db.query(
        `SELECT * FROM opportunities WHERE cart_id = $1 AND status IN ('pending', 'approved', 'executed', 'converted') LIMIT 1`,
        [cart.id]
      );

      let discountPercent = 0;
      let discountAmount = 0;
      if (oppRes.rows.length > 0) {
        const action = typeof oppRes.rows[0].recommended_action === 'string'
          ? JSON.parse(oppRes.rows[0].recommended_action)
          : oppRes.rows[0].recommended_action;
        discountPercent = Number(action?.discountPercent || 10);
        discountAmount = Math.round((Number(cart.total_amount) * discountPercent) / 100);
      }

      const finalAmount = Math.max(1, Number(cart.total_amount) - discountAmount);

      res.json({
        cartId: cart.id,
        merchantId: cart.merchant_id,
        merchantName: cart.store_name,
        currency: cart.currency || 'INR',
        customerName: cart.customer_name,
        customerEmail: cart.customer_email,
        customerPhone: cart.customer_phone,
        status: cart.status,
        originalTotal: Number(cart.total_amount),
        discountPercent,
        discountAmount,
        finalTotal: finalAmount,
        items: itemsRes.rows,
        razorpayKeyId: RazorpayService.getPublicKey()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Generates Razorpay Test Mode Order
   */
  static async createOrder(req, res, next) {
    try {
      const { cartId, merchantId, amount, currency = 'INR', customerId, notes } = req.body;

      if (!amount || (!cartId && !merchantId)) {
        return res.status(400).json({ error: 'ValidationError', message: 'Amount and merchant/cart ID are required.' });
      }

      let mId = merchantId;
      if (!mId && cartId) {
        const cRes = await db.query(`SELECT merchant_id FROM carts WHERE id = $1 LIMIT 1`, [cartId]);
        mId = cRes.rows[0]?.merchant_id;
      }

      const orderData = await RazorpayService.createOrder({
        merchantId: mId,
        cartId,
        customerId,
        amount,
        currency,
        notes: notes || {}
      });

      res.json(orderData);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verifies Razorpay Payment Signature
   */
  static async verifyPayment(req, res, next) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, merchantId, method = 'upi' } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Razorpay Order ID, Payment ID, and Signature are required.'
        });
      }

      let mId = merchantId;
      if (!mId) {
        const ordRes = await db.query(`SELECT merchant_id FROM orders WHERE razorpay_order_id = $1 LIMIT 1`, [razorpayOrderId]);
        mId = ordRes.rows[0]?.merchant_id;
      }

      const result = await RazorpayService.processPaymentSuccess({
        merchantId: mId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        method
      });

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: 'PaymentVerificationFailed', message: err.message });
    }
  }

  /**
   * Payment Lookup
   */
  static async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      const payRes = await db.query(
        `SELECT * FROM payments WHERE id = $1 OR razorpay_payment_id = $1 LIMIT 1`,
        [id]
      );
      if (payRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Payment record not found.' });
      }
      res.json(payRes.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Razorpay Webhook Handler
   */
  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const body = req.body;

      // In production verify HMAC signature with config.razorpayWebhookSecret
      const event = body.event;
      console.log(`[Razorpay Webhook] Received event: ${event}`);

      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = body.payload?.payment?.entity;
        const orderEntity = body.payload?.order?.entity;

        if (paymentEntity) {
          const rzpOrderId = paymentEntity.order_id || orderEntity?.id;
          const rzpPaymentId = paymentEntity.id;
          const ordRes = await db.query(`SELECT merchant_id FROM orders WHERE razorpay_order_id = $1 LIMIT 1`, [rzpOrderId]);
          if (ordRes.rows.length > 0) {
            await RazorpayService.processPaymentSuccess({
              merchantId: ordRes.rows[0].merchant_id,
              razorpayOrderId: rzpOrderId,
              razorpayPaymentId: rzpPaymentId,
              razorpaySignature: 'sig_demo_hash_verified',
              method: paymentEntity.method || 'upi'
            });
          }
        }
      } else if (event === 'payment.failed') {
        const paymentEntity = body.payload?.payment?.entity;
        if (paymentEntity) {
          const rzpOrderId = paymentEntity.order_id;
          const ordRes = await db.query(`SELECT merchant_id FROM orders WHERE razorpay_order_id = $1 LIMIT 1`, [rzpOrderId]);
          if (ordRes.rows.length > 0) {
            await RazorpayService.processPaymentFailure({
              merchantId: ordRes.rows[0].merchant_id,
              razorpayOrderId: rzpOrderId,
              errorCode: paymentEntity.error_code,
              errorDescription: paymentEntity.error_description
            });
          }
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (err) {
      next(err);
    }
  }
}
