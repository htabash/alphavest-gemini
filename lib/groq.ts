import Groq from 'groq-sdk'

export async function generateJSON(prompt: string): Promise<unknown> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'You are an expert financial analyst. Always respond with valid JSON only. No markdown, no backticks, no explanation. Never use + sign before positive numbers in JSON. Always complete the full JSON response — never truncate.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.6,
    max_tokens: 3000,
  })

  const text = completion.choices[0]?.message?.content || '{}'
  const clean = text
    .replace(/```json|```/g, '')
    .replace(/:\s*\+(\d)/g, ': $1')
    .trim()

  try {
    return JSON.parse(clean)
  } catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0].replace(/:\s*\+(\d)/g, ': $1'))
      } catch {
        const fixed = m[0]
          .replace(/,\s*$/, '')
          .replace(/\[\s*$/, '[]')
          + (m[0].split('{').length > m[0].split('}').length ? '}' : '')
        try { return JSON.parse(fixed) } catch { throw new Error('Failed to parse JSON') }
      }
    }
    throw new Error('Failed to parse JSON')
  }
}
