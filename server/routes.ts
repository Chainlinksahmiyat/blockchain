import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { isAuthenticated } from "./replitAuth";
import { validateFileType, scanFileForVirus } from './uploadUtils';
import { authRateLimiter } from './rateLimiters';
import { PostService } from './postService';
import { StatsService } from './statsService';
import { uploadFileToS3 } from './s3Upload';

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
  },
  fileFilter: async (req, file, cb) => {
    // Save file to temp location for validation
    const tempPath = path.join(uploadDir, 'tmp-' + Date.now() + path.extname(file.originalname));
    const out = fs.createWriteStream(tempPath);
    file.stream.pipe(out);
    out.on('finish', async () => {
      const validType = await validateFileType(tempPath);
      if (!validType) {
        fs.unlinkSync(tempPath);
        return cb(new Error('Invalid file type'));
      }
      const clean = await scanFileForVirus(tempPath).catch(() => false);
      if (!clean) {
        fs.unlinkSync(tempPath);
        return cb(new Error('File failed virus scan'));
      }
      fs.unlinkSync(tempPath);
      cb(null, true);
    });
    out.on('error', () => cb(new Error('File write error')));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', authRateLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Removed: const user = await storage.getUser(userId);
      res.json({ userId }); // Simplified response, adjust as needed
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app.get('/api/login', authRateLimiter, (req, res, next) => {
    // ...existing code...
  });
  app.get('/api/callback', authRateLimiter, (req, res, next) => {
    // ...existing code...
  });
  app.get('/api/logout', authRateLimiter, (req, res) => {
    // ...existing code...
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
      let imageUrl;
      if (req.file) {
        // Upload to S3 and get public URL
        const s3Key = `uploads/${Date.now()}-${req.file.filename}`;
        imageUrl = await uploadFileToS3(req.file.path, s3Key);
        // Optionally delete local file after upload
        fs.unlinkSync(req.file.path);
      }
      const postData = {
        ...req.body,
        userId,
        imageUrl,
      };
      const result = await PostService.createPost(postData, req.file, userId);
      res.json(result);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/posts/:id/like', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const result = await PostService.toggleLike(userId, postId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // User stats routes
  app.get('/api/stats/blockchain', async (req: any, res) => {
    try {
      const stats = await StatsService.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      res.status(500).json({ message: "Failed to fetch blockchain stats" });
    }
  });

  app.get('/api/stats/top-miners', async (req: any, res) => {
    try {
      const topMiners = await StatsService.getTopMiners();
      res.json(topMiners);
    } catch (error) {
      console.error("Error fetching top miners:", error);
      res.status(500).json({ message: "Failed to fetch top miners" });
    }
  });

  app.get('/api/transactions', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTransactions = await StatsService.getUserTransactions(userId);
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
