import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { HAIL_LEADS_TOP_CONTRACTORS } from "@/src/hail-leads/constants"
import { renderLeadsPdfHtml } from "@/src/hail-leads/server/leads-pdf-html"
import { HailEvent, ScoredContractorLead } from "@/src/hail-leads/types"

export const maxDuration = 120

type ExportPdfRequest = {
  event?: HailEvent
  leads?: ScoredContractorLead[]
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExportPdfRequest
  if (!body.event) {
    return NextResponse.json({ error: "event is required" }, { status: 400 })
  }
  const leads = (body.leads ?? []).slice(0, HAIL_LEADS_TOP_CONTRACTORS)
  if (leads.length === 0) {
    return NextResponse.json({ error: "leads array must not be empty" }, { status: 400 })
  }

  const html = renderLeadsPdfHtml(body.event, leads)

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const buf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.45in", right: "0.45in", bottom: "0.45in", left: "0.45in" },
    })
    const filename = `hail-leads-${Date.now()}.pdf`
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[hail-leads][export-pdf]", error)
    const message = error instanceof Error ? error.message : "PDF render failed"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await browser?.close()
  }
}
