// ✅ خريطة الـ Exchange الحقيقي لكل سهم
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

  return `You are a professional US stock market analyst for May 2026. Generate today's top 8 trading recommendations across different sectors.
${ar ? 'Text fields (reasoning, catalyst, companyName) must be in Arabic. ALL other fields in English.' : 'All text in English.'}
Return ONLY valid JSON matching this exact schema:
{
  "date": "May 6, 2026",
  "marketSummary": {
    "sp500": "+0.8%",
    "nasdaq": "+1.2%",
    "sentiment": "${ar ? 'صعودي' : 'Bullish'}",
    "vix": "14.2",
    "note": "${ar ? 'ملاحظة باللغة العربية عن السوق' : '2-sentence market overview'}"
  },
  "signals": [
    {
      "ticker": "ANY_US_TICKER",
      "companyName": "${ar ? 'الاسم الكامل للشركة بالعربية' : 'Full company name'}",
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
      "reasoning": "${ar ? 'السبب بالعربية مع ذكر مستوى سعري محدد' : '2-sentence reasoning with specific price level'}",
      "catalyst": "${ar ? 'المحفز الرئيسي بالعربية' : 'Key near-term catalyst'}"
    }
  ],
  "topBuy": "BEST_BUY_TICKER",
  "topSell": "BEST_SELL_TICKER",
  "watchlist": ["TICKER1","TICKER2","TICKER3","TICKER4","TICKER5"]
}

SECTOR DISTRIBUTION — MANDATORY 8 signals across different sectors:
- Technology (2 signals): NVDA, AAPL, MSFT, GOOGL, META, AMD, AMAT, PLTR, ARM, CRM, ADBE, CRWD, PANW
- Financials (1 signal): JPM, GS, MS, V, MA, BAC, PYPL, COIN
- Energy (1 signal): XOM, CVX, COP, SLB, EOG
- Healthcare (1 signal): LLY, UNH, JNJ, ABBV, MRK, AMGN, REGN
- Consumer Discretionary (1 signal): TSLA, AMZN, HD, MCD, SBUX, NKE, NFLX
- Industrials (1 signal): BA, CAT, GE, HON, UPS, RTX
- Other (1 signal): WMT, PG, KO, UBER, SHOP

SIGNAL MIX: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold

CRITICAL RULES:
- VARIETY IS MANDATORY: Choose DIFFERENT stocks each time — rotate broadly
- NEVER repeat the same ticker twice in signals array
- Every signal MUST have entry, stopLoss, target1, target2 — never null or "-"
- ALL price fields must be REAL DOLLAR NUMBERS — NEVER formulas
- Entry MUST be within 5% of the current price provided
- entry format: "$193-198" — within 2-3% of current price
- stopLoss: 3-6% below current for buys, 3-6% above for sells
- target1: 8-12% from current price
- target2: 15-20% from current price
- signal values: strongBuy | buy | hold | sell | strongSell
- confidence: integer 60-95
- timeframe: "1-2 weeks" or "2-3 weeks"
- If sell/strongSell: entry ABOVE current price, target BELOW current price
- NEVER return formulas — ALL values must be real numbers

SECTOR RULES — VERY IMPORTANT:
- sector field must ALWAYS be in English — NEVER Arabic
- Valid sectors ONLY: Technology, Financials, Energy, Healthcare, Consumer Discretionary, Industrials, Other
- Use EXACTLY one of these sector names — no variations allowed
- NVDA/AAPL/MSFT/GOOGL/META/AMD → sector: "Technology"
- JPM/GS/V/MA/BAC/COIN → sector: "Financials"
- XOM/CVX/COP/SLB → sector: "Energy"
- LLY/UNH/JNJ/ABBV → sector: "Healthcare"
- TSLA/AMZN/HD/MCD/NFLX → sector: "Consumer Discretionary"
- BA/CAT/GE/HON/UPS → sector: "Industrials"
- WMT/PG/KO/UBER/SHOP → sector: "Other"

COMPANY NAMES:
- CVNA = Carvana Co.
- COIN = Coinbase Global, Inc.
- PLTR = Palantir Technologies Inc.
- CRWD = CrowdStrike Holdings, Inc.
- UBER = Uber Technologies, Inc.
- SHOP = Shopify Inc.

LANGUAGE RULES:
- sentiment field: "${ar ? 'صعودي/هبوطي/محايد' : 'Bullish/Bearish/Neutral'}"
- sector field: ALWAYS in English regardless of language setting
- ticker field: ALWAYS in English (e.g. AAPL, NVDA)
- All numeric fields: ALWAYS numbers not text
- reasoning & catalyst: ${ar ? 'Arabic' : 'English'}
${ar ? '- Do NOT mix English words inside Arabic sentences\n- Translate ALL financial terms to Arabic' : ''}

REASONING RULES:
- Must mention specific price level OR indicator value OR recent event
- Explain WHY NOW — not just why the stock is good generally
- Every reasoning must be unique — no copy-paste between signals
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
    ? `IMPORTANT: This stock has been identified as a "${signal}" signal.
- If signal is "sell" or "strongSell": analysis must reflect BEARISH outlook
- If signal is "buy" or "strongBuy": analysis must reflect BULLISH outlook
- If signal is "hold": analysis must reflect NEUTRAL outlook
- Your "signal" field in JSON MUST be exactly: "${signal}"
- Analysis summary and factors must align with this signal`
    : ''

  const entryLow  = p ? Math.round(p * 0.97) : '[price*0.97]'
  const entryHigh = p ? Math.round(p * 1.01) : '[price*1.01]'
  const stopVal   = p ? Math.round(p * 0.94) : '[price*0.94]'
  const t1Val     = p ? Math.round(p * 1.10) : '[price*1.10]'
  const t2Val     = p ? Math.round(p * 1.18) : '[price*1.18]'
  const sma20     = p ? Math.round(p * 0.98) : '[estimate]'
  const sma50     = p ? Math.round(p * 0.95) : '[estimate]'
  const sma200    = p ? Math.round(p * 0.80) : '[estimate]'
  const bUpper    = p ? Math.round(p * 1.07) : '[estimate]'
  const bLower    = p ? Math.round(p * 0.93) : '[estimate]'
  const sup1      = p ? Math.round(p * 0.97) : '[estimate]'
  const sup2      = p ? Math.round(p * 0.94) : '[estimate]'
  const sup3      = p ? Math.round(p * 0.90) : '[estimate]'
  const res1      = p ? Math.round(p * 1.05) : '[estimate]'
  const res2      = p ? Math.round(p * 1.10) : '[estimate]'
  const w52High   = p ? Math.round(p * 1.25) : '[estimate]'
  const w52Low    = p ? Math.round(p * 0.60) : '[estimate]'

  const isSell = signal?.toLowerCase().includes('sell')
  const isHold = signal?.toLowerCase().includes('hold')

  const entryStr = isSell
    ? `$${p ? Math.round(p * 1.01) : entryLow}-${p ? Math.round(p * 1.03) : entryHigh}`
    : isHold
    ? `$${p ? Math.round(p * 0.98) : entryLow}-${p ? Math.round(p * 1.02) : entryHigh}`
    : `$${entryLow}-${entryHigh}`

  const stopStr = isSell
    ? `$${p ? Math.round(p * 1.06) : '[price*1.06]'}`
    : `$${stopVal}`

  const t1Str = isSell
    ? `$${p ? Math.round(p * 0.90) : '[price*0.90]'}`
    : `$${t1Val}`

  const t2Str = isSell
    ? `$${p ? Math.round(p * 0.82) : '[price*0.82]'}`
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

  return `You are a professional financial analyst. Analyze ${ticker}.
${ar ? 'Text fields must be in Arabic. Numeric and code fields in English.' : 'All text in English.'}
${priceHint}
${signalHint}

Return ONLY valid JSON:
{
  "ticker": "${ticker}",
  "companyName": "${ar ? 'الاسم القانوني الكامل بالعربية' : 'Full legal name'}",
  "sector": "Technology",
  "industry": "industry in ${ar ? 'Arabic' : 'English'}",
  "exchange": "${exchange}",
  "description": "${ar ? 'وصف 3 جمل بالعربية' : '3-sentence business description.'}",
  "price": ${p || 0},
  "priceChange": 0,
  "priceChangePct": 0,
  "open": ${p || 0},
  "high": ${p ? Math.round(p * 1.02) : 0},
  "low": ${p ? Math.round(p * 0.98) : 0},
  "volume": "50M",
  "avgVolume": "80M",
  "week52High": ${w52High},
  "week52Low": ${w52Low},
  "marketCap": "real cap like $2.1T",
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
    "revenue": "real figure","revenueGrowth": "real%","netIncome": "real",
    "netMargin": "real%","eps": "real","epsGrowth": "real%",
    "pe": 30,"forwardPE": 25,"peg": 0.5,"ebitda": "real",
    "freeCashFlow": "real","debtEquity": 0.5,"currentRatio": 2.0,
    "roe": "real%","roa": "real%","dividendYield": "real% or N/A"
  },
  "technical": {
    "trend": "${isSell ? 'Downtrend' : isHold ? 'Sideways' : 'Uptrend'}",
    "rsi": ${isSell ? 72 : isHold ? 52 : 48},
    "rsiSignal": "${isSell ? 'Overbought' : 'Neutral'}",
    "macd": "${isSell ? 'Bearish' : 'Bullish'}","macdValue": 2.0,
    "sma20": ${sma20},"sma50": ${sma50},"sma200": ${sma200},
    "bollingerUpper": ${bUpper},"bollingerLower": ${bLower},
    "support1": ${sup1},"support2": ${sup2},"support3": ${sup3},
    "resistance1": ${res1},"resistance2": ${res2},
    "atr": 5.0,"obv": "${isSell ? 'Falling' : 'Rising'}"
  },
  "analysis": {
    "summary": "${ar ? 'تحليل 4 جمل بالعربية' : '4-sentence thesis'} aligned with ${signal || 'buy'} signal.",
    "bullish": ${isSell ? `["${ar?'دعم بسيط موجود':'Minor support exists'}","${ar?'ارتداد محتمل':'Oversold bounce possible'}","${ar?'قيمة طويلة الأمد':'Long-term value'}"]` : `["${ar?'عامل صعودي 1':'factor 1'}","${ar?'عامل صعودي 2':'factor 2'}","${ar?'عامل صعودي 3':'factor 3'}","${ar?'عامل صعودي 4':'factor 4'}"]`},
    "bearish": ${isSell ? `["${ar?'المخاطرة الرئيسية':'Primary risk'}","${ar?'المخاطرة الثانية':'Second risk'}","${ar?'المخاوف الثالثة':'Third concern'}"]` : `["${ar?'مخاطرة 1':'risk 1'}","${ar?'مخاطرة 2':'risk 2'}","${ar?'مخاطرة 3':'risk 3'}"]`},
    "catalysts": ["${ar?'محفز 1 بالعربية':'catalyst 1'}","${ar?'محفز 2 بالعربية':'catalyst 2'}"]
  },
  "news": [
    {"headline":"${ar?'عنوان خبر 1 خاص بـ':'Unique headline 1 for'} ${ticker}","source":"Reuters","time":"2h ago","sentiment":"${isSell?'negative':'positive'}"},
    {"headline":"${ar?'عنوان خبر 2 مختلف عن':'Different headline 2 about'} ${ticker}","source":"Bloomberg","time":"5h ago","sentiment":"neutral"},
    {"headline":"${ar?'عنوان خبر 3 عن':'Third headline about'} ${ticker}","source":"WSJ","time":"1d ago","sentiment":"${isSell?'negative':'positive'}"},
    {"headline":"${ar?'عنوان خبر 4 عن مخاطر':'Fourth headline about risks of'} ${ticker}","source":"CNBC","time":"2d ago","sentiment":"${isSell?'negative':'neutral'}"}
  ],
  "analystRatings": {
    "buy": ${isSell ? 8 : 25},"hold": ${isSell ? 10 : 8},"sell": ${isSell ? 20 : 2},
    "avgTarget": "${isSell ? t1Str : '$' + t1Val}",
    "highTarget": "${isSell ? t2Str : '$' + t2Val}",
    "lowTarget": "${isSell ? stopStr : '$' + stopVal}",
    "consensus": "${isSell ? (ar?'بيع':'Sell') : isHold ? (ar?'احتفاظ':'Hold') : (ar?'شراء قوي':'Strong Buy')}"
  },
  "competitors": [
    {"ticker":"C1","name":"${ar?'اسم المنافس 1':'Competitor 1 name'}","price":100,"marketCap":"$100B","pe":30,"signal":"hold","ytd":"-5%"},
    {"ticker":"C2","name":"${ar?'اسم المنافس 2':'Competitor 2 name'}","price":200,"marketCap":"$200B","pe":25,"signal":"buy","ytd":"+10%"},
    {"ticker":"C3","name":"${ar?'اسم المنافس 3':'Competitor 3 name'}","price":50,"marketCap":"$50B","pe":null,"signal":"sell","ytd":"-15%"}
  ]
}
RULES:
- Use real competitors: ${competitors}
- marketCap as string like "$175B" never raw numbers
- All news headlines unique and specific to ${ticker}
- signal field MUST be exactly: "${signal || 'buy'}"
- exchange field MUST be exactly: "${exchange}"
- sector field MUST be in English always
- Use REAL fundamental data for ${ticker}
- Analysis must be consistent with the ${signal || 'buy'} signal`
}
