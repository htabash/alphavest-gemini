import { NextResponse } from 'next/server'
import { getAllCommodities } from '@/lib/market'

let cache: { data: unknown; time: number } | null = null
const CACHE_MS = 5 * 60 * 1000 // 5 دقائق

export async function GET() {
  try {
    const now = Date.now()
    if (cache && (now - cache.time) < CACHE_MS) {
      return NextResponse.json({ data: cache.data })
    }
    const data = await getAllCommodities()
    cache = { data, time: now }
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
