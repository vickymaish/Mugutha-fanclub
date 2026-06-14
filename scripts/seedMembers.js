// Simple seeder (run with node)
const supabase = require('../backend/src/config/supabase');

async function run() {
  await supabase.from('members').insert([
    {
      name: 'John Doe',
      phone: '+254700000000',
      email: null,
      join_date: new Date().toISOString().slice(0, 10),
      membership_status: 'active'
    }
  ]);
  console.log('seeded');
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
