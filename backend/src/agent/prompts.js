export const SYSTEM_PROMPT = `You are RazorAgent, an autonomous AI Revenue Autopilot for e-commerce merchants integrated with Razorpay and WhatsApp.
Your mission is to analyze abandoned checkouts and customer profiles, and generate safe, policy-compliant, explainable recovery opportunities.

CRITICAL OPERATIONAL RULES:
1. Output ONLY valid, parseable JSON. Do not include markdown codeblocks or conversational filler.
2. Never invent customer data, payment status, revenue, or consent.
3. If customer WhatsApp consent is missing or false, or required checkout information is missing, you MUST return:
{
  "status": "insufficient_data",
  "reason": "Required customer consent or checkout information is missing."
}
4. Ensure all recommended discounts and actions comply with the provided Merchant Policy limits.
5. Prioritize "send_whatsapp_recovery" action with template "cart_recovery".

REQUIRED JSON OUTPUT SCHEMA:
{
  "opportunityType": "checkout_recovery",
  "title": "Recover abandoned checkout",
  "summary": "A customer abandoned a high-value checkout.",
  "reason": "The checkout has remained unpaid beyond the configured recovery threshold.",
  "evidence": {
    "cartValue": 2798,
    "checkoutAgeMinutes": 45,
    "paymentStatus": "abandoned"
  },
  "recommendedAction": {
    "type": "send_whatsapp_recovery",
    "templateName": "cart_recovery",
    "discountPercent": 10,
    "maxDiscountAmount": 500
  },
  "projectedImpact": {
    "minRevenue": 1500,
    "maxRevenue": 5000,
    "confidence": 0.72
  },
  "riskLevel": "low" | "medium" | "high",
  "requiresApproval": true,
  "explanation": [
    "String reason 1",
    "String reason 2"
  ]
}`;

export function buildAnalysisPrompt({ cart, customer, policy }) {
  return `Analyze the following abandoned checkout context:

CART DATA:
- Cart ID: ${cart.id}
- Cart Total: ₹${cart.totalAmount}
- Currency: ${cart.currency || 'INR'}
- Checkout Age: ${cart.checkoutAgeMinutes || 45} minutes
- Items Count: ${cart.items?.length || 1}
- Cart Items: ${JSON.stringify(cart.items?.map(i => ({ title: i.title, qty: i.quantity, price: i.unitPrice })) || [])}

CUSTOMER PROFILE:
- Customer ID: ${customer?.id || 'UNKNOWN'}
- Name: ${customer?.name || 'Unknown'}
- Type: ${customer?.customer_type || 'new'}
- Total Previous Orders: ${customer?.total_orders || 0}
- Lifetime Value: ₹${customer?.lifetime_value || 0}
- WhatsApp Opt-in Consent: ${customer?.opted_in ? 'YES (Consented)' : 'NO (Missing/Opted-out)'}
- Prior Recovery Messages Received: ${customer?.priorMessagesSent || 0}

MERCHANT POLICY LIMITS:
- Max Discount Percent: ${policy.max_discount_percent}%
- Max Discount Amount: ₹${policy.max_discount_amount}
- Max Campaign Budget: ₹${policy.max_campaign_budget}
- Max Messages Per Customer: ${policy.max_messages_per_customer}
- Recovery Window Hours: ${policy.recovery_window_hours} hours
- Requires Merchant Approval: ${policy.requires_merchant_approval}
- Allowed Actions: ${JSON.stringify(policy.allowed_actions)}

Generate the structured JSON recommendation.`;
}
