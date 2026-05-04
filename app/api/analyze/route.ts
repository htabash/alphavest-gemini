import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import { analyzePrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  try {
    const { ticker, lang } = await req.json()
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })
    const data = await generateJSON(analyzePrompt(ticker.toUpperCase(), lang || 'en'))
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
