import test from 'node:test';
import assert from 'node:assert';
import { ChatService } from '../src/services/chatService.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('AI Chatbot & Support Issue Resolution Suite', async (t) => {
  await db.initialize();
  await seedDatabase();

  await t.test('resolves customer payment failure and UPI debit troubleshooting', async () => {
    const res = await ChatService.processMessage({
      message: 'My payment failed and UPI money was deducted from my bank',
      context: 'customer'
    });

    assert.strictEqual(res.role, 'assistant');
    assert.strictEqual(res.category, 'PAYMENT_TROUBLESHOOTING');
    assert.ok(res.content.includes('auto-refund'));
    assert.ok(res.content.includes('Razorpay'));
    assert.ok(res.actionSuggestions.length > 0);
  });

  await t.test('explains supported payment methods including UPI and Test Cards', async () => {
    const res = await ChatService.processMessage({
      message: 'Can I pay with Google Pay or PhonePe?',
      context: 'customer'
    });

    assert.strictEqual(res.role, 'assistant');
    assert.strictEqual(res.category, 'PAYMENT_METHODS');
    assert.ok(res.content.includes('UPI'));
    assert.ok(res.content.includes('Google Pay'));
  });

  await t.test('personalizes response with cart details when cartToken is provided', async () => {
    // Get seeded cart with recovery token
    const cartRes = await db.query(`SELECT recovery_token FROM carts WHERE customer_id = 'cust_01' LIMIT 1`);
    const token = cartRes.rows[0]?.recovery_token;

    const res = await ChatService.processMessage({
      message: 'Is my discount applied to this order?',
      context: 'customer',
      cartToken: token
    });

    assert.strictEqual(res.role, 'assistant');
    assert.strictEqual(res.category, 'DISCOUNT_INFO');
    assert.ok(res.content.includes('Aarav') || res.content.includes('discount'));
    assert.ok(res.content.includes('₹'));
  });

  await t.test('resolves shipping, delivery timelines and return/refund questions', async () => {
    const shippingRes = await ChatService.processMessage({
      message: 'When will my package be delivered?',
      context: 'customer'
    });
    assert.strictEqual(shippingRes.category, 'SHIPPING_DELIVERY');
    assert.ok(shippingRes.content.includes('business days'));

    const refundRes = await ChatService.processMessage({
      message: 'What is your cancellation and return policy?',
      context: 'customer'
    });
    assert.strictEqual(refundRes.category, 'REFUND_POLICY');
    assert.ok(refundRes.content.includes('7-Day'));
  });

  await t.test('diagnoses merchant policy blocks and guardrail violations', async () => {
    const res = await ChatService.processMessage({
      message: 'Why was my recovery action blocked by policy guardrails?',
      context: 'merchant'
    });

    assert.strictEqual(res.role, 'assistant');
    assert.strictEqual(res.category, 'MERCHANT_POLICY');
    assert.ok(res.content.includes('Allowed Action'));
    assert.ok(res.content.includes('Max Discount'));
    assert.ok(res.content.includes('WhatsApp Opt-in'));
  });

  await t.test('guides merchant on Razorpay test mode and webhook signature verification', async () => {
    const res = await ChatService.processMessage({
      message: 'How do I set up Razorpay webhooks and verify HMAC-SHA256 signatures?',
      context: 'merchant'
    });

    assert.strictEqual(res.role, 'assistant');
    assert.strictEqual(res.category, 'RAZORPAY_SETUP');
    assert.ok(res.content.includes('HMAC-SHA256'));
    assert.ok(res.content.includes('webhook'));
  });

  await t.test('returns context-specific FAQs for customer and merchant', () => {
    const customerFaqs = ChatService.getFaqs('customer');
    assert.ok(customerFaqs.length >= 4);
    assert.ok(customerFaqs.some(f => f.q.includes('UPI')));

    const merchantFaqs = ChatService.getFaqs('merchant');
    assert.ok(merchantFaqs.length >= 4);
    assert.ok(merchantFaqs.some(f => f.q.includes('policy')));
  });
});
