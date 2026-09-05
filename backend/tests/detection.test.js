import test from 'node:test';
import assert from 'node:assert';
import { AgentTools } from '../src/agent/tools.js';
import { RecoveryAgent } from '../src/agent/recoveryAgent.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('Abandoned Checkout Detection & Scan Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';
  const tools = new AgentTools(merchantId);

  await t.test('detects abandoned checkouts from database with telemetry', async () => {
    const checkouts = await tools.getAbandonedCheckouts();

    assert.ok(Array.isArray(checkouts));
    assert.ok(checkouts.length >= 3, 'Should detect seeded abandoned checkouts');

    const first = checkouts[0];
    assert.ok(first.cartId);
    assert.ok(first.cartValue > 0);
    assert.ok(first.checkoutAgeMinutes >= 0);
  });

  await t.test('executes autonomous recovery scan generating actionable opportunities', async () => {
    const agent = new RecoveryAgent(merchantId);
    const result = await agent.scanAndAnalyze();

    assert.ok(result.totalScanned > 0);
    assert.ok(result.opportunitiesCreated > 0);
    assert.ok(result.opportunities.length > 0);

    const opp = result.opportunities[0];
    assert.strictEqual(opp.status, 'pending');
    assert.strictEqual(opp.type, 'checkout_recovery');
  });
});
