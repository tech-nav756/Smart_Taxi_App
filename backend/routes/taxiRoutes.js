const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const taxiController = require("../controllers/taxiController");

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Driver Taxi Management
router.post("/addTaxi", taxiController.addTaxi);
module.exports = router;
