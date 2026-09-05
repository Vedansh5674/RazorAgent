import test from 'node:test';
import assert from 'node:assert';
import { AuditService } from '../src/services/auditService.js';
import { db } from '../src/config/database.js';

test('AuditService Suite', async (t) => {
  await db.initialize();
  const merchantId = 'merchant_trendvault_01';

  await t.test('records immutable audit events with actor and entity tracking', async () => {
    const entry = await AuditService.recordEvent({
      merchantId,
      actorType: 'ai_agent',
      actorId: 'test_agent',
      eventType: 'agent_analyzed_checkout',
      entityType: 'cart',
      entityId: 'cart_test_123',
      inputData: { cartValue: 2500 },
      outputData: { recommendation: 'send_whatsapp_recovery' },
      status: 'success'
    });

    assert.ok(entry.id);
    assert.strictEqual(entry.eventType, 'agent_analyzed_checkout');

    const logs = await AuditService.getLogs(merchantId, { limit: 10 });
    const found = logs.find(l => l.id === entry.id);
    assert.ok(found, 'Log entry must be persisted in database');
  });
});
