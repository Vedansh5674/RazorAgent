import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../config/database.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required to access this resource.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const userRes = await db.query(
      `SELECT id, merchant_id, name, email, role FROM users WHERE id = $1 LIMIT 1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'The merchant account associated with this token no longer exists.'
      });
    }

    req.user = userRes.rows[0];
    req.merchantId = req.user.merchant_id;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Token is invalid or expired. Please log in again.'
    });
  }
}
