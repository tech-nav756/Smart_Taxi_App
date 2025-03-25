const express = require("express");
const rideRequestController = require("../controllers/rideRequestController");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");


const router = express.Router();

router.use(protect)

// Passenger requests a ride
router.post("/request", rideRequestController.requestRide);

// Passenger requests a pickup
router.post("/pickup", rideRequestController.requestPickup);

// Driver accepts a ride request
router.put("/accept/:requestId", authorizeRoles(["driver"]), rideRequestController.acceptRideRequest);

// Passenger cancels a ride request
router.put("/cancel/:requestId", rideRequestController.cancelRideRequest);

module.exports = router;
