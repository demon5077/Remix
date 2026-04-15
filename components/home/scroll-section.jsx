"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ScrollSection({ title, subtitle, href, children, loading }) {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2
            className="text-lg font-bold leading-tight"
            style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "#44445a" }}>{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Arrow buttons — desktop only */}
          <button
            onClick={() => scroll(-1)}
            className="hidden md:flex w-7 h-7 rounded-full items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#44445a" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.borderColor = "rgba(255,0,60,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="hidden md:flex w-7 h-7 rounded-full items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#44445a" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.borderColor = "rgba(255,0,60,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {href && (
            <Link
              href={href}
              className="text-xs font-semibold transition-all duration-200"
              style={{ color: "#FF003C", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#ff4466"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#FF003C"; }}
            >
              See all →
            </Link>
          )}
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {children}
      </div>
    </section>
  );
}
