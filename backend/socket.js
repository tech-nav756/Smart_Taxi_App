const socketIo = require('socket.io');
let io; // This will hold the initialized io instance

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

// Function to get the io instance
function getIo() {
  return io;
}

// Get the connected drivers map
function getConnectedDrivers() {
  return connectedDrivers;
}

module.exports = { initializeSocket, getIo, getConnectedDrivers };
