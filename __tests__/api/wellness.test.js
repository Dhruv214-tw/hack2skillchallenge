import { POST } from '@/app/api/wellness/route'

// Mock the Gemini SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            { icon: '🌬️', title: 'Breathing Exercise', description: 'Test desc.', action: 'Test action.' },
            { icon: '💙', title: 'Self Care', description: 'Test desc.', action: 'Test action.' },
            { icon: '🎯', title: 'Focus', description: 'Test desc.', action: 'Test action.' },
          ])
        }
      })
    })
  }))
}))

describe('POST /api/wellness', () => {
  beforeAll(() => {
    global.Response = {
      json: (data, init) => ({
        status: init?.status || 200,
        json: async () => data
      })
    }
  })

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key'
  })

  test('returns 3 tips from Gemini when API key is set', async () => {
    const req = {
      json: async () => ({ examType: 'NEET', moodScores: [2, 3, 2], stressTriggers: ['Exam Pressure'] })
    }
    const res = await POST(req)
    const data = await res.json()
    expect(data.tips).toHaveLength(3)
    expect(data.source).toBe('gemini')
  })

  test('returns fallback tips when no API key', async () => {
    delete process.env.GEMINI_API_KEY
    const req = {
      json: async () => ({ examType: 'JEE', moodScores: [1, 2], stressTriggers: [] })
    }
    const res = await POST(req)
    const data = await res.json()
    expect(data.tips).toHaveLength(3)
    expect(data.source).toBe('fallback')
  })

  test('returns 400 for invalid moodScores', async () => {
    const req = {
      json: async () => ({ examType: 'CAT', moodScores: 'bad' })
    }
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
