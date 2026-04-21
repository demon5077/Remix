# 🔥 Arise — Rise from the Shadows ✨ Hear the Divine

<div align="center">

> *"Where darkness meets divinity, and sound becomes soul."*

**Arise** is a cinematic dual-theme music streaming application built for those who hear beyond the ordinary. Powered by JioSaavn, YouTube Music, and the Muzo API — it offers a seamless listening experience that transcends the boundary between the infernal and the celestial.

</div>

---

## ⚔️ Two Souls, One App

### 🔥 The Demon Theme (Dark Mode)
*"Rise from the shadows. The abyss has its own music."*

The default Arise experience. Crimson glows, purple hazes, and fire & smoke particles drift across a dark void. Industrial beats, dark ambient, and midnight frequencies. For the relentless. For those who find beauty in darkness.

### ✨ The Angel Theme (Light Mode)
*"Hear the divine. Light carries its own frequency."*

Switch to the celestial. Golden dust particles float across cream and ivory. Sacred bhajans, Vedic chants, and divine classical ragas. Angelic slogans replace demonic whispers. The same app — transfigured.

---

## 🎵 Features

### Music Sources
- **JioSaavn** — 100M+ Hindi, Bollywood, Punjabi, and Indian songs
- **YouTube Music** — Global catalog via Muzo API (songs, albums, artists, playlists)
- **Muzo Backend** — YouTube Music search, trending, related, charts, moods, podcasts
- **RapidAPI YT** — Additional YouTube trending (optional, multi-key rotation)

### Playback Engine
- **Primary:** YouTube player (one iframe, always in DOM — no reload on mode switch)
- **Fallback:** JioSaavn audio stream (when YouTube search fails)
- **A/V Sync:** Single iframe for audio and video — switching modes keeps perfect sync
- **Real-time Progress:** `infoDelivery` postMessage polling every 250ms
- **Background Playback:** Page Visibility API keeps music playing in background tabs
- **Auto-Queue:** When a new song starts, related tracks auto-populate the queue
- **Autoplay:** Seamless auto-advance through queue with loop/shuffle support

### Pages & Navigation
| Page | Description |
|---|---|
| **Home** | Hero banner, trending, new releases, mood playlists, top artists, albums, podcasts |
| **Trending** | Live Indian trending with 5 genre tabs (Bollywood, Punjabi, Lo-Fi…) |
| **Albums** | 7 genre tabs with full track listings |
| **Artists** | Trending artists grid, search, genre tags, artist detail with songs & albums |
| **Podcasts** | 12 categories — Mythology, True Crime India, Comedy, Cricket, Bollywood, Ayurveda, Horror, Finance & more |
| **Playlists** | Manage, rename, delete, add songs, import from Google/Spotify/local files |
| **Liked Songs** | All liked tracks from YouTube + Saavn, synced to profile |
| **Recently Played** | Unified history — Saavn + YouTube merged |
| **Library** | Quick-access tiles with real-time stats |
| **Settings** | Full settings: theme, playback, quality, language, account, data export |

### Auth & Sync
- **Email / Phone** login with Resend email verification (6-digit code)
- **Google OAuth** → imports YouTube playlists → creates profile with Google photo
- **Spotify OAuth** → imports Spotify playlists (Premium note displayed)
- **Supabase DB** — playlists, liked songs, user data (with file-based fallback for dev)
- Session persists across all pages via `lib/session.js` (single source of truth)

### Playlist Management
- Import `.json`, `.m3u`, `.csv` playlist files (handles YouTube scrape JSON format)
- Save Google/Spotify playlists to account DB
- Delete playlists → instantly syncs to Profile stats
- Add songs from any card or mini-player
- Play All → auto-builds YT queue from all tracks

### Theme System
- **Dark (Demon):** Fire + smoke canvas particles, crimson/purple orbs, dark slogans
- **Light (Angel):** Golden dust particles, amber/ivory palette, angelic slogans and mood content
- Toggle persisted to `arise:theme` in localStorage
- All components use CSS custom properties (`var(--bg-card)`, `var(--text-primary)` etc.)
- Flash-free: `data-theme` applied before first render

---

## 🚀 Setup

```bash
git clone <repo>
cd arise-enhanced
npm install
cp .env.example .env.local
# Fill in your API keys (see .env.example)
npm run dev
```

### Environment Variables

```env
# JioSaavn
NEXT_PUBLIC_API_URL=https://saavn.sumit.co/api/

# Muzo Backend (free — powers YouTube Music features)
NEXT_PUBLIC_MUZO_API_URL=https://Muzo-backend.vercel.app

# RapidAPI — optional, comma-separated for multi-key rotation
NEXT_PUBLIC_RAPIDAPI_KEY=key1,key2,key3

# Google OAuth (for YouTube playlist import)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# Supabase (user DB)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Resend (email verification)
RESEND_API_KEY=
ARISE_FROM_EMAIL=Arise <noreply@yourdomain.com>

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏗️ Tech Stack

- **Framework:** Next.js 14.2 (App Router)
- **Styling:** Tailwind CSS + CSS Custom Properties (dual theme)
- **UI:** Radix UI, Lucide icons, custom canvas particles
- **Auth:** Supabase + Resend email + Google OAuth + Spotify OAuth
- **APIs:** JioSaavn, YouTube Music (Muzo), YouTube IFrame API, RapidAPI
- **Fonts:** Orbitron (headings), Rajdhani (body)

---

## 🎨 Design Philosophy

Arise lives at the intersection of two energies:

**The Demon** speaks in crimson and shadow. Every section header is a conjuration. Artists are "voices from the depths." Albums are "grimoires of sound." The fire particles rise from the bottom of the screen like souls ascending from below.

**The Angel** speaks in gold and light. Mood playlists become "Divine Morning" and "Vedic Chants." Slogans shift to "Hear the Divine" and "Rise to the Light." Golden dust drifts upward like prayers ascending.

One toggle. Two worlds.

---

*Crafted in darkness (and light) by Sunil.*
