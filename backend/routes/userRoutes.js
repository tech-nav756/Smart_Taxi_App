const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController'); // Import entire controller

const router = express.Router();

// Apply `protect` to all routes in this router
router.use(protect);

// Role Upgrade Request
router.post('/request-driver', userController.requestDriverUpgrade);

// Protected Routes Based on Roles
router.get('/driver-only-feature', authorizeRoles('driver'), userController.driverFeature);
router.get('/passenger-feature', authorizeRoles('passenger', 'driver'), userController.passengerFeature);

module.exports = router;
