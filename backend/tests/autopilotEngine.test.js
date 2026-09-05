import test from 'node:test';
import assert from 'node:assert';
import { AutopilotEngine } from '../src/services/autopilotEngine.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('AutopilotEngine Autonomous Recovery Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';

  await t.test('retrieves default Autopilot configuration', async () => {
    const settings = await AutopilotEngine.getSettings(merchantId);
    assert.ok(settings);
    assert.strictEqual(settings.merchant_id, merchantId);
    assert.strictEqual(settings.mode, 'SEMI_AUTOPILOT');
    assert.strictEqual(settings.is_paused, false);
    assert.strictEqual(settings.auto_approve_threshold, 0.80);
    assert.strictEqual(settings.max_auto_discount, 10.00);
    assert.deepStrictEqual(settings.channels, ['whatsapp', 'email']);
  });

  await t.test('updates configuration and validates allowed modes', async () => {
    const updated = await AutopilotEngine.updateSettings(merchantId, {
      mode: 'FULL_AUTOPILOT',
      auto_approve_threshold: 0.85,
      max_auto_discount: 12.00,
      channels: ['whatsapp', 'email']
    });

    assert.strictEqual(updated.mode, 'FULL_AUTOPILOT');
    assert.strictEqual(updated.auto_approve_threshold, 0.85);
    assert.strictEqual(updated.max_auto_discount, 12.00);

    // Rejects invalid mode
    await assert.rejects(
      async () => {
        await AutopilotEngine.updateSettings(merchantId, { mode: 'INVALID_MODE' });
      },
      /Invalid mode/
    );

    // Reset back to SEMI_AUTOPILOT for subsequent tests
    await AutopilotEngine.updateSettings(merchantId, {
      mode: 'SEMI_AUTOPILOT',
      auto_approve_threshold: 0.80,
      max_auto_discount: 10.00,
      is_paused: false
    });
  });

  await t.test('records telemetry events and retrieves activity stream', async () => {
    await AutopilotEngine.recordEvent(merchantId, {
      event_type: 'TEST_RADAR_EVENT',
      severity: 'success',
      summary: 'Test radar telemetry recorded successfully',
      details: { sample: true, score: 95 }
    });

    const stream = await AutopilotEngine.getActivityStream(merchantId, 10);
    assert.ok(Array.isArray(stream));
    assert.ok(stream.length > 0);

    const testEvt = stream.find(e => e.event_type === 'TEST_RADAR_EVENT');
    assert.ok(testEvt);
    assert.strictEqual(testEvt.summary, 'Test radar telemetry recorded successfully');
    assert.strictEqual(testEvt.details.score, 95);
  });

  await t.test('halts cycle immediately when emergency pause is active', async () => {
    // Pause engine
    await AutopilotEngine.updateSettings(merchantId, { is_paused: true });

    const result = await AutopilotEngine.runAutopilotCycle(merchantId);
    assert.strictEqual(result.status, 'paused');
    assert.match(result.message, /paused/i);
    assert.strictEqual(result.cycleSummary.autoApproved, 0);

    // Resume engine
    await AutopilotEngine.updateSettings(merchantId, { is_paused: false });
  });

  await t.test('holds all opportunities for manual review in MANUAL_ASSIST mode', async () => {
    await AutopilotEngine.updateSettings(merchantId, {
      mode: 'MANUAL_ASSIST',
      is_paused: false
    });

    const result = await AutopilotEngine.runAutopilotCycle(merchantId);
    assert.strictEqual(result.status, 'manual_mode');
    assert.strictEqual(result.autoApproved, 0);
    assert.strictEqual(result.dispatchedWhatsApp, 0);
    assert.strictEqual(result.dispatchedEmail, 0);
    assert.ok(result.heldForManualReview >= 0);
  });

  await t.test('executes autonomous recovery in SEMI_AUTOPILOT mode with policy compliance', async () => {
    await AutopilotEngine.updateSettings(merchantId, {
      mode: 'SEMI_AUTOPILOT',
      auto_approve_threshold: 0.80,
      max_auto_discount: 10.00,
      channels: ['whatsapp', 'email'],
      is_paused: false
    });

    const result = await AutopilotEngine.runAutopilotCycle(merchantId);
    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.mode, 'SEMI_AUTOPILOT');
    assert.ok(typeof result.scanned === 'number');
    assert.ok(typeof result.autoApproved === 'number');
    assert.ok(typeof result.recoveredProjectedValue === 'number');

    // Verify activity stream has cycle completion event
    const stream = await AutopilotEngine.getActivityStream(merchantId, 5);
    const completedEvt = stream.find(e => e.event_type === 'CYCLE_COMPLETED');
    assert.ok(completedEvt);
  });
});
