const Route = require("../models/Route");

// Create a new route
exports.createRoute = async (req, res) => {
  try {
    const { routeName, startLocation, endLocation, estimatedTime, stops } = req.body;

    if (!routeName || !startLocation || !endLocation || !Array.isArray(stops) || stops.length === 0 || !estimatedTime) {
      return res.status(400).json({ message: "All fields (including stops) are required" });
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
      stops,
    });

    res.status(201).json({
      message: "Route created successfully",
      route: newRoute,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.getRoutes = async (req, res, next) => {
  try {
    // Fetch all routes from the database
    const routes = await Route.find();

    // If no routes found
    if (routes.length === 0) {
      return res.status(404).json({ message: "No routes available" });
    }

    // Return all available routes
    res.status(200).json({
      message: "Routes fetched successfully",
      routes: routes,
    });
  } catch (error) {
    next(error)
  }
};

// Search routes with optional filters
exports.searchRoutes = async (req, res) => {
  try {
    const { startLocation, endLocation } = req.query;

    // Build a filter object based on provided search criteria
    let filter = {};
    if (startLocation) {
      filter.startLocation = { $regex: startLocation, $options: 'i' };  // Case-insensitive search
    }
    if (endLocation) {
      filter.endLocation = { $regex: endLocation, $options: 'i' };  // Case-insensitive search
    }

    // Find routes based on the filter
    const routes = await Route.find(filter);

    if (routes.length === 0) {
      return res.status(404).json({ message: "No routes found matching your criteria" });
    }

    res.status(200).json({
      message: "Routes found successfully",
      routes: routes,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};