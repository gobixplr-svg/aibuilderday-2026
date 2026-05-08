"use client"

import { useState } from "react"

export default function AddressForm({ onSubmit }: { onSubmit: (address: string) => void }) {
  const [address, setAddress] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = address.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium" style={{ color: "var(--jn-navy)" }}>
        Property address
      </label>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="e.g. 21106 Kenswick Meadows Ct, Humble, TX 77338"
        className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 bg-white"
        style={{
          borderColor: "var(--jn-border)",
          color: "var(--jn-text)",
        }}
        autoFocus
        required
      />
      <button
        type="submit"
        disabled={!address.trim()}
        className="w-full rounded-xl px-6 py-3 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ background: "var(--jn-blue)" }}
      >
        Get Estimate
      </button>
    </form>
  )
}
