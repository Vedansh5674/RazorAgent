import { db } from '../config/database.js';

export class OrdersController {
  static async getOrders(req, res, next) {
    try {
      const result = await db.query(
        `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone 
         FROM orders o 
         LEFT JOIN customers c ON o.customer_id = c.id 
         WHERE o.merchant_id = $1 
         ORDER BY o.created_at DESC`,
        [req.merchantId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const orderRes = await db.query(
        `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone 
         FROM orders o 
         LEFT JOIN customers c ON o.customer_id = c.id 
         WHERE o.id = $1 AND o.merchant_id = $2 LIMIT 1`,
        [id, req.merchantId]
      );

      if (orderRes.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Order not found.' });
      }

      const order = orderRes.rows[0];
      const paymentsRes = await db.query(`SELECT * FROM payments WHERE order_id = $1`, [order.id]);
      order.payments = paymentsRes.rows;

      res.json(order);
    } catch (err) {
      next(err);
    }
  }
}
