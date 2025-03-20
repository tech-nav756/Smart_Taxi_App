const http = require('http');
const express = require('express');
const { initializeSocket } = require('./socket');
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
const taxiRoutes = require("./routes/taxiRoutes");
const taxirouteRoutes = require("./routes/taxirouteRoutes");
const rideRequestRoutes = require('./routes/rideRequestRoutes');
const chatRoutes = require('./routes/taxiDriverGroupRoutes');

const app = express();


// Middleware setup
app.use(express.json());
app.use(helmetMiddleware());
app.use(rateLimiterMiddleware);
app.use(corsMiddleware);
app.use(forceHttpsMiddleware);

const server = http.createServer(app);
initializeSocket(server);
connectDB();

// Graceful shutdown
gracefulShutdown();

app.use(passport.initialize());
app.use("/auth", authRoutes);
app.use('/dashboard', userRoutes);
app.use('/taxis', taxiRoutes)
app.use('/chat', chatRoutes)
app.use("/admin/routes", taxirouteRoutes);
app.use('/ride-requests', rideRequestRoutes);

app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Hello, your API is working!' });
});

// Example route (signup
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

module.exports = server