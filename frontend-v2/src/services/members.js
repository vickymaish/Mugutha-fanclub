const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function getMembers() {
  try {
    const response = await fetch(`${API_URL}/members`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

export async function getMember(id) {
  try {
    const response = await fetch(`${API_URL}/members/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching member:', error);
    return null;
  }
}

export async function sendMemberCard(memberId) {
  try {
    const response = await fetch(`${API_URL}/members/${memberId}/send-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error sending member card:', error);
    throw error;
  }
}