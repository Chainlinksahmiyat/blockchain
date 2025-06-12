"use client";
import { useEffect, useState } from 'react';

export default function Explorer() {
  const [explorer, setExplorer] = useState('');
  useEffect(() => {
    fetch('/api/explorer').then(r => r.json()).then(data => setExplorer(data.explorer));
  }, []);

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h2>Block Explorer</h2>
      <pre style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>{explorer}</pre>
    </main>
  );
}
