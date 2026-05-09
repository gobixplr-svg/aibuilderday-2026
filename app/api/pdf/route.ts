import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { slugify } from "@/app/lib/slug"

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")
  if (!address) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 })
  }

  const slug = slugify(address.trim())
  const pdfPath = join(process.cwd(), "outputs", slug, "estimate.pdf")

  try {
    const buf = await readFile(pdfPath)
    const filename = `roof-estimate-${slug}.pdf`
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    // ENOENT (no such file) is a real 404 — pipeline hasn't run for this address.
    // Anything else (EACCES, EISDIR, EMFILE) is a server bug; surface it as 500.
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") {
      return NextResponse.json(
        { error: `PDF not found for address: ${address}. Run the pipeline first.` },
        { status: 404 }
      )
    }
    console.error(`[pdf] readFile failed for ${pdfPath}:`, err)
    return NextResponse.json(
      { error: "Failed to read PDF" },
      { status: 500 }
    )
  }
}
