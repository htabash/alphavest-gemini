import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { analyzePrompt } from '@/lib/prompts'
import { getQuote } from '@/lib/market'

// ✅ Cache لكل سهم لمدة ساعة
const cache = new Map<string, { data: unknown; time: number }>()
const CACHE_MS = 60 * 60 * 1000 // ساعة واحدة

export async function POST(req: NextRequest) {
  try {
    const { ticker, lang } = await req.json()
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

    const sym = ticker.toUpperCase()
    const cacheKey = `${sym}-${lang || 'en'}`
    const now = Date.now()

    // ✅ إذا الكاش صالح — حدّث السعر فقط بدون استدعاء AI
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!
      if (now - cached.time < CACHE_MS) {
        const data = { ...(cached.data as Record<string, unknown>) }

        // تحديث السعر الحقيقي فقط
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

          // ✅ تحديث Entry/Stop/Target بناءً على السعر الجديد
          const p = quote.price
          const signal = (data.signal as string)?.toLowerCase() || ''
          const isSell = signal.includes('sell')
          const isHold = signal.includes('hold')

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

          // ✅ تحديث الرسم البياني إذا متوفر
          if (quote.history1M.length > 0) {
            data.historicalPrices = {
              '1M': quote.history1M,
              '3M': quote.history3M.length > 0 ? quote.history3M : quote.history1M,
              '6M': quote.history6M.length > 0 ? quote.history6M : quote.history1M,
              '1Y': quote.history1Y.length > 0 ? quote.history1Y : quote.history1M,
            }
          }
        }

        return NextResponse.json(data)
      }
    }

    // ✅ الخطوة 1: جلب السعر الحقيقي أولاً
    const quote = await getQuote(sym)
    const realPrice = quote?.price && quote.price > 0 ? quote.price : undefined

    // ✅ الخطوة 2: استدعاء AI مع السعر الحقيقي
    const aiData = await generateJSON(analyzePrompt(sym, lang || 'en', realPrice))
    const data = aiData as Record<string, unknown>

    // ✅ الخطوة 3: Override بالبيانات الحقيقية
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

    // ✅ الخطوة 4: Override Entry/Stop/Target
    const p = quote?.price || 0
    if (p > 0) {
      const signal = (data.signal as string)?.toLowerCase() || ''
      const isSell = signal.includes('sell')
      const isHold = signal.includes('hold')

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

    // ✅ الخطوة 5: حفظ في الكاش
    cache.set(cacheKey, { data, time: now })

    return NextResponse.json(data)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
