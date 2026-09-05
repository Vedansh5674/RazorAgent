import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import { AuditService } from '../services/auditService.js';
import crypto from 'crypto';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, storeName } = req.body;

      if (!name || !email || !password || !storeName) {
        return res.status(400).json({ error: 'Validation Error', message: 'Name, email, password, and store name are required.' });
      }

      const existingUser = await db.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Conflict', message: 'A user with this email already exists.' });
      }

      const merchantId = `merch_${crypto.randomUUID().slice(0, 8)}`;
      const userId = `user_${crypto.randomUUID().slice(0, 8)}`;
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      await db.query(
        `INSERT INTO merchants (id, name, email, store_name, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [merchantId, storeName, email.toLowerCase(), storeName, 'INR', now, now]
      );

      await db.query(
        `INSERT INTO users (id, merchant_id, name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, merchantId, name, email.toLowerCase(), passwordHash, 'merchant_admin', now, now]
      );

      // Initialize default policies
      await db.query(
        `INSERT INTO merchant_policies (id, merchant_id, max_discount_percent, max_discount_amount, max_campaign_budget, max_messages_per_customer, recovery_window_hours, requires_merchant_approval, allowed_actions, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `policy_${merchantId}`,
          merchantId,
          10.00,
          500.00,
          5000.00,
          1,
          24,
          true,
          JSON.stringify(['send_whatsapp_recovery', 'retry_payment_reminder', 'recommend_product_bundle']),
          now,
          now
        ]
      );

      const token = jwt.sign({ userId, merchantId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

      await AuditService.recordEvent({
        merchantId,
        actorType: 'merchant',
        actorId: userId,
        eventType: 'merchant_registered',
        entityType: 'user',
        entityId: userId,
        inputData: { email: email.toLowerCase(), storeName },
        outputData: { merchantId },
        status: 'success'
      });

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: userId, name, email: email.toLowerCase(), role: 'merchant_admin' },
        merchant: { id: merchantId, storeName }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
      }

      const userRes = await db.query(
        `SELECT u.*, m.store_name, m.currency 
         FROM users u 
         LEFT JOIN merchants m ON u.merchant_id = m.id 
         WHERE u.email = $1 LIMIT 1`,
        [email.toLowerCase().trim()]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
      }

      const user = userRes.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { userId: user.id, merchantId: user.merchant_id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      await AuditService.recordEvent({
        merchantId: user.merchant_id,
        actorType: 'merchant',
        actorId: user.id,
        eventType: 'merchant_logged_in',
        entityType: 'user',
        entityId: user.id,
        inputData: { email: user.email },
        outputData: { loginSuccess: true },
        status: 'success'
      });

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        merchant: { id: user.merchant_id, storeName: user.store_name, currency: user.currency }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = req.user;
      const merchRes = await db.query(`SELECT * FROM merchants WHERE id = $1 LIMIT 1`, [user.merchant_id]);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        merchant: merchRes.rows[0] || null
      });
    } catch (err) {
      next(err);
    }
  }
}
