import Link from "next/link";

export default function Logo({ size = "default" }) {
  const isSmall = size === "small";
  return (
    <Link href="/" className="select-none group flex items-center gap-2">
      {/* Demon horns SVG icon */}
      <svg
        width={isSmall ? "28" : "34"}
        height={isSmall ? "28" : "34"}
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF003C" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Outer circle */}
        <circle cx="17" cy="17" r="16" fill="rgba(139,0,0,0.15)" stroke="url(#logoGrad)" strokeWidth="1.2" />
        {/* Left horn */}
        <path d="M8 20 C7 14, 5 10, 8 6 C9 9, 10 12, 10 16" fill="url(#logoGrad)" filter="url(#logoGlow)" />
        {/* Right horn */}
        <path d="M26 20 C27 14, 29 10, 26 6 C25 9, 24 12, 24 16" fill="url(#logoGrad)" filter="url(#logoGlow)" />
        {/* Devil face / music wave */}
        <path d="M10 22 Q13 18 17 22 Q21 26 24 22" stroke="url(#logoGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        <ellipse cx="13.5" cy="19" rx="1.5" ry="1.8" fill="#FF003C" opacity="0.9" />
        <ellipse cx="20.5" cy="19" rx="1.5" ry="1.8" fill="#FF003C" opacity="0.9" />
        {/* Glow dots on eyes */}
        <circle cx="14" cy="18.5" r="0.5" fill="white" opacity="0.7" />
        <circle cx="21" cy="18.5" r="0.5" fill="white" opacity="0.7" />
      </svg>

      {/* Wordmark */}
      <span
        className={`font-display font-black tracking-tight transition-all duration-300 group-hover:tracking-widest ${
          isSmall ? "text-lg" : "text-2xl"
        }`}
        style={{
          fontFamily: 'Orbitron, sans-serif',
          background: 'linear-gradient(135deg, #FF003C 0%, #9D4EDD 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 8px rgba(255,0,60,0.4))',
        }}
      >
        RemiX
      </span>
    </Link>
  );
}
