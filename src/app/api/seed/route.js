import { NextResponse } from 'next/server'
import { generateInfiniteSeed } from '@/lib/seed'

export async function POST(request) {
  try {
    const body = await request.json()
    const total = body.total || 10000
    const batchSize = body.batchSize || 1000

    const result = generateInfiniteSeed(total, batchSize)

    return NextResponse.json({
      success: true,
      totalGenerated: result.totalGenerated,
      products: result.products,
      priceHistory: result.priceHistory,
      consumptionAnalytics: result.consumptionAnalytics,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
