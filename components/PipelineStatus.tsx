const STEPS = [
  "Geocoding address",
  "Fetching aerial image",
  "Estimating roof pitch",
  "Measuring footprint",
  "Calculating roof area",
  "Building estimate",
  "Done",
]

export default function PipelineStatus({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col gap-2">
      {STEPS.slice(0, -1).map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all"
            style={{
              borderColor: done ? "var(--jn-blue)" : active ? "var(--jn-blue)" : "var(--jn-border)",
              background: done ? "#EEF5FF" : active ? "#F0F7FF" : "white",
            }}
          >
            <span className="text-lg w-6 text-center">
              {done ? "✓" : active ? "⏳" : "○"}
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: done || active ? "var(--jn-navy)" : "var(--jn-muted)" }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
