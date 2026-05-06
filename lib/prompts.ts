export function signalsPrompt(lang: string, priceContext?: string) {
  const ar = lang === 'ar'
  const prices = priceContext ? `\nCURRENT REAL PRICES (use these EXACTLY for entry/stop/target calculations): ${priceContext}` : ''
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
- Do NOT always pick NVDA, AAPL, MSFT, TSLA — these should not appear every single day
- Every signal MUST have entry, stopLoss, target1, target2 — never use null or "-"
- Entry must be within 2-3% of current price
- StopLoss must be 3-6% below current price for buys, 3-6% above for sells
- Target1 must be 8-12% from current price
- Target2 must be 15-20% from current price
- Include exactly 8 signals: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold
- signal values: strongBuy | buy | hold | sell | strongSell
- confidence: integer 60-95
- timeframe: must always have a value like "1-2 weeks" or "2-3 weeks"
${prices}`
}

export function analyzePrompt(ticker: string, lang: string, price?: number) {
  const ar = lang === 'ar'
  const priceHint = price ? `Current real market price: $${price}. Base ALL price levels on this.` : 'Use current May 2026 real market price.'
  const entryLow = price ? Math.round(price * 0.97) : 'price*0.97'
  const entryHigh = price ? Math.round(price * 1.01) : 'price*1.01'
  const stopVal = price ? Math.round(price * 0.94) : 'price*0.94'
  const t1Val = price ? Math.round(price * 1.10) : 'price*1.10'
  const t2Val = price ? Math.round(price * 1.18) : 'price*1.18'
  return `You are a professional financial analyst. Analyze US stock: ${ticker}
${ar ? 'ALL text fields must be in Arabic.' : 'All text in English.'}
${priceHint}
Return ONLY valid JSON matching this schema exactly:
{
  "ticker": "${ticker}",
  "companyName": "Full legal company name",
  "sector": "Technology",
  "industry": "Semiconductors",
  "exchange": "NASDAQ",
  "description": "3-sentence description of business model and competitive position.",
  "price": ${price || 196.50},
  "priceChange": -1.90,
  "priceChangePct": -0.96,
  "open": ${price || 197.20},
  "high": ${price ? Math.round(price * 1.02) : 200.24},
  "low": ${price ? Math.round(price * 0.98) : 196.03},
  "volume": "109.9M",
  "avgVolume": "245.0M",
  "week52High": ${price ? Math.round(price * 1.25) : 216.83},
  "week52Low": ${price ? Math.round(price * 0.60) : 110.82},
  "marketCap": "$478B",
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
    "revenue": "real revenue", "revenueGrowth": "real growth%", "netIncome": "real net income",
    "netMargin": "real margin%", "eps": "real EPS", "epsGrowth": "real EPS growth%",
    "pe": 36.2, "forwardPE": 28.4, "peg": 0.37,
    "ebitda": "real EBITDA", "freeCashFlow": "real FCF",
    "debtEquity": 0.42, "currentRatio": 4.17,
    "roe": "real ROE%", "roa": "real ROA%", "dividendYield": "real yield%"
  },
  "technical": {
    "trend": "Uptrend", "rsi": 52.4, "rsiSignal": "Neutral",
    "macd": "Bullish", "macdValue": 2.8,
    "sma20": ${price ? Math.round(price * 0.98) : 192},
    "sma50": ${price ? Math.round(price * 0.95) : 185},
    "sma200": ${price ? Math.round(price * 0.80) : 155},
    "bollingerUpper": ${price ? Math.round(price * 1.07) : 210},
    "bollingerLower": ${price ? Math.round(price * 0.93) : 180},
    "support1": ${price ? Math.round(price * 0.97) : 190},
    "support2": ${price ? Math.round(price * 0.94) : 185},
    "support3": ${price ? Math.round(price * 0.90) : 175},
    "resistance1": ${price ? Math.round(price * 1.05) : 205},
    "resistance2": ${price ? Math.round(price * 1.10) : 216},
    "atr": 5.4, "obv": "Rising"
  },
  "historicalPrices": {
    "1M": [${price ? Array.from({length:20},(_,i)=>Math.round(price*(0.90+i*0.005))).join(',') : '183,185,182,187,186,190,192,189,194,193,196,194,191,195,197,199,198,196,197,196'}],
    "3M": [${price ? Array.from({length:20},(_,i)=>Math.round(price*(0.80+i*0.01))).join(',') : '155,158,154,162,160,165,170,168,175,173,180,178,185,183,190,194,196,198,197,196'}],
    "6M": [${price ? Array.from({length:20},(_,i)=>Math.round(price*(0.65+i*0.018))).join(',') : '125,128,124,132,130,138,145,143,152,150,160,158,168,165,175,183,190,195,197,196'}],
    "1Y": [${price ? Array.from({length:20},(_,i)=>Math.round(price*(0.55+i*0.023))).join(',') : '110,113,111,118,116,122,130,128,138,136,148,145,158,155,168,178,188,194,197,196'}]
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
    "avgTarget": "$${t1Val}", "highTarget": "$${t2Val}", "lowTarget": "$${stopVal}",
    "consensus": "Strong Buy"
  },
  "competitors": [
    {"ticker":"COMP1","name":"Competitor 1","price":108.40,"marketCap":"$175B","pe":48.2,"signal":"hold","ytd":"-8.4%"},
    {"ticker":"COMP2","name":"Competitor 2","price":21.30,"marketCap":"$91B","pe":null,"signal":"sell","ytd":"-42.1%"},
    {"ticker":"COMP3","name":"Competitor 3","price":188.60,"marketCap":"$876B","pe":38.4,"signal":"buy","ytd":"+22.8%"}
  ]
}
CRITICAL:
- signal: strongBuy | buy | hold | sell | strongSell
- score & confidence: integers 0-100
- historicalPrices: exactly 20 numbers each, ending near current price $${price || 'current'}
- Use REAL accurate fundamental data for ${ticker}`
}
