import { config } from '../config/env.js';
import { db } from '../config/database.js';

export class ChatService {
  /**
   * Main entrypoint for processing chat messages
   */
  static async processMessage({ message, context = 'customer', cartToken = null, history = [] }) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();

    // 1. Fetch Cart Context if customer and cartToken provided
    let cartContext = null;
    if (cartToken) {
      cartContext = await this._resolveCartContext(cartToken);
    }

    // 2. Try configured LLM (OpenAI / Ollama) if real key is available
    const hasRealOpenAI = config.openaiApiKey && 
      !config.openaiApiKey.includes('your_') && 
      !config.openaiApiKey.includes('placeholder') &&
      config.openaiApiKey.startsWith('sk-');

    if (hasRealOpenAI) {
      try {
        const aiResponse = await this._callOpenAI({ message: cleanMsg, context, cartContext, history });
        if (aiResponse) return aiResponse;
      } catch (err) {
        console.warn('[ChatService] OpenAI call failed, falling back to deterministic knowledge base:', err.message);
      }
    } else if (config.aiProvider === 'ollama') {
      try {
        const aiResponse = await this._callOllama({ message: cleanMsg, context, cartContext, history });
        if (aiResponse) return aiResponse;
      } catch (err) {
        console.warn('[ChatService] Ollama call failed, falling back to deterministic knowledge base:', err.message);
      }
    }

    // 3. Deterministic Knowledge & Troubleshooting Engine (Zero Dependencies, 100% Reliable)
    return this._runDeterministicKnowledgeEngine({ message: cleanMsg, lower, context, cartContext });
  }

  /**
   * Resolves cart and customer details for real-time personalization
   */
  static async _resolveCartContext(cartToken) {
    try {
      const cartRes = await db.query(
        `SELECT c.*, cust.name as customer_name, cust.phone as customer_phone, cust.email as customer_email
         FROM carts c
         LEFT JOIN customers cust ON c.customer_id = cust.id
         WHERE c.recovery_token = $1 OR c.id = $1 LIMIT 1`,
        [cartToken]
      );

      if (cartRes.rows.length === 0) return null;
      const cart = cartRes.rows[0];

      const itemsRes = await db.query(
        `SELECT ci.*, p.title as product_title, p.price as unit_price
         FROM cart_items ci
         LEFT JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = $1`,
        [cart.id]
      );

      return {
        cartId: cart.id,
        customerName: cart.customer_name || 'Valued Shopper',
        customerPhone: cart.customer_phone,
        totalAmount: Number(cart.total_amount),
        status: cart.status,
        recoveryToken: cart.recovery_token,
        items: itemsRes.rows.map(i => ({
          title: i.product_title || 'Store Item',
          quantity: i.quantity,
          price: Number(i.unit_price || i.total_price)
        }))
      };
    } catch (e) {
      console.warn('[ChatService] Error resolving cart context:', e.message);
      return null;
    }
  }

  /**
   * Deterministic Knowledge & Issue Troubleshooting Engine
   */
  static _runDeterministicKnowledgeEngine({ message, lower, context, cartContext }) {
    const custName = cartContext?.customerName || 'there';
    const cartTotal = cartContext ? `₹${cartContext.totalAmount.toLocaleString('en-IN')}` : 'your order';
    const itemsList = cartContext?.items?.map(i => `${i.quantity}x ${i.title}`).join(', ') || 'selected items';

    // =========================================================================
    // CUSTOMER / CHECKOUT RECOVERY CONTEXT
    // =========================================================================
    if (context === 'customer') {
      // 1. PAYMENT FAILURE / DEBIT ISSUES
      if (
        lower.includes('fail') ||
        lower.includes('decline') ||
        lower.includes('deduct') ||
        lower.includes('debited') ||
        lower.includes('error') ||
        lower.includes('stuck') ||
        lower.includes('declined')
      ) {
        return {
          role: 'assistant',
          category: 'PAYMENT_TROUBLESHOOTING',
          title: 'Payment Issue Resolution',
          content: `Hi ${custName}, sorry to hear your payment encountered an issue! Here is how to quickly resolve it:\n\n` +
            `1. **If money was deducted from your bank/UPI**:\n` +
            `   - Razorpay gateways automatically reconcile bank transactions. If the order was not marked as paid, your bank will release the auto-refund within 24–48 hours.\n\n` +
            `2. **How to complete your order now**:\n` +
            `   - Click the green **"Pay with Razorpay Test Mode"** button below.\n` +
            `   - Select **UPI (Google Pay / PhonePe / Paytm)** or **Test Card** (e.g. \`4012 0000 0000 0002\` with any future expiry).\n\n` +
            `3. **Still having trouble?**\n` +
            `   - Your cart items (${itemsList}) are safely reserved for 24 hours.`,
          actionSuggestions: [
            { label: 'Retry Payment Now', action: 'trigger_payment' },
            { label: 'Check Payment Methods', action: 'show_methods' },
            { label: 'Contact Support', action: 'show_support' }
          ]
        };
      }

      // 2. PAYMENT METHODS & UPI
      if (
        lower.includes('payment method') ||
        lower.includes('upi') ||
        lower.includes('google pay') ||
        lower.includes('gpay') ||
        lower.includes('phonepe') ||
        lower.includes('paytm') ||
        lower.includes('card') ||
        lower.includes('cod') ||
        lower.includes('cash on delivery') ||
        lower.includes('netbanking')
      ) {
        return {
          role: 'assistant',
          category: 'PAYMENT_METHODS',
          title: 'Supported Payment Options',
          content: `We support all major payment modes through our secure **Razorpay** checkout:\n\n` +
            `• **UPI**: Google Pay, PhonePe, Paytm, BHIM, and any bank UPI ID.\n` +
            `• **Cards**: Visa, MasterCard, RuPay, and American Express (Credit & Debit).\n` +
            `• **NetBanking**: 50+ Indian banks including HDFC, SBI, ICICI, Axis, and Kotak.\n` +
            `• **Wallets**: Amazon Pay, Mobikwik, Airtel Money.\n\n` +
            `*(Note: For this checkout, you are in Razorpay Test Mode — you can test without real charges).*`,
          actionSuggestions: [
            { label: 'Proceed to Payment', action: 'trigger_payment' },
            { label: 'Check Applied Discount', action: 'check_discount' }
          ]
        };
      }

      // 3. DISCOUNT & COUPON QUESTIONS
      if (
        lower.includes('discount') ||
        lower.includes('coupon') ||
        lower.includes('promo') ||
        lower.includes('code') ||
        lower.includes('offer') ||
        lower.includes('save')
      ) {
        return {
          role: 'assistant',
          category: 'DISCOUNT_INFO',
          title: 'Applied Recovery Discount',
          content: `Good news ${custName}! Your recovery discount has already been **automatically applied** to your checkout session.\n\n` +
            (cartContext 
              ? `• **Original Cart Value**: ${cartTotal}\n• **Reserved Items**: ${itemsList}\n• **No promo code needed**: The special incentive is already deducted from your checkout total!`
              : `• Your exclusive discount from the WhatsApp recovery notification is already factored into this secure payment link. No coupon entry required!`),
          actionSuggestions: [
            { label: 'Complete Order Now', action: 'trigger_payment' },
            { label: 'Delivery Timelines', action: 'check_delivery' }
          ]
        };
      }

      // 4. DELIVERY & SHIPPING QUESTIONS
      if (
        lower.includes('deliver') ||
        lower.includes('shipping') ||
        lower.includes('track') ||
        lower.includes('when') ||
        lower.includes('days') ||
        lower.includes('address')
      ) {
        return {
          role: 'assistant',
          category: 'SHIPPING_DELIVERY',
          title: 'Delivery & Shipping Information',
          content: `Here are our shipping details for **TrendVault India**:\n\n` +
            `• **Standard Delivery**: 2 to 4 business days across metro cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai).\n` +
            `• **Rest of India**: 4 to 6 business days.\n` +
            `• **Logistics Partners**: BlueDart, Delhivery, Expressbees.\n` +
            `• **Live Tracking**: As soon as payment completes, you'll receive a real-time WhatsApp & SMS tracking link with your AWB number.`,
          actionSuggestions: [
            { label: 'Proceed to Payment', action: 'trigger_payment' },
            { label: 'Return & Refund Policy', action: 'check_refund' }
          ]
        };
      }

      // 5. RETURN, REFUND & CANCELLATION POLICY
      if (
        lower.includes('return') ||
        lower.includes('refund') ||
        lower.includes('cancel') ||
        lower.includes('exchange')
      ) {
        return {
          role: 'assistant',
          category: 'REFUND_POLICY',
          title: '7-Day Return & Refund Guarantee',
          content: `We offer a 100% risk-free shopping guarantee:\n\n` +
            `• **7-Day Hassle-Free Returns**: If you are not satisfied with your purchase, you can initiate a return or exchange within 7 days of delivery.\n` +
            `• **Instant Refunds**: Once approved, refunds are credited directly back to your original payment method via Razorpay within 2–5 business days.\n` +
            `• **Reverse Pickup**: Free doorstep pickup for all returns.`,
          actionSuggestions: [
            { label: 'Complete Order with Confidence', action: 'trigger_payment' },
            { label: 'Is Payment Secure?', action: 'check_security' }
          ]
        };
      }

      // 6. SECURITY & TRUST
      if (
        lower.includes('secure') ||
        lower.includes('safe') ||
        lower.includes('legit') ||
        lower.includes('trust') ||
        lower.includes('razorpay')
      ) {
        return {
          role: 'assistant',
          category: 'SECURITY_TRUST',
          title: 'Bank-Grade Payment Security',
          content: `Your transaction is 100% secure:\n\n` +
            `• **PCI-DSS Level 1 Compliant**: Highest certification in the global payment processing industry.\n` +
            `• **256-Bit TLS Encryption**: End-to-end cryptographic protection for all payment credentials.\n` +
            `• **Razorpay Verified Gateway**: TrendVault India partners with Razorpay for automated escrow reconciliation and buyer protection.`,
          actionSuggestions: [
            { label: 'Pay Securely Now', action: 'trigger_payment' }
          ]
        };
      }

      // 7. DEFAULT HELPFUL FALLBACK FOR SHOPPERS
      return {
        role: 'assistant',
        category: 'GENERAL_SUPPORT',
        title: 'Customer Concierge',
        content: `Hi ${custName}! I am your AI Shopping Assistant for **TrendVault India**.\n\n` +
          `I can help you with:\n` +
          `• Fixing payment issues & UPI/Card troubleshooting\n` +
          `• Explaining your applied discount (${cartTotal})\n` +
          `• Delivery timelines and return/refund policies\n\n` +
          `What can I help you resolve today?`,
        actionSuggestions: [
          { label: 'How to pay with UPI / Cards?', action: 'show_methods' },
          { label: 'Is my discount applied?', action: 'check_discount' },
          { label: 'When will it be delivered?', action: 'check_delivery' },
          { label: 'What is the refund policy?', action: 'check_refund' }
        ]
      };
    }

    // =========================================================================
    // MERCHANT / ADMIN CONTEXT
    // =========================================================================
    if (context === 'merchant') {
      // 1. POLICY GUARDRAIL QUESTIONS
      if (
        lower.includes('policy') ||
        lower.includes('blocked') ||
        lower.includes('guardrail') ||
        lower.includes('cap') ||
        lower.includes('limit')
      ) {
        return {
          role: 'assistant',
          category: 'MERCHANT_POLICY',
          title: 'Policy Guardrails & Blocking Diagnostics',
          content: `RazorAgent enforces 7 strict merchant policy guardrails before executing any recovery action:\n\n` +
            `1. **Allowed Action Types**: Must be within \`allowed_actions\` (e.g. \`send_whatsapp_recovery\`).\n` +
            `2. **Max Discount Percent**: Action discount must not exceed policy limit (e.g. 15%).\n` +
            `3. **Max Amount Cap**: Calculated discount must be below \`max_discount_amount\` (e.g. ₹500).\n` +
            `4. **Merchant Approval**: Actions with risk level or high discount require human sign-off.\n` +
            `5. **WhatsApp Opt-in Consent**: Customer must have \`opted_in = true\` (DPDP compliance).\n` +
            `6. **Frequency Capping**: Maximum 1 recovery message per customer per window to avoid spam.\n` +
            `7. **Recovery Window**: Checkout must not be older than policy hours (e.g. 24h–48h).\n\n` +
            `💡 *To change limits, you can type: "Update policy to set max discount to 15%" in the AI Agent Hub.*`,
          actionSuggestions: [
            { label: 'View Policy Settings', action: 'open_settings' },
            { label: 'Go to Approval Queue', action: 'open_queue' }
          ]
        };
      }

      // 2. RAZORPAY WEBHOOK & TEST MODE SETUP
      if (
        lower.includes('webhook') ||
        lower.includes('razorpay') ||
        lower.includes('hmac') ||
        lower.includes('signature') ||
        lower.includes('secret') ||
        lower.includes('test mode')
      ) {
        return {
          role: 'assistant',
          category: 'RAZORPAY_SETUP',
          title: 'Razorpay Webhook & Payment Verification',
          content: `Here is how RazorAgent integrates with Razorpay Test Mode:\n\n` +
            `• **Endpoint**: \`POST /api/checkout/webhook\`\n` +
            `• **Webhook Secret**: Configured via \`RAZORPAY_WEBHOOK_SECRET\` in \`backend/.env\`.\n` +
            `• **Signature Verification**: Verifies incoming \`x-razorpay-signature\` header using genuine HMAC-SHA256 of the raw body payload.\n` +
            `• **Supported Events**:\n` +
            `   - \`payment.captured\` -> Marks order as paid, attributes recovery source to AI Agent, and logs immutable audit trail.\n` +
            `   - \`payment.failed\` -> Flags recovery opportunity for re-engagement reminder.\n\n` +
            `💡 *In Demo Mode, test card details: Number: \`4012 0000 0000 0002\`, Expiry: Any future date, CVV: \`123\`.*`,
          actionSuggestions: [
            { label: 'View Orders & Settlements', action: 'open_orders' },
            { label: 'Run 1-Click Demo Scenario', action: 'open_demo' }
          ]
        };
      }

      // 3. WHATSAPP TEMPLATES & OPT-IN
      if (
        lower.includes('whatsapp') ||
        lower.includes('opt-in') ||
        lower.includes('opt in') ||
        lower.includes('opt-out') ||
        lower.includes('meta') ||
        lower.includes('template')
      ) {
        return {
          role: 'assistant',
          category: 'WHATSAPP_GOVERNANCE',
          title: 'WhatsApp Recovery & DPDP Compliance',
          content: `RazorAgent WhatsApp Architecture:\n\n` +
            `• **Certified Demo Mode**: Enabled by default (\`WHATSAPP_DEMO_MODE=true\`). Simulates WhatsApp Cloud API with zero external dependencies and displays live WhatsApp message bubble previews.\n` +
            `• **Approved Template Format**: Uses Meta-compliant \`cart_recovery\` template with dynamic placeholders for customer name, cart value, discount savings, and secure recovery link.\n` +
            `• **Opt-out Management**: Automatically handles "STOP" keywords to immediately update customer consent to \`opted_in = false\`.\n` +
            `• **Live Meta Cloud API Mode**: To switch to live dispatch, provide \`WHATSAPP_PHONE_NUMBER_ID\` and \`WHATSAPP_ACCESS_TOKEN\` in \`backend/.env\`.`,
          actionSuggestions: [
            { label: 'Open WhatsApp Recovery Hub', action: 'open_whatsapp' },
            { label: 'Audit Customer Consents', action: 'audit_consents' }
          ]
        };
      }

      // 4. REVENUE RECOVERY & AI PROPENSITY
      if (
        lower.includes('propensity') ||
        lower.includes('confidence') ||
        lower.includes('recovery rate') ||
        lower.includes('roi') ||
        lower.includes('revenue') ||
        lower.includes('abandoned')
      ) {
        return {
          role: 'assistant',
          category: 'REVENUE_INTELLIGENCE',
          title: 'AI Propensity & Recovery Confidence Score',
          content: `How RazorAgent calculates Recovery Confidence:\n\n` +
            `• **Baseline Confidence**: 65% for standard checkout drop-offs.\n` +
            `• **Customer Loyalty Lift**: +15% if customer is VIP or has >2 previous orders.\n` +
            `• **Offer Sweetener**: +8% if recovery discount is >= 10%.\n` +
            `• **Checkout Recency**: Highest conversion within 30–90 minutes of abandonment.\n\n` +
            `The projected recovery formula predicts: \`Expected Revenue = Cart Value * (1 - Discount%) * Confidence\`.\n` +
            `This ensures merchants only offer incentives where margin return is demonstrably positive.`,
          actionSuggestions: [
            { label: 'Go to AI Agent Hub', action: 'open_agent' },
            { label: 'Check Revenue Analytics', action: 'open_dashboard' }
          ]
        };
      }

      // 5. DEFAULT MERCHANT FALLBACK
      return {
        role: 'assistant',
        category: 'MERCHANT_ASSISTANT',
        title: 'Merchant Support Copilot',
        content: `Hi Admin! I am your **RazorAgent Merchant Copilot**.\n\n` +
          `I can help you troubleshoot and optimize your store:\n` +
          `• **Policy Guardrails**: Explain why recovery actions were blocked or adjust limits.\n` +
          `• **Razorpay Setup**: Webhook configuration, test cards, and payment signature verification.\n` +
          `• **WhatsApp Governance**: Template compliance, DPDP opt-ins, and delivery simulation.\n` +
          `• **Autonomous Agent**: Triggering scans, triaging queue actions, and checking ROI.\n\n` +
          `What issue or question would you like to explore?`,
        actionSuggestions: [
          { label: 'Why was an action blocked?', action: 'explain_policy' },
          { label: 'How to verify Razorpay webhooks?', action: 'explain_webhook' },
          { label: 'How does WhatsApp opt-in work?', action: 'explain_whatsapp' },
          { label: 'How is recovery confidence calculated?', action: 'explain_propensity' }
        ]
      };
    }

    // Default fallback
    return {
      role: 'assistant',
      category: 'GENERAL',
      title: 'RazorAgent Assistant',
      content: 'I am here to help you resolve any checkout, payment, or merchant store operations issues. What can I help you with?',
      actionSuggestions: []
    };
  }

  /**
   * OpenAI Chat Integration (if configured)
   */
  static async _callOpenAI({ message, context, cartContext, history }) {
    const systemPrompt = `You are RazorAgent AI Assistant, an empathetic and highly knowledgeable support specialist for a modern Indian D2C eCommerce store (TrendVault India) integrated with Razorpay payments and WhatsApp commerce.
Role Context: ${context === 'customer' ? 'Customer on checkout/recovery page' : 'Merchant Store Admin on dashboard'}.
Cart Info: ${cartContext ? JSON.stringify(cartContext) : 'None provided'}.
Keep responses helpful, structured, concise, and professional with actionable steps. Always adhere to Indian payment ecosystem standards (UPI, Cards, Razorpay).`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
    const data = await response.json();
    return {
      role: 'assistant',
      category: 'AI_GENERATED',
      title: 'AI Support Assistant',
      content: data.choices[0].message.content,
      actionSuggestions: []
    };
  }

  /**
   * Ollama Chat Integration (if configured)
   */
  static async _callOllama({ message, context, cartContext, history }) {
    const systemPrompt = `You are RazorAgent AI Assistant for TrendVault India. Context: ${context}. Cart: ${JSON.stringify(cartContext || {})}.`;
    const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollamaModel,
        system: systemPrompt,
        prompt: message,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    return {
      role: 'assistant',
      category: 'OLLAMA_GENERATED',
      title: 'AI Support Assistant',
      content: data.response,
      actionSuggestions: []
    };
  }

  /**
   * Provides FAQs and starter questions based on context
   */
  static getFaqs(context = 'customer') {
    if (context === 'customer') {
      return [
        { q: 'How do I pay with UPI or Google Pay?', a: 'Click the green Pay with Razorpay button and choose UPI.' },
        { q: 'What if money was debited but order didn’t confirm?', a: 'Razorpay reconciles automatically. Any excess debit auto-refunds within 24-48h.' },
        { q: 'Is my recovery discount applied?', a: 'Yes! The WhatsApp recovery discount is pre-applied to your checkout.' },
        { q: 'When will my order be delivered?', a: '2-4 business days across metro cities via BlueDart/Delhivery.' },
        { q: 'What is your return & refund policy?', a: '7-day hassle-free returns with instant reverse refund.' }
      ];
    }
    return [
      { q: 'Why was an action blocked by policy?', a: 'Policy guardrails enforce discount caps, opt-in consent, and frequency limits.' },
      { q: 'How to configure Razorpay webhooks?', a: 'Set webhook endpoint to /api/checkout/webhook with payment.captured event.' },
      { q: 'How does WhatsApp opt-in compliance work?', a: 'Customers must opt-in to receive templates; STOP keywords immediately opt them out.' },
      { q: 'How does the AI Agent compute recovery confidence?', a: 'Combines baseline recency, customer loyalty tier, and discount incentive.' }
    ];
  }
}
