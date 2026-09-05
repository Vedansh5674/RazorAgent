import test from 'node:test';
import assert from 'node:assert';
import { RevenueAgent } from '../src/services/revenueAgent.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('RevenueAgent Intelligence Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';

  await t.test('analyzes business data and generates structured revenue opportunities', async () => {
    const analysis = await RevenueAgent.analyzeMerchantRevenue(merchantId);
    assert.ok(analysis);
    assert.ok(analysis.metrics);
    assert.strictEqual(analysis.metrics.merchantId, merchantId);
    assert.ok(analysis.metrics.totalRevenue >= 0);
    assert.ok(analysis.metrics.totalOrders >= 0);
    assert.ok(analysis.metrics.aov >= 0);
    assert.ok(Array.isArray(analysis.opportunities));
    assert.ok(analysis.opportunities.length > 0);

    const firstOp = analysis.opportunities[0];
    assert.ok(firstOp.id);
    assert.ok(firstOp.title);
    assert.ok(firstOp.reason);
    assert.ok(firstOp.estimatedImpact || firstOp.estimated_impact);
    assert.ok(firstOp.recommendedAction || firstOp.recommended_action);
    assert.ok(firstOp.priority);
  });

  await t.test('answers natural language merchant revenue queries', async () => {
    const q1 = await RevenueAgent.answerMerchantQuery(merchantId, 'How can I increase my revenue this week?');
    assert.ok(q1);
    assert.ok(q1.summary || q1.aiSummary);
    assert.ok(Array.isArray(q1.opportunities));
    assert.ok(q1.opportunities.length > 0);
    assert.ok(Array.isArray(q1.telemetry));

    const q2 = await RevenueAgent.answerMerchantQuery(merchantId, 'Why did sales drop yesterday?');
    assert.ok(q2);
    const sum2 = (q2.summary || q2.aiSummary).toLowerCase();
    assert.ok(sum2.includes('abandoned') || sum2.includes('drop') || sum2.includes('dip'));

    const q3 = await RevenueAgent.answerMerchantQuery(merchantId, 'Show me VIP customer opportunities');
    assert.ok(q3);
    const sum3 = (q3.summary || q3.aiSummary).toLowerCase();
    assert.ok(sum3.includes('vip') || sum3.includes('loyalty') || sum3.includes('ltv'));
  });

  await t.test('promotes an opportunity directly to the Action Center', async () => {
    const analysis = await RevenueAgent.analyzeMerchantRevenue(merchantId);
    const targetOpportunity = analysis.opportunities[0];

    const action = await RevenueAgent.promoteOpportunityToAction(merchantId, targetOpportunity.id);
    assert.ok(action);
    assert.ok(action.id);
    assert.strictEqual(action.merchant_id, merchantId);
    assert.strictEqual(action.title, targetOpportunity.title);
  });
});
