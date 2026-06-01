import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const ExcelJS = require('exceljs')

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('SAPKEY Products')
    ws.views = [{ rightToLeft: true }]

    ws.columns = [
      { header: 'Item Code', key: 'item_code', width: 22 },
      { header: 'اسم الصنف', key: 'item_name_ar', width: 45 },
      { header: 'التصنيف', key: 'category_ar', width: 25 },
      { header: 'بلد المنشأ', key: 'origin_ar', width: 22 },
      { header: 'الشهادات', key: 'certificates', width: 35 },
      { header: 'سعر التكلفة', key: 'cost_price', width: 15 },
      { header: 'هامش الربح %', key: 'admin_margin_pct', width: 14 },
      { header: 'سعر البيع', key: 'selling_price', width: 15 },
    ]

    // Generate sample data for the Excel
    const { generateInfiniteSeed } = await import('@/lib/seed')
    const { products } = generateInfiniteSeed(200)
    products.forEach(p => ws.addRow(p))

    // Style header
    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }
    headerRow.height = 30

    // Add hidden sheet for dropdown validation
    const hiddenWs = workbook.addWorksheet('_Lists')
    hiddenWs.state = 'hidden'
    const categories = ['معدات وأدوات بترول (PET)', 'مهمات الأمن الصناعي (HSE)', 'لوازم وعدد ورش (WRK)', 'أدوات مكتبية (OFF)']
    const origins = ['ألمانيا (مستورد توكيل)', 'أمريكا (توكيل مباشر)', 'إيطاليا (مستورد)', 'محلي (مصنع معتمد)']
    categories.forEach((c, i) => hiddenWs.getCell(`A${i+1}`).value = c)
    origins.forEach((o, i) => hiddenWs.getCell(`B${i+1}`).value = o)

    // Protect sheet
    ws.protect('SupabaseGafi2026', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    })

    // Unlock editable cells (cost and margin columns)
    for (let i = 2; i <= products.length + 1; i++) {
      ws.getCell(`F${i}`).protection = { locked: false }
      ws.getCell(`G${i}`).protection = { locked: false }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="SAPKEY_Products_${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
