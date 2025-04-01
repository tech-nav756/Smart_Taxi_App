const Taxi = require("../models/Taxi");
const Route = require("../models/Route");
const User = require("../models/User");
const { getIo, getConnectedDrivers } = require("../socket"); // Import Socket.IO instance
const io = getIo();
const connectedDrivers = getConnectedDrivers();


// Add a new taxi (Only for drivers)
exports.addTaxi = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a driver
    const user = await User.findById(userId);
    if (!user || !user.role.includes("driver")) {
      return res.status(403).json({ message: "Only drivers can add a taxi." });
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
      status: "available", // Default status is available
    });

    // Save the taxi to the database
    await newTaxi.save();
    res.status(201).json({ message: "Taxi added successfully.", taxi: newTaxi });
  } catch (error) {
    console.error("Error saving taxi:", error); // Log error for debugging
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

    const filteredTaxis = taxis.filter((taxi) => {
      const route = routes.find((r) => r._id.equals(taxi.routeId._id));
      if (!route) return false;
      
      const startStop = route.stops.find((stop) => stop.name === startLocation);
      if (!startStop) return false;
      
      return taxi.currentStop === startLocation || taxi.currentStopOrder < startStop.order;
    });

    if (filteredTaxis.length === 0) {
      return res.status(404).json({ message: "No taxis available at your location or that have yet to pass it." });
    }

    res.status(200).json({ taxis: filteredTaxis });

    io.emit("taxiUpdate", filteredTaxis);
  } catch (error) {
    next(error);
  }
};

// Get all taxis assigned to a specific driver
exports.getDriverTaxis = async (req, res) => {
  try {
    const driverId = req.user.id;
    const taxis = await Taxi.find({ driverId }).populate("routeId", "routeName");
    
    if (taxis.length === 0) {
      return res.status(404).json({ message: "No taxis found for this driver." });
    }
    
    res.status(200).json({ taxis });
  } catch (error) {
    console.error("Error fetching driver's taxis:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { taxiId } = req.params; // Get taxiId from the request parameters
    const { status } = req.body; // Get the status from the request body

    // Validate that status is one of the allowed values
    const validStatuses = ["waiting", "available", "roaming", "almost full", "full", "on trip", "not available"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Please provide a valid status." });
    }

    // Find the taxi by taxiId
    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    // Update the taxi status
    taxi.status = status;

    // Save the updated taxi document to the database
    await taxi.save();

    // Send the updated taxi data as the response only if no previous response is sent
    if (!res.headersSent) {
      res.status(200).json({ message: "Taxi status updated successfully.", taxi });
    }

    // Emit an event to notify other connected clients about the taxi status update
    io.emit("taxiStatusUpdate", taxi);
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));
  } catch (error) {
    // Log the error for debugging
    console.error("Error updating taxi status:", error);

    // Pass the error to the next middleware (for global error handling)
    next(error);
  }
};

// Update the current stop of the taxi by incrementing the stop order
exports.updateCurrentStop = async (req, res, next) => {
  try {
    const { taxiId } = req.params; // Get taxiId from request params

    // Fetch the taxi using taxiId
    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    // Fetch the route associated with the taxi
    const route = await Route.findById(taxi.routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    // Find the current stop in the route
    const currentStop = route.stops.find(stop => stop.name === taxi.currentStop);
    if (!currentStop) {
      return res.status(404).json({ message: "Current stop not found in route." });
    }

    // Find the next stop based on the current stop's order
    const nextStop = route.stops.find(stop => stop.order === currentStop.order + 1);
    if (!nextStop) {
      return res.status(404).json({ message: "No next stop available." });
    }

    // Update the taxi's current stop to the next stop
    taxi.currentStop = nextStop.name;

    // Save the updated taxi document to the database
    await taxi.save();

    // Return the updated taxi data as response
    res.status(200).json({ message: "Taxi's current stop updated successfully.", taxi });

    // Emit an event to notify other connected clients about the update (optional)
    io.emit("taxiCurrentStopUpdate", taxi);
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));
  } catch (error) {
    console.error("Error updating taxi's current stop:", error);
    next(error); // Pass the error to the next middleware for global error handling
  }
};

// Get real-time taxi information for passengers
exports.monitorTaxi = async (req, res, next) => {
  try {
    const { taxiId } = req.params; // Get taxiId from request parameters

    // Fetch the taxi document using the taxiId
    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username'); 
    
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    // Prepare the taxi information to send to the passenger
    const taxiInfo = {
      numberPlate: taxi.numberPlate,
      status: taxi.status,
      currentStop: taxi.currentStop,
      currentLoad: taxi.currentLoad,
      routeName: taxi.routeId.routeName,
      nextStop: getNextStop(taxi), // Function to calculate the next stop
      driverUsername: taxi.driverId.name,
    };

    // Return the taxi information as a response
    res.status(200).json({ message: "Taxi information fetched successfully.", taxiInfo });

    // Emit an event to notify other connected clients about the update (optional)
    io.emit("taxiUpdateForPassenger", taxiInfo);

  } catch (error) {
    console.error("Error monitoring taxi update:", error);
    next(error); // Pass the error to the next middleware for global error handling
  }
};

// Helper function to determine the next stop of the taxi
const getNextStop = (taxi) => {
  const currentStopIndex = taxi.routeId.stops.findIndex(stop => stop.name === taxi.currentStop);
  
  if (currentStopIndex === -1 || currentStopIndex === taxi.routeId.stops.length - 1) {
    return "End of the route"; // No next stop, or taxi is at the last stop
  }

  return taxi.routeId.stops[currentStopIndex + 1].name; // Return the next stop name
};


// Update the current load of the taxi
exports.updateLoad = async (req, res, next) => {
  try {
    const { taxiId } = req.params; // Get taxiId from request params
    const { newLoad } = req.body;  // Get the new load from the request body

    // Check if newLoad is a valid number and not negative
    if (isNaN(newLoad) || newLoad < 0) {
      return res.status(400).json({ message: "Load must be a non-negative number." });
    }

    // Fetch the taxi using taxiId
    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    // Ensure the new load does not exceed the taxi's capacity
    if (newLoad > taxi.capacity) {
      return res.status(400).json({ message: "Load cannot exceed the taxi's capacity." });
    }

    // Update the taxi's current load
    taxi.currentLoad = newLoad;

    // Save the updated taxi document to the database
    await taxi.save();

    // Return the updated taxi data as response
    res.status(200).json({ message: "Taxi load updated successfully.", taxi });

    // Emit an event to notify other connected clients about the load update (optional)
    io.emit("taxiLoadUpdate", taxi);
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));
  } catch (error) {
    console.error("Error updating taxi load:", error);
    next(error); // Pass the error to the next middleware for global error handling
  }
};


// Helper function to format taxi info
const formatTaxiInfo = (taxi) => {
  return {
    numberPlate: taxi.numberPlate,
    status: taxi.status,
    currentStop: taxi.currentStop,
    currentLoad: taxi.currentLoad,
    routeName: taxi.routeId.routeName,
    nextStop: getNextStop(taxi), // Function to calculate the next stop
    driverUsername: taxi.driverId.name,
  };
};



// Controller to get all stops for a given taxi based on its route
exports.getStopsForTaxi = async (req, res, next) => {
  try {
    const { taxiId } = req.params;
    const taxi = await Taxi.findById(taxiId).populate("routeId", "stops");
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }
    // Return the stops array from the taxi's route
    res.status(200).json({ stops: taxi.routeId.stops });
  } catch (error) {
    next(error);
  }
};

// Controller to update the current stop manually
exports.updateCurrentStopManual = async (req, res, next) => {
  try {
    const { taxiId } = req.params;
    const { currentStop } = req.body; // The new current stop selected by the user

    // Find the taxi by taxiId
    const taxi = await Taxi.findById(taxiId);
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    // Fetch the route associated with the taxi to validate the provided stop
    const route = await Route.findById(taxi.routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    // Check if the provided stop exists in the route stops list
    const validStop = route.stops.find((stop) => stop.name === currentStop);
    if (!validStop) {
      return res.status(400).json({ message: "Invalid stop selected." });
    }

    // Update the taxi's current stop
    taxi.currentStop = currentStop;
    await taxi.save();

    // Optionally emit a socket event to notify other clients

    res.status(200).json({ message: "Current stop updated successfully.", taxi });
  } catch (error) {
    next(error);
  }
};



