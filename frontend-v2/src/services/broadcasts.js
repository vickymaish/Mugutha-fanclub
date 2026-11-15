import { apiFetch } from './api';
// Instead of hardcoding localhost:

// Use environment variable:
export async function getBroadcasts() {
  try {
    const response = await apiFetch(`/broadcasts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return [];
  }
}

export async function createBroadcast(broadcastData) {
  try {
    const response = await apiFetch(`/broadcasts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(broadcastData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error sending broadcast:', error);
    return null;
  }
}