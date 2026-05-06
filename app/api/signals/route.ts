import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { signalsPrompt } from '@/lib/prompts'
import { getMultipleQuotes } from '@/lib/market'

const TICKERS = [
  // Technology
  'NVDA','AAPL','MSFT','META','GOOGL','AMZN','TSLA','AMD','INTC','QCOM',
  'AVGO','TXN','MU','AMAT','LRCX','KLAC','MRVL','CRM','ORCL','ADBE',
  'NOW','INTU','PLTR','UBER','ARM','SHOP','DDOG','SNOW','ZS','CRWD','PANW','NET',
  // Financials
  'JPM','BAC','WFC','GS','MS','BLK','AXP','V','MA','PYPL','SQ','COIN','C','COF','SCHW',
  // Healthcare
  'LLY','UNH','JNJ','ABBV','MRK','PFE','TMO','ABT','AMGN','GILD','ISRG','VRTX','REGN',
  // Consumer
  'WMT','COST','TGT','HD','LOW','MCD','SBUX','NKE','DIS','NFLX','PG','KO','PEP',
  // Energy
  'XOM','CVX','COP','SLB','EOG','MPC','PSX','VLO','OXY',
  // Industrials
  'BA','CAT','DE','GE','HON','UPS','FDX','RTX','LMT',
  // High Growth
  'RIVN','SOFI','HOOD','RBLX','ABNB','DASH','CVNA','DKNG'
]

const UNIQUE_TICKERS = [...new Set(TICKERS)]

let cache: { data: unknown; time: number; lang: string } | null = null
const CACHE_MS = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang') || 'en'
    const now = Date.now()

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
            if (!q) return s
            return buildSignal(s, q.price, q.priceChange, q.priceChangePct)
          })
        }
        return NextResponse.json(updated)
      }
      return NextResponse.json(data)
    }

    const quotes = await getMultipleQuotes(UNIQUE_TICKERS)
    const topTickers = selectTopCandidates(quotes, 50)
    const priceContext = topTickers
      .filter(t => quotes[t])
      .map(t => `${t}=$${quotes[t].price}`)
      .join(', ')

    const aiData = await generateJSON(signalsPrompt(lang, priceContext))
    const data = aiData as Record<string, unknown>

    if (data?.signals && Array.isArray(data.signals)) {
      data.signals = (data.signals as Array<Record<string, unknown>>).map(s => {
        const q = quotes[s.ticker as string]
        if (!q) return s
        return buildSignal(s, q.price, q.priceChange, q.priceChangePct)
      })
    }

    cache = { data, time: now, lang }
    return NextResponse.json(data)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ✅ بناء الـ signal مع Entry/Stop/Target محسوبة من السعر الحقيقي دائماً
function buildSignal(
  s: Record<string, unknown>,
  price: number,
  priceChange: number,
  priceChangePct: number
): Record<string, unknown> {
  const signal = (s.signal as string)?.toLowerCase()
  const isSell = signal?.includes('sell')
  const isHold = signal?.includes('hold')

  const p = price

  let entry: string
  let stopLoss: string
  let target1: string
  let target2: string

  if (isHold) {
    // HOLD: entry حول السعر الحالي، targets أضيق
    entry    = `$${Math.round(p * 0.98)}-${Math.round(p * 1.02)}`
    stopLoss = `$${Math.round(p * 0.93)}`
    target1  = `$${Math.round(p * 1.07)}`
    target2  = `$${Math.round(p * 1.12)}`
  } else if (isSell) {
    // SELL: entry فوق السعر، target تحته
    entry    = `$${Math.round(p * 1.01)}-${Math.round(p * 1.03)}`
    stopLoss = `$${Math.round(p * 1.06)}`
    target1  = `$${Math.round(p * 0.90)}`
    target2  = `$${Math.round(p * 0.82)}`
  } else {
    // BUY / STRONG BUY: entry تحت السعر قليلاً
    entry    = `$${Math.round(p * 0.97)}-${Math.round(p * 1.01)}`
    stopLoss = `$${Math.round(p * 0.94)}`
    target1  = `$${Math.round(p * 1.10)}`
    target2  = `$${Math.round(p * 1.18)}`
  }

  return {
    ...s,
    price,
    priceChange,
    priceChangePct,
    entry,
    stopLoss,
    target1,
    target2,
    setupValid: true,
  }
}

// ✅ اختر أفضل المرشحين بناءً على momentum
function selectTopCandidates(
  quotes: Record<string, { price: number; priceChange: number; priceChangePct: number }>,
  limit: number
): string[] {
  return Object.entries(quotes)
    .filter(([, q]) => q.price > 1)
    .map(([ticker, q]) => ({
      ticker,
      score: Math.abs(q.priceChangePct) * 2
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.ticker)
}
