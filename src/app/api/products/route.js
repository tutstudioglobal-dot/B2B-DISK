import { NextResponse } from 'next/server'
import { generateInfiniteSeed } from '@/lib/seed'

let cachedProducts = null

function getProducts() {
  if (!cachedProducts) {
    const result = generateInfiniteSeed(10000)
    cachedProducts = result.products
  }
  return cachedProducts
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const cat = searchParams.get('cat') || ''
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let products = getProducts()
    const ql = q.toLowerCase()

    if (q || cat) {
      products = products.filter(p => {
        if (cat && p.category_id !== cat) return false
        if (q) {
          return p.item_code.toLowerCase().includes(ql) ||
            p.item_name_ar.includes(q) ||
            p.item_name_en.toLowerCase().includes(ql)
        }
        return true
      })
    }

    const total = products.length
    const results = products.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: results,
      total,
      limit,
      offset,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
