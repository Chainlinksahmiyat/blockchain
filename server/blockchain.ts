import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Utility to call the C++ blockchain binary
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOCKCHAIN_BIN = path.join(__dirname, '../blockchain_core/build/ahmiyat_blockchain');

export function callBlockchainCore(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(BLOCKCHAIN_BIN, args, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

// All other blockchain logic is now handled by the C++ core.