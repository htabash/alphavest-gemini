// eslint-disable-next-line @typescript-eslint/no-require-imports
const yahooFinance = require('yahoo-finance2').default

export interface QuoteData {
  ticker: string; price: number; priceChange: number; priceChangePct: number
  open: number; high: number; low: number; volume: string; avgVolume: string
  week52High: number; week52Low: number; marketCap: string
  pe: number | null; eps: number | null; beta: number | null
}

function fMcap(v: number | undefined): string {
  if (!v) return '—'
  if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`
  return `$${(v/1e6).toFixed(1)}M`
}

function fVol(v: number | undefined): string {
  if (!v) return '—'
  if (v >= 1e9) return `${(v/1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`
  return `${(v/1e3).toFixed(1)}K`
}

export async function getQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const q = await yahooFinance.quote(ticker)
    if (!q) return null
    return {
      ticker: q.symbol || ticker,
      price: +(q.regularMarketPrice || 0),
      priceChange: +(q.regularMarketChange?.toFixed(2) || 0),
      priceChangePct: +(q.regularMarketChangePercent?.toFixed(2) || 0),
      open: +(q.regularMarketOpen || 0),
      high: +(q.regularMarketDayHigh || 0),
      low: +(q.regularMarketDayLow || 0),
      volume: fVol(q.regularMarketVolume),
      avgVolume: fVol(q.averageDailyVolume3Month),
      week52High: +(q.fiftyTwoWeekHigh || 0),
      week52Low: +(q.fiftyTwoWeekLow || 0),
      marketCap: fMcap(q.marketCap),
      pe: q.trailingPE ? +q.trailingPE.toFixed(1) : null,
      eps: q.epsTrailingTwelveMonths ? +q.epsTrailingTwelveMonths.toFixed(2) : null,
      beta: q.beta ? +q.beta.toFixed(2) : null,
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
