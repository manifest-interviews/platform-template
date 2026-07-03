import type { FastifyInstance } from "fastify";
import { query } from "../db.js";

interface CustomerBody {
  name?: string;
  email?: string;
}

export async function customerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/customers", async () => {
    const customers = await query(
      "SELECT id, name, email, created_at FROM customers ORDER BY created_at DESC",
    );
    return { customers };
  });

  app.post("/customers", async (request, reply) => {
    const body = (request.body ?? {}) as CustomerBody;

    if (!body.name || !body.email) {
      return reply.status(400).send({ error: "name and email are required" });
    }

    const rows = await query(
      "INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
      [body.name, body.email],
    );
    return reply.status(201).send({ customer: rows[0] });
  });
}
