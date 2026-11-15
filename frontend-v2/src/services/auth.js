// Admin sign-in with Supabase Auth (email + password), without extra packages.
// Needs in frontend-v2/.env (and in Vercel > Settings > Environment Variables):
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your anon (public) key
// The anon key is safe in the browser. Never put the service role key here.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = 'mugutha.session';
const listeners = new Set();

function readSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* private mode: stay signed in for this tab only */ }
  memorySession = session;
  listeners.forEach((fn) => fn(session));
}

let memorySession = readSession();

async function tokenRequest(grantType, body) {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Sign-in is not set up: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error_description || data.msg || data.error || 'Sign-in failed';
    throw new Error(/invalid login/i.test(message) ? 'Wrong email or password.' : message);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    email: data.user?.email || '',
  };
}

export async function signIn(email, password) {
  const session = await tokenRequest('password', { email: email.trim(), password });
  writeSession(session);
  return session;
}

export function signOut() {
  writeSession(null);
}

export function getSession() {
  return memorySession;
}

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let refreshing = null;

/** A valid access token, refreshed automatically shortly before it expires. */
export async function getAccessToken() {
  const session = memorySession;
  if (!session) return null;
  if (Date.now() < session.expiresAt - 60_000) return session.accessToken;

  refreshing = refreshing || tokenRequest('refresh_token', { refresh_token: session.refreshToken })
    .then((fresh) => { writeSession(fresh); return fresh.accessToken; })
    .catch(() => { writeSession(null); return null; })
    .finally(() => { refreshing = null; });
  return refreshing;
}
