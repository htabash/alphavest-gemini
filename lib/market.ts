export interface QuoteData {
  ticker: string; price: number; priceChange: number; priceChangePct: number
  open: number; high: number; low: number; volume: string; avgVolume: string
  week52High: number; week52Low: number; marketCap: string
  pe: number | null; eps: number | null; beta: number | null
  history1M: number[]; history3M: number[]; history6M: number[]; history1Y: number[]
}

export interface CommodityData {
  symbol: string; name: string; nameAr: string; unit: string
  price: number; priceChange: number; priceChangePct: number
  open: number; high: number; low: number
  week52High: number; week52Low: number
  history1M: number[]; history3M: number[]
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

// ✅ Twelvedata — جلب السعر الحالي
async function getQuoteTwelvedata(symbol: string): Promise<{
  price: number; change: number; changePct: number
  open: number; high: number; low: number
  volume: string; avgVolume: string
  week52High: number; week52Low: number
} | null> {
  try {
    const key = process.env.TWELVEDATA_API_KEY
    if (!key) return null
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${key}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    if (json.status === 'error' || !json.close) return null
    const price = +json.close
    if (price <= 0) return null
    const prev = +json.previous_close || price
    const change = +(price - prev).toFixed(2)
    const changePct = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0
    return {
      price,
      change,
      changePct,
      open:  +(json.open  || price),
      high:  +(json.high  || price),
      low:   +(json.low   || price),
      volume:    json.volume           ? fVol(+json.volume)           : '—',
      avgVolume: json.average_volume   ? fVol(+json.average_volume)   : '—',
      week52High: +(json.fifty_two_week?.high || 0),
      week52Low:  +(json.fifty_two_week?.low  || 0),
    }
  } catch { return null }
}

// ✅ Twelvedata — جلب التاريخ
async function fetchHistoryTwelvedata(
  symbol: string,
  interval: string,
  outputsize: number
): Promise<number[]> {
  try {
    const key = process.env.TWELVEDATA_API_KEY
    if (!key) return []
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${key}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = await res.json()
    if (json.status === 'error' || !json.values) return []
    const closes = json.values
      .reverse()
      .map((v: { close: string }) => +parseFloat(v.close).toFixed(2))
    if (closes.length <= 20) return closes
    const step = Math.floor(closes.length / 20)
    const sampled = Array.from({ length: 20 }, (_, i) =>
      closes[Math.min(i * step, closes.length - 1)]
    )
    sampled[19] = closes[closes.length - 1]
    return sampled
  } catch { return [] }
}

// ✅ Polygon history — fallback
async function fetchHistory(ticker: string, days: number, multiplier: number, timespan: string): Promise<number[]> {
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
    const sampled = Array.from({ length: 20 }, (_, i) => closes[Math.min(i * step, closes.length - 1)])
    sampled[19] = closes[closes.length - 1]
    return sampled
  } catch { return [] }
}

// ✅ Yahoo Finance — fallback
async function fetchHistoryYahoo(ticker: string, range: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const json = await res.json()
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close as number[]
    if (!closes?.length) return []
    const filtered = closes.filter((c: number) => c != null && !isNaN(c))
    if (filtered.length === 0) return []
    if (filtered.length <= 20) return filtered.map((c: number) => +c.toFixed(2))
    const step = Math.floor(filtered.length / 20)
    const sampled = Array.from({ length: 20 }, (_, i) =>
      +filtered[Math.min(i * step, filtered.length - 1)].toFixed(2)
    )
    sampled[19] = +filtered[filtered.length - 1].toFixed(2)
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
    const prev = +(meta.chartPreviousClose || price)
    const change = +(price - prev).toFixed(2)
    const changePct = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0
    const [h1M, h3M, h6M, h1Y] = await Promise.all([
      fetchHistoryYahoo(ticker, '1mo'),
      fetchHistoryYahoo(ticker, '3mo'),
      fetchHistoryYahoo(ticker, '6mo'),
      fetchHistoryYahoo(ticker, '1y'),
    ])
    return {
      ticker, price, priceChange: change, priceChangePct: changePct,
      open: +(meta.regularMarketOpen || price),
      high: +(meta.regularMarketDayHigh || price),
      low:  +(meta.regularMarketDayLow  || price),
      volume:    meta.regularMarketVolume      ? fVol(meta.regularMarketVolume)      : '—',
      avgVolume: meta.averageDailyVolume3Month ? fVol(meta.averageDailyVolume3Month) : '—',
      week52High: +(meta.fiftyTwoWeekHigh || 0),
      week52Low:  +(meta.fiftyTwoWeekLow  || 0),
      marketCap: meta.marketCap ? fMcap(meta.marketCap) : '—',
      pe: null, eps: null, beta: null,
      history1M: h1M, history3M: h3M, history6M: h6M, history1Y: h1Y,
    }
  } catch { return null }
}

function isPriceValid(price: number): boolean {
  return price > 0.5 && price < 1000000
}

// ✅ getQuote — Twelvedata أولاً ثم Polygon ثم Yahoo
export async function getQuote(ticker: string): Promise<QuoteData | null> {
  try {
    // 1️⃣ Twelvedata
    const td = await getQuoteTwelvedata(ticker)
    if (td && isPriceValid(td.price)) {
      console.log(`[${ticker}] Twelvedata price: ${td.price}`)
      const [h1M, h3M, h6M, h1Y] = await Promise.all([
        fetchHistoryTwelvedata(ticker, '1day',   30).then(r => r.length ? r : fetchHistoryYahoo(ticker, '1mo')),
        fetchHistoryTwelvedata(ticker, '1day',   90).then(r => r.length ? r : fetchHistoryYahoo(ticker, '3mo')),
        fetchHistoryTwelvedata(ticker, '1week',  26).then(r => r.length ? r : fetchHistoryYahoo(ticker, '6mo')),
        fetchHistoryTwelvedata(ticker, '1month', 12).then(r => r.length ? r : fetchHistoryYahoo(ticker, '1y')),
      ])
      return {
        ticker, price: td.price, priceChange: td.change, priceChangePct: td.changePct,
        open: td.open, high: td.high, low: td.low,
        volume: td.volume, avgVolume: td.avgVolume,
        week52High: td.week52High, week52Low: td.week52Low,
        marketCap: '—', pe: null, eps: null, beta: null,
        history1M: h1M, history3M: h3M, history6M: h6M, history1Y: h1Y,
      }
    }

    // 2️⃣ Polygon
    const key = process.env.POLYGON_API_KEY
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${key}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (res.ok) {
      const json = await res.json()
      const snap = json?.ticker
      if (snap) {
        const day = snap.day || {}
        const prevDay = snap.prevDay || {}
        const price = +(day.c || prevDay.c || snap.lastTrade?.p || 0)
        if (isPriceValid(price)) {
          console.log(`[${ticker}] Polygon price: ${price}`)
          const prevClose = +(prevDay.c || price)
          const change    = +(price - prevClose).toFixed(2)
          const changePct = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0
          const [h1M, h3M, h6M, h1Y] = await Promise.all([
            fetchHistory(ticker, 30,  1, 'day').then(r   => r.length ? r : fetchHistoryYahoo(ticker, '1mo')),
            fetchHistory(ticker, 90,  1, 'day').then(r   => r.length ? r : fetchHistoryYahoo(ticker, '3mo')),
            fetchHistory(ticker, 180, 1, 'week').then(r  => r.length ? r : fetchHistoryYahoo(ticker, '6mo')),
            fetchHistory(ticker, 365, 1, 'month').then(r => r.length ? r : fetchHistoryYahoo(ticker, '1y')),
          ])
          return {
            ticker, price, priceChange: change, priceChangePct: changePct,
            open: +(day.o || price), high: +(day.h || price), low: +(day.l || price),
            volume:    day.v     ? fVol(day.v)     : '—',
            avgVolume: prevDay.v ? fVol(prevDay.v) : '—',
            week52High: +(snap.ticker?.day?.h || prevDay.h || 0),
            week52Low:  +(snap.ticker?.day?.l || prevDay.l || 0),
            marketCap: snap.ticker?.marketCap ? fMcap(snap.ticker.marketCap) : '—',
            pe: snap.ticker?.pe ?? null, eps: snap.ticker?.eps ?? null, beta: snap.ticker?.beta ?? null,
            history1M: h1M, history3M: h3M, history6M: h6M, history1Y: h1Y,
          }
        }
      }
    }

    // 3️⃣ Yahoo fallback
    console.log(`[${ticker}] Falling back to Yahoo`)
    return await getQuoteYahoo(ticker)

  } catch (e) {
    console.error(`[${ticker}] Quote exception:`, e)
    return await getQuoteYahoo(ticker)
  }
}

export async function getMultipleQuotes(tickers: string[]): Promise<Record<string, QuoteData>> {
  const results: Record<string, QuoteData> = {}
  await Promise.all(tickers.map(async (t) => {
    const q = await getQuote(t)
    if (q) results[t] = q
  }))
  return results
}

// ✅ قائمة السلع
export const COMMODITIES_LIST = [
  { symbol: 'GC=F',  name: 'Gold',         nameAr: 'الذهب',       unit: 'oz',    category: 'metals', emoji: '🥇' },
  { symbol: 'SI=F',  name: 'Silver',        nameAr: 'الفضة',       unit: 'oz',    category: 'metals', emoji: '🥈' },
  { symbol: 'PL=F',  name: 'Platinum',      nameAr: 'البلاتين',    unit: 'oz',    category: 'metals', emoji: '⚪' },
  { symbol: 'HG=F',  name: 'Copper',        nameAr: 'النحاس',      unit: 'lb',    category: 'metals', emoji: '🟤' },
  { symbol: 'CL=F',  name: 'Crude Oil WTI', nameAr: 'نفط خام WTI', unit: 'bbl',   category: 'energy', emoji: '🛢️' },
  { symbol: 'BZ=F',  name: 'Brent Crude',   nameAr: 'نفط برنت',    unit: 'bbl',   category: 'energy', emoji: '⛽' },
  { symbol: 'NG=F',  name: 'Natural Gas',   nameAr: 'غاز طبيعي',   unit: 'MMBtu', category: 'energy', emoji: '🔥' },
  { symbol: 'ZW=F',  name: 'Wheat',         nameAr: 'القمح',       unit: 'bu',    category: 'agri',   emoji: '🌾' },
  { symbol: 'ZC=F',  name: 'Corn',          nameAr: 'الذرة',       unit: 'bu',    category: 'agri',   emoji: '🌽' },
  { symbol: 'ZS=F',  name: 'Soybeans',      nameAr: 'فول الصويا',  unit: 'bu',    category: 'agri',   emoji: '🫘' },
]

// ✅ Twelvedata رموز السلع المختلفة عن Yahoo
const TD_SYMBOL_MAP: Record<string, string> = {
  'GC=F': 'XAU/USD',
  'SI=F': 'XAG/USD',
  'PL=F': 'XPT/USD',
  'HG=F': 'HG1!',
  'CL=F': 'WTI/USD',
  'BZ=F': 'BRENT/USD',
  'NG=F': 'NG1!',
  'ZW=F': 'WHEAT',
  'ZC=F': 'CORN',
  'ZS=F': 'SOYBEAN',
}

// ✅ جلب سعر سلعة واحدة — Twelvedata أولاً ثم Yahoo
export async function getCommodityQuote(symbol: string): Promise<CommodityData | null> {
  try {
    const info = COMMODITIES_LIST.find(c => c.symbol === symbol)
    if (!info) return null

    // 1️⃣ Twelvedata
    const tdSymbol = TD_SYMBOL_MAP[symbol]
    if (tdSymbol) {
      const td = await getQuoteTwelvedata(tdSymbol)
      if (td && isPriceValid(td.price)) {
        console.log(`[${symbol}] Twelvedata commodity price: ${td.price}`)
        const [h1M, h3M] = await Promise.all([
          fetchHistoryTwelvedata(tdSymbol, '1day', 30).then(r => r.length ? r : fetchHistoryYahoo(symbol, '1mo')),
          fetchHistoryTwelvedata(tdSymbol, '1day', 90).then(r => r.length ? r : fetchHistoryYahoo(symbol, '3mo')),
        ])
        return {
          symbol, name: info.name, nameAr: info.nameAr, unit: info.unit,
          price: td.price, priceChange: td.change, priceChangePct: td.changePct,
          open: td.open, high: td.high, low: td.low,
          week52High: td.week52High, week52Low: td.week52Low,
          history1M: h1M, history3M: h3M,
        }
      }
    }

    // 2️⃣ Yahoo fallback
    console.log(`[${symbol}] Falling back to Yahoo for commodity`)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
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
    const prev = +(meta.chartPreviousClose || price)
    const change = +(price - prev).toFixed(2)
    const changePct = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0
    const [h1M, h3M] = await Promise.all([
      fetchHistoryYahoo(symbol, '1mo'),
      fetchHistoryYahoo(symbol, '3mo'),
    ])
    return {
      symbol, name: info.name, nameAr: info.nameAr, unit: info.unit,
      price, priceChange: change, priceChangePct: changePct,
      open:  +(meta.regularMarketOpen    || price),
      high:  +(meta.regularMarketDayHigh || price),
      low:   +(meta.regularMarketDayLow  || price),
      week52High: +(meta.fiftyTwoWeekHigh || 0),
      week52Low:  +(meta.fiftyTwoWeekLow  || 0),
      history1M: h1M, history3M: h3M,
    }
  } catch { return null }
}

export async function getAllCommodities(): Promise<CommodityData[]> {
  const results = await Promise.all(COMMODITIES_LIST.map(c => getCommodityQuote(c.symbol)))
  return results.filter(Boolean) as CommodityData[]
}
