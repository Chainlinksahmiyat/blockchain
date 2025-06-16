import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "./replitAuth";

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
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Removed: const user = await storage.getUser(userId);
      res.json({ userId }); // Simplified response, adjust as needed
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Posts routes
  app.get('/api/posts', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Removed: const posts = await storage.getPostsWithUsers(userId);
      const posts = []; // Placeholder, implement fetching posts if needed
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = {
        ...req.body,
        userId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      };

      // Removed: const post = await storage.createPost(postData);
      
      // Calculate mining reward based on content type
      let reward = 25; // Base reward
      if (postData.postType === 'meme') reward = 45;
      if (postData.postType === 'memory') reward = 67;
      if (postData.postType === 'video') reward = 89;

      // Call C++ blockchain core to add content and mine block
      const { callBlockchainCore } = await import('./blockchain');
      const contentType = postData.postType;
      const filename = req.file ? req.file.filename : '';
      const uploader = userId;
      const hash = postData.id.toString(); // Use post ID as a simple hash (replace with real hash if needed)
      const args = ['add-content', contentType, filename, uploader, hash];
      let blockchainResult = '';
      try {
        blockchainResult = await callBlockchainCore(args);
      } catch (err) {
        console.error('Blockchain core error:', err);
      }

      // Award coins for post (optional, can be removed if blockchain core handles rewards)
      // await storage.awardCoins(userId, reward, 'upload', 'Content upload reward', post.id);

      res.json({ ...postData, coinsEarned: reward, blockchainResult });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/posts/:id/like', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const result = { liked: true }; // Placeholder, implement like toggle logic
      // const result = await storage.toggleLike(userId, postId);
      
      if (result.liked) {
        // Award 5 coins for liking
        // await storage.awardCoins(userId, 5, 'like', 'Post like reward', postId);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // User stats routes
  app.get('/api/stats/blockchain', async (req: any, res) => {
    try {
      const stats = {}; // Placeholder, implement stats fetching if needed
      // const stats = await storage.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      res.status(500).json({ message: "Failed to fetch blockchain stats" });
    }
  });

  app.get('/api/stats/top-miners', async (req: any, res) => {
    try {
      const topMiners = {}; // Placeholder, implement top miners fetching if needed
      // const topMiners = await storage.getTopMinersToday();
      res.json(topMiners);
    } catch (error) {
      console.error("Error fetching top miners:", error);
      res.status(500).json({ message: "Failed to fetch top miners" });
    }
  });

  app.get('/api/transactions', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Call C++ blockchain core explorer to get all blocks and filter transactions for this user
      const { callBlockchainCore } = await import('./blockchain');
      let explorerOutput = '';
      try {
        explorerOutput = await callBlockchainCore(['explorer']);
      } catch (err) {
        console.error('Blockchain explorer error:', err);
        return res.status(500).json({ message: 'Failed to fetch blockchain transactions' });
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
      res.json(userTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Blockchain specific routes
  app.post('/api/blockchain/mine', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Mining is handled automatically when content is added, but you can trigger a mine if needed
      // For this, just call explorer to show latest state
      const { callBlockchainCore } = await import('./blockchain');
      let explorerOutput = '';
      try {
        explorerOutput = await callBlockchainCore(['explorer']);
      } catch (err) {
        console.error('Blockchain explorer error:', err);
        return res.status(500).json({ message: 'Failed to mine block' });
      }
      res.json({ message: 'Block mined (if possible)', explorer: explorerOutput });
    } catch (error) {
      console.error("Error mining block:", error);
      res.status(500).json({ message: "Failed to mine block" });
    }
  });

  app.get('/api/blockchain/info', async (req: any, res) => {
    try {
      const { callBlockchainCore } = await import('./blockchain');
      let explorerOutput = '';
      try {
        explorerOutput = await callBlockchainCore(['explorer']);
      } catch (err) {
        console.error('Blockchain explorer error:', err);
        return res.status(500).json({ message: 'Failed to fetch blockchain info' });
      }
      // Optionally parse explorerOutput for summary info
      res.json({ explorer: explorerOutput });
    } catch (error) {
      console.error("Error fetching blockchain info:", error);
      res.status(500).json({ message: "Failed to fetch blockchain info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
