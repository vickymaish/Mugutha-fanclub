// backend/src/services/mediaService.js
//
// Two responsibilities only:
//   uploadImage(buffer)        → returns Meta media_id
//   sendImage(phone, id, cap)  → sends image message via WhatsApp Cloud API
//
// Depends on:
//   WHATSAPP_API_TOKEN        in .env
//   WHATSAPP_PHONE_NUMBER_ID  in .env
//   WHATSAPP_API_URL          in .env  (https://graph.facebook.com/v25.0)

const axios = require('axios');
const FormData = require('form-data');
const { apiToken, phoneNumberId, apiUrl } = require('../config/whatsapp');

function authHeaders() {
  return { Authorization: `Bearer ${apiToken}` };
}

/**
 * Upload a JPEG Buffer to Meta's media API.
 * Returns the media_id string (valid for ~30 days).
 *
 * @param {Buffer} buffer - JPEG image buffer from imageService
 * @returns {Promise<string>} media_id
 */
async function uploadImage(buffer) {
  if (!phoneNumberId) throw new Error('WHATSAPP_PHONE_NUMBER_ID not set');
  if (!apiToken)      throw new Error('WHATSAPP_API_TOKEN not set');

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'image/jpeg');
  form.append('file', buffer, {
    filename: 'member-card.jpg',
    contentType: 'image/jpeg',
  });

  const url = `${apiUrl}/${phoneNumberId}/media`;

  const response = await axios.post(url, form, {
    headers: {
      ...authHeaders(),
      ...form.getHeaders(),
    },
  });

  const mediaId = response.data?.id;
  if (!mediaId) {
    throw new Error(`Meta media upload failed: ${JSON.stringify(response.data)}`);
  }

  console.log(`[mediaService] Uploaded image → media_id: ${mediaId}`);
  return mediaId;
}

/**
 * Send an image message to a WhatsApp number using a media_id.
 *
 * @param {string} phone    - Recipient phone e.g. "254736506027"
 * @param {string} mediaId  - From uploadImage()
 * @param {string} caption  - Optional caption text shown below image
 * @returns {Promise<string>} WhatsApp message_id (wamid...)
 */
async function sendImage(phone, mediaId, caption = '') {
  if (!phoneNumberId) throw new Error('WHATSAPP_PHONE_NUMBER_ID not set');

  const cleanPhone = String(phone).replace(/\D/g, '');
  const url = `${apiUrl}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'image',
    image: {
      id: mediaId,
      ...(caption ? { caption } : {}),
    },
  };

  const response = await axios.post(url, body, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
  });

  const messageId = response.data?.messages?.[0]?.id;
  console.log(`[mediaService] Image sent to ${cleanPhone} → message_id: ${messageId}`);
  return messageId;
}

module.exports = { uploadImage, sendImage };