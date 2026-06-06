# Mental Wellness Tracker — Design Spec
**Date:** 2026-06-06  
**Challenge:** Hack2Skill — Mental Wellness Tracker  
**Vertical:** Student Mental Well-being during Board Exams & Competitive Tests

---

## Problem Statement

Students preparing for NEET, JEE, CUET, CAT, GATE, UPSC, and board examinations face significant stress, anxiety, burnout, self-doubt, and uncertainty. This tool helps them track their mood, identify stress triggers, reflect on emotions, and receive personalized AI-driven wellness support throughout their academic journey.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Database + Auth | Supabase (Postgres + Supabase Auth) |
| AI / Wellness Tips | Google Gemini 1.5 Flash API (server-side) |
| Deployment | Vercel |
| Styling | Vanilla CSS (CSS Modules + globals) |

---

## Architecture

```
User Browser
    ↓
Next.js App (Vercel)
    ├── App Router pages (React components)
    ├── Middleware (auth route protection)
    └── API Routes (server-side)
            └── /api/wellness → Gemini 1.5 Flash API
                    (fallback: static rule-based tips)
    ↓
Supabase
    ├── Auth (email/password)
    └── Postgres DB (profiles, mood_checkins, journal_entries)
```

---

## Pages & Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Root | Redirects to `/dashboard` (authed) or `/login` |
| `/login` | Login/Signup | Toggle between login and signup forms |
| `/dashboard` | Dashboard | Today's mood summary, streak counter, quick stats |
| `/checkin` | Mood Check-in | Daily mood entry: score + note + stress triggers |
| `/journal` | Journal | List of past entries + new journal entry form |
| `/wellness` | Wellness | AI-generated personalized tips (Gemini API) |
| `/history` | History | Mood chart (7-day / 30-day SVG bar chart) |

All routes under `/dashboard`, `/checkin`, `/journal`, `/wellness`, `/history` are protected via `middleware.js`. Unauthenticated users are redirected to `/login`.

---

## Data Model (Supabase / Postgres)

### `profiles`
Extends Supabase auth users with app-specific data.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, FK → auth.users |
| `full_name` | text | Set on first login/onboarding |
| `exam_type` | text | NEET \| JEE \| CAT \| GATE \| UPSC \| CUET \| Board \| Other |
| `created_at` | timestamp | Auto |

### `mood_checkins`
One check-in per user per day (enforced at app level).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `mood_score` | int | 1–5 (1=very low, 5=excellent) |
| `note` | text | Optional free-text note |
| `stress_triggers` | text[] | Array of selected trigger strings |
| `created_at` | timestamp | Auto |

### `journal_entries`
Free-form reflective journal.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `title` | text | Entry title |
| `content` | text | Full journal text |
| `mood_tag` | int | Optional 1–5 mood link |
| `created_at` | timestamp | Auto |

### Row Level Security (RLS)
All tables have RLS enabled. Users can only SELECT/INSERT/UPDATE/DELETE their own rows (`user_id = auth.uid()`).

---

## Predefined Stress Triggers

```
Exam Pressure
Fear of Failure
Peer Comparison
Sleep Issues
Physical Exhaustion
Family Expectations
Time Pressure
Difficulty Concentrating
Social Isolation
```

---

## Wellness Tip Logic

### Primary: Gemini 1.5 Flash API (via `/api/wellness` route)

**Input to Gemini:**
- `exam_type` (e.g., NEET)
- `mood_scores` — last 3 check-in scores (e.g., [2, 3, 2])
- `stress_triggers` — today's selected triggers (e.g., ["Fear of Failure", "Sleep Issues"])

**Prompt approach:** Empathetic, student-specific, actionable. Returns 3 personalized wellness suggestions in JSON format.

**Output:** 3 tip cards with title, description, and action (e.g., "Try a 4-7-8 breathing exercise").

### Fallback: Static Rule-Based Tips
If Gemini API fails or is rate-limited:

| Avg Mood Score | Tips Category |
|---|---|
| 1–2 | Breathing exercises, self-compassion, student helpline links |
| 3 | Study break ideas, light movement, affirmations |
| 4–5 | Goal setting, gratitude prompts, momentum builders |

---

## Component Structure

```
components/
├── Sidebar.jsx          — Nav links, user info (name + exam type), logout button
├── MoodPicker.jsx       — 1–5 emoji scale (😔😟😐🙂😊), clickable selection
├── TriggerSelector.jsx  — Multi-select chip buttons for stress triggers
├── MoodChart.jsx        — SVG bar chart, 7-day or 30-day toggle
├── JournalCard.jsx      — Card showing entry title, date, mood tag, excerpt
└── WellnessTipCard.jsx  — Card with icon, tip title, description, CTA action
```

---

## File Structure

```
hack2skillchallenge/
├── app/
│   ├── (auth)/login/page.jsx
│   ├── (protected)/
│   │   ├── layout.jsx               ← Sidebar layout
│   │   ├── dashboard/page.jsx
│   │   ├── checkin/page.jsx
│   │   ├── journal/page.jsx
│   │   ├── wellness/page.jsx
│   │   └── history/page.jsx
│   ├── api/wellness/route.js        ← Gemini API (server-side only)
│   ├── layout.jsx                   ← Root layout (fonts, global CSS)
│   └── page.jsx                     ← Root redirect
├── components/
│   ├── Sidebar.jsx
│   ├── MoodPicker.jsx
│   ├── TriggerSelector.jsx
│   ├── MoodChart.jsx
│   ├── JournalCard.jsx
│   └── WellnessTipCard.jsx
├── lib/
│   ├── supabase.js                  ← Browser Supabase client
│   ├── supabase-server.js           ← Server Supabase client
│   └── wellness-fallback.js         ← Static tip rules
├── middleware.js                    ← Route protection
├── styles/globals.css               ← Design tokens, dark theme, animations
└── .env.local                       ← NEXT_PUBLIC_SUPABASE_URL,
                                        NEXT_PUBLIC_SUPABASE_ANON_KEY,
                                        GEMINI_API_KEY
```

---

## UI Design Language

- **Theme:** Dark mode only
- **Background:** Deep navy (`#0A0F1E`) with subtle gradient
- **Accent:** Violet (`#7C3AED`) with indigo highlights
- **Mood colors:** Red (1) → Amber (3) → Green (5)
- **Font:** Inter (Google Fonts)
- **Cards:** Glassmorphism (backdrop-filter: blur, semi-transparent borders)
- **Animations:** Fade-in on page load, hover lifts on cards, smooth mood picker transitions

---

## Auth Flow

1. User visits `/login` → enters email + password
2. On first signup → brief onboarding: enter full name + select exam type
3. Supabase creates `auth.users` entry + triggers profile insert
4. Middleware checks session on every protected route

---

## Security

- RLS enforced on all DB tables — zero cross-user data access
- Gemini API key stored in Vercel env vars, never sent to client
- Input validation on all form fields (client + server)
- No sensitive data stored in localStorage (session handled by Supabase Auth cookies)

---

## Deployment

- Push to `main` branch on GitHub → Vercel auto-deploys
- Environment variables set in Vercel dashboard
- Supabase project on free tier (no credit card)

---

## Assumptions

1. One mood check-in per user per day is sufficient (enforced at UI level, not DB constraint)
2. Gemini 1.5 Flash free tier limits (15 RPM) are acceptable for hackathon judging
3. Email/password auth is sufficient — no Google OAuth needed in this version
4. All UI text is in English
5. The app is single-language, single-timezone (IST for date calculations)
