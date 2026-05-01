CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS wallets (
    user_id UUID PRIMARY KEY,
    balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user UUID,
    to_user UUID,
    amount NUMERIC(12,2) NOT NULL,
    type VARCHAR(50) CHECK (
        type IN ('LOAD', 'PAYMENT', 'TRANSFER')
    ),
    status VARCHAR(50) CHECK (
        status IN ('SUCCESS', 'FAILED')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);