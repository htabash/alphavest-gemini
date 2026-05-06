function fmt(n: number): string {
  return `$${Math.round(n)}`
}

export function signalsPrompt(lang: string, priceContext?: string) {
  const ar = lang === 'ar'
  const prices = priceContext
    ? `\nCURRENT REAL PRICES (use these EXACTLY for all calculations): ${priceContext}`
    : ''

  return `You are a professional US stock market analyst for May 2026. Generate today's top 8 trading recommendations.
${ar ? 'ALL text fields must be in Arabic.' : 'All text in English.'}
Return ONLY valid JSON matching this exact schema:
{
  "date": "May 6, 2026",
  "marketSummary": {
    "sp500": "+0.8%",
    "nasdaq": "+1.2%",
    "sentiment": "Bullish",
    "vix": "14.2",
    "note": "2-sentence market overview for current May 2026 conditions"
  },
  "signals": [
    {
      "ticker": "ANY_US_TICKER",
      "companyName": "Full company name",
      "sector": "Sector name",
      "price": 196.50,
      "priceChangePct": -0.96,
      "signal": "strongBuy",
      "confidence": 88,
      "entry": "$193-198",
      "stopLoss": "$185",
      "target1": "$215",
      "target2": "$235",
      "timeframe": "1-2 weeks",
      "rsi": 52.4,
      "macd": "Bullish crossover",
      "trend": "Uptrend",
      "reasoning": "2-sentence specific reasoning for this trade today",
      "catalyst": "Key near-term catalyst"
    }
  ],
  "topBuy": "BEST_BUY_TICKER",
  "topSell": "BEST_SELL_TICKER",
  "watchlist": ["TICKER1","TICKER2","TICKER3"]
}
CRITICAL RULES:
- VARIETY IS MANDATORY: Choose DIFFERENT stocks each time. Rotate from this full list: NVDA, AAPL, MSFT, TSLA, AMZN, META, GOOGL, JPM, AMAT, AMD, NFLX, CRM, UBER, COIN, PLTR, ARM, INTC, SHOP, SQ, PYPL, DIS, BA, GS, V, MA, WMT, HD, ORCL, ADBE, QCOM, MU, SMCI, DELL, HPE, PANW, CRWD, SNOW, DDOG, ZS
- Do NOT always pick NVDA, AAPL, MSFT, TSLA — rotate broadly
- Every signal MUST have entry, stopLoss, target1, target2 — never null or "-"
- ALL price fields must be REAL DOLLAR NUMBERS — NEVER formulas like "price*0.97"
- CRITICAL: Entry MUST be within 5% of the current price provided
- If AAPL=$286, entry MUST be between $272-$300, NOT $194 or any other distant value
- If TSLA=$398, entry MUST be between $378-$418, NOT any other range
- Double-check EVERY entry against the current price before returning
- entry format: "$193-198" — must be within 2-3% of current price
- stopLoss: 3-6% below current for buys, 3-6% above for sells
- target1: 8-12% from current price
- target2: 15-20% from current price
- Include exactly 8 signals: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold
- signal values: strongBuy | buy | hold | sell | strongSell
- confidence: integer 60-95
- timeframe: always a value like "1-2 weeks" or "2-3 weeks"
- If signal is sell/strongSell: entry must be ABOVE current price, target BELOW current price
- NEVER return formulas — ALL values must be computed real numbers
${prices}`
}

export function analyzePrompt(ticker: string, lang: string, price?: number) {
  const ar = lang === 'ar'
  const p = price && price > 0 ? price : null
  const priceHint = p
    ? `Current real market price: $${p}. Base ALL price levels on this exact number.`
    : `Use the real current May 2026 market price for ${ticker}.`

  const entryLow  = p ? Math.round(p * 0.97)  : '[currentPrice * 0.97 as integer]'
  const entryHigh = p ? Math.round(p * 1.01)  : '[currentPrice * 1.01 as integer]'
  const stopVal   = p ? Math.round(p * 0.94)  : '[currentPrice * 0.94 as integer]'
  const t1Val     = p ? Math.round(p * 1.10)  : '[currentPrice * 1.10 as integer]'
  const t2Val     = p ? Math.round(p * 1.18)  : '[currentPrice * 1.18 as integer]'
  const sma20     = p ? Math.round(p * 0.98)  : '[estimate]'
  const sma50     = p ? Math.round(p * 0.95)  : '[estimate]'
  const sma200    = p ? Math.round(p * 0.80)  : '[estimate]'
  const bUpper    = p ? Math.round(p * 1.07)  : '[estimate]'
  const bLower    = p ? Math.round(p * 0.93)  : '[estimate]'
  const sup1      = p ? Math.round(p * 0.97)  : '[estimate]'
  const sup2      = p ? Math.round(p * 0.94)  : '[estimate]'
  const sup3      = p ? Math.round(p * 0.90)  : '[estimate]'
  const res1      = p ? Math.round(p * 1.05)  : '[estimate]'
  const res2      = p ? Math.round(p * 1.10)  : '[estimate]'
  const w52High   = p ? Math.round(p * 1.25)  : '[estimate]'
  const w52Low    = p ? Math.round(p * 0.60)  : '[estimate]'

  return `You are a professional financial analyst. Analyze US stock: ${ticker}
${ar ? 'ALL text fields must be in Arabic.' : 'All text in English.'}
${priceHint}

CRITICAL: Return ONLY valid JSON. NO formulas, NO expressions, ONLY real numeric values.

{
  "ticker": "${ticker}",
  "companyName": "Full legal company name",
  "sector": "Technology",
  "industry": "Semiconductors",
  "exchange": "NASDAQ",
  "description": "3-sentence description of business model and competitive position.",
  "price": ${p || 0},
  "priceChange": -1.90,
  "priceChangePct": -0.96,
  "open": ${p || 0},
  "high": ${p ? Math.round(p * 1.02) : 0},
  "low": ${p ? Math.round(p * 0.98) : 0},
  "volume": "109.9M",
  "avgVolume": "245.0M",
  "week52High": ${w52High},
  "week52Low": ${w52Low},
  "marketCap": "use real market cap",
  "beta": 1.68,
  "signal": "buy",
  "confidence": 82,
  "entry": "$${entryLow}-${entryHigh}",
  "stopLoss": "$${stopVal}",
  "target1": "$${t1Val}",
  "target2": "$${t2Val}",
  "timeframe": "2-4 weeks",
  "score": 78,
  "scoreBreakdown": { "fundamental": 75, "technical": 82, "sentiment": 78, "momentum": 80 },
  "fundamentals": {
    "revenue": "real revenue figure",
    "revenueGrowth": "real YoY growth%",
    "netIncome": "real net income",
    "netMargin": "real margin%",
    "eps": "real EPS",
    "epsGrowth": "real EPS growth%",
    "pe": 36.2,
    "forwardPE": 28.4,
    "peg": 0.37,
    "ebitda": "real EBITDA",
    "freeCashFlow": "real FCF",
    "debtEquity": 0.42,
    "currentRatio": 4.17,
    "roe": "real ROE%",
    "roa": "real ROA%",
    "dividendYield": "real yield% or N/A"
  },
  "technical": {
    "trend": "Uptrend",
    "rsi": 52.4,
    "rsiSignal": "Neutral",
    "macd": "Bullish",
    "macdValue": 2.8,
    "sma20": ${sma20},
    "sma50": ${sma50},
    "sma200": ${sma200},
    "bollingerUpper": ${bUpper},
    "bollingerLower": ${bLower},
    "support1": ${sup1},
    "support2": ${sup2},
    "support3": ${sup3},
    "resistance1": ${res1},
    "resistance2": ${res2},
    "atr": 5.4,
    "obv": "Rising"
  },
  "analysis": {
    "summary": "4-5 sentence investment thesis specific to ${ticker} with current May 2026 catalysts.",
    "bullish": ["Specific bullish factor 1","Specific bullish factor 2","Specific bullish factor 3","Specific bullish factor 4"],
    "bearish": ["Specific risk 1","Specific risk 2","Specific risk 3"],
    "catalysts": ["Near-term catalyst 1","Near-term catalyst 2"]
  },
  "news": [
    {"headline":"Specific recent headline for ${ticker}","source":"Reuters","time":"2h ago","sentiment":"positive"},
    {"headline":"Second relevant headline","source":"Bloomberg","time":"5h ago","sentiment":"neutral"},
    {"headline":"Third headline","source":"WSJ","time":"1d ago","sentiment":"positive"},
    {"headline":"Fourth headline","source":"CNBC","time":"2d ago","sentiment":"negative"}
  ],
  "analystRatings": {
    "buy": 28, "hold": 8, "sell": 2,
    "avgTarget": "$${t1Val}",
    "highTarget": "$${t2Val}",
    "lowTarget": "$${stopVal}",
    "consensus": "Strong Buy"
  },
  "competitors": [
    {"ticker":"COMP1","name":"Competitor 1","price":108.40,"marketCap":"$175B","pe":48.2,"signal":"hold","ytd":"-8.4%"},
    {"ticker":"COMP2","name":"Competitor 2","price":21.30,"marketCap":"$91B","pe":null,"signal":"sell","ytd":"-42.1%"},
    {"ticker":"COMP3","name":"Competitor 3","price":188.60,"marketCap":"$876B","pe":38.4,"signal":"buy","ytd":"+22.8%"}
  ]
}

FINAL RULES:
- signal: strongBuy | buy | hold | sell | strongSell only
- score & confidence: integers 0-100
- ALL numeric fields: real numbers only, zero formulas or expressions
- Use REAL accurate fundamental data for ${ticker}
- historicalPrices not included — provided separately from market data API`
}
