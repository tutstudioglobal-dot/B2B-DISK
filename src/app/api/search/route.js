import { NextResponse } from 'next/server'
import { generateInfiniteSeed } from '@/lib/seed'

// In-memory search index (built once, reused)
let searchIndex = null
function getSearchIndex() {
  if (!searchIndex) {
    const result = generateInfiniteSeed(100000)
    searchIndex = result.products
  }
  return searchIndex
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const cat = searchParams.get('cat') || ''
  const sort = searchParams.get('sort') || ''
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let products = getSearchIndex()
    const ql = q.toLowerCase()

    // Filter
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

    // Sort
    if (sort === 'cost_asc') products.sort((a, b) => a.cost_price - b.cost_price)
    else if (sort === 'cost_desc') products.sort((a, b) => b.cost_price - a.cost_price)
    else products.sort((a, b) => a.item_code.localeCompare(b.item_code))

    const total = products.length
    const results = products.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: results,
      total,
      limit,
      offset,
      elapsed: 0,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
