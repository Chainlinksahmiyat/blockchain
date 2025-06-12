import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../../lib/db';

// Placeholder for wallet info
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ message: 'Missing user' });
    }
    const db = await openDB();
    await db.run('CREATE TABLE IF NOT EXISTS contents (id INTEGER PRIMARY KEY, type TEXT, filename TEXT, uploader TEXT, hash TEXT, timestamp INTEGER)');
    const count = await db.get('SELECT COUNT(*) as balance FROM contents WHERE uploader = ?', [user]);
    res.status(200).json({ balance: count.balance, user });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
