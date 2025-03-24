const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// CORS middleware configuration
const corsMiddleware = cors({
  origin: ["https://special-space-bassoon-r46xq5xpg7gvh5p44-8081.app.github.dev", "https://your-api-url.com", "https://special-space-bassoon-r46xq5xpg7gvh5p44-8082.app.github.dev"], // Default to localhost if BASE_URL is not set
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = corsMiddleware;
