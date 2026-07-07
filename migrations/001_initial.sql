-- Initial schema for the Booking API.

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER NOT NULL REFERENCES customers (id),
  status        TEXT NOT NULL DEFAULT 'confirmed',
  booking_date  DATE NOT NULL,
  -- Legacy free-text status kept from an earlier prototype. Superseded by the
  -- `status` column above and no longer read by the application.
  legacy_status TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_customer_id ON bookings (customer_id);

CREATE TABLE payments (
  id           SERIAL PRIMARY KEY,
  booking_id   INTEGER NOT NULL REFERENCES bookings (id),
  amount_cents INTEGER NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'USD',
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking_id ON payments (booking_id);
