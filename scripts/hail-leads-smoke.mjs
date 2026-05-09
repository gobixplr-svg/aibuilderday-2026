const BASE_URL = process.env.HAIL_LEADS_BASE_URL ?? "http://localhost:3000"

async function assertOk(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Smoke check failed for ${path}: ${res.status}`)
  }
  console.log(`[smoke] ok ${path} (${res.status})`)
}

async function run() {
  await assertOk("/")
  await assertOk("/hail-leads")
  await assertOk("/api/hail-leads/events?state=TX&daysBack=2")
}

run().catch((error) => {
  console.error("[smoke] failed", error)
  process.exit(1)
})
