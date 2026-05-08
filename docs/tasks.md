# Tasks & Track Plan — Field Capture

> **These are suggestions, not assignments.** Teammates can self-select, swap, or split tracks differently if a different shape works better. The goal is shipping a memorable demo by Saturday 2pm — anyone reshape this if it serves that goal better.

## Team

- **Dan** — full-stack, AI pipeline experience (NBD Labs), product lead
- **Will** — building an AI-native CRM, real AI fluency
- **Eric** — Director-of-Engineering level, senior generalist, learning AI as part of this
- **Ethan** — learning AI, motivated, careful eye

## Why three tracks for four people

A 24-hour build with four parallel tracks creates four integration seams and four single-points-of-failure. Three tracks with a deliberate pair on the riskiest one is more likely to ship. Pairing the AI track also de-risks the Friday 1:05pm twist — whatever the brief becomes, two AI-strong people can adapt together.

If anyone wants to break this into four tracks instead, we can — but the AI pipeline solo is the failure mode I'd most like to avoid.

---

## Track A — AI Pipeline (suggested pair: Dan + Will)

**The brain.** Vision-and-voice extraction → structured items → catalog match. This is what makes the demo a demo.

**Owns:**
- Photo + voice ingest endpoint (accepts captures from Track B)
- Vision prompt(s) — extracts structured items from photos
- Voice transcription + fusion with photo context
- Catalog matcher — extracted items → priced line items from the staged catalog
- Trade-pack abstraction — same engine, swap "windows" / "roofing" via config
- Confidence flags per item (so demo can show "AI thinks this, rep verifies")

**Stretch:**
- Prompt iteration on real conference-room photos before kickoff
- Two-pass extraction (item detection → dimension/condition extraction) if accuracy needs it

**Hands off to Track B:** structured estimate JSON `{ items: [...], totals: {...}, trade_pack: "windows" }`

**Hands off to Track C:** the same JSON (Track C may render it directly into the PDF template)

**Risk to watch:** the Friday twist most likely affects this track. Keep prompts modular, catalog swappable, and don't hard-code anything that assumes the brief stays roofing-flavored.

---

## Track B — Capture & Output Stack (suggested owner: Eric)

**Everything around the AI.** Phone capture UI, the API plumbing, deployment, PDF generation.

**Owns:**
- Phone-side capture web app (PWA): camera access, photo upload, voice record, submit
- API layer: capture → upload to storage → call AI Pipeline → return result
- Voice-to-text integration (Whisper / Claude voice / OpenAI — Eric chooses)
- PDF generation pipeline (react-pdf or Puppeteer — Eric chooses)
- Supabase setup: storage buckets, tables, simple auth or no auth
- Deployment (Vercel + Railway worker, or all-Vercel, or all-Supabase Edge Functions)

**Stretch:**
- Live progress UI on phone ("Analyzing photos…" → "Matching catalog…" → "Building estimate…")
- Synchronous request/response inside the <60s envelope (vs async polling) — synchronous is more demo-friendly if latency allows

**Hands off to Track A:** uploaded photos + transcribed voice text via API
**Hands off to Track C:** rendered PDF, or the structured JSON if Track C owns the render

**Risk to watch:** integration seams. Whoever owns this should publish a tiny API contract early so Track A can start without waiting.

---

## Track C — Demo & Brand Surface (suggested owner: Ethan)

**The polish layer.** What separates "working prototype" from "memorable presentation." 25% of judging is Design + Visual Impact — this track owns it.

**Owns:**
- Staged catalog content: real product names, real-ish prices (pull from manufacturer spec sheets — Marvin, Andersen, Pella for windows; GAF, CertainTeed, Owens Corning for roofing). Make it look like a real catalog, not "Acme Window 1, 2, 3."
- Branded estimate PDF template — header, line items, totals, footer. Looks like a contractor would actually hand this to a homeowner.
- On-stage display surface — the big-screen view that mirrors the phone. Probably a simple web page that polls for the latest estimate and renders the PDF.
- Demo-day rehearsal: stage flow, where the phone is, what gets shown when, transition between window demo and roofing demo.
- QR code / event landing page if we want judges to scan and see the build.

**Stretch:**
- Once Track C is solid, Ethan plugs into Track A as a second pair of eyes for prompt iteration — good learning, helps the team.

**Hands off to nobody:** this is the surface the audience sees. Quality bar is high.

**Risk to watch:** "make it look real" is open-ended. Time-box the catalog work — 30-50 SKUs is plenty, don't try to populate hundreds.

---

## Cross-track checkpoints

Setting a few hard times so we don't drift:

- **Friday 5pm (building closes Day 1):** Each track has a working skeleton. Track B has a deployed app that takes a photo and shows a fake estimate. Track A has prompts running on local images. Track C has a PDF template rendering with sample data.
- **Saturday 8am (building reopens):** Tracks A and B integrated — real photos go in, real estimates come out. Track C catalog populated, PDF template polished.
- **Saturday 11am:** Full end-to-end flow works. Two trade-packs (windows + roofing) demonstrated.
- **Saturday 12pm:** Demo rehearsed at least twice on the actual hardware.
- **Saturday 1pm:** Final dress rehearsal. Code freeze prep.
- **Saturday 2pm:** Code freeze. Submit.

---

## What to figure out together at kickoff

- **Stack lock-in.** Next.js + Supabase is the default but Eric/Will may have preferences. Decide once, in the first 30 minutes, don't relitigate.
- **Repo structure.** This repo (`aibuilderday-2026`) gets a `/app` folder. One repo, one branch (main) until things settle, then feature branches if anyone wants them.
- **Communication channel.** Slack DM group? GitHub PRs? In-person only? Pick one.
- **Demo presenter.** Who's on stage? Probably Dan given the JobNimbus relationship target, but worth deciding so that person can rehearse.
- **Pitch arc.** 3-minute story. Likely: 30s problem → 60s phone-to-PDF live → 30s roofing config-swap → 60s "primitive" close. Whoever presents owns this.

---

## Open questions teammates may want to weigh in on

- Phone capture UX: hold-to-talk vs tap-to-record vs continuous voice
- PDF render: server-side (Puppeteer) or client-side (react-pdf)
- Catalog source: hand-curate or scrape manufacturer spec sheets
- The roofing demo input: a printed photo? a phone-library image? a pre-staged URL?
- Whether to attempt real JobNimbus API integration as a stretch goal (probably no — fragile)

These don't need to be decided tonight. Logging them so they don't get lost.
