"use client";
import { useEffect, useState } from 'react';

export default function Feed() {
  const [feed, setFeed] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/feed').then(r => r.json()).then(data => setFeed(data.feed));
  }, []);

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Feed</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {feed.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12 }}>
            <b>{item.type.toUpperCase()}</b> <span style={{ color: '#888' }}>by {item.uploader}</span>
            <div>{item.filename}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{new Date(item.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
