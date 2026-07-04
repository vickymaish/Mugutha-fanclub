export async function getMembers() {
  try {
    const response = await fetch("http://localhost:5000/api/members");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}