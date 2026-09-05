# RazorAgent — AI Revenue Autopilot
**Autonomous AI Cart Recovery, WhatsApp Commerce & Razorpay Test Mode Settlements**

Built for the **Razorpay AI Growth & Agentic Commerce Buildathon**.

---

## 1. Project Overview

**RazorAgent** is an enterprise-grade, autonomous agentic commerce platform designed for e-commerce merchants. It solves the multi-billion-dollar cart abandonment challenge through an end-to-end intelligent pipeline:
1. **Detects** abandoned checkouts in real-time.
2. **Analyzes** customer lifetime value, abandonment age, and propensity using a tool-based AI Agent.
3. **Drafts** explainable recovery proposals bounded by merchant policy guardrails (e.g., maximum 10% discount cap).
4. **Governs** actions via merchant human-in-the-loop approval.
5. **Dispatches** approved WhatsApp recovery templates (`cart_recovery`) with personalized checkout links.
6. **Converts** lost carts into paid orders via **Razorpay Test Mode** with cryptographic HMAC-SHA256 signature verification.
7. **Logs** every decision, message, and transaction into an immutable audit trail.

---

## 2. Key Features

- **Autonomous AI Recovery Agent**: Cognitive tool-based architecture accessing telemetry, cart data, and merchant policies.
- **Strict Guardrail Policy Engine**: Mathematical enforcement of discount percentages, budget limits, recovery time windows, and opt-out exclusions.
- **Configurable AI Provider**: Multi-tiered support for local **Ollama** models (`llama3`, `mistral`, `qwen2.5`), Cloud AI (OpenAI/Gemini), and a 100% deterministic rule-based agent engine for offline demos.
- **WhatsApp Cloud API & Certified Demo Mode**: Meta Business Cloud API integration with dynamic templates, opt-in/opt-out consent verification, and a zero-dependency demo simulation mode.
- **Razorpay Test Mode Integration**: Test order generation, client checkout popup, webhook listeners, and HMAC-SHA256 signature verification.
- **Interactive Recovery Portal**: Customer-facing checkout route (`/checkout/:token`) displaying recovered items, auto-applied discount, and Razorpay payment checkout.
- **Immutable Audit Trail**: Chronological event streaming recording all actor actions (`ai_agent`, `merchant`, `whatsapp_service`, `razorpay_gateway`).
- **1-Click Buildathon Scenario Runner**: Dedicated demonstration modal running the entire 7-step autonomous recovery loop in seconds.

---

## 3. Technology Stack

### Frontend
- **React 18** & **Vite**
- **Tailwind CSS** (Custom Razorpay & WhatsApp color themes)
- **Lucide React** (Icons)
- **Recharts** (Real-time revenue and conversion velocity charts)
- **React Router v6**

### Backend
- **Node.js (ES Modules)** & **Express.js**
- **Dual Database Engine**:
  - **PostgreSQL** (`pg`) via connection string
  - **Persistent Embedded SQL Engine** (Zero-dependency fallback for instant evaluation)
- **JWT Authentication** & **Bcrypt.js**
- **Crypto** (Node.js native HMAC-SHA256 signature verifier)
- **Node.js Test Runner** (`node:test`)

---

## 4. Architecture Diagram

```mermaid
flowchart TD
    subgraph Merchant_Experience ["Merchant Command Center"]
        Portal[React + Vite Dashboard]
        Queue[Approval Queue]
        DemoBtn[1-Click Buildathon Demo Runner]
    end

    subgraph Backend_Gateway ["Express.js API Gateway"]
        Auth[JWT Authentication & Tenant Isolation]
        Policies[Policy Guardrail Engine]
        Audit[Immutable Audit Logger]
    end

    subgraph Autonomous_Agent ["Autonomous AI Agent"]
        Scanner[Checkout Leakage Scanner]
        Agent[RazorAgent Tool-based Core]
        Tools[Agent Tool Layer: Analytics, Cart, Policy, Impact]
        LLM[Ollama / Cloud / Rule-based Engine]
    end

    subgraph Commerce_Channels ["Commerce & Messaging Channels"]
        WA[WhatsApp Cloud API / Demo Simulator]
        PayPage[Customer Recovery Portal (/checkout/:token)]
        RZP[Razorpay Test Mode Engine & Webhooks]
    end

    Portal --> Auth
    Auth --> Policies
    Scanner --> Tools
    Tools --> Agent
    Agent --> LLM
    Agent --> Queue
    Queue -->|Merchant Approves| Policies
    Policies -->|Validated| WA
    WA -->|Message with URL| PayPage
    PayPage -->|Pay| RZP
    RZP -->|HMAC-SHA256 Verified| Backend_Gateway
    Backend_Gateway --> Audit
```

---

## 5. Quick Start & Setup Instructions

### Prerequisites
- **Node.js** v18 or higher (Node v22 recommended)
- **npm** v9 or higher
- Optional: PostgreSQL (if you want native Postgres instead of the embedded engine)
- Optional: Ollama (if you want local LLM inference)

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm run install:all
```
*(Or navigate to `backend` and `frontend` separately and run `npm install`)*

### 2. Database Initialization & Seeding
Seed the database with default merchant (*TrendVault India*), catalog products, customers, and abandoned checkouts:
```bash
npm run seed
```

### 3. Run Automated Tests
Run the complete backend test suite (Auth, Policy Engine, Abandonment Detection, AI JSON validation, WhatsApp consent, Razorpay verification, Audit logging):
```bash
npm test
```
*Expected: 28 out of 28 tests passing!*

### 4. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend Portal**: `http://localhost:5173`

---

## 6. Default Demo Credentials

For buildathon evaluators and judges:
- **URL**: `http://localhost:5173/login`
- **Email**: `admin@trendvault.in`
- **Password**: `DemoAdmin123!`
*(Or click the "Click to fill Demo Merchant Credentials" button on the login screen!)*

---

## 7. Environment Variables Configuration

Create a `.env` file in `backend/` (or copy from `backend/.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=razoragent_super_secret_buildathon_key_2026

# Database (PostgreSQL URL - falls back to persistent embedded storage if offline)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/razoragent

# AI Provider Configuration ('fallback' | 'ollama' | 'openai')
AI_PROVIDER=fallback
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OPENAI_API_KEY=

# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=rzp_test_buildathonDemo123
RAZORPAY_KEY_SECRET=secret_buildathonRazorAgent2026
RAZORPAY_WEBHOOK_SECRET=whsec_razoragent_test_mode

# WhatsApp Cloud API Credentials
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=razoragent_wa_verify_token
WHATSAPP_API_VERSION=v20.0
WHATSAPP_DEMO_MODE=true

# Application URLs
APP_BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000
```

---

## 8. Provider Setup Guides

### Ollama Setup (Local AI Inference)
To run RazorAgent with local Ollama:
1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull your desired model:
   ```bash
   ollama pull llama3
   ```
3. Set in `backend/.env`:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```
4. If Ollama is not running, the system will automatically fall back to the deterministic agent engine without throwing errors!

### WhatsApp Cloud API Setup
To use live WhatsApp Business messaging:
1. Register on [developers.facebook.com](https://developers.facebook.com).
2. Create an app with WhatsApp product enabled.
3. Configure your `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `backend/.env`.
4. Set `WHATSAPP_DEMO_MODE=false`.
5. Point your webhook URL to `http://<your-host>:5000/api/whatsapp/webhook`.
*(By default, `WHATSAPP_DEMO_MODE=true` simulates all deliveries and read receipts with zero configuration).*

### Razorpay Test Mode Setup
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com) and switch to **Test Mode**.
2. Generate API Keys from **Settings > API Keys**.
3. Place `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.

---

## 9. Failure Handling & Resilience

RazorAgent is designed to fail safely and gracefully:
1. **WhatsApp Provider Failure Scenario**:
   - When WhatsApp delivery fails (simulated or real provider outage), the system catches the error, marks the action as `failed`, saves the failure reason, flags it as `retryable: true`, and offers the merchant a retry button.
   - Run the simulation directly:
     ```bash
     curl -X POST http://localhost:5000/api/demo/run-failure
     ```
2. **Policy Violation Scenario**:
   - Attempting to give a 25% discount when the policy limit is 10% returns a structured `422 Blocked` response with `allowedMaximum: 10`.
3. **Opted-out Customer Scenario**:
   - When customer `Ananya Verma` (opted out) is evaluated, the agent returns `insufficient_data` and skips message dispatch.

---

## 10. Security Notes

- **Secret Protection**: `RAZORPAY_KEY_SECRET` and `WHATSAPP_ACCESS_TOKEN` are strictly isolated on the backend and are never sent to the client.
- **Tenant Isolation**: Every database query scopes access strictly by `merchant_id` extracted from verified JWT tokens.
- **Tool Sandbox**: The AI agent cannot execute arbitrary SQL queries or transfer funds. All tool executions are validated by the host application.

---

## 11. Known Limitations

- **Meta Template Approval**: In production, WhatsApp templates must be approved in the Meta Business Manager before sending to non-whitelisted numbers.
- **Multi-currency checkout**: Test transactions currently standardize on INR (`₹`).
- **Distributed Lock**: For multi-region enterprise scaling, a Redis lock would be utilized across scanning workers.

---

## 12. Documentation Index

- [Architecture Document](file:///docs/architecture.md)
- [Agent Workflow Lifecycle](file:///docs/agent-workflow.md)
- [REST API Reference](file:///docs/api.md)
- [Buildathon Demo Presentation Script](file:///docs/demo-script.md)
