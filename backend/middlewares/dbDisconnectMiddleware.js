const mongoose = require('mongoose');

const gracefulShutdown = () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB disconnected due to app termination');
      process.exit(0);
    } catch (error) {
      console.error('Error during MongoDB disconnection', error);
      process.exit(1);
    }
  });
};

module.exports = gracefulShutdown;
