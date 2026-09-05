import { db } from '../config/database.js';
import crypto from 'crypto';

export class CustomerSegmentationService {
  static async getSegmentedCustomers(merchantId, filterSegment = null) {
    if (!merchantId) throw new Error('merchantId is required');

    const [custRes, ordersRes, cartsRes, consentsRes] = await Promise.all([
      db.query(`SELECT * FROM customers WHERE merchant_id = $1 ORDER BY created_at DESC`, [merchantId]),
      db.query(`SELECT * FROM orders WHERE merchant_id = $1 AND status = 'paid' ORDER BY created_at DESC`, [merchantId]),
      db.query(`SELECT * FROM carts WHERE merchant_id = $1 ORDER BY created_at DESC`, [merchantId]),
      db.query(`SELECT * FROM customer_consents WHERE merchant_id = $1`, [merchantId])
    ]);

    const customers = custRes.rows;
    const orders = ordersRes.rows;
    const carts = cartsRes.rows;
    const consents = consentsRes.rows;

    const consentsMap = {};
    consents.forEach(c => {
      consentsMap[c.customer_id] = Boolean(c.opted_in);
    });

    const segmentedCustomers = customers.map(cust => {
      const custOrders = orders.filter(o => o.customer_id === cust.id);
      const custCarts = carts.filter(c => c.customer_id === cust.id);
      const abandonedCart = custCarts.find(c => c.status === 'abandoned');

      const totalSpent = custOrders.reduce((sum, o) => sum + Number(o.final_amount || 0), 0) || Number(cust.lifetime_value || 0);
      const ordersCount = custOrders.length || Number(cust.total_orders || 0);

      const lastOrder = custOrders[0];
      const lastOrderDate = lastOrder?.created_at || cust.updated_at || cust.created_at;
      const daysSinceLastOrder = Math.max(0, Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)));

      let segment = 'New Customers';
      let recommendedAction = 'Send VIP Welcome message & 10% first-purchase coupon via WhatsApp';

      if (totalSpent >= 15000 || ordersCount >= 6 || cust.customer_type === 'vip') {
        segment = 'VIP Customers';
        recommendedAction = 'Send exclusive early-access preview of new catalog arrivals with priority delivery';
      } else if (ordersCount >= 3 || cust.customer_type === 'loyal') {
        segment = 'Loyal Customers';
        recommendedAction = 'Invite to Store Loyalty Club & cross-sell complementary accessories';
      } else if (abandonedCart || cust.customer_type === 'high_intent') {
        segment = 'High-Intent Customers';
        recommendedAction = `Send cart recovery reminder for ${abandonedCart ? '₹' + Number(abandonedCart.total_amount).toLocaleString('en-IN') : 'active cart'} with 10% discount link`;
      } else if (daysSinceLastOrder >= 90 || cust.customer_type === 'churned') {
        segment = 'Churned Customers';
        recommendedAction = 'Launch deep re-engagement campaign with 15% comeback incentive';
      } else if (daysSinceLastOrder >= 40 || cust.customer_type === 'at_risk') {
        segment = 'At-Risk Customers';
        recommendedAction = 'Send personalized win-back check-in featuring top-selling trending products';
      } else if (totalSpent >= 5000 || (ordersCount > 0 && totalSpent / ordersCount >= 2500)) {
        segment = 'High-Value Customers';
        recommendedAction = 'Offer personalized complimentary upgrade on orders over ₹3,000';
      }

      const estimatedLtv = totalSpent > 0 ? Math.round(totalSpent * 1.35) : 3499;

      return {
        ...cust,
        totalOrders: ordersCount,
        total_orders: ordersCount,
        totalSpent,
        total_spent: totalSpent,
        lastOrderDate,
        last_order_date: lastOrderDate,
        daysSinceLastOrder,
        segment,
        estimatedLtv,
        ltv: estimatedLtv,
        recommendedNextAction: recommendedAction,
        recommended_action: recommendedAction,
        whatsappOptedIn: consentsMap[cust.id] ?? true,
        hasAbandonedCart: Boolean(abandonedCart)
      };
    });

    const segmentCounts = {
      'All': segmentedCustomers.length,
      'New Customers': segmentedCustomers.filter(c => c.segment === 'New Customers').length,
      'Loyal Customers': segmentedCustomers.filter(c => c.segment === 'Loyal Customers').length,
      'VIP Customers': segmentedCustomers.filter(c => c.segment === 'VIP Customers').length,
      'High-Value Customers': segmentedCustomers.filter(c => c.segment === 'High-Value Customers').length,
      'At-Risk Customers': segmentedCustomers.filter(c => c.segment === 'At-Risk Customers').length,
      'Churned Customers': segmentedCustomers.filter(c => c.segment === 'Churned Customers').length,
      'High-Intent Customers': segmentedCustomers.filter(c => c.segment === 'High-Intent Customers').length
    };

    const filtered = filterSegment && filterSegment !== 'All'
      ? segmentedCustomers.filter(c => c.segment.toLowerCase().includes(filterSegment.toLowerCase()))
      : segmentedCustomers;

    return {
      segmentCounts,
      summary: {
        totalCustomers: segmentedCustomers.length,
        ...segmentCounts
      },
      customers: filtered
    };
  }

  static async createSegmentCampaign(merchantId, options = {}) {
    if (!merchantId) throw new Error('merchantId is required');

    const segment = options.segment || options.segmentName || 'At-Risk Customers';
    const channel = options.channel || 'whatsapp';
    const discountPercent = options.discountPercent || 10;
    const campaignTitle = options.campaignTitle || options.title;
    const customMessage = options.customMessage || options.messageTemplate;

    const { customers } = await this.getSegmentedCustomers(merchantId, segment);
    const targetCount = customers.length || 1;
    const estImpact = Math.round(customers.reduce((sum, c) => sum + (c.estimatedLtv * 0.15), 0) || 12500);

    const actionId = `act_seg_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const now = new Date().toISOString();

    const title = campaignTitle || `${segment} Target Campaign`;
    const reason = `Targeting ${targetCount} ${segment} to drive repeat purchases and increase retention revenue.`;

    const payload = {
      title,
      reason,
      priority: segment.includes('VIP') || segment.includes('At-Risk') ? 'High' : 'Medium',
      estimatedImpact: estImpact,
      targetCustomers: targetCount,
      targetSegment: segment,
      channel,
      discountPercent,
      customMessage: customMessage || `Hi {name}, we reserved an exclusive ${discountPercent}% perk on your next order.`,
      customers: customers.map(c => ({ id: c.id, name: c.name, phone: c.phone }))
    };

    await db.query(
      `INSERT INTO actions (
        id, merchant_id, type, status, payload, executed_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actionId,
        merchantId,
        'SEGMENT_WINBACK_CAMPAIGN',
        'suggested',
        JSON.stringify(payload),
        null,
        now,
        now
      ]
    );

    const action = {
      id: actionId,
      actionId,
      action_type: 'SEGMENT_WINBACK_CAMPAIGN',
      merchant_id: merchantId,
      status: 'suggested',
      title,
      reason,
      channel,
      priority: payload.priority,
      estimated_impact: estImpact,
      target_customers: targetCount,
      payload
    };

    return {
      actionId,
      action,
      status: 'suggested',
      title,
      targetCount,
      targetedCount: targetCount,
      estimatedImpact: estImpact,
      message: `Campaign for ${targetCount} ${segment} added to AI Action Center as a suggested action.`
    };
  }
}
