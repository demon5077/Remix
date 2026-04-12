import Link from "next/link";
import Image from "next/image";

export default function Logo({ size = "default" }) {
  const isSmall = size === "small";
  const dim     = isSmall ? 28 : 34;
  return (
    <Link href="/" className="select-none group flex items-center gap-2.5">
      <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ width: dim, height: dim }}>
        <Image
          src="/arise-logo.svg"
          alt="Arise logo"
          width={dim}
          height={dim}
          priority
          style={{ filter: "drop-shadow(0 0 6px rgba(255,0,60,0.5))" }}
        />
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
