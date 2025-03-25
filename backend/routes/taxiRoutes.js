const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const taxiController = require("../controllers/taxiController");

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Driver Taxi Management
router.post("/addTaxi", taxiController.addTaxi);

// Search for taxis by start & end location
router.get("/search", taxiController.searchTaxis);
// Get all taxis assigned to a driver
router.get("/driver-taxi", taxiController.getDriverTaxis);
  
// Route for monitoring taxi updates (for passengers)
router.get("/:taxiId/monitor", taxiController.monitorTaxi);


// Endpoint to fetch stops for a taxi
router.get('/:taxiId/stops', taxiController.getStopsForTaxi);

// Endpoint to update current stop manually
router.put('/:taxiId/currentStopManual', taxiController.updateCurrentStopManual);



// Route for updating the taxi's current stop
router.put("/:taxiId/currentStop", taxiController.updateCurrentStop);

// Route for updating the taxi's load
router.put("/:taxiId/load", taxiController.updateLoad);

// Route for updating the taxi's status
router.put("/:taxiId/status", taxiController.updateStatus);


module.exports = router;
