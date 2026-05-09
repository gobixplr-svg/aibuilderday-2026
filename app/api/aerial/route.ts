import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { slugify } from "@/app/lib/slug"

// Serves intermediate/<slug>/aerial.jpg so the in-flight processing screen
// can swap from a placeholder to the actual fetched satellite tile as soon
// as the pipeline writes it. Step 1/6 of the pipeline (geocode + aerial)
// usually finishes within ~5s, so polling this from the client gets us a
// real picture of the property well before the rest of the pipeline lands.

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")
  if (!address) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 })
  }

  const slug = slugify(address.trim())
  const aerialPath = join(process.cwd(), "intermediate", slug, "aerial.jpg")

  try {
    const buf = await readFile(aerialPath)
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") {
      // Expected during early-poll: aerial hasn't been fetched yet.
      return NextResponse.json({ error: "not yet" }, { status: 404 })
    }
    console.error(`[aerial] readFile failed for ${aerialPath}:`, err)
    return NextResponse.json({ error: "Failed to read aerial" }, { status: 500 })
  }
}
