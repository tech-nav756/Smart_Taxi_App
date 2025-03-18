const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Import the logger
const { MONGO_URI } = process.env; // Mongo URI from environment variables

/**
 * Function to connect to MongoDB with retry logic and proper error handling.
 */
const connectDB = async () => {
  if (!MONGO_URI) {
    logger.error('Mongo URI not provided!');
    process.exit(1); // Exit if Mongo URI is not provided
  }

  let retries = 5; // Number of retries before giving up
  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(MONGO_URI, {
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 10000, // Timeout for initial connection (10 seconds)
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);

      if (retries === 0) {
        logger.error('Maximum retries reached. Exiting...');
        process.exit(1); // Exit process if retries are exhausted
      }

      retries -= 1;
      logger.info(`Retrying MongoDB connection... (${retries} attempts left)`);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    }
  };

  connectWithRetry();
};

/**
 * Gracefully shut down the database connection on server exit
 */
const gracefulShutdown = () => {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to DB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.info('Mongoose connection disconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed due to app termination');
    process.exit(0); // Exit cleanly
  });
};

// Export both functions for use elsewhere in the application
module.exports = {
  connectDB,
  gracefulShutdown,
};
