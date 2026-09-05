import test from 'node:test';
import assert from 'node:assert';
import { WhatsAppService } from '../src/services/whatsappService.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('WhatsAppService Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';

  await t.test('formats cart_recovery template correctly with placeholders', () => {
    const preview = WhatsAppService.formatRecoveryMessage({
      customerName: 'Aarav',
      merchantName: 'TrendVault',
      cartValue: 4298,
      discountPercent: 10,
      discountAmount: 430,
      checkoutUrl: 'http://localhost:5173/checkout/recov_test'
    });

    assert.ok(preview.body.includes('Hi Aarav'));
    assert.ok(preview.body.includes('4,298'));
    assert.ok(preview.body.includes('10%'));
    assert.ok(preview.body.includes('http://localhost:5173/checkout/recov_test'));
    assert.ok(preview.body.includes('Reply STOP to opt out'));
  });

  await t.test('sends simulated WhatsApp message in demo mode and saves record', async () => {
    const result = await WhatsAppService.sendCartRecoveryMessage({
      merchantId,
      customerId: 'cust_01',
      opportunityId: 'opp_test_wa_01',
      phoneNumber: '+919876543210',
      customerName: 'Aarav Sharma',
      cartValue: 4298,
      discountPercent: 10,
      discountAmount: 430,
      recoveryUrl: 'http://localhost:5173/checkout/test'
    });

    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.mode, 'demo');
    assert.strictEqual(result.label, 'Demo Mode — WhatsApp message simulated');
    assert.ok(result.messageId);
    assert.ok(result.providerMsgId);
  });

  await t.test('blocks WhatsApp sending to customer who has opted out', async () => {
    const result = await WhatsAppService.sendCartRecoveryMessage({
      merchantId,
      customerId: 'cust_04', // Ananya Verma - opted out
      opportunityId: 'opp_test_wa_02',
      phoneNumber: '+919900112233',
      customerName: 'Ananya Verma',
      cartValue: 2999
    });

    assert.strictEqual(result.status, 'blocked');
    assert.match(result.message, /opted out/i);
  });

  await t.test('prevents duplicate recovery messages from being sent', async () => {
    // Attempt sending another message to cust_01 who already received one above
    const dupResult = await WhatsAppService.sendCartRecoveryMessage({
      merchantId,
      customerId: 'cust_01',
      opportunityId: 'opp_test_wa_03',
      phoneNumber: '+919876543210',
      customerName: 'Aarav Sharma',
      cartValue: 4298
    });

    assert.strictEqual(dupResult.status, 'blocked');
    assert.match(dupResult.message, /Duplicate message prevention triggered/i);
  });
});
