import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { signalsPrompt } from '@/lib/prompts'
import { getMultipleQuotes } from '@/lib/market'

const TICKERS = ['NVDA','AAPL','MSFT','TSLA','AMZN','META','GOOGL','JPM','AMAT','AMD']

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang') || 'en'
    const [aiData, quotes] = await Promise.all([
      generateJSON(signalsPrompt(lang)),
      getMultipleQuotes(TICKERS)
    ])
    const data = aiData as any
    if (data?.signals && Array.isArray(data.signals)) {
      data.signals = data.signals.map((s: any) => {
        const q = quotes[s.ticker]
        if (q) {
          return { ...s, price: q.price, priceChange: q.priceChange, priceChangePct: q.priceChangePct }
        }
        return s
      })
    }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
