import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MemberTable from '../components/MemberTable';

export default function Members() {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    api.get('/members').then(r => setMembers(r.data)).catch(() => {});
  }, []);
  return (
    <div className="page-container">
      <h1>Members</h1>
      <div className="card">
        <MemberTable members={members} />
      </div>
    </div>
  );
}