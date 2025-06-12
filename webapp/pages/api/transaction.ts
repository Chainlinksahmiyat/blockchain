import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../../lib/db';

// This API endpoint will allow the webapp to add a transaction to the blockchain
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { sender, receiver, amount, signature } = req.body;
    if (!sender || !receiver || !amount || !signature) {
      return res.status(400).json({ message: 'Missing transaction fields' });
    }
    // Save transaction to DB (optional, for explorer)
    const db = await openDB();
    await db.run('CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, sender TEXT, receiver TEXT, amount REAL, signature TEXT, timestamp INTEGER)');
    await db.run('INSERT INTO transactions (sender, receiver, amount, signature, timestamp) VALUES (?, ?, ?, ?, ?)', [sender, receiver, amount, signature, Date.now()]);
    // Call C++ blockchain to add transaction (simulate via CLI)
    exec(`../../blockchain_core/build/ahmiyat_blockchain add-tx ${sender} ${receiver} ${amount} ${signature}`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ message: 'Blockchain transaction failed', error: stderr });
      }
      res.status(200).json({ message: 'Transaction added', blockchain: stdout });
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
