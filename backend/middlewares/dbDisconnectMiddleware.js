const mongoose = require('mongoose');

const gracefulShutdown = () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log('MongoDB disconnected due to app termination');
      process.exit(0);
    });
  });
};

module.exports = gracefulShutdown;
