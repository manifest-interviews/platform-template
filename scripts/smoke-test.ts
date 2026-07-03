// Very small smoke test: hits the running service and checks that a couple of
// endpoints respond. Assumes the API is already running and reachable at
// SMOKE_BASE_URL (default http://localhost:3000).
//
// This is a starting point. It currently only checks status codes for two
// endpoints and does not, for example, verify readiness or exercise a write.

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function check(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} returned ${res.status}`);
  }
  console.log(`ok  GET ${path} -> ${res.status}`);
}

async function main(): Promise<void> {
  try {
    await check("/health");
    await check("/customers");
    console.log("smoke test passed");
  } catch (err) {
    console.error("smoke test failed");
    console.error(err);
    process.exit(1);
  }
}

main();
