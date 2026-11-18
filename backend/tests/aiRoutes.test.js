'use strict';

delete process.env.FEATHERLESS_API_KEY;

const express = require('express');
const request = require('supertest');
const aiRoutes = require('../src/routes/aiRoutes');

describe('AI routes without provider credentials', () => {
  test('returns 503 instead of crashing when FEATHERLESS_API_KEY is unset', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);

    const response = await request(app)
      .post('/api/ai/generate-message')
      .send({ eventType: 'match_day' });

    expect(response.status).toBe(503);
    expect(response.body.error).toMatch(/not set up/i);
  });
});
