// Hardcoded values lifted from outputs/3561-e-102nd-ct-thornton-co-80229/measurement.json
// and estimate.json. We hardcode rather than import at runtime so the video has
// zero coupling to the live pipeline.

export const demoProperty = {
  address: "3561 E 102nd Ct, Thornton, CO 80229",
  shortAddress: "3561 E 102nd Ct, Thornton, CO",
  reportId: "RPT/3561-E-102ND-CT-THORNTON",
  pitch: "9/12",
  pitchLabel: "roof slope",
  confidencePct: 90,
  footprintSqFt: 2214,
  totalRoofSqFt: 2081,
  condition: "GOOD" as const,
  conditionNote:
    "No notable issues visible from satellite imagery. An in-person inspection will confirm.",
  observations: 0,
  pixelsPerMeter: 0.86,
  // Standard tier from estimate.json (kept for v1 ResultsScreen back-compat)
  standardTier: {
    label: "Standard",
    subtitle: "Architectural asphalt",
    warranty: "25-YR WARRANTY",
    bullets: [
      "3-tab + dimensional shingles",
      "Standard underlayment",
      "Basic flashing replacement",
    ],
    total: 12947,
    perSqFt: 6.22,
  },
  // Pipeline checklist for ProcessingScreen
  pipelineSteps: [
    "Locating address",
    "Fetching satellite tile",
    "Identifying subject roof",
    "Estimating pitch & area",
    "Generating 3-tier estimate",
  ],
  processingOps: [
    "Locating address...",
    "Fetching satellite tile...",
    "Identifying subject roof...",
    "Triangulating against the chimney...",
    "Computing slope, hip, and valley...",
  ],
};

// v2 — 3 estimate tiers from outputs/.../estimate.json
export type Tier = {
  label: string;
  name: string;
  warranty: string;
  bullets: string[];
  total: number;
  perSqFt: number;
  recommended: boolean;
};

export const tiers: Tier[] = [
  {
    label: "Standard",
    name: "3-Tab Asphalt Shingle",
    warranty: "25-YR WARRANTY",
    bullets: [
      "3-tab + dimensional shingles",
      "Standard underlayment",
      "Basic flashing replacement",
    ],
    total: 12947,
    perSqFt: 6.22,
    recommended: false,
  },
  {
    label: "Premium",
    name: "Architectural Laminate",
    warranty: "40-YR WARRANTY",
    bullets: [
      "Architectural laminate shingles",
      "Synthetic underlayment + ice shield",
      "Ridge vent + step flashing",
    ],
    total: 15526,
    perSqFt: 7.46,
    recommended: true,
  },
  {
    label: "Luxury",
    name: "Designer / Impact-Resistant",
    warranty: "50-YR WARRANTY",
    bullets: [
      "Class 4 impact-rated shingles",
      "Full underlayment + sealed deck",
      "Lifetime workmanship warranty",
    ],
    total: 19307,
    perSqFt: 9.28,
    recommended: false,
  },
];

// v2 — 3 authored AI-detected observations
// CONDITION stays GOOD; these are info-level findings to demonstrate the AI's eye
export type Observation = {
  id: number;
  title: string;
  detail: string;
  severity: "info";
};

export const authoredObservations: Observation[] = [
  {
    id: 1,
    title: "Minor granule wear",
    detail:
      "South-facing slope shows light granule loss consistent with normal aging.",
    severity: "info",
  },
  {
    id: 2,
    title: "Light debris",
    detail:
      "Northwest valley flashing area shows scattered organic debris (leaf/branch).",
    severity: "info",
  },
  {
    id: 3,
    title: "Chimney flashing",
    detail: "Visible at expected dimensions; not raised or detached.",
    severity: "info",
  },
];
