import crypto from 'crypto';
import { db } from './db';
import { blocks, transactions, users } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { InsertBlock, Block } from '@shared/schema';

export class AhmiyatBlockchain {
  private difficulty = 4;
  private miningReward = 100;
  private blockTime = 30000; // 30 seconds target block time

  // Generate SHA-256 hash
  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate transaction hash
  generateTransactionHash(userId: string, type: string, amount: number, timestamp: number): string {
    const data = `${userId}${type}${amount}${timestamp}`;
    return this.generateHash(data);
  }

  // Generate merkle root from transaction hashes
  private generateMerkleRoot(transactionHashes: string[]): string {
    if (transactionHashes.length === 0) return this.generateHash('empty');
    if (transactionHashes.length === 1) return transactionHashes[0];

    let level = transactionHashes;
    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left; // If odd number, duplicate last hash
        nextLevel.push(this.generateHash(left + right));
      }
      level = nextLevel;
    }
    return level[0];
  }

  // Proof of Work mining simulation
  private mineBlock(blockData: string, difficulty: number): { nonce: number; hash: string } {
    const target = '0'.repeat(difficulty);
    let nonce = 0;
    let hash = '';

    while (!hash.startsWith(target)) {
      nonce++;
      hash = this.generateHash(blockData + nonce);
    }

    return { nonce, hash };
  }

  // Get the latest block
  async getLatestBlock(): Promise<Block | null> {
    const [latestBlock] = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.blockNumber))
      .limit(1);
    return latestBlock || null;
  }

  // Create genesis block if needed
  async createGenesisBlock(): Promise<Block> {
    const genesisBlock: InsertBlock = {
      blockNumber: 0,
      blockHash: this.generateHash('genesis'),
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: this.generateHash('genesis'),
      nonce: 0,
      difficulty: this.difficulty,
      transactionCount: 0,
      miner: null,
      reward: 0,
    };

    const [block] = await db.insert(blocks).values(genesisBlock).returning();
    return block;
  }

  // Mine a new block with pending transactions
  async mineNewBlock(minerId: string): Promise<Block> {
    const latestBlock = await this.getLatestBlock();
    const previousHash = latestBlock?.blockHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const newBlockNumber = (latestBlock?.blockNumber || -1) + 1;

    // Get pending transactions (not yet included in blocks)
    const pendingTransactions = await db
      .select()
      .from(transactions)
      .where(sql`${transactions.blockHash} IS NULL`)
      .limit(10); // Max 10 transactions per block

    const transactionHashes = pendingTransactions.map(tx => 
      this.generateTransactionHash(tx.userId, tx.type, tx.amount, tx.createdAt?.getTime() || Date.now())
    );
    
    const merkleRoot = this.generateMerkleRoot(transactionHashes);
    const blockData = `${newBlockNumber}${previousHash}${merkleRoot}${Date.now()}`;
    
    // Mine the block (Proof of Work)
    const { nonce, hash } = this.mineBlock(blockData, this.difficulty);

    // Create new block
    const newBlock: InsertBlock = {
      blockNumber: newBlockNumber,
      blockHash: hash,
      previousHash,
      merkleRoot,
      nonce,
      difficulty: this.difficulty,
      transactionCount: pendingTransactions.length,
      miner: minerId,
      reward: this.miningReward,
    };

    const [block] = await db.insert(blocks).values(newBlock).returning();

    // Update transactions with block information
    for (let i = 0; i < pendingTransactions.length; i++) {
      const tx = pendingTransactions[i];
      const txHash = transactionHashes[i];
      await db.update(transactions)
        .set({
          blockHash: hash,
          blockNumber: newBlockNumber,
          transactionHash: txHash,
        })
        .where(eq(transactions.id, tx.id));
    }

    // Award mining reward
    await db.update(users)
      .set({
        coinBalance: sql`${users.coinBalance} + ${this.miningReward}`,
        totalEarned: sql`${users.totalEarned} + ${this.miningReward}`
      })
      .where(eq(users.id, minerId));

    // Create mining reward transaction
    await db.insert(transactions).values({
      userId: minerId,
      type: 'mining',
      amount: this.miningReward,
      description: `Block mining reward for block #${newBlockNumber}`,
      blockHash: hash,
      blockNumber: newBlockNumber,
      transactionHash: this.generateTransactionHash(minerId, 'mining', this.miningReward, Date.now()),
    });

    return block;
  }

  // Get blockchain stats
  async getBlockchainInfo() {
    const [latestBlock] = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.blockNumber))
      .limit(1);

    const [totalTransactions] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactions);

    const [hashRate] = await db
      .select({ 
        rate: sql<number>`COUNT(*) * ${this.difficulty}` 
      })
      .from(blocks)
      .where(sql`${blocks.timestamp} > NOW() - INTERVAL '1 hour'`);

    return {
      latestBlockNumber: latestBlock?.blockNumber || 0,
      totalBlocks: latestBlock ? latestBlock.blockNumber + 1 : 0,
      totalTransactions: totalTransactions.count,
      difficulty: this.difficulty,
      hashRate: hashRate.rate || 0,
      averageBlockTime: this.blockTime / 1000, // in seconds
    };
  }

  // Auto-mine blocks periodically
  async startAutoMining() {
    setInterval(async () => {
      try {
        // Check if there are pending transactions to mine
        const pendingTransactions = await db
          .select()
          .from(transactions)
          .where(sql`${transactions.blockHash} IS NULL`)
          .limit(1);

        if (pendingTransactions.length === 0) {
          return; // No transactions to mine
        }

        // Get a random active user as miner
        const [randomUser] = await db
          .select({ id: users.id })
          .from(users)
          .orderBy(sql`RANDOM()`)
          .limit(1);

        if (randomUser) {
          await this.mineNewBlock(randomUser.id);
          console.log(`[Blockchain] New block mined by ${randomUser.id}`);
        }
      } catch (error) {
        console.error('[Blockchain] Mining error:', error);
      }
    }, this.blockTime);
  }
}

export const ahmiyatBlockchain = new AhmiyatBlockchain();