import { ContractorLead, HailEvent, ScoredContractorLead } from "@/src/hail-leads/types"

function computeContactability(lead: ContractorLead): ScoredContractorLead["contactability"] {
  if (lead.phone || lead.email || lead.website) return "high"
  if (lead.address) return "medium"
  return "low"
}

export function scoreContractorLeads(event: HailEvent, leads: ContractorLead[]): ScoredContractorLead[] {
  return leads
    .map((lead) => {
      let score = 0
      const scoreReasons: string[] = []

      if (lead.leadType === "existing_customer") {
        score += 35
        scoreReasons.push("Existing JobNimbus customer")
      } else {
        score += 20
        scoreReasons.push("Net-new market prospect")
      }

      score += Math.round(event.leadPriorityScore * 0.45)
      scoreReasons.push(`Area hail urgency score: ${event.leadPriorityScore}`)

      if (event.hailSizeInches !== undefined && event.hailSizeInches >= 1) {
        score += 14
        scoreReasons.push(`Significant hail (≥1.00″): ${event.hailSizeInches.toFixed(2)}″`)
      } else if (event.hailSizeInches !== undefined) {
        score += 4
        scoreReasons.push(`Hail reported: ${event.hailSizeInches.toFixed(2)}″`)
      }

      if (event.windGustMph !== undefined && event.windGustMph > 60) {
        score += 12
        scoreReasons.push(`High wind risk (${event.windGustMph} mph)`)
      } else if (event.windGustMph !== undefined) {
        score += 3
        scoreReasons.push(`Wind mention (${event.windGustMph} mph)`)
      }

      const contactability = computeContactability(lead)
      if (lead.email) {
        score += 6
        scoreReasons.push("Email on file")
      }

      if (contactability === "high") {
        score += 18
        scoreReasons.push("Direct outreach info available")
      } else if (contactability === "medium") {
        score += 9
        scoreReasons.push("Location available")
      } else {
        score += 2
        scoreReasons.push("Limited contact data")
      }

      return {
        ...lead,
        score: Math.min(100, score),
        scoreReasons,
        contactability,
      }
    })
    .sort((a, b) => b.score - a.score)
}
