export function signalsPrompt(lang: string) {
  const ar = lang === 'ar'
  return `You are a professional US stock market analyst. Generate today's top 8 trading recommendations.
${ar ? 'ALL text fields must be in Arabic.' : 'All text in English.'}
Return ONLY valid JSON matching this exact schema:
{
  "date": "May 4, 2026",
  "marketSummary": {
    "sp500": "+0.8%",
    "nasdaq": "+1.2%",
    "sentiment": "Bullish",
    "vix": "14.2",
    "note": "2-sentence market overview specific to current conditions"
  },
  "signals": [
    {
      "ticker": "NVDA",
      "companyName": "NVIDIA Corporation",
      "sector": "Technology",
      "price": 892.40,
      "priceChangePct": 3.28,
      "signal": "strongBuy",
      "confidence": 88,
      "entry": "$880-895",
      "stopLoss": "$850",
      "target1": "$960",
      "target2": "$1050",
      "timeframe": "1-2 weeks",
      "rsi": 68.4,
      "macd": "Bullish crossover",
      "trend": "Strong uptrend",
      "reasoning": "2-sentence specific reasoning for this trade today",
      "catalyst": "Key near-term catalyst"
    }
  ],
  "topBuy": "NVDA",
  "topSell": "TSLA",
  "watchlist": ["AAPL","MSFT","AMZN"]
}
Rules:
- Include exactly 8 signals: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold
- signal values: strongBuy | buy | hold | sell | strongSell
- confidence: integer 60-95
- Use realistic accurate market data for May 2026
- Make each signal specific and actionable with real price levels`
}

export function analyzePrompt(ticker: string, lang: string) {
  const ar = lang === 'ar'
  return `You are a professional financial analyst. Analyze US stock: ${ticker}
${ar ? 'ALL text fields must be in Arabic.' : 'All text in English.'}
Return ONLY valid JSON matching this schema exactly:
{
  "ticker": "${ticker}",
  "companyName": "Full legal company name",
  "sector": "Technology",
  "industry": "Semiconductors",
  "exchange": "NASDAQ",
  "description": "3-sentence description of business model and competitive position.",
  "price": 892.40,
  "priceChange": 28.30,
  "priceChangePct": 3.28,
  "open": 868.00,
  "high": 897.50,
  "low": 862.10,
  "volume": "42.3M",
  "avgVolume": "38.1M",
  "week52High": 974.0,
  "week52Low": 410.0,
  "marketCap": "$2.19T",
  "beta": 1.68,
  "signal": "buy",
  "confidence": 82,
  "entry": "$880-895",
  "stopLoss": "$850",
  "target1": "$960",
  "target2": "$1050",
  "timeframe": "2-4 weeks",
  "score": 78,
  "scoreBreakdown": { "fundamental": 75, "technical": 82, "sentiment": 78, "momentum": 80 },
  "fundamentals": {
    "revenue": "$60.9B", "revenueGrowth": "+122%", "netIncome": "$29.8B",
    "netMargin": "48.9%", "eps": "$11.93", "epsGrowth": "+168%",
    "pe": 62.1, "forwardPE": 35.4, "peg": 0.37,
    "ebitda": "$33.4B", "freeCashFlow": "$26.9B",
    "debtEquity": 0.42, "currentRatio": 4.17,
    "roe": "91.4%", "roa": "45.2%", "dividendYield": "0.03%"
  },
  "technical": {
    "trend": "Strong uptrend", "rsi": 68.4, "rsiSignal": "Neutral",
    "macd": "Bullish crossover", "macdValue": 12.8,
    "sma20": 850.20, "sma50": 820.50, "sma200": 680.30,
    "bollingerUpper": 920.0, "bollingerLower": 810.0,
    "support1": 850.0, "support2": 820.0, "support3": 780.0,
    "resistance1": 920.0, "resistance2": 974.0, "atr": 28.4, "obv": "Rising"
  },
  "historicalPrices": {
    "1M": [851,862,858,874,869,882,888,875,890,885,892,880,876,885,889,895,891,888,890,892],
    "3M": [750,762,755,778,771,790,810,805,820,815,830,825,845,840,855,862,870,880,888,892],
    "6M": [620,635,628,650,645,670,690,685,710,720,740,750,770,780,800,820,840,865,880,892],
    "1Y": [480,495,510,525,540,530,560,575,590,610,630,620,650,680,700,730,760,800,850,892]
  },
  "analysis": {
    "summary": "4-5 sentence investment thesis specific to ${ticker} with current catalysts.",
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
    "avgTarget": "$980", "highTarget": "$1200", "lowTarget": "$680",
    "consensus": "Strong Buy"
  },
  "competitors": [
    {"ticker":"AMD","name":"Advanced Micro Devices","price":168.40,"marketCap":"$273B","pe":148.2,"signal":"hold","ytd":"-8.4%"},
    {"ticker":"INTC","name":"Intel Corporation","price":21.30,"marketCap":"$91B","pe":null,"signal":"sell","ytd":"-42.1%"},
    {"ticker":"AVGO","name":"Broadcom","price":188.60,"marketCap":"$876B","pe":38.4,"signal":"buy","ytd":"+22.8%"}
  ]
}
Rules:
- signal: strongBuy | buy | hold | sell | strongSell
- score & confidence: integers 0-100
- Use real accurate data for ${ticker}
- historicalPrices arrays must have exactly 20 numbers each`
}
