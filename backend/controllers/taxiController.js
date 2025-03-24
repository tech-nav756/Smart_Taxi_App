const Taxi = require("../models/Taxi");
const Route = require("../models/Route");
const User = require("../models/User");
const { initializeSocket } = require("../socket"); // Import Socket.IO instance


// Add a new taxi (Only for drivers)
exports.addTaxi = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a driver
    const user = await User.findById(userId);
    if (!user || !user.role.includes('driver')) {
      return res.status(403).json({ message: 'Only drivers can add a taxi.' });
    }

    const { numberPlate, routeName, capacity, currentStop } = req.body;

    // Validate the input fields
    if (!numberPlate || !routeName || !capacity || !currentStop) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate capacity as a number
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ message: "Capacity must be a positive number." });
    }

    // Ensure numberPlate is unique
    const existingTaxi = await Taxi.findOne({ numberPlate });
    if (existingTaxi) {
      return res.status(400).json({ message: "Taxi with this number plate already exists." });
    }

    // Search for the route using routeName
    const route = await Route.findOne({ routeName });
    if (!route) {
      return res.status(404).json({ message: "Route not found. Please enter a valid route name." });
    }

    // Create a new taxi document
    const newTaxi = new Taxi({
      numberPlate,
      routeId: route._id, // Use the routeId from the found route
      driverId: userId, // Associate the taxi with the current driver
      capacity,
      currentStop,
      status: 'available', // Default status is available
    });

    // Save the taxi to the database
    await newTaxi.save();
    res.status(201).json({ message: "Taxi added successfully.", taxi: newTaxi });

  } catch (error) {
    console.error('Error saving taxi:', error); // Log error for debugging
    res.status(500).json({ message: "Error saving taxi to database", error: error.message });
  }
};
 
 
exports.searchTaxis = async (req, res, next) => {
  try {
    const { startLocation, endLocation } = req.query;
    if (!startLocation || !endLocation) {
      return res.status(400).json({ message: "Start and end locations are required." });
    }

    const routes = await Route.find({ "stops.name": { $all: [startLocation, endLocation] } });
    if (routes.length === 0) {
      return res.status(404).json({ message: "No routes found for the given locations." });
    }

    const routeIds = routes.map((route) => route._id);
    const taxis = await Taxi.find({ routeId: { $in: routeIds }, status: { $in: ["waiting", "available", "roaming"] } })
      .populate("routeId driverId", "routeName stops name");

    if (taxis.length === 0) {
      return res.status(404).json({ message: "No available taxis for the selected route." });
    }

    res.status(200).json({ taxis });

    // Emit taxi availability updates in real-time
    initializeSocket.emit("taxiUpdate", taxis);
  } catch (error) {
    next(error)
  }
};


exports.updateTaxiStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const driverId = req.user.id; // Get driverId from authenticated user

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    const taxi = await Taxi.findOne({ driverId });
    if (!taxi) {
      return res.status(404).json({ message: "No taxi assigned to this driver." });
    }

    taxi.status = status;
    await taxi.save();

    res.status(200).json({ message: "Taxi status updated.", taxi });

    // Emit update to all passengers
    initializeSocket.emit("taxiUpdate", taxi);
  } catch (error) {
    console.error("Error updating taxi status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.updateCurrentStop = async (req, res) => {
  try {
    const { currentStop } = req.body;
    const driverId = req.user.id; // Get driverId from authenticated user

    if (!currentStop) {
      return res.status(400).json({ message: "Current stop is required." });
    }

    const taxi = await Taxi.findOne({ driverId });
    if (!taxi) {
      return res.status(404).json({ message: "No taxi assigned to this driver." });
    }

    taxi.currentStop = currentStop;
    await taxi.save();

    res.status(200).json({ message: "Current stop updated.", taxi });

    // Emit real-time update
    io.emit("currentStopUpdate", taxi);
  } catch (error) {
    console.error("Error updating current stop:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
