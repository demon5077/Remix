"use client";
import Footer from "@/components/page/footer";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    text: "By accessing or using Arise — including its web interface, features, and associated services — you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use immediately. These terms apply to all visitors, users, and others who access the service.",
  },
  {
    title: "2. Description of Service",
    text: "Arise is an educational music streaming interface that aggregates publicly available music metadata via the JioSaavn API and enables YouTube playback via the YouTube IFrame API. Arise does not host, store, or distribute any audio or video content directly.",
  },
  {
    title: "3. Account Responsibilities",
    items: [
      "You are responsible for maintaining the confidentiality of any OAuth tokens associated with your account.",
      "You must not share your session credentials or allow unauthorised access to your account.",
      "You agree to provide accurate information when connecting third-party accounts (Google, Spotify).",
      "You are solely responsible for all activity conducted through your account.",
    ],
  },
  {
    title: "4. Permitted Use",
    items: [
      "Arise may be used solely for personal, non-commercial, educational purposes.",
      "You may browse, stream, and organise music for your own enjoyment.",
      "You may create playlists, like tracks, and import playlists from connected services.",
      "You may share Arise with others as a discovery resource.",
    ],
  },
  {
    title: "5. Prohibited Activities",
    items: [
      "Copying, reproducing, distributing, or exploiting any content from Arise for commercial purposes.",
      "Reverse engineering, decompiling, or attempting to extract source code.",
      "Using automated tools, bots, or scrapers to access or collect data from Arise.",
      "Circumventing any technical measures designed to protect the service or third-party APIs.",
      "Using Arise to facilitate piracy, copyright infringement, or any illegal activity.",
      "Attempting to gain unauthorised access to any portion of the service or its related systems.",
      "Impersonating any person or entity, or misrepresenting your affiliation with any person or entity.",
    ],
  },
  {
    title: "6. Intellectual Property",
    text: "All music content accessible through Arise belongs to its respective rights holders and is licensed through JioSaavn or YouTube. The Arise interface, design, codebase, and branding are the intellectual property of the creator (Sunil). You may not use the Arise name, logo, or branding without explicit written permission.",
  },
  {
    title: "7. Third-Party Services",
    text: "Arise integrates with third-party services including JioSaavn, YouTube (Google LLC), and Spotify. Your use of these services through Arise is also subject to their respective terms and policies. Arise is not responsible for the availability, accuracy, or legality of third-party content.",
  },
  {
    title: "8. Limitation of Liability",
    text: "Arise is provided 'as is' and 'as available', without any warranties of any kind, express or implied. To the fullest extent permitted by law, the creators of Arise shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the service — including but not limited to loss of data, revenue, or goodwill.",
  },
  {
    title: "9. Content Disclaimer",
    text: "Arise does not endorse, guarantee, or take responsibility for the accuracy, completeness, or appropriateness of any content accessible through the service. All music, podcast, and video content is owned by and the responsibility of the original content creators and rights holders.",
  },
  {
    title: "10. Termination",
    text: "We reserve the right to suspend or terminate access to Arise at our sole discretion, without notice, for conduct that we believe violates these Terms, is harmful to other users, us, third parties, or for any other reason. Upon termination, your right to use the service will immediately cease.",
  },
  {
    title: "11. Modifications to Terms",
    text: "We reserve the right to modify these Terms at any time. Material changes will be communicated with reasonable notice. Your continued use of Arise following the posting of revised Terms constitutes your acceptance of the changes.",
  },
  {
    title: "12. Governing Law",
    text: "These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in India.",
  },
  {
    title: "13. Contact",
<<<<<<< HEAD
    text: "For any questions about these Terms, please contact: legal@arise.music (placeholder — replace with actual contact before production deployment).",
=======
    text: "For any questions about these Terms, please contact: legal@arise.pp.ua",
>>>>>>> 5515522fddb6d87b4ff5301809ce05597f8bf9c4
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ color: "#ccccee" }}>
      {/* Hero */}
      <section className="relative px-6 md:px-12 pt-16 pb-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,0,0,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <p className="text-xs tracking-[0.4em] uppercase mb-3"
          style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
          ✦ Legal ✦
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-4"
          style={{
            fontFamily: "Orbitron, sans-serif",
            background: "linear-gradient(135deg, #FF003C, #9D4EDD)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
          Terms &amp;<br />Conditions
        </h1>
        <p className="text-sm" style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
          Last updated: June 2025 · Please read carefully before using Arise.
        </p>
      </section>

      <div className="mx-6 md:mx-12 h-[1px]"
        style={{ background: "linear-gradient(to right, rgba(255,0,60,0.3), transparent)" }} />

      {/* Content */}
      <section className="px-6 md:px-12 py-12 max-w-3xl space-y-10">
        {SECTIONS.map(({ title, text, items }) => (
          <div key={title}>
            <h2 className="text-base font-bold mb-4"
              style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
              {title}
            </h2>
            {text && (
              <p className="text-sm leading-relaxed pl-4"
                style={{ color: "#8888aa", borderLeft: "2px solid rgba(255,0,60,0.15)" }}>
                {text}
              </p>
            )}
            {items && (
              <ul className="space-y-2 pl-4"
                style={{ borderLeft: "2px solid rgba(255,0,60,0.15)" }}>
                {items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed flex gap-2.5">
                    <span style={{ color: "#FF003C", flexShrink: 0 }}>◆</span>
                    <span style={{ color: "#8888aa" }}>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
