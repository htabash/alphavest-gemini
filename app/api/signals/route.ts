import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { signalsPrompt } from '@/lib/prompts'
import { getMultipleQuotes } from '@/lib/market'

const TICKERS = [
  'NVDA','AAPL','MSFT','TSLA','AMZN','META','GOOGL','JPM',
  'AMAT','AMD','NFLX','CRM','UBER','COIN','PLTR','ARM',
  'INTC','SHOP','SQ','PYPL','DIS','BA','GS','V','MA','WMT','HD'
]

let cache: { data: unknown; time: number; lang: string } | null = null
const CACHE_MS = 0 * 60 * 1000 // 15 minutes

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang') || 'en'
    const now = Date.now()

    // Return cached data if less than 15 minutes old
    if (cache && (now - cache.time) < CACHE_MS && cache.lang === lang) {
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

    // Generate new signals with real prices
    const quotes = await getMultipleQuotes(TICKERS)
    const priceContext = TICKERS
      .filter(t => quotes[t])
      .map(t => `${t}=$${quotes[t].price}`)
      .join(', ')

    const aiData = await generateJSON(signalsPrompt(lang, priceContext))
    const data = aiData as Record<string, unknown>

    if (data?.signals && Array.isArray(data.signals)) {
      data.signals = (data.signals as Array<Record<string, unknown>>).map(s => {
        const q = quotes[s.ticker as string]
        return q ? { ...s, price: q.price, priceChange: q.priceChange, priceChangePct: q.priceChangePct } : s
      })
    }

    cache = { data, time: now, lang }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
