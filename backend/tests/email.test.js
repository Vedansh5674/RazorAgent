import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import { seedDatabase } from '../src/db/seed.js';
import { db } from '../src/config/database.js';
import { EmailService } from '../src/services/emailService.js';
import { RazorpayService } from '../src/services/razorpayService.js';
import { TaskAgent } from '../src/agent/taskAgent.js';

describe('Email Communications & Transactional Messages Suite', () => {
  const merchantId = 'merchant_trendvault_01';

  before(async () => {
    await seedDatabase();
  });

  test('sends a custom outbound email and records audit log', async () => {
    const result = await EmailService.sendEmail({
      merchantId,
      customerId: 'cust_01',
      direction: 'outbound',
      recipientEmail: 'aarav.sharma@example.com',
      recipientName: 'Aarav Sharma',
      subject: 'Special VIP Invitation',
      bodyText: 'We invite you to our private luxury collection preview.',
      templateType: 'custom'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.direction, 'outbound');
    assert.ok(result.emailId.startsWith('eml_'));

    const res = await db.query('SELECT * FROM emails WHERE id = $1', [result.emailId]);
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].subject, 'Special VIP Invitation');
    assert.strictEqual(res.rows[0].status, 'delivered');
  });

  test('generates and dispatches an Abandoned Cart Recovery email with discount', async () => {
    const recoveryResult = await EmailService.sendCartRecoveryEmail({
      merchantId,
      cartId: 'cart_abandoned_01',
      customerId: 'cust_01',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.com',
      cartValue: 4298,
      discountPercent: 10,
      discountAmount: 430,
      recoveryUrl: 'http://localhost:5173/checkout/recov_tok_aarav_4298'
    });

    assert.strictEqual(recoveryResult.success, true);
    assert.strictEqual(recoveryResult.templateType, 'cart_recovery');

    const res = await db.query('SELECT * FROM emails WHERE id = $1', [recoveryResult.emailId]);
    assert.strictEqual(res.rows.length, 1);
    assert.ok(res.rows[0].body_html.includes('430'));
    assert.ok(res.rows[0].body_html.includes('recov_tok_aarav_4298'));
  });

  test('allows client on checkout to submit an inquiry to the store owner', async () => {
    const inquiryResult = await EmailService.submitCustomerInquiry({
      merchantId,
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.com',
      customerPhone: '+919876543210',
      message: 'Can I pay via cash on delivery for this order?',
      cartToken: 'demo_token_aarav',
      cartValue: 4298
    });

    assert.strictEqual(inquiryResult.success, true);
    assert.strictEqual(inquiryResult.direction, 'inbound');
    assert.strictEqual(inquiryResult.templateType, 'customer_inquiry');

    const res = await db.query('SELECT * FROM emails WHERE id = $1', [inquiryResult.emailId]);
    assert.strictEqual(res.rows[0].direction, 'inbound');
    assert.ok(res.rows[0].body_text.includes('cash on delivery'));
  });

  test('allows store owner to send a direct reply to a client inquiry', async () => {
    const replyResult = await EmailService.sendMerchantReply({
      merchantId,
      emailId: 'eml_inq_aarav_01',
      replyMessage: 'Yes, cash on delivery is available for orders under ₹5,000 in your pin code!',
      customerEmail: 'aarav.sharma@example.com',
      customerName: 'Aarav Sharma',
      originalSubject: 'Checkout Inquiry: Express Delivery'
    });

    assert.strictEqual(replyResult.success, true);
    assert.strictEqual(replyResult.templateType, 'merchant_reply');

    const res = await db.query('SELECT * FROM emails WHERE id = $1', [replyResult.emailId]);
    assert.strictEqual(res.rows[0].in_reply_to, 'eml_inq_aarav_01');
    assert.ok(res.rows[0].body_text.includes('cash on delivery is available'));
  });

  test('automatically sends order confirmation receipt email on successful payment verification', async () => {
    const orderData = await RazorpayService.createOrder({
      merchantId,
      cartId: 'cart_abandoned_01',
      customerId: 'cust_01',
      amount: 3868.20,
      currency: 'INR'
    });

    await RazorpayService.processPaymentSuccess({
      merchantId,
      razorpayOrderId: orderData.razorpayOrderId,
      razorpayPaymentId: 'pay_test_email_confirm_001',
      razorpaySignature: 'sig_demo_hash_verified',
      method: 'upi'
    });

    // Verify confirmation email was recorded
    const emailRes = await db.query(
      "SELECT * FROM emails WHERE merchant_id = $1 AND template_type = 'order_confirmation' ORDER BY created_at DESC LIMIT 1",
      [merchantId]
    );

    assert.strictEqual(emailRes.rows.length, 1);
    assert.strictEqual(emailRes.rows[0].recipient_email, 'aarav.sharma@example.com');
    assert.ok(emailRes.rows[0].body_html.includes('Order Confirmed'));
  });

  test('retrieves communications list and computed stats accurately', async () => {
    const comms = await EmailService.getCommunications({ merchantId, limit: 10 });
    assert.ok(comms.total >= 4);
    assert.ok(Array.isArray(comms.communications));

    const stats = await EmailService.getStats(merchantId);
    assert.ok(stats.totalEmails >= 4);
    assert.ok(stats.inboundInquiries >= 1);
    assert.ok(stats.outboundSent >= 2);
    assert.strictEqual(stats.deliveryRate, 100);
  });

  test('TaskAgent handles email recovery instruction via natural language prompt', async () => {
    const agent = new TaskAgent(merchantId);
    const result = await agent.executeTask({
      task: 'Send an email recovery to Aarav with 10% discount'
    });

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.intent, 'EMAIL_OUTREACH');
    assert.ok(result.summary.includes('Email Recovery Sent'));
    assert.strictEqual(result.data.recipient, 'aarav.sharma@example.com');
  });
});
