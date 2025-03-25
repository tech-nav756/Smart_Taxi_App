const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const rideRequestController = require("../controllers/rideRequestController");

// Create a new ride or pickup request (passenger endpoint)
router.post("/pickup", protect, rideRequestController.createPickupRequest);

router.post("/ride", protect, rideRequestController.createRideRequest);

module.exports = router;
