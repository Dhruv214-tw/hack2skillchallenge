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
