var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/blockchain.ts
var blockchain_exports = {};
__export(blockchain_exports, {
  callBlockchainCore: () => callBlockchainCore
});
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
function callBlockchainCore(args) {
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
var __filename, __dirname, BLOCKCHAIN_BIN;
var init_blockchain = __esm({
  "server/blockchain.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    BLOCKCHAIN_BIN = path.join(__dirname, "../blockchain_core/build/ahmiyat_blockchain");
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";
import multer from "multer";
import path2 from "path";
import fs2 from "fs";

// server/uploadUtils.ts
import { FileTypeParser } from "file-type";
import { exec } from "child_process";
var allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime"
];
async function validateFileType(filePath) {
  const parser = new FileTypeParser();
  const type = await parser.fromFile(filePath);
  return type ? allowedMimeTypes.includes(type.mime) : false;
}
function scanFileForVirus(filePath) {
  return new Promise((resolve, reject) => {
    exec(`clamscan --no-summary ${filePath}`, (err, stdout) => {
      if (err) return reject(err);
      if (stdout.includes("OK")) resolve(true);
      else resolve(false);
    });
  });
}

// server/postService.ts
init_blockchain();
var PostService = class {
  static async createPost(postData, file, userId) {
    const contentType = postData.postType;
    const filename = file ? file.filename : "";
    const uploader = userId;
    const hash = postData.id ? postData.id.toString() : Date.now().toString();
    const args = ["add-content", contentType, filename, uploader, hash];
    let blockchainResult = "";
    let reward = 1e-4;
    try {
      blockchainResult = await callBlockchainCore(args);
      const match = blockchainResult.match(/Reward:\s*([0-9.]+)/);
      if (match) reward = parseFloat(match[1]);
    } catch (err) {
      throw new Error("Blockchain core error: " + err);
    }
    return { ...postData, coinsEarned: reward, blockchainResult };
  }
  static async toggleLike(userId, postId) {
    return { liked: true };
  }
};

// server/statsService.ts
init_blockchain();
var StatsService = class {
  static async getUserTransactions(userId) {
    let explorerOutput = "";
    try {
      explorerOutput = await callBlockchainCore(["explorer"]);
    } catch (err) {
      throw new Error("Blockchain explorer error: " + err);
    }
    const userTransactions = [];
    const lines = explorerOutput.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("TX:")) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          const [txInfo, amountStr, sigInfo] = parts;
          const [_, sender, receiver] = txInfo.match(/TX: (.*) -> (.*)/) || [];
          const amount = parseFloat(amountStr.trim());
          const signature = sigInfo.replace("sig:", "").trim();
          if (sender === userId || receiver === userId) {
            userTransactions.push({ sender, receiver, amount, signature });
          }
        }
      }
    }
    return userTransactions;
  }
  static async getBlockchainStats() {
    return {};
  }
  static async getTopMiners() {
    return {};
  }
};

// server/s3Upload.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
var s3 = new S3Client({ region: process.env.AWS_REGION });
var BUCKET = process.env.AWS_BUCKET_NAME;
async function uploadFileToS3(localPath, key) {
  const fileStream = fs.createReadStream(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileStream,
    ACL: "public-read"
  }));
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// server/routes.ts
var uploadDir = path2.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadDir)) {
  fs2.mkdirSync(uploadDir, { recursive: true });
}
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path2.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit
  },
  fileFilter: async (req, file, cb) => {
    const tempPath = path2.join(uploadDir, "tmp-" + Date.now() + path2.extname(file.originalname));
    const out = fs2.createWriteStream(tempPath);
    file.stream.pipe(out);
    out.on("finish", async () => {
      const validType = await validateFileType(tempPath);
      if (!validType) {
        fs2.unlinkSync(tempPath);
        return cb(new Error("Invalid file type"));
      }
      const clean = await scanFileForVirus(tempPath).catch(() => false);
      if (!clean) {
        fs2.unlinkSync(tempPath);
        return cb(new Error("File failed virus scan"));
      }
      fs2.unlinkSync(tempPath);
      cb(null, true);
    });
    out.on("error", () => cb(new Error("File write error")));
  }
});
var walletSessions = /* @__PURE__ */ new Map();
function verifySignature(address, signature, message) {
  return !!address && !!signature && !!message;
}
async function registerRoutes(app2) {
  app2.use("/uploads", express.static(uploadDir));
  app2.post("/api/wallet-login", express.json(), (req, res) => {
    const { address, signature, message } = req.body;
    if (!verifySignature(address, signature, message)) {
      return res.status(401).json({ message: "Invalid wallet signature" });
    }
    const sessionId = Math.random().toString(36).slice(2);
    walletSessions.set(sessionId, { address });
    res.cookie("walletSession", sessionId, { httpOnly: true, sameSite: "lax" });
    res.json({ address });
  });
  function walletAuth(req, res, next) {
    const sessionId = req.cookies?.walletSession;
    if (sessionId && walletSessions.has(sessionId)) {
      req.user = { address: walletSessions.get(sessionId).address };
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  }
  app2.get("/api/auth/user", (req, res) => {
    const sessionId = req.cookies?.walletSession;
    if (sessionId && walletSessions.has(sessionId)) {
      return res.json({ address: walletSessions.get(sessionId).address });
    }
    res.status(401).json({ message: "Not authenticated" });
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = [];
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app2.post("/api/posts", walletAuth, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user.address;
      let imageUrl;
      if (req.file) {
        const s3Key = `uploads/${Date.now()}-${req.file.filename}`;
        imageUrl = await uploadFileToS3(req.file.path, s3Key);
        fs2.unlinkSync(req.file.path);
      }
      const postData = {
        ...req.body,
        userId,
        imageUrl
      };
      const result = await PostService.createPost(postData, req.file, userId);
      res.json(result);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  app2.post("/api/posts/:id/like", async (req, res) => {
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
  app2.get("/api/stats/blockchain", async (req, res) => {
    try {
      const stats = await StatsService.getBlockchainStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blockchain stats:", error);
      res.status(500).json({ message: "Failed to fetch blockchain stats" });
    }
  });
  app2.get("/api/stats/top-miners", async (req, res) => {
    try {
      const topMiners = await StatsService.getTopMiners();
      res.json(topMiners);
    } catch (error) {
      console.error("Error fetching top miners:", error);
      res.status(500).json({ message: "Failed to fetch top miners" });
    }
  });
  app2.get("/api/transactions", async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTransactions = await StatsService.getUserTransactions(userId);
      res.json(userTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/blockchain/mine", async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callBlockchainCore: callBlockchainCore2 } = await Promise.resolve().then(() => (init_blockchain(), blockchain_exports));
      let explorerOutput = "";
      try {
        explorerOutput = await callBlockchainCore2(["explorer"]);
      } catch (err) {
        console.error("Blockchain explorer error:", err);
        return res.status(500).json({ message: "Failed to mine block" });
      }
      res.json({ message: "Block mined (if possible)", explorer: explorerOutput });
    } catch (error) {
      console.error("Error mining block:", error);
      res.status(500).json({ message: "Failed to mine block" });
    }
  });
  app2.get("/api/blockchain/info", async (req, res) => {
    try {
      const { callBlockchainCore: callBlockchainCore2 } = await Promise.resolve().then(() => (init_blockchain(), blockchain_exports));
      let explorerOutput = "";
      try {
        explorerOutput = await callBlockchainCore2(["explorer"]);
      } catch (err) {
        console.error("Blockchain explorer error:", err);
        return res.status(500).json({ message: "Failed to fetch blockchain info" });
      }
      res.json({ explorer: explorerOutput });
    } catch (error) {
      console.error("Error fetching blockchain info:", error);
      res.status(500).json({ message: "Failed to fetch blockchain info" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
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
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
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
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/persistentLogger.ts
import fs4 from "fs";
import path5 from "path";
var LOG_FILE = path5.join(process.cwd(), "server.log");
function persistentLog(message, level = "info") {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logLine = `${timestamp} [${level.toUpperCase()}] ${message}`;
  fs4.appendFileSync(LOG_FILE, logLine + "\n");
  if (level === "error") {
    console.error(logLine);
  } else {
    console.log(logLine);
  }
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      persistentLog(logLine, res.statusCode >= 400 ? "error" : "info");
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
