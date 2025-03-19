const express = require('express');
const dotenv = require('dotenv').config();
const helmetMiddleware = require('./middlewares/helmetMiddleware');
const rateLimiterMiddleware = require('./middlewares/rateLimiterMiddleware');
const corsMiddleware = require('./middlewares/corsMiddleware');
const forceHttpsMiddleware = require('./middlewares/forceHttpsMiddleware');
const { validateSignup, validateErrors } = require('./middlewares/validateInputMiddleware');
const gracefulShutdown = require('./middlewares/dbDisconnectMiddleware');
const getClientIP = require('./utils/ipUtils');
const {connectDB} = require('./config/db');
const passport = require("./config/passport");
const userRoutes = require('./routes/userRoutes'); 
const authRoutes = require("./routes/authRoutes");

const app = express();


// Middleware setup
app.use(express.json());
app.use(helmetMiddleware());
app.use(rateLimiterMiddleware);
app.use(corsMiddleware);
app.use(forceHttpsMiddleware);


connectDB();

// Graceful shutdown
gracefulShutdown();

app.use(passport.initialize());
app.use("/auth", authRoutes);
app.use('/dashboard', userRoutes);

// Example route (signup)
app.post('/signup', validateSignup, validateErrors, (req, res) => {
  const clientIP = getClientIP(req); // Extract client IP securely
  console.log('Client IP:', clientIP); // Logs the securely extracted client IP
  
  res.status(201).send('User signed up successfully');
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
