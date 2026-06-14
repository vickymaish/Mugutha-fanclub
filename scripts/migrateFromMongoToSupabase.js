/*
  Migration helper from MongoDB to Supabase. Requires the `mongodb` package and the Supabase service role key.
  Run from project root with:
    npm install mongodb
    node scripts/migrateFromMongoToSupabase.js
*/

const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mugutha';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db();

  const members = await db.collection('members').find().toArray();
  const broadcasts = await db.collection('broadcasts').find().toArray();
  const messages = await db.collection('messages').find().toArray();

  if (members.length) {
    await supabase.from('members').insert(
      members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        phone: member.phone,
        email: member.email || null,
        join_date: member.join_date ? new Date(member.join_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        membership_status: member.membership_status || 'active',
        created_at: member.createdAt || new Date().toISOString(),
        updated_at: member.updatedAt || new Date().toISOString()
      }))
    );
  }

  if (broadcasts.length) {
    await supabase.from('broadcasts').insert(
      broadcasts.map((broadcast) => ({
        id: broadcast._id.toString(),
        title: broadcast.title,
        message: broadcast.message,
        status: broadcast.status || 'draft',
        scheduled_for: broadcast.scheduled_for ? new Date(broadcast.scheduled_for).toISOString() : null,
        sent_at: broadcast.sent_at ? new Date(broadcast.sent_at).toISOString() : null,
        created_by: broadcast.created_by ? broadcast.created_by.toString() : null,
        created_at: broadcast.createdAt || new Date().toISOString()
      }))
    );
  }

  if (messages.length) {
    await supabase.from('messages').insert(
      messages.map((message) => ({
        id: message._id.toString(),
        broadcast_id: message.broadcast_id ? message.broadcast_id.toString() : null,
        member_id: message.member_id ? message.member_id.toString() : null,
        status: message.status || 'pending',
        sent_at: message.sent_at ? new Date(message.sent_at).toISOString() : null,
        whatsapp_message_id: message.whatsapp_message_id || null,
        error_message: message.error_message || null
      }))
    );
  }

  await client.close();
  console.log('MongoDB -> Supabase migration completed.');
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message || error);
  process.exit(1);
});
