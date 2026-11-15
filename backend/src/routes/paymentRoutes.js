'use strict';

// Admin only (mounted under /api, behind requireAdmin).
//   GET  /api/payments          recent payments
//   GET  /api/payments/tiers    tier names and prices
//   POST /api/payments/cash     { name, phone, tier, amount? }  record cash, activate now
//   POST /api/payments/request  { name, phone, tier }           send an M-Pesa prompt
//   GET  /api/payments/renewals          members whose membership ends within 30 days
//   POST /api/payments/renewals/remind   send due renewal reminders now (normally 10 am daily)

const express = require('express');
const { listPayments, recordCashPayment, startMpesaPayment } = require('../services/paymentService');
const { TIERS } = require('../config/tiers');
const { listRenewalsDue, sendRenewalReminders } = require('../services/renewalService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try { res.json(await listPayments({ limit: req.query.limit })); } catch (err) { next(err); }
});

router.get('/tiers', (req, res) => {
  res.json(Object.entries(TIERS).map(([key, t]) => ({ key, label: t.label, price: t.price, perks: t.perks })));
});

router.post('/cash', async (req, res, next) => {
  try {
    const { name, phone, tier, amount } = req.body || {};
    const { payment, member } = await recordCashPayment({ name, phone, tier, amount, recordedBy: req.user?.email });
    res.status(201).json({ payment, member: { id: member.id, name: member.name, tier: member.tier, expires_at: member.expires_at, member_number: member.member_number } });
  } catch (err) { next(err); }
});

router.post('/request', async (req, res, next) => {
  try {
    const { name, phone, tier } = req.body || {};
    const { payment, amount } = await startMpesaPayment({ name, phone, tier, source: 'admin', recordedBy: req.user?.email });
    res.status(202).json({ id: payment.id, status: payment.status, amount });
  } catch (err) { next(err); }
});

router.get('/renewals', async (req, res, next) => {
  try { res.json(await listRenewalsDue(Number(req.query.days) || 30)); } catch (err) { next(err); }
});

router.post('/renewals/remind', async (req, res, next) => {
  try { res.json(await sendRenewalReminders()); } catch (err) { next(err); }
});

module.exports = router;
