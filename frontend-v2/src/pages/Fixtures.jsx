import React, { useState } from 'react';  // ← Add this import
import useFixtures from "../hooks/useFixtures";
import FixturesTable from "../components/fixtures/FixturesTable";

export default function Fixtures() {
  const { fixtures, loading } = useFixtures();
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  // Handler for sending alert
  const handleSendAlert = async (fixture) => {
    try {
      // Build the message
      const message = `⚽️ MATCH ALERT!\n\n${fixture.home_team} vs ${fixture.away_team}\n📅 ${new Date(fixture.date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}\n⏰ ${fixture.time ? fixture.time.slice(0,5) : 'TBD'}\n📍 ${fixture.venue || 'TBD'}\n\nCome support Mugutha FC! #MoreThanFootball`;

      // Call the backend endpoint to send the alert
      const response = await fetch(`/api/fixtures/${fixture.id}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('Failed to send alert');

      const result = await response.json();
      showToast(`✅ Alert sent to ${result.sent} members!`, 'success');
    } catch (error) {
      console.error('Error sending alert:', error);
      showToast('❌ Failed to send alert. Check server logs.', 'error');
    }
  };

  const upcomingCount = fixtures.filter(f => f.status === "upcoming").length;
  const totalCount = fixtures.length;

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Fixtures</h1>
          <p>Manage Mugutha FC match schedule</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary">+ Add Fixture</button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>All Fixtures</h3>
          <span className="fixture-count">
            {upcomingCount} upcoming · {totalCount} total
          </span>
        </div>
        <FixturesTable
          fixtures={fixtures}
          loading={loading}
          onSendAlert={handleSendAlert}
        />
      </div>

      {/* Simple toast (or reuse your existing Toast component) */}
      {toast.message && (
        <div className={`toast ${toast.type}`} style={{
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