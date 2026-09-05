# Buildathon Demo Presentation Script
**Razorpay AI Growth & Agentic Commerce Buildathon**
**Project: RazorAgent — AI Revenue Autopilot**

## 1. Executive Pitch (30 seconds)
"Judges, every day Indian e-commerce merchants lose between 65% and 75% of their shoppers right at the final checkout step. Today, we present **RazorAgent — AI Revenue Autopilot**. An autonomous agent that detects abandoned checkouts, explains recovery opportunities, enforces strict merchant policy guardrails, delivers approved WhatsApp interactive templates, and converts lost carts directly back through **Razorpay Test Mode**."

---

## 2. Live Demo Script (3 to 5 minutes)

### Step 1: Merchant Overview & Dashboard Telemetry
- **Action**: Open the application at `http://localhost:5173`.
- **Narration**:
  "Here is our merchant portal for *TrendVault India*. Notice the live KPIs:
  - Total Gross Revenue
  - Recovered Revenue (sales directly recovered by RazorAgent)
  - Abandoned Cart Value currently leaking
  - WhatsApp Recovery Conversion Rate
  - Real-time Razorpay Payment Success Rate."

### Step 2: Triggering the Autonomous AI Agent
- **Action**: Click the **Run Autopilot Scan** button or navigate to **AI Agent Hub**.
- **Narration**:
  "When the Autopilot scans, it executes our tool-based architecture:
  1. `getAbandonedCheckouts()` identifies customers who left items unpaid.
  2. The agent checks WhatsApp consent. Notice customer Ananya Verma has opted out—our agent skips her to protect regulatory compliance.
  3. The agent analyzes customer Aarav Sharma's ₹4,298 cart, historical LTV, and recommends an approved `cart_recovery` WhatsApp template with a 10% discount."

### Step 3: Explainable Rationale & Merchant Policy Guardrails
- **Action**: Navigate to **Opportunities** and click **View Details**.
- **Narration**:
  "Notice that our AI agent doesn't just suggest an action blindly—it returns an explainable breakdown:
  - Evidence used (cart value, checkout age, consent status).
  - Statistical recovery confidence (86%).
  - Policy verification ensuring the proposed discount is strictly $\le$ 10% and capped $\le$ ₹500."

### Step 4: One-Click Buildathon Scenario Runner
- **Action**: Click the glowing **Run Demo Scenario** button in the top navbar.
- **Narration**:
  "To demonstrate the entire closed-loop lifecycle, we built an end-to-end scenario runner:
  - Step 1: Detects Aarav Sharma's ₹4,298 cart.
  - Step 2: Generates AI recommendation.
  - Step 3: Merchant approves the action in the governance queue.
  - Step 4: Approved WhatsApp message is dispatched with the recovery URL.
  - Step 5: Customer opens checkout with the 10% discount applied automatically.
  - Step 6: Customer completes payment via Razorpay Test Mode with HMAC-SHA256 signature verification.
  - Step 7: Order converts to paid, Recovered Revenue jumps by ₹3,868, and the audit trail updates in real time!"

### Step 5: WhatsApp Experience & Recovery Checkout
- **Action**: Click **WhatsApp Recovery** to show the live WhatsApp bubble preview. Then open `/checkout/recov_tok_aarav_4298`.
- **Narration**:
  "Here is the customer's WhatsApp message with our certified demo simulation.
  When the customer taps their personalized link, they land on our recovery portal.
  The 10% discount (-₹430) is already applied!
  Clicking 'Pay with Razorpay' processes the test transaction, verifies the cryptographic signature, and updates the database."

### Step 6: Immutable Audit Trail & Failure Handling
- **Action**: Click **Audit Trail** and demonstrate search and actor logs.
- **Narration**:
  "Every single event—from agent reasoning to merchant approval, WhatsApp delivery, and Razorpay webhook capture—is immutably recorded in our audit log.
  Furthermore, if the WhatsApp provider suffers an outage, our system captures the 502 error gracefully, flags the opportunity as retryable, and alerts the merchant without corrupting state."

---

## 3. Key Takeaways
- **No Hallucinations**: Strict tool layer with policy guardrails prevents arbitrary discounts.
- **Zero API Dependency Barrier**: Configurable between local Ollama, cloud models, and deterministic demo modes.
- **Full Razorpay Integration**: Genuine order creation, webhook handling, and HMAC-SHA256 signature verification.
