import { useEffect, useState } from "react";
import { getFixtures } from "../services/fixtures";

export default function useFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFixtures = async () => {
    try {
      const data = await getFixtures();
      setFixtures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load fixtures:", err);
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFixtures();
  }, []);

  return {
    fixtures,
    loading,
    refreshFixtures: loadFixtures,
  };
}