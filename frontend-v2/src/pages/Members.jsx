import React, { useState } from 'react';
import useMembers from "../hooks/useMembers";
import MembersTable from "../components/members/MembersTable";
import { sendMemberCard } from "../services/members"; // Import the service

export default function Members() {
  const { members, loading } = useMembers();
  const [sendingCardId, setSendingCardId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  // Handle sending the membership card
  const handleSendCard = async (memberId) => {
    setSendingCardId(memberId);
    try {
      const result = await sendMemberCard(memberId);
      showToast(`✅ Membership card sent to ${result.member?.name || 'member'}!`, 'success');
    } catch (error) {
      showToast(`❌ Failed to send card: ${error.message}`, 'error');
    } finally {
      setSendingCardId(null);
    }
  };

  const activeCount = members.filter(m => m.membership_status === 'active').length;
  const totalCount = members.length;

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Members</h1>
          <p>Manage Mugutha FC membership</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary">+ Add Member</button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>All Members</h3>
          <span className="member-count">
            {activeCount} active · {totalCount} total
          </span>
        </div>
        <MembersTable
          members={members}
          loading={loading}
          onSendCard={handleSendCard}     // Pass the handler
          sendingCardId={sendingCardId}   // Pass the loading state
        />
      </div>

      {/* Toast notification */}
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