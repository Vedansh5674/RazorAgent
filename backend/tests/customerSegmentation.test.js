import test from 'node:test';
import assert from 'node:assert';
import { CustomerSegmentationService } from '../src/services/customerSegmentationService.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('CustomerSegmentationService Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';

  await t.test('segments customers across 7 distinct categories with LTV and actions', async () => {
    const data = await CustomerSegmentationService.getSegmentedCustomers(merchantId);
    assert.ok(data);
    assert.ok(Array.isArray(data.customers));
    assert.ok(data.customers.length >= 10);
    assert.ok(data.summary);
    assert.ok(data.summary.totalCustomers >= 10);

    const validKeywords = ['VIP', 'Loyal', 'High-Value', 'New', 'At-Risk', 'Churned', 'High-Intent'];
    for (const cust of data.customers) {
      const matchesKeyword = validKeywords.some(k => cust.segment.toLowerCase().includes(k.toLowerCase()));
      assert.ok(matchesKeyword, `Unexpected segment: ${cust.segment}`);
      assert.ok(typeof cust.ltv === 'number');
      assert.ok(typeof cust.total_orders === 'number');
      assert.ok(typeof cust.total_spent === 'number');
      assert.ok(cust.recommended_action);
    }
  });

  await t.test('creates an approved or suggested marketing action for a segment campaign', async () => {
    const result = await CustomerSegmentationService.createSegmentCampaign(merchantId, {
      segmentName: 'At-Risk Customers',
      discountPercent: 12,
      messageTemplate: 'We miss you! Take 12% off your favorite items today: {{checkout_url}}',
      channel: 'whatsapp'
    });

    assert.ok(result);
    assert.ok(result.action);
    assert.strictEqual(result.action.action_type, 'SEGMENT_WINBACK_CAMPAIGN');
    assert.strictEqual(result.action.channel, 'whatsapp');
    assert.strictEqual(result.targetedCount > 0, true);
  });
});
