'use strict';

const axios = require('axios');

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map();

async function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await load();
  cache.set(key, { value, at: Date.now() });
  return value;
}

/** Finds coordinates for a place name in Kenya, or null. */
async function geocode(place) {
  if (!place) return null;
  return cached(`geo:${place}`, async () => {
    const { data } = await axios.get(GEOCODE_URL, {
      params: { name: place, count: 5, language: 'en', countryCode: 'KE' },
      timeout: 5000,
    });
    const hit = (data.results || [])[0];
    return hit ? { lat: hit.latitude, lng: hit.longitude } : null;
  });
}

module.exports = { geocode };
