import { describe, it, expect, afterAll, vi, beforeEach } from "vitest";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db.js";

// Integration tests: require a migrated Postgres. The external processor is
// mocked at the fetch layer.
const WEBHOOK_HEADERS = { "x-webhook-secret": process.env.PAYMENT_WEBHOOK_SECRET as string };

describe("payments", () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  beforeEach(() => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: `ext_${Date.now()}`, status: "succeeded" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  async function makeBooking(): Promise<number> {
    const c = await app.inject({
      method: "POST",
      url: "/customers",
      payload: { name: "Payer", email: `p-${Date.now()}-${Math.random()}@example.com` },
    });
    const b = await app.inject({
      method: "POST",
      url: "/bookings",
      payload: { customer_id: c.json().customer.id, booking_date: "2030-01-01" },
    });
    return b.json().booking.id;
  }

  it("is idempotent on idempotency_key (no double charge)", async () => {
    const bookingId = await makeBooking();
    const key = `idem-${Date.now()}`;
    const fetchSpy = global.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchSpy.mock.calls.length;

    const p1 = await app.inject({
      method: "POST",
      url: `/bookings/${bookingId}/payments`,
      payload: { amount_cents: 500, idempotency_key: key },
    });
    const p2 = await app.inject({
      method: "POST",
      url: `/bookings/${bookingId}/payments`,
      payload: { amount_cents: 500, idempotency_key: key },
    });

    expect(p1.statusCode).toBe(201);
    expect(p2.statusCode).toBe(200);
    expect(p2.json().payment.id).toBe(p1.json().payment.id);
    expect(fetchSpy.mock.calls.length - callsBefore).toBe(1); // one real charge
  });

  it("webhook updates payment status idempotently", async () => {
    const bookingId = await makeBooking();
    const created = await app.inject({
      method: "POST",
      url: `/bookings/${bookingId}/payments`,
      payload: { amount_cents: 500, idempotency_key: `idem-${Date.now()}-wh` },
    });
    const externalId = created.json().payment.external_id;

    const wh1 = await app.inject({
      method: "POST",
      url: "/webhooks/payments",
      headers: WEBHOOK_HEADERS,
      payload: { external_id: externalId, status: "refunded" },
    });
    const wh2 = await app.inject({
      method: "POST",
      url: "/webhooks/payments",
      headers: WEBHOOK_HEADERS,
      payload: { external_id: externalId, status: "refunded" },
    });
    expect(wh1.statusCode).toBe(200);
    expect(wh1.json().payment.status).toBe("refunded");
    expect(wh2.statusCode).toBe(200); // re-delivery is safe
  });

  it("rejects a payment without required fields", async () => {
    const bookingId = await makeBooking();
    const res = await app.inject({
      method: "POST",
      url: `/bookings/${bookingId}/payments`,
      payload: { amount_cents: 500 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a webhook without the shared secret", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/payments",
      payload: { external_id: "whatever", status: "refunded" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 502 when the payment processor is unreachable", async () => {
    const bookingId = await makeBooking();
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new TypeError("fetch failed"),
    );
    const res = await app.inject({
      method: "POST",
      url: `/bookings/${bookingId}/payments`,
      payload: { amount_cents: 500, idempotency_key: `unreachable-${Date.now()}` },
    });
    expect(res.statusCode).toBe(502);
  });

  it("returns 404 (and does not charge) for a nonexistent booking", async () => {
    const fetchSpy = global.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchSpy.mock.calls.length;
    const res = await app.inject({
      method: "POST",
      url: "/bookings/999999/payments",
      payload: { amount_cents: 500, idempotency_key: `nb-${Date.now()}` },
    });
    expect(res.statusCode).toBe(404);
    expect(fetchSpy.mock.calls.length - callsBefore).toBe(0); // never charged
  });
});
