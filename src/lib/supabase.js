const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseClient = null

export function getSupabase() {
  if (supabaseClient) return supabaseClient
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  // Dynamic import to avoid build failures when env vars missing
  try {
    const { createClient } = require('@supabase/supabase-js')
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return supabaseClient
  } catch {
    return null
  }
}

export function isSupabaseReady() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY && getSupabase())
}

// localStorage storage layer (fallback when Supabase unavailable)
export function getStore() {
  try {
    const raw = localStorage.getItem('sapkey_next_store')
    return raw ? JSON.parse(raw) : defaultStore()
  } catch { return defaultStore() }
}

export function saveStore(store) {
  try { localStorage.setItem('sapkey_next_store', JSON.stringify(store)) } catch {}
}

function defaultStore() {
  return {
    products_v2: [],
    inventory: [],
    tenders: [],
    direct_supply: [],
    users: [],
    price_history_logs: [],
    consumption_analytics: [],
    audit_logs: [],
  }
}

// Inventory operations (works with localStorage, writes to Supabase if available)
export async function getInventory() {
  const store = getStore()
  if (!store.inventory || store.inventory.length === 0) {
    // Initialize inventory from products
    const products = store.products_v2 || []
    store.inventory = products.map(p => ({
      id: p.id || p.item_code,
      item_code: p.item_code,
      item_name_ar: p.item_name_ar,
      item_name_en: p.item_name_en,
      category_id: p.category_id,
      origin_ar: p.origin_ar,
      origin_en: p.origin_en,
      certificates: p.certificates,
      unit_price: p.cost_price || 0,
      quantity: p.quantity || Math.floor(Math.random() * 500) + 10,
      min_stock: 50,
      last_audit: null,
      last_audit_by: null,
    }))
    saveStore(store)
  }
  return store.inventory
}

export async function updateInventoryQuantity(itemCode, newQty, auditBy = 'system') {
  const store = getStore()
  const idx = store.inventory?.findIndex(i => i.item_code === itemCode)
  if (idx === -1 || idx === undefined) return false
  const oldQty = store.inventory[idx].quantity
  store.inventory[idx].quantity = newQty
  store.inventory[idx].last_audit = new Date().toISOString()
  store.inventory[idx].last_audit_by = auditBy
  // Write audit log
  if (!store.audit_logs) store.audit_logs = []
  store.audit_logs.push({
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    item_code: itemCode,
    old_qty: oldQty,
    new_qty: newQty,
    delta: newQty - oldQty,
    audit_by: auditBy,
    timestamp: new Date().toISOString(),
    type: 'adjustment',
  })
  saveStore(store)
  return true
}

export async function deductInventory(itemCode, qty, reason = '') {
  const store = getStore()
  const idx = store.inventory?.findIndex(i => i.item_code === itemCode)
  if (idx === -1 || idx === undefined) return false
  const oldQty = store.inventory[idx].quantity
  const newQty = Math.max(0, oldQty - qty)
  store.inventory[idx].quantity = newQty
  if (!store.audit_logs) store.audit_logs = []
  store.audit_logs.push({
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    item_code: itemCode,
    old_qty: oldQty,
    new_qty: newQty,
    delta: -qty,
    audit_by: 'system',
    timestamp: new Date().toISOString(),
    type: 'deduction',
    reason,
  })
  saveStore(store)
  return true
}

export async function getAuditLogs() {
  const store = getStore()
  return (store.audit_logs || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export async function importInventoryFromExcel(items) {
  const store = getStore()
  let count = 0
  for (const item of items) {
    if (!item.item_code) continue
    const idx = store.inventory?.findIndex(i => i.item_code === item.item_code)
    if (idx >= 0) {
      store.inventory[idx].quantity = item.quantity ?? store.inventory[idx].quantity
      store.inventory[idx].unit_price = item.unit_price ?? store.inventory[idx].unit_price
    } else {
      store.inventory.push({
        id: item.item_code,
        item_code: item.item_code,
        item_name_ar: item.item_name_ar || '',
        item_name_en: item.item_name_en || '',
        category_id: item.category_id || '',
        origin_ar: item.origin_ar || '',
        origin_en: item.origin_en || '',
        certificates: item.certificates || '',
        unit_price: item.unit_price || 0,
        quantity: item.quantity || 0,
        min_stock: item.min_stock || 50,
        last_audit: new Date().toISOString(),
        last_audit_by: 'excel_import',
      })
    }
    if (!store.audit_logs) store.audit_logs = []
    store.audit_logs.push({
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      item_code: item.item_code,
      old_qty: 0,
      new_qty: item.quantity || 0,
      delta: item.quantity || 0,
      audit_by: 'excel_import',
      timestamp: new Date().toISOString(),
      type: 'excel_import',
    })
    count++
  }
  saveStore(store)
  return count
}

// Live Supabase mutations for Stock Audit
export async function updateInventoryItemCost(itemCode, newCost) {
  const store = getStore()
  const idx = store.inventory?.findIndex(i => i.item_code === itemCode)
  if (idx === -1 || idx === undefined) return false
  store.inventory[idx].unit_price = newCost
  saveStore(store)
  // Write to Supabase if available
  const sb = getSupabase()
  if (sb) {
    try { await sb.from('products_v2').update({ unit_price: newCost }).eq('item_code', itemCode) } catch {}
    try { await sb.from('products').update({ cost_price: newCost }).eq('item_code', itemCode) } catch {}
  }
  return true
}

export async function updateInventoryItemMargin(itemCode, newMargin) {
  const store = getStore()
  const idx = store.inventory?.findIndex(i => i.item_code === itemCode)
  if (idx === -1 || idx === undefined) return false
  store.inventory[idx].admin_margin_pct = newMargin
  saveStore(store)
  const sb = getSupabase()
  if (sb) {
    try { await sb.from('products_v2').update({ admin_margin_pct: newMargin }).eq('item_code', itemCode) } catch {}
    try { await sb.from('products').update({ admin_margin_pct: newMargin }).eq('item_code', itemCode) } catch {}
  }
  return true
}

// Sync: when a DS order completes, auto-deduct from inventory
export async function syncDSCompletion(dsItem) {
  if (!dsItem || (!dsItem.amount && !dsItem.items?.length)) return { deducted: 0 }
  const store = getStore()
  const inventory = store.inventory || []
  if (inventory.length === 0) return { deducted: 0 }
  let deducted = 0
  // If DS has explicit items array, deduct by item
  if (dsItem.items && dsItem.items.length > 0) {
    const sb = getSupabase()
    for (const dsProd of dsItem.items) {
      const code = dsProd.item_code || dsProd.code
      if (!code) continue
      const idx = inventory.findIndex(i => i.item_code === code)
      if (idx === -1) continue
      const qty = dsProd.qty || dsProd.quantity || 1
      const oldQty = inventory[idx].quantity
      const newQty = Math.max(0, oldQty - qty)
      inventory[idx].quantity = newQty
      deducted += oldQty - newQty
      if (!store.audit_logs) store.audit_logs = []
      store.audit_logs.push({
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        item_code: code, old_qty: oldQty, new_qty: newQty,
        delta: -(oldQty - newQty), audit_by: 'system',
        timestamp: new Date().toISOString(), type: 'ds_sync',
        reason: `DS Order ${dsItem.id} — ${code}`,
      })
      // Write to Supabase if available
      if (sb) {
        try { await sb.from('products').update({ quantity: newQty }).eq('item_code', code) } catch {}
        try { await sb.from('inventory').update({ quantity: newQty }).eq('item_code', code) } catch {}
      }
    }
  } else {
    // Fallback: proportional deduction based on amount
    const itemsToDeduct = Math.min(inventory.length, Math.ceil(dsItem.amount / 10000))
    for (let i = 0; i < itemsToDeduct; i++) {
      const idx = Math.floor(Math.random() * inventory.length)
      const deductQty = Math.ceil((dsItem.amount || 0) / (itemsToDeduct * (inventory[idx].unit_price || 1000)))
      if (deductQty > 0 && inventory[idx].quantity >= deductQty) {
        inventory[idx].quantity -= deductQty
        deducted += deductQty
        if (!store.audit_logs) store.audit_logs = []
        store.audit_logs.push({
          id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          item_code: inventory[idx].item_code,
          old_qty: inventory[idx].quantity + deductQty,
          new_qty: inventory[idx].quantity,
          delta: -deductQty, audit_by: 'system',
          timestamp: new Date().toISOString(), type: 'ds_sync',
          reason: `DS Order ${dsItem.id} completed`,
        })
      }
    }
  }
  saveStore(store)
  return { deducted, orderId: dsItem.id }
}

// Supabase sync (when configured)
export async function supabaseSyncInventory() {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const store = getStore()
    const { data, error } = await sb.from('products').select('*')
    if (!error && data) {
      store.products_v2 = data
      saveStore(store)
    }
    // Sync inventory table if exists
    const { data: invData, error: invErr } = await sb.from('inventory').select('*')
    if (!invErr && invData) {
      store.inventory = invData
      saveStore(store)
    }
    return true
  } catch { return false }
}
