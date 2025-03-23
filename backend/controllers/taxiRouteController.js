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
