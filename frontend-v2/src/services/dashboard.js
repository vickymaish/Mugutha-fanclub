import { apiFetch } from './api'

async function call(path, options) {
  const res = await apiFetch(path, options)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
  return body
}

export const getSummary = () => call('/dashboard/summary')
export const loadDemo = () => call('/dashboard/demo', { method: 'POST' })
export const clearDemo = () => call('/dashboard/demo', { method: 'DELETE' })
export const sendRenewalReminders = () => call('/payments/renewals/remind', { method: 'POST' })
