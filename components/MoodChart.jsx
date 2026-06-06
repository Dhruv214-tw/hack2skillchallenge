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
