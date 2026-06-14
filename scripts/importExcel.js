// scripts/importExcel.js
// Run with: node scripts/importExcel.js --file path/to/members.xlsx

const fs = require('fs');
const path = require('path');
const BASE_DIR = path.resolve(__dirname, '..');
const BACKEND_NODE_MODULES = path.resolve(BASE_DIR, 'backend', 'node_modules');

function requireBackend(moduleName) {
  return require(require.resolve(moduleName, { paths: [BACKEND_NODE_MODULES] }));
}

const XLSX = requireBackend('xlsx');
const dotenv = requireBackend('dotenv');
const { createClient } = requireBackend('@supabase/supabase-js');

const envPath = path.resolve(BASE_DIR, 'backend', '.env');

dotenv.config({ path: envPath });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function printUsage() {
  console.log('Usage: node scripts/importExcel.js --file <path/to/members.xlsx|members.csv>');
  console.log('If no file is provided, the default is scripts/members.xlsx.');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const fileIndex = args.findIndex(arg => arg === '--file');
  if (fileIndex >= 0 && args[fileIndex + 1]) {
    return args[fileIndex + 1];
  }
  return './members.xlsx';
}

function normalizePhone(rawPhone) {
  if (!rawPhone) return null;
  let phone = String(rawPhone).trim();
  phone = phone.replace(/[^0-9+]/g, '');
  if (phone.startsWith('+')) {
    phone = phone.slice(1);
  }
  if (phone.startsWith('0') && phone.length === 10) {
    phone = `254${phone.slice(1)}`;
  }
  return phone;
}

function mapMemberRow(row) {
  return {
    name: row['Name'] || row['Full Name'] || row['member_name'] || row['name'] || null,
    phone: row['Phone'] || row['WhatsApp Number'] || row['phone_number'] || row['phone'] || null,
    email: row['Email'] || row['email'] || null,
    join_date: row['Join Date'] || row['join_date'] || row['joined'] || new Date().toISOString().split('T')[0],
    membership_status: (row['Status'] || row['status'] || 'active').toString().toLowerCase() === 'inactive' ? 'inactive' : 'active'
  };
}

function createDummyFile(filePath) {
  const sampleRows = [
    { Name: 'John Doe', Phone: '0712345678', Email: 'john.doe@example.com', 'Join Date': '2024-01-15', Status: 'active' },
    { Name: 'Jane Mwangi', Phone: '0722345678', Email: 'jane.mwangi@example.com', 'Join Date': '2024-02-10', Status: 'active' },
    { Name: 'Samuel Kariuki', Phone: '0732345678', Email: 'samuel.kariuki@example.com', 'Join Date': '2024-03-05', Status: 'inactive' },
    { Name: 'Aisha Ahmed', Phone: '0742345678', Email: 'aisha.ahmed@example.com', 'Join Date': '2024-04-12', Status: 'active' },
    { Name: 'Peter Otieno', Phone: '0701234567', Email: 'peter.otieno@example.com', 'Join Date': '2024-05-20', Status: 'active' },
    { Name: 'Mercy Njeri', Phone: '0791234567', Email: 'mercy.njeri@example.com', 'Join Date': '2024-06-08', Status: 'active' },
    { Name: 'Brian Wanjiru', Phone: '0781234567', Email: 'brian.wanjiru@example.com', 'Join Date': '2024-07-14', Status: 'inactive' },
    { Name: 'Grace Kamau', Phone: '0771234567', Email: 'grace.kamau@example.com', 'Join Date': '2024-08-02', Status: 'active' },
    { Name: 'David Kipsang', Phone: '0761234567', Email: 'david.kipsang@example.com', 'Join Date': '2024-09-22', Status: 'active' },
    { Name: 'Faith Mutheu', Phone: '0751234567', Email: 'faith.mutheu@example.com', 'Join Date': '2024-10-30', Status: 'active' }
  ];
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    const header = Object.keys(sampleRows[0]).join(',');
    const rows = sampleRows.map(row =>
      Object.values(row)
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );
    fs.writeFileSync(filePath, `${header}\n${rows.join('\n')}`, 'utf8');
  } else {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Members');
    XLSX.writeFile(workbook, filePath);
  }

  console.log(`Created dummy members file at ${filePath}`);
}

async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath, { raw: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  }

  throw new Error('Unsupported file type. Use .xlsx, .xls, or .csv');
}

async function importMembers() {
  const rawFilePath = parseArgs();
  const filePath = path.resolve(process.cwd(), rawFilePath);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    console.warn('Creating a dummy sample members file and importing it now.');
    createDummyFile(filePath);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
  }

  const rows = await parseFile(filePath);
  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const member = mapMemberRow(row);
    member.phone = normalizePhone(member.phone);

    if (!member.name || !member.phone) {
      console.warn('Skipping row missing name or phone:', row);
      errorCount++;
      continue;
    }

    const { error } = await supabase
      .from('members')
      .upsert(member, { onConflict: 'phone' });

    if (error) {
      console.error(`Failed to import ${member.name} (${member.phone}):`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Imported: ${member.name} (${member.phone})`);
      successCount++;
    }
  }

  console.log(`\nDone. Success: ${successCount}, Errors: ${errorCount}`);
}

function isMissingTableError(error) {
  const msg = error?.message || '';
  return msg.includes('Could not find the table') || msg.includes('relation "public.members" does not exist') || msg.includes('schema cache');
}

importMembers().catch(error => {
  if (isMissingTableError(error)) {
    console.error('Import failed because the Supabase `members` table does not exist.');
    console.error('Create the schema from schema.sql or run scripts/checkSupabaseSchema.js to confirm missing tables.');
  } else {
    console.error('Import failed:', error.message || error);
  }
  process.exit(1);
});