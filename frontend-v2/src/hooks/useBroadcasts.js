import { useState, useEffect } from 'react';
import { getBroadcasts } from '../services/broadcasts';

export default function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBroadcasts = async () => {
    try {
      const data = await getBroadcasts();
      setBroadcasts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  return {
    broadcasts,
    loading,
    refreshBroadcasts: loadBroadcasts,
  };
}