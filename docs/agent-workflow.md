# RazorAgent AI Agent Workflow Document
**Razorpay AI Growth & Agentic Commerce Buildathon**

## Autonomous Agent Workflow Lifecycle

```text
Merchant logs in
        ↓
Merchant analytics are loaded
        ↓
Backend detects abandoned checkout
        ↓
AI Agent analyzes the opportunity
        ↓
AI creates an explainable recommendation
        ↓
Merchant reviews the recommendation
        ↓
Merchant approves the action
        ↓
Backend validates policies and limits
        ↓
WhatsApp recovery template is sent
        ↓
Customer opens checkout link
        ↓
Customer completes Razorpay Test Mode payment
        ↓
Webhook updates the order and message status
        ↓
Revenue impact and audit trail are updated
```

---

## 1. Step-by-Step Breakdown

### Step 1: Ingestion & Telemetry Detection
- The agent calls `tools.getAbandonedCheckouts()` to query all carts in `abandoned` status.
- It checks checkout timestamps against the recovery window threshold (`recovery_window_hours`, default 24h).
- It verifies whether the customer provided WhatsApp consent (`customer_consents.opted_in`).

### Step 2: Cognitive Reasoning & Policy Verification
- The agent calls `tools.getMerchantPolicies()` to load merchant boundaries.
- For each cart, the agent queries `tools.getCustomerDetails(customerId)` to check customer type (`new`, `returning`, `vip`), lifetime value (LTV), and prior recovery counts.
- It invokes the multi-tiered AI Provider (`Ollama` -> `OpenAI` -> `Deterministic Rule Engine`).
- The AI produces a strict structured JSON recommendation containing:
  - `opportunityType`
  - `title`, `summary`, `reason`
  - `evidence` (cart value, checkout age, payment status)
  - `recommendedAction` (type, template name, discount percent, max discount amount)
  - `projectedImpact` (min/max revenue, confidence score)
  - `riskLevel` (`low`, `medium`, `high`)
  - `requiresApproval`
  - `explanation` (array of natural language rationale statements)

### Step 3: Insufficient Data / Missing Consent Handling
- If customer WhatsApp consent is missing or opted out, the agent does NOT invent consent or guess phone numbers.
- It returns:
  ```json
  {
    "status": "insufficient_data",
    "reason": "Required customer consent or checkout information is missing."
  }
  ```
- The checkout is skipped and an audit event (`agent_skipped_checkout`) is recorded.

### Step 4: Merchant Governance & Human-in-the-Loop
- Recommendations are saved as `opportunities` with status `pending`.
- Corresponding `actions` are created in the **Approval Queue**.
- Merchants can inspect full evidence, review the exact projected return, and approve or reject the intervention.

### Step 5: Guardrail Engine Enforcement
Before dispatching any recovery message, `PolicyService.validateAction()` checks:
1. Action is permitted by policy.
2. Discount percent $\le$ `maxDiscountPercent` (default 10%).
3. Calculated discount amount $\le$ `maxDiscountAmount` (default ₹500).
4. Customer has not exceeded message limits (`maxMessagesPerCustomer`).
5. Customer is opted in to WhatsApp communications.
6. Checkout age $\le$ `recoveryWindowHours`.

### Step 6: Dispatch & Interactive Checkout
- Dispatches approved template `cart_recovery` via WhatsApp Cloud API or certified Demo Simulator.
- Provides personalized checkout URL: `http://localhost:5173/checkout/:token`.
- Customer reviews cart, benefits from applied recovery discount, and completes payment via Razorpay Test Mode.

### Step 7: Conversion Attribution & Audit Log
- Razorpay HMAC-SHA256 signature is verified.
- The order is marked `paid`, and cart is marked `recovered`.
- Opportunity status changes to `converted`.
- Audit logs record actor, event type, timestamps, and payload telemetry.
