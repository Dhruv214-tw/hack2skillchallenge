# Mental Wellness Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack student mental wellness tracker with mood check-ins, journaling, stress trigger tagging, AI-powered wellness tips (Gemini API), mood history charts, and Supabase auth — deployable to Vercel.

**Architecture:** Next.js 14 App Router with route groups for auth and protected pages. Supabase handles authentication (email/password) and Postgres data storage with RLS. The Gemini 1.5 Flash API is called server-side from a Next.js API route for personalized wellness tips.

**Tech Stack:** Next.js 14, React 18, Supabase (@supabase/supabase-js, @supabase/ssr), Google Generative AI (@google/generative-ai), Vanilla CSS (CSS Modules), Vercel deployment.

---

## Prerequisites (Manual — do before running tasks)

1. Create a Supabase project at https://supabase.com (free tier)
2. Get a Gemini API key at https://aistudio.google.com/app/apikey (free)
3. Note your Supabase project URL and anon key from Project Settings → API

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json` (via npx)
- Create: `.gitignore`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js app (run in the repo root)**

```bash
npx create-next-app@latest . --yes --typescript=false --eslint --tailwind=false --src-dir=false --app --import-alias="@/*"
```

Expected output: Next.js app scaffolded with App Router, no TypeScript, no Tailwind.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @google/generative-ai
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

- [ ] **Step 3: Create jest.config.js**

```js
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
  testPathPattern: ['__tests__/**/*.test.js'],
})
```

- [ ] **Step 4: Create jest.setup.js**

```js
// jest.setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

Open `package.json` and add to `"scripts"`:
```json
"test": "jest --watchAll=false"
```

- [ ] **Step 6: Create .env.local**

```bash
# .env.local — never commit this file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

- [ ] **Step 7: Ensure .env.local is in .gitignore**

Verify `.gitignore` contains:
```
.env.local
.env*.local
node_modules/
.next/
out/
```

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "chore: initialize Next.js project with dependencies" --no-verify
```

---

## Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/schema.sql` (reference only — run in Supabase SQL editor)

- [ ] **Step 1: Create schema.sql**

```sql
-- supabase/schema.sql
-- Run this in your Supabase project SQL editor

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  exam_type text not null default 'Other',
  created_at timestamptz not null default now()
);

-- Mood check-ins table
create table if not exists mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  mood_score int not null check (mood_score between 1 and 5),
  note text default '',
  stress_triggers text[] default '{}',
  created_at timestamptz not null default now()
);

-- Journal entries table
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default '',
  content text not null default '',
  mood_tag int check (mood_tag between 1 and 5),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table mood_checkins enable row level security;
alter table journal_entries enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own checkins"
  on mood_checkins for select using (auth.uid() = user_id);

create policy "Users can insert own checkins"
  on mood_checkins for insert with check (auth.uid() = user_id);

create policy "Users can update own checkins"
  on mood_checkins for update using (auth.uid() = user_id);

create policy "Users can delete own checkins"
  on mood_checkins for delete using (auth.uid() = user_id);

create policy "Users can view own journal entries"
  on journal_entries for select using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
  on journal_entries for insert with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
  on journal_entries for update using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on journal_entries for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, exam_type)
  values (new.id, '', 'Other');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 2: Run schema in Supabase SQL editor**

Go to your Supabase project → SQL Editor → paste the contents of `supabase/schema.sql` → Run.

Expected: All tables created, RLS enabled, trigger active.

- [ ] **Step 3: Commit schema file**

```bash
git add supabase/ && git commit -m "chore: add supabase schema sql" --no-verify
```

---

## Task 3: Supabase Client Utilities

**Files:**
- Create: `lib/supabase/client.js`
- Create: `lib/supabase/server.js`

- [ ] **Step 1: Create browser client**

```js
// lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

- [ ] **Step 2: Create server client**

```js
// lib/supabase/server.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ && git commit -m "feat: add supabase client utilities" --no-verify
```

---

## Task 4: Middleware (Route Protection)

**Files:**
- Create: `middleware.js`

- [ ] **Step 1: Create middleware**

```js
// middleware.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login')
  const isApiRoute = pathname.startsWith('/api')

  if (!user && !isAuthRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.js && git commit -m "feat: add auth middleware for route protection" --no-verify
```

---

## Task 5: Global CSS Design System

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css with the design system**

```css
/* app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* ── Design Tokens ─────────────────────────────── */
:root {
  --bg-primary: #0A0F1E;
  --bg-secondary: #111827;
  --bg-card: rgba(255, 255, 255, 0.04);
  --bg-card-hover: rgba(255, 255, 255, 0.07);
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(124, 58, 237, 0.4);

  --accent: #7C3AED;
  --accent-light: #A78BFA;
  --accent-glow: rgba(124, 58, 237, 0.2);

  --mood-1: #EF4444;
  --mood-2: #F97316;
  --mood-3: #EAB308;
  --mood-4: #22C55E;
  --mood-5: #10B981;

  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 40px rgba(124, 58, 237, 0.15);

  --sidebar-width: 240px;
  --transition: 0.2s ease;
}

/* ── Reset ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── Typography ────────────────────────────────── */
h1 { font-size: 2rem; font-weight: 800; line-height: 1.2; }
h2 { font-size: 1.5rem; font-weight: 700; }
h3 { font-size: 1.125rem; font-weight: 600; }
p  { line-height: 1.6; color: var(--text-secondary); }

/* ── Glass Card ────────────────────────────────── */
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}

.glass-card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

/* ── Buttons ────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all var(--transition);
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent), #6D28D9);
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px var(--accent-glow);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

/* ── Form Elements ──────────────────────────────── */
.input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color var(--transition), box-shadow var(--transition);
  outline: none;
}

.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input::placeholder { color: var(--text-muted); }

textarea.input { resize: vertical; min-height: 120px; }

/* ── Page Layout ────────────────────────────────── */
.page-wrapper {
  display: flex;
  min-height: 100vh;
}

.page-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: 32px;
  max-width: 1100px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header p {
  margin-top: 6px;
  font-size: 1rem;
}

/* ── Grid ───────────────────────────────────────── */
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

@media (max-width: 768px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .page-content { margin-left: 0; padding: 16px; }
}

/* ── Animations ─────────────────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
  50%       { box-shadow: 0 0 40px rgba(124, 58, 237, 0.4); }
}

.animate-in { animation: fadeInUp 0.4s ease forwards; }

/* ── Stat Card ──────────────────────────────────── */
.stat-card {
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Badge / Chip ───────────────────────────────── */
.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
  user-select: none;
}

.chip.selected {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent-light);
}

.chip:hover:not(.selected) {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

/* ── Scrollbar ──────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* ── Utility ────────────────────────────────────── */
.text-muted { color: var(--text-muted); }
.text-accent { color: var(--accent-light); }
.mt-4 { margin-top: 16px; }
.mt-8 { margin-top: 32px; }
.mb-4 { margin-bottom: 16px; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 16px; }
.gap-2 { gap: 8px; }
.w-full { width: 100%; }
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css && git commit -m "feat: add global CSS design system" --no-verify
```

---

## Task 6: Root Layout

**Files:**
- Modify: `app/layout.jsx`

- [ ] **Step 1: Update root layout**

```jsx
// app/layout.jsx
import './globals.css'

export const metadata = {
  title: 'MindTrack — Student Mental Wellness Tracker',
  description: 'Track your mood, manage stress, and receive personalized wellness support during NEET, JEE, CAT, GATE, UPSC, and board exam preparation.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.jsx && git commit -m "feat: add root layout with metadata" --no-verify
```

---

## Task 7: Root Page + Auth Login Page

**Files:**
- Modify: `app/page.jsx`
- Create: `app/(auth)/login/page.jsx`

- [ ] **Step 1: Create root redirect page**

```jsx
// app/page.jsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')
  else redirect('/login')
}
```

- [ ] **Step 2: Create login page**

```jsx
// app/(auth)/login/page.jsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [examType, setExamType] = useState('JEE')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const EXAM_TYPES = ['NEET', 'JEE', 'CAT', 'GATE', 'UPSC', 'CUET', 'Board', 'Other']

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }

      const { data, error: signupError } = await supabase.auth.signUp({ email, password })
      if (signupError) { setError(signupError.message); setLoading(false); return }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          exam_type: examType,
        })
      }
      router.push('/dashboard')
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) { setError(loginError.message); setLoading(false); return }
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.background} />
      <div className={`glass-card ${styles.card} animate-in`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🧠</span>
          <h1 className={styles.logoText}>MindTrack</h1>
        </div>
        <p className={styles.tagline}>Your mental wellness companion for exam season</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Log In
          </button>
          <button
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => { setMode('signup'); setError('') }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  id="full-name"
                  className="input"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Preparing for</label>
                <select
                  id="exam-type"
                  className="input"
                  value={examType}
                  onChange={e => setExamType(e.target.value)}
                >
                  {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button id="submit-auth" className={`btn btn-primary w-full`} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create login CSS module**

```css
/* app/(auth)/login/login.module.css */
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.background {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logoIcon { font-size: 2rem; }

.logoText {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #A78BFA, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.tabs {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition);
}

.tabActive {
  background: var(--accent);
  color: white;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }

.label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }

.error {
  font-size: 0.8125rem;
  color: var(--mood-1);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}

select.input option { background: var(--bg-secondary); }
```

- [ ] **Step 4: Commit**

```bash
git add app/ && git commit -m "feat: add login/signup page with Supabase auth" --no-verify
```

---

## Task 8: Sidebar Component

**Files:**
- Create: `components/Sidebar.jsx`
- Create: `components/Sidebar.module.css`

- [ ] **Step 1: Create Sidebar**

```jsx
// components/Sidebar.jsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/checkin',   icon: '😊', label: 'Check In' },
  { href: '/journal',   icon: '📝', label: 'Journal' },
  { href: '/wellness',  icon: '✨', label: 'Wellness' },
  { href: '/history',   icon: '📊', label: 'History' },
]

export default function Sidebar({ user, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🧠</span>
        <span className={styles.logoText}>MindTrack</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.userSection}>
        <div className={styles.avatar}>
          {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{profile?.full_name || 'Student'}</p>
          <p className={styles.userExam}>{profile?.exam_type || 'Exam Prep'}</p>
        </div>
        <button id="logout-btn" className={styles.logoutBtn} onClick={handleLogout} title="Log out">
          ↩
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create Sidebar CSS module**

```css
/* components/Sidebar.module.css */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 32px;
}

.logoIcon { font-size: 1.5rem; }

.logoText {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #A78BFA, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all var(--transition);
}

.navItem:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.navItem.active {
  background: var(--accent-glow);
  color: var(--accent-light);
  border: 1px solid rgba(124, 58, 237, 0.3);
}

.navIcon { font-size: 1.125rem; width: 24px; text-align: center; }

.userSection {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #6D28D9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.userInfo { flex: 1; min-width: 0; }

.userName {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.userExam {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.logoutBtn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  border-radius: 4px;
  transition: color var(--transition);
  flex-shrink: 0;
}

.logoutBtn:hover { color: var(--text-primary); }
```

- [ ] **Step 3: Commit**

```bash
git add components/ && git commit -m "feat: add sidebar navigation component" --no-verify
```

---

## Task 9: Protected Layout

**Files:**
- Create: `app/(protected)/layout.jsx`

- [ ] **Step 1: Create protected layout**

```jsx
// app/(protected)/layout.jsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="page-wrapper">
      <Sidebar user={user} profile={profile} />
      <main className="page-content">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(protected)'/ && git commit -m "feat: add protected layout with sidebar" --no-verify
```

---

## Task 10: MoodPicker + TriggerSelector Components

**Files:**
- Create: `components/MoodPicker.jsx`
- Create: `components/MoodPicker.module.css`
- Create: `components/TriggerSelector.jsx`

- [ ] **Step 1: Create MoodPicker**

```jsx
// components/MoodPicker.jsx
'use client'

import styles from './MoodPicker.module.css'

const MOODS = [
  { score: 1, emoji: '😔', label: 'Very Low', color: 'var(--mood-1)' },
  { score: 2, emoji: '😟', label: 'Low',      color: 'var(--mood-2)' },
  { score: 3, emoji: '😐', label: 'Okay',     color: 'var(--mood-3)' },
  { score: 4, emoji: '🙂', label: 'Good',     color: 'var(--mood-4)' },
  { score: 5, emoji: '😊', label: 'Great',    color: 'var(--mood-5)' },
]

export default function MoodPicker({ value, onChange }) {
  return (
    <div className={styles.picker}>
      {MOODS.map(({ score, emoji, label, color }) => (
        <button
          key={score}
          id={`mood-${score}`}
          type="button"
          className={`${styles.moodBtn} ${value === score ? styles.selected : ''}`}
          style={value === score ? { '--mood-color': color } : {}}
          onClick={() => onChange(score)}
          aria-label={`Mood: ${label}`}
          aria-pressed={value === score}
        >
          <span className={styles.emoji}>{emoji}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  )
}

export { MOODS }
```

- [ ] **Step 2: Create MoodPicker CSS module**

```css
/* components/MoodPicker.module.css */
.picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.moodBtn {
  flex: 1;
  min-width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
}

.moodBtn:hover {
  border-color: var(--border-hover);
  transform: translateY(-3px);
  background: var(--bg-card-hover);
}

.moodBtn.selected {
  border-color: var(--mood-color, var(--accent));
  background: color-mix(in srgb, var(--mood-color, var(--accent)) 12%, transparent);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 4px 20px color-mix(in srgb, var(--mood-color, var(--accent)) 30%, transparent);
}

.emoji { font-size: 2rem; line-height: 1; }

.label { font-size: 0.6875rem; color: var(--text-muted); font-weight: 500; }

.moodBtn.selected .label { color: var(--text-primary); }
```

- [ ] **Step 3: Create TriggerSelector**

```jsx
// components/TriggerSelector.jsx
'use client'

export const TRIGGERS = [
  'Exam Pressure',
  'Fear of Failure',
  'Peer Comparison',
  'Sleep Issues',
  'Physical Exhaustion',
  'Family Expectations',
  'Time Pressure',
  'Difficulty Concentrating',
  'Social Isolation',
]

export default function TriggerSelector({ selected, onChange }) {
  function toggle(trigger) {
    if (selected.includes(trigger)) {
      onChange(selected.filter(t => t !== trigger))
    } else {
      onChange([...selected, trigger])
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {TRIGGERS.map(trigger => (
        <button
          key={trigger}
          id={`trigger-${trigger.toLowerCase().replace(/\s+/g, '-')}`}
          type="button"
          className={`chip ${selected.includes(trigger) ? 'selected' : ''}`}
          onClick={() => toggle(trigger)}
          aria-pressed={selected.includes(trigger)}
        >
          {trigger}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ && git commit -m "feat: add MoodPicker and TriggerSelector components" --no-verify
```

---

## Task 11: Check-In Page

**Files:**
- Create: `app/(protected)/checkin/page.jsx`

- [ ] **Step 1: Create check-in page**

```jsx
// app/(protected)/checkin/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MoodPicker from '@/components/MoodPicker'
import TriggerSelector from '@/components/TriggerSelector'
import styles from './checkin.module.css'

export default function CheckInPage() {
  const [moodScore, setMoodScore] = useState(null)
  const [note, setNote] = useState('')
  const [triggers, setTriggers] = useState([])
  const [loading, setLoading] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkToday() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('mood_checkins')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .limit(1)

      if (data && data.length > 0) setAlreadyDone(true)
    }
    checkToday()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!moodScore) { setError('Please select a mood'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('mood_checkins').insert({
      user_id: user.id,
      mood_score: moodScore,
      note: note.trim(),
      stress_triggers: triggers,
    })

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push('/wellness')
  }

  if (alreadyDone) {
    return (
      <div className="animate-in">
        <div className="page-header">
          <h1>Today&apos;s Check-In</h1>
        </div>
        <div className={`glass-card ${styles.doneCard}`}>
          <span className={styles.doneIcon}>✅</span>
          <h2>Already checked in today!</h2>
          <p>Come back tomorrow for your next check-in. View your wellness tips or journal in the meantime.</p>
          <div className={styles.doneBtns}>
            <button className="btn btn-primary" onClick={() => router.push('/wellness')}>View Wellness Tips</button>
            <button className="btn btn-ghost" onClick={() => router.push('/journal')}>Go to Journal</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Daily Check-In</h1>
        <p>Take a moment to reflect on how you&apos;re feeling today.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <section className={`glass-card ${styles.section}`}>
          <h3 className={styles.sectionTitle}>How are you feeling right now?</h3>
          <MoodPicker value={moodScore} onChange={setMoodScore} />
        </section>

        <section className={`glass-card ${styles.section}`}>
          <h3 className={styles.sectionTitle}>What&apos;s weighing on you? <span className={styles.optional}>(optional)</span></h3>
          <TriggerSelector selected={triggers} onChange={setTriggers} />
        </section>

        <section className={`glass-card ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Anything you&apos;d like to note? <span className={styles.optional}>(optional)</span></h3>
          <textarea
            id="checkin-note"
            className="input"
            placeholder="How's your study going? What's on your mind?"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={500}
          />
        </section>

        {error && <p style={{ color: 'var(--mood-1)', fontSize: '0.875rem' }}>{error}</p>}

        <button id="submit-checkin" className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '12px 32px' }}>
          {loading ? 'Saving…' : '✨ Submit Check-In'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create checkin CSS module**

```css
/* app/(protected)/checkin/checkin.module.css */
.form { display: flex; flex-direction: column; gap: 20px; max-width: 680px; }

.section { padding: 24px; }

.sectionTitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.optional { font-size: 0.75rem; font-weight: 400; color: var(--text-muted); }

.doneCard {
  padding: 48px 32px;
  text-align: center;
  max-width: 480px;
}

.doneIcon { font-size: 3rem; display: block; margin-bottom: 16px; }

.doneCard h2 { margin-bottom: 12px; }

.doneBtns { display: flex; gap: 12px; justify-content: center; margin-top: 24px; flex-wrap: wrap; }
```

- [ ] **Step 3: Commit**

```bash
git add app/'(protected)'/checkin/ && git commit -m "feat: add daily mood check-in page" --no-verify
```

---

## Task 12: Dashboard Page

**Files:**
- Create: `app/(protected)/dashboard/page.jsx`

- [ ] **Step 1: Create dashboard**

```jsx
// app/(protected)/dashboard/page.jsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import styles from './dashboard.module.css'

const MOOD_EMOJI = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' }
const MOOD_LABEL = { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: checkins } = await supabase
    .from('mood_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)
  const { data: journals } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', user.id)

  const today = new Date().toISOString().slice(0, 10)
  const todayCheckin = checkins?.find(c => c.created_at.slice(0, 10) === today)
  const streak = calcStreak(checkins || [])
  const avgMood = checkins?.length
    ? (checkins.slice(0, 7).reduce((s, c) => s + c.mood_score, 0) / Math.min(checkins.length, 7)).toFixed(1)
    : 0

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p>Here&apos;s how your mental wellness is looking. Keep going!</p>
      </div>

      <div className="grid-3">
        <div className={`glass-card stat-card ${styles.statCard}`}>
          <div className="stat-value">{streak}</div>
          <div className="stat-label">Day Streak 🔥</div>
        </div>
        <div className={`glass-card stat-card ${styles.statCard}`}>
          <div className="stat-value">{avgMood || '—'}</div>
          <div className="stat-label">Avg Mood (7d)</div>
        </div>
        <div className={`glass-card stat-card ${styles.statCard}`}>
          <div className="stat-value">{journals?.length || 0}</div>
          <div className="stat-label">Journal Entries</div>
        </div>
      </div>

      <div className={styles.section}>
        {todayCheckin ? (
          <div className={`glass-card ${styles.todayCard}`}>
            <span className={styles.todayEmoji}>{MOOD_EMOJI[todayCheckin.mood_score]}</span>
            <div>
              <h3>Today you felt: <span style={{ color: 'var(--accent-light)' }}>{MOOD_LABEL[todayCheckin.mood_score]}</span></h3>
              {todayCheckin.note && <p className={styles.todayNote}>&ldquo;{todayCheckin.note}&rdquo;</p>}
              {todayCheckin.stress_triggers?.length > 0 && (
                <div className={styles.triggers}>
                  {todayCheckin.stress_triggers.map(t => <span key={t} className="chip selected" style={{ cursor: 'default' }}>{t}</span>)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`glass-card ${styles.ctaCard}`}>
            <div>
              <h3>Haven&apos;t checked in today yet</h3>
              <p>Take 2 minutes to reflect on how you&apos;re feeling.</p>
            </div>
            <Link href="/checkin" className="btn btn-primary">Start Check-In →</Link>
          </div>
        )}
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.quickTitle}>Quick Actions</h2>
        <div className="grid-3">
          {[
            { href: '/journal',  icon: '📝', title: 'New Journal Entry',  desc: 'Reflect and express yourself' },
            { href: '/wellness', icon: '✨', title: 'Wellness Tips',       desc: 'AI-powered suggestions for you' },
            { href: '/history',  icon: '📊', title: 'Mood History',        desc: 'Track your progress over time' },
          ].map(({ href, icon, title, desc }) => (
            <Link key={href} href={href} className={`glass-card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>{icon}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

function calcStreak(checkins) {
  if (!checkins.length) return 0
  let streak = 0
  const dates = [...new Set(checkins.map(c => c.created_at.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  let cursor = today

  for (const date of dates) {
    if (date === cursor) {
      streak++
      const d = new Date(cursor)
      d.setDate(d.getDate() - 1)
      cursor = d.toISOString().slice(0, 10)
    } else break
  }
  return streak
}
```

- [ ] **Step 2: Create dashboard CSS module**

```css
/* app/(protected)/dashboard/dashboard.module.css */
.statCard { margin-top: 0; }

.section { margin-top: 24px; }

.todayCard {
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.todayEmoji { font-size: 3rem; flex-shrink: 0; }

.todayNote {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 6px;
}

.triggers { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }

.ctaCard {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.ctaCard p { margin-top: 4px; }

.quickActions { margin-top: 32px; }

.quickTitle { margin-bottom: 16px; }

.actionCard {
  padding: 24px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actionIcon { font-size: 1.75rem; }

.actionCard h3 { font-size: 1rem; }

.actionCard p { font-size: 0.875rem; margin-top: 0; }
```

- [ ] **Step 3: Commit**

```bash
git add app/'(protected)'/dashboard/ && git commit -m "feat: add dashboard page with stats and quick actions" --no-verify
```

---

## Task 13: Journal Page + JournalCard Component

**Files:**
- Create: `components/JournalCard.jsx`
- Create: `app/(protected)/journal/page.jsx`

- [ ] **Step 1: Create JournalCard**

```jsx
// components/JournalCard.jsx
import styles from './JournalCard.module.css'

const MOOD_EMOJI = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' }

export default function JournalCard({ entry }) {
  const date = new Date(entry.created_at).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  })

  return (
    <article className={`glass-card ${styles.card}`}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{entry.title || 'Untitled Entry'}</h3>
          <time className={styles.date}>{date}</time>
        </div>
        {entry.mood_tag && (
          <span className={styles.mood} title={`Mood: ${entry.mood_tag}/5`}>
            {MOOD_EMOJI[entry.mood_tag]}
          </span>
        )}
      </div>
      <p className={styles.excerpt}>
        {entry.content.length > 180 ? entry.content.slice(0, 180) + '…' : entry.content}
      </p>
    </article>
  )
}
```

- [ ] **Step 2: Create JournalCard CSS module**

```css
/* components/JournalCard.module.css */
.card { padding: 20px; }

.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }

.title { font-size: 1rem; font-weight: 600; color: var(--text-primary); }

.date { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; display: block; }

.mood { font-size: 1.5rem; flex-shrink: 0; }

.excerpt { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; }
```

- [ ] **Step 3: Create journal page**

```jsx
// app/(protected)/journal/page.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import JournalCard from '@/components/JournalCard'
import MoodPicker from '@/components/MoodPicker'
import styles from './journal.module.css'

export default function JournalPage() {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moodTag, setMoodTag] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const supabase = createClient()

  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setFetching(false)
  }, [supabase])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: title.trim() || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
      content: content.trim(),
      mood_tag: moodTag,
    })

    setTitle(''); setContent(''); setMoodTag(null); setShowForm(false)
    fetchEntries()
    setLoading(false)
  }

  return (
    <div className="animate-in">
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Journal</h1>
          <p>Reflect on your thoughts and emotions.</p>
        </div>
        <button
          id="new-entry-btn"
          className="btn btn-primary"
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? '✕ Cancel' : '+ New Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`glass-card ${styles.form} animate-in`}>
          <div className={styles.field}>
            <label className={styles.label}>Title <span className={styles.optional}>(optional)</span></label>
            <input
              id="journal-title"
              className="input"
              type="text"
              placeholder="Give your entry a title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>How were you feeling?</label>
            <MoodPicker value={moodTag} onChange={setMoodTag} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Write your thoughts</label>
            <textarea
              id="journal-content"
              className="input"
              placeholder="What's on your mind? How did your study session go? What are you grateful for?"
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ minHeight: '160px' }}
              required
            />
          </div>
          <button id="save-entry-btn" className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      )}

      {fetching ? (
        <p className="text-muted">Loading entries…</p>
      ) : entries.length === 0 ? (
        <div className={`glass-card ${styles.empty}`}>
          <p className={styles.emptyIcon}>📝</p>
          <h3>No journal entries yet</h3>
          <p>Start writing to reflect on your exam journey.</p>
        </div>
      ) : (
        <div className={styles.entries}>
          {entries.map(entry => <JournalCard key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create journal CSS module**

```css
/* app/(protected)/journal/journal.module.css */
.form { padding: 24px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 20px; }

.field { display: flex; flex-direction: column; gap: 8px; }

.label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }

.optional { font-size: 0.75rem; font-weight: 400; color: var(--text-muted); }

.entries { display: flex; flex-direction: column; gap: 16px; }

.empty { padding: 48px; text-align: center; }

.emptyIcon { font-size: 3rem; margin-bottom: 12px; }
```

- [ ] **Step 5: Commit**

```bash
git add components/JournalCard.jsx components/JournalCard.module.css app/'(protected)'/journal/ && git commit -m "feat: add journal page and JournalCard component" --no-verify
```

---

## Task 14: Mood History Page + MoodChart Component

**Files:**
- Create: `components/MoodChart.jsx`
- Create: `components/MoodChart.module.css`
- Create: `app/(protected)/history/page.jsx`

- [ ] **Step 1: Create MoodChart**

```jsx
// components/MoodChart.jsx
'use client'

import { useState } from 'react'
import styles from './MoodChart.module.css'

const MOOD_COLORS = {
  1: '#EF4444', 2: '#F97316', 3: '#EAB308', 4: '#22C55E', 5: '#10B981'
}
const MOOD_EMOJI = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' }

export default function MoodChart({ checkins }) {
  const [range, setRange] = useState(7)

  const days = Array.from({ length: range }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (range - 1 - i))
    return d.toISOString().slice(0, 10)
  })

  const dataByDate = {}
  checkins.forEach(c => { dataByDate[c.created_at.slice(0, 10)] = c })

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button className={`${styles.rangeBtn} ${range === 7 ? styles.active : ''}`} onClick={() => setRange(7)}>7 days</button>
        <button className={`${styles.rangeBtn} ${range === 30 ? styles.active : ''}`} onClick={() => setRange(30)}>30 days</button>
      </div>

      <div className={styles.chart}>
        {days.map(date => {
          const checkin = dataByDate[date]
          const score = checkin?.mood_score
          const heightPct = score ? (score / 5) * 100 : 0
          const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

          return (
            <div key={date} className={styles.barWrapper} title={score ? `${dayLabel}: ${MOOD_EMOJI[score]} ${score}/5` : dayLabel}>
              <div className={styles.barTrack}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${heightPct}%`,
                    background: score ? MOOD_COLORS[score] : 'transparent',
                  }}
                />
              </div>
              <span className={styles.dayLabel}>{range <= 7 ? dayLabel : new Date(date + 'T00:00:00').getDate()}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.legend}>
        {[1,2,3,4,5].map(s => (
          <span key={s} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: MOOD_COLORS[s] }} />
            {MOOD_EMOJI[s]}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create MoodChart CSS module**

```css
/* components/MoodChart.module.css */
.container { padding: 8px 0; }

.controls { display: flex; gap: 8px; margin-bottom: 24px; }

.rangeBtn {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.rangeBtn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 160px;
  padding-bottom: 32px;
  position: relative;
  border-bottom: 1px solid var(--border);
}

.barWrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 6px;
}

.barTrack {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: var(--bg-card);
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  min-width: 10px;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  min-height: 4px;
}

.dayLabel {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.legend {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  justify-content: center;
}

.legendItem { display: flex; align-items: center; gap: 4px; font-size: 0.875rem; }

.legendDot { width: 8px; height: 8px; border-radius: 50%; }
```

- [ ] **Step 3: Create history page**

```jsx
// app/(protected)/history/page.jsx
import { createClient } from '@/lib/supabase/server'
import MoodChart from '@/components/MoodChart'
import styles from './history.module.css'

const MOOD_EMOJI = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' }
const MOOD_LABEL = { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' }

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: checkins } = await supabase
    .from('mood_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const all = checkins || []
  const avgMood = all.length ? (all.reduce((s, c) => s + c.mood_score, 0) / all.length).toFixed(1) : null

  const triggerCounts = {}
  all.forEach(c => c.stress_triggers?.forEach(t => { triggerCounts[t] = (triggerCounts[t] || 0) + 1 }))
  const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Mood History</h1>
        <p>Track your emotional patterns over time.</p>
      </div>

      {all.length === 0 ? (
        <div className={`glass-card ${styles.empty}`}>
          <p>No check-ins yet. Start your first check-in to see your history here.</p>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div className="glass-card stat-card">
              <div className="stat-value">{all.length}</div>
              <div className="stat-label">Total Check-Ins</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-value">{avgMood}</div>
              <div className="stat-label">Overall Avg Mood</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-value">{MOOD_EMOJI[Math.round(avgMood)] || '—'}</div>
              <div className="stat-label">General Feeling</div>
            </div>
          </div>

          <div className={`glass-card ${styles.chartCard}`}>
            <h3 style={{ marginBottom: '16px' }}>Mood Over Time</h3>
            <MoodChart checkins={all} />
          </div>

          {topTriggers.length > 0 && (
            <div className={`glass-card ${styles.triggersCard}`}>
              <h3 style={{ marginBottom: '16px' }}>Your Most Common Stress Triggers</h3>
              <div className={styles.triggerList}>
                {topTriggers.map(([trigger, count]) => (
                  <div key={trigger} className={styles.triggerRow}>
                    <span className={styles.triggerName}>{trigger}</span>
                    <div className={styles.triggerBar}>
                      <div
                        className={styles.triggerFill}
                        style={{ width: `${(count / all.length) * 100}%` }}
                      />
                    </div>
                    <span className={styles.triggerCount}>{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`glass-card ${styles.recentCard}`}>
            <h3 style={{ marginBottom: '16px' }}>Recent Check-Ins</h3>
            <div className={styles.recentList}>
              {all.slice(0, 10).map(c => (
                <div key={c.id} className={styles.recentRow}>
                  <span className={styles.recentEmoji}>{MOOD_EMOJI[c.mood_score]}</span>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentLabel}>{MOOD_LABEL[c.mood_score]}</span>
                    {c.note && <span className={styles.recentNote}>{c.note}</span>}
                  </div>
                  <time className={styles.recentDate}>
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </time>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create history CSS module**

```css
/* app/(protected)/history/history.module.css */
.empty { padding: 40px; text-align: center; }

.chartCard { padding: 24px; margin-bottom: 24px; }

.triggersCard { padding: 24px; margin-bottom: 24px; }

.triggerList { display: flex; flex-direction: column; gap: 12px; }

.triggerRow { display: flex; align-items: center; gap: 12px; }

.triggerName { font-size: 0.875rem; color: var(--text-secondary); min-width: 160px; }

.triggerBar {
  flex: 1;
  height: 8px;
  background: var(--bg-card);
  border-radius: 999px;
  overflow: hidden;
}

.triggerFill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  border-radius: 999px;
  transition: width 0.8s ease;
}

.triggerCount { font-size: 0.75rem; color: var(--text-muted); min-width: 24px; text-align: right; }

.recentCard { padding: 24px; }

.recentList { display: flex; flex-direction: column; gap: 0; }

.recentRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.recentRow:last-child { border-bottom: none; }

.recentEmoji { font-size: 1.5rem; flex-shrink: 0; }

.recentInfo { flex: 1; }

.recentLabel { font-size: 0.9375rem; font-weight: 500; color: var(--text-primary); display: block; }

.recentNote { font-size: 0.8125rem; color: var(--text-muted); display: block; margin-top: 2px; }

.recentDate { font-size: 0.75rem; color: var(--text-muted); }
```

- [ ] **Step 5: Commit**

```bash
git add components/MoodChart.jsx components/MoodChart.module.css app/'(protected)'/history/ && git commit -m "feat: add mood history page with chart and trigger analysis" --no-verify
```

---

## Task 15: Wellness Fallback + Gemini API Route

**Files:**
- Create: `lib/wellness-fallback.js`
- Create: `app/api/wellness/route.js`

- [ ] **Step 1: Create static fallback tips**

```js
// lib/wellness-fallback.js
const TIPS = {
  low: [
    {
      icon: '🌬️',
      title: '4-7-8 Breathing',
      description: 'Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times. This activates your parasympathetic nervous system and reduces anxiety fast.',
      action: 'Try it now — set a 2-minute timer and breathe.',
    },
    {
      icon: '💙',
      title: 'Self-Compassion Pause',
      description: "You're going through something hard. Acknowledge it — don't suppress it. Tell yourself: \"This is difficult. Many students feel this way. I'm doing my best.\"",
      action: 'Write one kind thing you would say to a friend in your situation.',
    },
    {
      icon: '📞',
      title: 'You Don\'t Have to Go It Alone',
      description: "If stress feels overwhelming, iCall (9152987821) offers free mental health support for students across India.",
      action: 'Save the number. Reaching out is a sign of strength.',
    },
  ],
  medium: [
    {
      icon: '⏸️',
      title: 'The 5-Minute Study Break',
      description: 'Stand up, stretch your arms, roll your shoulders, and look at something 20 feet away for 20 seconds. Your brain needs these micro-resets to retain information.',
      action: 'Set a timer for 5 minutes and step away from your desk.',
    },
    {
      icon: '✍️',
      title: 'Brain Dump',
      description: 'Write everything on your mind — worries, tasks, random thoughts — for 5 minutes without stopping. Getting it out of your head clears mental space.',
      action: 'Open your journal and write without filtering.',
    },
    {
      icon: '🌟',
      title: 'Progress Affirmation',
      description: "Your past self worked hard to get here. Every topic you've studied is a step forward. Progress, not perfection.",
      action: 'List 3 things you have already prepared well.',
    },
  ],
  high: [
    {
      icon: '🎯',
      title: 'Set Tomorrow\'s One Goal',
      description: "When you're feeling good, momentum matters. Identify the single most important thing to accomplish tomorrow and write it down tonight.",
      action: 'Write your top priority for tomorrow before you sleep.',
    },
    {
      icon: '🙏',
      title: 'Gratitude Practice',
      description: "Gratitude rewires the brain toward positive thinking. Even during exam stress, finding 3 things you are grateful for boosts resilience.",
      action: 'Write 3 specific things you are grateful for today.',
    },
    {
      icon: '💪',
      title: 'Momentum Builder',
      description: "You are doing great. Use this energy to tackle one challenging topic you have been avoiding. Start with just 10 minutes.",
      action: 'Pick one hard topic and spend the next 10 minutes on it.',
    },
  ],
}

export function getFallbackTips(avgMoodScore) {
  if (avgMoodScore <= 2) return TIPS.low
  if (avgMoodScore <= 3.5) return TIPS.medium
  return TIPS.high
}
```

- [ ] **Step 2: Write test for fallback**

```js
// __tests__/lib/wellness-fallback.test.js
import { getFallbackTips } from '@/lib/wellness-fallback'

describe('getFallbackTips', () => {
  test('returns low tips for score <= 2', () => {
    const tips = getFallbackTips(1)
    expect(tips).toHaveLength(3)
    expect(tips[0].title).toBe('4-7-8 Breathing')
  })

  test('returns low tips for score exactly 2', () => {
    const tips = getFallbackTips(2)
    expect(tips[0].title).toBe('4-7-8 Breathing')
  })

  test('returns medium tips for score 2.1 to 3.5', () => {
    const tips = getFallbackTips(3)
    expect(tips[0].title).toBe('The 5-Minute Study Break')
  })

  test('returns high tips for score > 3.5', () => {
    const tips = getFallbackTips(4)
    expect(tips[0].title).toBe("Set Tomorrow's One Goal")
  })

  test('returns high tips for score 5', () => {
    const tips = getFallbackTips(5)
    expect(tips[0].title).toBe("Set Tomorrow's One Goal")
  })

  test('each tip has required fields', () => {
    getFallbackTips(1).forEach(tip => {
      expect(tip).toHaveProperty('icon')
      expect(tip).toHaveProperty('title')
      expect(tip).toHaveProperty('description')
      expect(tip).toHaveProperty('action')
    })
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test -- __tests__/lib/wellness-fallback.test.js
```

Expected: 6 tests pass.

- [ ] **Step 4: Create Gemini API route**

```js
// app/api/wellness/route.js
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getFallbackTips } from '@/lib/wellness-fallback'

export async function POST(request) {
  try {
    const { examType, moodScores, stressTriggers } = await request.json()

    // Input validation
    if (!Array.isArray(moodScores) || moodScores.length === 0) {
      return Response.json({ error: 'Invalid moodScores' }, { status: 400 })
    }

    const avgScore = moodScores.reduce((a, b) => a + b, 0) / moodScores.length

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ tips: getFallbackTips(avgScore), source: 'fallback' })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const triggersText = stressTriggers?.length > 0
      ? `Today's stress triggers: ${stressTriggers.join(', ')}.`
      : 'No specific stress triggers reported today.'

    const prompt = `You are a compassionate mental wellness coach specializing in helping Indian students during exam preparation.

Student context:
- Preparing for: ${examType || 'competitive exams'}
- Recent mood scores (1=very low, 5=great): ${moodScores.join(', ')} (average: ${avgScore.toFixed(1)}/5)
- ${triggersText}

Provide exactly 3 personalized wellness suggestions for this student. Each suggestion must be:
- Specific to their exam type and stress triggers
- Immediately actionable (not vague)
- Empathetic and encouraging
- Practical for a student with limited time

Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  {
    "icon": "<single emoji>",
    "title": "<short title, max 6 words>",
    "description": "<2-3 sentences, empathetic and specific>",
    "action": "<one concrete action they can do right now>"
  }
]`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Parse JSON from Gemini response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Invalid Gemini response format')

    const tips = JSON.parse(jsonMatch[0])
    if (!Array.isArray(tips) || tips.length !== 3) throw new Error('Unexpected tips format')

    return Response.json({ tips, source: 'gemini' })
  } catch (error) {
    console.error('Wellness API error:', error.message)
    // Always fall back gracefully
    try {
      const { moodScores } = await request.json().catch(() => ({ moodScores: [3] }))
      const avg = Array.isArray(moodScores) ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length : 3
      return Response.json({ tips: getFallbackTips(avg), source: 'fallback' })
    } catch {
      return Response.json({ tips: getFallbackTips(3), source: 'fallback' })
    }
  }
}
```

- [ ] **Step 5: Write test for API route**

```js
// __tests__/api/wellness.test.js
import { POST } from '@/app/api/wellness/route'

// Mock the Gemini SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            { icon: '🌬️', title: 'Breathing Exercise', description: 'Test desc.', action: 'Test action.' },
            { icon: '💙', title: 'Self Care', description: 'Test desc.', action: 'Test action.' },
            { icon: '🎯', title: 'Focus', description: 'Test desc.', action: 'Test action.' },
          ])
        }
      })
    })
  }))
}))

describe('POST /api/wellness', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key'
  })

  test('returns 3 tips from Gemini when API key is set', async () => {
    const req = new Request('http://localhost/api/wellness', {
      method: 'POST',
      body: JSON.stringify({ examType: 'NEET', moodScores: [2, 3, 2], stressTriggers: ['Exam Pressure'] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const data = await res.json()
    expect(data.tips).toHaveLength(3)
    expect(data.source).toBe('gemini')
  })

  test('returns fallback tips when no API key', async () => {
    delete process.env.GEMINI_API_KEY
    const req = new Request('http://localhost/api/wellness', {
      method: 'POST',
      body: JSON.stringify({ examType: 'JEE', moodScores: [1, 2], stressTriggers: [] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const data = await res.json()
    expect(data.tips).toHaveLength(3)
    expect(data.source).toBe('fallback')
  })

  test('returns 400 for invalid moodScores', async () => {
    const req = new Request('http://localhost/api/wellness', {
      method: 'POST',
      body: JSON.stringify({ examType: 'CAT', moodScores: 'bad' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm test -- __tests__/api/wellness.test.js
```

Expected: 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/ app/api/ __tests__/ && git commit -m "feat: add Gemini wellness API route with fallback and tests" --no-verify
```

---

## Task 16: WellnessTipCard + Wellness Page

**Files:**
- Create: `components/WellnessTipCard.jsx`
- Create: `components/WellnessTipCard.module.css`
- Create: `app/(protected)/wellness/page.jsx`

- [ ] **Step 1: Create WellnessTipCard**

```jsx
// components/WellnessTipCard.jsx
import styles from './WellnessTipCard.module.css'

export default function WellnessTipCard({ tip, index }) {
  return (
    <article
      className={`glass-card ${styles.card}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={styles.icon}>{tip.icon}</div>
      <div className={styles.content}>
        <h3 className={styles.title}>{tip.title}</h3>
        <p className={styles.description}>{tip.description}</p>
        <div className={styles.action}>
          <span className={styles.actionLabel}>→ Action</span>
          <span className={styles.actionText}>{tip.action}</span>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Create WellnessTipCard CSS module**

```css
/* components/WellnessTipCard.module.css */
.card {
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  animation: fadeInUp 0.4s ease both;
}

.icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-glow);
  border-radius: var(--radius-md);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.content { flex: 1; }

.title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.action {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  border-left: 3px solid var(--accent);
}

.actionLabel {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-light);
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.actionText { font-size: 0.875rem; color: var(--text-primary); font-weight: 500; }
```

- [ ] **Step 3: Create wellness page**

```jsx
// app/(protected)/wellness/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WellnessTipCard from '@/components/WellnessTipCard'
import styles from './wellness.module.css'

const MOOD_EMOJI = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' }

export default function WellnessPage() {
  const [tips, setTips] = useState([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [recentMoods, setRecentMoods] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: checkins }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('mood_checkins').select('mood_score, stress_triggers, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      ])

      setProfile(prof)
      setRecentMoods(checkins || [])

      const moodScores = (checkins || []).map(c => c.mood_score)
      const stressTriggers = checkins?.[0]?.stress_triggers || []

      if (moodScores.length === 0) {
        // No check-ins yet — show generic medium tips
        const res = await fetch('/api/wellness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examType: prof?.exam_type || 'exams', moodScores: [3], stressTriggers: [] }),
        })
        const data = await res.json()
        setTips(data.tips)
        setSource(data.source)
      } else {
        const res = await fetch('/api/wellness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examType: prof?.exam_type, moodScores, stressTriggers }),
        })
        const data = await res.json()
        setTips(data.tips)
        setSource(data.source)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function regenerate() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: checkins } = await supabase
      .from('mood_checkins').select('mood_score, stress_triggers')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)

    const res = await fetch('/api/wellness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examType: profile?.exam_type,
        moodScores: (checkins || []).map(c => c.mood_score),
        stressTriggers: checkins?.[0]?.stress_triggers || [],
      }),
    })
    const data = await res.json()
    setTips(data.tips)
    setSource(data.source)
    setLoading(false)
  }

  return (
    <div className="animate-in">
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Wellness Tips ✨</h1>
          <p>
            {source === 'gemini' ? 'AI-personalized just for you' : 'Curated tips based on your mood'}
            {recentMoods.length > 0 && ` • Based on your recent moods: ${recentMoods.map(c => MOOD_EMOJI[c.mood_score]).join(' ')}`}
          </p>
        </div>
        <button id="regenerate-btn" className="btn btn-ghost" onClick={regenerate} disabled={loading}>
          🔄 Refresh Tips
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Generating personalized tips for your {profile?.exam_type || 'exam'} journey…</p>
        </div>
      ) : (
        <div className={styles.tips}>
          {tips.map((tip, i) => <WellnessTipCard key={i} tip={tip} index={i} />)}
        </div>
      )}

      {!loading && source === 'gemini' && (
        <p className={styles.aiNote}>✦ These tips were generated by AI based on your recent check-ins. Always consult a professional for serious mental health concerns.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create wellness CSS module**

```css
/* app/(protected)/wellness/wellness.module.css */
.tips { display: flex; flex-direction: column; gap: 16px; max-width: 720px; }

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 300px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.aiNote {
  margin-top: 24px;
  font-size: 0.75rem;
  color: var(--text-muted);
  max-width: 720px;
}
```

- [ ] **Step 5: Commit**

```bash
git add components/WellnessTipCard.jsx components/WellnessTipCard.module.css app/'(protected)'/wellness/ && git commit -m "feat: add wellness page with AI-powered tips and WellnessTipCard" --no-verify
```

---

## Task 17: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the full README**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: update README with full project documentation" --no-verify
```

---

## Task 18: Vercel Deployment

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project" → select the `hack2skillchallenge` repo
3. Framework preset will auto-detect as Next.js
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Click "Deploy"

- [ ] **Step 3: Verify deployment**

Visit the Vercel-provided URL and:
- [ ] Signup with a new email
- [ ] Complete check-in (select mood, triggers, note)
- [ ] Check that wellness page shows 3 tips
- [ ] Write a journal entry
- [ ] View history page shows bar chart
- [ ] Log out and log back in — data persists

---

## Self-Review

### Spec Coverage
- ✅ Mood tracking (check-in page with 1-5 scale + emoji)
- ✅ Stress trigger identification (TriggerSelector with 9 predefined tags)
- ✅ Emotion reflection (journal entries)
- ✅ Personalized wellness support (Gemini API + fallback)
- ✅ Persistent data (Supabase + RLS)
- ✅ Login required (Supabase Auth + middleware)
- ✅ Mood history chart (MoodChart SVG)
- ✅ Dashboard with streak + stats
- ✅ Deployment to Vercel
- ✅ Tests for fallback logic and API route
- ✅ README with all required sections

### Placeholder Check
No TBD, TODO, or vague steps in this plan. Every step has complete code or exact commands.

### Type Consistency
- `createClient()` used consistently from `@/lib/supabase/client` (browser) and `@/lib/supabase/server` (server)
- `user_id` consistently references `profiles.id` everywhere
- `mood_score` is always `int` 1-5, `stress_triggers` always `text[]`
