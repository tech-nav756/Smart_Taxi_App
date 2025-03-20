const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// CORS middleware configuration
const corsMiddleware = cors({
  origin: ["https://animated-space-disco-x5p47pg7gqpwhv9v6-8081.github.dev"], // Default to localhost if BASE_URL is not set
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = corsMiddleware;
