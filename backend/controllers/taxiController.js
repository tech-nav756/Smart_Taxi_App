
const Taxi = require("../models/Taxi");
const Route = require("../models/Route");

// Add a new taxi (Only for drivers)
exports.addTaxi = async (req, res) => {
  try {
    if (!req.user.roles.includes("driver")) {
      return res.status(403).json({ message: "Access denied. Drivers only." });
    }

    const { numberPlate, routeName, capacity, location } = req.body;

    if (!numberPlate || !routeName || !capacity || !location) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingTaxi = await Taxi.findOne({ numberPlate });
    if (existingTaxi) {
      return res.status(400).json({ message: "Taxi with this number plate already exists." });
    }

    // Search for the route using routeName
    const route = await Route.findOne({ routeName });
    if (!route) {
      return res.status(404).json({ message: "Route not found. Please enter a valid route name." });
    }

    const taxi = await Taxi.create({
      taxiId: `TX-${Date.now()}`,
      numberPlate,
      routeId: route._id, // Link routeId automatically
      driverId: req.user._id,
      capacity,
      location,
    });

    res.status(201).json({ message: "Taxi added successfully.", taxi });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};


// Update taxi status (Only by the driver who owns the taxi)
exports.updateTaxiStatus = async (req, res) => {
    try {
      const { taxiId } = req.params;
      const { status } = req.body;
  
      const taxi = await Taxi.findOne({ _id: taxiId, driverId: req.user._id });
      if (!taxi) {
        return res.status(404).json({ message: "Taxi not found or access denied." });
      }
  
      if (!["waiting", "available", "almost full", "full", "on trip", "not available"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value." });
      }
  
      taxi.status = status;
      await taxi.save();
  
      res.json({ message: "Taxi status updated successfully.", taxi });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Update taxi load (Only by the driver who owns the taxi)
  exports.updateTaxiLoad = async (req, res) => {
    try {
      const { taxiId } = req.params;
      const { currentLoad } = req.body;
  
      const taxi = await Taxi.findOne({ _id: taxiId, driverId: req.user._id });
      if (!taxi) {
        return res.status(404).json({ message: "Taxi not found or access denied." });
      }
  
      if (currentLoad < 0 || currentLoad > taxi.capacity) {
        return res.status(400).json({ message: "Invalid load value." });
      }
  
      taxi.currentLoad = currentLoad;
      await taxi.save();
  
      res.json({ message: "Taxi load updated successfully.", taxi });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
  
  // Get all taxis owned by a driver
  exports.getDriverTaxis = async (req, res) => {
    try {
      const taxis = await Taxi.find({ driverId: req.user._id });
      res.json({ taxis });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  };
