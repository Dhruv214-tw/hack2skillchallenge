import { GoogleGenerativeAI } from '@google/generative-ai'
import { getFallbackTips } from '@/lib/wellness-fallback'

export async function POST(request) {
  try {
    const { examType, moodScores, stressTriggers } = await request.json()

    // Input validation
    if (!Array.isArray(moodScores) || moodScores.length === 0) {
      return Response.json({ error: 'Invalid moodScores' }, { status: 400 })
    }

    const avgScore = moodScores.reduce((a, b) => a + b, 0) / moodScores.length

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ tips: getFallbackTips(avgScore), source: 'fallback' })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const triggersText = stressTriggers?.length > 0
      ? `Today's stress triggers: ${stressTriggers.join(', ')}.`
      : 'No specific stress triggers reported today.'

    const prompt = `You are a compassionate mental wellness coach specializing in helping Indian students during exam preparation.

Student context:
- Preparing for: ${examType || 'competitive exams'}
- Recent mood scores (1=very low, 5=great): ${moodScores.join(', ')} (average: ${avgScore.toFixed(1)}/5)
- ${triggersText}

Provide exactly 3 personalized wellness suggestions for this student. Each suggestion must be:
- Specific to their exam type and stress triggers
- Immediately actionable (not vague)
- Empathetic and encouraging
- Practical for a student with limited time

Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  {
    "icon": "<single emoji>",
    "title": "<short title, max 6 words>",
    "description": "<2-3 sentences, empathetic and specific>",
    "action": "<one concrete action they can do right now>"
  }
]`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Parse JSON from Gemini response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Invalid Gemini response format')

    const tips = JSON.parse(jsonMatch[0])
    if (!Array.isArray(tips) || tips.length !== 3) throw new Error('Unexpected tips format')

    return Response.json({ tips, source: 'gemini' })
  } catch (error) {
    console.error('API Error:', error)
    // Always fall back to static tips on failure
    return Response.json({ tips: getFallbackTips(3), source: 'fallback-error' })
  }
}
