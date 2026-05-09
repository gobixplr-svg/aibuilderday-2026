import { NextRequest, NextResponse } from "next/server"
import { ScoredContractorLead } from "@/src/hail-leads/types"

type ExportRequest = {
  leads?: ScoredContractorLead[]
}

function toCsvField(value: string | number | undefined): string {
  if (value === undefined) return ""
  const escaped = String(value).replaceAll("\"", "\"\"")
  return `"${escaped}"`
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExportRequest
  const leads = body.leads ?? []

  const header = [
    "name",
    "lead_type",
    "score",
    "contactability",
    "city",
    "state",
    "phone",
    "email",
    "website",
    "address",
    "source",
  ]

  const rows = leads.map((lead) =>
    [
      toCsvField(lead.name),
      toCsvField(lead.leadType),
      toCsvField(lead.score),
      toCsvField(lead.contactability),
      toCsvField(lead.city),
      toCsvField(lead.state),
      toCsvField(lead.phone),
      toCsvField(lead.email),
      toCsvField(lead.website),
      toCsvField(lead.address),
      toCsvField(lead.source),
    ].join(",")
  )

  const csv = [header.join(","), ...rows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hail-leads-${Date.now()}.csv"`,
    },
  })
}
