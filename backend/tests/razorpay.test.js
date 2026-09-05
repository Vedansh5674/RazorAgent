import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { RazorpayService } from '../src/services/razorpayService.js';
import { config } from '../src/config/env.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('RazorpayService Test Mode Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';

  await t.test('creates a test mode order with correct paise calculation', async () => {
    const order = await RazorpayService.createOrder({
      merchantId,
      amount: 1500.00,
      currency: 'INR',
      notes: { recoverySource: 'whatsapp_agent' }
    });

    assert.ok(order.id, 'Internal order ID must be generated');
    assert.ok(order.razorpayOrderId, 'Razorpay order ID must be created');
    assert.strictEqual(order.amount, 150000); // 1500 * 100 paise
    assert.strictEqual(order.currency, 'INR');
  });

  await t.test('verifies genuine HMAC-SHA256 payment signature', () => {
    const orderId = 'order_test_987654321';
    const paymentId = 'pay_test_123456789';
    const body = `${orderId}|${paymentId}`;
    const validSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(body)
      .digest('hex');

    const isValid = RazorpayService.verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature
    });

    assert.strictEqual(isValid, true);
  });

  await t.test('rejects tampered payment signature', () => {
    const isValid = RazorpayService.verifyPaymentSignature({
      razorpayOrderId: 'order_test_987654321',
      razorpayPaymentId: 'pay_test_123456789',
      razorpaySignature: 'tampered_invalid_signature_hex_code'
    });

    assert.strictEqual(isValid, false);
  });

  await t.test('processes payment success, updates order status, and logs revenue', async () => {
    // Create an order first
    const created = await RazorpayService.createOrder({
      merchantId,
      cartId: 'cart_abandoned_01',
      amount: 3868.00,
      currency: 'INR'
    });

    const paymentResult = await RazorpayService.processPaymentSuccess({
      merchantId,
      razorpayOrderId: created.razorpayOrderId,
      razorpayPaymentId: 'pay_test_success_99',
      razorpaySignature: 'sig_demo_hash_verified',
      method: 'upi'
    });

    assert.strictEqual(paymentResult.status, 'success');
    assert.strictEqual(Number(paymentResult.finalAmount), 3868.00);

    // Verify order in database is now 'paid'
    const checkOrder = await db.query(`SELECT status FROM orders WHERE id = $1`, [created.id]);
    assert.strictEqual(checkOrder.rows[0].status, 'paid');

    // Verify cart status updated to 'recovered'
    const checkCart = await db.query(`SELECT status FROM carts WHERE id = 'cart_abandoned_01'`);
    assert.strictEqual(checkCart.rows[0].status, 'recovered');
  });
});
