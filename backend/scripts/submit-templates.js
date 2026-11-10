'use strict';

// Submits the club's WhatsApp templates to Meta for approval, or shows their status.
//
//   node scripts/submit-templates.js            submit every template
//   node scripts/submit-templates.js --status   show approval status
//
// Needs in backend/.env:
//   WHATSAPP_API_TOKEN            a token with whatsapp_business_management permission
//   WHATSAPP_BUSINESS_ACCOUNT_ID  the WhatsApp Business Account ID (not the phone number ID)
//   WHATSAPP_API_URL              optional, e.g. https://graph.facebook.com/v21.0

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { TEMPLATES, submissionPayload } = require('../src/config/whatsappTemplates');

const token = process.env.WHATSAPP_API_TOKEN;
const accountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const apiUrl = process.env.WHATSAPP_API_URL || '';
const graph = /graph\.facebook\.com\/v\d+\.\d+/.test(apiUrl)
  ? apiUrl.match(/https:\/\/graph\.facebook\.com\/v\d+\.\d+/)[0]
  : 'https://graph.facebook.com/v21.0';

async function call(method, path, body) {
  const response = await fetch(`${graph}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = data.error || {};
    throw new Error(err.error_user_msg || err.message || `HTTP ${response.status}`);
  }
  return data;
}

async function status() {
  const data = await call('GET', `${accountId}/message_templates?fields=name,status,category,language,rejected_reason&limit=100`);
  const ours = new Set(Object.keys(TEMPLATES));
  const rows = (data.data || []).filter((t) => ours.has(t.name));
  for (const name of ours) {
    const t = rows.find((r) => r.name === name);
    const line = t ? `${t.status}${t.category ? ` (${t.category})` : ''}${t.rejected_reason && t.rejected_reason !== 'NONE' ? ` - ${t.rejected_reason}` : ''}` : 'NOT SUBMITTED';
    console.log(`${name.padEnd(20)} ${line}`);
  }
}

async function submit() {
  for (const name of Object.keys(TEMPLATES)) {
    try {
      const result = await call('POST', `${accountId}/message_templates`, submissionPayload(name));
      console.log(`${name.padEnd(20)} submitted: ${result.status || 'PENDING'}`);
    } catch (error) {
      // Re-running is safe: an existing template just reports an error and is left alone.
      console.log(`${name.padEnd(20)} not submitted: ${error.message}`);
    }
  }
  console.log('\nApproval usually takes a few minutes, sometimes up to 24 hours.');
  console.log('Check with: node scripts/submit-templates.js --status');
}

(async () => {
  if (!token || !accountId) {
    console.error('Set WHATSAPP_API_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID in backend/.env first.');
    process.exit(1);
  }
  await (process.argv.includes('--status') ? status() : submit());
})().catch((error) => { console.error('Failed:', error.message); process.exit(1); });
