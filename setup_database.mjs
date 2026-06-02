// SAPKEY Supabase Database + 1M Products Setup
// Run via: node setup_database.mjs <password>
// Or set SUPABASE_DB_PASSWORD env var
// Deploy to Vercel and POST to /api/setup to trigger remotely

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ehdxisutvrqqfiozarxq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZHhpc3V0dnJxcWZpb3phcnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMzNDk0MiwiZXhwIjoyMDk1OTEwOTQyfQ.ysg2AMyaQicNBFxiHoAqOEuVEA2OQY7Tt_Ss5GXtQpI';

async function setup() {
  const password = process.env.SUPABASE_DB_PASSWORD || process.argv[2];
  if (!password) {
    console.error('Usage: node setup_database.mjs <supabase_db_password>');
    console.error('Or set SUPABASE_DB_PASSWORD environment variable');
    process.exit(1);
  }

  // Use pooler with reference option for IPv4 support (Supabase DB is IPv6-only)
  const connStr = `postgresql://postgres:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?options=reference%3Dehdxisutvrqqfiozarxq`;
  const results = [];

  // Step 1: Connect
  console.log('Connecting to Supabase...');
  const client = new pg.Client({ connectionString: connStr, connectionTimeoutMillis: 20000, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!');
  results.push('✅ Connected');

  // Step 2: Create tables (from SQL file or inline)
  console.log('Creating tables...');
  const sqlPath = join(__dirname, 'supabase_setup.sql');
  let sql;
  if (existsSync(sqlPath)) {
    sql = readFileSync(sqlPath, 'utf8');
  } else {
    sql = `
      CREATE TABLE IF NOT EXISTS products_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, category_ar TEXT, category_en TEXT, price NUMERIC(12,2) DEFAULT 0, qty INTEGER DEFAULT 0, unit TEXT DEFAULT 'وحدة', min_stock INTEGER DEFAULT 0, location TEXT, barcode TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS customers_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, phone TEXT, email TEXT, city TEXT, address TEXT, tax_id TEXT, balance NUMERIC(12,2) DEFAULT 0, credit_limit NUMERIC(12,2) DEFAULT 0, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS suppliers_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, phone TEXT, email TEXT, city TEXT, rate NUMERIC(3,1) DEFAULT 0, contract_no TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS coa_v2 (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name_ar TEXT NOT NULL, name_en TEXT, type_ar TEXT, type_en TEXT, parent_code TEXT, balance NUMERIC(12,2) DEFAULT 0, currency TEXT DEFAULT 'EGP', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS ds_orders_v2 (id BIGSERIAL PRIMARY KEY, order_no TEXT UNIQUE NOT NULL, client_code TEXT, vendor_code TEXT, order_date DATE DEFAULT CURRENT_DATE, delivery_date DATE, total NUMERIC(12,2) DEFAULT 0, status TEXT DEFAULT 'pending', notes TEXT, attachment_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      ALTER TABLE products_v2 ENABLE ROW LEVEL SECURITY; ALTER TABLE customers_v2 ENABLE ROW LEVEL SECURITY; ALTER TABLE suppliers_v2 ENABLE ROW LEVEL SECURITY; ALTER TABLE coa_v2 ENABLE ROW LEVEL SECURITY; ALTER TABLE ds_orders_v2 ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "anon_all_products" ON products_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_customers" ON customers_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_suppliers" ON suppliers_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_coa" ON coa_v2 FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_ds_orders" ON ds_orders_v2 FOR ALL USING (true) WITH CHECK (true);
      GRANT ALL ON products_v2 TO anon; GRANT ALL ON customers_v2 TO anon; GRANT ALL ON suppliers_v2 TO anon; GRANT ALL ON coa_v2 TO anon; GRANT ALL ON ds_orders_v2 TO anon;
      GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;`;
  }
  await client.query(sql);
  console.log('Tables created!');
  results.push('✅ Tables created');

  // Step 3: Create generation function
  console.log('Creating generate function...');
  await client.query(`
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
      batched := batched + batch_size; COMMIT;
    END LOOP;
    RETURN '✅ '||batched||' products generated'; END; $$;`);
  console.log('Function created!');
  results.push('✅ Function created');

  // Step 4: Generate products (start with 10000 for quick demo)
  console.log('Generating 10000 products...');
  const gen = await client.query(`SELECT generate_infinite_petroleum_system(500, 20)`);
  console.log('Result:', gen.rows[0]?.generate_infinite_petroleum_system);
  results.push('✅ 10000 products generated');

  await client.end();
  console.log('\n=== Setup Complete ===');
  return results;
}

setup().catch(err => { console.error('Setup failed:', err.message); process.exit(1); });
