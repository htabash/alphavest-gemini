import Groq from 'groq-sdk'

export async function generateJSON(prompt: string): Promise<unknown> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile', // ✅ نموذج أقوى وأدق
    messages: [
      {
        role: 'system',
        content: 'You are an expert financial analyst. Always respond with valid JSON only. No markdown, no backticks, no explanation. Never use + sign before positive numbers in JSON. Always complete the full JSON response — never truncate.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.6,
    max_tokens: 8000, // ✅ كافٍ لـ 16 توصية
  })

  const text = completion.choices[0]?.message?.content || '{}'

  const clean = text
    .replace(/```json|```/g, '')
    .replace(/:\s*\+(\d)/g, ': $1')
    .trim()

  try {
    return JSON.parse(clean)
  } catch {
    // ✅ محاولة إصلاح JSON مقطوع
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0].replace(/:\s*\+(\d)/g, ': $1'))
      } catch {
        // ✅ إذا JSON مقطوع — أكمله يدوياً
        const fixed = m[0]
          .replace(/,\s*$/, '')  // احذف فاصلة أخيرة
          .replace(/\[\s*$/, '[]') // أغلق array مفتوح
          + (m[0].split('{').length > m[0].split('}').length ? '}' : '') // أغلق object مفتوح
        try { return JSON.parse(fixed) } catch { throw new Error('Failed to parse JSON') }
      }
    }
    throw new Error('Failed to parse JSON')
  }
}
