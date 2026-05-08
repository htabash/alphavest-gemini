import { NextRequest, NextResponse } from 'next/server'
import { getQuote } from '@/lib/market'

export async function GET(req: NextRequest) {
  try {
    const ticker = req.nextUrl.searchParams.get('ticker')
    if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

    const quote = await getQuote(ticker.toUpperCase())
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ticker: quote.ticker,
      price: quote.price,
      priceChange: quote.priceChange,
      priceChangePct: quote.priceChangePct,
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
