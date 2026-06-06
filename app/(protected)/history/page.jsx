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
