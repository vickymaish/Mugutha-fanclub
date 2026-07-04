const axios = require('axios');
const { apiUrl, apiToken, provider, fromNumber, phoneNumberId } = require('../config/whatsapp');
const { insertMessage } = require('../models/supabaseQueries');

function buildTextPayload({ phone, message, title }) {
  const text = title ? `${title}\n${message}` : message;

  if (provider === 'twilio') {
    const payload = { To: phone, Body: text };
    if (fromNumber) payload.From = fromNumber;
    return payload;
  }

  if (provider === 'meta') {
    const cleanPhone = String(phone).replace(/\D/g, '');
    return {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: text },
    };
  }

  // mock / default provider
  return {
    to: phone,
    message: text,
    ...(fromNumber ? { from: fromNumber } : {}),
  };
}

function buildTemplatePayload({ phone, templateName = 'hello_world', languageCode = 'en_US' }) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  return {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };
}

function buildUrl() {
  switch (provider) {
    case 'meta':
      if (!phoneNumberId) {
        throw new Error('WHATSAPP_PHONE_NUMBER_ID is missing.');
      }
      return `${apiUrl}/${phoneNumberId}/messages`;

    case 'twilio':
    case 'mock':
    default:
      return apiUrl;
  }
}
function extractMessageId(responseData) {
  return (
    responseData?.messages?.[0]?.id ||
    responseData?.id ||
    responseData?.sid ||
    responseData?.messageId ||
    null
  );
}

function extractErrorMessage(error) {
  return (
    error.response?.data?.error?.message ||
    error.message ||
    error.toString()
  );
}

async function postToProvider(body) {
  if (!apiUrl || !apiToken) {
    throw new Error('WhatsApp API not configured');
  }
  const url = buildUrl();
  return axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Sends a free-form text message.
 *
 * IMPORTANT (Meta Cloud API rule):
 * This only delivers if the recipient has an OPEN conversation window —
 * meaning they messaged your business number within the last 24 hours,
 * or replied to a template you sent them. Outside that window, Meta will
 * return a "success" API response with a message ID, but will NOT
 * actually deliver the message. This is not a bug — it's WhatsApp's
 * anti-spam policy. Use sendTemplate() for first contact instead.
 */
async function sendMessage({ broadcastId = null, memberId = null, phone, message, title }) {
  if (!phone) throw new Error('Missing destination phone number');

  const payload = {
    broadcast_id: broadcastId,
    member_id: memberId,
    status: 'pending',
    sent_at: new Date().toISOString(),
    whatsapp_message_id: null,
    error_message: null,
  };

  try {
    const response = await postToProvider(buildTextPayload({ phone, message, title }));
    payload.status = 'sent';
    payload.whatsapp_message_id = extractMessageId(response.data);
    await insertMessage(payload);
    return { status: 'sent', whatsapp_message_id: payload.whatsapp_message_id };
  } catch (error) {
    payload.status = 'failed';
    payload.error_message = extractErrorMessage(error);
    await insertMessage(payload);
    throw error;
  }
}

/**
 * Sends an approved template message (e.g. "hello_world").
 *
 * Use this for FIRST CONTACT with a phone number, or to re-open a
 * conversation window after 24 hours of silence. Templates are the
 * only message type WhatsApp allows you to send without the recipient
 * having messaged you first.
 *
 * Once the recipient replies to this message, sendMessage() (plain text)
 * will work for the next 24 hours.
 */
async function sendTemplate({ broadcastId = null, memberId = null, phone, templateName = 'hello_world', languageCode = 'en_US' }) {
  if (!phone) throw new Error('Missing destination phone number');

  const payload = {
    broadcast_id: broadcastId,
    member_id: memberId,
    status: 'pending',
    sent_at: new Date().toISOString(),
    whatsapp_message_id: null,
    error_message: null,
  };

  try {
    const response = await postToProvider(buildTemplatePayload({ phone, templateName, languageCode }));
    payload.status = 'sent';
    payload.whatsapp_message_id = extractMessageId(response.data);
    await insertMessage(payload);
    return { status: 'sent', whatsapp_message_id: payload.whatsapp_message_id };
  } catch (error) {
    payload.status = 'failed';
    payload.error_message = extractErrorMessage(error);
    await insertMessage(payload);
    throw error;
  }
}

module.exports = { sendMessage, sendTemplate };