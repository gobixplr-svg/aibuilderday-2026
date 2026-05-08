// Loads environment variables for CLI scripts.
//
// dotenv/config only reads `.env`, but our convention (and Next.js's) is
// `.env.local`. This loader checks `.env.local` first, then `.env`, so
// either works.
//
// Use it like dotenv/config:  import "./lib/env.mjs"  at the top of your
// CLI script, before reading process.env.

import dotenv from "dotenv"
import { existsSync } from "fs"

if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" })
}
if (existsSync(".env")) {
  // Don't override values already loaded from .env.local
  dotenv.config({ path: ".env", override: false })
}
