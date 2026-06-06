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
