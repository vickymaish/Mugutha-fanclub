'use strict';

// Weather forecast for kick-off, from Open-Meteo (free, no API key).
// Forecasts reach about 16 days ahead; further out we say so instead of guessing.

const axios = require('axios');

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEZONE = 'Africa/Nairobi';
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map();

// WMO weather codes -> plain words.
const CODES = [
  [[0], 'clear skies'],
  [[1, 2], 'partly cloudy'],
  [[3], 'cloudy'],
  [[45, 48], 'foggy'],
  [[51, 53, 55, 56, 57], 'drizzle'],
  [[61, 66, 80], 'light rain'],
  [[63, 81], 'rain'],
  [[65, 67, 82], 'heavy rain'],
  [[95, 96, 99], 'thunderstorms'],
];

function describeCode(code) {
  const match = CODES.find(([codes]) => codes.includes(Number(code)));
  return match ? match[1] : 'mixed weather';
}

/** "24°C, light rain likely (60% chance)" -- short enough for a template variable. */
function describe({ tempC, rainChance, code }) {
  const temp = `${Math.round(tempC)}°C`;
  const sky = describeCode(code);
  const wet = /rain|drizzle|thunder/.test(sky);
  if (rainChance >= 50) return `${temp}, ${wet ? sky : 'rain'} likely (${rainChance}% chance), bring a jacket`;
  if (rainChance >= 25) return `${temp}, ${sky}, some chance of rain (${rainChance}%)`;
  return `${temp}, ${sky}`;
}

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

/**
 * Forecast for one hour at one place.
 * kickoff: "YYYY-MM-DDTHH:00" in Nairobi time.
 * Returns { text, tempC, rainChance, code } or null when there is no forecast yet.
 */
async function forecastAt({ lat, lng, kickoff }) {
  if (lat == null || lng == null || !kickoff) return null;
  const date = kickoff.slice(0, 10);
  const hour = `${kickoff.slice(0, 13)}:00`;

  const hourly = await cached(`wx:${lat},${lng},${date}`, async () => {
    const { data } = await axios.get(FORECAST_URL, {
      params: {
        latitude: lat, longitude: lng, timezone: TIMEZONE,
        hourly: 'temperature_2m,precipitation_probability,weather_code',
        start_date: date, end_date: date,
      },
      timeout: 5000,
    });
    return data.hourly || null;
  });

  const i = hourly?.time?.indexOf(hour) ?? -1;
  if (i < 0) return null;
  const result = {
    tempC: hourly.temperature_2m[i],
    rainChance: hourly.precipitation_probability?.[i] ?? 0,
    code: hourly.weather_code[i],
  };
  return { ...result, text: describe(result) };
}

module.exports = { forecastAt, geocode, describe, describeCode };
