"use client";
import Footer from "@/components/page/footer";
import Link from "next/link";

export default function DMCAPage() {
  return (
    <div className="min-h-screen" style={{ color: "#ccccee" }}>
      <section className="relative px-6 md:px-12 pt-16 pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <p className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
          ✦ Legal ✦
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-4"
          style={{ fontFamily: "Orbitron, sans-serif", background: "linear-gradient(135deg, #FF003C, #9D4EDD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          DMCA Policy
        </h1>
        <p className="text-sm" style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
          Last updated: June 2025
        </p>
      </section>

      <div className="mx-6 md:mx-12 h-[1px]" style={{ background: "linear-gradient(to right, rgba(255,0,60,0.3), transparent)" }} />

      <section className="px-6 md:px-12 py-12 max-w-3xl space-y-10">
        {[
          {
            title: "1. Overview",
            text: "Arise is an educational music streaming interface that does not host, store, or distribute any audio or video content. All music and video content is served from third-party platforms including JioSaavn and YouTube via their respective public APIs. Arise does not own or claim any rights to the content accessed through these APIs.",
          },
          {
            title: "2. No Hosted Content",
            text: "Arise does not upload, store, cache, or redistribute any copyrighted audio, video, or audiovisual content on its servers. All playback is streamed directly from the original platform (JioSaavn or YouTube). As such, standard DMCA takedown procedures for hosted content do not apply to Arise itself.",
          },
          {
            title: "3. Third-Party Platforms",
            text: "If you believe content accessible through Arise infringes your copyright, the appropriate action is to submit a DMCA takedown notice to the platform hosting the content. For YouTube content, please use YouTube's copyright complaint process at support.google.com/youtube/answer/2807622. For JioSaavn content, please contact JioSaavn directly at legal@jiosaavn.com.",
          },
          {
            title: "4. Reporting Concerns",
            text: "If you have a concern about how Arise accesses or presents content, or if you believe we are misusing an API in a way that harms your rights, please contact us at: dmca@arise.music (placeholder — update before production deployment). We will investigate and respond within 14 business days.",
          },
          {
            title: "5. API Terms of Service",
            text: "Arise uses the JioSaavn API and YouTube IFrame API in accordance with their respective Terms of Service. Arise is an educational, non-commercial project. Commercial exploitation of any third-party content via Arise is strictly prohibited.",
          },
          {
            title: "6. Limitation of Liability",
            text: "Arise is provided for educational purposes only. We disclaim all liability for content that appears through third-party API calls. Users are responsible for ensuring their use of Arise complies with applicable laws and the terms of service of the platforms accessed.",
          },
          {
            title: "7. Counter-Notification",
            text: "If you believe content was removed in error or you have authorisation to use it, you may submit a counter-notification to dmca@arise.music. Counter-notifications must include: your name and contact information; description of the content and where it was located; a statement that you believe removal was in error; your signature.",
          },
        ].map(({ title, text }) => (
          <div key={title}>
            <h2 className="text-base font-bold mb-4" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>{title}</h2>
            <p className="text-sm leading-relaxed pl-4" style={{ color: "#8888aa", borderLeft: "2px solid rgba(255,0,60,0.15)" }}>{text}</p>
          </div>
        ))}

        <div className="p-5 rounded-2xl" style={{ background: "rgba(255,0,60,0.05)", border: "1px solid rgba(255,0,60,0.12)" }}>
          <p className="text-sm font-bold mb-2" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Contact for Copyright Concerns</p>
          <p className="text-sm" style={{ color: "#8888aa" }}>Email: <span style={{ color: "#FF003C" }}>dmca@arise.music</span></p>
          <p className="text-xs mt-2" style={{ color: "#44445a" }}>
            For YouTube content: <a href="https://support.google.com/youtube/answer/2807622" target="_blank" rel="noopener noreferrer" style={{ color: "#9D4EDD" }}>YouTube Copyright Center</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
