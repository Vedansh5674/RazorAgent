import test from 'node:test';
import assert from 'node:assert';
import { AIService } from '../src/services/aiService.js';

test('AIService Structured Output & Guardrails Suite', async (t) => {
  const policy = {
    max_discount_percent: 10,
    max_discount_amount: 500,
    requires_merchant_approval: true
  };

  await t.test('generates strictly compliant structured JSON recommendation', async () => {
    const cart = {
      id: 'cart_test_01',
      totalAmount: 2798,
      currency: 'INR',
      checkoutAgeMinutes: 45,
      items: [{ title: 'Headphones', quantity: 1, unitPrice: 2798 }]
    };

    const customer = {
      id: 'cust_test_01',
      name: 'Rohan Sharma',
      customer_type: 'returning',
      total_orders: 2,
      lifetime_value: 5000,
      opted_in: true,
      priorMessagesSent: 0
    };

    const result = await AIService.analyzeOpportunity({ cart, customer, policy });

    assert.strictEqual(result.opportunityType, 'checkout_recovery');
    assert.strictEqual(typeof result.title, 'string');
    assert.strictEqual(typeof result.summary, 'string');
    assert.strictEqual(typeof result.reason, 'string');
    assert.ok(result.evidence, 'Evidence object must be present');
    assert.strictEqual(result.evidence.cartValue, 2798);
    assert.strictEqual(result.evidence.paymentStatus, 'abandoned');
    assert.ok(result.recommendedAction, 'Recommended action must be present');
    assert.strictEqual(result.recommendedAction.type, 'send_whatsapp_recovery');
    assert.strictEqual(result.recommendedAction.templateName, 'cart_recovery');
    assert.ok(result.recommendedAction.discountPercent <= policy.max_discount_percent);
    assert.ok(result.recommendedAction.maxDiscountAmount <= policy.max_discount_amount);
    assert.ok(result.projectedImpact, 'Projected impact must be present');
    assert.ok(result.projectedImpact.confidence > 0 && result.projectedImpact.confidence <= 1);
    assert.ok(['low', 'medium', 'high'].includes(result.riskLevel));
    assert.strictEqual(result.requiresApproval, true);
    assert.ok(Array.isArray(result.explanation));
    assert.ok(result.explanation.length >= 2);
  });

  await t.test('returns insufficient_data when customer consent is missing or false', async () => {
    const cart = { id: 'cart_test_02', totalAmount: 3500 };
    const customer = { id: 'cust_optout_01', opted_in: false };

    const result = await AIService.analyzeOpportunity({ cart, customer, policy });

    assert.strictEqual(result.status, 'insufficient_data');
    assert.match(result.reason, /Required customer consent or checkout information is missing/i);
  });
});
