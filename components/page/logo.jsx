import Link from "next/link";

export default function Logo({ size = "default" }) {
  const isSmall = size === "small";
  const dim     = isSmall ? 28 : 34;
  return (
    <Link href="/" className="select-none group flex items-center gap-2.5">
      {/* SVG logo inline — avoids the /arise-logo.svg next/image issue */}
      <div
        className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim} height={dim} viewBox="0 0 40 40" fill="none"
          style={{ filter: "drop-shadow(0 0 6px rgba(255,0,60,0.5))" }}
        >
          <circle cx="20" cy="20" r="18" fill="url(#logoGrad)" opacity="0.15" />
          <path d="M20 6 L32 30 L8 30 Z" fill="url(#logoGrad)" />
          <path d="M20 12 L28 28 L12 28 Z" fill="#07070d" />
          <circle cx="20" cy="21" r="3" fill="url(#logoGrad)" />
          <defs>
            <linearGradient id="logoGrad" x1="8" y1="6" x2="32" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF003C" />
              <stop offset="100%" stopColor="#9D4EDD" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span
        className={`font-black tracking-tight transition-all duration-300 group-hover:tracking-widest ${isSmall ? "text-lg" : "text-2xl"}`}
        style={{
          fontFamily: "Orbitron, sans-serif",
          background: "linear-gradient(135deg, #FF003C 0%, #9D4EDD 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 8px rgba(255,0,60,0.4))",
        }}
      >
        Arise
      </span>
    </Link>
  );
}
