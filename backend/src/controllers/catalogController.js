import { db } from '../config/database.js';
import crypto from 'crypto';

export class CatalogController {
  static async getProducts(req, res, next) {
    try {
      const result = await db.query(
        `SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC`,
        [req.merchantId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const { title, description, price, inventoryCount = 100, imageUrl, category } = req.body;
      if (!title || price === undefined) {
        return res.status(400).json({ error: 'ValidationError', message: 'Product title and price are required.' });
      }

      const id = `prod_${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      const result = await db.query(
        `INSERT INTO products (id, merchant_id, title, description, price, inventory_count, image_url, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [id, req.merchantId, title, description || '', Number(price), Number(inventoryCount), imageUrl || '', category || 'General', now, now]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, price, inventoryCount, imageUrl, category } = req.body;
      const now = new Date().toISOString();

      const result = await db.query(
        `UPDATE products 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             price = COALESCE($3, price),
             inventory_count = COALESCE($4, inventory_count),
             image_url = COALESCE($5, image_url),
             category = COALESCE($6, category),
             updated_at = $7
         WHERE id = $8 AND merchant_id = $9
         RETURNING *`,
        [title, description, price, inventoryCount, imageUrl, category, now, id, req.merchantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'NotFound', message: 'Product not found.' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await db.query(`DELETE FROM products WHERE id = $1 AND merchant_id = $2`, [id, req.merchantId]);
      res.json({ message: 'Product deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
