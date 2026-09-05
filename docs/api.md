# RazorAgent REST API Documentation
**Razorpay AI Growth & Agentic Commerce Buildathon**

Base URL: `http://localhost:5000/api`

All merchant-protected endpoints require an HTTP header:
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication

### `POST /api/auth/register`
Registers a new merchant account and admin user.
- **Body**: `{ "name": "...", "email": "...", "password": "...", "storeName": "..." }`
- **Response**: `{ "message": "...", "token": "...", "user": {...}, "merchant": {...} }`

### `POST /api/auth/login`
Authenticates merchant credentials and issues JWT token.
- **Body**: `{ "email": "admin@trendvault.in", "password": "DemoAdmin123!" }`
- **Response**: `{ "token": "...", "user": {...}, "merchant": {...} }`

### `GET /api/auth/me`
Returns current authenticated user and merchant profile.

---

## 2. Merchant & Policies

### `GET /api/merchant/profile`
Fetches merchant profile and store currency.

### `PUT /api/merchant/profile`
Updates store details.

### `GET /api/merchant/policies`
Returns merchant policy guardrails:
```json
{
  "max_discount_percent": 10.0,
  "max_discount_amount": 500.0,
  "max_campaign_budget": 5000.0,
  "max_messages_per_customer": 1,
  "recovery_window_hours": 24,
  "requires_merchant_approval": true,
  "allowed_actions": ["send_whatsapp_recovery", "retry_payment_reminder", "recommend_product_bundle"]
}
```

### `PUT /api/merchant/policies`
Updates merchant policy guardrails.

---

## 3. Product Catalog

### `GET /api/catalog/products`
Lists all products in store catalog.

### `POST /api/catalog/products`
Creates a new catalog product.

### `PUT /api/catalog/products/:id`
Updates an existing product.

### `DELETE /api/catalog/products/:id`
Deletes a product.

---

## 4. Orders & Analytics

### `GET /api/orders`
Lists all store orders with status and recovery source.

### `GET /api/orders/:id`
Returns detailed order info and payment records.

### `GET /api/analytics/revenue`
Returns total revenue, recovered revenue, abandoned checkout value, recovery rate, and trend series.

### `GET /api/analytics/payments`
Returns Razorpay payment success rates, captured vs failed transaction stats.

### `GET /api/analytics/checkout`
Returns checkout abandonment rates, recovered cart rates, and pipeline leakage value.

---

## 5. Autopilot & AI Agent

### `POST /api/autopilot/scan`
Triggers an autonomous AI agent scan of unpaid checkouts.

### `GET /api/autopilot/opportunities`
Lists all generated recovery opportunities with evidence and risk level.

### `GET /api/autopilot/opportunities/:id`
Returns opportunity details including itemized cart and explainability rationale.

### `POST /api/autopilot/opportunities/:id/approve`
Approves recovery action, performs policy validation, and dispatches WhatsApp template.

### `POST /api/autopilot/opportunities/:id/reject`
Rejects opportunity with merchant dismissal reason.

### `GET /api/autopilot/actions`
Lists actions in the merchant approval queue.

### `POST /api/autopilot/actions/:id/execute`
Executes an approved queue action.

---

## 6. WhatsApp Messaging

### `POST /api/whatsapp/send`
Dispatches a template message with customer opt-in verification.

### `GET /api/whatsapp/messages`
Lists WhatsApp messages with status breakdown (pending, delivered, read, failed).

### `GET /api/whatsapp/webhook`
Meta Webhook verification challenge handler (`hub.challenge`).

### `POST /api/whatsapp/webhook`
Meta Webhook event processor for delivery receipts and read confirmations.

### `POST /api/whatsapp/opt-in`
Registers customer WhatsApp consent.

### `POST /api/whatsapp/opt-out`
Revokes customer WhatsApp consent.

---

## 7. Checkout & Razorpay

### `GET /api/checkout/cart/:token` (Public)
Resolves cart items, discounts, and customer details for recovery checkout link.

### `POST /api/checkout/create-order`
Creates a Razorpay Test Mode order.

### `POST /api/checkout/verify-payment`
Verifies HMAC-SHA256 signature and captures payment conversion.

### `GET /api/checkout/payment/:id`
Looks up status of a payment.

### `POST /api/checkout/webhook`
Razorpay Webhook receiver for `order.paid`, `payment.captured`, and `payment.failed`.

---

## 8. Audit Trail

### `GET /api/audit`
Returns chronological, immutable audit logs with actor and entity tracking.

### `GET /api/audit/:id`
Fetches detailed audit log entry including full payload telemetry.

---

## 9. Demo Runner

### `POST /api/demo/run-scenario`
Executes the full 7-step autonomous buildathon showcase flow in one click.

### `POST /api/demo/reset`
Resets the demo environment back to initial clean seeded state.

### `POST /api/demo/run-failure`
Simulates a WhatsApp API error scenario demonstrating error capture and retryable state.
