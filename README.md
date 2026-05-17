# JeddahEvents & Activities

A React-based web platform for discovering events, cafes, cinema, and social activities in Jeddah.

**CPIT 405 — Internet Applications · Group Project**

## Team

| Name | ID | Role |
|---|---|---|
| Omar Bakhidhr | 2237708 | Frontend Developer |
| Ibrahim Aljohani | 2236659 | Backend / Database Developer |
| Abdullah Khalid Baatyah | 2136375 | API Integration / Testing |

## Tech Stack

- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3 (orange/teal Jeddah palette)
- **Routing:** React Router v6 (HashRouter for static hosting)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Maps:** Google Maps JavaScript API
- **Deployment:** GitHub Pages

## Features

| Page | Description |
|---|---|
| Home | Hero, popular categories, featured events, trending cafes |
| Events | Filterable grid with sidebar (category, date, price), sorting, pagination |
| Event Detail | Full info, map, reviews, related events |
| Cafe Finder | Split list + map view with tag filters |
| Cafe Detail | Full cafe info, map, reviews |
| Cinema | Now Playing / Upcoming with detail modals |
| Social | Post feed, create posts, like / comment (Supabase Realtime) |
| Profile | Avatar, stats, tabs: favorites, friends, submissions, history |
| Submit Event | Protected form for community event submissions |
| Login / Register | Email + Google OAuth via Supabase Auth |

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Open `.env` and replace `PASTE_YOUR_PUBLISHABLE_KEY_HERE` with your real Supabase publishable key (from Supabase dashboard → Settings → API Keys → Publishable key).

### 3. Run dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Deploying to GitHub Pages

### 1. Create a GitHub repo

Create a new repository (e.g. `jeddah-events`) on GitHub. **Don't initialize with a README** — we already have one.

### 2. Push the code

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/jeddah-events.git
git push -u origin main
```

### 3. Deploy

```bash
npm run deploy
```

This runs the build and pushes `dist/` to a `gh-pages` branch automatically.

### 4. Enable GitHub Pages

- Go to your repo → **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: **gh-pages** / folder: **/ (root)**
- Save

Your site goes live at `https://<your-username>.github.io/jeddah-events/` in about a minute.

## Database Setup

The Supabase project is already configured. If you need to recreate the database on a fresh Supabase project:

1. Create a new project at [supabase.com](https://app.supabase.com)
2. Go to **SQL Editor** → New query
3. Paste the contents of `supabase/migrations/001_initial.sql`
4. Run it — creates 10 tables, RLS policies, and seed data (10 events + 8 cafes)
5. Enable realtime: **Database → Replication** → toggle on `posts`, `likes`, `comments`
6. Update `.env` with the new project URL and publishable key

## Project Structure

```
src/
├── api/           # Supabase queries (events, cafes, posts, profiles)
├── components/    # Reusable UI (Navbar, EventCard, MapView, etc.)
├── context/       # AuthContext
├── hooks/         # useEvents, useCafes, usePosts
├── pages/         # Route components
└── utils/         # Helpers
```

## Notes on Routing

This app uses **HashRouter** instead of BrowserRouter so that deep links work on GitHub Pages without server-side configuration. URLs look like `#/events/123` instead of `/events/123`. This is the standard pattern for static-hosted React SPAs.
