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
    ? `\nCURRENT REAL PRICES (use these EXACTLY): ${priceContext}`
    : ''

  const exampleNote = ar
    ? 'تواصل الأسواق الأمريكية ارتفاعها في مايو 2026 مدعومةً بنتائج أرباح قوية وتراجع مؤشر VIX. يحافظ المستثمرون على تفاؤلهم رغم ترقبهم لقرارات الفيدرالي الأمريكي القادمة.'
    : 'US markets continue their upward trend in May 2026, supported by strong earnings and low volatility. Investors remain optimistic ahead of the upcoming Fed meeting on interest rates.'

  const exampleReasoning = ar
    ? 'اخترق السهم مقاومة 205 دولار بحجم تداول مرتفع يعادل ضعف المتوسط، مما يؤكد قوة الاتجاه الصعودي. مؤتمر المطورين القادم يمثل محفزاً قوياً لاستمرار الزخم خلال الأسبوعين المقبلين.'
    : 'Stock broke above $205 resistance on 2x average volume confirming bullish momentum. Upcoming developer conference represents a strong catalyst for continuation over the next 2 weeks.'

  const exampleCatalyst = ar
    ? 'الإعلان عن نتائج الربع الأول وتوقعات إيجابية للربع القادم'
    : 'Q1 earnings announcement with positive guidance for next quarter'

  const exampleCompany = ar ? 'شركة نفيديا' : 'NVIDIA Corporation'

  return `You are a professional US stock market analyst for May 2026.
${ar ? 'LANGUAGE RULE: Write note, companyName, reasoning, catalyst IN ARABIC. All other fields in English.' : 'LANGUAGE: All text in English.'}

CONTENT RULES — READ CAREFULLY:
- Generate ORIGINAL real content for every field
- The example values below show FORMAT only — replace with real content
- note: write 2 original sentences about actual May 2026 US market
- reasoning: mention specific price level and explain why to trade NOW
- catalyst: one specific real catalyst for this stock
- companyName: ${ar ? 'translate to Arabic' : 'use full English legal name'}
- NEVER output instructions or template text as content

Return ONLY valid JSON:
{
  "date": "May 6, 2026",
  "marketSummary": {
    "sp500": "+0.8%",
    "nasdaq": "+1.2%",
    "sentiment": "${ar ? 'صعودي' : 'Bullish'}",
    "vix": "14.2",
    "note": "${exampleNote}"
  },
  "signals": [
    {
      "ticker": "NVDA",
      "companyName": "${exampleCompany}",
      "sector": "Technology",
      "price": 207.83,
      "priceChangePct": 5.77,
      "signal": "strongBuy",
      "confidence": 92,
      "entry": "$202-210",
      "stopLoss": "$195",
      "target1": "$229",
      "target2": "$245",
      "timeframe": "1-2 weeks",
      "rsi": 58.4,
      "macd": "Bullish crossover",
      "trend": "Uptrend",
      "reasoning": "${exampleReasoning}",
      "catalyst": "${exampleCatalyst}"
    }
  ],
  "topBuy": "NVDA",
  "topSell": "XOM",
  "watchlist": ["AAPL","MSFT","GOOGL","JPM","CVX"]
}

MANDATORY: Generate exactly 8 signals replacing the example above.

SECTOR DISTRIBUTION:
- Technology (2): NVDA,AAPL,MSFT,GOOGL,META,AMD,AMAT,PLTR,ARM,CRM,ADBE,CRWD,PANW
- Financials (1): JPM,GS,MS,V,MA,BAC,PYPL,COIN
- Energy (1): XOM,CVX,COP,SLB,EOG
- Healthcare (1): LLY,UNH,JNJ,ABBV,MRK,AMGN,REGN
- Consumer Discretionary (1): TSLA,AMZN,HD,MCD,SBUX,NKE,NFLX
- Industrials (1): BA,CAT,GE,HON,UPS,RTX
- Other (1): WMT,PG,KO,UBER,SHOP

SIGNAL MIX: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold

RULES:
- NEVER repeat same ticker twice
- sector: ALWAYS English — Technology/Financials/Energy/Healthcare/Consumer Discretionary/Industrials/Other
- entry within 2-3% of current price
- stopLoss: 3-6% below for buys, 3-6% above for sells
- target1: 8-12% from price, target2: 15-20% from price
- sell/strongSell: entry ABOVE price, target BELOW price
- signal: strongBuy|buy|hold|sell|strongSell
- confidence: 60-95
- ALL prices: real numbers only

SECTOR MAP:
- NVDA/AAPL/MSFT/GOOGL/META/AMD/CRM/PLTR → Technology
- JPM/GS/V/MA/BAC/COIN/PYPL → Financials
- XOM/CVX/COP/SLB/EOG → Energy
- LLY/UNH/JNJ/ABBV/MRK → Healthcare
- TSLA/AMZN/HD/MCD/NFLX → Consumer Discretionary
- BA/CAT/GE/HON/UPS → Industrials
- WMT/PG/KO/UBER/SHOP → Other
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
    ? `Signal is "${signal}". Analysis MUST align:
- sell/strongSell → bearish outlook, risks > rewards
- buy/strongBuy → bullish outlook, opportunity
- hold → neutral, wait for direction
- JSON "signal" field MUST be exactly: "${signal}"`
    : ''

  const p0 = p || 200
  const entryLow  = Math.round(p0 * 0.97)
  const entryHigh = Math.round(p0 * 1.01)
  const stopVal   = Math.round(p0 * 0.94)
  const t1Val     = Math.round(p0 * 1.10)
  const t2Val     = Math.round(p0 * 1.18)
  const sma20     = Math.round(p0 * 0.98)
  const sma50     = Math.round(p0 * 0.95)
  const sma200    = Math.round(p0 * 0.80)
  const bUpper    = Math.round(p0 * 1.07)
  const bLower    = Math.round(p0 * 0.93)
  const sup1      = Math.round(p0 * 0.97)
  const sup2      = Math.round(p0 * 0.94)
  const sup3      = Math.round(p0 * 0.90)
  const res1      = Math.round(p0 * 1.05)
  const res2      = Math.round(p0 * 1.10)
  const w52High   = Math.round(p0 * 1.25)
  const w52Low    = Math.round(p0 * 0.60)

  const isSell = signal?.toLowerCase().includes('sell')
  const isHold = signal?.toLowerCase().includes('hold')

  const entryStr = isSell
    ? `$${Math.round(p0*1.01)}-${Math.round(p0*1.03)}`
    : isHold
    ? `$${Math.round(p0*0.98)}-${Math.round(p0*1.02)}`
    : `$${entryLow}-${entryHigh}`

  const stopStr = isSell ? `$${Math.round(p0*1.06)}` : `$${stopVal}`
  const t1Str   = isSell ? `$${Math.round(p0*0.90)}` : `$${t1Val}`
  const t2Str   = isSell ? `$${Math.round(p0*0.82)}` : `$${t2Val}`

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
    BA:'LMT, RTX, NOC', LLY:'NVO, ABBV, MRK',
    WMT:'TGT, COST, AMZN', HD:'LOW, WMT, TGT',
    AMAT:'LRCX, KLAC, ASML', PLTR:'PATH, AI, BBAI',
  }
  const competitors = competitorMap[ticker] || `3 real competitors for ${ticker}`

  return `Analyze ${ticker} for May 2026.
${ar ? 'Write description, summary, bullish/bearish/catalysts, news headlines, companyName IN ARABIC. All other fields in English.' : 'All text in English.'}
${priceHint}
${signalHint}

Return ONLY valid JSON with REAL content — no placeholder text:
{
  "ticker": "${ticker}",
  "companyName": "${ar ? `الاسم العربي الكامل لـ ${ticker}` : `Full legal name of ${ticker}`}",
  "sector": "correct sector in English",
  "industry": "correct industry",
  "exchange": "${exchange}",
  "description": "real 3-sentence description of ${ticker}",
  "price": ${p0},
  "priceChange": 0,
  "priceChangePct": 0,
  "open": ${p0},
  "high": ${Math.round(p0*1.02)},
  "low": ${Math.round(p0*0.98)},
  "volume": "real volume",
  "avgVolume": "real avg volume",
  "week52High": ${w52High},
  "week52Low": ${w52Low},
  "marketCap": "real cap e.g. $3.2T",
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
    "revenue":"real revenue","revenueGrowth":"real%","netIncome":"real",
    "netMargin":"real%","eps":"real","epsGrowth":"real%",
    "pe":30,"forwardPE":25,"peg":0.5,"ebitda":"real",
    "freeCashFlow":"real","debtEquity":0.5,"currentRatio":2.0,
    "roe":"real%","roa":"real%","dividendYield":"real% or N/A"
  },
  "technical": {
    "trend":"${isSell?'Downtrend':isHold?'Sideways':'Uptrend'}",
    "rsi":${isSell?72:isHold?52:48},
    "rsiSignal":"${isSell?'Overbought':'Neutral'}",
    "macd":"${isSell?'Bearish':'Bullish'}","macdValue":2.0,
    "sma20":${sma20},"sma50":${sma50},"sma200":${sma200},
    "bollingerUpper":${bUpper},"bollingerLower":${bLower},
    "support1":${sup1},"support2":${sup2},"support3":${sup3},
    "resistance1":${res1},"resistance2":${res2},
    "atr":5.0,"obv":"${isSell?'Falling':'Rising'}"
  },
  "analysis": {
    "summary":"real 4-sentence analysis of ${ticker} for ${signal||'buy'} signal",
    "bullish":["real bullish factor 1","real bullish factor 2","real bullish factor 3"],
    "bearish":["real risk 1","real risk 2","real risk 3"],
    "catalysts":["real catalyst 1","real catalyst 2"]
  },
  "news": [
    {"headline":"real unique headline 1 about ${ticker}","source":"Reuters","time":"2h ago","sentiment":"${isSell?'negative':'positive'}"},
    {"headline":"real different headline 2 about ${ticker}","source":"Bloomberg","time":"5h ago","sentiment":"neutral"},
    {"headline":"real headline 3 about ${ticker}","source":"WSJ","time":"1d ago","sentiment":"positive"},
    {"headline":"real headline 4 about ${ticker} risk","source":"CNBC","time":"2d ago","sentiment":"negative"}
  ],
  "analystRatings": {
    "buy":${isSell?8:25},"hold":${isSell?10:8},"sell":${isSell?20:2},
    "avgTarget":"${isSell?t1Str:'$'+t1Val}",
    "highTarget":"${isSell?t2Str:'$'+t2Val}",
    "lowTarget":"${isSell?stopStr:'$'+stopVal}",
    "consensus":"${isSell?(ar?'بيع':'Sell'):isHold?(ar?'احتفاظ':'Hold'):(ar?'شراء قوي':'Strong Buy')}"
  },
  "competitors": [
    {"ticker":"C1","name":"real name","price":100,"marketCap":"$100B","pe":30,"signal":"hold","ytd":"-5%"},
    {"ticker":"C2","name":"real name","price":200,"marketCap":"$200B","pe":25,"signal":"buy","ytd":"+10%"},
    {"ticker":"C3","name":"real name","price":50,"marketCap":"$50B","pe":null,"signal":"sell","ytd":"-15%"}
  ]
}
RULES:
- Real competitors for ${ticker}: ${competitors}
- marketCap: string like "$175B" never raw numbers
- signal MUST be: "${signal||'buy'}"
- exchange MUST be: "${exchange}"
- sector in English only
- Use REAL data for ${ticker}`
}
