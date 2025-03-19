const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const taxiController = require("../controllers/taxiController");

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Driver Taxi Management
router.post("/addTaxi", taxiController.addTaxi);
router.patch("/:taxiId/status", taxiController.updateTaxiStatus);
router.patch("/:taxiId/load", taxiController.updateTaxiLoad);
router.get("/my-taxis", taxiController.getDriverTaxis);
router.patch("/:taxiId/load", authorizeRoles(["driver"]), taxiController.updateTaxiLoad);
module.exports = router;
