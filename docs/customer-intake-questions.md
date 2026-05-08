# Customer Intake Question Taxonomy

Purpose: track the question types roofers ask homeowners during re-roof intake so we can use them consistently in CLI/app flows and estimate notes.

## Categories

### 1) Roof History & Existing Condition

Critical questions:
- How old is the current roof?
- Have you had leaks? Where and when?
- What repairs or patch jobs have already been done?
- Any known decking/sheathing damage, soft spots, or rot?
- Do you want a formal pre-job inspection before quoting?

Why it matters:
- Sets risk assumptions for tear-off scope, hidden damage probability, and contingency pricing.

### 2) Goals & Outcome Expectations

Critical questions:
- How long do you want this new roof to last (target lifespan)?
- Is this a budget-first, balance, or premium/longevity-first decision?
- Are you planning to sell soon or keep the home long-term?
- Any must-have aesthetic direction (color, profile, neighborhood/HOA style)?

Why it matters:
- Drives material tier recommendations and how options are presented.

### 3) Climate & Site Exposure

Critical questions:
- What weather risk is most important here (wind, hail, heat, snow/ice, rain)?
- Any prior storm-related claims or recurring weather issues?
- Are there shade/tree-cover or drainage concerns impacting roof performance?

Why it matters:
- Affects shingle/underlayment system, accessory selection, and warranty strategy.

### 4) Material & System Decisions

Critical questions:
- Which materials are you considering (asphalt, metal, tile, etc.)?
- Are impact-resistant/cool-roof products a priority?
- Any attic ventilation or moisture problems you want fixed with this job?
- Preferences for underlayment and flashing quality levels?

Why it matters:
- Changes both estimate math (cost and labor) and final system design.

### 5) Logistics & Execution Constraints

Critical questions:
- Preferred start/completion window?
- Any HOA rules, permit constraints, or neighborhood restrictions?
- Site-access constraints (driveway, gate, landscaping protection)?
- Occupancy constraints (pets, kids, work-from-home, quiet hours)?

Why it matters:
- Impacts schedule, crew plan, disposal plan, and jobsite risk.

### 6) Budget & Buying Process

Critical questions:
- What budget range are you targeting?
- Are financing options needed?
- Who is involved in the decision and when is the decision deadline?
- Do you want one recommendation or multiple tiered options?

Why it matters:
- Avoids proposal mismatch and increases close probability.

### 7) Documentation, Trust & Warranty

Critical questions:
- Which warranty type matters most (manufacturer, workmanship, extended)?
- Do you want references or similar local jobs?
- Preferred deliverable format (line-item PDF, concise quote, both)?
- Any insurance documentation expectations?

Why it matters:
- Aligns output artifacts and confidence/trust signals before contract.

## Minimum Intake Set (required before final quote)

At minimum, capture these fields before a "final" estimate:
- roof_age_years
- prior_leaks_or_repairs
- target_lifespan_years
- material_preference
- budget_range
- schedule_window
- warranty_priority

If these are missing, the estimate should be marked `preliminary`.
