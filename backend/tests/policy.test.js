import test from 'node:test';
import assert from 'node:assert';
import { PolicyService } from '../src/services/policyService.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('PolicyService Guardrails Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';

  await t.test('allows compliant discount within policy limits (10% and <= 500)', async () => {
    const result = await PolicyService.validateAction({
      merchantId,
      actionType: 'send_whatsapp_recovery',
      discountPercent: 10,
      discountAmount: 429,
      customerId: 'cust_01',
      cartId: 'cart_abandoned_01',
      merchantApproved: true
    });

    assert.strictEqual(result.status, 'approved');
  });

  await t.test('blocks discount exceeding max percent limit (> 10%)', async () => {
    const result = await PolicyService.validateAction({
      merchantId,
      actionType: 'send_whatsapp_recovery',
      discountPercent: 25, // Policy max is 10%
      discountAmount: 250,
      customerId: 'cust_01',
      cartId: 'cart_abandoned_01',
      merchantApproved: true
    });

    assert.strictEqual(result.status, 'blocked');
    assert.match(result.reason, /exceeds the merchant policy limit/i);
    assert.strictEqual(result.allowedMaximum, 10);
  });

  await t.test('blocks discount exceeding max amount cap (> 500)', async () => {
    const result = await PolicyService.validateAction({
      merchantId,
      actionType: 'send_whatsapp_recovery',
      discountPercent: 10,
      discountAmount: 850, // Policy max is 500
      customerId: 'cust_01',
      cartId: 'cart_abandoned_01',
      merchantApproved: true
    });

    assert.strictEqual(result.status, 'blocked');
    assert.match(result.reason, /exceeds the maximum cap/i);
    assert.strictEqual(result.allowedMaximum, 500);
  });

  await t.test('blocks action if merchant approval is required but missing', async () => {
    const result = await PolicyService.validateAction({
      merchantId,
      actionType: 'send_whatsapp_recovery',
      discountPercent: 5,
      discountAmount: 100,
      customerId: 'cust_01',
      cartId: 'cart_abandoned_01',
      merchantApproved: false // Not approved
    });

    assert.strictEqual(result.status, 'blocked');
    assert.match(result.reason, /Merchant approval is required/i);
  });

  await t.test('blocks WhatsApp delivery to customer who has opted out', async () => {
    const result = await PolicyService.validateAction({
      merchantId,
      actionType: 'send_whatsapp_recovery',
      discountPercent: 10,
      discountAmount: 299,
      customerId: 'cust_04', // Ananya Verma - opted_in is false
      cartId: 'cart_abandoned_03_optout',
      merchantApproved: true
    });

    assert.strictEqual(result.status, 'blocked');
    assert.match(result.reason, /opt-in consent/i);
  });

  await t.test('blocks recovery for checkout older than recovery window (> 24 hours)', async () => {
    const result = await PolicyService.validateAction({
      merchantId,
      actionType: 'send_whatsapp_recovery',
      discountPercent: 10,
      discountAmount: 89,
      customerId: 'cust_05',
      cartId: 'cart_abandoned_04_expired', // 36 hours old
      merchantApproved: true
    });

    assert.strictEqual(result.status, 'blocked');
    assert.match(result.reason, /exceeds the maximum recovery window/i);
  });
});
