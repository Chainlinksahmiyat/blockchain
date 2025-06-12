import { openDB } from '../../lib/db';
import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { type, filename, uploader, hash } = req.body;
    if (!type || !filename || !uploader || !hash) {
      return res.status(400).json({ message: 'Missing content fields' });
    }
    const db = await openDB();
    await db.run('CREATE TABLE IF NOT EXISTS contents (id INTEGER PRIMARY KEY, type TEXT, filename TEXT, uploader TEXT, hash TEXT, timestamp INTEGER)');
    await db.run('INSERT INTO contents (type, filename, uploader, hash, timestamp) VALUES (?, ?, ?, ?, ?)', [type, filename, uploader, hash, Date.now()]);
    // Call C++ blockchain mining process with content info
    exec(`../../blockchain_core/build/ahmiyat_blockchain add-content ${type} ${filename} ${uploader} ${hash}`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ message: 'Blockchain mining failed', error: stderr });
      }
      res.status(200).json({ message: 'Content uploaded and mined', blockchain: stdout });
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
