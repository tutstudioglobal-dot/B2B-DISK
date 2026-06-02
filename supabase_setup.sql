-- ============================================================
-- SUPABASE SETUP SCRIPT — SAPKEY Petroleum Management System
-- Run this in: https://supabase.com/dashboard/project/ehdxisutvrqqfiozarxq/sql/new
-- ============================================================

-- 1. PRODUCTS (1M+ products)
CREATE TABLE IF NOT EXISTS products_v2 (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category_ar TEXT,
  category_en TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  qty INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'وحدة',
  min_stock INTEGER DEFAULT 0,
  location TEXT,
  barcode TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers_v2 (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  tax_id TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers_v2 (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  rate NUMERIC(3,1) DEFAULT 0,
  contract_no TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHART OF ACCOUNTS (COA)
CREATE TABLE IF NOT EXISTS coa_v2 (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  type_ar TEXT,
  type_en TEXT,
  parent_code TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DS ORDERS (Direct Supply Orders)
CREATE TABLE IF NOT EXISTS ds_orders_v2 (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  client_code TEXT REFERENCES customers_v2(code),
  vendor_code TEXT REFERENCES suppliers_v2(code),
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  total NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (for fast search)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_name_ar ON products_v2 USING GIN (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_code ON products_v2 (code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products_v2 (category_ar);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers_v2 USING GIN (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers_v2 USING GIN (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_coa_code ON coa_v2 (code);
CREATE INDEX IF NOT EXISTS idx_ds_orders_date ON ds_orders_v2 (order_date);

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- RLS (Row Level Security) — allow anon key access
-- ============================================================
ALTER TABLE products_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_orders_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_products" ON products_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_customers" ON customers_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_suppliers" ON suppliers_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_coa" ON coa_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_ds_orders" ON ds_orders_v2 FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON products_v2 TO anon;
GRANT ALL ON customers_v2 TO anon;
GRANT ALL ON suppliers_v2 TO anon;
GRANT ALL ON coa_v2 TO anon;
GRANT ALL ON ds_orders_v2 TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================
-- GENERATE 1M PETROLEUM PRODUCTS
-- ============================================================
CREATE OR REPLACE FUNCTION generate_infinite_petroleum_system(
  batch_size INT DEFAULT 1000,
  num_batches INT DEFAULT 1000
) RETURNS TEXT AS $$
DECLARE
  batched INT := 0;
  cats TEXT[][] := ARRAY[
    ARRAY['معدات بترول', 'Petroleum Equipment'],
    ARRAY['مواسير', 'Pipes & Tubing'],
    ARRAY['محابس', 'Valves & Fittings'],
    ARRAY['سلامة', 'HSE & Safety'],
    ARRAY['كهرباء', 'Electrical'],
    ARRAY['ميكانيكا', 'Mechanical'],
    ARRAY['قطع غيار', 'Spare Parts'],
    ARRAY['كيميائيات', 'Chemicals'],
    ARRAY['مستلزمات ورش', 'Workshop Supplies'],
    ARRAY['أجهزة قياس', 'Measuring Instruments'],
    ARRAY['حديد', 'Steel & Metals'],
    ARRAY['مواد عزل', 'Insulation Materials'],
    ARRAY['دهانات', 'Paints & Coatings'],
    ARRAY['معدات لحام', 'Welding Equipment'],
    ARRAY['خراطيم', 'Hoses & Couplings'],
    ARRAY['فلاتر', 'Filters & Strainers'],
    ARRAY['مضخات', 'Pumps'],
    ARRAY['ضواغط', 'Compressors'],
    ARRAY['مبادلات حرارية', 'Heat Exchangers'],
    ARRAY['صهاريج', 'Tanks & Vessels']
  ];
  names TEXT[][] := ARRAY[
    ARRAY['مواسير حديد', 'Steel Pipe'],
    ARRAY['محبس صناعي', 'Industrial Valve'],
    ARRAY['فلتر بترول', 'Petroleum Filter'],
    ARRAY['صمام أمان', 'Safety Valve'],
    ARRAY['مضخة طرد مركزي', 'Centrifugal Pump'],
    ARRAY['مبادل حراري', 'Heat Exchanger'],
    ARRAY['خزان ضغط', 'Pressure Vessel'],
    ARRAY['طفاية حريق', 'Fire Extinguisher'],
    ARRAY['خوذة أمان', 'Safety Helmet'],
    ARRAY['حزام أمان', 'Safety Harness'],
    ARRAY['قفاز مقاوم', 'Resistant Gloves'],
    ARRAY['نظارة واقية', 'Safety Goggles'],
    ARRAY['جهاز قياس ضغط', 'Pressure Gauge'],
    ARRAY['ثرموستات صناعي', 'Industrial Thermostat'],
    ARRAY['كابل طاقة', 'Power Cable'],
    ARRAY['مفتاح كهربائي', 'Electrical Switch'],
    ARRAY['قاطع دائرة', 'Circuit Breaker'],
    ARRAY['محرك كهربائي', 'Electric Motor'],
    ARRAY['جيربوكس صناعي', 'Industrial Gearbox'],
    ARRAY['رمان بلي', 'Ball Bearing'],
    ARRAY['صامولة M20', 'Nut M20'],
    ARRAY['برغي M16', 'Bolt M16'],
    ARRAY['غسالة', 'Washer'],
    ARRAY['سخان صناعي', 'Industrial Heater'],
    ARRAY['مروحة تهوية', 'Ventilation Fan'],
    ARRAY['منظم ضغط', 'Pressure Regulator'],
    ARRAY['قطعة توصيل', 'Connector Piece'],
    ARRAY['مانع تسرب', 'Sealant'],
    ARRAY['غراء صناعي', 'Industrial Adhesive'],
    ARRAY['شريط عازل', 'Insulation Tape'],
    ARRAY['دهان مقاوم للصدأ', 'Rust-proof Paint'],
    ARRAY['مونة أسمنتية', 'Cement Mortar'],
    ARRAY['سيليكون مانع', 'Silicone Sealant'],
    ARRAY['ماسورة PP', 'PP Pipe'],
    ARRAY['كووع PVC', 'PVC Elbow'],
    ARRAY['محول قطر', 'Diameter Reducer'],
    ARRAY['قطعة T', 'T-Piece'],
    ARRAY['صمام هواء', 'Air Valve'],
    ARRAY['عداد تدفق', 'Flow Meter'],
    ARRAY['مستوى زيت', 'Oil Level Gauge'],
    ARRAY['طلمبة', 'Pump'],
    ARRAY['كمبريسر', 'Compressor'],
    ARRAY['فاصل زيت', 'Oil Separator'],
    ARRAY['مجفف هواء', 'Air Dryer'],
    ARRAY['وحدة تبريد', 'Cooling Unit'],
    ARRAY['رادياتير', 'Radiator'],
    ARRAY['كاتم صوت', 'Silencer'],
    ARRAY['مصفاة', 'Strainer'],
    ARRAY['مستودع متنقل', 'Mobile Warehouse'],
    ARRAY['بالتة خشب', 'Wooden Pallet']
  ];
  dims TEXT[] := ARRAY['½"','¾"','1"','1½"','2"','2½"','3"','4"','6"','8"','10"','12"','16"','20"','24"','150LB','300LB','600LB','PN10','PN16','PN25','PN40'];
BEGIN
  FOR b IN 1..num_batches LOOP
    INSERT INTO products_v2 (code, name_ar, name_en, category_ar, category_en, price, qty, unit, location)
    SELECT
      'PET-' || LPAD(((b-1)*batch_size + n)::TEXT, 7, '0'),
      names[1 + ((b-1)*batch_size + n) % array_length(names,1)][1] || ' ' || dims[1 + ((b-1)*batch_size + n) % array_length(dims,1)] || ' - طراز ' || ((b-1)*batch_size + n),
      names[1 + ((b-1)*batch_size + n) % array_length(names,1)][2] || ' ' || dims[1 + ((b-1)*batch_size + n) % array_length(dims,1)] || ' - Model ' || ((b-1)*batch_size + n),
      cats[1 + ((b-1)*batch_size + n) % array_length(cats,1)][1],
      cats[1 + ((b-1)*batch_size + n) % array_length(cats,1)][2],
      ROUND((random() * 95000 + 50)::NUMERIC, 2),
      FLOOR(random() * 5000 + 10)::INT,
      CASE WHEN random() < 0.3 THEN 'طقم' WHEN random() < 0.6 THEN 'متر' ELSE 'وحدة' END,
      'مستودع ' || CHR(65 + (b % 10))
    FROM generate_series(1, batch_size) AS n;
    batched := batched + batch_size;
    COMMIT;
  END LOOP;
  RETURN '✅ Generated ' || batched || ' products successfully';
END;
$$ LANGUAGE plpgsql;

-- Run: SELECT generate_infinite_petroleum_system(500, 2000);
-- This generates 1,000,000 products in batches of 500 (2000 batches)
-- Estimated time: 3-8 minutes depending on Supabase plan
