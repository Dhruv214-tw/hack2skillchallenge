# MindTrack — Student Mental Wellness Tracker

A full-stack mental wellness tracker built for Indian students preparing for NEET, JEE, CAT, GATE, UPSC, CUET, and board examinations.

## Chosen Vertical

**Mental Wellness Tracker** — helping students monitor and improve their mental well-being during board exams, competitive entrance tests, and result seasons.

## How It Works

MindTrack provides five core features accessible via a persistent sidebar:

1. **Daily Mood Check-In** — Students rate their mood (1–5 emoji scale), tag stress triggers, and add an optional note. One check-in per day is tracked.

2. **AI-Powered Wellness Tips** — After each check-in, the app calls the Google Gemini 1.5 Flash API (server-side) with the student's exam type, recent mood scores, and stress triggers to generate 3 personalized, empathetic wellness suggestions. Falls back to curated static tips if the API is unavailable.

3. **Journal** — A private reflective journal where students can write entries with optional mood tagging.

4. **Mood History** — SVG bar chart showing mood trends over 7 or 30 days, plus a breakdown of the most common stress triggers.

5. **Dashboard** — Overview of today's check-in status, streak counter, average mood, and quick navigation.

## Approach and Logic

- **Authentication:** Email/password via Supabase Auth. Row Level Security (RLS) ensures users can only access their own data.
- **AI Personalization:** Gemini 1.5 Flash receives exam type + recent mood scores + today's stress triggers as context and returns 3 JSON-structured wellness tips. The API call is made server-side so the API key is never exposed to the client.
- **Fallback:** If Gemini is unavailable, rule-based tips are served based on average mood score (low/medium/high).
- **Data Storage:** Supabase Postgres with three tables: `profiles`, `mood_checkins`, `journal_entries`.
- **Deployment:** Vercel (auto-deploys from main branch). Environment variables for Supabase and Gemini API keys set in Vercel dashboard.

## Tech Stack

- **Frontend + Backend:** Next.js 14 (App Router)
- **Database + Auth:** Supabase (Postgres + Supabase Auth)
- **AI:** Google Gemini 1.5 Flash
- **Styling:** Vanilla CSS (CSS Modules), no UI framework
- **Deployment:** Vercel

## Assumptions

1. One mood check-in per user per day (enforced at UI level)
2. Gemini 1.5 Flash free tier rate limits are acceptable for hackathon judging
3. Email/password authentication is sufficient (no social auth)
4. All UI is in English
5. Date calculations use IST (Indian Standard Time)

## Running Locally

1. Clone the repo
2. `npm install`
3. Create `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Run the Supabase schema from `supabase/schema.sql` in your Supabase SQL editor
5. `npm run dev` — open http://localhost:3000

## Running Tests

```bash
npm test
```
