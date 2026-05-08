import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Roof Estimator — AI Builder Day 2026",
  description: "Aerial roof measurement and auto-estimating powered by AI",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header style={{ background: "var(--jn-navy)" }} className="px-6 py-4 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="6" fill="#1B6AC9" />
            <path d="M7 19L14 8L21 19H7Z" fill="white" opacity="0.9" />
            <path d="M11 19L14 13L17 19H11Z" fill="#FF6B2B" />
          </svg>
          <span className="text-white font-semibold text-lg tracking-tight">Roof Estimator</span>
          <span className="ml-auto text-xs text-white/40 font-mono">AI Builder Day 2026</span>
        </header>
        <main className="min-h-[calc(100vh-60px)]">{children}</main>
      </body>
    </html>
  )
}
