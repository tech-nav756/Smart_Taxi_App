const cors = require('cors');
const dotenv = require('dotenv');


// Load environment variables from .env file
dotenv.config();

// CORS middleware configuration
const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || "https//localhost:3000", // Default to localhost if BASE_URL is not set
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = corsMiddleware;
