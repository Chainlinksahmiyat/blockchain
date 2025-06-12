"use client";
import { useState } from 'react';

export default function Upload() {
  const [type, setType] = useState('image');
  const [filename, setFilename] = useState('');
  const [msg, setMsg] = useState('');

  async function handleUpload(e: any) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
      setMsg('Please login first.');
      return;
    }
    // For demo: hash is filename+user
    const hash = btoa(filename + user.username + Date.now());
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, filename, uploader: user.username, hash })
    });
    const data = await res.json();
    setMsg(data.message);
  }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Upload Content</h2>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="image">Image</option>
          <option value="meme">Meme</option>
          <option value="video">Video</option>
          <option value="memory">Memory</option>
        </select>
        <input placeholder="Filename (demo)" value={filename} onChange={e => setFilename(e.target.value)} required />
        <button type="submit">Upload</button>
      </form>
      <div style={{ color: 'green', marginTop: 8 }}>{msg}</div>
    </main>
  );
}
