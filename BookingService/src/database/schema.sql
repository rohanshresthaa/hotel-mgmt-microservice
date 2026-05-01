CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    hotel_id UUID NOT NULL,
    room_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) CHECK (
        status IN ('PENDING', 'CONFIRMED', 'FAILED')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);