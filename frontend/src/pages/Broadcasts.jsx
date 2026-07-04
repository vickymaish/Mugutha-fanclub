import React from 'react';
import BroadcastForm from '../components/BroadcastForm';

export default function Broadcasts() {
  return (
    <div className="page-container">
      <h1>Broadcasts</h1>
      <div className="card">
        <BroadcastForm />
      </div>
    </div>
  );
}