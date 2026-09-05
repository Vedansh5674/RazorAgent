import test from 'node:test';
import assert from 'node:assert';
import { WhatsAppSalesAgent } from '../src/services/whatsappSalesAgent.js';
import { db } from '../src/config/database.js';
import { seedDatabase } from '../src/db/seed.js';

test('WhatsAppSalesAgent Conversational Commerce Suite', async (t) => {
  await db.initialize();
  await seedDatabase();
  const merchantId = 'merchant_trendvault_01';
  const customerPhone = '+919876543210';
  const customerId = 'cust_aarav_01';

  await t.test('provides helpful storefront greeting and catalog discovery', async () => {
    const res = await WhatsAppSalesAgent.processCustomerMessage({
      merchantId,
      customerId,
      customerPhone,
      message: 'Hi, what do you sell?'
    });

    assert.ok(res);
    assert.ok(res.reply || res.text);
    assert.ok(res.products);
    assert.ok(res.products.length > 0);
    assert.strictEqual(res.intent, 'CATALOG_DISCOVERY');
  });

  await t.test('filters products with price threshold (e.g. under 2000)', async () => {
    const res = await WhatsAppSalesAgent.processCustomerMessage({
      merchantId,
      customerId,
      customerPhone,
      message: 'Show me products under 2000'
    });

    assert.ok(res);
    assert.ok(res.products.length > 0);
    for (const prod of res.products) {
      assert.ok(Number(prod.price) <= 2000, `Product ${prod.title} price ${prod.price} is not <= 2000`);
    }
  });

  await t.test('adds product to customer cart and tracks active session', async () => {
    const res = await WhatsAppSalesAgent.processCustomerMessage({
      merchantId,
      customerId,
      customerPhone,
      message: 'Add to cart'
    });

    assert.ok(res);
    assert.strictEqual(res.intent, 'ADD_TO_CART');
    assert.ok(res.cart);
    assert.ok(res.cart.items.length > 0);
    assert.ok(res.reply.includes('Added') || res.text.includes('Added'));
  });

  await t.test('generates instant checkout URL with live recovery token and summary', async () => {
    const res = await WhatsAppSalesAgent.processCustomerMessage({
      merchantId,
      customerId,
      customerPhone,
      message: 'checkout now'
    });

    assert.ok(res);
    assert.strictEqual(res.intent, 'CHECKOUT_LINK');
    assert.ok(res.checkoutUrl);
    assert.ok(res.checkoutUrl.includes('/checkout/'));
    assert.ok(res.reply.includes('checkout') || res.text.includes('checkout'));
  });
});
