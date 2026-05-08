# IP / Ownership Status — Read Before Contributing

## Summary

**As of repo creation (May 8 2026):** AI Builder Day has published *no* public IP, ownership, licensing, or terms-of-participation language. We checked all five bounty briefs, the main event site, the registration page, the agenda, the sponsor page, the `llms.txt` machine-readable summary, and the Luma RSVP page. Nothing.

The only IP-adjacent language anywhere on the event materials is on a different track (GOED): *"reserves the right to work with winning teams to bring their solution to production."* — a relationship-intent statement, not an ownership claim.

## What this means

- **Default position (US copyright law):** authors own what they write. Without a written agreement assigning rights, contributors retain copyright.
- **Prize money alone is not work-for-hire.** Work-for-hire requires either an employment relationship or a signed written agreement specifying it as such in one of nine statutory categories. A bounty payment doesn't create that.
- **However:** terms may exist in (a) a registration click-wrap we haven't seen post-RSVP, (b) a participation agreement signed at check-in, or (c) a posted notice at the venue. We don't know yet.

## What we're doing about it

1. **Email sent to JustBuild** (`hello@justbuild.ing`) requesting written clarification on:
   - Who owns submission IP (team / sponsor / JustBuild)
   - Whether prize acceptance transfers ownership or grants a license
   - Whether bringing pre-existing IP into a submission is permitted, and whether that pre-existing IP remains ours
   - Whether a participation agreement / ToS exists

2. **Holding pre-built product code.** Until the answer is in writing, this repo contains docs only. No proprietary prompts, schemas, or pipeline code from existing projects.

3. **Demo plans for keeping pre-existing IP visible-but-separate.** When the build starts, anything brought in from outside this hackathon must be clearly labeled as such — both for honesty in judging and to keep the IP boundary visible.

## Guidance for contributors

- **OK to add now:** docs, planning notes, public reference materials, design exploration, scaffolding that's generic (Next.js boilerplate, etc.).
- **Hold until terms are confirmed:** anything derived from a separate company's proprietary work (prompts, schemas, model weights, internal libraries).
- **Hold always:** secrets, API keys, customer data.

## When the answer arrives

This file gets updated with the verbatim response. Any code-contribution policy changes get noted here and announced to the team.
