import test from 'node:test';
import assert from 'node:assert';
import { TaskAgent } from '../src/agent/taskAgent.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('TaskAgent User Requirements & Multi-Step Execution Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';
  const agent = new TaskAgent(merchantId, { id: 'test_admin', name: 'Test Merchant' });

  await t.test('updates policy guardrails from natural language user prompt', async () => {
    const result = await agent.executeTask({
      task: 'Update policy to set max discount to 14% and recovery window to 36 hours'
    });

    assert.strictEqual(result.intent, 'UPDATE_POLICY');
    assert.strictEqual(result.status, 'completed');
    assert.ok(result.steps.length >= 3);
    assert.strictEqual(result.data.updatedPolicy.max_discount_percent, 14);
    assert.strictEqual(result.data.updatedPolicy.recovery_window_hours, 36);
    assert.ok(result.auditEventId);
  });

  await t.test('filters abandoned carts and generates opportunities based on user threshold', async () => {
    const result = await agent.executeTask({
      task: 'Find all abandoned carts over 2000 and draft recovery actions with 10% discount'
    });

    assert.strictEqual(result.intent, 'SCAN_AND_RECOVER');
    assert.strictEqual(result.status, 'completed');
    assert.ok(result.steps.length >= 3);
    assert.ok(result.data.totalFound >= 1);
    assert.ok(result.auditEventId);
  });

  await t.test('drafts personalized WhatsApp recovery for opted-in customer Aarav', async () => {
    const result = await agent.executeTask({
      task: 'Draft a recovery message for Aarav Sharma'
    });

    assert.strictEqual(result.intent, 'DRAFT_RECOVERY');
    assert.strictEqual(result.status, 'completed');
    assert.ok(result.data.messagePreview);
    assert.strictEqual(result.data.guardrailBlocked, false);
    assert.ok(result.data.messagePreview.body.includes('Aarav'));
  });

  await t.test('generates revenue leakage and store performance analytics report', async () => {
    const result = await agent.executeTask({
      task: 'Generate an executive revenue and checkout leakage analytics report'
    });

    assert.strictEqual(result.intent, 'ANALYTICS_REPORT');
    assert.strictEqual(result.status, 'completed');
    assert.ok(result.data.totalRevenue >= 0);
    assert.ok(result.data.abandonedCheckoutValue >= 0);
    assert.ok(result.data.projectedRecoverablePipeline >= 0);
  });

  await t.test('triages pending queue actions against merchant policy', async () => {
    const result = await agent.executeTask({
      task: 'Triage pending approval queue actions'
    });

    assert.strictEqual(result.intent, 'TRIAGE_QUEUE');
    assert.strictEqual(result.status, 'completed');
    assert.ok(Array.isArray(result.data.approvedSafe));
    assert.ok(Array.isArray(result.data.blockedActions));
  });
});
