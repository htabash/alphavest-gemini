export interface QuoteData {
  ticker: string; price: number; priceChange: number; priceChangePct: number
  open: number; high: number; low: number; volume: string; avgVolume: string
  week52High: number; week52Low: number; marketCap: string
  pe: number | null; eps: number | null; beta: number | null
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

export async function getQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = +(meta.regularMarketPrice || 0)
    const prev = +(meta.chartPreviousClose || meta.previousClose || price)
    const change = +(price - prev).toFixed(2)
    const changePct = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0
    return {
      ticker,
      price,
      priceChange: change,
      priceChangePct: changePct,
      open: +(meta.regularMarketOpen || price),
      high: +(meta.regularMarketDayHigh || price),
      low: +(meta.regularMarketDayLow || price),
      volume: meta.regularMarketVolume ? fVol(meta.regularMarketVolume) : '—',
      avgVolume: '—',
      week52High: +(meta.fiftyTwoWeekHigh || 0),
      week52Low: +(meta.fiftyTwoWeekLow || 0),
      marketCap: meta.marketCap ? fMcap(meta.marketCap) : '—',
      pe: null,
      eps: null,
      beta: null,
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
