const axios = require('axios');
const { apiUrl, apiToken, provider, fromNumber } = require('../config/whatsapp');
const { insertMessage } = require('../models/supabaseQueries');

function buildPayload({ phone, message, title }) {
  const text = title ? `${title}\n${message}` : message;

  if (provider === 'twilio') {
    const payload = {
      To: phone,
      Body: text
    };
    if (fromNumber) payload.From = fromNumber;
    return payload;
  }

  return {
    to: phone,
    message: text,
    ...(fromNumber ? { from: fromNumber } : {})
  };
}

async function sendMessage({ broadcastId = null, memberId = null, phone, message, title }) {
  if (!apiUrl || !apiToken) {
    throw new Error('WhatsApp API not configured');
  }

  if (!phone) {
    throw new Error('Missing destination phone number');
  }

  const sentAt = new Date().toISOString();
  const payload = {
    broadcast_id: broadcastId,
    member_id: memberId,
    status: 'pending',
    sent_at: sentAt,
    whatsapp_message_id: null,
    error_message: null
  };

  try {
    const response = await axios.post(apiUrl, buildPayload({ phone, message, title }), {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    payload.status = 'sent';
    payload.whatsapp_message_id = response.data?.id || response.data?.sid || response.data?.messageId || null;

    await insertMessage(payload);
    return { status: 'sent', whatsapp_message_id: payload.whatsapp_message_id };
  } catch (error) {
    payload.status = 'failed';
    payload.error_message = error.message || error.toString();
    await insertMessage(payload);
    throw error;
  }
}

module.exports = { sendMessage };
