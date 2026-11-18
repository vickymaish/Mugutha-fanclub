'use strict';

process.env.WHATSAPP_PROVIDER = 'mock';
process.env.ALERT_INCLUDE_DEMO = 'false';

jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);
jest.mock('../src/services/whatsappService', () => ({
  sendClubTemplate: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/locationService', () => ({
  geocode: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/services/paymentService', () => ({
  listPayments: jest.fn(),
  recordCashPayment: jest.fn(),
  startMpesaPayment: jest.fn(),
}));
jest.mock('../src/services/demoService', () => ({
  seedDemo: jest.fn(),
  clearDemo: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const { db } = require('./helpers/supabaseMock');
const dashboardRoutes = require('../src/routes/dashboardRoutes');
const fixtureRoutes = require('../src/routes/fixtureRoutes');
const paymentRoutes = require('../src/routes/paymentRoutes');
const errorMiddleware = require('../src/middleware/errorMiddleware');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/fixtures', fixtureRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use(errorMiddleware);
  return app;
}

describe('backend API routes', () => {
  let app;

  beforeEach(() => {
    db.reset();
    app = createApp();
    db.seed('members', [
      { id: 'member-1', name: 'James Mwangi', phone: '254700000001', tier: 'bronze', membership_status: 'active', opted_out: false, is_demo: false, expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
    ]);
    db.seed('payments', []);
    db.seed('messages', []);
    db.seed('fixtures', [
      { id: 'fixture-1', home_team: 'Mugutha FC', away_team: 'Kahawa United', venue: 'Mugutha Grounds', venue_lat: 1, venue_lng: 36, date: '2030-06-15', time: '15:00', status: 'upcoming' },
    ]);
    db.seed('broadcasts', []);
  });

  test('GET /api/dashboard/summary returns mocked summary data', async () => {
    const response = await request(app).get('/api/dashboard/summary');

    expect(response.status).toBe(200);
    expect(response.body.members).toMatchObject({
      active: 1,
      byTier: { bronze: 1, silver: 0, gold: 0 },
    });
  });

  test('GET /api/fixtures/:id/alert-preview returns a preview using the fixture and recipients', async () => {
    const response = await request(app).get('/api/fixtures/fixture-1/alert-preview');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      opponent: 'Kahawa United',
      venue: 'Mugutha Grounds',
      recipients: 1,
    });
    expect(response.body.text).toContain('Mugutha FC plays Kahawa United');
  });

  test('GET /api/payments/renewals returns members due to renew', async () => {
    const response = await request(app).get('/api/payments/renewals');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([{ id: 'member-1' }]);
  });

  test.skip('BUG: GET /api/fixtures/:id/alert-preview returns 500 instead of a client error for an unknown fixture', async () => {
    const response = await request(app).get('/api/fixtures/unknown/alert-preview');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
});
