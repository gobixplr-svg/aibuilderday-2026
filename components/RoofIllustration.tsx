// Aerial top-down view of a hip roof — mirrors what the AI actually analyzes.
export default function RoofIllustration() {
  return (
    <div className="flex flex-col items-center gap-2 mb-10">
      <svg
        viewBox="0 0 220 160"
        width="220"
        height="160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Roof faces — light tint fills */}
        {/* Front face */}
        <polygon points="15,135 205,135 145,75 75,75" fill="#1b6ac9" fillOpacity="0.06" />
        {/* Back face */}
        <polygon points="15,25 205,25 145,75 75,75" fill="#0d1f3c" fillOpacity="0.05" />
        {/* Left face */}
        <polygon points="15,25 15,135 75,75" fill="#0d1f3c" fillOpacity="0.08" />
        {/* Right face */}
        <polygon points="205,25 205,135 145,75" fill="#0d1f3c" fillOpacity="0.08" />

        {/* Footprint outline */}
        <rect x="15" y="25" width="190" height="110" stroke="#0d1f3c" strokeWidth="1.5" strokeOpacity="0.3" />

        {/* Hip lines */}
        <line x1="15"  y1="25"  x2="75"  y2="75" stroke="#0d1f3c" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="205" y1="25"  x2="145" y2="75" stroke="#0d1f3c" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="15"  y1="135" x2="75"  y2="75" stroke="#0d1f3c" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="205" y1="135" x2="145" y2="75" stroke="#0d1f3c" strokeWidth="1.5" strokeOpacity="0.5" />

        {/* Ridge line — JN blue, prominent */}
        <line x1="75" y1="75" x2="145" y2="75" stroke="#1b6ac9" strokeWidth="2.5" strokeLinecap="round" />

        {/* Measurement annotation — width arrow */}
        <line x1="15" y1="150" x2="205" y2="150" stroke="#1b6ac9" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
        <line x1="15" y1="146" x2="15" y2="154" stroke="#1b6ac9" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="205" y1="146" x2="205" y2="154" stroke="#1b6ac9" strokeWidth="1" strokeOpacity="0.4" />

        {/* Eave tick marks */}
        {[55, 95, 135, 175].map((x) => (
          <line key={x} x1={x} y1="25" x2={x} y2="20" stroke="#1b6ac9" strokeWidth="1" strokeOpacity="0.3" />
        ))}
      </svg>

      <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--jn-blue)", opacity: 0.5 }}>
        Aerial view
      </p>
    </div>
  )
}
