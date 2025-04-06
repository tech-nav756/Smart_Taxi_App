const socketIo = require('socket.io');
const ChatSession = require('../models/ChatSession'); // Adjust path as needed
const Message = require('../models/Message'); // Adjust path as needed
const User = require('../models/User'); // Adjust path as needed

let io;
// Store connected users (both passengers and drivers)
// Map: userId -> socketId
const connectedUsers = new Map();

function initializeSocket(server) {
    if (io) return io;

    io = socketIo(server, {
        cors: {
            origin: '*', // Adjust this for PRODUCTION security
            // methods: ["GET", "POST"] // If needed
        },
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // --- User Authentication/Registration ---
        // Client should send this after successful login/token validation
        socket.on('authenticate', (userId) => {
            if (userId) {
                console.log(`Authenticating user ${userId} with socket ${socket.id}`);
                // Remove any old socket ID for this user if they reconnect
                connectedUsers.forEach((sId, uId) => {
                  if (uId === userId && sId !== socket.id) {
                    console.log(`Removing old socket entry for user ${userId}`);
                    // Find the old socket instance and potentially disconnect it or just remove mapping
                     const oldSocket = io.sockets.sockets.get(sId);
                     if(oldSocket) {
                         // Optionally disconnect the old socket instance
                         // oldSocket.disconnect(true);
                     }
                  } else if (sId === socket.id && uId !== userId) {
                     // If this socket was previously mapped to a different user, remove old mapping
                     console.log(`Removing old user mapping for socket ${socket.id}`);
                     connectedUsers.delete(uId);
                  }
                });
                connectedUsers.set(userId.toString(), socket.id); // Ensure userId is string key
                // Add socket.userId for easy access later in disconnect
                socket.userId = userId.toString();
                console.log('Connected users:', connectedUsers);
            }
        });

        // --- Chat Room Management ---
        socket.on('joinChatRoom', (chatSessionId) => {
            console.log(`Socket ${socket.id} joining room: chat_${chatSessionId}`);
            socket.join(`chat_${chatSessionId}`);
            // You could optionally emit a 'user joined' message to the room
        });

        socket.on('leaveChatRoom', (chatSessionId) => {
            console.log(`Socket ${socket.id} leaving room: chat_${chatSessionId}`);
            socket.leave(`chat_${chatSessionId}`);
            // You could optionally emit a 'user left' message to the room
        });

        // --- Sending/Receiving Messages ---
        socket.on('sendMessage', async (data) => {
            const { chatSessionId, content } = data;
            const senderId = socket.userId; // Get senderId from the authenticated socket

            if (!senderId) {
                // Handle error: user not authenticated on this socket
                socket.emit('chatError', { message: 'Authentication required.' });
                return;
            }

            if (!chatSessionId || !content) {
                 socket.emit('chatError', { message: 'Missing chatSessionId or content.' });
                return;
            }

            try {
                // 1. Find Chat Session & Verify Sender
                const chatSession = await ChatSession.findById(chatSessionId);
                if (!chatSession) {
                     socket.emit('chatError', { message: 'Chat session not found.' });
                    return;
                }

                const isParticipant = chatSession.passenger.toString() === senderId ||
                                    chatSession.driver.toString() === senderId;

                if (!isParticipant) {
                     socket.emit('chatError', { message: 'You are not part of this chat session.' });
                    return;
                }

                // 2. Save the Message
                const message = new Message({
                    chatSession: chatSessionId,
                    sender: senderId,
                    content: content, // Encryption happens via the setter
                });
                await message.save();

                // Update last message timestamp (optional but useful)
                chatSession.lastMessageAt = message.createdAt;
                await chatSession.save();

                // 3. Emit Message to Room
                // Retrieve the message *after* saving to ensure getters (decryption) are applied
                const savedMessage = await Message.findById(message._id).populate('sender', 'name email'); // Populate sender details

                if (savedMessage) {
                    const roomName = `chat_${chatSessionId}`;
                    console.log(`Emitting receiveMessage to room ${roomName}:`, savedMessage);
                    io.to(roomName).emit('receiveMessage', savedMessage);
                } else {
                     throw new Error("Failed to retrieve saved message for emitting.");
                }

            } catch (error) {
                console.error('Error sending message:', error);
                 socket.emit('chatError', { message: 'Error sending message. Please try again.' });
            }
        });


        // --- Disconnect Handling ---
        socket.on('disconnect', () => {
            if (socket.userId) {
                // Check if this specific socket instance was the one mapped
                if (connectedUsers.get(socket.userId) === socket.id) {
                    connectedUsers.delete(socket.userId);
                    console.log(`User ${socket.userId} disconnected cleanly.`);
                } else {
                    // This might happen if user reconnected quickly on a new socket before old one timed out
                    console.log(`Socket ${socket.id} disconnected, but user ${socket.userId} might be connected on another socket.`);
                }
            }
             console.log('Connected users after disconnect:', connectedUsers);
        });
    });

    return io;
}

function getIo() {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
}

// Function to get a specific user's socket ID
function getUserSocketId(userId) {
    return connectedUsers.get(userId.toString());
}


module.exports = {
    initializeSocket,
    getIo,
    getUserSocketId, // Export this helper
    // getConnectedDrivers is deprecated, use getUserSocketId or iterate connectedUsers if needed
};