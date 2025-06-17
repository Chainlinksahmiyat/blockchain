// Service for stats and transaction-related business logic
import { callBlockchainCore } from './blockchain';

export class StatsService {
  static async getUserTransactions(userId: string) {
    let explorerOutput = '';
    try {
      explorerOutput = await callBlockchainCore(['explorer']);
    } catch (err) {
      throw new Error('Blockchain explorer error: ' + err);
    }
    // Parse explorer output to extract transactions for this user
    const userTransactions: any[] = [];
    const lines = explorerOutput.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('TX:')) {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const [txInfo, amountStr, sigInfo] = parts;
          const [_, sender, receiver] = txInfo.match(/TX: (.*) -> (.*)/) || [];
          const amount = parseFloat(amountStr.trim());
          const signature = sigInfo.replace('sig:', '').trim();
          if (sender === userId || receiver === userId) {
            userTransactions.push({ sender, receiver, amount, signature });
          }
        }
      }
    }
    return userTransactions;
  }

  static async getBlockchainStats() {
    // Placeholder: call blockchain core or DB for stats
    return {};
  }

  static async getTopMiners() {
    // Placeholder: call blockchain core or DB for top miners
    return {};
  }
}
