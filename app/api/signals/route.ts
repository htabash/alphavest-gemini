import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { signalsPrompt } from '@/lib/prompts'
import { getMultipleQuotes } from '@/lib/market'

// ✅ 150 سهم من S&P 500 الأكثر تداولاً وتنوعاً
const TICKERS = [
  // Technology (35)
  'NVDA','AAPL','MSFT','META','GOOGL','GOOG','AMZN','TSLA','AMD','INTC',
  'QCOM','AVGO','TXN','MU','AMAT','LRCX','KLAC','MRVL','SNPS','CDNS',
  'CRM','ORCL','ADBE','NOW','INTU','PLTR','UBER','ARM','SHOP','DDOG',
  'SNOW','ZS','CRWD','PANW','NET',

  // Financials (20)
  'JPM','BAC','WFC','GS','MS','BLK','AXP','V','MA','PYPL',
  'SQ','COIN','C','USB','PNC','TFC','SCHW','ICE','CME','COF',

  // Healthcare (15)
  'LLY','UNH','JNJ','ABBV','MRK','PFE','TMO','ABT','DHR','BMY',
  'AMGN','GILD','ISRG','VRTX','REGN',

  // Consumer (15)
  'WMT','AMZN','COST','TGT','HD','LOW','MCD','SBUX','NKE','DIS',
  'NFLX','CMCSA','PG','KO','PEP',

  // Energy (10)
  'XOM','CVX','COP','SLB','EOG','PXD','MPC','PSX','VLO','OXY',

  // Industrials (10)
  'BA','CAT','DE','GE','HON','UPS','FDX','RTX','LMT','NOC',

  // Communication (10)
  'GOOGL','META','NFLX','DIS','CMCSA','T','VZ','TMUS','SNAP','PINS',

  // Semiconductors extra (10)
  'SMCI','DELL','HPE','STX','WDC','MCHP','ADI','NXPI','ON','SWKS',

  // High Growth / Momentum (15)
  'TSLA','RIVN','LCID','SOFI','HOOD','RBLX','U','ABNB','DASH','LYFT',
  'CVNA','DKNG','PENN','MGM','WYNN',

  // ETFs للسوق (5)
  'SPY','QQQ','IWM','XLK','XLF'
]

// إزالة المكررات
const UNIQUE_TICKERS = [...new Set(TICKERS)]

let cache: { data: unknown; time: number; lang: string } | null = null
const CACHE_MS = 15 * 60 * 1000 // ✅ 15 دقيقة فعلياً

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get('lang') || 'en'
    const now = Date.now()

    // Return cached data مع تحديث الأسعار فقط
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

    // ✅ جلب أسعار 150 سهم بشكل متوازٍ في batches
    const quotes = await getMultipleQuotesBatched(UNIQUE_TICKERS)

    // ✅ أرسل للـ AI أفضل 50 سهم بناءً على حجم التداول والتغير السعري
    const topTickers = selectTopCandidates(quotes, 50)
    
    const priceContext = topTickers
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

// ✅ جلب الأسعار في batches لتجنب rate limiting
async function getMultipleQuotesBatched(
  tickers: string[]
): Promise<Record<string, { price: number; priceChange: number; priceChangePct: number; volume: number }>> {
  const BATCH_SIZE = 25
  const results: Record<string, { price: number; priceChange: number; priceChangePct: number; volume: number }> = {}
  
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (ticker) => {
        try {
          const key = process.env.POLYGON_API_KEY
          const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${key}`
          const res = await fetch(url, { next: { revalidate: 60 } })
          if (!res.ok) return null
          const json = await res.json()
          const snap = json?.ticker
          if (!snap) return null
          const day = snap.day || {}
          const prevDay = snap.prevDay || {}
          const price = +(day.c || prevDay.c || snap.lastTrade?.p || 0)
          if (price < 0.5) return null
          const prevClose = +(prevDay.c || price)
          const priceChange = +(price - prevClose).toFixed(2)
          const priceChangePct = prevClose > 0 ? +((priceChange / prevClose) * 100).toFixed(2) : 0
          const volume = +(day.v || 0)
          return { ticker, price, priceChange, priceChangePct, volume }
        } catch { return null }
      })
    )
    batchResults.forEach(r => {
      if (r) results[r.ticker] = r
    })
  }
  return results
}

// ✅ اختر أفضل 50 مرشح بناءً على momentum وحجم التداول
function selectTopCandidates(
  quotes: Record<string, { price: number; priceChange: number; priceChangePct: number; volume: number }>,
  limit: number
): string[] {
  return Object.entries(quotes)
    .filter(([, q]) => q.price > 1) // استبعد الأسهم الرخيصة جداً
    .map(([ticker, q]) => ({
      ticker,
      score: Math.abs(q.priceChangePct) * 0.6 + // momentum
             (q.volume > 1_000_000 ? 30 : 0) +   // حجم تداول كافٍ
             (q.volume > 10_000_000 ? 20 : 0)     // تداول عالي جداً
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.ticker)
}

// ✅ تحقق من صحة الـ Setup
function validateSetup(
  signal: Record<string, unknown>,
  currentPrice: number
): Record<string, unknown> {
  const action = (signal.signal as string)?.toLowerCase()
  const isBuy  = action?.includes('buy')
  const isSell = action?.includes('sell')

  // استخرج entry من النص مثل "$280-285"
  const entryStr = signal.entry as string || ''
  const entryNums = entryStr.replace(/\$/g, '').split('-').map(Number).filter(Boolean)
  const entryHigh = entryNums.length > 1 ? entryNums[1] : entryNums[0]
  const entryLow  = entryNums[0]

  // للـ BUY: إذا السعر تجاوز الـ entry بأكثر من 3% → flag
  if (isBuy && entryHigh && currentPrice > entryHigh * 1.03) {
    return {
      ...signal,
      setupValid: false,
      setupNote: 'Price above entry — consider waiting for pullback'
    }
  }

  // للـ SELL: إذا السعر أقل من الـ entry بأكثر من 3% → flag  
  if (isSell && entryLow && currentPrice < entryLow * 0.97) {
    return {
      ...signal,
      setupValid: false,
      setupNote: 'Price below entry — setup may be stale'
    }
  }

  return { ...signal, setupValid: true }
}
