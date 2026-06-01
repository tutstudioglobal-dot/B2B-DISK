-- ============================================================
-- SAPKEY B2B DISK — Full Supabase Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PRODUCTS V2 (main product catalog)
CREATE TABLE IF NOT EXISTS products_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category VARCHAR(100),
  sub_category VARCHAR(100),
  unit VARCHAR(20) DEFAULT 'قطعة',
  origin VARCHAR(100),
  supply_type VARCHAR(100),
  required_certificates TEXT,
  cost_price NUMERIC(12,2),
  admin_margin_pct NUMERIC(5,2),
  sale_price NUMERIC(12,2),
  editable_template_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ITEM CONSUMPTION ANALYTICS
CREATE TABLE IF NOT EXISTS item_consumption_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products_v2(id),
  most_demanded_rank INT,
  annual_consumption_qty INT,
  order_frequency_days INT,
  average_order_value NUMERIC(12,2)
);

-- 3. PRICE HISTORY LOGS
CREATE TABLE IF NOT EXISTS price_history_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products_v2(id),
  old_cost_price NUMERIC(12,2),
  new_cost_price NUMERIC(12,2),
  change_month INT,
  change_year INT,
  reason_for_change TEXT
);

-- 4. TENDERS
CREATE TABLE IF NOT EXISTS tenders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_code VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(200),
  status VARCHAR(50) DEFAULT 'announced',
  tech_score NUMERIC(5,2),
  fin_score NUMERIC(5,2),
  awarded BOOLEAN DEFAULT FALSE,
  total_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DIRECT SUPPLY
CREATE TABLE IF NOT EXISTS direct_supply (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(200),
  status VARCHAR(50) DEFAULT 'requested',
  step INT DEFAULT 1,
  total_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id TEXT UNIQUE NOT NULL,
  doc_type TEXT,
  entity_id TEXT,
  entity_type TEXT,
  name TEXT,
  url TEXT,
  cloudinary BOOLEAN DEFAULT false,
  ocr_data JSONB,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTION: GENERATE 1 MILLION PRODUCTS
-- ============================================================
CREATE OR REPLACE FUNCTION generate_infinite_petroleum_system(
  total_records_needed INT, batch_size INT
) RETURNS TEXT AS $$
DECLARE inserted_so_far INT := 0; current_batch_limit INT;
BEGIN
  WHILE inserted_so_far < total_records_needed LOOP
    current_batch_limit := LEAST(batch_size, total_records_needed - inserted_so_far);
    INSERT INTO products_v2 (item_code, item_name, category, sub_category, unit, origin, supply_type, required_certificates, cost_price, admin_margin_pct)
    SELECT 
      'PET-' || (100000 + inserted_so_far + g),
      'منتج بترولي كود ' || (100000 + inserted_so_far + g),
      CASE (inserted_so_far + g) % 4 
        WHEN 0 THEN 'معدات بترول (PET)' WHEN 1 THEN 'سلامة (HSE)' 
        WHEN 2 THEN 'ورش (WRK)' ELSE 'مكتبي (OFF)' END,
      'تصنيف فرعي',
      'قطعة',
      CASE (inserted_so_far + g) % 4 
        WHEN 0 THEN 'ألمانيا' WHEN 1 THEN 'أمريكا' 
        WHEN 2 THEN 'إيطاليا' ELSE 'محلي' END,
      CASE (inserted_so_far + g) % 4 
        WHEN 0 THEN 'استيراد' WHEN 1 THEN 'استيراد' 
        WHEN 2 THEN 'استيراد' ELSE 'محلي' END,
      'ISO 9001 / API',
      (500 + (inserted_so_far + g) * 0.1),
      (20 + (inserted_so_far + g) % 30)
    FROM generate_series(1, current_batch_limit) g;
    inserted_so_far := inserted_so_far + current_batch_limit;
    COMMIT;
  END LOOP;
  RETURN 'Success: ' || inserted_so_far || ' records';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products_v2(category);
CREATE INDEX IF NOT EXISTS idx_products_code ON products_v2(item_code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products_v2(item_name);
CREATE INDEX IF NOT EXISTS idx_tenders_client ON tenders(client_name);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_ds_order_code ON direct_supply(order_code);

-- ============================================================
-- USAGE:
-- 1. Paste entire file in Supabase SQL Editor → Run
-- 2. Generate 1M products:
--    SELECT generate_infinite_petroleum_system(1000, 100);
--    (Start with 1000 to test, then 1000000 for full)
-- 3. To generate 1 million:
--    SELECT generate_infinite_petroleum_system(1000000, 500);
-- ============================================================
