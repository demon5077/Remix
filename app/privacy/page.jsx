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
        text: "Arise uses strictly functional cookies to maintain session state. We do not use advertising or tracking cookies.",
      },
    ],
  },

  {
    title: "2. How We Use Your Data",
    content: [
      {
        sub: "2.1 Personalisation",
        text: "Your playback history and preferences power recommendation features. Processing occurs client-side wherever possible.",
      },
      {
        sub: "2.2 Service Operation",
        text: "OAuth tokens from Google and Spotify are used only when you explicitly request features such as playlist import. Tokens are stored locally and never transmitted to our servers.",
      },
      {
        sub: "2.3 No Sale of Data",
        text: "Arise does not sell, rent, or commercially exploit your personal data.",
      },
    ],
  },

  {
    title: "3. Data Sharing and Disclosure",
    content: [
      {
        sub: "3.1 No Sale of Personal Data",
        text: "We do not sell, rent, or trade your personal information, including Google user data.",
      },
      {
        sub: "3.2 No Unauthorized Sharing",
        text: "We do not share, transfer, or disclose Google user data to external organizations except when required to provide functionality you explicitly request.",
      },
      {
        sub: "3.3 Third-Party Processing",
        text: "Features may rely on third-party services such as Google (YouTube) and Spotify. These services may process data independently under their own policies. We do not send Google user data beyond what is required for requested functionality.",
      },
      {
        sub: "3.4 Legal Requirements",
        text: "We may disclose information if required by law or valid legal process.",
      },
      {
        sub: "3.5 Local-Only Storage",
        text: "OAuth tokens and related data are stored locally on your device and are never transmitted to Arise servers.",
      },
    ],
  },

  {
    title: "4. Google API Services User Data Policy Compliance",
    content: [
      {
        sub: "4.1 Limited Use Compliance",
        text: "Arise's use and transfer of information received from Google APIs complies with the Google API Services User Data Policy, including the Limited Use requirements.",
      },
      {
        sub: "4.2 Purpose Limitation",
        text: "Google user data is used only for user-facing features such as authentication and optional playlist import.",
      },
      {
        sub: "4.3 No Advertising Use",
        text: "We do not use Google user data for advertising, marketing, or profiling purposes.",
      },
      {
        sub: "4.4 No Human Access",
        text: "We do not allow humans to read Google user data except with your consent or when required for security or legal reasons.",
      },
      {
        sub: "4.5 No Unauthorized Transfer",
        text: "We do not transfer Google user data to third parties except as necessary to provide requested functionality in compliance with Google's policies.",
      },
    ],
  },

  {
    title: "5. Third-Party Services",
    content: [
      {
        sub: "5.1 YouTube / Google",
        text: "Google OAuth is used for authentication and basic profile access (name, email, profile picture). This data is used only within Arise in compliance with Google's Limited Use requirements and is not stored on our servers or shared externally.",
      },
      {
        sub: "5.2 Spotify",
        text: "Spotify integration is used only when you request playlist import.",
      },
    ],
  },

  {
    title: "6. Data Security",
    content: [
      {
        sub: "6.1 Encryption",
        text: "All data in transit is encrypted via HTTPS/TLS.",
      },
      {
        sub: "6.2 Architecture",
        text: "Arise does not operate backend servers that store user personal data.",
      },
    ],
  },

  {
    title: "7. Your Rights",
    content: [
      {
        sub: "7.1 Data Control",
        text: "You can clear all stored data by clearing your browser storage.",
      },
      {
        sub: "7.2 OAuth Revocation",
        text: "You can revoke access anytime via your Google or Spotify account settings.",
      },
      {
        sub: "7.3 Contact",
        text: "For privacy inquiries, contact: privacy@arise.pp.ua",
      },
    ],
  },

  {
    title: "8. Children's Privacy",
    content: [
      {
        sub: "",
        text: "Arise is not intended for children under 13.",
      },
    ],
  },

  {
    title: "9. Changes to This Policy",
    content: [
      {
        sub: "",
        text: "We may update this policy periodically. Continued use means acceptance of updates.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ color: "#ccccee" }}>
      <section className="px-6 md:px-12 pt-16 pb-12">
        <h1 className="text-4xl md:text-6xl font-black mb-4">
          Privacy Policy
        </h1>

        <p className="text-sm">
          Last updated: April 2026 · Effective immediately
        </p>
      </section>

      <section className="px-6 md:px-12 py-12 max-w-3xl space-y-10">
        {SECTIONS.map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold mb-5">{title}</h2>

            <div className="space-y-4">
              {content.map(({ sub, text }) => (
                <div key={sub + text}>
                  {sub && <p className="text-xs font-bold">{sub}</p>}
                  <p className="text-sm">{text}</p>
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
