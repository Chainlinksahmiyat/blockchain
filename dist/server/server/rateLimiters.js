"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = void 0;
// Express rate limiter middleware for authentication endpoints
var express_rate_limit_1 = require("express-rate-limit");
// Limit to 5 requests per minute per IP for login and register endpoints
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: {
        message: 'Too many authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
