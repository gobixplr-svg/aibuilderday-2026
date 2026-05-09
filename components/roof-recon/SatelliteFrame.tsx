type Props = {
  scanning?: boolean
  locked?: boolean
  accent?: string
  // When provided, render this image as the satellite view (the real fetched
  // aerial). When absent, render the stylized SVG placeholder used while the
  // pipeline is still fetching the tile.
  imageUrl?: string | null
}

export function SatelliteFrame({ scanning = false, locked = false, accent = "#FF6B2B", imageUrl = null }: Props) {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-sm"
      style={{ background: "linear-gradient(135deg, #1a3047 0%, #0f1d33 100%)" }}
    >
      {imageUrl ? (
        // Real fetched aerial. <img> not Next/Image because (a) this is a
        // dynamic localhost-served bitmap and (b) we don't want layout shift.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Satellite view of subject property"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          {/* Placeholder terrain — used only before the real aerial lands. */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, #2a4a3a 0%, transparent 35%),
                radial-gradient(circle at 75% 60%, #3a4a2a 0%, transparent 40%),
                radial-gradient(circle at 40% 80%, #2a3a4a 0%, transparent 35%),
                radial-gradient(circle at 90% 20%, #1a2a3a 0%, transparent 30%)
              `,
            }}
          />
          <svg
            viewBox="0 0 400 300"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <path d="M -20 220 Q 100 200, 200 215 T 420 200" stroke="#3a4858" strokeWidth="14" fill="none" opacity="0.6" />
            <path d="M -20 220 Q 100 200, 200 215 T 420 200" stroke="#5a6878" strokeWidth="1" strokeDasharray="6 8" fill="none" />
            <path d="M 280 -20 Q 270 100, 285 200 T 290 320" stroke="#3a4858" strokeWidth="10" fill="none" opacity="0.6" />
            <rect x="40"  y="60"  width="60" height="48" fill="#5a4035" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.7" />
            <rect x="320" y="40"  width="50" height="55" fill="#3a3530" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.7" />
            <rect x="50"  y="240" width="70" height="42" fill="#4a3a30" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.7" />
            <circle cx="150" cy="80"  r="14" fill="#2a4030" opacity="0.8" />
            <circle cx="220" cy="60"  r="10" fill="#2a4030" opacity="0.8" />
            <circle cx="370" cy="180" r="12" fill="#2a4030" opacity="0.8" />
            <circle cx="30"  cy="170" r="11" fill="#2a4030" opacity="0.8" />
            <g transform="translate(200 145) rotate(-8)">
              <polygon points="-70,-45 70,-45 70,45 -70,45" fill="#6b4a3a" stroke="#1a1a1a" strokeWidth="0.8" />
              <line x1="-70" y1="0" x2="70" y2="0" stroke="#2a1a10" strokeWidth="1.5" />
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`t${i}`} x1="-70" y1={-40 + i * 6} x2="70" y2={-40 + i * 6} stroke="#5a3a2a" strokeWidth="0.4" opacity="0.6" />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`b${i}`} x1="-70" y1={5 + i * 6}  x2="70" y2={5 + i * 6}  stroke="#5a3a2a" strokeWidth="0.4" opacity="0.6" />
              ))}
              <polygon points="40,45 75,45 75,90 40,90" fill="#6b4a3a" stroke="#1a1a1a" strokeWidth="0.8" />
              <line x1="57" y1="45" x2="57" y2="90" stroke="#2a1a10" strokeWidth="1.2" />
              <rect x="20" y="-15" width="10" height="10" fill="#3a2a20" stroke="#1a1a1a" strokeWidth="0.5" />
              {locked && (
                <polygon
                  points="-70,-45 70,-45 75,90 40,90 40,45 -70,45"
                  fill={accent}
                  fillOpacity="0.12"
                  stroke={accent}
                  strokeWidth="1.5"
                />
              )}
            </g>
          </svg>
        </>
      )}

      {/* Scanline sweep — over either real aerial or placeholder */}
      {scanning && (
        <div
          className="absolute inset-x-0 h-12 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${accent}33 50%, transparent 100%)`,
            animation: "scanline 2.4s linear infinite",
          }}
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 100px rgba(0,0,0,0.7)" }}
      />
    </div>
  )
}
