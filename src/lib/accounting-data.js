export const COA = [
  { code: '1.1.1', name_ar: 'النقدية بالخزينة', cat: 'asset', sub: 'current' },
  { code: '1.1.2', name_ar: 'النقدية بالبنك — جاري', cat: 'asset', sub: 'current' },
  { code: '1.1.3', name_ar: 'أوراق قبض', cat: 'asset', sub: 'current' },
  { code: '1.1.4', name_ar: 'العملاء', cat: 'asset', sub: 'current' },
  { code: '1.1.5', name_ar: 'مخازن — خامات', cat: 'asset', sub: 'current' },
  { code: '1.1.6', name_ar: 'مخازن — تام', cat: 'asset', sub: 'current' },
  { code: '1.1.7', name_ar: 'مخازن — تحت التشغيل', cat: 'asset', sub: 'current' },
  { code: '1.1.8', name_ar: 'أصول متداولة أخرى', cat: 'asset', sub: 'current' },
  { code: '1.2.1', name_ar: 'أراضي', cat: 'asset', sub: 'noncurrent' },
  { code: '1.2.2', name_ar: 'مباني', cat: 'asset', sub: 'noncurrent' },
  { code: '1.2.3', name_ar: 'آلات ومعدات', cat: 'asset', sub: 'noncurrent' },
  { code: '1.2.4', name_ar: 'سيارات', cat: 'asset', sub: 'noncurrent' },
  { code: '1.2.5', name_ar: 'أثاث', cat: 'asset', sub: 'noncurrent' },
  { code: '1.2.6', name_ar: 'أجهزة حاسب آلي', cat: 'asset', sub: 'noncurrent' },
  { code: '1.2.7', name_ar: 'مجمع إهلاك المباني', cat: 'asset', sub: 'noncurrent', contra: true },
  { code: '1.2.8', name_ar: 'مجمع إهلاك الآلات', cat: 'asset', sub: 'noncurrent', contra: true },
  { code: '1.2.9', name_ar: 'مجمع إهلاك السيارات', cat: 'asset', sub: 'noncurrent', contra: true },
  { code: '1.2.10', name_ar: 'مجمع إهلاك الأثاث', cat: 'asset', sub: 'noncurrent', contra: true },
  { code: '1.2.11', name_ar: 'مجمع إهلاك الحاسب الآلي', cat: 'asset', sub: 'noncurrent', contra: true },
  { code: '1.2.12', name_ar: 'أصول غير متداولة أخرى', cat: 'asset', sub: 'noncurrent' },
  { code: '2.1.1', name_ar: 'الموردون', cat: 'liability', sub: 'current' },
  { code: '2.1.2', name_ar: 'أوراق دفع', cat: 'liability', sub: 'current' },
  { code: '2.1.3', name_ar: 'ضرائب مستحقة', cat: 'liability', sub: 'current' },
  { code: '2.1.4', name_ar: 'أتعاب محاماة', cat: 'liability', sub: 'current' },
  { code: '2.1.5', name_ar: 'أتعاب مراجعة', cat: 'liability', sub: 'current' },
  { code: '2.1.6', name_ar: 'مخصصات عامة', cat: 'liability', sub: 'current' },
  { code: '2.1.7', name_ar: 'دائنون آخرون', cat: 'liability', sub: 'current' },
  { code: '2.2.1', name_ar: 'قروض طويلة الأجل', cat: 'liability', sub: 'noncurrent' },
  { code: '2.2.2', name_ar: 'مخصصات طويلة الأجل', cat: 'liability', sub: 'noncurrent' },
  { code: '2.2.3', name_ar: 'التزامات غير متداولة أخرى', cat: 'liability', sub: 'noncurrent' },
  { code: '3.1', name_ar: 'رأس المال', cat: 'equity', sub: '' },
  { code: '3.2', name_ar: 'احتياطي قانوني', cat: 'equity', sub: '' },
  { code: '3.3', name_ar: 'أرباح / خسائر مرحلة', cat: 'equity', sub: '' },
  { code: '3.4', name_ar: 'صافي الدخل / (الخسارة)', cat: 'equity', sub: '', netIncome: true },
  { code: '4.1', name_ar: 'إيرادات النشاط', cat: 'revenue', sub: '' },
  { code: '4.2', name_ar: 'إيرادات أخرى', cat: 'revenue', sub: '' },
  { code: '4.3', name_ar: 'مردودات وخصم مسموح به', cat: 'revenue', sub: 'contra' },
  { code: '5.1.1', name_ar: 'تكلفة المبيعات — خامات', cat: 'expense', sub: 'cogs' },
  { code: '5.1.2', name_ar: 'تكلفة المبيعات — أجور مباشرة', cat: 'expense', sub: 'cogs' },
  { code: '5.2.1', name_ar: 'رواتب ومرتبات', cat: 'expense', sub: 'admin' },
  { code: '5.2.2', name_ar: 'صيانة ونظافة', cat: 'expense', sub: 'admin' },
  { code: '5.2.3', name_ar: 'إيجار', cat: 'expense', sub: 'admin' },
  { code: '5.2.4', name_ar: 'كهرباء ومياه وغاز', cat: 'expense', sub: 'admin' },
  { code: '5.2.5', name_ar: 'تليفونات', cat: 'expense', sub: 'admin' },
  { code: '5.2.6', name_ar: 'نثريات ومصروفات نقدية', cat: 'expense', sub: 'admin' },
  { code: '5.2.7', name_ar: 'دعاية وإعلان', cat: 'expense', sub: 'marketing' },
  { code: '5.2.8', name_ar: 'مصروفات سفر', cat: 'expense', sub: 'admin' },
  { code: '5.2.9', name_ar: 'مصروفات سيارة', cat: 'expense', sub: 'admin' },
  { code: '5.2.10', name_ar: 'مصروفات عمومية أخرى', cat: 'expense', sub: 'admin' },
  { code: '5.3.1', name_ar: 'مصروفات تمويل', cat: 'expense', sub: 'financial' },
  { code: '5.4.1', name_ar: 'إهلاك المباني', cat: 'expense', sub: 'depreciation' },
  { code: '5.4.2', name_ar: 'إهلاك الآلات', cat: 'expense', sub: 'depreciation' },
  { code: '5.4.3', name_ar: 'إهلاك السيارات', cat: 'expense', sub: 'depreciation' },
  { code: '5.4.4', name_ar: 'إهلاك الأثاث', cat: 'expense', sub: 'depreciation' },
  { code: '5.4.5', name_ar: 'إهلاك الحاسب الآلي', cat: 'expense', sub: 'depreciation' },
  { code: '5.5.1', name_ar: 'مصروفات أخرى', cat: 'expense', sub: 'other' },
]

export function getAccName(code) {
  const a = COA.find(c => c.code === code)
  return a ? a.name_ar : code
}

let JE = []
let trialData = []
let balanceData = []
let depreciationData = []
let notesData = []
let settings = {
  companyName: 'SAPKEY للتوريدات البترولية',
  fiscalYear: '31 ديسمبر 2024',
  cfoName: '', chairmanName: '', auditorName: '',
}

const STORAGE_KEY = 'sapkey_accounting'

export function loadAccountingData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      JE = d.JE || []
      trialData = d.trialData || []
      balanceData = d.balanceData || []
      depreciationData = d.depreciationData || []
      notesData = d.notesData || []
      settings = d.settings || settings
    }
  } catch {}
  if (!JE.length) initSeedData()
}

export function saveAccountingData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ JE, trialData, balanceData, depreciationData, notesData, settings }))
  } catch {}
}

export function getJE() { return JE }
export function getTrialData() { return trialData }
export function getBalanceData() { return balanceData }
export function getDepreciationData() { return depreciationData }
export function getNotesData() { return notesData }
export function getSettings() { return settings }

export function addJournalEntry(entry) {
  JE.push(entry)
  saveAccountingData()
}

export function updateSettings(s) {
  settings = { ...settings, ...s }
  saveAccountingData()
}

function initSeedData() {
  JE = [
    { id: 'J001', date: '2024-01-01', ref: 'J001', desc: 'قيد افتتاحي — رأس المال',
      lines: [
        { account: '1.1.2', debit: 2568252, credit: 0 },
        { account: '3.1', debit: 0, credit: 2568252 },
      ]},
    { id: 'J002', date: '2024-01-15', ref: 'J002', desc: 'سداد موردين',
      lines: [
        { account: '2.1.1', debit: 45000, credit: 0 },
        { account: '1.1.2', debit: 0, credit: 45000 },
      ]},
    { id: 'J003', date: '2024-02-01', ref: 'J003', desc: 'مبيعات آجلة',
      lines: [
        { account: '1.1.4', debit: 350000, credit: 0 },
        { account: '4.1', debit: 0, credit: 350000 },
      ]},
    { id: 'J004', date: '2024-02-15', ref: 'J004', desc: 'صرف رواتب',
      lines: [
        { account: '5.2.1', debit: 85000, credit: 0 },
        { account: '1.1.2', debit: 0, credit: 85000 },
      ]},
    { id: 'J005', date: '2024-03-01', ref: 'J005', desc: 'مشتريات خامات',
      lines: [
        { account: '1.1.5', debit: 120000, credit: 0 },
        { account: '2.1.1', debit: 0, credit: 120000 },
      ]},
  ]

  trialData = [
    { id: 1, name_ar: 'الأصول المتداولة', isSection: true },
    { id: 2, name_ar: 'النقدية بالبنك — جاري', openDr: 2568252, openCr: 0, movDr: 0, movCr: 130000, adjDr: 0, adjCr: 0 },
    { id: 3, name_ar: 'العملاء', openDr: 0, openCr: 0, movDr: 350000, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 4, name_ar: 'مخازن — خامات', openDr: 0, openCr: 0, movDr: 120000, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 5, name_ar: 'إجمالي الأصول المتداولة', isTotal: true },
    { id: 6, name_ar: 'الأصول غير المتداولة', isSection: true },
    { id: 7, name_ar: 'مباني', openDr: 500000, openCr: 0, movDr: 0, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 8, name_ar: 'مجمع إهلاك المباني', openDr: 0, openCr: 25000, movDr: 0, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 9, name_ar: 'إجمالي الأصول غير المتداولة', isTotal: true },
    { id: 10, name_ar: 'إجمالي الأصول', isGrandTotal: true },
    { id: 11, name_ar: 'الخصوم المتداولة', isSection: true },
    { id: 12, name_ar: 'الموردون', openDr: 0, openCr: 45000, movDr: 45000, movCr: 120000, adjDr: 0, adjCr: 0 },
    { id: 13, name_ar: 'إجمالي الخصوم المتداولة', isTotal: true },
    { id: 14, name_ar: 'الخصوم غير المتداولة', isSection: true },
    { id: 15, name_ar: 'قروض طويلة الأجل', openDr: 0, openCr: 200000, movDr: 0, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 16, name_ar: 'إجمالي الخصوم غير المتداولة', isTotal: true },
    { id: 17, name_ar: 'إجمالي الخصوم', isGrandTotal: true },
    { id: 18, name_ar: 'حقوق الملكية', isSection: true },
    { id: 19, name_ar: 'رأس المال', openDr: 0, openCr: 2568252, movDr: 0, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 20, name_ar: 'صافي الدخل / (الخسارة)', isNetIncome: true },
    { id: 21, name_ar: 'إجمالي حقوق الملكية', isTotal: true },
    { id: 22, name_ar: 'إجمالي الخصوم وحقوق الملكية', isGrandTotal: true },
    { id: 23, name_ar: 'الإيرادات', isSection: true },
    { id: 24, name_ar: 'إيرادات النشاط', openDr: 0, openCr: 0, movDr: 0, movCr: 350000, adjDr: 0, adjCr: 0 },
    { id: 25, name_ar: 'إجمالي الإيرادات', isTotal: true },
    { id: 26, name_ar: 'المصروفات', isSection: true },
    { id: 27, name_ar: 'رواتب ومرتبات', openDr: 0, openCr: 0, movDr: 85000, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 28, name_ar: 'إيجار', openDr: 0, openCr: 0, movDr: 15000, movCr: 0, adjDr: 0, adjCr: 0 },
    { id: 29, name_ar: 'إجمالي المصروفات', isTotal: true },
    { id: 30, name_ar: 'صافي الدخل', isGrandTotal: true },
  ]

  recalculateAll()

  balanceData = [
    { label_ar: 'الأصول', isHeader: true },
    { label_ar: 'الأصول المتداولة', isSubHeader: true },
    { label_ar: 'النقدية بالبنك', amt2023: 2438252, amt2022: 0, indent: 2 },
    { label_ar: 'العملاء', amt2023: 350000, amt2022: 0, indent: 2 },
    { label_ar: 'مخازن — خامات', amt2023: 120000, amt2022: 0, indent: 2 },
    { label_ar: 'إجمالي الأصول المتداولة', isSubTotal: true, amt2023: 2908252, amt2022: 0 },
    { label_ar: 'الأصول غير المتداولة', isSubHeader: true },
    { label_ar: 'مباني', amt2023: 500000, amt2022: 0, indent: 2 },
    { label_ar: '(-) مجمع إهلاك المباني', amt2023: -25000, amt2022: 0, indent: 2 },
    { label_ar: 'إجمالي الأصول غير المتداولة', isSubTotal: true, amt2023: 475000, amt2022: 0 },
    { label_ar: 'إجمالي الأصول', isGrandTotal: true, amt2023: 3383252, amt2022: 0 },
    { label_ar: 'الخصوم وحقوق الملكية', isHeader: true },
    { label_ar: 'الخصوم المتداولة', isSubHeader: true },
    { label_ar: 'الموردون', amt2023: 120000, amt2022: 0, indent: 2 },
    { label_ar: 'إجمالي الخصوم المتداولة', isSubTotal: true, amt2023: 120000, amt2022: 0 },
    { label_ar: 'الخصوم غير المتداولة', isSubHeader: true },
    { label_ar: 'قروض طويلة الأجل', amt2023: 200000, amt2022: 0, indent: 2 },
    { label_ar: 'إجمالي الخصوم غير المتداولة', isSubTotal: true, amt2023: 200000, amt2022: 0 },
    { label_ar: 'إجمالي الخصوم', isTotal: true, amt2023: 320000, amt2022: 0 },
    { label_ar: 'حقوق الملكية', isSubHeader: true },
    { label_ar: 'رأس المال', amt2023: 2568252, amt2022: 0, indent: 2 },
    { label_ar: 'صافي الدخل', amt2023: 250000, amt2022: 0, indent: 2 },
    { label_ar: 'إجمالي حقوق الملكية', isSubTotal: true, amt2023: 2818252, amt2022: 0 },
    { label_ar: 'إجمالي الخصوم وحقوق الملكية', isGrandTotal: true, amt2023: 3383252, amt2022: 0 },
  ]

  depreciationData = [
    { asset_ar: 'مباني', cost: 500000, rate_acc: 5, rate_tax: 5, years: 20, method: 'straight' },
    { asset_ar: 'آلات ومعدات', cost: 200000, rate_acc: 10, rate_tax: 10, years: 10, method: 'straight' },
    { asset_ar: 'سيارات', cost: 150000, rate_acc: 20, rate_tax: 20, years: 5, method: 'straight' },
  ]

  notesData = [
    { id: 1, title_ar: 'النشاط الرئيسي', content_ar: 'شركة مساهمة مصرية تعمل في مجال توريد المعدات البترولية وخدمات الطاقة.' },
    { id: 2, title_ar: 'أساس إعداد القوائم المالية', content_ar: 'تم إعداد القوائم المالية وفقاً لمعايير المحاسبة المصرية.' },
    { id: 3, title_ar: 'العملة المستخدمة', content_ar: 'الجنيه المصري (ج.م) هو عملة العرض والتقرير.' },
  ]

  saveAccountingData()
}

export function recalculateAll() {
  const row = id => trialData.find(r => r.id === id)
  const sum = (ids, field) => ids.reduce((s, id) => s + ((row(id)?.[field] || 0)), 0)

  // Current assets total (ids 2-4)
  if (row(5)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(5)[f] = sum([2,3,4], f)
    })
  }
  // Non-current assets total (ids 7-8)
  if (row(9)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(9)[f] = sum([7,8], f)
    })
  }
  // Total assets
  if (row(10)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(10)[f] = row(5)[f] + row(9)[f]
    })
  }
  // Current liabilities total (id 12)
  if (row(13)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(13)[f] = sum([12], f)
    })
  }
  // Non-current liabilities total (id 15)
  if (row(16)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(16)[f] = sum([15], f)
    })
  }
  // Total liabilities
  if (row(17)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(17)[f] = row(13)[f] + row(16)[f]
    })
  }
  // Revenue total (id 24)
  if (row(25)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(25)[f] = sum([24], f)
    })
  }
  // Expenses total (ids 27-28)
  if (row(29)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(29)[f] = sum([27,28], f)
    })
  }
  // Net income
  if (row(20) && row(25) && row(29)) {
    const revNet = row(25).movCr - row(25).movDr
    const expNet = row(29).movDr - row(29).movCr
    const ni = revNet - expNet
    row(20).openDr = ni < 0 ? Math.abs(ni) : 0
    row(20).openCr = ni >= 0 ? ni : 0
  }
  // Total equity (ids 19, 20)
  if (row(21)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(21)[f] = sum([19,20], f)
    })
  }
  // Grand total liabilities + equity
  if (row(22)) {
    ;['openDr', 'openCr', 'movDr', 'movCr', 'adjDr', 'adjCr'].forEach(f => {
      row(22)[f] = (row(17)?.[f] || 0) + (row(21)?.[f] || 0)
    })
  }
  // Net income grand total
  if (row(30)) {
    row(30).openDr = row(29).openDr + row(29).movDr
    row(30).openCr = row(25).openCr + row(25).movCr
  }
}

export function getBalClose(row) {
  const bal = row.openDr - row.openCr + row.movDr - row.movCr + row.adjDr - row.adjCr
  return { dr: bal > 0 ? bal : 0, cr: bal < 0 ? Math.abs(bal) : 0 }
}
