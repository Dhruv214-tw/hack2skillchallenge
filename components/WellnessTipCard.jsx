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
