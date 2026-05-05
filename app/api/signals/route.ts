import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { signalsPrompt } from '@/lib/prompts'
import { getMultipleQuotes } from '@/lib/market'

const TICKERS = ['NVDA','AAPL','MSFT','TSLA','AMZN','META','GOOGL','JPM','AMAT','AMD']

let cache: { data: unknown; time: number } | null = null
const CACHE_MS = 60 * 60 * 1000 // 1 hour

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang') || 'en'
    const now = Date.now()

    // Return cached data if less than 1 hour old
    if (cache && (now - cache.time) < CACHE_MS) {
      const data = cache.data as Record<string, unknown>
      // Always fetch fresh prices
      const quotes = await getMultipleQuotes(TICKERS)
      if (data?.signals && Array.isArray(data.signals)) {
        const updated = { ...data, signals: (data.signals as Array<Record<string, unknown>>).map((s) => {
          const q = quotes[s.ticker as string]
          return q ? { ...s, price: q.price, priceChange: q.priceChange, priceChangePct: q.priceChangePct } : s
        })}
        return NextResponse.json(updated)
      }
      return NextResponse.json(data)
    }

    // Generate new signals + fresh prices
    const [aiData, quotes] = await Promise.all([
      generateJSON(signalsPrompt(lang)),
      getMultipleQuotes(TICKERS)
    ])

    const data = aiData as Record<string, unknown>
    if (data?.signals && Array.isArray(data.signals)) {
      data.signals = (data.signals as Array<Record<string, unknown>>).map((s) => {
        const q = quotes[s.ticker as string]
        return q ? { ...s, price: q.price, priceChange: q.priceChange, priceChangePct: q.priceChangePct } : s
      })
    }

    cache = { data, time: now }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
