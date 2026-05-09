import { NextRequest, NextResponse } from "next/server"
import { HAIL_LEADS_TOP_CONTRACTORS } from "@/src/hail-leads/constants"
import { fetchContractorLeads } from "@/src/hail-leads/server/contractor-sources"
import { scoreContractorLeads } from "@/src/hail-leads/server/lead-scoring"
import { HailEvent } from "@/src/hail-leads/types"

type ContractorsRequest = {
  event?: HailEvent
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ContractorsRequest
  if (!body.event) {
    return NextResponse.json({ error: "event is required" }, { status: 400 })
  }

  try {
    const leads = await fetchContractorLeads(body.event)
    const scored = scoreContractorLeads(body.event, leads).slice(0, HAIL_LEADS_TOP_CONTRACTORS)
    const notice =
      scored.length === 0
        ? "No contractors were found. Data comes from OpenStreetMap (Overpass + Nominatim), optional Yelp Fusion (HAIL_YELP_API_KEY), and optional JSON seeds. Many public APIs do not include email."
        : undefined
    return NextResponse.json({ leads: scored, notice })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
