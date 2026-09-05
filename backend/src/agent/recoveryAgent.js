import { AgentTools } from './tools.js';
import { AIService } from '../services/aiService.js';
import { db } from '../config/database.js';

export class RecoveryAgent {
  constructor(merchantId) {
    this.merchantId = merchantId;
    this.tools = new AgentTools(merchantId);
  }

  /**
   * Scans abandoned checkouts, runs AI analysis, and generates opportunities
   */
  async scanAndAnalyze() {
    await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_core',
      eventType: 'agent_started_scan',
      entityType: 'merchant',
      entityId: this.merchantId,
      inputData: { timestamp: new Date().toISOString() },
      outputData: { status: 'scanning' },
      status: 'in_progress'
    });

    const checkouts = await this.tools.getAbandonedCheckouts();
    const policy = await this.tools.getMerchantPolicies();

    // Check which carts already have an active opportunity
    const existingOppsRes = await db.query(
      `SELECT cart_id FROM opportunities WHERE merchant_id = $1 AND status IN ('pending', 'approved', 'executed')`,
      [this.merchantId]
    );
    const existingCartIds = new Set(existingOppsRes.rows.map(o => o.cart_id));

    const generatedOpportunities = [];
    const skippedCheckouts = [];

    for (const checkout of checkouts) {
      if (existingCartIds.has(checkout.cartId)) {
        skippedCheckouts.push({
          cartId: checkout.cartId,
          reason: 'Opportunity already active for this checkout'
        });
        continue;
      }

      const customer = await this.tools.getCustomerDetails(checkout.customerId);
      const cart = await this.tools.getCartDetails(checkout.cartId);

      // Add age minutes to cart object
      cart.checkoutAgeMinutes = checkout.checkoutAgeMinutes;

      // Run AI Agent analysis
      const analysis = await AIService.analyzeOpportunity({ cart, customer, policy });

      if (analysis.status === 'insufficient_data') {
        await this.tools.recordAuditEvent({
          actorType: 'ai_agent',
          actorId: 'razoragent_core',
          eventType: 'agent_skipped_checkout',
          entityType: 'cart',
          entityId: checkout.cartId,
          inputData: { cartId: checkout.cartId, customerId: checkout.customerId },
          outputData: { reason: analysis.reason },
          status: 'skipped'
        });

        skippedCheckouts.push({
          cartId: checkout.cartId,
          reason: analysis.reason
        });
        continue;
      }

      // Create opportunity using the backend tool
      const opp = await this.tools.createOpportunity({
        cartId: checkout.cartId,
        customerId: checkout.customerId,
        opportunityType: analysis.opportunityType,
        title: analysis.title,
        summary: analysis.summary,
        description: analysis.reason,
        evidence: analysis.evidence,
        recommendedAction: analysis.recommendedAction,
        projectedImpact: analysis.projectedImpact,
        riskLevel: analysis.riskLevel,
        explanation: analysis.explanation
      });

      generatedOpportunities.push(opp);
    }

    await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_core',
      eventType: 'agent_completed_scan',
      entityType: 'merchant',
      entityId: this.merchantId,
      inputData: { totalCheckoutsScanned: checkouts.length },
      outputData: {
        opportunitiesCreated: generatedOpportunities.length,
        skippedCount: skippedCheckouts.length
      },
      status: 'success'
    });

    return {
      totalScanned: checkouts.length,
      opportunitiesCreated: generatedOpportunities.length,
      opportunities: generatedOpportunities,
      skipped: skippedCheckouts
    };
  }
}
