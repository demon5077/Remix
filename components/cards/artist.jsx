"use client";
import Link from "next/link";

export default function ArtistCard({ image, name, id }) {
  if (!name) return null;
  return (
    <Link
      href={"/search/" + encodeURIComponent((name || "").toLowerCase().split(" ").join("+"))}
      className="group flex flex-col items-center gap-2.5 flex-shrink-0 w-[100px]"
    >
      <div
        className="relative w-[100px] h-[100px] rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105"
        style={{
          border:    "2px solid var(--border-primary)",
          boxShadow: "none",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 0 20px var(--accent-glow), 0 0 0 2px var(--accent)`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ background: "var(--bg-card)" }}
          onError={e => {
            // If image fails, show initials
            e.target.style.display = "none";
            e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
          }}
        />
        {/* Initials fallback */}
        <div className="absolute inset-0 items-center justify-center text-2xl font-black hidden"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", fontFamily: "Orbitron, sans-serif", display: "none" }}>
          {(name || "?")[0].toUpperCase()}
        </div>
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 70%)" }}
        />
      </div>
      <p
        className="text-xs text-center font-semibold truncate w-full transition-colors duration-200"
        style={{ color: "var(--text-muted)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        {name}
      </p>
    </Link>
  );
}
