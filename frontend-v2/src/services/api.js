// Every call to the backend goes through apiFetch, which adds the admin's
// sign-in token. If the backend says the session is no longer valid, the admin
// is signed out and sees the login page again.
import { getAccessToken, signOut } from './auth';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401) signOut();
  return response;
}
