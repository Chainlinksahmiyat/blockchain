import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertTransactionSchema } from "@shared/schema";
import { ahmiyatBlockchain } from "./blockchain";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Posts routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getPostsWithUsers(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({
        ...req.body,
        userId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      });

      const post = await storage.createPost(postData);
      
      // Calculate mining reward based on content type
      let reward = 25; // Base reward
      if (postData.postType === 'meme') reward = 45;
      if (postData.postType === 'memory') reward = 67;
      if (postData.postType === 'video') reward = 89;
      
      // Award coins for post
      await storage.awardCoins(userId, reward, 'upload', 'Content upload reward', post.id);
      
      res.json({ ...post, coinsEarned: reward });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const result = await storage.toggleLike(userId, postId);
      
      if (result.liked) {
        // Award 5 coins for liking
        await storage.awardCoins(userId, 5, 'like', 'Post like reward', postId);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // User stats routes
  app.get('/api/stats/blockchain', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      res.status(500).json({ message: "Failed to fetch blockchain stats" });
    }
  });

  app.get('/api/stats/top-miners', isAuthenticated, async (req: any, res) => {
    try {
      const topMiners = await storage.getTopMinersToday();
      res.json(topMiners);
    } catch (error) {
      console.error("Error fetching top miners:", error);
      res.status(500).json({ message: "Failed to fetch top miners" });
    }
  });

  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Blockchain specific routes
  app.post('/api/blockchain/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const block = await ahmiyatBlockchain.mineNewBlock(userId);
      
      res.json({
        message: "Block mined successfully!",
        block: {
          blockNumber: block.blockNumber,
          blockHash: block.blockHash,
          reward: block.reward,
          transactionCount: block.transactionCount
        }
      });
    } catch (error) {
      console.error("Error mining block:", error);
      res.status(500).json({ message: "Failed to mine block" });
    }
  });

  app.get('/api/blockchain/info', isAuthenticated, async (req: any, res) => {
    try {
      const info = await ahmiyatBlockchain.getBlockchainInfo();
      res.json(info);
    } catch (error) {
      console.error("Error fetching blockchain info:", error);
      res.status(500).json({ message: "Failed to fetch blockchain info" });
    }
  });

  // Initialize blockchain (create genesis block if needed)
  ahmiyatBlockchain.getLatestBlock().then(async (latestBlock) => {
    if (!latestBlock) {
      console.log('[Blockchain] Creating genesis block...');
      await ahmiyatBlockchain.createGenesisBlock();
      console.log('[Blockchain] Genesis block created');
    }
    
    // Start auto-mining
    console.log('[Blockchain] Starting auto-mining...');
    ahmiyatBlockchain.startAutoMining();
  });

  const httpServer = createServer(app);
  return httpServer;
}
