import React, { useState } from 'react';
import useBroadcasts from '../hooks/useBroadcasts';
import BroadcastList from '../components/broadcasts/BroadcastList';
import BroadcastModal from '../components/BroadcastModal';  // ← Your existing modal

export default function Broadcasts() {
  const { broadcasts, loading, refreshBroadcasts } = useBroadcasts();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  const handleCreate = () => {
    setShowModal(true);
  };

  const handleSend = (data) => {
    setShowModal(false);
    refreshBroadcasts();
    showToast('Broadcast sent successfully!');
  };

  // Get tier counts from your broadcasts data or members data
  const tierCounts = {
    total: broadcasts.length || 0,
    gold: broadcasts.filter(b => b.tier === 'gold').length || 0,
    silver: broadcasts.filter(b => b.tier === 'silver').length || 0,
    bronze: broadcasts.filter(b => b.tier === 'bronze').length || 0,
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>📢 Broadcasts</h1>
          <p>Send and manage WhatsApp broadcasts to members</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={handleCreate}>
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

      {/* Use your existing modal */}
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