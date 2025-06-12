import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../../lib/db';

// Placeholder for user registration
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }
    const db = await openDB();
    await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)');
    try {
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
      res.status(200).json({ message: 'User registered' });
    } catch (e) {
      res.status(409).json({ message: 'Username already exists' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
