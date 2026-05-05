import Groq from 'groq-sdk'

export async function generateJSON(prompt: string): Promise<unknown> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert financial analyst. Always respond with valid JSON only. No markdown, no backticks, no explanation.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' }
  })
  const text = completion.choices[0]?.message?.content || '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  try { return JSON.parse(clean) }
  catch { const m = clean.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('Failed to parse') }
}
