import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../src/config/database.js';
import { config } from '../src/config/env.js';
import { seedDatabase } from '../src/db/seed.js';

test('Auth System Suite', async (t) => {
  await db.initialize();
  await seedDatabase();

  await t.test('authenticates valid merchant credentials and verifies password hash', async () => {
    const userRes = await db.query(`SELECT * FROM users WHERE email = 'admin@trendvault.in' LIMIT 1`);
    assert.strictEqual(userRes.rows.length, 1);

    const user = userRes.rows[0];
    const match = await bcrypt.compare('DemoAdmin123!', user.password_hash);
    assert.strictEqual(match, true);

    const token = jwt.sign({ userId: user.id, merchantId: user.merchant_id }, config.jwtSecret);
    const decoded = jwt.verify(token, config.jwtSecret);
    assert.strictEqual(decoded.userId, user.id);
    assert.strictEqual(decoded.merchantId, user.merchant_id);
  });

  await t.test('rejects incorrect password verification', async () => {
    const userRes = await db.query(`SELECT * FROM users WHERE email = 'admin@trendvault.in' LIMIT 1`);
    const user = userRes.rows[0];
    const match = await bcrypt.compare('WrongPassword999!', user.password_hash);
    assert.strictEqual(match, false);
  });
});
