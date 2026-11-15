const express = require('express');
const cors = require('cors');
require('./config/supabase');
const memberRoutes = require('./routes/memberRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const internalRoutes = require('./routes/internalRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const fixtureRoutes = require('./routes/fixtureRoutes');
const templateRoutes = require('./routes/templateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mpesaRoutes = require('./routes/mpesaRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const requireAdmin = require('./middleware/requireAdmin');

const app = express();
app.disable('x-powered-by');

// Only the dashboard's own address may call the API from a browser.
// CORS_ORIGINS=https://mugutha-fanclub.vercel.app,http://127.0.0.1:5173
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : undefined));
if (!corsOrigins.length) console.warn('CORS_ORIGINS is not set: any website can call the API from a browser.');

// Keep the raw body: the webhook signature check needs the exact bytes Meta sent.
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));

app.get('/health', (req, res) => res.json({ ok: true }));

// Meta's webhook stays public (it's protected by its signature instead).
app.use('/webhook', webhookRoutes);

// Safaricom's payment callback is public; every result is re-checked with Safaricom.
app.use('/mpesa', mpesaRoutes);

// The mock WhatsApp provider only exists in mock mode.
if ((process.env.WHATSAPP_PROVIDER || 'mock') === 'mock') {
  app.use('/internal', internalRoutes);
}

// Everything under /api needs a signed-in admin.
app.use('/api', requireAdmin);
app.use('/api/ai', aiRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorMiddleware);

module.exports = app;
