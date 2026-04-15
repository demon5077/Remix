"use client";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/about",   label: "About"          },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms"          },
];

const SOCIALS = [
  { href: "https://github.com",    label: "GitHub",    icon: "github"    },
  { href: "https://twitter.com",   label: "Twitter",   icon: "twitter"   },
  { href: "https://instagram.com", label: "Instagram", icon: "instagram" },
  { href: "https://discord.com",   label: "Discord",   icon: "discord"   },
  { href: "https://youtube.com",   label: "YouTube",   icon: "youtube"   },
];

function SocialIcon({ type }) {
  const paths = {
    github: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
    twitter: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84",
    instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
    discord: "M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z",
    youtube: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d={paths[type]} />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="relative mt-12 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,0,60,0.08)" }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, rgba(255,0,60,0.4), rgba(157,78,221,0.4), transparent)" }}
      />

      <div
        className="px-6 md:px-8 lg:px-12 py-10"
        style={{ background: "rgba(5,5,10,0.6)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <p
            className="text-[10px] mb-1.5 tracking-[0.3em] uppercase"
            style={{ color: "#9999bb", fontFamily: "Orbitron, sans-serif" }}
          >
            ✦ crafted in darkness ✦
          </p>
          <p
            className="text-sm font-bold"
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: "linear-gradient(90deg, #8B0000, #FF003C, #9D4EDD, #FF003C, #8B0000)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmerText 4s linear infinite",
              filter: "drop-shadow(0 0 10px rgba(255,0,60,0.5))",
              letterSpacing: "0.08em",
            }}
          >
            Arise from the shadows. Crafted in darkness by Sunil.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-wrap gap-5 items-center">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-xs transition-all duration-200"
                style={{ color: "#9999bb", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#9999bb"; }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {SOCIALS.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#FF003C";
                  e.currentTarget.style.borderColor = "rgba(255,0,60,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 14px rgba(255,0,60,0.3)";
                  e.currentTarget.style.background = "rgba(255,0,60,0.06)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#9999bb";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <SocialIcon type={icon} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          <p
            className="text-center text-[10px] tracking-[0.06em]"
            style={{ color: "#8888bb", fontFamily: "Rajdhani, sans-serif" }}
          >
            © {new Date().getFullYear()} Arise · Powered by JioSaavn API &amp; YouTube · Educational purposes only.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmerText {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </footer>
  );
}
