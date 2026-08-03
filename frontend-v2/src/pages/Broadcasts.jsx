import React, { useState, useEffect } from 'react';
import useBroadcasts from '../hooks/useBroadcasts';
import BroadcastList from '../components/broadcasts/BroadcastList';
import BroadcastModal from '../components/BroadcastModal';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Broadcasts() {
  const { broadcasts, loading, refreshBroadcasts } = useBroadcasts();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [tierCounts, setTierCounts] = useState({ total: 0, gold: 0, silver: 0, bronze: 0 });

  // Fetch REAL active member counts
  useEffect(() => {
    async function fetchMemberCounts() {
      try {
        const res = await fetch(`${API}/members`);
        if (!res.ok) throw new Error('Failed to fetch members');
        const members = await res.json();
        
        const active = members.filter(m => m.membership_status === 'active');
        
        setTierCounts({
          total: active.length,
          gold: active.filter(m => m.tier?.toLowerCase() === 'gold').length,
          silver: active.filter(m => m.tier?.toLowerCase() === 'silver').length,
          bronze: active.filter(m => m.tier?.toLowerCase() === 'bronze').length,
        });
      } catch (err) {
        console.error('Failed to fetch member counts:', err);
      }
    }
    fetchMemberCounts();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  const handleSend = (data) => {
    setShowModal(false);
    refreshBroadcasts();
    showToast('Broadcast sent successfully!');
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>📢 Broadcasts</h1>
          <p>Send and manage WhatsApp broadcasts to members</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Broadcast
          </button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>All Broadcasts</h3>
          <span className="broadcast-count">{broadcasts.length} total</span>
        </div>
        <BroadcastList broadcasts={broadcasts} loading={loading} />
      </div>

      <BroadcastModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSend={handleSend}
        tierCounts={tierCounts}
        preSelectedTier="all"
      />

      {toast.message && (
        <div className="toast" style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#b91c1c' : '#1a4d2e',
          color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}