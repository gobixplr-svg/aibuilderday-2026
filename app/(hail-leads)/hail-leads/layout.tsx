import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "JobNimbus Hail Leads",
  description: "Isolated hail lead generation workspace for contractor growth",
}

export default function HailLeadsLayout({ children }: { children: React.ReactNode }) {
  return children
}
