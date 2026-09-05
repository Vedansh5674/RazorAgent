import { db } from '../config/database.js';
import crypto from 'crypto';

export class AuditService {
  /**
   * Records an immutable audit log entry
   */
  static async recordEvent({
    merchantId,
    actorType, // 'ai_agent' | 'merchant' | 'system' | 'whatsapp_service' | 'razorpay_gateway'
    actorId = 'system',
    eventType,
    entityType,
    entityId,
    inputData = {},
    outputData = {},
    status = 'success'
  }) {
    const id = `audit_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();

    await db.query(
      `INSERT INTO audit_logs (id, merchant_id, actor_type, actor_id, event_type, entity_type, entity_id, input_data, output_data, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        merchantId,
        actorType,
        actorId,
        eventType,
        entityType,
        entityId,
        typeof inputData === 'string' ? inputData : JSON.stringify(inputData),
        typeof outputData === 'string' ? outputData : JSON.stringify(outputData),
        status,
        createdAt
      ]
    );

    console.log(`[Audit] [${actorType.toUpperCase()}] ${eventType} on ${entityType}:${entityId} -> ${status}`);
    return { id, eventType, entityType, entityId, status, createdAt };
  }

  static async getLogs(merchantId, { limit = 50, offset = 0 } = {}) {
    const result = await db.query(
      `SELECT * FROM audit_logs WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );
    return result.rows;
  }

  static async getLogById(merchantId, logId) {
    const result = await db.query(
      `SELECT * FROM audit_logs WHERE merchant_id = $1 AND id = $2 LIMIT 1`,
      [merchantId, logId]
    );
    return result.rows[0] || null;
  }
}
