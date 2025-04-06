const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const rideRequestController = require("../controllers/rideRequestController");

// Create a new ride or pickup request (passenger endpoint)
router.post("/pickup", protect, rideRequestController.createPickupRequest);

router.post("/ride", protect, rideRequestController.createRideRequest);

router.get("/driver/nearby", protect,  rideRequestController.getNearbyRequestsForDriver);
router.get("/acceptedTaxiDetails", protect,  rideRequestController.getAcceptedTaxiDetails);
router.get("/acceptedPassengerDetails", protect,  rideRequestController.getDriverAcceptedPassengerDetails);

router.patch("/accept/:requestId", protect, rideRequestController.acceptRequest)
module.exports = router;
