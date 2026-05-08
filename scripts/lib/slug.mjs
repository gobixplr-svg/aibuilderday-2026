// Address → filesystem slug.
// "21106 Kenswick Meadows Ct, Humble, TX 77338" → "21106-kenswick-meadows-ct-humble-tx-77338"
export function slugify(address) {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
