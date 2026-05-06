// lib/market.ts

export interface QuoteData {
  ticker: string; price: number; priceChange: number; priceChangePct: number
  open: number; high: number; low: number; volume: string; avgVolume: string
  week52High: number; week52Low: number; marketCap: string
  pe: number | null; eps: number | null; beta: number | null
  history1M: number[]; history3M: number[]; history6M: number[]; history1Y: number[]
}

function fMcap(v: number): string {
  if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v/1e9).toFixed(1)}B`
  return `$${(v/1e6).toFixed(1)}M`
}

function fVol(v: number): string {
  if (v >= 1e9) return `${(v/1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`
  return `${(v/1e3).toFixed(1)}K`
}

function getDateRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  }
}

async function fetchHistory(
  ticker: string,
  days: number,
  multiplier: number,
  timespan: string
): Promise<number[]> {
  try {
    const key = process.env.POLYGON_API_KEY
    const { from, to } = getDateRange(days)
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50&apiKey=${key}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = await res.json()
    const results = json?.results || []
    if (results.length === 0) return []
    const closes = results.map((r: { c: number }) => +r.c.toFixed(2))
    if (closes.length <= 20) return closes
    const step = Math.floor(closes.length / 20)
    const sampled = Array.from({ length: 20 }, (_, i) =>
      closes[Math.min(i * step, closes.length - 1)]
    )
    sampled[19] = closes[closes.length - 1]
    return sampled
  } catch { return [] }
}

async function getQuoteYahoo(ticker: string): Promise<QuoteData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 }
    })
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price = +(meta.regularMarketPrice || 0)
    if (price <= 0) return null

    const prev  = +(meta.chartPreviousClose || price)
    const change    = +(price - prev).toFixed(2)
    const changePct = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0

    return {
      ticker,
      price,
      priceChange: change,
      priceChangePct: changePct,
      open:  +(meta.regularMarketOpen    || price),
      high:  +(meta.regularMarketDayHigh || price),
      low:   +(meta.regularMarketDayLow  || price),
      volume:    meta.regularMarketVolume ? fVol(meta.regularMarketVolume) : '—',
      avgVolume: meta.averageDailyVolume3Month
        ? fVol(meta.averageDailyVolume3Month) : '—',
      week52High: +(meta.fiftyTwoWeekHigh || 0),
      week52Low:  +(meta.fiftyTwoWeekLow  || 0),
      marketCap: meta.marketCap ? fMcap(meta.marketCap) : '—',
      pe: null, eps: null, beta: null,
      history1M: [], history3M: [], history6M: [], history1Y: []
    }
  } catch { return null }
}

// ✅ التحقق من أن السعر منطقي
function isPriceValid(price: number): boolean {
  return price > 0.5 && price < 100000
}

export async function getQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const key = process.env.POLYGON_API_KEY
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${key}`
    const res = await fetch(url, { next: { revalidate: 60 } })

    if (!res.ok) return await getQuoteYahoo(ticker)

    const json = await res.json()
    const snap = json?.ticker
    if (!snap) return await getQuoteYahoo(ticker)

    const day     = snap.day     || {}
    const prevDay = snap.prevDay || {}

    // ✅ الإصلاح الرئيسي: أولوية لـ day.c (closing) وليس lastTrade
    // lastTrade خارج ساعات السوق قد يكون صفقة صغيرة غير ممثلة للسعر
    const price = +(day.c || prevDay.c || snap.lastTrade?.p || snap.min?.c || 0)

    // ✅ إذا السعر غير منطقي → fallback لـ Yahoo
    if (!isPriceValid(price)) return await getQuoteYahoo(ticker)

    const prevClose = +(prevDay.c || price)
    const change    = +(price - prevClose).toFixed(2)
    const changePct = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0

    // ✅ week52 من فترة سنة كاملة
    const week52High = +(snap.ticker?.day?.h || prevDay.h || 0)
    const week52Low  = +(snap.ticker?.day?.l || prevDay.l || 0)

    const [h1M, h3M, h6M, h1Y] = await Promise.all([
      fetchHistory(ticker, 30,  1, 'day'),
      fetchHistory(ticker, 90,  1, 'day'),
      fetchHistory(ticker, 180, 1, 'week'),
      fetchHistory(ticker, 365, 1, 'month'),
    ])

    return {
      ticker,
      price,
      priceChange: change,
      priceChangePct: changePct,
      open:  +(day.o || price),
      high:  +(day.h || price),
      low:   +(day.l || price),
      volume:    day.v    ? fVol(day.v)    : '—',
      avgVolume: prevDay.v ? fVol(prevDay.v) : '—', // ✅ إصلاح avgVolume
      week52High,
      week52Low,
      marketCap: snap.ticker?.marketCap ? fMcap(snap.ticker.marketCap) : '—',
      pe:   snap.ticker?.pe   ?? null,
      eps:  snap.ticker?.eps  ?? null,
      beta: snap.ticker?.beta ?? null,
      history1M: h1M,
      history3M: h3M,
      history6M: h6M,
      history1Y: h1Y,
    }
  } catch (e) {
    console.error(`Quote error for ${ticker}:`, e)
    return await getQuoteYahoo(ticker)
  }
}

export async function getMultipleQuotes(
  tickers: string[]
): Promise<Record<string, QuoteData>> {
  const results: Record<string, QuoteData> = {}
  await Promise.all(
    tickers.map(async (t) => {
      const q = await getQuote(t)
      if (q) results[t] = q
    })
  )
  return results
}
