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
