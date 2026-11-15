'use strict';

// Checks that a webhook POST really comes from Meta. Meta signs every request
// with your app secret in the X-Hub-Signature-256 header; anyone else posting
// to /webhook gets a 401.
//
//   WHATSAPP_APP_SECRET=...   Meta for Developers > your app > App settings > Basic > App secret
//
// If the secret isn't set yet, requests are let through with a warning so an
// existing setup keeps working, but set it before going live.

const crypto = require('crypto');

let warned = false;

module.exports = function verifyMetaSignature(req, res, next) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    if (!warned) {
      console.warn('WHATSAPP_APP_SECRET is not set: webhook signatures are NOT being checked.');
      warned = true;
    }
    return next();
  }

  const signature = req.get('x-hub-signature-256') || '';
  if (!req.rawBody || !signature.startsWith('sha256=')) {
    return res.sendStatus(401);
  }

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn('Rejected webhook with a bad signature.');
    return res.sendStatus(401);
  }
  next();
};
