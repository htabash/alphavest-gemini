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
            return q ? {
              ...s,
              price: q.price,
              priceChange: q.priceChange,
              priceChangePct: q.priceChangePct
            } : s
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
        const withPrice = {
          ...s,
          price: q.price,
          priceChange: q.priceChange,
          priceChangePct: q.priceChangePct
        }
        return validateSetup(withPrice, q.price)
      })
    }

    cache = { data, time: now, lang }
    return NextResponse.json(data)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

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

function validateSetup(
  signal: Record<string, unknown>,
  currentPrice: number
): Record<string, unknown> {
  const action = (signal.signal as string)?.toLowerCase()
  const isBuy  = action?.includes('buy')
  const isSell = action?.includes('sell')

  const entryStr  = (signal.entry as string) || ''
  const cleaned   = entryStr.replace(/\$|,|\s/g, '')
  const entryNums = cleaned.split('-').map(Number).filter(n => !isNaN(n) && n > 0)
  const entryLow  = entryNums[0]
  const entryHigh = entryNums.length > 1 ? entryNums[1] : entryNums[0]

  // ✅ Entry بعيد أكثر من 10% عن السعر الحالي → بيانات خاطئة
  if (entryHigh && Math.abs(currentPrice - entryHigh) / currentPrice > 0.10) {
    return {
      ...signal,
      setupValid: false,
      setupNote: 'Entry price seems incorrect — data may be stale'
    }
  }

  // BUY: السعر تجاوز الـ entry بأكثر من 3%
  if (isBuy && entryHigh && currentPrice > entryHigh * 1.03) {
    return {
      ...signal,
      setupValid: false,
      setupNote: 'Price above entry — consider waiting for pullback'
    }
  }

  // SELL: السعر أقل من الـ entry بأكثر من 3%
  if (isSell && entryLow && currentPrice < entryLow * 0.97) {
    return {
      ...signal,
      setupValid: false,
      setupNote: 'Price below entry — setup may be stale'
    }
  }

  return { ...signal, setupValid: true }
}
