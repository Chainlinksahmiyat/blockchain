// Express rate limiter middleware for authentication endpoints
import rateLimit from 'express-rate-limit';

// Limit to 5 requests per minute per IP for login and register endpoints
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
