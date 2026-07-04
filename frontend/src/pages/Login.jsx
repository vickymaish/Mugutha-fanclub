import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="page-container" style={{ maxWidth: '500px', marginTop: 'var(--spacing-140)' }}>
      <div className="card">
        <h2>Login to Mugutha FC Platform</h2>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 'var(--spacing-16)' }}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 'var(--spacing-20)' }}
        />
        <button className="btn-primary" style={{ width: '100%' }}>Sign In</button>
      </div>
    </div>
  );
}