import { NextResponse } from 'next/server'
import { getAllCommodities } from '@/lib/market'
import { generateJSON } from '@/lib/groq'

let cache: { data: unknown; time: number } | null = null
let signalsCache: { data: unknown; time: number } | null = null
const CACHE_MS = 5 * 60 * 1000
const SIGNALS_CACHE_MS = 30 * 60 * 1000 // 30 دقيقة للـ signals

// ✅ Prompt للذكاء الاصطناعي لتحليل السلع
function commoditySignalsPrompt(priceContext: string): string {
  return `You are a professional commodities trader. Analyze these current commodity prices and generate trading signals.

CURRENT PRICES: ${priceContext}

Return ONLY valid JSON:
{
  "signals": [
    {
      "symbol": "GC=F",
      "signal": "buy",
      "confidence": 78,
      "entry": 3320.00,
      "stopLoss": 3280.00,
      "target1": 3380.00,
      "target2": 3450.00,
      "quantity": 1,
      "reasoning": "Gold testing key support at $3,320 with strong momentum. Fed uncertainty drives safe-haven demand.",
      "catalyst": "Fed meeting uncertainty + geopolitical tensions"
    }
  ]
}

RULES:
- Analyze ALL symbols provided
- signal: buy | sell | hold
- confidence: 60-95
- entry: within 0.5% of current price
- stopLoss: 1-3% from entry
- target1: 3-5% from entry
- target2: 6-10% from entry
- quantity: always 1
- reasoning: 2 sentences with specific price level
- catalyst: key driver
- sell signal: entry ABOVE price, targets BELOW price
- Generate mix: 40% buy, 20% sell, 40% hold
- Only generate buy/sell for high-confidence setups (confidence > 70)`
}

export async function GET() {
  try {
    const now = Date.now()

    // ✅ Commodity prices cache
    if (cache && (now - cache.time) < CACHE_MS) {
      // أعد الأسعار مع الـ signals المحفوظة
      const signals = signalsCache && (now - signalsCache.time) < SIGNALS_CACHE_MS
        ? signalsCache.data
        : null
      return NextResponse.json({ data: cache.data, signals })
    }

    // جلب الأسعار الحية
    const data = await getAllCommodities()
    cache = { data, time: now }

    // ✅ جلب AI signals كل 30 دقيقة
    let signals = null
    if (!signalsCache || (now - signalsCache.time) >= SIGNALS_CACHE_MS) {
      try {
        const priceContext = (data as Array<{symbol:string;price:number;priceChangePct:number}>)
          .map(c => `${c.symbol}=$${c.price}(${c.priceChangePct > 0 ? '+' : ''}${c.priceChangePct}%)`)
          .join(', ')

        const aiData = await generateJSON(commoditySignalsPrompt(priceContext), 'en')
        signals = (aiData as {signals: unknown}).signals || []
        signalsCache = { data: signals, time: now }
      } catch { signals = [] }
    } else {
      signals = signalsCache.data
    }

    return NextResponse.json({ data, signals })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
