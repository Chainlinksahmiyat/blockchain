import { 
  users, 
  posts, 
  transactions, 
  likes,
  blocks,
  type User, 
  type UpsertUser,
  type Post,
  type PostWithUser,
  type InsertPost,
  type InsertTransaction,
  type Transaction,
  type Block
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import { ahmiyatBlockchain } from "./blockchain";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  getPostsWithUsers(userId: string): Promise<PostWithUser[]>;
  createPost(insertPost: InsertPost): Promise<Post>;
  
  // Interaction operations
  toggleLike(userId: string, postId: number): Promise<{ liked: boolean; likesCount: number }>;
  awardCoins(userId: string, amount: number, type: string, description: string, postId?: number): Promise<void>;
  
  // Stats operations
  getBlockchainStats(): Promise<any>;
  getTopMinersToday(): Promise<any[]>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getPostsWithUsers(userId: string): Promise<PostWithUser[]> {
    const result = await db
      .select({
        post: posts,
        user: users,
        isLiked: sql<boolean>`EXISTS(
          SELECT 1 FROM ${likes} 
          WHERE ${likes.userId} = ${userId} 
          AND ${likes.postId} = ${posts.id}
        )`.as('is_liked')
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    return result.map(row => ({
      ...row.post,
      user: row.user,
      isLiked: row.isLiked
    }));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async toggleLike(userId: string, postId: number): Promise<{ liked: boolean; likesCount: number }> {
    // Check if like exists
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    if (existingLike) {
      // Remove like
      await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
      await db.update(posts).set({ likes: sql`${posts.likes} - 1` }).where(eq(posts.id, postId));
      
      const [updatedPost] = await db.select({ likes: posts.likes }).from(posts).where(eq(posts.id, postId));
      return { liked: false, likesCount: updatedPost.likes };
    } else {
      // Add like
      await db.insert(likes).values({ userId, postId });
      await db.update(posts).set({ likes: sql`${posts.likes} + 1` }).where(eq(posts.id, postId));
      
      const [updatedPost] = await db.select({ likes: posts.likes }).from(posts).where(eq(posts.id, postId));
      return { liked: true, likesCount: updatedPost.likes };
    }
  }

  async awardCoins(userId: string, amount: number, type: string, description: string, postId?: number): Promise<void> {
    // Update user balance
    await db.update(users).set({ 
      coinBalance: sql`${users.coinBalance} + ${amount}`,
      totalEarned: sql`${users.totalEarned} + ${amount}`
    }).where(eq(users.id, userId));

    // Generate transaction hash using blockchain
    const transactionHash = ahmiyatBlockchain.generateTransactionHash(userId, type, amount, Date.now());

    // Create transaction record (will be included in next block)
    await db.insert(transactions).values({
      userId,
      type,
      amount,
      description,
      postId,
      transactionHash,
      gasUsed: 21000
    });

    // Update post coins earned if postId provided
    if (postId) {
      await db.update(posts).set({
        coinsEarned: sql`${posts.coinsEarned} + ${amount}`
      }).where(eq(posts.id, postId));
    }
  }

  async getBlockchainStats(): Promise<any> {
    const blockchainInfo = await ahmiyatBlockchain.getBlockchainInfo();
    const totalSupply = 10000000;
    
    const [circulating] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${users.coinBalance}), 0)` 
    }).from(users);
    
    const [todaysMining] = await db.select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
    }).from(transactions).where(sql`DATE(${transactions.createdAt}) = CURRENT_DATE`);

    return {
      totalSupply,
      circulating: circulating.total,
      todaysMining: todaysMining.total,
      ...blockchainInfo
    };
  }

  async getTopMinersToday(): Promise<any[]> {
    const result = await db
      .select({
        user: users,
        todayEarnings: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.as('today_earnings')
      })
      .from(users)
      .leftJoin(transactions, and(
        eq(transactions.userId, users.id),
        sql`DATE(${transactions.createdAt}) = CURRENT_DATE`
      ))
      .groupBy(users.id)
      .orderBy(sql`today_earnings DESC`)
      .limit(5);

    return result.map(row => ({
      ...row.user,
      todayEarnings: row.todayEarnings
    }));
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);
  }
}

export const storage = new DatabaseStorage();