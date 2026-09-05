import { RecoveryAgent } from '../agent/recoveryAgent.js';
import { db } from '../config/database.js';
import { seedDatabase } from '../db/seed.js';
import { PolicyService } from '../services/policyService.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { RazorpayService } from '../services/razorpayService.js';
import { AuditService } from '../services/auditService.js';
import { config } from '../config/env.js';
import crypto from 'crypto';

export class DemoController {
  /**
   * Resets database state back to initial clean seed
   */
  static async resetDemo(req, res, next) {
    try {
      await seedDatabase();
      res.json({ message: 'Demo environment reset successfully to clean initial state.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Executes the full end-to-end 7-step buildathon showcase scenario
   */
  static async runScenario(req, res, next) {
    try {
      const merchantId = req.merchantId || 'merchant_trendvault_01';
      const steps = [];

      // Step 1: Detect Abandoned Checkout
      const agent = new RecoveryAgent(merchantId);
      const scanResult = await agent.scanAndAnalyze();
      
      // Select the primary opportunity (Aarav Sharma's cart)
      const oppsRes = await db.query(
        `SELECT o.*, c.name as customer_name, c.phone as customer_phone, ca.total_amount, ca.recovery_token
         FROM opportunities o
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN carts ca ON o.cart_id = ca.id
         WHERE o.merchant_id = $1 AND o.status = 'pending'
         ORDER BY o.created_at DESC LIMIT 1`,
        [merchantId]
      );

      if (oppsRes.rows.length === 0) {
        await seedDatabase();
        await agent.scanAndAnalyze();
        const retryRes = await db.query(
          `SELECT o.*, c.name as customer_name, c.phone as customer_phone, ca.total_amount, ca.recovery_token
           FROM opportunities o
           LEFT JOIN customers c ON o.customer_id = c.id
           LEFT JOIN carts ca ON o.cart_id = ca.id
           WHERE o.merchant_id = $1 AND o.status = 'pending'
           ORDER BY o.created_at DESC LIMIT 1`,
          [merchantId]
        );
        if (retryRes.rows.length > 0) {
          oppsRes = retryRes;
        } else {
          return res.status(400).json({
            error: 'NoPendingOpportunity',
            message: 'No pending opportunity available to run scenario. Try resetting the demo first.'
          });
        }
      }

      const opp = oppsRes.rows[0];
      const recAction = typeof opp.recommended_action === 'string' ? JSON.parse(opp.recommended_action) : opp.recommended_action;
      const cartValue = Number(opp.total_amount || 4298);
      const discountPercent = Number(recAction.discountPercent || 10);
      const discountAmount = Math.round((cartValue * discountPercent) / 100);

      steps.push({
        step: 1,
        title: 'Abandoned Checkout Detected',
        description: `Customer ${opp.customer_name} abandoned a cart worth ₹${cartValue.toLocaleString('en-IN')}.`,
        status: 'completed',
        data: { cartId: opp.cart_id, customerName: opp.customer_name, cartValue }
      });

      // Step 2: AI Recommendation Generated
      steps.push({
        step: 2,
        title: 'AI Recommendation Generated',
        description: `AI Agent recommended sending WhatsApp recovery offer with ${discountPercent}% discount (Save ₹${discountAmount}).`,
        status: 'completed',
        data: { opportunityId: opp.id, discountPercent, discountAmount, riskLevel: opp.risk_level }
      });

      // Step 3: Merchant Approves Recommendation
      await db.query(
        `UPDATE opportunities SET status = 'approved', updated_at = $1 WHERE id = $2`,
        [new Date().toISOString(), opp.id]
      );

      await AuditService.recordEvent({
        merchantId,
        actorType: 'merchant',
        actorId: req.user?.id || 'demo_admin',
        eventType: 'merchant_approved_action',
        entityType: 'opportunity',
        entityId: opp.id,
        inputData: { opportunityId: opp.id, discountPercent },
        outputData: { approved: true },
        status: 'success'
      });

      steps.push({
        step: 3,
        title: 'Merchant Approved Recommendation',
        description: `Merchant reviewed explainable evidence and approved recovery action under policy limit (Max ${discountPercent}%).`,
        status: 'completed',
        data: { approved: true, opportunityId: opp.id }
      });

      // Step 4: Approved WhatsApp Template Message Sent
      const checkoutUrl = `${config.appBaseUrl}/checkout/${opp.recovery_token}`;
      const waResult = await WhatsAppService.sendCartRecoveryMessage({
        merchantId,
        customerId: opp.customer_id,
        opportunityId: opp.id,
        phoneNumber: opp.customer_phone,
        customerName: opp.customer_name,
        merchantName: 'TrendVault India',
        cartValue,
        discountPercent,
        discountAmount,
        recoveryUrl: checkoutUrl
      });

      await db.query(
        `UPDATE opportunities SET status = 'executed', updated_at = $1 WHERE id = $2`,
        [new Date().toISOString(), opp.id]
      );

      steps.push({
        step: 4,
        title: 'WhatsApp Recovery Message Dispatched',
        description: `Approved template sent to ${opp.customer_phone} with recovery checkout link.`,
        status: 'completed',
        data: {
          mode: waResult.mode,
          label: waResult.label || 'Meta Cloud API',
          providerMessageId: waResult.providerMsgId,
          preview: waResult.preview
        }
      });

      // Step 5: Simulate Customer Return & Razorpay Test Checkout
      const finalAmount = cartValue - discountAmount;
      const rzpOrder = await RazorpayService.createOrder({
        merchantId,
        cartId: opp.cart_id,
        customerId: opp.customer_id,
        amount: finalAmount,
        currency: 'INR',
        receipt: `demo_rcpt_${opp.cart_id}`,
        notes: { recoverySource: 'whatsapp_agent', discountAmount }
      });

      steps.push({
        step: 5,
        title: 'Customer Returns & Opens Checkout',
        description: `Customer clicked link in WhatsApp, loaded cart with ₹${discountAmount} discount applied, and opened Razorpay Test Mode checkout.`,
        status: 'completed',
        data: { razorpayOrderId: rzpOrder.razorpayOrderId, finalAmount }
      });

      // Step 6: Customer Completes Razorpay Test Payment
      const simulatedPaymentId = `pay_demo_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const paymentResult = await RazorpayService.processPaymentSuccess({
        merchantId,
        razorpayOrderId: rzpOrder.razorpayOrderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: 'sig_demo_hash_verified',
        method: 'upi'
      });

      steps.push({
        step: 6,
        title: 'Razorpay Test Payment Verified',
        description: `Payment of ₹${finalAmount.toLocaleString('en-IN')} captured via UPI. HMAC-SHA256 signature verified.`,
        status: 'completed',
        data: paymentResult
      });

      // Step 7: Revenue Recovered & Opportunity Marked Converted
      steps.push({
        step: 7,
        title: 'Revenue Recovered & Audit Updated',
        description: `Cart ${opp.cart_id} converted to Paid Order ${paymentResult.orderNumber}. ₹${finalAmount.toLocaleString('en-IN')} added to Recovered Revenue.`,
        status: 'completed',
        data: {
          recoveredRevenue: finalAmount,
          orderNumber: paymentResult.orderNumber,
          auditTrailLogged: true
        }
      });

      res.json({
        message: 'End-to-End Autonomous Recovery Scenario Executed Successfully!',
        demoCompleted: true,
        summary: {
          recoveredRevenue: finalAmount,
          customer: opp.customer_name,
          discountGiven: `₹${discountAmount} (${discountPercent}%)`,
          orderNumber: paymentResult.orderNumber
        },
        steps
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Simulates a failure scenario to demonstrate resilience and retryability
   */
  static async runFailureScenario(req, res, next) {
    try {
      const merchantId = req.merchantId || 'merchant_trendvault_01';

      // Simulate WhatsApp API error
      const waResult = await WhatsAppService.sendCartRecoveryMessage({
        merchantId,
        customerId: 'cust_01',
        opportunityId: 'opp_demo_fail',
        phoneNumber: '+919876543210',
        customerName: 'Aarav Sharma',
        cartValue: 4298,
        simulateFailure: true
      });

      res.status(502).json({
        scenario: 'WhatsApp API Failure Handled Gracefully',
        ...waResult
      });
    } catch (err) {
      next(err);
    }
  }
}
