const express = require('express');
const router = express.Router();
const rideRequestController = require('../controllers/rideRequestController');
const { protect } = require("../middlewares/authMiddleware");

router.post('/request', protect, rideRequestController.requestRide);
router.patch('/accept', protect, rideRequestController.acceptRide);
router.patch('/complete', protect, rideRequestController.completeRide);
router.get('/history', protect, rideRequestController.getRideHistory);
router.patch('/cancel', protect, rideRequestController.cancelRide);

module.exports = router;
