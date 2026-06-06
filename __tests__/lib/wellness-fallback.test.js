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
