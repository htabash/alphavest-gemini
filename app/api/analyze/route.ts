import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { analyzePrompt } from '@/lib/prompts'
import { getQuote } from '@/lib/market'

const cache = new Map<string, { data: unknown; time: number }>()
const CACHE_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { ticker, lang, signal: originalSignal } = await req.json()
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

    const sym = ticker.toUpperCase()
    const cacheKey = `${sym}-${lang || 'en'}-${originalSignal || 'query'}`
    const now = Date.now()

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!
      if (now - cached.time < CACHE_MS) {
        const data = { ...(cached.data as Record<string, unknown>) }
        const quote = await getQuote(sym)
        if (quote) {
          data.price          = quote.price
          data.priceChange    = quote.priceChange
          data.priceChangePct = quote.priceChangePct
          data.open           = quote.open
          data.high           = quote.high
          data.low            = quote.low
          data.volume         = quote.volume
          data.avgVolume      = quote.avgVolume
          if (quote.history1M.length > 0) {
            data.historicalPrices = {
              '1M': quote.history1M,
              '3M': quote.history3M.length > 0 ? quote.history3M : quote.history1M,
              '6M': quote.history6M.length > 0 ? quote.history6M : quote.history1M,
              '1Y': quote.history1Y.length > 0 ? quote.history1Y : quote.history1M,
            }
          }
          const p = quote.price
          const sig = (originalSignal || data.signal as string)?.toLowerCase() || ''
          const isSell = sig.includes('sell')
          const isHold = sig.includes('hold')
          if (isSell) {
            data.entry    = `$${Math.round(p * 1.01)}-${Math.round(p * 1.03)}`
            data.stopLoss = `$${Math.round(p * 1.06)}`
            data.target1  = `$${Math.round(p * 0.90)}`
            data.target2  = `$${Math.round(p * 0.82)}`
          } else if (isHold) {
            data.entry    = `$${Math.round(p * 0.98)}-${Math.round(p * 1.02)}`
            data.stopLoss = `$${Math.round(p * 0.93)}`
            data.target1  = `$${Math.round(p * 1.07)}`
            data.target2  = `$${Math.round(p * 1.12)}`
          } else {
            data.entry    = `$${Math.round(p * 0.97)}-${Math.round(p * 1.01)}`
            data.stopLoss = `$${Math.round(p * 0.94)}`
            data.target1  = `$${Math.round(p * 1.10)}`
            data.target2  = `$${Math.round(p * 1.18)}`
          }
        }
        return NextResponse.json(data)
      }
    }

    const quote = await getQuote(sym)
    const realPrice = quote?.price && quote.price > 0 ? quote.price : undefined

    // ✅ أرسل الـ lang للـ generateJSON
    const aiData = await generateJSON(
      analyzePrompt(sym, lang || 'en', realPrice, originalSignal || undefined),
      lang || 'en'
    )
    const data = aiData as Record<string, unknown>

    if (originalSignal) data.signal = originalSignal

    if (quote) {
      data.price          = quote.price
      data.priceChange    = quote.priceChange
      data.priceChangePct = quote.priceChangePct
      data.open           = quote.open
      data.high           = quote.high
      data.low            = quote.low
      data.volume         = quote.volume
      data.avgVolume      = quote.avgVolume
      data.week52High     = quote.week52High
      data.week52Low      = quote.week52Low
      data.marketCap      = quote.marketCap
      data.beta           = quote.beta ?? data.beta
      if (quote.history1M.length > 0) {
        data.historicalPrices = {
          '1M': quote.history1M,
          '3M': quote.history3M.length > 0 ? quote.history3M : quote.history1M,
          '6M': quote.history6M.length > 0 ? quote.history6M : quote.history1M,
          '1Y': quote.history1Y.length > 0 ? quote.history1Y : quote.history1M,
        }
      }
      const fm = data.fundamentals as Record<string, unknown>
      if (fm && quote.pe)  fm.pe  = quote.pe
      if (fm && quote.eps) fm.eps = `$${quote.eps}`
    }

    const p = quote?.price || 0
    if (p > 0) {
      const sig = (originalSignal || data.signal as string)?.toLowerCase() || ''
      const isSell = sig.includes('sell')
      const isHold = sig.includes('hold')
      if (isSell) {
        data.entry    = `$${Math.round(p * 1.01)}-${Math.round(p * 1.03)}`
        data.stopLoss = `$${Math.round(p * 1.06)}`
        data.target1  = `$${Math.round(p * 0.90)}`
        data.target2  = `$${Math.round(p * 0.82)}`
      } else if (isHold) {
        data.entry    = `$${Math.round(p * 0.98)}-${Math.round(p * 1.02)}`
        data.stopLoss = `$${Math.round(p * 0.93)}`
        data.target1  = `$${Math.round(p * 1.07)}`
        data.target2  = `$${Math.round(p * 1.12)}`
      } else {
        data.entry    = `$${Math.round(p * 0.97)}-${Math.round(p * 1.01)}`
        data.stopLoss = `$${Math.round(p * 0.94)}`
        data.target1  = `$${Math.round(p * 1.10)}`
        data.target2  = `$${Math.round(p * 1.18)}`
      }
    }

    cache.set(cacheKey, { data, time: now })
    return NextResponse.json(data)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
