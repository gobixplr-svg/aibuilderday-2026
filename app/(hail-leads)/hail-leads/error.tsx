"use client"

export default function HailLeadsError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="min-h-screen px-6 py-12 font-sans" style={{ background: "#0D1F3C", color: "#FFFFFF" }}>
      <div className="mx-auto max-w-lg">
        <h1 className="text-lg font-semibold tracking-tight">Hail leads error</h1>
        <p
          className="mt-4 rounded-md border p-3 text-sm"
          style={{
            borderColor: "rgba(220,80,80,0.45)",
            background: "rgba(80,20,20,0.35)",
            color: "#fecaca",
          }}
        >
          {error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 px-4 py-2 text-sm font-semibold"
          style={{ background: "#FF6B2B", color: "#0D1F3C" }}
        >
          Retry
        </button>
      </div>
    </main>
  )
}
