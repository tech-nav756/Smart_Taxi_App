const Taxi = require("../models/Taxi");
const Route = require("../models/Route");
const User = require("../models/User");

// Add a new taxi (Only for drivers)
exports.addTaxi = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a driver
    const user = await User.findById(userId);
    if (!user || !user.role.includes('driver')) {
      return res.status(403).json({ message: 'Only drivers can add a taxi.' });
    }

    const { numberPlate, routeName, capacity, location } = req.body;

    // Validate the input fields
    if (!numberPlate || !routeName || !capacity || !location) {
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
      location,
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
