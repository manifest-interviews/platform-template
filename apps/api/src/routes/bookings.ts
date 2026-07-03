import type { FastifyInstance } from "fastify";
import { query } from "../db.js";

interface BookingBody {
  customer_id?: number;
  booking_date?: string;
  notes?: string;
}

const BOOKING_COLUMNS =
  "id, customer_id, status, booking_date, notes, created_at, updated_at";

export async function bookingRoutes(app: FastifyInstance): Promise<void> {
  app.get("/bookings", async () => {
    const bookings = await query(
      `SELECT ${BOOKING_COLUMNS} FROM bookings ORDER BY created_at DESC`,
    );
    return { bookings };
  });

  app.get("/bookings/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const rows = await query(
      `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: "booking not found" });
    }
    return { booking: rows[0] };
  });

  app.post("/bookings", async (request, reply) => {
    const body = (request.body ?? {}) as BookingBody;

    if (!body.customer_id || !body.booking_date) {
      return reply
        .status(400)
        .send({ error: "customer_id and booking_date are required" });
    }

    const rows = await query(
      `INSERT INTO bookings (customer_id, status, booking_date, notes)
       VALUES ($1, 'confirmed', $2, $3)
       RETURNING ${BOOKING_COLUMNS}`,
      [body.customer_id, body.booking_date, body.notes ?? null],
    );
    return reply.status(201).send({ booking: rows[0] });
  });

  app.post("/bookings/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const rows = await query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = now()
       WHERE id = $1
       RETURNING ${BOOKING_COLUMNS}`,
      [id],
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: "booking not found" });
    }
    return { booking: rows[0] };
  });
}
