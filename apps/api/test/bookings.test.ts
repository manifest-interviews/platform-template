import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db.js";

// Integration test: requires a migrated Postgres database reachable via
// DATABASE_URL. It creates its own customer and booking so it does not depend
// on the seed script having been run.
describe("bookings", () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("creates a customer, then a booking, then cancels it", async () => {
    const customerRes = await app.inject({
      method: "POST",
      url: "/customers",
      payload: { name: "Test User", email: `test-${Date.now()}@example.com` },
    });
    expect(customerRes.statusCode).toBe(201);
    const customerId = customerRes.json().customer.id;

    const bookingRes = await app.inject({
      method: "POST",
      url: "/bookings",
      payload: { customer_id: customerId, booking_date: "2030-01-01", notes: "hello" },
    });
    expect(bookingRes.statusCode).toBe(201);
    const booking = bookingRes.json().booking;
    expect(booking.status).toBe("confirmed");

    const cancelRes = await app.inject({
      method: "POST",
      url: `/bookings/${booking.id}/cancel`,
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.json().booking.status).toBe("cancelled");
  });

  it("returns 400 when creating a booking without required fields", async () => {
    const res = await app.inject({ method: "POST", url: "/bookings", payload: {} });
    expect(res.statusCode).toBe(400);
  });
});
