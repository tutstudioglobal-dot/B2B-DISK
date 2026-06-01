export function generateInfiniteSeed(total, batchSize = 5000) {
  const products = []
  const priceHistory = []
  const consumptionAnalytics = []
  let inserted = 0

  while (inserted < total) {
    const limit = Math.min(batchSize, total - inserted)
    for (let i = 0; i < limit; i++) {
      inserted++
      let cat, sub, prefix, origin, supply, certs, baseCost, margin, rank, annual, freq, avgVal

      if (inserted % 4 === 0) {
        cat = { ar: 'معدات وأدوات بترول (PET)', en: 'Petroleum Equipment (PET)' }
        sub = { ar: 'محابس وصمامات ضغط ثقيل خطوط', en: 'Heavy Valves & Fittings' }
        prefix = 'PET-VALV-'
        origin = { ar: 'ألمانيا (مستورد توكيل)', en: 'Germany (Authorized Importer)' }
        supply = { ar: 'استيراد خارجي ألماني', en: 'German Import' }
        certs = 'API 6D / ASME B16.34'
        baseCost = 4000 + (inserted * 0.1)
        margin = 25
        rank = 3; annual = 15000; freq = 45; avgVal = 180000
      } else if (inserted % 4 === 1) {
        cat = { ar: 'مهمات الأمن الصناعي والسلامة (HSE)', en: 'Industrial Safety (HSE)' }
        sub = { ar: 'أحذية سلامة وعوازل صدمات كهربائية', en: 'Safety Boots & Insulators' }
        prefix = 'HSE-SH-'
        origin = { ar: 'أمريكا (توكيل مباشر)', en: 'USA (Direct Agency)' }
        supply = { ar: 'استيراد خارجي', en: 'Foreign Import' }
        certs = 'ANSI Z87.1 / CE EN ISO 20345'
        baseCost = 450 + (inserted * 0.02)
        margin = 40
        rank = 1; annual = 45000; freq = 7; avgVal = 95000
      } else if (inserted % 4 === 2) {
        cat = { ar: 'لوازم وعدد الورش والمستهلكات (WRK)', en: 'Workshop Supplies (WRK)' }
        sub = { ar: 'أقراص قطع وتجليخ ومستلزمات صيانة', en: 'Cutting/Grinding Discs' }
        prefix = 'WRK-DISC-'
        origin = { ar: 'إيطاليا (مستورد)', en: 'Italy (Imported)' }
        supply = { ar: 'استيراد خارجي', en: 'Foreign Import' }
        certs = 'EN 12413 / CE Quality'
        baseCost = 35 + (inserted * 0.005)
        margin = 50
        rank = 2; annual = 120000; freq = 3; avgVal = 50000
      } else {
        cat = { ar: 'الأدوات المكتبية والورقيات والأحبار (OFF)', en: 'Office Supplies (OFF)' }
        sub = { ar: 'ورقيات ومطبوعات وأحبار ليزر', en: 'Papers, Prints & Toners' }
        prefix = 'OFF-PAPR-'
        origin = { ar: 'محلي (مصنع معتمد)', en: 'Local (Certified Factory)' }
        supply = { ar: 'توريد داخلي محلي', en: 'Local Supply' }
        certs = 'ISO 9001 / Egyptian Standards'
        baseCost = 150 + (inserted * 0.01)
        margin = 20
        rank = 4; annual = 20000; freq = 15; avgVal = 35000
      }

      const itemCode = `${prefix}REG-${100000 + inserted}`
      const now = new Date().toISOString()
      const prodId = `prod-${inserted}`

      products.push({
        id: prodId,
        item_code: itemCode,
        item_name_ar: `صنف توريد بترولي تخصصي فئة ${sub.ar} كود رقم ${1000 + inserted}`,
        item_name_en: `Petroleum Supply Item - ${sub.en} Code ${1000 + inserted}`,
        category_id: prefix.split('-')[0],
        category_ar: cat.ar,
        category_en: cat.en,
        sub_category_ar: sub.ar,
        sub_category_en: sub.en,
        unit_ar: 'قطعة', unit_en: 'Piece',
        origin_ar: origin.ar, origin_en: origin.en,
        supply_type_ar: supply.ar, supply_type_en: supply.en,
        certificates: certs,
        cost_price: Math.round(baseCost * 100) / 100,
        admin_margin_pct: margin,
        selling_price: Math.ceil(baseCost * (1 + margin / 100)),
        cat_color: prefix.startsWith('PET') ? '#0ECB81' : prefix.startsWith('HSE') ? '#1E80FF' : prefix.startsWith('WRK') ? '#FF6B2B' : '#A66CFF',
        created_at: now, updated_at: now,
      })

      priceHistory.push(
        { id: `ph-${inserted}-1`, product_id: prodId, item_code: itemCode, old_cost_price: Math.round(baseCost * 0.75 * 100) / 100, new_cost_price: Math.round(baseCost * 0.85 * 100) / 100, change_month: 3, change_year: 2024, reason_for_change: 'تسجيل مالي تاريخي 2024' },
        { id: `ph-${inserted}-2`, product_id: prodId, item_code: itemCode, old_cost_price: Math.round(baseCost * 0.85 * 100) / 100, new_cost_price: Math.round(baseCost * 100) / 100, change_month: 9, change_year: 2025, reason_for_change: 'تحديث أسعار 2025' },
        { id: `ph-${inserted}-3`, product_id: prodId, item_code: itemCode, old_cost_price: Math.round(baseCost * 100) / 100, new_cost_price: Math.round(baseCost * (1 + margin / 100) * 100) / 100, change_month: 5, change_year: 2026, reason_for_change: 'الأسعار النهائية 2026' }
      )

      consumptionAnalytics.push({
        id: `ca-${inserted}`,
        product_id: prodId, item_code: itemCode,
        demand_rank: rank, annual_consumption_qty: annual,
        order_frequency_days: freq, average_order_value: avgVal,
      })
    }
  }

  return { products, priceHistory, consumptionAnalytics, totalGenerated: inserted }
}
