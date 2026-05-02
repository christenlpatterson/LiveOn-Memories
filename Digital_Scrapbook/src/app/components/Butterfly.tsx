import { useEffect, useMemo, useState } from 'react';

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
  /** Base stroke/fill color for body, antennae, and wings. */
  baseColor?: string;
  /** Render upper wing lobes that reach higher above the body. */
  tallTopWings?: boolean;
}

export function Butterfly({
  scale = 1,
  delay = 0,
  pathVariant = 1,
  opacity = 0.85,
  baseColor = '#6c93a0',
  tallTopWings = false,
}: ButterflyProps = {}) {
  const [activePathVariant, setActivePathVariant] = useState<1 | 2>(pathVariant);

  // Deterministic per-instance variation so butterflies do not turn in sync.
  const timingSeed = useMemo(() => {
    const n = Math.sin((delay + 1.37) * 12.9898 + scale * 78.233 + pathVariant * 37.719);
    return Math.abs(n);
  }, [delay, scale, pathVariant]);

  const flightDuration = activePathVariant === 2
    ? 19.2 + timingSeed * 2.4
    : 17.0 + timingSeed * 2.2;

  useEffect(() => {
    setActivePathVariant(pathVariant);
  }, [pathVariant]);

  const flightClass = activePathVariant === 2 ? 'butterfly-flight-2' : 'butterfly-flight';
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
      onAnimationIteration={(e) => {
        // Only react to the top-level flight animation, not nested bob/spin/wing animations.
        if (e.currentTarget !== e.target) return;
        if (e.animationName !== 'butterfly-flight' && e.animationName !== 'butterfly-flight-2') return;
        setActivePathVariant((v) => (v === 1 ? 2 : 1));
      }}
      style={{
        // ~1/3 inch wide (≈ 32px at 96dpi), 1:1.2 aspect ratio
        width: `${32 * scale}px`,
        height: `${38.4 * scale}px`,
        left: 0,
        bottom: 0,
        animationDelay: `${delay}s`,
        animationDuration: `${flightDuration}s`,
      }}
    >
      <div
        className="butterfly-bob w-full h-full"
        style={{
          animationDelay: `${delay * 0.73 + (pathVariant === 2 ? 0.4 : 0)}s`,
          animationDuration: pathVariant === 2 ? '2.1s' : '1.6s',
        }}
      >
        <div
          className="butterfly-spin w-full h-full"
          style={{
            animationDelay: `${delay * 1.3 + (pathVariant === 2 ? 1.7 : 0)}s`,
            animationDuration: pathVariant === 2 ? '6.4s' : '5s',
          }}
        >
        <svg
          viewBox="0 0 64 64"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', opacity }}
        >
          {/* Body */}
          <ellipse cx="32" cy="32" rx="1.2" ry="9" fill={baseColor} opacity="0.95" />
          {/* Antennae */}
          <path
            d="M32 23 Q 30 19 27 18"
            stroke={baseColor}
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M32 23 Q 34 19 37 18"
            stroke={baseColor}
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Left wings */}
          <g
            className="butterfly-wing-left"
            style={{
              transformOrigin: '100% 50%',
              transformBox: 'fill-box' as const,
              animationDuration: activePathVariant === 2 ? '0.20s' : '0.18s',
              animationDelay: `${delay * 0.5 + (activePathVariant === 2 ? 0.07 : 0)}s`,
            }}
          >
            <path
              d={leftWingPath}
              fill={baseColor}
              stroke={baseColor}
              strokeWidth="0.5"
              opacity="0.85"
            />
          </g>

          {/* Right wings */}
          <g
            className="butterfly-wing-right"
            style={{
              transformOrigin: '0% 50%',
              transformBox: 'fill-box' as const,
              animationDuration: activePathVariant === 2 ? '0.20s' : '0.18s',
              animationDelay: `${delay * 0.5 + (activePathVariant === 2 ? 0.07 : 0)}s`,
            }}
          >
            <path
              d={rightWingPath}
              fill={baseColor}
              stroke={baseColor}
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
