const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const routeController = require("../controllers/taxiRouteController");
const { authorize } = require("passport");

const router = express.Router();

router.use(protect, authorizeRoles(["admin"]))
// Admin creates new route
router.post("/create-route", routeController.createRoute);

module.exports = router;