// Instead of hardcoding localhost:
// const API_URL = 'http://localhost:5000/api';

// Use environment variable:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function getTemplates() {
  try {
    const response = await fetch(`${API_URL}/templates`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export async function createTemplate(templateData) {
  try {
    const response = await fetch(`${API_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error creating template:', error);
    return null;
  }
}

export async function updateTemplate(id, templateData) {
  try {
    const response = await fetch(`${API_URL}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating template:', error);
    return null;
  }
}

export async function deleteTemplate(id) {
  try {
    const response = await fetch(`${API_URL}/templates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}