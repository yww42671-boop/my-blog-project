import { useEffect, useState, useCallback } from 'react';
import useTypewriter from '../hooks/useTypewriter';

const NAV_LINKS = ['Labs', 'Studio', 'Openings', 'Shop'];
const PILL_LABELS = ['Pitch us an idea', 'Come work here', 'Send a brief hello', 'See how we operate'];

export default function MainframeHero({ onGetInTouch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const { displayed, done } = useTypewriter(
    'Glad you stopped in. Good taste tends to find us. Now, what are we building?',
    38,
    600
  );

  // Show pills 400 ms after mount (independent of typewriter)
  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const copyEmail = useCallback(() => {
    navigator.clipboard.writeText('hello@mainframe.co').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <>
      {/* ===== NAVBAR (fixed, z-10) ===== */}
      <nav className="fixed top-0 left-0 w-full z-10 px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo — uses heading font */}
        <div className="flex items-center gap-3">
          <span
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-[21px] sm:text-[26px] tracking-tight text-black"
          >
            Mainframe&reg;
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-black select-none"
            style={{ letterSpacing: '-0.02em' }}
          >
            &#10039;&#65038;
          </span>
        </div>

        {/* Desktop nav (hidden below md) — text-[23px], black, hover:opacity-60 */}
        <div className="hidden md:flex items-center text-[23px] text-black">
          {NAV_LINKS.map((name, i) => (
            <span key={name}>
              {i > 0 && <span className="mx-0">, </span>}
              <button
                className="hover:opacity-60 transition-opacity bg-transparent border-none p-0 cursor-pointer font-body text-[23px]"
                onClick={() => {/* placeholder */}}
              >
                {name}
              </button>
            </span>
          ))}
        </div>

        {/* Desktop CTA (hidden below md) */}
        <button
          className="hidden md:inline text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity bg-transparent border-none p-0 cursor-pointer font-body"
          onClick={() => onGetInTouch && onGetInTouch()}
        >
          Get in touch
        </button>

        {/* Mobile hamburger (visible below md) */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex flex-col gap-[5px] p-1"
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-[2px] bg-black block transition-all duration-300 ${
              menuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black block transition-all duration-300 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black block transition-all duration-300 ${
              menuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </nav>

      {/* ===== MOBILE OVERLAY (z-9, hidden on md+) ===== */}
      <div
        className={`fixed inset-0 z-[9] bg-white/95 backdrop-blur-sm flex flex-col items-start justify-center px-8 gap-8 md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {NAV_LINKS.map((name) => (
          <button
            key={name}
            className="text-[32px] font-medium text-black hover:opacity-60 transition-opacity bg-transparent border-none p-0 cursor-pointer font-body text-left"
            onClick={() => setMenuOpen(false)}
          >
            {name}
          </button>
        ))}
        <button
          className="text-[32px] font-medium text-black underline underline-offset-4 hover:opacity-60 transition-opacity bg-transparent border-none p-0 cursor-pointer font-body text-left"
          onClick={() => { setMenuOpen(false); onGetInTouch && onGetInTouch(); }}
        >
          Get in touch
        </button>
      </div>

      {/* ===== HERO SECTION (z-1) ===== */}
      <section className="relative z-[1] h-screen flex flex-col justify-end md:justify-center pb-12 md:pb-0 overflow-hidden px-5 sm:px-8 md:px-10">
        <div className="max-w-xl relative z-10">
          {/* --- Blurred intro label --- */}
          <div
            className="pointer-events-none select-none mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              color: '#000',
              filter: 'blur(4px)',
            }}
          >
            Hey there, meet A.R.I.A,
            <br />
            Mainframe&apos;s Adaptive Response Interface Agent
          </div>

          {/* --- Typewriter text --- */}
          <div
            className="mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
              color: '#000',
              minHeight: '54px',
            }}
          >
            {displayed}
            {!done && (
              <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-blink" />
            )}
          </div>

          {/* --- Action pills (fade-in + slide-up independent of typewriter) --- */}
          <div
            className="flex flex-wrap gap-y-1"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {/* 4 white pill buttons */}
            {PILL_LABELS.map((label) => (
              <button
                key={label}
                className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
              >
                {label}
              </button>
            ))}

            {/* Outline email pill with copy icon */}
            <button
              onClick={copyEmail}
              className="inline-flex items-center justify-center bg-transparent text-white border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-white hover:text-black transition-colors duration-200 gap-2 sm:gap-3"
            >
              <span>
                Reach us:{' '}
                <span className="underline underline-offset-1">hello@mainframe.co</span>
                {copied && (
                  <span className="ml-2 text-[11px] text-green-300 hover:text-green-700 transition-colors">
                    Copied!
                  </span>
                )}
              </span>
              {/* Copy icon — two overlapping rectangles */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
