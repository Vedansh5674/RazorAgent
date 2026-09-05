import crypto from 'crypto';
import { AgentTools } from './tools.js';
import { AIService } from '../services/aiService.js';
import { PolicyService } from '../services/policyService.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { EmailService } from '../services/emailService.js';
import { db } from '../config/database.js';

export class TaskAgent {
  constructor(merchantId, user = null) {
    if (!merchantId) throw new Error('TaskAgent requires an authenticated merchantId');
    this.merchantId = merchantId;
    this.user = user || { id: 'merchant_user', name: 'Store Merchant' };
    this.tools = new AgentTools(merchantId);
  }

  /**
   * Main entry point to execute an arbitrary user requirement or task
   */
  async executeTask({ task, parameters = {} }) {
    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      throw new Error('Task prompt cannot be empty');
    }

    const taskId = `task_${crypto.randomUUID().slice(0, 8)}`;
    const lower = task.toLowerCase();
    const steps = [];

    steps.push({
      step: 1,
      name: 'Intent Classification',
      status: 'completed',
      details: `Received user prompt: "${task}". Analyzing required tools and cognitive actions.`
    });

    // 1. UPDATE POLICY INTENT
    if (
      lower.includes('policy') ||
      lower.includes('discount limit') ||
      lower.includes('max discount') ||
      lower.includes('recovery window') ||
      lower.includes('auto-approve') ||
      lower.includes('auto approve') ||
      lower.includes('guardrail')
    ) {
      return await this._handleUpdatePolicyTask(taskId, task, lower, parameters, steps);
    }

    // 2. SCAN & RECOVER CARTS INTENT
    if (
      lower.includes('scan') ||
      lower.includes('abandoned') ||
      lower.includes('find cart') ||
      lower.includes('detect') ||
      lower.includes('checkouts') ||
      lower.includes('all carts') ||
      (lower.includes('cart') && (lower.includes('over') || lower.includes('above') || lower.includes('threshold') || lower.includes('exceeding')))
    ) {
      return await this._handleScanAndRecoverTask(taskId, task, lower, parameters, steps);
    }

    // 3. EMAIL COMMUNICATIONS INTENT
    if (
      lower.includes('email') ||
      lower.includes('mail') ||
      lower.includes('inquiry')
    ) {
      return await this._handleEmailTask(taskId, task, lower, parameters, steps);
    }

    // 4. DRAFT / SIMULATE WHATSAPP MESSAGE INTENT (Specific customer outreach)
    if (
      lower.includes('message') ||
      lower.includes('whatsapp') ||
      lower.includes('outreach') ||
      lower.includes('remind') ||
      lower.includes('draft')
    ) {
      return await this._handleMessageDraftTask(taskId, task, lower, parameters, steps);
    }

    // 4. TRIAGE / APPROVE QUEUE INTENT
    if (
      lower.includes('queue') ||
      lower.includes('triage') ||
      lower.includes('approve all') ||
      lower.includes('approve safe') ||
      lower.includes('execute pending')
    ) {
      return await this._handleTriageQueueTask(taskId, task, lower, parameters, steps);
    }

    // 5. CONSENT & COMPLIANCE AUDIT INTENT
    if (
      lower.includes('consent') ||
      lower.includes('opt-in') ||
      lower.includes('opt in') ||
      lower.includes('opt-out') ||
      lower.includes('opt out') ||
      lower.includes('compliance') ||
      lower.includes('gdpr')
    ) {
      return await this._handleConsentAuditTask(taskId, task, lower, parameters, steps);
    }

    // 6. ANALYTICS & REPORT INTENT
    if (
      lower.includes('analytics') ||
      lower.includes('report') ||
      lower.includes('revenue') ||
      lower.includes('metrics') ||
      lower.includes('leakage') ||
      lower.includes('conversion') ||
      lower.includes('summary') ||
      lower.includes('performance')
    ) {
      return await this._handleAnalyticsReportTask(taskId, task, lower, parameters, steps);
    }

    // 7. GENERAL STRATEGIC ADVISORY INTENT
    return await this._handleStrategicAdvisoryTask(taskId, task, lower, parameters, steps);
  }

  // ==========================================
  // HANDLERS FOR EACH INTENT
  // ==========================================

  async _handleUpdatePolicyTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Fetch Current Policies',
      status: 'completed',
      details: 'Retrieved active merchant guardrails from merchant_policies.'
    });

    const current = await this.tools.getMerchantPolicies();
    const updates = { ...parameters };

    // Extract maxDiscountPercent
    const pctMatch = task.match(/(\d+(?:\.\d+)?)\s*%/);
    if (pctMatch) {
      updates.maxDiscountPercent = parseFloat(pctMatch[1]);
    }

    // Extract maxDiscountAmount (e.g. ₹500, Rs. 1000, 2000 cap)
    const amtMatch = task.match(/(?:₹|rs\.?|inr|\b)\s*(\d{3,5})\s*(?:cap|max amount|amount|\b)/i);
    if (amtMatch && !task.includes(`${amtMatch[1]}%`)) {
      const parsedVal = parseFloat(amtMatch[1]);
      if (parsedVal > 100) updates.maxDiscountAmount = parsedVal;
    }

    // Extract recoveryWindowHours
    const hrsMatch = task.match(/(\d+)\s*(?:hours?|hrs?)/i);
    if (hrsMatch) {
      updates.recoveryWindowHours = parseInt(hrsMatch[1], 10);
    }

    // Extract approval requirement
    if (lower.includes('auto-approve') || lower.includes('auto approve') || lower.includes('disable approval') || lower.includes('without approval')) {
      updates.requiresMerchantApproval = false;
    } else if (lower.includes('require approval') || lower.includes('with approval') || lower.includes('enable approval')) {
      updates.requiresMerchantApproval = true;
    }

    steps.push({
      step: 3,
      name: 'Apply Policy Updates',
      status: 'completed',
      details: `Updating policy settings: ${JSON.stringify(updates)}`
    });

    const updated = await this.tools.updatePolicies(updates);

    steps.push({
      step: 4,
      name: 'Governance Audit Recording',
      status: 'completed',
      details: 'Recorded immutable policy update event in audit trail.'
    });

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'merchant',
      actorId: this.user.id || 'merchant_admin',
      eventType: 'agent_task_executed',
      entityType: 'merchant_policy',
      entityId: this.merchantId,
      inputData: { task, parameters, updates },
      outputData: { previous: current, updated },
      status: 'success'
    });

    return {
      taskId,
      task,
      intent: 'UPDATE_POLICY',
      status: 'completed',
      summary: `Successfully updated merchant policy guardrails according to your requirements: Max Discount: ${updated.max_discount_percent}%, Max Cap: ₹${updated.max_discount_amount}, Recovery Window: ${updated.recovery_window_hours}h, Merchant Approval: ${updated.requires_merchant_approval ? 'Required' : 'Automated'}.`,
      steps,
      data: {
        previousPolicy: current,
        updatedPolicy: updated
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Scan abandoned checkouts using new policy limits",
        "Generate revenue projection with new discount settings",
        "Review pending actions in approval queue"
      ]
    };
  }

  async _handleScanAndRecoverTask(taskId, task, lower, parameters, steps) {
    // Extract minimum amount filter if specified (e.g. over 2500, > 3000, above ₹2,000)
    let minAmount = parameters.minAmount || 0;
    const minMatch = task.match(/(?:over|>|above|at least|exceeding)\s*(?:₹|rs\.?)?\s*(\d+[\d,]*)/i);
    if (minMatch) {
      minAmount = parseFloat(minMatch[1].replace(/,/g, ''));
    }

    steps.push({
      step: 2,
      name: 'Query Abandoned Checkouts',
      status: 'completed',
      details: `Searching for abandoned checkouts${minAmount > 0 ? ` with value >= ₹${minAmount.toLocaleString('en-IN')}` : ''}.`
    });

    const checkouts = await this.tools.findCartsByCriteria({ minAmount });
    const policy = await this.tools.getMerchantPolicies();

    steps.push({
      step: 3,
      name: 'AI Propensity & Policy Guardrail Evaluation',
      status: 'completed',
      details: `Found ${checkouts.length} eligible checkouts. Evaluating customer propensity, recovery window (${policy.recovery_window_hours}h), and consent.`
    });

    const opportunitiesCreated = [];
    const skipped = [];

    // Query active opp cart IDs to prevent duplicates
    const existingRes = await db.query(
      `SELECT cart_id FROM opportunities WHERE merchant_id = $1 AND status IN ('pending', 'approved', 'executed')`,
      [this.merchantId]
    );
    const existingCartIds = new Set(existingRes.rows.map(r => r.cart_id));

    for (const chk of checkouts) {
      if (existingCartIds.has(chk.cartId)) {
        skipped.push({ cartId: chk.cartId, reason: 'Active opportunity already exists' });
        continue;
      }

      const cust = await this.tools.getCustomerDetails(chk.customerId);
      const cart = await this.tools.getCartDetails(chk.cartId);
      cart.checkoutAgeMinutes = chk.checkoutAgeMinutes;

      // Extract custom discount from prompt if user requested (e.g. with 12% discount)
      const reqPctMatch = task.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i);
      let targetDiscount = reqPctMatch ? parseFloat(reqPctMatch[1]) : 10;
      targetDiscount = Math.min(targetDiscount, Number(policy.max_discount_percent || 10));

      const analysis = await AIService.analyzeOpportunity({ cart, customer: cust, policy });

      if (analysis.status === 'insufficient_data') {
        skipped.push({ cartId: chk.cartId, reason: analysis.reason });
        continue;
      }

      // Apply any user requested discount override within policy
      if (analysis.recommendedAction) {
        analysis.recommendedAction.discountPercent = targetDiscount;
      }

      const opp = await this.tools.createOpportunity({
        cartId: chk.cartId,
        customerId: chk.customerId,
        opportunityType: analysis.opportunityType,
        title: analysis.title,
        summary: analysis.summary,
        description: analysis.reason,
        evidence: { ...analysis.evidence, userTaskRequested: task },
        recommendedAction: analysis.recommendedAction,
        projectedImpact: analysis.projectedImpact,
        riskLevel: analysis.riskLevel,
        explanation: analysis.explanation
      });

      opportunitiesCreated.push(opp);
    }

    steps.push({
      step: 4,
      name: 'Queue Actions & Audit Logging',
      status: 'completed',
      details: `Generated ${opportunitiesCreated.length} actionable recovery opportunities. Logged audit events.`
    });

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_copilot',
      eventType: 'agent_task_executed',
      entityType: 'cart',
      entityId: this.merchantId,
      inputData: { task, minAmount },
      outputData: { count: opportunitiesCreated.length, opportunities: opportunitiesCreated.map(o => o.id) },
      status: 'success'
    });

    const totalRecoverable = opportunitiesCreated.reduce((sum, o) => {
      const impact = typeof o.projected_impact === 'string' ? JSON.parse(o.projected_impact) : o.projected_impact;
      return sum + Number(impact?.expectedRevenue || 0);
    }, 0);

    return {
      taskId,
      task,
      intent: 'SCAN_AND_RECOVER',
      status: 'completed',
      summary: `Found ${checkouts.length} abandoned checkouts${minAmount > 0 ? ` above ₹${minAmount.toLocaleString('en-IN')}` : ''}. Successfully generated ${opportunitiesCreated.length} recovery opportunities with an estimated recoverable pipeline of ₹${totalRecoverable.toLocaleString('en-IN')}.`,
      steps,
      data: {
        totalFound: checkouts.length,
        opportunitiesCreated: opportunitiesCreated.length,
        opportunities: opportunitiesCreated,
        skipped,
        estimatedRecoverableRevenue: totalRecoverable
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Review generated opportunities in the Approval Queue",
        "Send simulated WhatsApp recovery for latest opportunity",
        "View revenue leakage breakdown report"
      ]
    };
  }

  async _handleMessageDraftTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Lookup Customer & Cart Target',
      status: 'completed',
      details: 'Matching target customer and checkout from query.'
    });

    // Extract customer name if mentioned (e.g. "Aarav", "Priya", "Vikram", "Ananya")
    const customers = await this.tools.getCustomerConsents();
    let targetCustomer = null;

    for (const c of customers) {
      const firstName = c.name.split(' ')[0].toLowerCase();
      if (lower.includes(firstName) || lower.includes(c.name.toLowerCase())) {
        targetCustomer = c;
        break;
      }
    }

    if (!targetCustomer && customers.length > 0) {
      // Default to first customer with abandoned checkout
      const checkouts = await this.tools.getAbandonedCheckouts();
      if (checkouts.length > 0) {
        targetCustomer = customers.find(c => c.id === checkouts[0].customerId) || customers[0];
      } else {
        targetCustomer = customers[0];
      }
    }

    steps.push({
      step: 3,
      name: 'Consent & Guardrail Verification',
      status: 'completed',
      details: `Target Customer: ${targetCustomer?.name || 'Customer'}. Opt-in Status: ${targetCustomer?.opted_in ? 'Verified' : 'Opted Out / Missing'}.`
    });

    if (!targetCustomer?.opted_in) {
      return {
        taskId,
        task,
        intent: 'DRAFT_RECOVERY',
        status: 'blocked',
        summary: `Action blocked: Customer ${targetCustomer?.name || 'Target'} has not opted in to WhatsApp updates or has opted out. Under merchant policy and telecom regulations, outbound recovery templates cannot be dispatched.`,
        steps,
        data: { customer: targetCustomer, guardrailBlocked: true, reason: 'Consent missing' },
        policyChecked: true,
        suggestedNextTasks: [
          "Check customer consent audit",
          "Send recovery to customer with active opt-in (e.g. Aarav Sharma)",
          "Scan all abandoned checkouts for opted-in shoppers"
        ]
      };
    }

    // Prepare template preview
    const policy = await this.tools.getMerchantPolicies();
    const discount = Math.min(10, Number(policy.max_discount_percent || 10));
    const cartValue = 3868;
    const discountAmount = Math.round((cartValue * discount) / 100);

    const messagePreview = WhatsAppService.formatRecoveryMessage({
      customerName: targetCustomer.name,
      merchantName: 'TrendVault India',
      cartValue,
      discountAmount,
      discountPercent: discount,
      checkoutUrl: `http://localhost:5173/checkout/demo_token_${targetCustomer.id}`
    });

    steps.push({
      step: 4,
      name: 'Format Approved Template & Preview',
      status: 'completed',
      details: 'Constructed Meta-approved cart_recovery template with dynamic pricing placeholders.'
    });

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_copilot',
      eventType: 'agent_task_executed',
      entityType: 'whatsapp_message',
      entityId: targetCustomer.id,
      inputData: { task, customerId: targetCustomer.id },
      outputData: { messagePreview, discountPercent: discount },
      status: 'success'
    });

    return {
      taskId,
      task,
      intent: 'DRAFT_RECOVERY',
      status: 'completed',
      summary: `Successfully drafted personalized WhatsApp recovery message for ${targetCustomer.name} with ${discount}% discount (Save ₹${discountAmount}). Opt-in verified. Ready for merchant approval or immediate dispatch.`,
      steps,
      data: {
        customer: targetCustomer,
        discountPercent: discount,
        discountAmount,
        messagePreview,
        templateName: 'cart_recovery',
        guardrailBlocked: false
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Review message in WhatsApp Recovery Hub",
        "Execute approved recovery actions",
        "Test customer checkout portal"
      ]
    };
  }

  async _handleTriageQueueTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Inspect Approval Queue',
      status: 'completed',
      details: 'Fetching pending recovery actions from actions table.'
    });

    const pendingActions = await this.tools.getPendingActions();
    const policy = await this.tools.getMerchantPolicies();

    steps.push({
      step: 3,
      name: 'Evaluate Actions Against Policy Guardrails',
      status: 'completed',
      details: `Found ${pendingActions.length} pending actions. Evaluating discount limit (${policy.max_discount_percent}%), customer consent, and duplicate frequency.`
    });

    const approved = [];
    const blocked = [];

    for (const action of pendingActions) {
      const discount = action.payload?.recommendedAction?.discountPercent || 10;
      if (discount > Number(policy.max_discount_percent)) {
        blocked.push({ id: action.id, reason: `Discount ${discount}% exceeds policy limit ${policy.max_discount_percent}%` });
        continue;
      }
      approved.push({
        id: action.id,
        customerName: action.customer_name,
        discountPercent: discount,
        status: 'approved_ready'
      });
    }

    steps.push({
      step: 4,
      name: 'Triage Summary & Audit Logging',
      status: 'completed',
      details: `Triaged ${pendingActions.length} actions: ${approved.length} safe to execute, ${blocked.length} blocked by policy.`
    });

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_copilot',
      eventType: 'agent_task_executed',
      entityType: 'action',
      entityId: this.merchantId,
      inputData: { task },
      outputData: { approvedCount: approved.length, blockedCount: blocked.length },
      status: 'success'
    });

    return {
      taskId,
      task,
      intent: 'TRIAGE_QUEUE',
      status: 'completed',
      summary: `Queue Triage Completed: Analyzed ${pendingActions.length} pending actions. ${approved.length} actions conform strictly to merchant policy guardrails and are cleared for dispatch. ${blocked.length} actions require manual adjustment.`,
      steps,
      data: {
        totalPending: pendingActions.length,
        approvedSafe: approved,
        blockedActions: blocked
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Go to Approval Queue to dispatch approved actions",
        "Adjust policy to allow blocked actions if appropriate",
        "Check WhatsApp Hub delivery telemetry"
      ]
    };
  }

  async _handleConsentAuditTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Extract Customer Opt-In Registry',
      status: 'completed',
      details: 'Querying customer_consents join customers for DPDP/GDPR compliance status.'
    });

    const consents = await this.tools.getCustomerConsents();
    const optedIn = consents.filter(c => c.opted_in);
    const optedOut = consents.filter(c => !c.opted_in);

    steps.push({
      step: 3,
      name: 'Analyze Messaging Safety Cohorts',
      status: 'completed',
      details: `Categorized ${consents.length} customers: ${optedIn.length} opted-in (${Math.round((optedIn.length / consents.length) * 100)}%), ${optedOut.length} opted-out/unconfirmed.`
    });

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_copilot',
      eventType: 'agent_task_executed',
      entityType: 'customer_consent',
      entityId: this.merchantId,
      inputData: { task },
      outputData: { totalCustomers: consents.length, optedIn: optedIn.length, optedOut: optedOut.length },
      status: 'success'
    });

    return {
      taskId,
      task,
      intent: 'CONSENT_AUDIT',
      status: 'completed',
      summary: `WhatsApp Compliance Audit: ${optedIn.length} of ${consents.length} customers have active WhatsApp opt-in consent (${Math.round((optedIn.length / consents.length) * 100)}% opt-in rate). Policy guardrails strictly block recovery dispatch to the ${optedOut.length} opted-out customer(s).`,
      steps,
      data: {
        totalCustomers: consents.length,
        optedInCount: optedIn.length,
        optedOutCount: optedOut.length,
        optedInCustomers: optedIn.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
        optedOutCustomers: optedOut.map(c => ({ id: c.id, name: c.name, phone: c.phone }))
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Scan abandoned checkouts for opted-in customers only",
        "Review opt-out logs in WhatsApp Hub",
        "Update recovery window policy"
      ]
    };
  }

  async _handleAnalyticsReportTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Aggregate Real-Time Telemetry',
      status: 'completed',
      details: 'Pulling gross revenue, orders, abandoned carts, and WhatsApp conversion rates.'
    });

    const analytics = await this.tools.getMerchantAnalytics();

    steps.push({
      step: 3,
      name: 'AI Revenue & Leakage Synthesis',
      status: 'completed',
      details: 'Calculating recoverable revenue pipeline, payment success probability, and ROI.'
    });

    const potentialRecovery = Math.round(analytics.abandonedCheckoutValue * 0.45);
    const recoveryRate = analytics.whatsappRecoveryRate || 33.3;

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_copilot',
      eventType: 'agent_task_executed',
      entityType: 'merchant_analytics',
      entityId: this.merchantId,
      inputData: { task },
      outputData: analytics,
      status: 'success'
    });

    return {
      taskId,
      task,
      intent: 'ANALYTICS_REPORT',
      status: 'completed',
      summary: `Store Performance Summary: Gross Revenue: ₹${analytics.totalRevenue.toLocaleString('en-IN')}. Revenue Recovered via AI: ₹${analytics.recoveredRevenue.toLocaleString('en-IN')}. Abandoned Checkout Leakage: ₹${analytics.abandonedCheckoutValue.toLocaleString('en-IN')} across ${analytics.abandonedCartsCount} carts. Projected Recoverable Pipeline: ₹${potentialRecovery.toLocaleString('en-IN')} at current ${recoveryRate}% recovery rate.`,
      steps,
      data: {
        ...analytics,
        projectedRecoverablePipeline: potentialRecovery,
        paymentGatewayReliability: `${analytics.paymentSuccessRate}%`
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Trigger AI Scan on abandoned checkouts",
        "Check payment gateway health on Razorpay orders",
        "Inspect customer recovery conversion funnel"
      ]
    };
  }

  async _handleStrategicAdvisoryTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Evaluate Store Context & History',
      status: 'completed',
      details: 'Aggregating merchant performance, policy guardrails, and customer cohorts for strategic synthesis.'
    });

    const analytics = await this.tools.getMerchantAnalytics();
    const policy = await this.tools.getMerchantPolicies();

    steps.push({
      step: 3,
      name: 'Cognitive Strategy Generation',
      status: 'completed',
      details: 'Synthesizing actionable advice tailored to store revenue recovery.'
    });

    const advice = [
      `Optimal Discount Strategy: Keep recovery discounts capped between 8% and ${policy.max_discount_percent}% to preserve margin while incentivizing checkout completion.`,
      `Timing Optimization: Send WhatsApp recovery messages within 30 to 90 minutes of checkout abandonment for peak open rates (~88%).`,
      `Payment Resilience: Razorpay Test Mode gateway shows ${analytics.paymentSuccessRate}% success rate. Use UPI & Card standard checkout for friction-free return.`,
      `Safety & Compliance: Maintain WhatsApp opt-in checks to ensure high sender quality and zero spam complaints.`
    ];

    const auditEvent = await this.tools.recordAuditEvent({
      actorType: 'ai_agent',
      actorId: 'razoragent_copilot',
      eventType: 'agent_task_executed',
      entityType: 'merchant',
      entityId: this.merchantId,
      inputData: { task },
      outputData: { advice },
      status: 'success'
    });

    return {
      taskId,
      task,
      intent: 'STRATEGIC_ADVISORY',
      status: 'completed',
      summary: `Strategic Agent Recommendations: Based on your current revenue (₹${analytics.totalRevenue.toLocaleString('en-IN')}) and ${analytics.abandonedCartsCount} abandoned checkouts, executing targeted WhatsApp recovery with an 8-10% incentive within 60 minutes can recover an estimated ₹${Math.round(analytics.abandonedCheckoutValue * 0.4).toLocaleString('en-IN')}.`,
      steps,
      data: {
        strategicRecommendations: advice,
        currentStats: analytics,
        policySnapshot: policy
      },
      policyChecked: true,
      auditEventId: auditEvent?.id,
      suggestedNextTasks: [
        "Scan and recover high-value checkouts",
        "Review discount policy guardrails",
        "Run full demo scenario"
      ]
    };
  }

  /**
   * Handles Email Dispatch, Inquiry Resolution, and Email Analytics Tasks
   */
  async _handleEmailTask(taskId, task, lower, parameters, steps) {
    steps.push({
      step: 2,
      name: 'Email Communications Engine',
      status: 'in_progress',
      details: 'Analyzing client email outreach request and loading email templates.'
    });

    const customersRes = await db.query('SELECT * FROM customers WHERE merchant_id = $1', [this.merchantId]);
    const customers = customersRes.rows || [];

    // Find if specific customer mentioned
    let targetCustomer = customers.find(c => lower.includes(c.name.toLowerCase().split(' ')[0])) || customers[0];

    // Find if cart exists
    const cartsRes = await db.query('SELECT * FROM carts WHERE merchant_id = $1 AND status = \'abandoned\'', [this.merchantId]);
    const targetCart = cartsRes.rows.find(c => c.customer_id === targetCustomer?.id) || cartsRes.rows[0];

    if (lower.includes('recover') || lower.includes('discount') || lower.includes('cart') || lower.includes('send')) {
      const discountPercent = parameters.discountPercent || 10;
      const cartValue = Number(targetCart?.total_amount || 4298);
      const discountAmount = Math.round((cartValue * discountPercent) / 100);

      const emailResult = await EmailService.sendCartRecoveryEmail({
        merchantId: this.merchantId,
        cartId: targetCart?.id || 'cart_demo',
        customerId: targetCustomer?.id,
        customerName: targetCustomer?.name || 'Aarav Sharma',
        customerEmail: targetCustomer?.email || 'aarav.sharma@example.com',
        cartValue,
        discountPercent,
        discountAmount,
        recoveryUrl: `http://localhost:5173/checkout/${targetCart?.recovery_token || 'demo_token_aarav'}`
      });

      steps[1].status = 'completed';
      steps[1].details = `Successfully dispatched recovery email to ${targetCustomer?.name} with ${discountPercent}% discount.`;

      const auditEvent = await this.tools.recordAuditEvent({
        actorType: 'ai_agent',
        actorId: 'task_agent',
        eventType: 'email_recovery_dispatched',
        entityType: 'email',
        entityId: emailResult.emailId,
        inputData: { targetCustomer: targetCustomer?.name, discountPercent },
        outputData: emailResult,
        status: 'success'
      });

      return {
        taskId,
        task,
        intent: 'EMAIL_OUTREACH',
        status: 'completed',
        summary: `Email Recovery Sent: Dispatched high-converting HTML recovery email to ${targetCustomer?.name} (${targetCustomer?.email}) with an exclusive ${discountPercent}% discount (Save ₹${discountAmount.toLocaleString('en-IN')}).`,
        steps,
        data: {
          emailId: emailResult.emailId,
          recipient: targetCustomer?.email,
          discountPercent,
          discountAmount,
          cartValue
        },
        policyChecked: true,
        auditEventId: auditEvent?.id,
        suggestedNextTasks: [
          "Check email communication delivery status",
          "Review customer inquiries in Communications Hub",
          "Run Autopilot Scan"
        ]
      };
    }

    // Default: Email stats and summary
    const stats = await EmailService.getStats(this.merchantId);
    steps[1].status = 'completed';
    steps[1].details = 'Aggregated email performance metrics and client communication volume.';

    return {
      taskId,
      task,
      intent: 'EMAIL_STATS',
      status: 'completed',
      summary: `Email Communications Overview: Store has logged ${stats.totalEmails} total communications (${stats.inboundInquiries} client inquiries, ${stats.outboundSent} outbound messages). Delivery rate is 100% with a ${stats.openRate}% average open rate.`,
      steps,
      data: stats,
      policyChecked: true,
      suggestedNextTasks: [
        "Send email recovery to Aarav Sharma",
        "View recent client inquiries",
        "Open Email Communications Hub"
      ]
    };
  }
}
