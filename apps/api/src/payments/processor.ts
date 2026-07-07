import { config } from "../config.js";

// Client for the external payment processor. Stubbed for the template:
// PAYMENT_PROCESSOR_URL points at the provider's charge endpoint. The processor
// and its webhooks live OUTSIDE our infrastructure and are operated by a third
// party.
export interface ChargeInput {
  amountCents: number;
  currency: string;
  idempotencyKey: string;
}

export async function charge(
  input: ChargeInput,
): Promise<{ externalId: string; status: string }> {
  const res = await fetch(`${config.paymentProcessorUrl}/charges`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({ amount_cents: input.amountCents, currency: input.currency }),
  });
  if (!res.ok) throw new Error(`processor charge failed: ${res.status}`);
  const data = (await res.json()) as { id: string; status: string };
  return { externalId: data.id, status: data.status };
}
