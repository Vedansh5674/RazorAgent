import { config } from '../config/env.js';
import { SYSTEM_PROMPT, buildAnalysisPrompt } from '../agent/prompts.js';

export class AIService {
  /**
   * Main entry point for AI analysis: Ollama -> Cloud AI -> Rule-based Fallback
   */
  static async analyzeOpportunity({ cart, customer, policy }) {
    // 1. Check for missing critical data / consent right away
    if (!customer || !customer.opted_in || !cart || !cart.totalAmount) {
      return {
        status: 'insufficient_data',
        reason: 'Required customer consent or checkout information is missing.'
      };
    }

    // Try configured AI Provider
    if (config.aiProvider === 'ollama') {
      try {
        const result = await this._callOllama({ cart, customer, policy });
        if (result && !result.error) return result;
      } catch (err) {
        console.warn('[AIService] Ollama request failed, using deterministic agent fallback:', err.message);
      }
    } else if (config.aiProvider === 'openai' && config.openaiApiKey) {
      try {
        const result = await this._callOpenAI({ cart, customer, policy });
        if (result && !result.error) return result;
      } catch (err) {
        console.warn('[AIService] OpenAI request failed, using deterministic agent fallback:', err.message);
      }
    }

    // Deterministic Rule-Based Fallback Engine (Zero dependencies, guaranteed compliant JSON)
    return this._runDeterministicAnalysis({ cart, customer, policy });
  }

  /**
   * Ollama API caller
   */
  static async _callOllama({ cart, customer, policy }) {
    const prompt = buildAnalysisPrompt({ cart, customer, policy });
    const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollamaModel,
        system: SYSTEM_PROMPT,
        prompt,
        format: 'json',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = await response.json();
    const rawJson = data.response;
    return JSON.parse(rawJson);
  }

  /**
   * OpenAI API caller
   */
  static async _callOpenAI({ cart, customer, policy }) {
    const prompt = buildAnalysisPrompt({ cart, customer, policy });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned status ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  /**
   * Deterministic Rule-Based Agent Engine
   * Conforms exactly to Section 5 of Buildathon specifications
   */
  static _runDeterministicAnalysis({ cart, customer, policy }) {
    const cartValue = Number(cart.totalAmount || 0);
    const checkoutAge = Number(cart.checkoutAgeMinutes || 45);

    // Calculate compliant discount within policy limits
    const maxAllowedPercent = Number(policy.max_discount_percent || 10);
    const maxAllowedAmount = Number(policy.max_discount_amount || 500);

    let recommendedPercent = 10;
    if (customer.customer_type === 'vip') {
      recommendedPercent = Math.min(maxAllowedPercent, 10);
    } else if (cartValue > 3000) {
      recommendedPercent = Math.min(maxAllowedPercent, 10);
    } else {
      recommendedPercent = Math.min(maxAllowedPercent, 5);
    }

    const calculatedDiscountAmount = Math.min(
      Math.round((cartValue * recommendedPercent) / 100),
      maxAllowedAmount
    );

    // Dynamic recovery confidence
    let confidence = 0.72;
    if (customer.customer_type === 'vip') confidence = 0.86;
    else if (customer.total_orders > 0) confidence = 0.78;
    if (checkoutAge < 60) confidence = Math.min(0.92, confidence + 0.06);

    const minRevenue = Math.round(cartValue * 0.6);
    const maxRevenue = Math.round(cartValue * 1.05);

    const riskLevel = cartValue > 4000 ? 'low' : (checkoutAge > 120 ? 'medium' : 'low');

    return {
      opportunityType: 'checkout_recovery',
      title: 'Recover abandoned checkout',
      summary: `Customer ${customer.name || ''} abandoned a cart of ₹${cartValue.toLocaleString('en-IN')}.`,
      reason: `The checkout has remained unpaid for ${checkoutAge} minutes, beyond the configured recovery threshold.`,
      evidence: {
        cartValue,
        checkoutAgeMinutes: checkoutAge,
        paymentStatus: 'abandoned'
      },
      recommendedAction: {
        type: 'send_whatsapp_recovery',
        templateName: 'cart_recovery',
        discountPercent: recommendedPercent,
        maxDiscountAmount: calculatedDiscountAmount
      },
      projectedImpact: {
        minRevenue,
        maxRevenue,
        confidence: Number(confidence.toFixed(2))
      },
      riskLevel,
      requiresApproval: policy.requires_merchant_approval !== false,
      explanation: [
        `The cart value (₹${cartValue}) is above the merchant's recovery threshold.`,
        `The customer has not received a previous recovery message (${customer.priorMessagesSent || 0} sent).`,
        `The proposed discount (${recommendedPercent}% up to ₹${calculatedDiscountAmount}) is within the merchant policy.`
      ]
    };
  }
}
