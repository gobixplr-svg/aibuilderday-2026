// Address → filesystem slug. MUST stay byte-identical to scripts/lib/slug.mjs.
// CLI writes outputs/<slug>/, API reads outputs/<slug>/ — drift breaks PDF download
// and the post-pipeline read in /api/measure + /api/estimate.
//
// "21106 Kenswick Meadows Ct, Humble, TX 77338" → "21106-kenswick-meadows-ct-humble-tx-77338"
export function slugify(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
