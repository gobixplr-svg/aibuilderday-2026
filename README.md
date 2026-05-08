# AI Builder Day 2026 — Field Capture

**Event:** AI Builder Day, May 8–9 2026, Lehi UT (JobNimbus HQ)
**Track:** JobNimbus $10K bounty — AI pipeline that turns property info into a customer-ready contractor estimate
**Working title:** Field Capture

## What we're building

A field-capture primitive: photos + voice in, customer-ready estimate PDF out, in under 60 seconds. Positioned as a platform primitive (SDK / API surface) for contractor-CRMs, not a vertical product.

Full concept in [`docs/concept-prompt.md`](docs/concept-prompt.md).

## Status

- **Concept:** locked — see `docs/concept-prompt.md`
- **IP/ownership:** **pending** — awaiting written response from JustBuild. See [`IP_STATUS.md`](IP_STATUS.md) before contributing code.
- **Team:** forming
- **Stack:** TBD (likely Next.js + Supabase + Anthropic Claude)

## Repo layout

```
.
├── README.md                  ← you are here
├── IP_STATUS.md               ← read before contributing code
├── docs/
│   ├── concept-prompt.md      ← the build brief
│   └── reference/             ← event materials, alternate-track research
└── .gitignore
```

## For new teammates

1. Read [`docs/concept-prompt.md`](docs/concept-prompt.md) — the full concept.
2. Read [`IP_STATUS.md`](IP_STATUS.md) — current status of the IP/ownership question for hackathon submissions.
3. Ping Dan with questions before committing time.

## Schedule

- **Friday May 8** — Doors 8am, kickoff 9am, **bounty twist 1:05pm**, building begins 1:30pm, building closes 5pm
- **Saturday May 9** — Building opens 8am, **code freeze 2pm**, judging 2–3:30pm, awards 4pm

## Reference materials in this repo

- `docs/reference/goed-map-data.csv` and `docs/reference/goed-resources-list.csv` — datasets from the GOED bounty track. We evaluated GOED before settling on JobNimbus; kept here for context if the Friday twist forces a pivot.
