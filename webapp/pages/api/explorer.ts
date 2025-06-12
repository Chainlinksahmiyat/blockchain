import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';

// This API endpoint will allow the webapp to fetch the blockchain explorer data
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  exec('../../blockchain_core/build/ahmiyat_blockchain explorer', (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ message: 'Blockchain explorer failed', error: stderr });
    } else {
      res.status(200).json({ explorer: stdout });
    }
  });
}
