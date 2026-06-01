import { NextResponse } from 'next/server'
import { calculateComprehensivePricing } from '@/lib/pricing'

export async function POST(request) {
  try {
    const body = await request.json()
    const { costPrice, adminMarginPct, options } = body

    if (costPrice === undefined || adminMarginPct === undefined) {
      return NextResponse.json({ success: false, error: 'costPrice and adminMarginPct are required' }, { status: 400 })
    }

    const result = calculateComprehensivePricing(costPrice, adminMarginPct, options)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
