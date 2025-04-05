const express = require('express');
const chatController = require('../controllers/chatController'); // Import the controller
const { protect } = require('../middlewares/authMiddleware'); // Adjust path

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Route to initiate a chat session (typically by passenger)
// Finds the relevant ride, creates session if needed, returns ID.
router.post('/passenger-initiate', chatController.passengerInitiateChatSession);
router.post('/driver-initiate', chatController.driverInitiateChatSession);

// Route to get historical messages for a specific chat session
router.get('/:chatSessionId/messages', chatController.getChatMessages);

router.post('/:chatSessionId/messages', chatController.sendMessage);

module.exports = router;