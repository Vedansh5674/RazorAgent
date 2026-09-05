import { CustomerSegmentationService } from '../services/customerSegmentationService.js';
import { db } from '../config/database.js';

export class CustomerController {
  static async getCustomers(req, res, next) {
    try {
      const { segment } = req.query;
      const data = await CustomerSegmentationService.getSegmentedCustomers(req.merchantId, segment);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const custRes = await db.query(`SELECT * FROM customers WHERE id = $1 AND merchant_id = $2 LIMIT 1`, [id, req.merchantId]);
      if (custRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Customer not found' });
      }

      const ordersRes = await db.query(`SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`, [id]);
      const cartsRes = await db.query(`SELECT * FROM carts WHERE customer_id = $1 ORDER BY created_at DESC`, [id]);
      const consentsRes = await db.query(`SELECT * FROM customer_consents WHERE customer_id = $1 LIMIT 1`, [id]);

      res.json({
        customer: custRes.rows[0],
        orders: ordersRes.rows,
        carts: cartsRes.rows,
        consent: consentsRes.rows[0] || null
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCampaign(req, res, next) {
    try {
      const { segment, campaignTitle, channel, discountPercent, customMessage } = req.body;
      if (!segment) {
        return res.status(400).json({ error: 'ValidationError', message: 'Customer segment is required' });
      }

      const result = await CustomerSegmentationService.createSegmentCampaign(req.merchantId, {
        segment,
        campaignTitle,
        channel,
        discountPercent,
        customMessage
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}
