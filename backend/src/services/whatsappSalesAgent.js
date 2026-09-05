import { db } from '../config/database.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

export class WhatsAppSalesAgent {
  static async processCustomerMessage({
    merchantId,
    customerId = 'cust_01',
    customerPhone = null,
    message = '',
    cartId = null,
    history = []
  }) {
    if (!merchantId) throw new Error('merchantId is required');

    const cleanMsg = (message || '').toLowerCase().trim();

    const prodRes = await db.query(
      `SELECT * FROM products WHERE merchant_id = $1 ORDER BY price ASC`,
      [merchantId]
    );
    const products = prodRes.rows;

    const merchantRes = await db.query(
      `SELECT store_name FROM merchants WHERE id = $1 LIMIT 1`,
      [merchantId]
    );
    const storeName = merchantRes.rows[0]?.store_name || 'TrendVault India';

    // Intent detection
    const priceMatch = cleanMsg.match(/(?:under|below|less than|within|around)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
    const priceLimit = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : null;

    const isAddToCart = cleanMsg.includes('add to cart') || cleanMsg.includes('add item') || cleanMsg.startsWith('add ');
    const isCheckout = cleanMsg.includes('checkout') || cleanMsg.includes('pay') || cleanMsg.includes('payment') || cleanMsg.includes('buy now');
    const isCompare = cleanMsg.includes('compare') || cleanMsg.includes('difference between') || cleanMsg.includes('vs');

    // Add to Cart
    if (isAddToCart) {
      let targetProduct = null;
      for (const p of products) {
        if (cleanMsg.includes(p.id.toLowerCase()) || cleanMsg.includes(p.title.toLowerCase().slice(0, 15))) {
          targetProduct = p;
          break;
        }
      }
      if (!targetProduct && products.length > 0) {
        targetProduct = products[0];
      }

      const token = `tok_${Date.now()}_sales`;
      const newCartId = cartId || `cart_sales_${Date.now()}_${crypto.randomUUID().slice(0, 4)}`;
      const now = new Date().toISOString();

      await db.query(
        `INSERT INTO carts (id, merchant_id, customer_id, status, total_amount, currency, checkout_started_at, recovery_token, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [newCartId, merchantId, customerId, 'active', targetProduct.price, 'INR', now, token, now, now]
      );

      await db.query(
        `INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [`item_${Date.now()}`, newCartId, targetProduct.id, 1, targetProduct.price, targetProduct.price, now]
      );

      const checkoutUrl = `/checkout/${token}`;
      const text = `✅ Added **${targetProduct.title}** to your shopping bag! Your total is **₹${Number(targetProduct.price).toLocaleString('en-IN')}**.`;

      return {
        text,
        reply: text,
        intent: 'ADD_TO_CART',
        products: [targetProduct],
        cart: {
          cartId: newCartId,
          recoveryToken: token,
          itemTitle: targetProduct.title,
          totalAmount: targetProduct.price,
          checkoutUrl,
          items: [{ product: targetProduct, quantity: 1, price: targetProduct.price }]
        },
        checkoutUrl,
        quickReplies: ['Proceed to Checkout', 'View More Products', 'Apply Discount Coupon']
      };
    }

    // Checkout
    if (isCheckout) {
      const cartsRes = await db.query(
        `SELECT * FROM carts WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [customerId]
      );
      const existingCart = cartsRes.rows[0];
      const token = existingCart?.recovery_token || 'recov_tok_aarav_4298';
      const checkoutUrl = `/checkout/${token}`;
      const text = `Ready to complete your order with ${storeName}! Click the secure checkout link below to finalize your Razorpay UPI or Card payment securely.`;

      return {
        text,
        reply: text,
        intent: 'CHECKOUT_LINK',
        checkoutUrl,
        checkoutLink: {
          url: checkoutUrl,
          total: existingCart?.total_amount || 1799,
          buttonText: 'Proceed to Secure Checkout'
        },
        quickReplies: ['Pay via UPI', 'Apply Discount', 'Add Another Product']
      };
    }

    // Compare
    if (isCompare) {
      const top2 = products.slice(0, 2);
      const text = `Here is a comparison between our top sellers:

• **${top2[0]?.title}**: ₹${Number(top2[0]?.price).toLocaleString('en-IN')} — Best for premium studio audio.
• **${top2[1]?.title}**: ₹${Number(top2[1]?.price).toLocaleString('en-IN')} — Best for all-day health & fitness tracking.`;

      return {
        text,
        reply: text,
        intent: 'COMPARISON',
        products: top2,
        quickReplies: [`Add ${top2[0]?.title.slice(0, 15)}...`, `Add ${top2[1]?.title.slice(0, 15)}...`, 'Browse Catalog']
      };
    }

    // Catalog & Discovery
    let matchedProducts = products;

    if (cleanMsg.includes('headphone') || cleanMsg.includes('audio') || cleanMsg.includes('wireless')) {
      const filtered = products.filter(p => p.category === 'Electronics' || p.title.toLowerCase().includes('headphone'));
      if (filtered.length > 0) matchedProducts = filtered;
    } else if (cleanMsg.includes('fitness') || cleanMsg.includes('band') || cleanMsg.includes('watch')) {
      const filtered = products.filter(p => p.category === 'Wearables' || p.title.toLowerCase().includes('fitness'));
      if (filtered.length > 0) matchedProducts = filtered;
    } else if (cleanMsg.includes('hoodie') || cleanMsg.includes('apparel') || cleanMsg.includes('wear')) {
      const filtered = products.filter(p => p.category === 'Apparel');
      if (filtered.length > 0) matchedProducts = filtered;
    } else if (cleanMsg.includes('mat') || cleanMsg.includes('wallet') || cleanMsg.includes('accessory')) {
      const filtered = products.filter(p => p.category === 'Accessories');
      if (filtered.length > 0) matchedProducts = filtered;
    }

    if (priceLimit) {
      const underLimit = matchedProducts.filter(p => Number(p.price) <= priceLimit);
      if (underLimit.length > 0) {
        matchedProducts = underLimit;
      }
    }

    if (matchedProducts.length === 0) {
      matchedProducts = products.slice(0, 3);
    }

    const firstProduct = matchedProducts[0];
    const greeting = priceLimit
      ? `Yes! I found ${matchedProducts.length} option${matchedProducts.length > 1 ? 's' : ''} under ₹${priceLimit.toLocaleString('en-IN')}. The **${firstProduct.title}** is ₹${Number(firstProduct.price).toLocaleString('en-IN')} and currently qualifies for complimentary express delivery!`
      : `Welcome to ${storeName}! Here are our top-rated recommendations based on your preferences:`;

    return {
      text: greeting,
      reply: greeting,
      intent: 'CATALOG_DISCOVERY',
      products: matchedProducts.slice(0, 3),
      quickReplies: [
        `Add ${firstProduct.title.slice(0, 16)}...`,
        'Compare Products',
        'Ask about Delivery',
        'Proceed to Checkout'
      ]
    };
  }
}
