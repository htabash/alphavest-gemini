import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { analyzePrompt } from '@/lib/prompts'
import { getQuote } from '@/lib/market'

export async function POST(req: NextRequest) {
  try {
    const { ticker, lang } = await req.json()
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })
    const sym = ticker.toUpperCase()
    const [aiData, quote] = await Promise.all([
      generateJSON(analyzePrompt(sym, lang || 'en')),
      getQuote(sym)
    ])
    const data = aiData as Record<string, unknown>
    if (quote) {
      data.price = quote.price
      data.priceChange = quote.priceChange
      data.priceChangePct = quote.priceChangePct
      data.open = quote.open
      data.high = quote.high
      data.low = quote.low
      data.volume = quote.volume
      data.avgVolume = quote.avgVolume
      data.week52High = quote.week52High
      data.week52Low = quote.week52Low
      data.marketCap = quote.marketCap
      data.beta = quote.beta ?? data.beta
      if (quote.history1M.length > 0) {
  data.historicalPrices = {
    '1M': quote.history1M,
    '3M': quote.history3M.length > 0 ? quote.history3M : quote.history1M,
    '6M': quote.history6M.length > 0 ? quote.history6M : quote.history1M,
    '1Y': quote.history1Y.length > 0 ? quote.history1Y : quote.history1M,
  }
}
      const fm = data.fundamentals as Record<string, unknown>
      if (fm && quote.pe) fm.pe = quote.pe
      if (fm && quote.eps) fm.eps = `$${quote.eps}`
    }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
