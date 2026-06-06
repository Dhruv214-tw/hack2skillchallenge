import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { calcStreak } from '@/lib/utils'
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

