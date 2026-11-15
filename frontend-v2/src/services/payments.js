import { apiFetch } from './api';

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export async function getPayments() {
  return readJson(await apiFetch('/payments'));
}

export async function getTiers() {
  return readJson(await apiFetch('/payments/tiers'));
}

/** Records cash the treasurer collected. The membership activates immediately. */
export async function recordCash({ name, phone, tier, amount }) {
  return readJson(await apiFetch('/payments/cash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, tier, amount: amount === '' ? undefined : Number(amount) }),
  }));
}

/** Sends an M-Pesa PIN prompt to the supporter's phone. */
export async function requestMpesa({ name, phone, tier }) {
  return readJson(await apiFetch('/payments/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, tier }),
  }));
}
