export function calcStreak(checkins) {
  if (!checkins || !checkins.length) return 0
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
