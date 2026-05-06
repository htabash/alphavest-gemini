import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/groq'
import { analyzePrompt } from '@/lib/prompts'
import { getQuote } from '@/lib/market'

export async function POST(req: NextRequest) {
  try {
    const { ticker, lang } = await req.json()
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

    const sym = ticker.toUpperCase()

    // ✅ الخطوة 1: اجلب السعر الحقيقي أولاً
    const quote = await getQuote(sym)
    const realPrice = quote?.price && quote.price > 0 ? quote.price : undefined

    // ✅ الخطوة 2: أرسل السعر للـ AI حتى يحسب Entry/Stop/Target بشكل صحيح
    const aiData = await generateJSON(analyzePrompt(sym, lang || 'en', realPrice))

    const data = aiData as Record<string, unknown>

    // ✅ الخطوة 3: override بالبيانات الحقيقية من market API
    if (quote) {
      data.price        = quote.price
      data.priceChange  = quote.priceChange
      data.priceChangePct = quote.priceChangePct
      data.open         = quote.open
      data.high         = quote.high
      data.low          = quote.low
      data.volume       = quote.volume
      data.avgVolume    = quote.avgVolume
      data.week52High   = quote.week52High
      data.week52Low    = quote.week52Low
      data.marketCap    = quote.marketCap
      data.beta         = quote.beta ?? data.beta

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

    // ✅ الخطوة 4: تحقق من Entry/Stop/Target — لا تُرجع معادلات
    if (realPrice) {
      const tradeSetup = {
        entry:    data.entry    as string,
        stopLoss: data.stopLoss as string,
        target1:  data.target1  as string,
        target2:  data.target2  as string,
      }
      // إذا أي قيمة تحتوي على "*" أو "price" → احسبها مباشرة
      if (JSON.stringify(tradeSetup).match(/\*|price/i)) {
        data.entry    = `$${Math.round(realPrice * 0.97)}-${Math.round(realPrice * 1.01)}`
        data.stopLoss = `$${Math.round(realPrice * 0.94)}`
        data.target1  = `$${Math.round(realPrice * 1.10)}`
        data.target2  = `$${Math.round(realPrice * 1.18)}`
      }
    }

    return NextResponse.json(data)

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
