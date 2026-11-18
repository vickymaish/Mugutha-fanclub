'use strict';

process.env.WHATSAPP_PROVIDER = 'mock';
process.env.ALERT_INCLUDE_DEMO = 'false';
process.env.SCHEDULER_ENABLED = 'false';

jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);
jest.mock('../src/services/whatsappService', () => ({
  sendClubTemplate: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/locationService', () => ({
  geocode: jest.fn().mockResolvedValue(null),
}));

const fs = require('fs');
const path = require('path');
const { db } = require('./helpers/supabaseMock');
const { sendClubTemplate } = require('../src/services/whatsappService');
const { TEMPLATES } = require('../src/config/whatsappTemplates');
const {
  previewAlert,
  sendScheduledAlerts,
  nairobiDate,
} = require('../src/services/matchAlertService');

function seedFixture(fixture) {
  db.seed('fixtures', [{
    id: 'fixture-1',
    home_team: 'Mugutha FC',
    away_team: 'Kahawa United',
    venue: 'Mugutha Grounds',
    date: nairobiDate(3),
    time: '15:00',
    status: 'upcoming',
    venue_lat: 1.1,
    venue_lng: 36.8,
    ...fixture,
  }]);
}

function seedRecipients() {
  db.seed('members', [
    { id: 'member-1', name: 'James Mwangi', phone: '254700000001', membership_status: 'active', opted_out: false, is_demo: false },
    { id: 'demo-1', name: 'Demo Member', phone: '254000000001', membership_status: 'active', opted_out: false, is_demo: true },
  ]);
}

describe('match alert service', () => {
  beforeEach(() => {
    db.reset();
    jest.clearAllMocks();
    process.env.WHATSAPP_PROVIDER = 'mock';
    process.env.ALERT_INCLUDE_DEMO = 'false';
  });

  test('previews the four ordered template values: name, opponent, when, venue', async () => {
    const fixture = {
      id: 'fixture-1',
      home_team: 'Mugutha FC',
      away_team: 'Kahawa United',
      venue: 'Mugutha Grounds',
      date: nairobiDate(3),
      time: '15:00',
      status: 'upcoming',
      venue_lat: 1.1,
      venue_lng: 36.8,
    };
    seedFixture(fixture);
    seedRecipients();

    const preview = await previewAlert('fixture-1');

    expect(TEMPLATES.match_day_alert.params).toEqual(['name', 'opponent', 'when', 'venue']);
    expect(preview.text).toBe(
      `Hi James, Mugutha FC plays Kahawa United on ${preview.when} at Mugutha Grounds. ` +
      'Come with your voice and bring a friend. Tuko pamoja!',
    );
    expect(preview).toMatchObject({
      opponent: 'Kahawa United',
      venue: 'Mugutha Grounds',
      recipients: 1,
    });
  });

  test.each([
    ['mock', 'true', 2],
    ['mock', 'false', 1],
    ['meta', 'true', 1],
    ['meta', 'false', 1],
  ])('includes demo recipients only for provider=%s and ALERT_INCLUDE_DEMO=%s', async (provider, includeDemo, expected) => {
    process.env.WHATSAPP_PROVIDER = provider;
    process.env.ALERT_INCLUDE_DEMO = includeDemo;
    seedFixture({});
    seedRecipients();

    await expect(previewAlert('fixture-1')).resolves.toMatchObject({ recipients: expected });
  });

  test.each([
    ['day_before', 1, 'alert_day_before_at'],
    ['matchday', 0, 'alert_matchday_at'],
  ])('sends %s alerts only for matching upcoming fixtures and records the sent flag', async (kind, offset, flag) => {
    seedRecipients();
    db.seed('fixtures', [
      {
        id: 'target',
        home_team: 'Mugutha FC',
        away_team: 'Target United',
        venue: 'Target Ground',
        date: nairobiDate(offset),
        time: '15:00',
        status: 'upcoming',
        venue_lat: 1,
        venue_lng: 36,
        [flag]: null,
      },
      {
        id: 'wrong-date',
        home_team: 'Mugutha FC',
        away_team: 'Wrong Date FC',
        date: nairobiDate(offset + 2),
        status: 'upcoming',
        [flag]: null,
      },
      {
        id: 'not-upcoming',
        home_team: 'Mugutha FC',
        away_team: 'Old United',
        date: nairobiDate(offset),
        status: 'played',
        [flag]: null,
      },
    ]);

    await expect(sendScheduledAlerts(kind)).resolves.toBe(1);
    await expect(sendScheduledAlerts(kind)).resolves.toBe(0);

    expect(sendClubTemplate).toHaveBeenCalledTimes(1);
    expect(sendClubTemplate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'match_day_alert',
      values: expect.objectContaining({ name: 'James', opponent: 'Target United', venue: 'Target Ground' }),
    }));
    expect(db.rows('fixtures').find((fixture) => fixture.id === 'target')[flag]).toBeTruthy();
  });

  test('application JavaScript has no remaining weather or forecast references', () => {
    const sourceRoot = path.join(__dirname, '../src');
    const files = [];
    const visit = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(fullPath);
        else if (entry.name.endsWith('.js')) files.push(fullPath);
      }
    };
    visit(sourceRoot);

    const references = files.filter((file) => /\bweather\b|\bforecast\b/i.test(fs.readFileSync(file, 'utf8')));
    expect(references).toEqual([]);
  });
});
