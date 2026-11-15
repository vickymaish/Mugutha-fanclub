'use strict';

// Admin only (mounted under /api, behind requireAdmin).
//   GET    /api/dashboard/summary   numbers for the dashboard home page
//   POST   /api/dashboard/demo      load demo members, payments and fixtures (replaces old demo data)
//   DELETE /api/dashboard/demo      remove all demo data (real data is never touched)

const express = require('express');
const { getSummary } = require('../services/dashboardService');
const { seedDemo, clearDemo } = require('../services/demoService');

const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try { res.json(await getSummary()); } catch (err) { next(err); }
});

router.post('/demo', async (req, res, next) => {
  try { res.status(201).json(await seedDemo()); } catch (err) { next(err); }
});

router.delete('/demo', async (req, res, next) => {
  try { res.json(await clearDemo()); } catch (err) { next(err); }
});

module.exports = router;
