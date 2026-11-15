import { apiFetch } from './api';
// Instead of hardcoding localhost:

// Use environment variable:
export async function getFixtures() {
  try {
    const response = await apiFetch(`/fixtures`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
}

export async function createFixture(fixtureData) {
  try {
    const response = await apiFetch(`/fixtures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fixtureData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating fixture:", error);
    return null;
  }
}

export async function updateFixture(id, fixtureData) {
  try {
    const response = await apiFetch(`/fixtures/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fixtureData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating fixture:", error);
    return null;
  }
}

export async function deleteFixture(id) {
  try {
    const response = await apiFetch(`/fixtures/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error("Error deleting fixture:", error);
    return false;
  }
}