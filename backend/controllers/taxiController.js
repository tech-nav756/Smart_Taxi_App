const Taxi = require("../models/Taxi");
const Route = require("../models/Route");
const User = require("../models/User");
const { getIo } = require("../config/socket"); // Import Socket.IO instance

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
    const taxis = await Taxi.find({
      routeId: { $in: routeIds },
      status: { $in: ["waiting", "available", "almost full"] }, // Corrected statuses
    }).populate("routeId driverId", "routeName stops name");

    if (taxis.length === 0) {
      return res.status(404).json({ message: "No available taxis for the selected route." });
    }

    const filteredTaxis = taxis.filter((taxi) => {
      const route = routes.find((r) => r._id.equals(taxi.routeId._id));
      if (!route) return false;

      const startStop = route.stops.find((stop) => stop.name === startLocation);
      const endStop = route.stops.find((stop) => stop.name === endLocation);

      if (!startStop || !endStop) return false;

      // Check if the taxi is moving in the correct direction
      const taxiCurrentStopIndex = route.stops.findIndex(
        (stop) => stop.name === taxi.currentStop
      );
      const startStopIndex = route.stops.findIndex(
        (stop) => stop.name === startLocation
      );
      const endStopIndex = route.stops.findIndex(
        (stop) => stop.name === endLocation
      );

      if (taxiCurrentStopIndex === -1 || startStopIndex === -1 || endStopIndex === -1) {
        return false; // One of the stops or taxi's current stop not found
      }

      // Ensure startStop comes before endStop in the route
      if (startStopIndex > endStopIndex) {
        return false; // Backward search, taxi is going the wrong way
      }

      // Ensure taxi is at or before the startLocation
      return taxiCurrentStopIndex <= startStopIndex;
    });

    if (filteredTaxis.length === 0) {
      return res.status(404).json({ message: "No taxis available at your location or that have yet to pass it in the correct direction." });
    }

    res.status(200).json({ taxis: filteredTaxis });

    // Assuming 'io' is your socket.io instance
    // io.emit("taxiUpdate", filteredTaxis);
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
    const { taxiId } = req.params;
    const { status } = req.body;

    const validStatuses = ["waiting", "available", "roaming", "almost full", "full", "on trip", "not available"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Please provide a valid status." });
    }

    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    taxi.status = status;
    await taxi.save();

    res.status(200).json({ message: "Taxi status updated successfully.", taxi });

    io.emit("taxiStatusUpdate", taxi);
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));
  } catch (error) {
    console.error("Error updating taxi status:", error);
    next(error);
  }
};

exports.updateCurrentStop = async (req, res, next) => {
  try {
    const { taxiId } = req.params;

    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    const route = await Route.findById(taxi.routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    const currentStop = route.stops.find(stop => stop.name === taxi.currentStop);
    if (!currentStop) {
      return res.status(404).json({ message: "Current stop not found in route." });
    }

    const nextStop = route.stops.find(stop => stop.order === currentStop.order + 1);
    if (!nextStop) {
      return res.status(404).json({ message: "No next stop available." });
    }

    taxi.currentStop = nextStop.name;
    await taxi.save();

    res.status(200).json({ message: "Taxi's current stop updated successfully.", taxi });

    io.emit("taxiCurrentStopUpdate", taxi);
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));
  } catch (error) {
    console.error("Error updating taxi's current stop:", error);
    next(error);
  }
};

exports.monitorTaxi = async (req, res, next) => {
  try {
    const { taxiId } = req.params;

    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');

    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    const taxiInfo = {
      numberPlate: taxi.numberPlate,
      status: taxi.status,
      currentStop: taxi.currentStop,
      currentLoad: taxi.currentLoad,
      routeName: taxi.routeId.routeName,
      nextStop: getNextStop(taxi),
      maxLoad: taxi.capacity,
    };

    res.status(200).json({ message: "Taxi information fetched successfully.", taxiInfo });

    io.emit("taxiUpdateForPassenger", taxiInfo);
  } catch (error) {
    console.error("Error monitoring taxi update:", error);
    next(error);
  }
};

const getNextStop = (taxi) => {
  const currentStopIndex = taxi.routeId.stops.findIndex(stop => stop.name === taxi.currentStop);

  if (currentStopIndex === -1 || currentStopIndex === taxi.routeId.stops.length - 1) {
    return "End of the route";
  }

  return taxi.routeId.stops[currentStopIndex + 1].name;
};

exports.updateLoad = async (req, res, next) => {
  try {
    const { taxiId } = req.params;
    const { newLoad } = req.body;

    if (isNaN(newLoad) || newLoad < 0) {
      return res.status(400).json({ message: "Load must be a non-negative number." });
    }

    const taxi = await Taxi.findById(taxiId).populate('routeId', 'routeName stops').populate('driverId', 'username');
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    if (newLoad > taxi.capacity) {
      return res.status(400).json({ message: "Load cannot exceed the taxi's capacity." });
    }

    taxi.currentLoad = newLoad;
    await taxi.save();

    res.status(200).json({ message: "Taxi load updated successfully.", taxi });

    io.emit("taxiLoadUpdate", taxi);
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));
  } catch (error) {
    console.error("Error updating taxi load:", error);
    next(error);
  }
};

const formatTaxiInfo = (taxi) => {
  return {
    numberPlate: taxi.numberPlaate,
    status: taxi.status,
    currentStop: taxi.currentStop,
    currentLoad: taxi.currentLoad,
    routeName: taxi.routeId.routeName,
    nextStop: getNextStop(taxi),
    driverUsername: taxi.driverId.name,
  };
};

exports.getStopsForTaxi = async (req, res, next) => {
  try {
    const { taxiId } = req.params;
    const taxi = await Taxi.findById(taxiId).populate("routeId", "stops");
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }
    res.status(200).json({ stops: taxi.routeId.stops });
  } catch (error) {
    next(error);
  }
};

exports.updateCurrentStopManual = async (req, res, next) => {
  try {
    const { taxiId } = req.params;
    const { currentStop } = req.body;

    const taxi = await Taxi.findById(taxiId);
    if (!taxi) {
      return res.status(404).json({ message: "Taxi not found." });
    }

    const route = await Route.findById(taxi.routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    const validStop = route.stops.find((stop) => stop.name === currentStop);
    if (!validStop) {
      return res.status(400).json({ message: "Invalid stop selected." });
    }

    taxi.currentStop = currentStop;
    await taxi.save();

    res.status(200).json({ message: "Current stop updated successfully.", taxi });
    io.emit("taxiUpdateForPassenger", formatTaxiInfo(taxi));

  } catch (error) {
    next(error);
  }
};