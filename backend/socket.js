// socketManager.js
const socketIo = require('socket.io');

let io;  // io will be initialized in the init function
const connectedDrivers = new Map(); // Store connected drivers

// Initialize socket.io with a server
function initializeSocket(server) {
  if (io) return io; // Avoid initializing more than once

  io = socketIo(server, {
    cors: {
      origin: '*', // Adjust this for security
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('registerDriver', (driverId) => {
      connectedDrivers.set(driverId, socket.id);
    });

    socket.on('disconnect', () => {
      connectedDrivers.forEach((value, key) => {
        if (value === socket.id) {
          connectedDrivers.delete(key);
        }
      });
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

// Get the connected drivers map
function getConnectedDrivers() {
  return connectedDrivers;
}

module.exports = { initializeSocket, getConnectedDrivers };
