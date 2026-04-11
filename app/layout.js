import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import MusicProvider from "@/components/providers/music-provider";
import { YTProvider } from "@/hooks/use-youtube";
import AppShell from "@/components/app-shell";

// ── Metadata (themeColor moved to viewport per Next.js 14 requirement) ────────
export const metadata = {
  title:       { default: "RemiX — Unleash the Sound", template: "%s — RemiX" },
  description: "Your premium dark music streaming experience.",
  manifest:    "/manifest.json",
  icons: {
    icon:     [
      { url: "/favi-icon.jpg", type: "image/jpeg"  },
      { url: "/ios/32.png",   sizes: "32x32",   type: "image/png" },
      { url: "/ios/192.png",  sizes: "192x192", type: "image/png" },
      { url: "/ios/512.png",  sizes: "512x512", type: "image/png" },
    ],
    apple:    [{ url: "/ios/180.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favi-icon.jpg",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RemiX" },
};

// ── Viewport (required location for themeColor in Next.js 14+) ────────────────
export const viewport = {
  themeColor:    "#FF003C",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts — loaded in <head> manually so failures don't crash the app */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        {/* Explicit icon links prevent browser 404 auto-requests */}
        <link rel="apple-touch-icon" href="/ios/180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/ios/152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/ios/120.png" />
        <link rel="icon" type="image/png" sizes="32x32"   href="/ios/32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/ios/192.png" />
      </head>
      <body style={{ fontFamily: "'Rajdhani', 'Segoe UI', system-ui, sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark" disableTransitionOnChange>
          <NextTopLoader color="#FF003C" height={2} showSpinner={false}
            shadow="0 0 10px #FF003C,0 0 20px rgba(255,0,60,0.5)" zIndex={1600} />
          <MusicProvider>
            <YTProvider>
              <AppShell>{children}</AppShell>
            </YTProvider>
          </MusicProvider>
          <Toaster position="top-center" visibleToasts={2} toastOptions={{
            style: {
              background: "#121220", border: "1px solid rgba(255,0,60,0.2)",
              color: "#f0f0ff", fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.95rem", borderRadius: "12px",
            },
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
