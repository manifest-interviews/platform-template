-- Support idempotent payment creation and processor reconciliation.
ALTER TABLE payments ADD COLUMN idempotency_key TEXT;
ALTER TABLE payments ADD COLUMN external_id     TEXT;
ALTER TABLE payments ADD COLUMN updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX idx_payments_idempotency_key
  ON payments (idempotency_key) WHERE idempotency_key IS NOT NULL;
