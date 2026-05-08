#!/usr/bin/env node
// scripts/fetch-all.mjs
//
// Run fetch-aerial on all 10 bounty properties (5 example + 5 test).
// Useful for a single bulk pre-fetch before iterating prompts.
//
// Usage:
//   node scripts/fetch-all.mjs
//   node scripts/fetch-all.mjs --no-cache

import "./lib/env.mjs"
import { spawn } from "child_process"

const EXAMPLES = [
  "21106 Kenswick Meadows Ct, Humble, TX 77338",
  "5914 Copper Lilly Lane, Spring, TX 77389",
  "122 NW 13th Ave, Cape Coral, FL 33993",
  "14132 Trenton Ave, Orland Park, IL 60462",
  "835 S Cobble Creek, Nixa, MO 65714",
]

const TESTS = [
  "3561 E 102nd Ct, Thornton, CO 80229",
  "1612 S Canton Ave, Springfield, MO 65802",
  "6310 Laguna Bay Court, Houston, TX 77041",
  "3820 E Rosebrier St, Springfield, MO 65809",
  "1261 20th Street, Newport News, VA 23607",
]

const noCache = process.argv.includes("--no-cache")
const all = [...EXAMPLES, ...TESTS]

function runOne(address) {
  return new Promise((resolve, reject) => {
    const args = ["scripts/fetch-aerial.mjs", address]
    if (noCache) args.push("--no-cache")
    const child = spawn("node", args, { stdio: "inherit" })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`exit ${code} for ${address}`))
    })
  })
}

async function run() {
  console.log(`[fetch-all] ${all.length} properties (${EXAMPLES.length} example + ${TESTS.length} test)`)
  let ok = 0
  let fail = 0
  for (const address of all) {
    console.log(`\n=== ${address} ===`)
    try {
      await runOne(address)
      ok++
    } catch (err) {
      console.error(`[fetch-all] FAILED: ${err.message}`)
      fail++
    }
  }
  console.log(`\n[fetch-all] ${ok} ok, ${fail} failed`)
  if (fail) process.exit(2)
}

run()
