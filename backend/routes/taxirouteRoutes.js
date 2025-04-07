const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const routeController = require("../controllers/taxiRouteController");

const router = express.Router();

router.use(protect)
// Admin creates new route
router.post("/create-route", routeController.createRoute);
router.get('/availableRoutes', routeController.getRoutes)
router.get('/search', routeController.searchRoutes)

module.exports = router;