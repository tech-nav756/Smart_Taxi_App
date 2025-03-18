const cors = require('cors');

const corsMiddleware = cors({
  origin: ['https://trusted-frontend-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = corsMiddleware;
