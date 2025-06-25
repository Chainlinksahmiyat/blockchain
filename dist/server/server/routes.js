"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
var express_1 = require("express");
var http_1 = require("http");
var multer_1 = require("multer");
var path_1 = require("path");
var fs_1 = require("fs");
var uploadUtils_1 = require("./uploadUtils");
var postService_1 = require("./postService");
var statsService_1 = require("./statsService");
var s3Upload_1 = require("./s3Upload");
// Configure multer for file uploads
var uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
var storage_multer = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
var upload = (0, multer_1.default)({
    storage: storage_multer,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: function (req, file, cb) { return __awaiter(void 0, void 0, void 0, function () {
        var tempPath, out;
        return __generator(this, function (_a) {
            tempPath = path_1.default.join(uploadDir, 'tmp-' + Date.now() + path_1.default.extname(file.originalname));
            out = fs_1.default.createWriteStream(tempPath);
            file.stream.pipe(out);
            out.on('finish', function () { return __awaiter(void 0, void 0, void 0, function () {
                var validType, clean;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, uploadUtils_1.validateFileType)(tempPath)];
                        case 1:
                            validType = _a.sent();
                            if (!validType) {
                                fs_1.default.unlinkSync(tempPath);
                                return [2 /*return*/, cb(new Error('Invalid file type'))];
                            }
                            return [4 /*yield*/, (0, uploadUtils_1.scanFileForVirus)(tempPath).catch(function () { return false; })];
                        case 2:
                            clean = _a.sent();
                            if (!clean) {
                                fs_1.default.unlinkSync(tempPath);
                                return [2 /*return*/, cb(new Error('File failed virus scan'))];
                            }
                            fs_1.default.unlinkSync(tempPath);
                            cb(null, true);
                            return [2 /*return*/];
                    }
                });
            }); });
            out.on('error', function () { return cb(new Error('File write error')); });
            return [2 /*return*/];
        });
    }); }
});
// In-memory session for demo (replace with DB/session store for production)
var walletSessions = new Map();
// Wallet login endpoint
// User sends { address, signature, message }
function verifySignature(address, signature, message) {
    // TODO: Implement real signature verification (e.g., ECDSA/secp256k1)
    // For demo, accept any non-empty values
    return !!address && !!signature && !!message;
}
function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        // Auth middleware (replace isAuthenticated)
        function walletAuth(req, res, next) {
            var _a;
            var sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.walletSession;
            if (sessionId && walletSessions.has(sessionId)) {
                req.user = { address: walletSessions.get(sessionId).address };
                return next();
            }
            res.status(401).json({ message: 'Not authenticated' });
        }
        var httpServer;
        var _this = this;
        return __generator(this, function (_a) {
            // Serve uploaded files
            app.use('/uploads', express_1.default.static(uploadDir));
            // Wallet login route
            app.post('/api/wallet-login', express_1.default.json(), function (req, res) {
                var _a = req.body, address = _a.address, signature = _a.signature, message = _a.message;
                if (!verifySignature(address, signature, message)) {
                    return res.status(401).json({ message: 'Invalid wallet signature' });
                }
                // Create session (in-memory for demo)
                var sessionId = Math.random().toString(36).slice(2);
                walletSessions.set(sessionId, { address: address });
                res.cookie('walletSession', sessionId, { httpOnly: true, sameSite: 'lax' });
                res.json({ address: address });
            });
            // Replace /api/auth/user
            app.get('/api/auth/user', function (req, res) {
                var _a;
                var sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.walletSession;
                if (sessionId && walletSessions.has(sessionId)) {
                    return res.json({ address: walletSessions.get(sessionId).address });
                }
                res.status(401).json({ message: 'Not authenticated' });
            });
            // Posts routes
            app.get('/api/posts', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, posts;
                return __generator(this, function (_a) {
                    try {
                        userId = req.user.claims.sub;
                        posts = [];
                        res.json(posts);
                    }
                    catch (error) {
                        console.error("Error fetching posts:", error);
                        res.status(500).json({ message: "Failed to fetch posts" });
                    }
                    return [2 /*return*/];
                });
            }); });
            app.post('/api/posts', walletAuth, upload.single('file'), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, imageUrl, s3Key, postData, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            userId = req.user.address;
                            imageUrl = void 0;
                            if (!req.file) return [3 /*break*/, 2];
                            s3Key = "uploads/".concat(Date.now(), "-").concat(req.file.filename);
                            return [4 /*yield*/, (0, s3Upload_1.uploadFileToS3)(req.file.path, s3Key)];
                        case 1:
                            imageUrl = _a.sent();
                            // Optionally delete local file after upload
                            fs_1.default.unlinkSync(req.file.path);
                            _a.label = 2;
                        case 2:
                            postData = __assign(__assign({}, req.body), { userId: userId, imageUrl: imageUrl });
                            return [4 /*yield*/, postService_1.PostService.createPost(postData, req.file, userId)];
                        case 3:
                            result = _a.sent();
                            res.json(result);
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            console.error("Error creating post:", error_1);
                            res.status(500).json({ message: "Failed to create post" });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            app.post('/api/posts/:id/like', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, postId, result, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.user.claims.sub;
                            postId = parseInt(req.params.id);
                            return [4 /*yield*/, postService_1.PostService.toggleLike(userId, postId)];
                        case 1:
                            result = _a.sent();
                            res.json(result);
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            console.error("Error toggling like:", error_2);
                            res.status(500).json({ message: "Failed to toggle like" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // User stats routes
            app.get('/api/stats/blockchain', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var stats, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, statsService_1.StatsService.getBlockchainStats()];
                        case 1:
                            stats = _a.sent();
                            res.json(stats);
                            return [3 /*break*/, 3];
                        case 2:
                            error_3 = _a.sent();
                            console.error("Error fetching blockchain stats:", error_3);
                            res.status(500).json({ message: "Failed to fetch blockchain stats" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get('/api/stats/top-miners', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var topMiners, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, statsService_1.StatsService.getTopMiners()];
                        case 1:
                            topMiners = _a.sent();
                            res.json(topMiners);
                            return [3 /*break*/, 3];
                        case 2:
                            error_4 = _a.sent();
                            console.error("Error fetching top miners:", error_4);
                            res.status(500).json({ message: "Failed to fetch top miners" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get('/api/transactions', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, userTransactions, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            userId = req.user.claims.sub;
                            return [4 /*yield*/, statsService_1.StatsService.getUserTransactions(userId)];
                        case 1:
                            userTransactions = _a.sent();
                            res.json(userTransactions);
                            return [3 /*break*/, 3];
                        case 2:
                            error_5 = _a.sent();
                            console.error("Error fetching transactions:", error_5);
                            res.status(500).json({ message: "Failed to fetch transactions" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Blockchain specific routes
            app.post('/api/blockchain/mine', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, callBlockchainCore, explorerOutput, err_1, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            userId = req.user.claims.sub;
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('./blockchain'); })];
                        case 1:
                            callBlockchainCore = (_a.sent()).callBlockchainCore;
                            explorerOutput = '';
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, callBlockchainCore(['explorer'])];
                        case 3:
                            explorerOutput = _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            err_1 = _a.sent();
                            console.error('Blockchain explorer error:', err_1);
                            return [2 /*return*/, res.status(500).json({ message: 'Failed to mine block' })];
                        case 5:
                            res.json({ message: 'Block mined (if possible)', explorer: explorerOutput });
                            return [3 /*break*/, 7];
                        case 6:
                            error_6 = _a.sent();
                            console.error("Error mining block:", error_6);
                            res.status(500).json({ message: "Failed to mine block" });
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            }); });
            app.get('/api/blockchain/info', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var callBlockchainCore, explorerOutput, err_2, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('./blockchain'); })];
                        case 1:
                            callBlockchainCore = (_a.sent()).callBlockchainCore;
                            explorerOutput = '';
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, callBlockchainCore(['explorer'])];
                        case 3:
                            explorerOutput = _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            err_2 = _a.sent();
                            console.error('Blockchain explorer error:', err_2);
                            return [2 /*return*/, res.status(500).json({ message: 'Failed to fetch blockchain info' })];
                        case 5:
                            // Optionally parse explorerOutput for summary info
                            res.json({ explorer: explorerOutput });
                            return [3 /*break*/, 7];
                        case 6:
                            error_7 = _a.sent();
                            console.error("Error fetching blockchain info:", error_7);
                            res.status(500).json({ message: "Failed to fetch blockchain info" });
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            }); });
            httpServer = (0, http_1.createServer)(app);
            return [2 /*return*/, httpServer];
        });
    });
}
