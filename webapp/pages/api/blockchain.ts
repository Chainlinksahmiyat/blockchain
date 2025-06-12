import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  exec('../../blockchain_core/build/ahmiyat_blockchain', (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ message: 'Blockchain mining failed', error: stderr });
    } else {
      res.status(200).json({ blockchain: stdout });
    }
  });
}
