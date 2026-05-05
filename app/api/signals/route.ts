import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { signalsPrompt } from '@/lib/prompts'
import { getMultipleQuotes } from '@/lib/market'

const TICKERS = ['NVDA','AAPL','MSFT','TSLA','AMZN','META','GOOGL','JPM','AMAT','AMD','NFLX','CRM']

let cache: { data: unknown; time: number } | null = null
const CACHE_MS = 60 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang') || 'en'
    const now = Date.now()

    if (cache && (now - cache.time) < CACHE_MS) {
      const data = cache.data as Record<string, unknown>
      const signals = data.signals as Array<Record<string, unknown>>
      if (signals?.length) {
        const tickers = signals.map(s => s.ticker as string)
        const quotes = await getMultipleQuotes(tickers)
        const updated = {
          ...data,
          signals: signals.map(s => {
            const q = quotes[s.ticker as string]
            return q ? { ...s, price: q.price, priceChange: q.priceChange, priceChangePct: q.priceChangePct } : s
          })
        }
        return NextResponse.json(updated)
      }
      return NextResponse.json(data)
    }

    // Get real prices first
    const quotes = await getMultipleQuotes(TICKERS)
    const priceContext = TICKERS
      .filter(t => quotes[t])
      .map(t => `${t}=$${quotes[t].price}`)
      .join(', ')

    const aiData = await generateJSON(signalsPrompt(lang, priceContext))
    const data = aiData as Record<string, unknown>

    // Override with real prices
    if (data?.signals && Array.isArray(data.signals)) {
      data.signals = (data.signals as Array<Record<string, unknown>>).map(s => {
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
