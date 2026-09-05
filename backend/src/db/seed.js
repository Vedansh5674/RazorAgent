import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import crypto from 'crypto';

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  await db.initialize();

  const merchantId = 'merchant_trendvault_01';
  const merchantEmail = 'admin@trendvault.in';
  const passwordHash = await bcrypt.hash('DemoAdmin123!', 10);

  // Clear dynamic records for clean seed state
  await db.query(`DELETE FROM whatsapp_messages WHERE merchant_id = $1`, [merchantId]);
  await db.query(`DELETE FROM emails WHERE merchant_id = $1`, [merchantId]);
  await db.query(`DELETE FROM actions WHERE merchant_id = $1`, [merchantId]);
  await db.query(`DELETE FROM recommendations WHERE merchant_id = $1`, [merchantId]);
  await db.query(`DELETE FROM opportunities WHERE merchant_id = $1`, [merchantId]);
  await db.query(`DELETE FROM autopilot_settings WHERE merchant_id = $1`, [merchantId]);
  await db.query(`DELETE FROM autopilot_events WHERE merchant_id = $1`, [merchantId]);

  await db.query(
    `INSERT INTO merchants (id, name, email, store_name, currency, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [
      merchantId,
      'TrendVault Commerce India',
      merchantEmail,
      'TrendVault India',
      'INR',
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );

  // 2. User
  await db.query(
    `INSERT INTO users (id, merchant_id, name, email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      'user_admin_01',
      merchantId,
      'Vikramaditya Oberoi',
      merchantEmail,
      passwordHash,
      'merchant_admin',
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );

  // 3. Merchant Policies (Default from prompt specification)
  await db.query(
    `INSERT INTO merchant_policies (id, merchant_id, max_discount_percent, max_discount_amount, max_campaign_budget, max_messages_per_customer, recovery_window_hours, requires_merchant_approval, allowed_actions, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO NOTHING`,
    [
      'policy_trendvault_01',
      merchantId,
      10.00,
      500.00,
      5000.00,
      1,
      24,
      true,
      JSON.stringify(['send_whatsapp_recovery', 'retry_payment_reminder', 'recommend_product_bundle', 'send_email_recovery', 'send_cart_recovery']),
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );

  // 4. Products
  const products = [
    { id: 'prod_01', title: 'Wireless Active Noise-Cancelling Headphones Pro', description: 'Studio-grade acoustics with 40h battery and hybrid ANC', price: 2999.00, category: 'Electronics', inventory: 45, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
    { id: 'prod_02', title: 'FitPulse Smart Fitness Band Series 7', description: 'Real-time SpO2, Heart Rate, and AMOLED display', price: 1799.00, category: 'Wearables', inventory: 80, image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80' },
    { id: 'prod_03', title: 'Heavyweight Organic Cotton Oversized Hoodie', description: '100% combed organic fleece in vintage onyx black', price: 1299.00, category: 'Apparel', inventory: 120, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80' },
    { id: 'prod_04', title: 'Ergonomic Vegan Leather Dual Desk Mat', description: 'Waterproof spill-resistant micro-texture finish', price: 899.00, category: 'Accessories', inventory: 60, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80' },
    { id: 'prod_05', title: 'Minimalist RFID-Blocking Leather Travel Wallet', description: 'Full grain vegetable tanned leather with quick draw slot', price: 1499.00, category: 'Accessories', inventory: 35, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80' }
  ];

  for (const prod of products) {
    await db.query(
      `INSERT INTO products (id, merchant_id, title, description, price, inventory_count, image_url, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [prod.id, merchantId, prod.title, prod.description, prod.price, prod.inventory, prod.image, prod.category, new Date().toISOString(), new Date().toISOString()]
    );
  }

  // 5. Customers & WhatsApp Consents (Covering all 7 Segments)
  const customers = [
    { id: 'cust_01', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+919876543210', type: 'loyal', orders: 4, ltv: 8500.00, consent: true },
    { id: 'cust_02', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+919823456789', type: 'vip', orders: 7, ltv: 16200.00, consent: true },
    { id: 'cust_03', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '+919811223344', type: 'new', orders: 1, ltv: 2518.00, consent: true },
    { id: 'cust_04', name: 'Ananya Verma', email: 'ananya.verma@example.com', phone: '+919900112233', type: 'high_intent', orders: 1, ltv: 1800.00, consent: false },
    { id: 'cust_05', name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+919712345678', type: 'at_risk', orders: 2, ltv: 3400.00, consent: true },
    { id: 'cust_06', name: 'Neha Gupta', email: 'neha.gupta@example.com', phone: '+919833445566', type: 'churned', orders: 1, ltv: 1299.00, consent: true },
    { id: 'cust_07', name: 'Kabir Kapoor', email: 'kabir.kapoor@example.com', phone: '+919877889900', type: 'high_value', orders: 3, ltv: 9998.00, consent: true },
    { id: 'cust_08', name: 'Sneha Rao', email: 'sneha.rao@example.com', phone: '+919844556677', type: 'vip', orders: 8, ltv: 22400.00, consent: true },
    { id: 'cust_09', name: 'Aditya Nair', email: 'aditya.nair@example.com', phone: '+919855667788', type: 'new', orders: 1, ltv: 1799.00, consent: true },
    { id: 'cust_10', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+919866778899', type: 'at_risk', orders: 3, ltv: 5800.00, consent: true },
    { id: 'cust_11', name: 'Arjun Reddy', email: 'arjun.reddy@example.com', phone: '+919899001122', type: 'high_intent', orders: 2, ltv: 4200.00, consent: true },
    { id: 'cust_12', name: 'Pooja Desai', email: 'pooja.desai@example.com', phone: '+919822334455', type: 'loyal', orders: 5, ltv: 11400.00, consent: true }
  ];

  for (const cust of customers) {
    await db.query(
      `INSERT INTO customers (id, merchant_id, name, email, phone, customer_type, total_orders, lifetime_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [cust.id, merchantId, cust.name, cust.email, cust.phone, cust.type, cust.orders, cust.ltv, new Date().toISOString(), new Date().toISOString()]
    );

    await db.query(
      `INSERT INTO customer_consents (id, merchant_id, customer_id, phone_number, channel, opted_in, opt_in_source, opt_in_at, opt_out_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        `consent_${cust.id}`,
        merchantId,
        cust.id,
        cust.phone,
        'whatsapp',
        cust.consent,
        'checkout_checkbox',
        new Date().toISOString(),
        cust.consent ? null : new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
  }

  // 6. Carts & Cart Items
  const now = Date.now();
  const carts = [
    {
      id: 'cart_abandoned_01',
      customerId: 'cust_01',
      status: 'abandoned',
      total: 4298.00,
      startedAt: new Date(now - 45 * 60 * 1000).toISOString(), // 45 mins ago
      abandonedAt: new Date(now - 40 * 60 * 1000).toISOString(),
      token: 'recov_tok_aarav_4298',
      items: [
        { productId: 'prod_01', qty: 1, unit: 2999.00, total: 2999.00 },
        { productId: 'prod_03', qty: 1, unit: 1299.00, total: 1299.00 }
      ]
    },
    {
      id: 'cart_abandoned_02',
      customerId: 'cust_02',
      status: 'abandoned',
      total: 3298.00,
      startedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      abandonedAt: new Date(now - 1.8 * 60 * 60 * 1000).toISOString(),
      token: 'recov_tok_priya_3298',
      items: [
        { productId: 'prod_02', qty: 1, unit: 1799.00, total: 1799.00 },
        { productId: 'prod_05', qty: 1, unit: 1499.00, total: 1499.00 }
      ]
    },
    {
      id: 'cart_abandoned_03_optout',
      customerId: 'cust_04',
      status: 'abandoned',
      total: 2999.00,
      startedAt: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago, but opted out
      abandonedAt: new Date(now - 50 * 60 * 1000).toISOString(),
      token: 'recov_tok_ananya_optout',
      items: [
        { productId: 'prod_01', qty: 1, unit: 2999.00, total: 2999.00 }
      ]
    },
    {
      id: 'cart_abandoned_04_expired',
      customerId: 'cust_05',
      status: 'abandoned',
      total: 899.00,
      startedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago (> 24h window)
      abandonedAt: new Date(now - 35 * 60 * 60 * 1000).toISOString(),
      token: 'recov_tok_vikram_expired',
      items: [
        { productId: 'prod_04', qty: 1, unit: 899.00, total: 899.00 }
      ]
    },
    // Past recovered cart for analytics metrics
    {
      id: 'cart_recovered_01',
      customerId: 'cust_03',
      status: 'recovered',
      total: 2798.00,
      startedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      abandonedAt: new Date(now - 23 * 60 * 60 * 1000).toISOString(),
      token: 'recov_tok_rohan_recovered',
      items: [
        { productId: 'prod_02', qty: 1, unit: 1799.00, total: 1799.00 },
        { productId: 'prod_04', qty: 1, unit: 899.00, total: 899.00 }
      ]
    }
  ];

  for (const cart of carts) {
    await db.query(
      `INSERT INTO carts (id, merchant_id, customer_id, status, total_amount, currency, checkout_started_at, abandoned_at, recovery_token, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [cart.id, merchantId, cart.customerId, cart.status, cart.total, 'INR', cart.startedAt, cart.abandonedAt, cart.token, cart.startedAt, cart.abandonedAt]
    );

    for (let i = 0; i < cart.items.length; i++) {
      const it = cart.items[i];
      await db.query(
        `INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [`item_${cart.id}_${i + 1}`, cart.id, it.productId, it.qty, it.unit, it.total, cart.startedAt]
      );
    }
  }

  // 7. Orders & Payments (Historical & Recovered)
  const orders = [
    {
      id: 'order_recov_01',
      customerId: 'cust_03',
      cartId: 'cart_recovered_01',
      orderNumber: 'ORD-2026-REC-001',
      status: 'paid',
      total: 2798.00,
      discount: 279.80,
      finalAmount: 2518.20,
      rzpOrderId: 'order_RZPtestRecov001',
      rzpPaymentId: 'pay_RZPtestPaid001',
      recoverySource: 'whatsapp_agent',
      createdAt: new Date(now - 20 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'order_direct_01',
      customerId: 'cust_01',
      cartId: null,
      orderNumber: 'ORD-2026-DIR-002',
      status: 'paid',
      total: 2999.00,
      discount: 0.00,
      finalAmount: 2999.00,
      rzpOrderId: 'order_RZPtestDir002',
      rzpPaymentId: 'pay_RZPtestPaid002',
      recoverySource: 'direct_web',
      createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'order_direct_02',
      customerId: 'cust_02',
      cartId: null,
      orderNumber: 'ORD-2026-DIR-003',
      status: 'paid',
      total: 5497.00,
      discount: 0.00,
      finalAmount: 5497.00,
      rzpOrderId: 'order_RZPtestDir003',
      rzpPaymentId: 'pay_RZPtestPaid003',
      recoverySource: 'direct_web',
      createdAt: new Date(now - 96 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const ord of orders) {
    await db.query(
      `INSERT INTO orders (id, merchant_id, customer_id, cart_id, order_number, status, total_amount, discount_amount, final_amount, currency, razorpay_order_id, razorpay_payment_id, recovery_source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [ord.id, merchantId, ord.customerId, ord.cartId, ord.orderNumber, ord.status, ord.total, ord.discount, ord.finalAmount, 'INR', ord.rzpOrderId, ord.rzpPaymentId, ord.recoverySource, ord.createdAt, ord.createdAt]
    );

    if (ord.status === 'paid') {
      await db.query(
        `INSERT INTO payments (id, order_id, merchant_id, razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, currency, status, method, error_code, error_description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [`pay_${ord.id}`, ord.id, merchantId, ord.rzpPaymentId, ord.rzpOrderId, 'sig_demo_hash_verified', ord.finalAmount, 'INR', 'captured', 'upi', null, null, ord.createdAt]
      );
    }
  }

  // 8. Historical WhatsApp Message & Audit Log for the recovered cart
  await db.query(
    `INSERT INTO whatsapp_messages (id, merchant_id, customer_id, opportunity_id, phone_number, template_name, status, provider_message_id, parameters, recovery_url, sent_at, delivered_at, read_at, failure_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     ON CONFLICT (id) DO NOTHING`,
    [
      'wamsg_recov_01',
      merchantId,
      'cust_03',
      'opp_prior_recov_01',
      '+919811223344',
      'cart_recovery',
      'read',
      'wamid.demo.prior.01',
      JSON.stringify({ customerName: 'Rohan Mehta', discountPercent: 10, discountAmount: 279.80, cartValue: 2798.00 }),
      'http://localhost:5173/checkout/recov_tok_rohan_recovered',
      new Date(now - 22 * 60 * 60 * 1000).toISOString(),
      new Date(now - 21.9 * 60 * 60 * 1000).toISOString(),
      new Date(now - 21.5 * 60 * 60 * 1000).toISOString(),
      null,
      new Date(now - 22 * 60 * 60 * 1000).toISOString(),
      new Date(now - 21.5 * 60 * 60 * 1000).toISOString()
    ]
  );

  // 9. Initial Audit Logs
  const auditEntries = [
    { actor: 'system', actorId: 'razoragent_daemon', event: 'system_initialized', entity: 'system', entityId: 'init', status: 'success', input: {}, output: { version: '1.0.0', mode: 'active' } },
    { actor: 'ai_agent', actorId: 'razoragent_core', event: 'agent_analyzed_checkout', entity: 'cart', entityId: 'cart_recovered_01', status: 'success', input: { cartId: 'cart_recovered_01' }, output: { confidence: 0.85, action: 'send_whatsapp_recovery' } },
    { actor: 'merchant', actorId: 'user_admin_01', event: 'merchant_approved_action', entity: 'action', entityId: 'act_recov_01', status: 'success', input: { discountPercent: 10 }, output: { approved: true } },
    { actor: 'whatsapp_service', actorId: 'meta_cloud_api', event: 'whatsapp_message_sent', entity: 'whatsapp_message', entityId: 'wamsg_recov_01', status: 'success', input: { template: 'cart_recovery' }, output: { messageId: 'wamid.demo.prior.01' } },
    { actor: 'whatsapp_service', actorId: 'meta_webhook', event: 'message_delivered', entity: 'whatsapp_message', entityId: 'wamsg_recov_01', status: 'success', input: {}, output: { status: 'delivered' } },
    { actor: 'razorpay_gateway', actorId: 'rzp_test_mode', event: 'customer_completed_payment', entity: 'order', entityId: 'order_recov_01', status: 'success', input: { paymentId: 'pay_RZPtestPaid001' }, output: { amount: 2518.20 } },
    { actor: 'autopilot_engine', actorId: 'razoragent_core', event: 'revenue_recovered', entity: 'order', entityId: 'order_recov_01', status: 'success', input: { originalCartValue: 2798.00 }, output: { recoveredRevenue: 2518.20 } }
  ];

  for (const aud of auditEntries) {
    await db.query(
      `INSERT INTO audit_logs (id, merchant_id, actor_type, actor_id, event_type, entity_type, entity_id, input_data, output_data, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        `audit_${crypto.randomUUID().slice(0, 8)}`,
        merchantId,
        aud.actor,
        aud.actorId,
        aud.event,
        aud.entity,
        aud.entityId,
        JSON.stringify(aud.input),
        JSON.stringify(aud.output),
        aud.status,
        new Date(now - 20 * 60 * 60 * 1000).toISOString()
      ]
    );
  }

  // 10. Initial Email Communications between Clients & Store Owner
  const seedEmails = [
    {
      id: 'eml_inq_aarav_01',
      customerId: 'cust_01',
      direction: 'inbound',
      senderEmail: 'aarav.sharma@example.com',
      senderName: 'Aarav Sharma',
      recipientEmail: 'support@trendvault.in',
      recipientName: 'TrendVault Store Owner',
      subject: 'Checkout Inquiry: Express Delivery & Pocket Square for Bandhgala Jacket',
      bodyText: 'Hi TrendVault, can you confirm if the Royal Silk Bandhgala Jacket includes an extra pocket square or garment bag? Also wanted to check if delivery to Mumbai can be expedited before Thursday.',
      bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h3 style="color: #4338ca;">Client Inquiry via Checkout Portal</h3>
        <p><strong>From:</strong> Aarav Sharma (aarav.sharma@example.com)</p>
        <p><strong>Cart:</strong> ₹4,298 (2 items)</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p>Hi TrendVault, can you confirm if the Royal Silk Bandhgala Jacket includes an extra pocket square or garment bag? Also wanted to check if delivery to Mumbai can be expedited before Thursday.</p>
      </div>`,
      templateType: 'customer_inquiry',
      status: 'delivered',
      inReplyTo: null,
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'eml_rep_aarav_01',
      customerId: 'cust_01',
      direction: 'outbound',
      senderEmail: 'support@trendvault.in',
      senderName: 'TrendVault Store Support',
      recipientEmail: 'aarav.sharma@example.com',
      recipientName: 'Aarav Sharma',
      subject: 'Re: Checkout Inquiry: Express Delivery & Pocket Square for Bandhgala Jacket',
      bodyText: 'Hi Aarav! Yes, all our Royal Silk Bandhgala Jackets include a complimentary matching pocket square and cedarwood garment bag. For Mumbai delivery, we dispatch via BlueDart Express Air (2 business days).',
      bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h3 style="color: #1e1b4b;">TrendVault Store Support</h3>
        <p>Hi Aarav,</p>
        <p>Thank you for reaching out! Yes, all our Royal Silk Bandhgala Jackets include a complimentary matching pure silk pocket square and a protective cedarwood garment bag.</p>
        <p>For Mumbai deliveries, we dispatch via BlueDart Express Air, which typically arrives within 2 business days. If you complete your checkout today, it will be delivered by Wednesday!</p>
        <p>Warm regards,<br><strong>Vikramaditya Oberoi</strong><br>Founder, TrendVault India</p>
      </div>`,
      templateType: 'merchant_reply',
      status: 'opened',
      inReplyTo: 'eml_inq_aarav_01',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'eml_recov_priya_01',
      customerId: 'cust_02',
      direction: 'outbound',
      senderEmail: 'support@trendvault.in',
      senderName: 'TrendVault VIP Concierge',
      recipientEmail: 'priya.patel@example.com',
      recipientName: 'Priya Patel',
      subject: 'Reserved: Complete your TrendVault India order with 10% off!',
      bodyText: 'Hi Priya, you left items in your cart worth ₹16,200. Complete your purchase with an exclusive 10% discount at: http://localhost:5173/checkout/recov_tok_priya_6499',
      bodyHtml: `<div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #60a5fa;">VIP Cart Reserved: 10% Off</h2>
        <p>Hi Priya, we noticed you left items in your cart. We've applied an exclusive 10% discount for your VIP tier!</p>
        <p><a href="http://localhost:5173/checkout/recov_tok_priya_6499" style="display:inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Complete Order</a></p>
      </div>`,
      templateType: 'cart_recovery',
      status: 'delivered',
      inReplyTo: null,
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'eml_receipt_rohan_01',
      customerId: 'cust_03',
      direction: 'outbound',
      senderEmail: 'billing@trendvault.in',
      senderName: 'TrendVault Billing',
      recipientEmail: 'rohan.mehta@example.com',
      recipientName: 'Rohan Mehta',
      subject: 'Order Confirmed #ORD-2026-9021 — TrendVault India',
      bodyText: 'Hi Rohan, your order #ORD-2026-9021 is confirmed! Amount paid: ₹2,518.20 via Razorpay UPI.',
      bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #059669;">Order Confirmed #ORD-2026-9021</h2>
        <p>Payment ID: pay_RZPtestPaid001 (Razorpay Verified)</p>
        <p>Estimated Delivery: 2-4 business days.</p>
      </div>`,
      templateType: 'order_confirmation',
      status: 'opened',
      inReplyTo: null,
      createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const eml of seedEmails) {
    await db.query(
      `INSERT INTO emails (
        id, merchant_id, customer_id, direction,
        sender_email, sender_name, recipient_email, recipient_name,
        subject, body_text, body_html, template_type,
        status, in_reply_to, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO NOTHING`,
      [
        eml.id,
        merchantId,
        eml.customerId,
        eml.direction,
        eml.senderEmail,
        eml.senderName,
        eml.recipientEmail,
        eml.recipientName,
        eml.subject,
        eml.bodyText,
        eml.bodyHtml,
        eml.templateType,
        eml.status,
        eml.inReplyTo,
        eml.createdAt,
        eml.createdAt
      ]
    );
  }

  // 13. Autopilot Settings
  await db.query(
    `INSERT INTO autopilot_settings (
      id, merchant_id, mode, is_paused, auto_approve_threshold,
      max_auto_discount, channels, require_cart_value_min, recovery_window_hours,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO NOTHING`,
    [
      `auto_set_${merchantId}`,
      merchantId,
      'SEMI_AUTOPILOT',
      false,
      0.80,
      10.00,
      JSON.stringify(['whatsapp', 'email']),
      0.00,
      24,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );

  // 14. Seed Autopilot Events Activity Stream
  const seedAutopilotEvents = [
    {
      id: `evt_init_${Date.now()}_1`,
      merchant_id: merchantId,
      event_type: 'SYSTEM_INITIALIZED',
      severity: 'info',
      summary: 'Autonomous Revenue Autopilot Engine initialized in Semi-Autopilot mode.',
      details: JSON.stringify({ mode: 'SEMI_AUTOPILOT', channels: ['whatsapp', 'email'], safetyCap: '10%' }),
      created_at: new Date(now - 12 * 60 * 1000).toISOString()
    },
    {
      id: `evt_guard_${Date.now()}_2`,
      merchant_id: merchantId,
      event_type: 'GUARDRAILS_ENGAGED',
      severity: 'success',
      summary: 'Strict policy guardrails active: 80% confidence threshold, 10% max auto discount, opt-out enforcement.',
      details: JSON.stringify({ threshold: 0.80, maxDiscount: 10, optOutProtection: true }),
      created_at: new Date(now - 10 * 60 * 1000).toISOString()
    },
    {
      id: `evt_radar_${Date.now()}_3`,
      merchant_id: merchantId,
      event_type: 'RADAR_SCAN_READY',
      severity: 'info',
      summary: 'Multi-channel recovery orchestrator standing by (WhatsApp Cloud API + High-converting Email).',
      details: JSON.stringify({ status: 'active', intervalMinutes: 15 }),
      created_at: new Date(now - 5 * 60 * 1000).toISOString()
    }
  ];

  for (const evt of seedAutopilotEvents) {
    await db.query(
      `INSERT INTO autopilot_events (id, merchant_id, event_type, severity, summary, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [evt.id, evt.merchant_id, evt.event_type, evt.severity, evt.summary, evt.details, evt.created_at]
    );
  }

  console.log('[Seed] Database seeded successfully with merchant, products, customers, carts, orders, emails, autopilot settings, and audit logs!');
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Seed] Error seeding database:', err);
      process.exit(1);
    });
}
