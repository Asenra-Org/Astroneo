# AstroLens 🔭

> Search the stars. Explore the universe.

**AstroLens** is a production-ready astronomical data web app built by [Asenra](https://asenra.com). Search any of 200,000+ stars, view a real-time interactive 3D model powered by Three.js with custom GLSL shaders, and get complete astronomical data in a stunning dark glassmorphic UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Star Search** | Fuse.js-powered fuzzy search with keyboard-navigable autocomplete |
| **3D Star Viewer** | Custom GLSL convection shader with OrbitControls via Three.js |
| **Visibility Checker** | GPS-based alt/azimuth calculation using real astronomy formulas |
| **Explore Grid** | Filterable (constellation, spectral class) infinite-scroll grid |
| **Auth System** | Google OAuth + email/password via Firebase Auth |
| **Dashboard** | Save stars, log observations, view personal stats |
| **Blog** | Editorial space-science articles with full article pages |
| **SEO-Ready** | Per-page metadata, JSON-LD, OpenGraph, sitemap |
| **AdSense-Ready** | Plug-in `AdSlot` component once publisher ID is approved |

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, RSC, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` config)
- **3D**: Three.js + custom GLSL shader
- **Search**: Fuse.js
- **Auth & DB**: Firebase Auth + Firestore
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Toasts**: Sonner
- **Icons**: Lucide React
- **Fonts**: Syne (display) + DM Sans (body) + JetBrains Mono

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) and enable:
- **Authentication** - Email/Password + Google providers
- **Firestore Database** (start in test mode, then add security rules)

Copy and fill the environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase config from the console.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Firestore Security Rules

Add these in Firebase Console under Firestore Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /savedStars/{starId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /observations/{obsId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## AdSense Integration

Once approved for Google AdSense:

1. Set publisher ID in `.env.local`:
   ```
   NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```

2. Use the `AdSlot` component anywhere:
   ```tsx
   import AdSlot from '@/components/ads/AdSlot';
   
   <AdSlot slot="YOUR_SLOT_ID" format="horizontal" />
   ```

3. Get slot IDs from your AdSense dashboard under Ads > By ad unit.

---

## Generate Sitemap

```bash
npm run build
npx next-sitemap
```

Reads `stars-featured.json` and outputs `public/sitemap.xml`.

---

## Project Structure

```
astrolens/
├── app/                    Next.js App Router pages
│   ├── page.tsx            Homepage
│   ├── explore/            Star browse grid
│   ├── star/[slug]/        Star detail (SSG)
│   ├── blog/               Blog index + articles
│   ├── dashboard/          User dashboard (auth-protected)
│   └── auth/               Login / Register / Reset
├── components/
│   ├── ads/                AdSlot component
│   ├── home/               Homepage sections
│   ├── layout/             Navbar, Footer
│   └── star/               Star detail components
├── contexts/               AuthContext
├── lib/                    Firebase, auth, search, utils
├── public/data/            stars-featured.json, stars-search.json
└── types/                  TypeScript interfaces
```

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set all `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel dashboard.

---

MIT License - 2025 Asenra
