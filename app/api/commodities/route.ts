import { NextResponse } from 'next/server'
import { getAllCommodities } from '@/lib/market'
import { generateJSON } from '@/lib/groq'

let cache: { data: unknown; time: number } | null = null
let signalsCache: { data: unknown; time: number } | null = null
const CACHE_MS = 5 * 60 * 1000
const SIGNALS_CACHE_MS = 30 * 60 * 1000

function commoditySignalsPrompt(priceContext: string): string {
  return `You are a professional commodities trader analyzing May 2026 markets.

CURRENT REAL PRICES: ${priceContext}

Analyze each commodity and return trading signals. Return ONLY valid JSON:
{
  "signals": [
    {
      "symbol": "GC=F",
      "signal": "buy",
      "confidence": 78,
      "reasoning": "Gold holding above key support with safe-haven demand rising.",
      "catalyst": "Fed uncertainty + geopolitical tensions"
    }
  ]
}

RULES:
- Analyze ALL symbols provided
- signal: ONLY "buy" | "sell" | "hold"
- confidence: integer 60-95
- reasoning: 1-2 sentences with specific price level
- catalyst: short phrase
- Generate realistic mix: 3-4 hold, 3-4 buy, 2-3 sell
- Only generate buy/sell for high conviction setups (confidence > 70)
- Do NOT include entry/stopLoss/target — these will be calculated from real prices
- Return exactly one signal per symbol`
}

export async function GET() {
  try {
    const now = Date.now()

    if (cache && (now - cache.time) < CACHE_MS) {
      const signals = signalsCache && (now - signalsCache.time) < SIGNALS_CACHE_MS
        ? signalsCache.data
        : null
      return NextResponse.json({ data: cache.data, signals })
    }

    const data = await getAllCommodities()
    cache = { data, time: now }

    let signals = null

    if (!signalsCache || (now - signalsCache.time) >= SIGNALS_CACHE_MS) {
      try {
        const priceContext = (data as Array<{ symbol: string; price: number; priceChangePct: number }>)
          .map(c => `${c.symbol}=$${c.price}(${c.priceChangePct >= 0 ? '+' : ''}${c.priceChangePct}%)`)
          .join(', ')

        const aiData = await generateJSON(commoditySignalsPrompt(priceContext), 'en')
        const rawSignals = ((aiData as { signals?: unknown[] }).signals || []) as Array<Record<string, unknown>>

        const priceMap = new Map(
          (data as Array<{ symbol: string; price: number }>).map(d => [d.symbol, d.price])
        )

        signals = rawSignals.map(sig => {
          const realPrice = priceMap.get(sig.symbol as string)
          if (!realPrice || sig.signal === 'hold') {
            return {
              ...sig,
              entry: realPrice || 0,
              stopLoss: null,
              target1: null,
              target2: null,
              quantity: 1,
            }
          }

          const isSell = sig.signal === 'sell'

          return {
            ...sig,
            quantity: 1,
            entry:    +( isSell ? realPrice * 1.005 : realPrice * 0.995 ).toFixed(3),
            stopLoss: +( isSell ? realPrice * 1.030 : realPrice * 0.970 ).toFixed(3),
            target1:  +( isSell ? realPrice * 0.960 : realPrice * 1.040 ).toFixed(3),
            target2:  +( isSell ? realPrice * 0.930 : realPrice * 1.080 ).toFixed(3),
          }
        })

        signalsCache = { data: signals, time: now }

      } catch (e) {
        console.error('[Commodities] AI signals error:', e)
        signals = []
      }
    } else {
      signals = signalsCache.data
    }

    return NextResponse.json({ data, signals })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
