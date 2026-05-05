export interface QuoteData {
  ticker: string; price: number; priceChange: number; priceChangePct: number
  open: number; high: number; low: number; volume: string; avgVolume: string
  week52High: number; week52Low: number; marketCap: string
  pe: number | null; eps: number | null; beta: number | null
  history1M: number[]; history3M: number[]; history6M: number[]; history1Y: number[]
}

function fMcap(v: number): string {
  if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`
  return `$${(v/1e6).toFixed(1)}M`
}

function fVol(v: number): string {
  if (v >= 1e9) return `${(v/1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`
  return `${(v/1e3).toFixed(1)}K`
}

async function fetchHistory(ticker: string, range: string, interval: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return []
    const json = await res.json()
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const filtered = closes.filter((v: number | null) => v !== null)
    if (filtered.length <= 20) return filtered.map((v: number) => +v.toFixed(2))
    const step = Math.floor(filtered.length / 20)
    const sampled = Array.from({length: 20}, (_, i) => +filtered[Math.min(i * step, filtered.length-1)].toFixed(2))
    sampled[19] = +filtered[filtered.length-1].toFixed(2)
    return sampled
  } catch { return [] }
}

export async function getQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,averageDailyVolume3Month,fiftyTwoWeekHigh,fiftyTwoWeekLow,marketCap,trailingPE,epsTrailingTwelveMonths,beta`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    const q = json?.quoteResponse?.result?.[0]
    if (!q) return null

    const price = +(q.regularMarketPrice || 0)
    const change = +(q.regularMarketChange?.toFixed(2) || 0)
    const changePct = +(q.regularMarketChangePercent?.toFixed(2) || 0)

    const [h1M, h3M, h6M, h1Y] = await Promise.all([
      fetchHistory(ticker, '1mo', '1d'),
      fetchHistory(ticker, '3mo', '1wk'),
      fetchHistory(ticker, '6mo', '1wk'),
      fetchHistory(ticker, '1y', '1mo'),
    ])

    return {
      ticker,
      price,
      priceChange: change,
      priceChangePct: changePct,
      open: +(q.regularMarketOpen || price),
      high: +(q.regularMarketDayHigh || price),
      low: +(q.regularMarketDayLow || price),
      volume: q.regularMarketVolume ? fVol(q.regularMarketVolume) : '—',
      avgVolume: q.averageDailyVolume3Month ? fVol(q.averageDailyVolume3Month) : '—',
      week52High: +(q.fiftyTwoWeekHigh || 0),
      week52Low: +(q.fiftyTwoWeekLow || 0),
      marketCap: q.marketCap ? fMcap(q.marketCap) : '—',
      pe: q.trailingPE ? +q.trailingPE.toFixed(1) : null,
      eps: q.epsTrailingTwelveMonths ? +q.epsTrailingTwelveMonths.toFixed(2) : null,
      beta: q.beta ? +q.beta.toFixed(2) : null,
      history1M: h1M,
      history3M: h3M,
      history6M: h6M,
      history1Y: h1Y,
    }
  } catch (e) {
    console.error(`Quote error for ${ticker}:`, e)
    return null
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
