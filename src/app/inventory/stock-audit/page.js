'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import { t } from '@/lib/i18n'
import { getInventory, getAuditLogs, updateInventoryQuantity, updateInventoryItemCost, updateInventoryItemMargin, importInventoryFromExcel } from '@/lib/supabase'

export default function StockAuditPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [newAuditMode, setNewAuditMode] = useState(false)
  const [auditCounts, setAuditCounts] = useState({})
  const [file, setFile] = useState(null)
  const [importMsg, setImportMsg] = useState('')
  const [activeTab, setActiveTab] = useState('audit')
  const [editCostModal, setEditCostModal] = useState(null)
  const [editCostVal, setEditCostVal] = useState(0)
  const [editMarginVal, setEditMarginVal] = useState(0)
  const { lang } = useLang()

  useEffect(() => { loadData() }, [lang])

  async function loadData() {
    setLoading(true)
    const inv = await getInventory()
    const logs = await getAuditLogs()
    setItems(inv || [])
    setAuditLogs(logs || [])
    setLoading(false)
  }

  function startNewAudit() {
    setNewAuditMode(true)
    const counts = {}
    items.forEach(i => { counts[i.item_code] = i.quantity || 0 })
    setAuditCounts(counts)
  }

  async function saveAudit() {
    let changes = 0
    for (const [code, qty] of Object.entries(auditCounts)) {
      const item = items.find(i => i.item_code === code)
      if (item && item.quantity !== qty) {
        await updateInventoryQuantity(code, qty, localStorage.getItem('sapkey_user') ? JSON.parse(localStorage.getItem('sapkey_user')).name_ar : 'auditor')
        changes++
      }
    }
    setNewAuditMode(false)
    loadData()
    alert(`${t('common.save', lang)}! ${changes} ${t('inventory.adjustStock', lang)}`)
  }

  async function handleFileUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setImportMsg(t('common.loading', lang))
    try {
      const ExcelJS = await import('exceljs')
      const buffer = await f.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)
      const ws = wb.worksheets[0]
      const rows = []
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return
        const item_code = row.getCell(1).text?.trim()
        if (!item_code) return
        rows.push({
          item_code,
          item_name_ar: row.getCell(2).text,
          quantity: parseInt(row.getCell(3).text) || 0,
          unit_price: parseFloat(row.getCell(4).text) || 0,
        })
      })
      const count = await importInventoryFromExcel(rows)
      setImportMsg(`✅ ${t('common.save', lang)}! ${count} ${t('inventory.adjustStock', lang)}`)
      loadData()
    } catch (err) {
      setImportMsg(`❌ ${err.message}`)
    }
  }

  async function exportAuditExcel() {
    try {
      const ExcelJS = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('StockAudit')
      ws.views = [{ rightToLeft: lang === 'ar' }]
      ws.columns = [
        { header: 'Item Code', key: 'item_code', width: 20 },
        { header: lang === 'ar' ? 'الاسم (عربي)' : 'Name (AR)', key: 'item_name_ar', width: 35 },
        { header: lang === 'ar' ? 'الكمية' : 'System Qty', key: 'quantity', width: 15 },
        { header: lang === 'ar' ? 'سعر الوحدة' : 'Unit Price', key: 'unit_price', width: 15 },
        { header: lang === 'ar' ? 'المنشأ' : 'Origin', key: 'origin_ar', width: 20 },
        { header: lang === 'ar' ? 'الشهادات' : 'Certificates', key: 'certificates', width: 25 },
      ]
      items.forEach(i => ws.addRow({
        item_code: i.item_code,
        item_name_ar: i.item_name_ar,
        quantity: i.quantity,
        unit_price: i.unit_price,
        origin_ar: i.origin_ar,
        certificates: i.certificates,
      }))
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }
      ws.protect('SupabaseGafi2026')
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `SAPKEY_StockAudit_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click(); URL.revokeObjectURL(url)
    } catch (err) { alert('Export error: ' + err.message) }
  }

  function openCostEdit(item) {
    setEditCostModal(item)
    setEditCostVal(item.unit_price || 0)
    setEditMarginVal(item.admin_margin_pct || 25)
  }

  async function saveCostEdit() {
    if (!editCostModal) return
    await updateInventoryItemCost(editCostModal.item_code, editCostVal)
    await updateInventoryItemMargin(editCostModal.item_code, editMarginVal)
    setEditCostModal(null)
    loadData()
  }

  const totalVariance = auditLogs.filter(l => l.type === 'adjustment' || l.type === 'ds_sync').reduce((s, l) => s + ((l.new_qty || 0) - (l.old_qty || 0)), 0)

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <button onClick={() => router.push('/inventory')} className="text-xs text-[#6B7280] hover:text-[#9CA3AF] bg-transparent border-none cursor-pointer mb-1 flex items-center gap-1">
            <i className="fas fa-arrow-right"></i> {t('common.back', lang)}
          </button>
          <h1 className="text-2xl font-bold">{t('inventory.stockAudit', lang)}</h1>
          <p className="text-sm text-[#9CA3AF]">{t('inventory.subtitle', lang)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!newAuditMode && (
            <button className="btn-primary text-sm" onClick={startNewAudit}>
              <i className="fas fa-clipboard-list ms-1"></i> {t('inventory.newAudit', lang)}
            </button>
          )}
          <button className="btn-outline text-sm" onClick={exportAuditExcel}>
            <i className="fas fa-file-excel ms-1 text-[#0ECB81]"></i> {t('inventory.exportExcel', lang)}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-file-import text-[#1E80FF]"></i>
          <h2 className="text-sm font-bold">{t('inventory.importExcel', lang)}</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="text-sm text-[#9CA3AF] file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1E80FF]/20 file:text-[#1E80FF] hover:file:bg-[#1E80FF]/30 cursor-pointer" />
          {importMsg && <span className="text-sm">{importMsg}</span>}
        </div>
        <div className="mt-2 text-[10px] text-[#6B7280]">
          {lang === 'ar' ? 'أعمدة Excel: كود الصنف | الاسم | الكمية | سعر الوحدة' : 'Excel columns: Item Code | Name | Qty | Unit Price'}
        </div>
      </div>

      <div className="flex gap-1 bg-[#1A1A2E] rounded-xl p-1 border border-[#2A2A3E] w-fit">
        <button className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-none transition-all ${activeTab === 'audit' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'text-[#6B7280] hover:text-white bg-transparent'}`} onClick={() => setActiveTab('audit')}>
          <i className="fas fa-clipboard ms-1"></i> {t('inventory.stockAudit', lang)}
        </button>
        <button className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-none transition-all ${activeTab === 'log' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'text-[#6B7280] hover:text-white bg-transparent'}`} onClick={() => setActiveTab('log')}>
          <i className="fas fa-history ms-1"></i> {t('inventory.auditLog', lang)}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="loading-spinner w-8 h-8" /></div>
      ) : activeTab === 'audit' ? (
        newAuditMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('inventory.physicalCount', lang)}</h2>
              <button className="btn-primary text-sm" onClick={saveAudit}>
                <i className="fas fa-check ms-1"></i> {t('common.save', lang)}
              </button>
            </div>
            <div className="table-wrap scroll-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('inventory.itemCode', lang)}</th>
                    <th>{t('inventory.itemName', lang)}</th>
                    <th>{t('inventory.systemCount', lang)}</th>
                    <th>{t('inventory.physicalCount', lang)}</th>
                    <th>{t('inventory.variance', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const sysQty = item.quantity || 0
                    const physQty = auditCounts[item.item_code] ?? sysQty
                    const variance = physQty - sysQty
                    return (
                      <tr key={item.item_code}>
                        <td className="font-mono text-xs">{item.item_code}</td>
                        <td className="max-w-[200px] truncate">{lang === 'ar' ? item.item_name_ar : item.item_name_en || item.item_name_ar}</td>
                        <td>{sysQty.toLocaleString()}</td>
                        <td>
                          <input className="input w-24 text-center" type="number" min="0" value={physQty}
                            onChange={e => setAuditCounts({...auditCounts, [item.item_code]: Math.max(0, +e.target.value)})} />
                        </td>
                        <td className={variance !== 0 ? (variance > 0 ? 'text-[#0ECB81] font-bold' : 'text-[#F6465D] font-bold') : ''}>
                          {variance !== 0 ? `${variance > 0 ? '+' : ''}${variance.toLocaleString()}` : '0'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button className="btn-primary" onClick={saveAudit}>
                <i className="fas fa-check ms-1"></i> {t('common.save', lang)} {t('inventory.adjustStock', lang)}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="card stat-card p-4">
                <div className="value text-[#1E80FF]">{auditLogs.length}</div>
                <div className="label">{t('inventory.auditLog', lang)}</div>
              </div>
              <div className="card stat-card p-4">
                <div className="value text-[#F0A90B]">{items.length}</div>
                <div className="label">{t('inventory.itemCode', lang)}</div>
              </div>
              <div className="card stat-card p-4">
                <div className={`value ${totalVariance >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                  {totalVariance >= 0 ? '+' : ''}{totalVariance.toLocaleString()}
                </div>
                <div className="label">{t('inventory.variance', lang)}</div>
              </div>
            </div>
            <div className="table-wrap scroll-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('inventory.itemCode', lang)}</th>
                    <th>{t('inventory.itemName', lang)}</th>
                    <th>{t('inventory.qty', lang)}</th>
                    <th>{t('products.costPrice', lang)}</th>
                    <th>{t('products.profitMargin', lang)}</th>
                    <th>{t('common.actions', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 50).map(item => (
                    <tr key={item.item_code}>
                      <td className="font-mono text-xs">{item.item_code}</td>
                      <td className="max-w-[180px] truncate">{lang === 'ar' ? item.item_name_ar : item.item_name_en || item.item_name_ar}</td>
                      <td>{item.quantity?.toLocaleString() || 0}</td>
                      <td>{(item.unit_price || 0).toLocaleString()} {t('common.egp', lang)}</td>
                      <td>{item.admin_margin_pct || 25}%</td>
                      <td>
                        <button className="btn-outline text-xs py-1 px-2 cursor-pointer" onClick={() => openCostEdit(item)}>
                          <i className="fas fa-pen-to-square text-[#0ECB81]"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="table-wrap scroll-wrap">
          {auditLogs.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><i className="fas fa-history"></i></div>
              <div className="text">{t('inventory.noAudits', lang)}</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('inventory.itemCode', lang)}</th>
                  <th>{t('common.date', lang)}</th>
                  <th>{t('inventory.auditedBy', lang)}</th>
                  <th>{t('inventory.systemCount', lang)}</th>
                  <th>{t('inventory.physicalCount', lang)}</th>
                  <th>{t('inventory.variance', lang)}</th>
                  <th>{t('inventory.notes', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 50).map(log => {
                  const delta = (log.new_qty || 0) - (log.old_qty || 0)
                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-xs">{log.item_code}</td>
                      <td className="text-xs">{new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                      <td className="text-xs">{log.audit_by || '—'}</td>
                      <td>{(log.old_qty || 0).toLocaleString()}</td>
                      <td>{(log.new_qty || 0).toLocaleString()}</td>
                      <td className={delta !== 0 ? (delta > 0 ? 'text-[#0ECB81] font-bold' : 'text-[#F6465D] font-bold') : ''}>
                        {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                      </td>
                      <td className="text-xs text-[#6B7280] max-w-[150px] truncate">{log.reason || log.type || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editCostModal && (
        <div className="modal-overlay" onClick={() => setEditCostModal(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('products.pricing', lang)}</h2>
              <button onClick={() => setEditCostModal(null)} className="text-[#9CA3AF] hover:text-white bg-transparent border-none text-xl cursor-pointer"><i className="fas fa-xmark"></i></button>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-[#9CA3AF]">{t('inventory.itemCode', lang)}: </span>
                <span className="font-mono">{editCostModal.item_code}</span>
              </div>
              <div className="text-sm">
                <span className="text-[#9CA3AF]">{t('inventory.itemName', lang)}: </span>
                <span>{lang === 'ar' ? editCostModal.item_name_ar : editCostModal.item_name_en || editCostModal.item_name_ar}</span>
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">{t('products.costPrice', lang)}</label>
                <input className="input" type="number" value={editCostVal} onChange={e => setEditCostVal(Math.max(0, +e.target.value))} min="0" />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">{t('products.profitMargin', lang)}</label>
                <input className="input" type="number" value={editMarginVal} onChange={e => setEditMarginVal(Math.max(0, Math.min(100, +e.target.value)))} min="0" max="100" />
              </div>
              <button className="btn-primary w-full" onClick={saveCostEdit}>
                <i className="fas fa-cloud-upload-alt ms-1"></i> {t('common.save', lang)} &amp; Supabase
              </button>
              <div className="text-[10px] text-[#6B7280] text-center">
                <i className="fas fa-database ms-1"></i> {lang === 'ar' ? 'سيتم تحديث المنتج في قاعدة البيانات الفعلية' : 'Product will be updated in the live database'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
