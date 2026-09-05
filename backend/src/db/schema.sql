-- RazorAgent PostgreSQL Schema
-- Razorpay AI Growth & Agentic Commerce Buildathon

CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'merchant_admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_policies (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
    max_discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    max_discount_amount NUMERIC(10, 2) DEFAULT 500.00,
    max_campaign_budget NUMERIC(10, 2) DEFAULT 5000.00,
    max_messages_per_customer INT DEFAULT 1,
    recovery_window_hours INT DEFAULT 24,
    requires_merchant_approval BOOLEAN DEFAULT TRUE,
    allowed_actions JSONB DEFAULT '["send_whatsapp_recovery", "retry_payment_reminder", "recommend_product_bundle"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    inventory_count INT DEFAULT 100,
    image_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    customer_type VARCHAR(50) DEFAULT 'returning',
    total_orders INT DEFAULT 0,
    lifetime_value NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_consents (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    channel VARCHAR(50) DEFAULT 'whatsapp',
    opted_in BOOLEAN DEFAULT TRUE,
    opt_in_source VARCHAR(100) DEFAULT 'checkout_checkbox',
    opt_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    opt_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'abandoned',
    total_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    checkout_started_at TIMESTAMP WITH TIME ZONE,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    recovery_token VARCHAR(128) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(64) PRIMARY KEY,
    cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
    cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE SET NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    total_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    recovery_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_order_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending',
    method VARCHAR(50) DEFAULT 'card',
    error_code VARCHAR(100),
    error_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE SET NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    type VARCHAR(100) DEFAULT 'checkout_recovery',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence JSONB NOT NULL,
    recommended_action JSONB NOT NULL,
    projected_impact JSONB NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(64) PRIMARY KEY,
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE CASCADE,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    template_name VARCHAR(100),
    explanation JSONB,
    confidence NUMERIC(4, 2) DEFAULT 0.80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actions (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_approval',
    payload JSONB NOT NULL,
    error_message TEXT,
    retryable BOOLEAN DEFAULT FALSE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
    phone_number VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    provider_message_id VARCHAR(150),
    parameters JSONB,
    recovery_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    actor_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(64),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(64),
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL DEFAULT 'outbound', -- 'inbound' (client -> owner) or 'outbound' (owner -> client)
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    template_type VARCHAR(50) DEFAULT 'custom', -- 'cart_recovery', 'order_confirmation', 'customer_inquiry', 'merchant_reply', 'custom'
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'failed'
    metadata JSONB,
    in_reply_to VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS autopilot_settings (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    mode VARCHAR(32) NOT NULL DEFAULT 'SEMI_AUTOPILOT', -- 'MANUAL_ASSIST', 'SEMI_AUTOPILOT', 'FULL_AUTOPILOT'
    is_paused BOOLEAN NOT NULL DEFAULT false,
    auto_approve_threshold NUMERIC(5, 2) NOT NULL DEFAULT 0.80, -- e.g. 0.80 = 80% confidence
    max_auto_discount NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Maximum auto discount percentage
    channels JSONB NOT NULL DEFAULT '["whatsapp", "email"]'::jsonb,
    require_cart_value_min NUMERIC(10, 2) DEFAULT 0.00,
    recovery_window_hours INTEGER NOT NULL DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS autopilot_events (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) REFERENCES merchants(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL, -- 'CYCLE_STARTED', 'OPPORTUNITY_AUTO_APPROVED', 'ACTION_DISPATCHED', 'GUARDRAIL_BLOCKED', 'SETTINGS_CHANGED'
    severity VARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    summary TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


