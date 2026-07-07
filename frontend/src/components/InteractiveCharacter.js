import { useEffect, useRef, useState } from 'react';

const EYE_RADIUS = 8;
const PUPIL_RADIUS = 3.5;
const PUPIL_MAX_MOVE = 4.5;

export default function InteractiveCharacter() {
  const [smoothRatio, setSmoothRatio] = useState({ x: 0.5, y: 0.5 });
  const [loaded, setLoaded] = useState(false);
  const [blink, setBlink] = useState(false);
  const rawRef = useRef({ x: 0.5, y: 0.5 });
  const smoothRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);

  // Fade in after a short delay
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Track raw mouse position into a ref (no re-render)
  useEffect(() => {
    const handleMouse = (e) => {
      rawRef.current.x = e.clientX / window.innerWidth;
      rawRef.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Smooth interpolation via rAF, only update state when values actually change
  useEffect(() => {
    let running = true;
    const step = () => {
      if (!running) return;
      const s = smoothRef.current;
      const r = rawRef.current;
      const sx = s.x + (r.x - s.x) * 0.08;
      const sy = s.y + (r.y - s.y) * 0.08;
      s.x = sx;
      s.y = sy;

      // Only set state when values have meaningfully changed (performance)
      if (Math.abs(sx - smoothRatio.x) > 0.001 || Math.abs(sy - smoothRatio.y) > 0.001) {
        setSmoothRatio({ x: sx, y: sy });
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [smoothRatio]);

  // Blink every 3–5 seconds
  useEffect(() => {
    let blinkTimer;
    const schedule = () => {
      blinkTimer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        schedule();
      }, 3000 + Math.random() * 2500);
    };
    schedule();
    return () => clearTimeout(blinkTimer);
  }, []);

  // Derive animation values
  const cx = (smoothRatio.x - 0.5) * 2; // -1..1
  const cy = (smoothRatio.y - 0.5) * 2;
  const pox = cx * PUPIL_MAX_MOVE;
  const poy = cy * PUPIL_MAX_MOVE;
  const headTilt = cx * 6; // degrees

  return (
    <div
      className="fixed bottom-0 right-0 z-[0] pointer-events-none select-none"
      style={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
    >
      <svg
        width="160"
        height="180"
        viewBox="0 0 160 180"
        style={{ overflow: 'visible' }}
      >
        <g
          style={{
            transform: `translate(80px, 90px) rotate(${headTilt}deg)`,
            transformOrigin: '80px 90px',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Glow behind head */}
          <circle cx="0" cy="-2" r="52" fill="url(#ariaGlow)" opacity="0.5" />

          {/* Head body */}
          <circle cx="0" cy="-2" r="38" fill="white" stroke="#111" strokeWidth="1.2" opacity="0.92" />

          {/* Top accent line */}
          <path d="M -18 -34 Q 0 -40 18 -34" fill="none" stroke="#111" strokeWidth="1" opacity="0.3" />

          {/* Left eye */}
          {blink ? (
            <line x1="-16" y1="-10" x2="-8" y2="-10" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="-12" cy="-10" r={EYE_RADIUS} fill="#f5f5f5" stroke="#111" strokeWidth="1" />
              <circle cx={-12 + pox} cy={-10 + poy} r={PUPIL_RADIUS} fill="#111" />
              <circle
                cx={-12 + pox * 0.6 - 0.8}
                cy={-10 + poy * 0.6 - 0.8}
                r="1.2"
                fill="white"
                opacity="0.7"
              />
            </>
          )}

          {/* Right eye */}
          {blink ? (
            <line x1="8" y1="-10" x2="16" y2="-10" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="12" cy="-10" r={EYE_RADIUS} fill="#f5f5f5" stroke="#111" strokeWidth="1" />
              <circle cx={12 + pox} cy={-10 + poy} r={PUPIL_RADIUS} fill="#111" />
              <circle
                cx={12 + pox * 0.6 + 0.8}
                cy={-10 + poy * 0.6 - 0.8}
                r="1.2"
                fill="white"
                opacity="0.7"
              />
            </>
          )}

          {/* Mouth — small smile */}
          <path
            d="M -6 8 Q 0 14 6 8"
            fill="none"
            stroke="#111"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Ear / antenna dots */}
          <circle cx="-38" cy="-10" r="1.5" fill="#111" opacity="0.5" />
          <circle cx="38" cy="-10" r="1.5" fill="#111" opacity="0.5" />
          <circle cx="-38" cy="-2" r="1.5" fill="#111" opacity="0.3" />
          <circle cx="38" cy="-2" r="1.5" fill="#111" opacity="0.3" />
        </g>

        <defs>
          <radialGradient id="ariaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
