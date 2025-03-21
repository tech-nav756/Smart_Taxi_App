const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController'); // Import entire controller

const router = express.Router();

// Apply `protect` to all routes in this router

// Role Upgrade Request
router.post('/request-driver', userController.requestDriverUpgrade);

router.get('/user', userController.getUsers);


router.get("/me", protect, userController.getUserDetails);


module.exports = router;
