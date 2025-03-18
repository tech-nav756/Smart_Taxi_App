// middlewares/rateLimitMiddleware.js

const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Load rate limit configuration from environment variables
const { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } = process.env;

// Ensure environment variables are set and valid
if (!RATE_LIMIT_WINDOW || !RATE_LIMIT_MAX) {
  console.error('Error: RATE_LIMIT_WINDOW or RATE_LIMIT_MAX not set in environment variables');
  process.exit(1); // Stop if environment variables are missing
}

// Create a rate limit middleware
const rateLimiterMiddleware = rateLimit({
  windowMs: parseInt(RATE_LIMIT_WINDOW, 10), // Time window in milliseconds
  max: parseInt(RATE_LIMIT_MAX, 10),  // Max number of requests per window
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: (req) => {
    // Get the real client IP from X-Forwarded-For header or fallback to req.ip
    const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.ip;
    return ip; // Use the first IP from the X-Forwarded-For header
  }
});

module.exports = rateLimiterMiddleware;
