const path = require('path');
const BASE_DIR = path.resolve(__dirname, '..');
const BACKEND_NODE_MODULES = path.resolve(BASE_DIR, 'backend', 'node_modules');

function requireBackend(moduleName) {
  return require(require.resolve(moduleName, { paths: [BACKEND_NODE_MODULES] }));
}

const dotenv = requireBackend('dotenv');
const { createClient } = requireBackend('@supabase/supabase-js');
const envPath = path.resolve(BASE_DIR, 'backend', '.env');

dotenv.config({ path: envPath });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function tableExists(table) {
  try {
    const { error } = await supabase.from(table).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function run() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }

  const tables = ['members', 'broadcasts', 'messages'];
  const results = await Promise.all(tables.map(async table => ({
    table,
    exists: await tableExists(table)
  })));

  const missing = results.filter(r => !r.exists);

  console.log('Supabase schema check:');
  results.forEach(r => console.log(`  ${r.table}: ${r.exists ? 'FOUND' : 'MISSING'}`));

  if (missing.length === 0) {
    console.log('\nAll required tables exist. You can now run: node scripts/importExcel.js --file ./members.xlsx');
    process.exit(0);
  }

  console.error(`\nMissing ${missing.length} required table(s): ${missing.map(m => m.table).join(', ')}`);
  console.error('Create the schema using schema.sql in your Supabase project, then re-run this check.');
  console.error('If you have the Supabase CLI installed, you can also apply schema.sql there.');
  process.exit(1);
}

run();
