import { calcStreak } from '@/lib/utils'

describe('calcStreak', () => {
  const today = new Date().toISOString().slice(0, 10)

  const makeDate = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().slice(0, 10)
  }

  test('returns 0 for empty checkins', () => {
    expect(calcStreak([])).toBe(0)
    expect(calcStreak(null)).toBe(0)
  })

  test('returns 1 for only today', () => {
    expect(calcStreak([{ created_at: today }])).toBe(1)
  })

  test('calculates multi-day streak', () => {
    const checkins = [
      { created_at: makeDate(0) },
      { created_at: makeDate(1) },
      { created_at: makeDate(2) },
      { created_at: makeDate(4) } // break in streak
    ]
    expect(calcStreak(checkins)).toBe(3)
  })

  test('ignores duplicate checkins on same day', () => {
    const checkins = [
      { created_at: makeDate(0) },
      { created_at: makeDate(0) },
      { created_at: makeDate(1) }
    ]
    expect(calcStreak(checkins)).toBe(2)
  })

  test('returns 0 if missed today', () => {
    const checkins = [
      { created_at: makeDate(1) },
      { created_at: makeDate(2) }
    ]
    expect(calcStreak(checkins)).toBe(0)
  })
})
