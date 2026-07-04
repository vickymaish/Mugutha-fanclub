import { useEffect, useState } from "react";
import { getMembers } from "../services/members";

export default function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load members:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  return {
    members,
    loading,
    refreshMembers: loadMembers,
  };
}