type Props = {
  size?: number
  locked?: boolean
  scanning?: boolean
  color?: string
}

export function Reticle({ size = 220, locked = false, scanning = false, color = "#FF6B2B" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" style={{ overflow: "visible" }}>
      {/* Corner brackets */}
      {([
        [10, 10, 1, 1],
        [210, 10, -1, 1],
        [10, 210, 1, -1],
        [210, 210, -1, -1],
      ] as [number, number, number, number][]).map(([x, y, dx, dy], i) => (
        <g key={i} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="square">
          <line x1={x} y1={y} x2={x + 22 * dx} y2={y} />
          <line x1={x} y1={y} x2={x} y2={y + 22 * dy} />
        </g>
      ))}

      {/* Crosshair lines */}
      <line x1="110" y1="0"   x2="110" y2="80"  stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="110" y1="140" x2="110" y2="220" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="0"   y1="110" x2="80"  y2="110" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="140" y1="110" x2="220" y2="110" stroke={color} strokeWidth="1" opacity="0.5" />

      {/* Targeting circle */}
      <circle
        cx="110" cy="110"
        r={locked ? 38 : 32}
        fill="none"
        stroke={color}
        strokeWidth={locked ? 2 : 1}
        strokeDasharray={scanning ? "4 6" : undefined}
        opacity={locked ? 1 : 0.6}
      >
        {scanning && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 110 110"
            to="360 110 110"
            dur="6s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Center dot */}
      <circle cx="110" cy="110" r="3" fill={color} />
    </svg>
  )
}
