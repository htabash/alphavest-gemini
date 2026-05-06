export function signalsPrompt(lang: string, priceContext?: string) {
  const ar = lang === 'ar'
  const prices = priceContext
    ? `\nCURRENT REAL PRICES (use these EXACTLY for all calculations): ${priceContext}`
    : ''

  return `You are a professional US stock market analyst for May 2026. Generate today's top 12 trading recommendations across all major sectors.
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
      "reasoning": "2-sentence reasoning mentioning current price action, key technical level or catalyst, and why NOW is the right time",
      "catalyst": "Key near-term catalyst"
    }
  ],
  "topBuy": "BEST_BUY_TICKER",
  "topSell": "BEST_SELL_TICKER",
  "watchlist": ["TICKER1","TICKER2","TICKER3","TICKER4","TICKER5"]
}

SECTOR DISTRIBUTION — MANDATORY 12 signals:
- Technology (3 signals): NVDA, AAPL, MSFT, GOOGL, META, AMD, AMAT, INTC, PLTR, ARM, CRM, ORCL, ADBE, CRWD, PANW, SNOW, DDOG, NET, ZS, QCOM, MU
- Financials (2 signals): JPM, GS, MS, V, MA, BAC, WFC, PYPL, SQ, COIN, BLK, AXP, C, COF, SCHW
- Energy (1 signal): XOM, CVX, COP, SLB, EOG, MPC, PSX, VLO, OXY
- Healthcare (2 signals): LLY, UNH, JNJ, ABBV, MRK, PFE, TMO, AMGN, GILD, ISRG, VRTX, REGN
- Consumer Discretionary (2 signals): TSLA, AMZN, HD, LOW, MCD, SBUX, NKE, COST, TGT, DIS, NFLX
- Industrials (1 signal): BA, CAT, DE, GE, HON, UPS, FDX, RTX, LMT
- Other/Mixed (1 signal): WMT, PG, KO, PEP, UBER, SHOP, ABNB

SIGNAL MIX: 6-7 buy/strongBuy, 2-3 sell/strongSell, 1-2 hold

CRITICAL RULES:
- VARIETY IS MANDATORY: Choose DIFFERENT stocks each time — rotate broadly
- Do NOT repeat same tickers across consecutive days
- Every signal MUST have entry, stopLoss, target1, target2 — never null or "-"
- ALL price fields must be REAL DOLLAR NUMBERS — NEVER formulas like "price*0.97"
- CRITICAL: Entry MUST be within 5% of the current price provided
- Double-check EVERY entry against the current price before returning
- entry format: "$193-198" — must be within 2-3% of current price
- stopLoss: 3-6% below current for buys, 3-6% above for sells
- target1: 8-12% from current price
- target2: 15-20% from current price
- signal values: strongBuy | buy | hold | sell | strongSell
- confidence: integer 60-95
- timeframe: always a value like "1-2 weeks" or "2-3 weeks"
- If signal is sell/strongSell: entry ABOVE current price, target BELOW current price
- NEVER return formulas — ALL values must be computed real numbers

COMPANY NAMES — MUST BE EXACT:
- CVNA = Carvana Co. (online used car marketplace) NOT Camping World
- COIN = Coinbase Global, Inc.
- PLTR = Palantir Technologies Inc.
- SNOW = Snowflake Inc.
- CRWD = CrowdStrike Holdings, Inc.
- DDOG = Datadog, Inc.
- UBER = Uber Technologies, Inc.
- SHOP = Shopify Inc.
- Always verify ticker → company name mapping before returning

REASONING QUALITY RULES:
- BAD: "Stock has strong fundamentals and growing demand making it attractive"
- GOOD: "NVDA broke above $205 resistance on 3x average volume; RSI at 58 with room to run before overbought. Upcoming GTC conference is a near-term catalyst for momentum continuation"
- Each reasoning MUST mention: specific price level OR indicator value OR recent event
- reasoning must explain WHY NOW — not just why the stock is good in general
- Every reasoning must be unique — no copy-paste between signals
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

  const competitorMap: Record<string, string> = {
    NVDA: 'For NVDA use competitors: AMD, INTC, QCOM',
    AAPL: 'For AAPL use competitors: MSFT, GOOGL, DELL',
    MSFT: 'For MSFT use competitors: GOOGL, AAPL, CRM',
    TSLA: 'For TSLA use competitors: RIVN, GM, F',
    AMZN: 'For AMZN use competitors: MSFT, GOOGL, WMT',
    META: 'For META use competitors: GOOGL, SNAP, PINS',
    GOOGL: 'For GOOGL use competitors: MSFT, META, AMZN',
    JPM: 'For JPM use competitors: BAC, WFC, GS',
    AMD: 'For AMD use competitors: NVDA, INTC, QCOM',
    NFLX: 'For NFLX use competitors: DIS, PARA, WBD',
    GS: 'For GS use competitors: MS, JPM, BAC',
    V: 'For V use competitors: MA, PYPL, AXP',
    MA: 'For MA use competitors: V, PYPL, AXP',
    CRM: 'For CRM use competitors: MSFT, ORCL, SAP',
    COIN: 'For COIN use competitors: HOOD, SQ, MSTR',
  }
  const competitorHint = competitorMap[ticker] || `Use 3 real direct competitors for ${ticker} with accurate tickers`

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
  "marketCap": "use real market cap formatted like $2.1T or $175B",
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
    "summary": "4-5 sentence investment thesis specific to ${ticker} with current May 2026 catalysts and recent price action.",
    "bullish": ["Specific bullish factor with data point","Specific bullish factor 2","Specific bullish factor 3","Specific bullish factor 4"],
    "bearish": ["Specific risk with context","Specific risk 2","Specific risk 3"],
    "catalysts": ["Specific near-term catalyst with date or event","Second catalyst"]
  },
  "news": [
    {"headline":"Specific unique recent headline about ${ticker}","source":"Reuters","time":"2h ago","sentiment":"positive"},
    {"headline":"Different second headline about ${ticker} earnings or products","source":"Bloomberg","time":"5h ago","sentiment":"neutral"},
    {"headline":"Third unique headline about ${ticker} partnerships or growth","source":"WSJ","time":"1d ago","sentiment":"positive"},
    {"headline":"Fourth headline about ${ticker} risks or competition","source":"CNBC","time":"2d ago","sentiment":"negative"}
  ],
  "analystRatings": {
    "buy": 28, "hold": 8, "sell": 2,
    "avgTarget": "$${t1Val}",
    "highTarget": "$${t2Val}",
    "lowTarget": "$${stopVal}",
    "consensus": "Strong Buy"
  },
  "competitors": [
    {"ticker":"REAL_TICKER_1","name":"Real Competitor 1 Full Name","price":108.40,"marketCap":"$175B","pe":48.2,"signal":"hold","ytd":"-8.4%"},
    {"ticker":"REAL_TICKER_2","name":"Real Competitor 2 Full Name","price":21.30,"marketCap":"$91B","pe":null,"signal":"sell","ytd":"-42.1%"},
    {"ticker":"REAL_TICKER_3","name":"Real Competitor 3 Full Name","price":188.60,"marketCap":"$876B","pe":38.4,"signal":"buy","ytd":"+22.8%"}
  ]
}

COMPETITORS RULES:
- ${competitorHint}
- NEVER use COMP1, COMP2, COMP3 — always use real tickers
- marketCap must be formatted as string like "$175B" or "$2.1T" — NEVER raw numbers
- price must be approximate real market price
- ytd must be realistic percentage

NEWS RULES:
- Each headline must be UNIQUE and DIFFERENT — no repetition
- Headlines must be specific to ${ticker} — not generic
- Do NOT repeat the same sentence structure for all 4 headlines

FINAL RULES:
- signal: strongBuy | buy | hold | sell | strongSell only
- score & confidence: integers 0-100
- ALL numeric fields: real numbers only, zero formulas or expressions
- Use REAL accurate fundamental data for ${ticker}
- companyName must exactly match the ticker
- historicalPrices not included — provided separately from market data API`
}
