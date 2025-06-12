import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../../lib/db';

// Placeholder for fetching feed
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const db = await openDB();
    await db.run('CREATE TABLE IF NOT EXISTS contents (id INTEGER PRIMARY KEY, type TEXT, filename TEXT, uploader TEXT, hash TEXT, timestamp INTEGER)');
    const feed = await db.all('SELECT * FROM contents ORDER BY timestamp DESC');
    res.status(200).json({ feed });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
