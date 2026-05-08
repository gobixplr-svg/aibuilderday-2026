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
    stub: true,
  }
}

export default function RoofReconTestPage() {
  return <RoofRecon defaultTheme="dark" accent="#FF6B2B" onMeasure={fakeMeasure} />
}
