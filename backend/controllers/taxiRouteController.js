const Route = require("../models/Route");

// Create a new route
exports.createRoute = async (req, res) => {
  try {
    const { routeName, startLocation, endLocation, estimatedTime } = req.body;

    if (!routeName || !startLocation || !endLocation || !estimatedTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingRoute = await Route.findOne({ routeName });
    if (existingRoute) {
      return res.status(400).json({ message: "Route already exists" });
    }

    const newRoute = await Route.create({
      routeName,
      startLocation,
      endLocation,
      estimatedTime,
    });

    res.status(201).json({
      message: "Route created successfully",
      route: newRoute,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all routes
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single route by ID
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = exports;
