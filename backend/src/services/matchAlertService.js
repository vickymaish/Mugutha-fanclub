'use strict';

// Match-day alerts include the fixture details and a "Get directions" button.
//
// Sent automatically (jobs/matchReminderJob.js): the evening before and the
// morning of each match. Also sent on demand from the dashboard's Fixtures page.
// Goes to active members who haven't replied STOP.

const supabase = require('../config/supabase');
const { sendClubTemplate } = require('./whatsappService');
const { geocode } = require('./locationService');

const TIMEZONE = 'Africa/Nairobi';
const CLUB_NAME = process.env.CLUB_NAME || 'Mugutha FC';
// A word that appears in the club's own team name in fixtures (home_team / away_team).
const CLUB_MATCH = (process.env.CLUB_MATCH_WORD || 'mugutha').toLowerCase();
// The home ground, used when a fixture has no map pin of its own.
const HOME_GROUND = {
  name: process.env.CLUB_GROUND_NAME || 'Mugutha',
  lat: process.env.CLUB_GROUND_LAT ? Number(process.env.CLUB_GROUND_LAT) : null,
  lng: process.env.CLUB_GROUND_LNG ? Number(process.env.CLUB_GROUND_LNG) : null,
};
const SEND_GAP_MS = 120; // small pause between members so we stay under WhatsApp rate limits

// Demo members (fake 2540... numbers) only get messages in mock mode, and only if asked.
function includeDemo() {
  return process.env.ALERT_INCLUDE_DEMO === 'true' && (process.env.WHATSAPP_PROVIDER || 'mock') === 'mock';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isClub(team) {
  return String(team || '').toLowerCase().includes(CLUB_MATCH);
}

/** The other team. */
function opponentOf(fixture) {
  if (isClub(fixture.home_team)) return fixture.away_team || 'our opponents';
  if (isClub(fixture.away_team)) return fixture.home_team || 'our opponents';
  return `${fixture.home_team} vs ${fixture.away_team}`;
}

/** "2026-11-21T15:00" in Nairobi time, or null when the date is missing. */
function kickoffLocal(fixture) {
  if (!fixture.date) return null;
  const date = String(fixture.date).slice(0, 10);
  const time = /^\d{1,2}:\d{2}/.test(fixture.time || '') ? fixture.time.slice(0, 5).padStart(5, '0') : '15:00';
  return `${date}T${time}`;
}

/** "Saturday 21 Nov, 3:00 pm" */
function whenText(fixture) {
  const local = kickoffLocal(fixture);
  if (!local) return 'a date to be confirmed';
  const at = new Date(`${local}:00+03:00`);
  const day = at.toLocaleDateString('en-GB', { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'short' });
  const time = fixture.time
    ? at.toLocaleTimeString('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : 'time to be confirmed';
  return `${day.replace(',', '')}, ${time}`;
}

/** Where the ground is: the fixture's own pin, the home ground, or a place-name lookup. */
async function venueCoords(fixture) {
  if (fixture.venue_lat != null && fixture.venue_lng != null) {
    return { lat: Number(fixture.venue_lat), lng: Number(fixture.venue_lng) };
  }
  const venue = String(fixture.venue || '');
  const atHome = !venue || venue.toLowerCase().includes(HOME_GROUND.name.toLowerCase());
  if (atHome && HOME_GROUND.lat != null && HOME_GROUND.lng != null) {
    return { lat: HOME_GROUND.lat, lng: HOME_GROUND.lng };
  }
  try { return await geocode(venue); } catch { return null; }
}

/** Builds the fixture details and directions link for an alert. */
async function buildAlert(fixture) {
  const coords = await venueCoords(fixture);
  const venue = fixture.venue || 'the usual ground';
  const mapQuery = coords ? `${coords.lat},${coords.lng}` : `${venue} Kenya`;
  return {
    opponent: opponentOf(fixture),
    when: whenText(fixture),
    venue,
    mapQuery,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
  };
}

/** Active, paid-up members who haven't replied STOP. */
async function alertRecipients() {
  let query = supabase.from('members')
    .select('id, name, phone')
    .eq('membership_status', 'active')
    .eq('opted_out', false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  if (!includeDemo()) query = query.eq('is_demo', false);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).filter((m) => m.phone);
}

function firstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0];
  return first && first !== 'Supporter' ? first : 'supporter';
}

async function getFixture(id) {
  const { data, error } = await supabase.from('fixtures').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) {
    const notFound = new Error('Fixture not found');
    notFound.status = 404;
    throw notFound;
  }
  return data;
}

/** What the dashboard shows before sending: the message and recipient count. */
async function previewAlert(fixtureId) {
  const fixture = await getFixture(fixtureId);
  const alert = await buildAlert(fixture);
  const recipients = await alertRecipients();
  return {
    ...alert,
    recipients: recipients.length,
    text: `Hi James, ${CLUB_NAME} plays ${alert.opponent} on ${alert.when} at ${alert.venue}. ` +
      'Come with your voice and bring a friend. Tuko pamoja!',
  };
}

const FLAG = { day_before: 'alert_day_before_at', matchday: 'alert_matchday_at' };

/**
 * Sends the alert for one fixture to every recipient.
 * kind: 'manual' (dashboard), 'day_before' or 'matchday' (scheduled).
 */
async function sendFixtureAlert(fixtureOrId, { kind = 'manual' } = {}) {
  const fixture = typeof fixtureOrId === 'object' ? fixtureOrId : await getFixture(fixtureOrId);
  const alert = await buildAlert(fixture);
  const recipients = await alertRecipients();

  // Mark scheduled alerts as sent BEFORE sending, so a crash or a second server
  // can never send the same alert twice. (A missed alert is better than a double one.)
  if (FLAG[kind]) {
    await supabase.from('fixtures').update({ [FLAG[kind]]: new Date().toISOString() }).eq('id', fixture.id);
  }

  let sent = 0;
  let failed = 0;
  for (const member of recipients) {
    try {
      await sendClubTemplate({
        phone: member.phone,
        memberId: member.id,
        name: 'match_day_alert',
        values: { name: firstName(member.name), opponent: alert.opponent, when: alert.when, venue: alert.venue, mapQuery: alert.mapQuery },
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`Match alert to ${member.phone} failed:`, err.response?.data?.error?.message || err.message);
    }
    await sleep(SEND_GAP_MS);
  }

  try {
    await supabase.from('broadcasts').insert([{
      title: `Match alert: ${CLUB_NAME} vs ${alert.opponent}`,
      message: `${CLUB_NAME} vs ${alert.opponent} on ${alert.when} at ${alert.venue}.`,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.error('Could not log the match alert broadcast:', err.message);
  }

  console.log(`Match alert (${kind}) for ${CLUB_NAME} vs ${alert.opponent}: ${sent} sent, ${failed} failed`);
  return { sent, failed, total: recipients.length };
}

/** Nairobi calendar date, offset by `days`: "2026-11-21". */
function nairobiDate(days = 0) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Scheduled run: alerts for upcoming fixtures on the given day that haven't had this alert yet. */
async function sendScheduledAlerts(kind) {
  const day = kind === 'day_before' ? nairobiDate(1) : nairobiDate(0);
  const { data: fixtures, error } = await supabase.from('fixtures')
    .select('*')
    .eq('status', 'upcoming')
    .eq('date', day)
    .is(FLAG[kind], null);
  if (error) throw error;
  for (const fixture of fixtures || []) {
    try { await sendFixtureAlert(fixture, { kind }); } catch (err) {
      console.error(`Scheduled ${kind} alert for fixture ${fixture.id} failed:`, err.message);
    }
  }
  return (fixtures || []).length;
}

module.exports = { previewAlert, sendFixtureAlert, sendScheduledAlerts, opponentOf, whenText, kickoffLocal, nairobiDate };
