"use client";
import Footer from "@/components/page/footer";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: [
      {
        sub: "1.1 Account Data",
        text: "When you connect via Google or Spotify OAuth, we receive your public profile data — display name, email address, and profile photo — solely to personalise your experience within Arise.",
      },
      {
        sub: "1.2 Usage Data",
        text: "We may collect anonymised usage signals such as which genres you listen to, play duration, and navigation paths. This data is never tied to your personal identity and is used only to improve recommendations.",
      },
      {
        sub: "1.3 Locally Stored Data",
        text: "Liked songs, recently played tracks, and playlist data are stored in your browser's localStorage. This data never leaves your device unless you choose to sync it.",
      },
      {
        sub: "1.4 Cookies",
        text: "Arise uses strictly functional cookies to maintain session state. We do not use advertising or tracking cookies. You may clear cookies at any time through your browser settings.",
      },
    ],
  },
  {
    title: "2. How We Use Your Data",
    content: [
      {
        sub: "2.1 Personalisation",
        text: "Your playback history and preferences power the 'Recommended for You' and mood-based playlist features. This processing occurs client-side wherever possible.",
      },
      {
        sub: "2.2 Service Operation",
        text: "OAuth tokens from Google and Spotify are used exclusively to import your playlists upon your explicit request. Tokens are stored locally and are never transmitted to our servers.",
      },
      {
        sub: "2.3 We Never Sell Your Data",
        text: "Arise does not sell, rent, lease, or otherwise commercially exploit your personal data to any third party — ever.",
      },
    ],
  },
  {
    title: "3. Third-Party Services",
    content: [
      {
        sub: "3.1 JioSaavn API",
        text: "Music metadata and streaming URLs are fetched from the JioSaavn public API (saavn.dev). Your interactions with this service are subject to JioSaavn's own Privacy Policy.",
      },
      {
        sub: "3.2 YouTube / Google",
        text: "YouTube video playback and Google OAuth are provided by Google LLC. Usage of these services is governed by Google's Privacy Policy and Terms of Service.",
      },
      {
        sub: "3.3 Spotify",
        text: "Spotify playlist import is powered by the Spotify Web API. Usage is subject to Spotify's Privacy Policy.",
      },
    ],
  },
  {
    title: "4. Data Security",
    content: [
      {
        sub: "4.1 Encryption",
        text: "All data in transit between your browser and third-party APIs is encrypted via HTTPS/TLS. We do not operate our own backend servers that store user data.",
      },
      {
        sub: "4.2 Breach Notification",
        text: "In the unlikely event of a data breach affecting user information, we will notify affected users within 72 hours of becoming aware of the breach.",
      },
    ],
  },
  {
    title: "5. Your Rights",
    content: [
      {
        sub: "5.1 Access & Deletion",
        text: "You may clear all locally stored data at any time by clearing your browser storage. OAuth sessions can be revoked directly from Google's or Spotify's account settings pages.",
      },
      {
        sub: "5.2 Opt-Out",
        text: "You may use Arise without connecting any third-party account. Features requiring OAuth (playlist import, YouTube history) will be unavailable, but core music streaming remains fully functional.",
      },
      {
        sub: "5.3 Contact",
        text: "For any privacy-related enquiries, reach out to: privacy@arise.music (placeholder — replace with actual contact before production deployment).",
      },
    ],
  },
  {
    title: "6. Children's Privacy",
    content: [
      {
        sub: "",
        text: "Arise is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.",
      },
    ],
  },
  {
    title: "7. Changes to This Policy",
    content: [
      {
        sub: "",
        text: "We may update this Privacy Policy from time to time. Material changes will be communicated via an in-app notification. Continued use of Arise after changes are posted constitutes acceptance of the revised policy.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ color: "#ccccee" }}>
      {/* Hero */}
      <section className="relative px-6 md:px-12 pt-16 pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <p className="text-xs tracking-[0.4em] uppercase mb-3"
          style={{ color: "#9D4EDD", fontFamily: "Orbitron, sans-serif" }}>
          ✦ Legal ✦
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-4"
          style={{
            fontFamily: "Orbitron, sans-serif",
            background: "linear-gradient(135deg, #9D4EDD, #FF003C)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
          Privacy Policy
        </h1>
        <p className="text-sm" style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
          Last updated: June 2025 · Effective immediately
        </p>
        <p className="mt-4 text-sm max-w-xl leading-relaxed" style={{ color: "#8888aa" }}>
          Arise is committed to your privacy. This policy explains what data we handle, why, and how we protect it. We keep things honest and plain-spoken.
        </p>
      </section>

      <div className="mx-6 md:mx-12 h-[1px]" style={{ background: "linear-gradient(to right, rgba(157,78,221,0.3), transparent)" }} />

      {/* Content */}
      <section className="px-6 md:px-12 py-12 max-w-3xl space-y-10">
        {SECTIONS.map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold mb-5"
              style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8", fontSize: "1rem" }}>
              {title}
            </h2>
            <div className="space-y-4">
              {content.map(({ sub, text }) => (
                <div key={sub + text}
                  className="pl-4"
                  style={{ borderLeft: "2px solid rgba(157,78,221,0.2)" }}>
                  {sub && (
                    <p className="text-xs font-bold mb-1"
                      style={{ color: "#9D4EDD", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em" }}>
                      {sub}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
