const EXCHANGE_MAP: Record<string, string> = {
  NVDA:'NASDAQ', AAPL:'NASDAQ', MSFT:'NASDAQ', META:'NASDAQ',
  GOOGL:'NASDAQ', AMZN:'NASDAQ', TSLA:'NASDAQ', AMD:'NASDAQ',
  INTC:'NASDAQ', QCOM:'NASDAQ', PLTR:'NASDAQ', ARM:'NASDAQ',
  AVGO:'NASDAQ', MU:'NASDAQ', AMAT:'NASDAQ', LRCX:'NASDAQ',
  KLAC:'NASDAQ', MRVL:'NASDAQ', CRM:'NYSE', ORCL:'NYSE',
  ADBE:'NASDAQ', NOW:'NYSE', INTU:'NASDAQ', DDOG:'NASDAQ',
  SNOW:'NYSE', ZS:'NASDAQ', CRWD:'NASDAQ', PANW:'NASDAQ',
  NET:'NYSE', SHOP:'NYSE', UBER:'NYSE', COIN:'NASDAQ',
  SQ:'NYSE', PYPL:'NASDAQ', JPM:'NYSE', GS:'NYSE',
  MS:'NYSE', BAC:'NYSE', WFC:'NYSE', V:'NYSE', MA:'NYSE',
  AXP:'NYSE', BLK:'NYSE', C:'NYSE', COF:'NYSE', SCHW:'NYSE',
  XOM:'NYSE', CVX:'NYSE', COP:'NYSE', SLB:'NYSE', EOG:'NYSE',
  MPC:'NYSE', PSX:'NYSE', VLO:'NYSE', OXY:'NYSE',
  LLY:'NYSE', UNH:'NYSE', JNJ:'NYSE', ABBV:'NYSE', MRK:'NYSE',
  PFE:'NYSE', TMO:'NYSE', ABT:'NYSE', AMGN:'NASDAQ', GILD:'NASDAQ',
  ISRG:'NASDAQ', VRTX:'NASDAQ', REGN:'NASDAQ',
  WMT:'NYSE', COST:'NASDAQ', TGT:'NYSE', HD:'NYSE', LOW:'NYSE',
  MCD:'NYSE', SBUX:'NASDAQ', NKE:'NYSE', DIS:'NYSE', NFLX:'NASDAQ',
  PG:'NYSE', KO:'NYSE', PEP:'NASDAQ',
  BA:'NYSE', CAT:'NYSE', DE:'NYSE', GE:'NYSE', HON:'NASDAQ',
  UPS:'NYSE', FDX:'NYSE', RTX:'NYSE', LMT:'NYSE',
  RIVN:'NASDAQ', SOFI:'NASDAQ', HOOD:'NASDAQ', RBLX:'NYSE',
  ABNB:'NASDAQ', DASH:'NYSE', CVNA:'NYSE', DKNG:'NASDAQ',
}

export function signalsPrompt(lang: string, priceContext?: string) {
  const ar = lang === 'ar'
  const prices = priceContext
    ? `\nCURRENT REAL PRICES (use these EXACTLY for all calculations): ${priceContext}`
    : ''

  return `You are a professional US stock market analyst for May 2026. Generate today's top 8 trading recommendations.
${ar ? 'LANGUAGE: Write reasoning, catalyst, companyName, and note fields IN ARABIC. All other fields in English.' : 'LANGUAGE: All text in English.'}

Return ONLY valid JSON — no placeholders, no template text, generate real content:
{
  "date": "May 6, 2026",
  "marketSummary": {
    "sp500": "+0.8%",
    "nasdaq": "+1.2%",
    "sentiment": "${ar ? 'صعودي' : 'Bullish'}",
    "vix": "14.2",
    "note": "${ar ? 'اكتب جملتين حقيقيتين عن وضع السوق الأمريكي في مايو 2026 بالعربية الفصحى' : 'Write 2 real sentences about US market conditions in May 2026'}"
  },
  "signals": [
    {
      "ticker": "REAL_TICKER",
      "companyName": "${ar ? 'اكتب الاسم الكامل الحقيقي للشركة بالعربية' : 'Write the real full company name'}",
      "sector": "Technology",
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
      "reasoning": "${ar ? 'اكتب جملتين حقيقيتين بالعربية تذكر فيهما مستوى سعري محدد وسبب التوصية الآن' : 'Write 2 real sentences mentioning a specific price level and why to trade NOW'}",
      "catalyst": "${ar ? 'اكتب المحفز الرئيسي الحقيقي للسهم بالعربية' : 'Write the real key catalyst for this stock'}"
    }
  ],
  "topBuy": "BEST_BUY_TICKER",
  "topSell": "BEST_SELL_TICKER",
  "watchlist": ["TICKER1","TICKER2","TICKER3","TICKER4","TICKER5"]
}

SECTOR DISTRIBUTION — MANDATORY exactly 8 signals:
- Technology (2 signals): NVDA, AAPL, MSFT, GOOGL, META, AMD, AMAT, PLTR, ARM, CRM, ADBE, CRWD, PANW
- Financials (1 signal): JPM, GS, MS, V, MA, BAC, PYPL, COIN
- Energy (1 signal): XOM, CVX, COP, SLB, EOG
- Healthcare (1 signal): LLY, UNH, JNJ, ABBV, MRK, AMGN, REGN
- Consumer Discretionary (1 signal): TSLA, AMZN, HD, MCD, SBUX, NKE, NFLX
- Industrials (1 signal): BA, CAT, GE, HON, UPS, RTX
- Other (1 signal): WMT, PG, KO, UBER, SHOP

SIGNAL MIX: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold

CRITICAL RULES:
- NEVER use placeholder text like "اكتب..." or "Write..." — generate real content
- NEVER repeat the same ticker twice in signals array
- VARIETY: rotate different stocks each day
- ALL price fields: real dollar numbers only — no formulas
- Entry within 5% of current price
- entry format: "$193-198"
- stopLoss: 3-6% below for buys, 3-6% above for sells
- target1: 8-12% from current price
- target2: 15-20% from current price
- signal: strongBuy | buy | hold | sell | strongSell
- confidence: integer 60-95
- timeframe: "1-2 weeks" or "2-3 weeks"
- sell/strongSell: entry ABOVE price, target BELOW price

SECTOR RULES — CRITICAL:
- sector field: ALWAYS in English — NEVER Arabic
- NVDA/AAPL/MSFT/GOOGL/META/AMD/CRM/PLTR → "Technology"
- JPM/GS/V/MA/BAC/COIN/PYPL → "Financials"
- XOM/CVX/COP/SLB/EOG → "Energy"
- LLY/UNH/JNJ/ABBV/MRK/AMGN → "Healthcare"
- TSLA/AMZN/HD/MCD/NFLX/SBUX/NKE → "Consumer Discretionary"
- BA/CAT/GE/HON/UPS/RTX → "Industrials"
- WMT/PG/KO/UBER/SHOP → "Other"

COMPANY NAMES — EXACT:
- CVNA = Carvana Co.
- COIN = Coinbase Global, Inc.
- PLTR = Palantir Technologies Inc.
- CRWD = CrowdStrike Holdings, Inc.
- UBER = Uber Technologies, Inc.
- SHOP = Shopify Inc.
- TSLA = Tesla, Inc.
- NVDA = NVIDIA Corporation

${ar ? `ARABIC RULES:
- note: write 2 real sentences in proper Arabic about May 2026 market
- companyName: translate to Arabic (e.g. شركة آبل، شركة نفيديا)
- reasoning: 2 sentences in Arabic mentioning specific price level
- catalyst: one sentence in Arabic about the key catalyst
- sentiment: use صعودي/هبوطي/محايد
- DO NOT mix English words inside Arabic text
- DO NOT use placeholder instructions as content` : ''}

REASONING QUALITY:
- BAD: "السهم يتمتع بأساسيات قوية" or "Stock has strong fundamentals"
- GOOD: "اخترق NVDA مقاومة 205 دولار بحجم تداول مرتفع، مما يشير لاستمرار الزخم الصعودي"
- Must mention specific price OR indicator OR recent news
${prices}`
}

export function analyzePrompt(ticker: string, lang: string, price?: number, signal?: string) {
  const ar = lang === 'ar'
  const p = price && price > 0 ? price : null
  const priceHint = p
    ? `Current real market price: $${p}. Base ALL price levels on this exact number.`
    : `Use the real current May 2026 market price for ${ticker}.`

  const exchange = EXCHANGE_MAP[ticker] || 'NASDAQ'

  const signalHint = signal
    ? `IMPORTANT: Signal is "${signal}".
- sell/strongSell → BEARISH analysis, risks > rewards
- buy/strongBuy → BULLISH analysis, opportunity exists
- hold → NEUTRAL analysis, wait for direction
- "signal" field in JSON MUST be: "${signal}"
- All analysis must align with this signal`
    : ''

  const entryLow  = p ? Math.round(p * 0.97) : 190
  const entryHigh = p ? Math.round(p * 1.01) : 199
  const stopVal   = p ? Math.round(p * 0.94) : 184
  const t1Val     = p ? Math.round(p * 1.10) : 215
  const t2Val     = p ? Math.round(p * 1.18) : 231
  const sma20     = p ? Math.round(p * 0.98) : 192
  const sma50     = p ? Math.round(p * 0.95) : 185
  const sma200    = p ? Math.round(p * 0.80) : 155
  const bUpper    = p ? Math.round(p * 1.07) : 210
  const bLower    = p ? Math.round(p * 0.93) : 180
  const sup1      = p ? Math.round(p * 0.97) : 190
  const sup2      = p ? Math.round(p * 0.94) : 185
  const sup3      = p ? Math.round(p * 0.90) : 175
  const res1      = p ? Math.round(p * 1.05) : 205
  const res2      = p ? Math.round(p * 1.10) : 215
  const w52High   = p ? Math.round(p * 1.25) : 245
  const w52Low    = p ? Math.round(p * 0.60) : 118

  const isSell = signal?.toLowerCase().includes('sell')
  const isHold = signal?.toLowerCase().includes('hold')

  const entryStr = isSell
    ? `$${p ? Math.round(p * 1.01) : entryLow}-${p ? Math.round(p * 1.03) : entryHigh}`
    : isHold
    ? `$${p ? Math.round(p * 0.98) : entryLow}-${p ? Math.round(p * 1.02) : entryHigh}`
    : `$${entryLow}-${entryHigh}`

  const stopStr = isSell
    ? `$${p ? Math.round(p * 1.06) : 210}`
    : `$${stopVal}`

  const t1Str = isSell
    ? `$${p ? Math.round(p * 0.90) : 175}`
    : `$${t1Val}`

  const t2Str = isSell
    ? `$${p ? Math.round(p * 0.82) : 160}`
    : `$${t2Val}`

  const competitorMap: Record<string, string> = {
    NVDA:'AMD, INTC, QCOM', AAPL:'MSFT, GOOGL, DELL',
    MSFT:'GOOGL, AAPL, CRM', TSLA:'RIVN, GM, F',
    AMZN:'MSFT, GOOGL, WMT', META:'GOOGL, SNAP, PINS',
    GOOGL:'MSFT, META, AMZN', JPM:'BAC, WFC, C',
    AMD:'NVDA, INTC, QCOM', NFLX:'DIS, PARA, WBD',
    GS:'MS, JPM, BAC', MS:'GS, JPM, BAC',
    V:'MA, PYPL, AXP', MA:'V, PYPL, AXP',
    CRM:'MSFT, ORCL, SAP', COIN:'HOOD, SQ, MSTR',
    CVX:'XOM, COP, SLB', XOM:'CVX, COP, BP',
    COP:'XOM, CVX, SLB', BA:'LMT, RTX, NOC',
    LMT:'RTX, NOC, BA', JNJ:'PFE, ABBV, MRK',
    LLY:'NVO, ABBV, MRK', UNH:'CVS, CI, HUM',
    WMT:'TGT, COST, AMZN', HD:'LOW, WMT, TGT',
    AMAT:'LRCX, KLAC, ASML', PLTR:'PATH, AI, BBAI',
  }
  const competitors = competitorMap[ticker] || `3 real direct competitors for ${ticker}`

  return `You are a professional financial analyst. Analyze ${ticker} for May 2026.
${ar ? 'Write description, analysis, news headlines, and companyName IN ARABIC. All other fields in English.' : 'All text in English.'}
${priceHint}
${signalHint}

CRITICAL: Generate REAL content — no placeholder text. Return ONLY valid JSON:
{
  "ticker": "${ticker}",
  "companyName": "${ar ? `اسم ${ticker} الكامل بالعربية` : `Full legal name of ${ticker}`}",
  "sector": "Technology",
  "industry": "${ar ? `صناعة ${ticker} بالعربية` : `${ticker} industry`}",
  "exchange": "${exchange}",
  "description": "${ar ? `اكتب 3 جمل حقيقية عن ${ticker} بالعربية` : `Write 3 real sentences about ${ticker} business model`}",
  "price": ${p || 0},
  "priceChange": 0,
  "priceChangePct": 0,
  "open": ${p || 0},
  "high": ${p ? Math.round(p * 1.02) : 0},
  "low": ${p ? Math.round(p * 0.98) : 0},
  "volume": "real volume",
  "avgVolume": "real avg volume",
  "week52High": ${w52High},
  "week52Low": ${w52Low},
  "marketCap": "real market cap like $3.2T",
  "beta": 1.2,
  "signal": "${signal || 'buy'}",
  "confidence": 80,
  "entry": "${entryStr}",
  "stopLoss": "${stopStr}",
  "target1": "${t1Str}",
  "target2": "${t2Str}",
  "timeframe": "2-4 weeks",
  "score": 78,
  "scoreBreakdown": {"fundamental":75,"technical":82,"sentiment":78,"momentum":80},
  "fundamentals": {
    "revenue": "real revenue","revenueGrowth": "real%","netIncome": "real net income",
    "netMargin": "real%","eps": "real EPS","epsGrowth": "real%",
    "pe": 30,"forwardPE": 25,"peg": 0.5,"ebitda": "real EBITDA",
    "freeCashFlow": "real FCF","debtEquity": 0.5,"currentRatio": 2.0,
    "roe": "real%","roa": "real%","dividendYield": "real% or N/A"
  },
  "technical": {
    "trend": "${isSell ? 'Downtrend' : isHold ? 'Sideways' : 'Uptrend'}",
    "rsi": ${isSell ? 72 : isHold ? 52 : 48},
    "rsiSignal": "${isSell ? 'Overbought' : 'Neutral'}",
    "macd": "${isSell ? 'Bearish' : 'Bullish'}",
    "macdValue": 2.0,
    "sma20": ${sma20},"sma50": ${sma50},"sma200": ${sma200},
    "bollingerUpper": ${bUpper},"bollingerLower": ${bLower},
    "support1": ${sup1},"support2": ${sup2},"support3": ${sup3},
    "resistance1": ${res1},"resistance2": ${res2},
    "atr": 5.0,"obv": "${isSell ? 'Falling' : 'Rising'}"
  },
  "analysis": {
    "summary": "${ar ? `اكتب 4 جمل حقيقية عن ${ticker} تتوافق مع إشارة ${signal || 'الشراء'} في مايو 2026` : `Write 4 real sentences about ${ticker} aligned with ${signal || 'buy'} signal in May 2026`}",
    "bullish": ["${ar?'عامل صعودي حقيقي 1':'real bullish factor 1'}","${ar?'عامل صعودي حقيقي 2':'real bullish factor 2'}","${ar?'عامل صعودي حقيقي 3':'real bullish factor 3'}"],
    "bearish": ["${ar?'مخاطرة حقيقية 1':'real risk 1'}","${ar?'مخاطرة حقيقية 2':'real risk 2'}","${ar?'مخاطرة حقيقية 3':'real risk 3'}"],
    "catalysts": ["${ar?'محفز حقيقي 1':'real catalyst 1'}","${ar?'محفز حقيقي 2':'real catalyst 2'}"]
  },
  "news": [
    {"headline":"${ar?`خبر حقيقي 1 عن ${ticker}`:`Real headline 1 about ${ticker}`}","source":"Reuters","time":"2h ago","sentiment":"${isSell?'negative':'positive'}"},
    {"headline":"${ar?`خبر حقيقي 2 مختلف عن ${ticker}`:`Real different headline 2 about ${ticker}`}","source":"Bloomberg","time":"5h ago","sentiment":"neutral"},
    {"headline":"${ar?`خبر حقيقي 3 عن ${ticker}`:`Real headline 3 about ${ticker}`}","source":"WSJ","time":"1d ago","sentiment":"${isSell?'negative':'positive'}"},
    {"headline":"${ar?`خبر حقيقي 4 عن مخاطر ${ticker}`:`Real headline 4 about ${ticker} risks`}","source":"CNBC","time":"2d ago","sentiment":"${isSell?'negative':'neutral'}"}
  ],
  "analystRatings": {
    "buy": ${isSell ? 8 : 25},"hold": ${isSell ? 10 : 8},"sell": ${isSell ? 20 : 2},
    "avgTarget": "${isSell ? t1Str : '$'+t1Val}",
    "highTarget": "${isSell ? t2Str : '$'+t2Val}",
    "lowTarget": "${isSell ? stopStr : '$'+stopVal}",
    "consensus": "${isSell ? (ar?'بيع':'Sell') : isHold ? (ar?'احتفاظ':'Hold') : (ar?'شراء قوي':'Strong Buy')}"
  },
  "competitors": [
    {"ticker":"C1","name":"real competitor 1 name","price":100,"marketCap":"$100B","pe":30,"signal":"hold","ytd":"-5%"},
    {"ticker":"C2","name":"real competitor 2 name","price":200,"marketCap":"$200B","pe":25,"signal":"buy","ytd":"+10%"},
    {"ticker":"C3","name":"real competitor 3 name","price":50,"marketCap":"$50B","pe":null,"signal":"sell","ytd":"-15%"}
  ]
}
FINAL RULES:
- Use real competitors: ${competitors}
- marketCap: string like "$175B" NEVER raw numbers
- All headlines unique and specific to ${ticker}
- signal MUST be: "${signal || 'buy'}"
- exchange MUST be: "${exchange}"
- sector MUST be in English
- Use REAL fundamental data for ${ticker}
- NEVER use placeholder instructions as content in the output`
}
