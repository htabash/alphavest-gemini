import { NextRequest, NextResponse } from 'next/server'
import { getQuote, getCommodityQuote } from '@/lib/market'

// ✅ خريطة تحويل الرموز البديلة للرموز الصحيحة
const SYMBOL_MAP: Record<string, string> = {
  // الذهب
  'XAUUSD': 'GC=F', 'GOLD': 'GC=F', 'XAU': 'GC=F',
  // الفضة
  'XAGUSD': 'SI=F', 'SILVER': 'SI=F', 'XAG': 'SI=F',
  // البلاتين
  'XPTUSD': 'PL=F', 'PLATINUM': 'PL=F', 'XPT': 'PL=F',
  // النحاس
  'XCUUSD': 'HG=F', 'COPPER': 'HG=F',
  // النفط
  'USOIL': 'CL=F', 'WTI': 'CL=F', 'CRUDE': 'CL=F', 'OIL': 'CL=F',
  'UKOIL': 'BZ=F', 'BRENT': 'BZ=F',
  // الغاز
  'NATGAS': 'NG=F', 'GAS': 'NG=F', 'NATURALGAS': 'NG=F',
  // الزراعة
  'WHEAT': 'ZW=F', 'CORN': 'ZC=F', 'SOYBEAN': 'ZS=F', 'SOYBEANS': 'ZS=F',
}

// ✅ السلع التي تحتاج getCommodityQuote
const COMMODITY_SYMBOLS = new Set([
  'GC=F', 'SI=F', 'PL=F', 'HG=F',
  'CL=F', 'BZ=F', 'NG=F',
  'ZW=F', 'ZC=F', 'ZS=F',
])

export async function GET(req: NextRequest) {
  try {
    const ticker = req.nextUrl.searchParams.get('ticker')
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

    // ✅ تحويل الرمز البديل للرمز الصحيح
    const raw = ticker.toUpperCase().trim()
    const mapped = SYMBOL_MAP[raw] || raw
    const displayTicker = raw // نعرض الرمز الأصلي الذي كتبه المستخدم

    let price = 0
    let priceChange = 0
    let priceChangePct = 0

    if (COMMODITY_SYMBOLS.has(mapped)) {
      // ✅ سلعة — استخدم getCommodityQuote
      const quote = await getCommodityQuote(mapped)
      if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      price = quote.price
      priceChange = quote.priceChange
      priceChangePct = quote.priceChangePct
    } else {
      // ✅ سهم عادي — استخدم getQuote
      const quote = await getQuote(mapped)
      if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      price = quote.price
      priceChange = quote.priceChange
      priceChangePct = quote.priceChangePct
    }

    return NextResponse.json({
      ticker: displayTicker,
      mappedTicker: mapped !== raw ? mapped : undefined,
      price,
      priceChange,
      priceChangePct,
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
