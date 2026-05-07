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

// ✅ أسماء الشركات بالعربية
const AR_COMPANY_NAMES: Record<string, string> = {
  NVDA:'شركة نفيديا', AAPL:'شركة آبل', MSFT:'شركة مايكروسوفت',
  GOOGL:'شركة ألفابيت (جوجل)', META:'شركة ميتا', AMZN:'شركة أمازون',
  TSLA:'شركة تيسلا', AMD:'شركة إيه إم دي', INTC:'شركة إنتل',
  QCOM:'شركة كوالكوم', PLTR:'شركة بالانتير', ARM:'شركة آرم',
  CRM:'شركة سيلزفورس', ORCL:'شركة أوراكل', ADBE:'شركة أدوبي',
  CRWD:'شركة كراودسترايك', PANW:'شركة بالو ألتو نتووركس',
  COIN:'شركة كوينبيس', PYPL:'شركة باي بال', SQ:'شركة سكوير',
  JPM:'شركة جيه بي مورغان تشيس', GS:'شركة غولدمان ساكس',
  MS:'شركة مورغان ستانلي', BAC:'بنك أوف أمريكا',
  WFC:'بنك ويلز فارغو', V:'شركة فيزا', MA:'شركة ماستركارد',
  XOM:'شركة إكسون موبيل', CVX:'شركة شيفرون', COP:'شركة كونوكو فيليبس',
  SLB:'شركة شلمبرجير', EOG:'شركة إي أو جي ريسورسز',
  LLY:'شركة إيلي ليلي', UNH:'شركة يونايتد هيلث',
  JNJ:'شركة جونسون آند جونسون', ABBV:'شركة أبفي',
  MRK:'شركة ميرك', AMGN:'شركة أمجين', REGN:'شركة ريجينيرون',
  WMT:'شركة وول مارت', HD:'شركة هوم ديبوت',
  MCD:'شركة ماكدونالدز', SBUX:'شركة ستاربكس',
  NKE:'شركة نايكي', DIS:'شركة ديزني', NFLX:'شركة نتفليكس',
  BA:'شركة بوينغ', CAT:'شركة كاتربيلر',
  GE:'شركة جنرال إلكتريك', HON:'شركة هانيويل',
  UBER:'شركة أوبر', SHOP:'شركة شوبيفاي', CVNA:'شركة كارفانا',
}

export function signalsPrompt(lang: string, priceContext?: string) {
  const ar = lang === 'ar'
  const prices = priceContext
    ? `\nCURRENT REAL PRICES (use these EXACTLY): ${priceContext}`
    : ''

  const arNames = ar ? `
ARABIC COMPANY NAMES — USE EXACTLY AS LISTED:
${Object.entries(AR_COMPANY_NAMES).map(([k,v]) => `- ${k} = ${v}`).join('\n')}
` : ''

  return `You are a professional US stock market analyst for May 2026.
${ar ? 'LANGUAGE: Write note, companyName, reasoning, catalyst IN ARABIC. All other fields in English.' : 'LANGUAGE: All text in English.'}
${arNames}

Return ONLY valid JSON with REAL original content:
{
  "date": "May 6, 2026",
  "marketSummary": {
    "sp500": "+0.8%",
    "nasdaq": "+1.2%",
    "sentiment": "${ar ? 'صعودي' : 'Bullish'}",
    "vix": "14.2",
    "note": "${ar ? 'تواصل الأسواق الأمريكية ارتفاعها في مايو 2026 مدعومةً بنتائج أرباح قوية وتراجع مؤشر VIX. يحافظ المستثمرون على تفاؤلهم رغم ترقبهم لقرارات الفيدرالي الأمريكي القادمة.' : 'US markets continue their upward trend in May 2026 supported by strong earnings. Investors remain optimistic ahead of the upcoming Fed meeting.'}"
  },
  "signals": [
    {
      "ticker": "NVDA",
      "companyName": "${ar ? 'شركة نفيديا' : 'NVIDIA Corporation'}",
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
      "reasoning": "${ar ? 'اخترق السهم مقاومة 205 دولار بحجم تداول مرتفع يعادل ضعف المتوسط، مما يؤكد قوة الاتجاه الصعودي. مؤتمر المطورين القادم يمثل محفزاً قوياً لاستمرار الزخم.' : 'Stock broke above $205 resistance on 2x average volume confirming bullish momentum. Developer conference is a near-term catalyst for continuation.'}",
      "catalyst": "${ar ? 'الإعلان عن نتائج الربع الأول وتوقعات إيجابية' : 'Q1 earnings with positive guidance'}"
    }
  ],
  "topBuy": "NVDA",
  "topSell": "XOM",
  "watchlist": ["AAPL","MSFT","GOOGL","JPM","CVX"]
}

MANDATORY: Generate exactly 8 DIFFERENT signals replacing the example above.

SECTOR DISTRIBUTION — STRICTLY ENFORCED:
- Technology: EXACTLY 2 signals from: NVDA,AAPL,MSFT,GOOGL,META,AMD,AMAT,PLTR,ARM,CRM,ADBE,CRWD,PANW
- Financials: EXACTLY 1 signal from: JPM,GS,MS,V,MA,BAC,PYPL,COIN
- Energy: EXACTLY 1 signal from: XOM,CVX,COP,SLB,EOG
- Healthcare: EXACTLY 1 signal from: LLY,UNH,JNJ,ABBV,MRK,AMGN,REGN
- Consumer Discretionary: EXACTLY 1 signal from: TSLA,AMZN,HD,MCD,SBUX,NKE,NFLX
- Industrials: EXACTLY 1 signal from: BA,CAT,GE,HON,UPS,RTX
- Other: EXACTLY 1 signal from: WMT,PG,KO,UBER,SHOP

SIGNAL MIX: 4-5 buy/strongBuy, 1-2 sell/strongSell, 1-2 hold

CRITICAL RULES:
- NEVER repeat same ticker twice
- NEVER use same reasoning structure for different signals
- sector: ALWAYS English — Technology/Financials/Energy/Healthcare/Consumer Discretionary/Industrials/Other
- entry within 2-3% of current price
- stopLoss: 3-6% below for buys, 3-6% ABOVE for sells
- target1: 8-12% from price
- target2: 15-20% from price
- sell/strongSell: entry ABOVE price, target BELOW price
- signal: strongBuy|buy|hold|sell|strongSell
- confidence: 60-95
- ALL price values: real numbers only

SECTOR MAP:
- NVDA/AAPL/MSFT/GOOGL/META/AMD/CRM/PLTR/ADBE/CRWD/PANW → Technology
- JPM/GS/V/MA/BAC/COIN/PYPL/MS → Financials
- XOM/CVX/COP/SLB/EOG → Energy
- LLY/UNH/JNJ/ABBV/MRK/AMGN/REGN → Healthcare
- TSLA/AMZN/HD/MCD/NFLX/SBUX/NKE → Consumer Discretionary
- BA/CAT/GE/HON/UPS/RTX → Industrials
- WMT/PG/KO/UBER/SHOP → Other

REASONING QUALITY — each signal must be UNIQUE:
${ar ? `- يجب ذكر مستوى سعري محدد أو مؤشر فني أو حدث حقيقي
- لا تكرر نفس البنية اللغوية في كل توصية
- مثال جيد: "اخترق NVDA مقاومة 205 دولار بحجم مرتفع، ومؤتمر GTC يدعم الزخم"
- مثال سيئ: "يجب على المستثمرين تشجيع السهم في الصعود"` : `- Must mention specific price level OR indicator OR news
- Each reasoning must be structurally different
- Good: "NVDA broke $205 resistance on high volume; GTC conference supports momentum"
- Bad: "Stock has strong fundamentals and growing demand"`}
${prices}`
}

export function analyzePrompt(ticker: string, lang: string, price?: number, signal?: string) {
  const ar = lang === 'ar'
  const p = price && price > 0 ? price : null
  const priceHint = p
    ? `Current real market price: $${p}. Base ALL price levels on this exact number.`
    : `Use the real current May 2026 market price for ${ticker}.`

  const exchange = EXCHANGE_MAP[ticker] || 'NASDAQ'
  const arName = AR_COMPANY_NAMES[ticker] || ticker

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
${ar ? `Write companyName, description, analysis summary, bullish/bearish/catalysts, news headlines IN ARABIC. All other fields in English.
ARABIC NAME FOR ${ticker}: ${arName}` : 'All text in English.'}
${priceHint}
${signalHint}

Return ONLY valid JSON with REAL content:
{
  "ticker": "${ticker}",
  "companyName": "${ar ? arName : `Full legal name of ${ticker}`}",
  "sector": "correct English sector",
  "industry": "correct industry",
  "exchange": "${exchange}",
  "description": "${ar ? `3 جمل حقيقية عن ${arName} بالعربية` : `3 real sentences about ${ticker} business`}",
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
    "summary":"${ar?`4 جمل تحليلية حقيقية عن ${arName} تتوافق مع إشارة ${signal||'الشراء'}`:`4 real sentences about ${ticker} aligned with ${signal||'buy'} signal`}",
    "bullish":["${ar?'عامل صعودي حقيقي 1':'real bullish factor 1'}","${ar?'عامل صعودي حقيقي 2':'real bullish factor 2'}","${ar?'عامل صعودي حقيقي 3':'real bullish factor 3'}"],
    "bearish":["${ar?'مخاطرة حقيقية 1':'real risk 1'}","${ar?'مخاطرة حقيقية 2':'real risk 2'}","${ar?'مخاطرة حقيقية 3':'real risk 3'}"],
    "catalysts":["${ar?'محفز حقيقي 1':'real catalyst 1'}","${ar?'محفز حقيقي 2':'real catalyst 2'}"]
  },
  "news": [
    {"headline":"${ar?`خبر حقيقي فريد 1 عن ${arName}`:`Real unique headline 1 about ${ticker}`}","source":"Reuters","time":"2h ago","sentiment":"${isSell?'negative':'positive'}"},
    {"headline":"${ar?`خبر مختلف 2 عن ${arName}`:`Different real headline 2 about ${ticker}`}","source":"Bloomberg","time":"5h ago","sentiment":"neutral"},
    {"headline":"${ar?`خبر 3 عن ${arName}`:`Real headline 3 about ${ticker}`}","source":"WSJ","time":"1d ago","sentiment":"positive"},
    {"headline":"${ar?`خبر مخاطر 4 عن ${arName}`:`Real risk headline 4 about ${ticker}`}","source":"CNBC","time":"2d ago","sentiment":"negative"}
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
- Real competitors: ${competitors}
- marketCap: string like "$175B"
- signal MUST be: "${signal||'buy'}"
- exchange MUST be: "${exchange}"
- sector in English only
- companyName ${ar?`MUST be: ${arName}`:'full legal name'}
- Use REAL fundamental data for ${ticker}`
}
