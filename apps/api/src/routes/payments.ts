import type { FastifyInstance } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { query } from "../db.js";
import { config } from "../config.js";
import { charge } from "../payments/processor.js";

interface PaymentBody {
  amount_cents?: number;
  currency?: string;
  idempotency_key?: string;
}

interface WebhookBody {
  external_id?: string;
  status?: string;
}

const PAYMENT_COLUMNS =
  "id, booking_id, amount_cents, currency, status, idempotency_key, external_id, created_at, updated_at";

// Statuses the processor / webhook is allowed to set.
const WEBHOOK_STATUSES = new Set(["pending", "succeeded", "failed", "refunded"]);

// Constant-time secret comparison (length-safe: unequal lengths short-circuit
// without leaking via timingSafeEqual's own length check throwing).
function secretMatches(provided: string | undefined): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(config.paymentWebhookSecret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // Create a payment for a booking. Idempotent on idempotency_key so a client
  // retry never double-charges: a replay returns the original payment.
  app.post("/bookings/:id/payments", async (request, reply) => {
    const bookingId = Number((request.params as { id: string }).id);
    const body = (request.body ?? {}) as PaymentBody;

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return reply.status(400).send({ error: "invalid booking id" });
    }
    if (!body.amount_cents || !body.idempotency_key) {
      return reply
        .status(400)
        .send({ error: "amount_cents and idempotency_key are required" });
    }

    // Fast path: a replay we've already recorded — return it without charging.
    const existing = await query(
      `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE idempotency_key = $1`,
      [body.idempotency_key],
    );
    if (existing.length > 0) {
      return { payment: existing[0] };
    }

    // Don't charge for a booking that doesn't exist.
    const booking = await query("SELECT id FROM bookings WHERE id = $1", [bookingId]);
    if (booking.length === 0) {
      return reply.status(404).send({ error: "booking not found" });
    }

    const currency = body.currency ?? "USD";
    let result: Awaited<ReturnType<typeof charge>>;
    try {
      result = await charge({
        amountCents: body.amount_cents,
        currency,
        idempotencyKey: body.idempotency_key,
      });
    } catch (err) {
      // The processor is an upstream dependency — surface its failure as a
      // gateway error, not an opaque 500. Nothing was persisted, so a retry
      // with the same idempotency_key is safe.
      request.log.error({ err }, "payment processor charge failed");
      return reply.status(502).send({ error: "payment processor unavailable" });
    }

    // ON CONFLICT closes the check-then-insert race: if a concurrent request
    // with the same key inserted first, we get zero rows back and return its
    // row instead of a 500. (The processor dedupes the charge via the
    // idempotency-key header, so the charge above is a no-op in that case.)
    const rows = await query(
      `INSERT INTO payments (booking_id, amount_cents, currency, status, idempotency_key, external_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING ${PAYMENT_COLUMNS}`,
      [bookingId, body.amount_cents, currency, result.status, body.idempotency_key, result.externalId],
    );
    if (rows.length === 0) {
      const winner = await query(
        `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE idempotency_key = $1`,
        [body.idempotency_key],
      );
      return { payment: winner[0] };
    }
    return reply.status(201).send({ payment: rows[0] });
  });

  // Processor webhook. Authenticated with a shared secret sent as a header (a
  // real processor signs the payload; a required secret header is the simple
  // equivalent). Re-delivery is expected, so the update is idempotent.
  app.post("/webhooks/payments", async (request, reply) => {
    const provided = request.headers["x-webhook-secret"];
    if (!secretMatches(typeof provided === "string" ? provided : undefined)) {
      return reply.status(401).send({ error: "invalid webhook signature" });
    }

    const body = (request.body ?? {}) as WebhookBody;
    if (!body.external_id || !body.status || !WEBHOOK_STATUSES.has(body.status)) {
      return reply
        .status(400)
        .send({ error: "external_id and a valid status are required" });
    }

    const rows = await query(
      `UPDATE payments SET status = $1, updated_at = now()
       WHERE external_id = $2
       RETURNING ${PAYMENT_COLUMNS}`,
      [body.status, body.external_id],
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: "payment not found" });
    }
    return { payment: rows[0] };
  });
}
