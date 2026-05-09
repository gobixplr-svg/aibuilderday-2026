"use client"
import { RoofRecon } from "@/components/roof-recon"

// Fake pipeline — bypasses real API so we can test visuals
async function fakeMeasure(address: string) {
  await new Promise<void>(r => setTimeout(r, 3500))
  return {
    address,
    sqft: 2847,
    pitch: "6/12",
    pitch_confidence: 0.84,
    tiers: [
      { name: "Standard", total: 8540 },
      { name: "Premium",  total: 11240 },
      { name: "Luxury",   total: 17100 },
    ],
    condition: {
      overall: "fair" as const,
      findings: [
        {
          category: "discoloration_staining" as const,
          description: "South-facing slope shows uniform pale gray coloration distinctly lighter than neighboring homes — consistent with a recently replaced roof or different material.",
          location_description: "South slope, full plane",
          severity: "low" as const,
          confidence: 0.75,
        },
        {
          category: "debris" as const,
          description: "Stacks of dimensional lumber visible adjacent to the east and southeast roof perimeters.",
          location_description: "East / southeast perimeter",
          severity: "medium" as const,
          confidence: 0.85,
        },
      ],
      rationale: "Synthetic data for visual testing — see PLOG-008 for real assessment behavior.",
    },
    stub: true,
  }
}

export default function RoofReconTestPage() {
  return <RoofRecon defaultTheme="dark" accent="#FF6B2B" onMeasure={fakeMeasure} />
}
