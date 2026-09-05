import { db } from '../config/database.js';
import { PolicyService } from '../services/policyService.js';

export class MerchantController {
  static async getProfile(req, res, next) {
    try {
      const merchantRes = await db.query(
        `SELECT * FROM merchants WHERE id = $1 LIMIT 1`,
        [req.merchantId]
      );
      if (merchantRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Merchant not found' });
      }
      res.json(merchantRes.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name, storeName, currency } = req.body;
      const now = new Date().toISOString();

      const result = await db.query(
        `UPDATE merchants 
         SET name = COALESCE($1, name),
             store_name = COALESCE($2, store_name),
             currency = COALESCE($3, currency),
             updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [name, storeName, currency, now, req.merchantId]
      );

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  static async getPolicies(req, res, next) {
    try {
      const policy = await PolicyService.getMerchantPolicy(req.merchantId);
      res.json(policy);
    } catch (err) {
      next(err);
    }
  }

  static async updatePolicies(req, res, next) {
    try {
      const updated = await PolicyService.updateMerchantPolicy(req.merchantId, req.body);
      res.json({ message: 'Policy configuration updated successfully', policy: updated });
    } catch (err) {
      next(err);
    }
  }
}
