var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  blocks: () => blocks,
  insertPostSchema: () => insertPostSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  likes: () => likes,
  posts: () => posts,
  sessions: () => sessions,
  transactions: () => transactions,
  users: () => users
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  coinBalance: integer("coin_balance").default(1e3).notNull(),
  totalEarned: integer("total_earned").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  postType: varchar("post_type").notNull(),
  // 'meme', 'memory', 'photo', 'video', 'text'
  likes: integer("likes").default(0).notNull(),
  comments: integer("comments").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  coinsEarned: integer("coins_earned").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(),
  // 'upload', 'like', 'comment', 'share', 'bonus'
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  postId: integer("post_id").references(() => posts.id),
  blockHash: varchar("block_hash"),
  blockNumber: integer("block_number"),
  transactionHash: varchar("transaction_hash"),
  gasUsed: integer("gas_used").default(21e3),
  createdAt: timestamp("created_at").defaultNow()
});
var blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockNumber: integer("block_number").notNull().unique(),
  blockHash: varchar("block_hash").notNull().unique(),
  previousHash: varchar("previous_hash").notNull(),
  merkleRoot: varchar("merkle_root").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  nonce: integer("nonce").notNull(),
  difficulty: integer("difficulty").default(4),
  transactionCount: integer("transaction_count").default(0),
  miner: varchar("miner").references(() => users.id),
  reward: integer("reward").default(100)
});
var likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likes: true,
  comments: true,
  shares: true,
  coinsEarned: true,
  createdAt: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq as eq2, desc as desc2, sql as sql2, and } from "drizzle-orm";

// server/blockchain.ts
import crypto from "crypto";
import { eq, desc, sql } from "drizzle-orm";
var AhmiyatBlockchain = class {
  difficulty = 4;
  miningReward = 100;
  blockTime = 3e4;
  // 30 seconds target block time
  // Generate SHA-256 hash
  generateHash(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }
  // Generate transaction hash
  generateTransactionHash(userId, type, amount, timestamp2) {
    const data = `${userId}${type}${amount}${timestamp2}`;
    return this.generateHash(data);
  }
  // Generate merkle root from transaction hashes
  generateMerkleRoot(transactionHashes) {
    if (transactionHashes.length === 0) return this.generateHash("empty");
    if (transactionHashes.length === 1) return transactionHashes[0];
    let level = transactionHashes;
    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        nextLevel.push(this.generateHash(left + right));
      }
      level = nextLevel;
    }
    return level[0];
  }
  // Proof of Work mining simulation
  mineBlock(blockData, difficulty) {
    const target = "0".repeat(difficulty);
    let nonce = 0;
    let hash = "";
    while (!hash.startsWith(target)) {
      nonce++;
      hash = this.generateHash(blockData + nonce);
    }
    return { nonce, hash };
  }
  // Get the latest block
  async getLatestBlock() {
    const [latestBlock] = await db.select().from(blocks).orderBy(desc(blocks.blockNumber)).limit(1);
    return latestBlock || null;
  }
  // Create genesis block if needed
  async createGenesisBlock() {
    const genesisBlock = {
      blockNumber: 0,
      blockHash: this.generateHash("genesis"),
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      merkleRoot: this.generateHash("genesis"),
      nonce: 0,
      difficulty: this.difficulty,
      transactionCount: 0,
      miner: null,
      reward: 0
    };
    const [block] = await db.insert(blocks).values(genesisBlock).returning();
    return block;
  }
  // Mine a new block with pending transactions
  async mineNewBlock(minerId) {
    const latestBlock = await this.getLatestBlock();
    const previousHash = latestBlock?.blockHash || "0000000000000000000000000000000000000000000000000000000000000000";
    const newBlockNumber = (latestBlock?.blockNumber || -1) + 1;
    const pendingTransactions = await db.select().from(transactions).where(sql`${transactions.blockHash} IS NULL`).limit(10);
    const transactionHashes = pendingTransactions.map(
      (tx) => this.generateTransactionHash(tx.userId, tx.type, tx.amount, tx.createdAt?.getTime() || Date.now())
    );
    const merkleRoot = this.generateMerkleRoot(transactionHashes);
    const blockData = `${newBlockNumber}${previousHash}${merkleRoot}${Date.now()}`;
    const { nonce, hash } = this.mineBlock(blockData, this.difficulty);
    const newBlock = {
      blockNumber: newBlockNumber,
      blockHash: hash,
      previousHash,
      merkleRoot,
      nonce,
      difficulty: this.difficulty,
      transactionCount: pendingTransactions.length,
      miner: minerId,
      reward: this.miningReward
    };
    const [block] = await db.insert(blocks).values(newBlock).returning();
    for (let i = 0; i < pendingTransactions.length; i++) {
      const tx = pendingTransactions[i];
      const txHash = transactionHashes[i];
      await db.update(transactions).set({
        blockHash: hash,
        blockNumber: newBlockNumber,
        transactionHash: txHash
      }).where(eq(transactions.id, tx.id));
    }
    await db.update(users).set({
      coinBalance: sql`${users.coinBalance} + ${this.miningReward}`,
      totalEarned: sql`${users.totalEarned} + ${this.miningReward}`
    }).where(eq(users.id, minerId));
    await db.insert(transactions).values({
      userId: minerId,
      type: "mining",
      amount: this.miningReward,
      description: `Block mining reward for block #${newBlockNumber}`,
      blockHash: hash,
      blockNumber: newBlockNumber,
      transactionHash: this.generateTransactionHash(minerId, "mining", this.miningReward, Date.now())
    });
    return block;
  }
  // Get blockchain stats
  async getBlockchainInfo() {
    const [latestBlock] = await db.select().from(blocks).orderBy(desc(blocks.blockNumber)).limit(1);
    const [totalTransactions] = await db.select({ count: sql`COUNT(*)` }).from(transactions);
    const [hashRate] = await db.select({
      rate: sql`COUNT(*) * ${this.difficulty}`
    }).from(blocks).where(sql`${blocks.timestamp} > NOW() - INTERVAL '1 hour'`);
    return {
      latestBlockNumber: latestBlock?.blockNumber || 0,
      totalBlocks: latestBlock ? latestBlock.blockNumber + 1 : 0,
      totalTransactions: totalTransactions.count,
      difficulty: this.difficulty,
      hashRate: hashRate.rate || 0,
      averageBlockTime: this.blockTime / 1e3
      // in seconds
    };
  }
  // Auto-mine blocks periodically
  async startAutoMining() {
    setInterval(async () => {
      try {
        const pendingTransactions = await db.select().from(transactions).where(sql`${transactions.blockHash} IS NULL`).limit(1);
        if (pendingTransactions.length === 0) {
          return;
        }
        const [randomUser] = await db.select({ id: users.id }).from(users).orderBy(sql`RANDOM()`).limit(1);
        if (randomUser) {
          await this.mineNewBlock(randomUser.id);
          console.log(`[Blockchain] New block mined by ${randomUser.id}`);
        }
      } catch (error) {
        console.error("[Blockchain] Mining error:", error);
      }
    }, this.blockTime);
  }
};
var ahmiyatBlockchain = new AhmiyatBlockchain();

// server/storage.ts
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq2(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getPostsWithUsers(userId) {
    const result = await db.select({
      post: posts,
      user: users,
      isLiked: sql2`EXISTS(
          SELECT 1 FROM ${likes} 
          WHERE ${likes.userId} = ${userId} 
          AND ${likes.postId} = ${posts.id}
        )`.as("is_liked")
    }).from(posts).innerJoin(users, eq2(posts.userId, users.id)).orderBy(desc2(posts.createdAt));
    return result.map((row) => ({
      ...row.post,
      user: row.user,
      isLiked: row.isLiked
    }));
  }
  async createPost(insertPost) {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }
  async toggleLike(userId, postId) {
    const [existingLike] = await db.select().from(likes).where(and(eq2(likes.userId, userId), eq2(likes.postId, postId)));
    if (existingLike) {
      await db.delete(likes).where(and(eq2(likes.userId, userId), eq2(likes.postId, postId)));
      await db.update(posts).set({ likes: sql2`${posts.likes} - 1` }).where(eq2(posts.id, postId));
      const [updatedPost] = await db.select({ likes: posts.likes }).from(posts).where(eq2(posts.id, postId));
      return { liked: false, likesCount: updatedPost.likes };
    } else {
      await db.insert(likes).values({ userId, postId });
      await db.update(posts).set({ likes: sql2`${posts.likes} + 1` }).where(eq2(posts.id, postId));
      const [updatedPost] = await db.select({ likes: posts.likes }).from(posts).where(eq2(posts.id, postId));
      return { liked: true, likesCount: updatedPost.likes };
    }
  }
  async awardCoins(userId, amount, type, description, postId) {
    await db.update(users).set({
      coinBalance: sql2`${users.coinBalance} + ${amount}`,
      totalEarned: sql2`${users.totalEarned} + ${amount}`
    }).where(eq2(users.id, userId));
    const transactionHash = ahmiyatBlockchain.generateTransactionHash(userId, type, amount, Date.now());
    await db.insert(transactions).values({
      userId,
      type,
      amount,
      description,
      postId,
      transactionHash,
      gasUsed: 21e3
    });
    if (postId) {
      await db.update(posts).set({
        coinsEarned: sql2`${posts.coinsEarned} + ${amount}`
      }).where(eq2(posts.id, postId));
    }
  }
  async getBlockchainStats() {
    const blockchainInfo = await ahmiyatBlockchain.getBlockchainInfo();
    const totalSupply = 1e7;
    const [circulating] = await db.select({
      total: sql2`COALESCE(SUM(${users.coinBalance}), 0)`
    }).from(users);
    const [todaysMining] = await db.select({
      total: sql2`COALESCE(SUM(${transactions.amount}), 0)`
    }).from(transactions).where(sql2`DATE(${transactions.createdAt}) = CURRENT_DATE`);
    return {
      totalSupply,
      circulating: circulating.total,
      todaysMining: todaysMining.total,
      ...blockchainInfo
    };
  }
  async getTopMinersToday() {
    const result = await db.select({
      user: users,
      todayEarnings: sql2`COALESCE(SUM(${transactions.amount}), 0)`.as("today_earnings")
    }).from(users).leftJoin(transactions, and(
      eq2(transactions.userId, users.id),
      sql2`DATE(${transactions.createdAt}) = CURRENT_DATE`
    )).groupBy(users.id).orderBy(sql2`today_earnings DESC`).limit(5);
    return result.map((row) => ({
      ...row.user,
      todayEarnings: row.todayEarnings
    }));
  }
  async getUserTransactions(userId) {
    return await db.select().from(transactions).where(eq2(transactions.userId, userId)).orderBy(desc2(transactions.createdAt)).limit(10);
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit
  }
});
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.use("/uploads", express.static(uploadDir));
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts2 = await storage.getPostsWithUsers(userId);
      res.json(posts2);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app2.post("/api/posts", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({
        ...req.body,
        userId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : void 0
      });
      const post = await storage.createPost(postData);
      let reward = 25;
      if (postData.postType === "meme") reward = 45;
      if (postData.postType === "memory") reward = 67;
      if (postData.postType === "video") reward = 89;
      await storage.awardCoins(userId, reward, "upload", "Content upload reward", post.id);
      res.json({ ...post, coinsEarned: reward });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  app2.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const result = await storage.toggleLike(userId, postId);
      if (result.liked) {
        await storage.awardCoins(userId, 5, "like", "Post like reward", postId);
      }
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });
  app2.get("/api/stats/blockchain", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      res.status(500).json({ message: "Failed to fetch blockchain stats" });
    }
  });
  app2.get("/api/stats/top-miners", isAuthenticated, async (req, res) => {
    try {
      const topMiners = await storage.getTopMinersToday();
      res.json(topMiners);
    } catch (error) {
      console.error("Error fetching top miners:", error);
      res.status(500).json({ message: "Failed to fetch top miners" });
    }
  });
  app2.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions2 = await storage.getUserTransactions(userId);
      res.json(transactions2);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/blockchain/mine", isAuthenticated, async (req, res) => {
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
  app2.get("/api/blockchain/info", isAuthenticated, async (req, res) => {
    try {
      const info = await ahmiyatBlockchain.getBlockchainInfo();
      res.json(info);
    } catch (error) {
      console.error("Error fetching blockchain info:", error);
      res.status(500).json({ message: "Failed to fetch blockchain info" });
    }
  });
  ahmiyatBlockchain.getLatestBlock().then(async (latestBlock) => {
    if (!latestBlock) {
      console.log("[Blockchain] Creating genesis block...");
      await ahmiyatBlockchain.createGenesisBlock();
      console.log("[Blockchain] Genesis block created");
    }
    console.log("[Blockchain] Starting auto-mining...");
    ahmiyatBlockchain.startAutoMining();
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
