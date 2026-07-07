// Seed the database with a small amount of sample data.
//
// Safe to run more than once: it clears the three tables first, then inserts a
// handful of customers, bookings, and payments.

import pg from "pg";

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query("TRUNCATE payments, bookings, customers RESTART IDENTITY CASCADE");

  const customers = await pool.query<{ id: number }>(
    `INSERT INTO customers (name, email) VALUES
       ('Ada Lovelace', 'ada@example.com'),
       ('Grace Hopper', 'grace@example.com'),
       ('Alan Turing', 'alan@example.com')
     RETURNING id`,
  );

  const [ada, grace] = customers.rows;

  const bookings = await pool.query<{ id: number }>(
    `INSERT INTO bookings (customer_id, status, booking_date, notes) VALUES
       ($1, 'confirmed', '2030-02-14', 'Window seat requested'),
       ($1, 'confirmed', '2030-03-01', NULL),
       ($2, 'cancelled', '2030-01-20', 'Customer cancelled')
     RETURNING id`,
    [ada.id, grace.id],
  );

  await pool.query(
    `INSERT INTO payments (booking_id, amount_cents, currency, status) VALUES
       ($1, 5000, 'USD', 'paid'),
       ($2, 7500, 'USD', 'pending')`,
    [bookings.rows[0].id, bookings.rows[1].id],
  );

  await pool.end();
  console.log("seed complete");
}

main();
