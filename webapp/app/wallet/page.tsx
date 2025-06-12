"use client";
import { useEffect, useState } from 'react';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (!u.username) {
      setMsg('Please login first.');
      return;
    }
    setUser(u.username);
    fetch(`/api/wallet?user=${u.username}`)
      .then(r => r.json())
      .then(data => setBalance(data.balance));
  }, []);

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Wallet</h2>
      {msg ? <div style={{ color: 'red' }}>{msg}</div> : (
        <div>
          <div><b>User:</b> {user}</div>
          <div><b>Ahmiyat Coin Balance:</b> {balance}</div>
        </div>
      )}
    </main>
  );
}
