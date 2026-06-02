export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const pat = process.env.SUPABASE_PAT || req.body?.pat;
  if (!pat) return res.status(400).json({ error: 'Missing SUPABASE_PAT' });

  const projectRef = 'ehdxisutvrqqfiozarxq';
  const apiUrl = 'https://api.supabase.com';
  const results = [];

  async function execSQL(sql) {
    const resp = await fetch(`${apiUrl}/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(data));
    return data;
  }

  try {
    // 1. Create tables
    results.push({ step: 'create_tables', status: 'progress' });
    await execSQL(`
      CREATE TABLE IF NOT EXISTS products_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, category_ar TEXT, category_en TEXT, price NUMERIC(12,2) DEFAULT 0, qty INTEGER DEFAULT 0, unit TEXT DEFAULT 'وحدة', min_stock INTEGER DEFAULT 0, location TEXT, barcode TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS customers_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, phone TEXT, email TEXT, city TEXT, address TEXT, tax_id TEXT, balance NUMERIC(12,2) DEFAULT 0, credit_limit NUMERIC(12,2) DEFAULT 0, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS suppliers_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, phone TEXT, email TEXT, city TEXT, rate NUMERIC(3,1) DEFAULT 0, contract_no TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS coa_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, type_ar TEXT, type_en TEXT, parent_code TEXT, balance NUMERIC(12,2) DEFAULT 0, currency TEXT DEFAULT 'EGP', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS ds_orders_v2 (id BIGSERIAL PRIMARY KEY, order_no TEXT UNIQUE NOT NULL, client_code TEXT, vendor_code TEXT, order_date DATE DEFAULT CURRENT_DATE, delivery_date DATE, total NUMERIC(12,2) DEFAULT 0, status TEXT DEFAULT 'pending', notes TEXT, attachment_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
    `);
    results.push({ step: 'create_tables', status: 'ok' });

    // 2. Enable RLS + policies (idempotent)
    await execSQL(`
      ALTER TABLE IF EXISTS products_v2 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS customers_v2 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS suppliers_v2 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS coa_v2 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS ds_orders_v2 ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "anon_all_products" ON products_v2;
      DROP POLICY IF EXISTS "anon_all_customers" ON customers_v2;
      DROP POLICY IF EXISTS "anon_all_suppliers" ON suppliers_v2;
      DROP POLICY IF EXISTS "anon_all_coa" ON coa_v2;
      DROP POLICY IF EXISTS "anon_all_ds_orders" ON ds_orders_v2;
      CREATE POLICY "anon_all_products" ON products_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_customers" ON customers_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_suppliers" ON suppliers_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_coa" ON coa_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_ds_orders" ON ds_orders_v2 FOR ALL USING (true) WITH CHECK (true);
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
      GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
    `);
    results.push({ step: 'rls_policies', status: 'ok' });

    // 3. Drop old function if exists
    await execSQL(`DROP FUNCTION IF EXISTS generate_infinite_petroleum_system(INTEGER, INTEGER);`);

    // 4. Create generation function WITHOUT COMMIT (Management API wraps in transaction)
    results.push({ step: 'create_function', status: 'progress' });
    await execSQL(`
      CREATE OR REPLACE FUNCTION generate_infinite_petroleum_system(batch_size INT DEFAULT 500, num_batches INT DEFAULT 2000)
      RETURNS TEXT LANGUAGE plpgsql AS $$ DECLARE batched INT := 0;
      names TEXT[][] := ARRAY[ARRAY['مواسير حديد','Steel Pipe'],ARRAY['محبس صناعي','Industrial Valve'],ARRAY['فلتر بترول','Petroleum Filter'],ARRAY['صمام أمان','Safety Valve'],ARRAY['مضخة طرد مركزي','Centrifugal Pump'],ARRAY['مبادل حراري','Heat Exchanger'],ARRAY['خزان ضغط','Pressure Vessel'],ARRAY['طفاية حريق','Fire Extinguisher'],ARRAY['خوذة أمان','Safety Helmet'],ARRAY['حزام أمان','Safety Harness'],ARRAY['قفاز مقاوم','Resistant Gloves'],ARRAY['نظارة واقية','Safety Goggles'],ARRAY['جهاز قياس ضغط','Pressure Gauge'],ARRAY['ثرموستات صناعي','Industrial Thermostat'],ARRAY['كابل طاقة','Power Cable'],ARRAY['مفتاح كهربائي','Electrical Switch'],ARRAY['قاطع دائرة','Circuit Breaker'],ARRAY['محرك كهربائي','Electric Motor'],ARRAY['جيربوكس صناعي','Industrial Gearbox'],ARRAY['رمان بلي','Ball Bearing']];
      cats TEXT[][] := ARRAY[ARRAY['معدات بترول','Petroleum Equipment'],ARRAY['مواسير','Pipes'],ARRAY['محابس','Valves'],ARRAY['سلامة','Safety'],ARRAY['كهرباء','Electrical'],ARRAY['ميكانيكا','Mechanical'],ARRAY['قطع غيار','Spare Parts'],ARRAY['كيميائيات','Chemicals'],ARRAY['مستلزمات ورش','Supplies'],ARRAY['أجهزة قياس','Instruments'],ARRAY['حديد','Steel'],ARRAY['مواد عزل','Insulation'],ARRAY['دهانات','Paints'],ARRAY['معدات لحام','Welding'],ARRAY['خراطيم','Hoses'],ARRAY['فلاتر','Filters'],ARRAY['مضخات','Pumps'],ARRAY['ضواغط','Compressors'],ARRAY['مبادلات حرارية','Exchangers'],ARRAY['صهاريج','Tanks']];
      dims TEXT[] := ARRAY['½"','¾"','1"','1½"','2"','2½"','3"','4"','6"','8"','10"','12"','16"','20"','24"','150LB','300LB','600LB','PN10','PN16','PN25','PN40'];
      BEGIN
      FOR b IN 1..num_batches LOOP
        INSERT INTO products_v2 (code, name_ar, name_en, category_ar, category_en, price, qty, unit, location)
        SELECT 'PET-'||LPAD(((b-1)*batch_size+n)::TEXT,7,'0'), names[1+((b-1)*batch_size+n)%array_length(names,1)][1]||' '||dims[1+((b-1)*batch_size+n)%array_length(dims,1)], names[1+((b-1)*batch_size+n)%array_length(names,1)][2]||' '||dims[1+((b-1)*batch_size+n)%array_length(dims,1)], cats[1+((b-1)*batch_size+n)%array_length(cats,1)][1], cats[1+((b-1)*batch_size+n)%array_length(cats,1)][2], ROUND((random()*95000+50)::NUMERIC,2), FLOOR(random()*5000+10)::INT, CASE WHEN random()<0.3 THEN 'طقم' WHEN random()<0.6 THEN 'متر' ELSE 'وحدة' END, 'مستودع '||CHR(65+(b%10))
        FROM generate_series(1, batch_size) AS n;
        batched := batched + batch_size;
      END LOOP;
      RETURN '✅ '||batched||' products generated'; END; $$;`);
    results.push({ step: 'create_function', status: 'ok' });

    // 5. Generate products (no COMMIT - single transaction per call)
    results.push({ step: 'generate_products', status: 'progress' });
    const genResult = await execSQL(`SELECT generate_infinite_petroleum_system(500, 2)`);
    results.push({ step: 'generate_products', status: 'ok', detail: JSON.stringify(genResult) });

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, results });
  }
}
