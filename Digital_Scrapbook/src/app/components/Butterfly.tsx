/**
 * A small, translucent butterfly that flutters diagonally across the screen
 * from the lower-left to the upper-right along a meandering path.
 */
interface ButterflyProps {
  /** Scale factor relative to the default 32 × 38.4px size. */
  scale?: number;
  /** Animation delay in seconds before the flight starts. */
  delay?: number;
  /** Which flight-path keyframes to use. */
  pathVariant?: 1 | 2;
  /** Overall opacity (0–1). Defaults to 0.85. */
  opacity?: number;
  /** Render upper wing lobes that reach higher above the body. */
  tallTopWings?: boolean;
}

export function Butterfly({
  scale = 1,
  delay = 0,
  pathVariant = 1,
  opacity = 0.85,
  tallTopWings = false,
}: ButterflyProps = {}) {
  const flightClass = pathVariant === 2 ? 'butterfly-flight-2' : 'butterfly-flight';
  const leftWingPath = tallTopWings
    ? 'M32 24 C 6 -4, -2 16, 12 33 C 6 38, 20 42, 32 40 Z'
    : 'M32 24 C 10 8, 2 24, 12 33 C 6 38, 20 42, 32 40 Z';
  const rightWingPath = tallTopWings
    ? 'M32 24 C 58 -4, 66 16, 52 33 C 58 38, 44 42, 32 40 Z'
    : 'M32 24 C 54 8, 62 24, 52 33 C 58 38, 44 42, 32 40 Z';
  return (
    <div
      aria-hidden="true"
      className={`${flightClass} pointer-events-none fixed z-50`}
      style={{
        // ~1/3 inch wide (≈ 32px at 96dpi), 1:1.2 aspect ratio
        width: `${32 * scale}px`,
        height: `${38.4 * scale}px`,
        left: 0,
        bottom: 0,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="butterfly-bob w-full h-full">
        <div className="butterfly-spin w-full h-full">
        <svg
          viewBox="0 0 64 64"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', opacity }}
        >
          {/* Body */}
          <ellipse cx="32" cy="32" rx="1.2" ry="9" fill="#ffffff" opacity="0.95" />
          {/* Antennae */}
          <path
            d="M32 23 Q 30 19 27 18"
            stroke="#ffffff"
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M32 23 Q 34 19 37 18"
            stroke="#ffffff"
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Left wings */}
          <g
            className="butterfly-wing-left"
            style={{ transformOrigin: '100% 50%', transformBox: 'fill-box' as const }}
          >
            <path
              d={leftWingPath}
              fill="#ffffff"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.85"
            />
          </g>

          {/* Right wings */}
          <g
            className="butterfly-wing-right"
            style={{ transformOrigin: '0% 50%', transformBox: 'fill-box' as const }}
          >
            <path
              d={rightWingPath}
              fill="#ffffff"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.85"
            />
          </g>
        </svg>
        </div>
      </div>
    </div>
  );
}
