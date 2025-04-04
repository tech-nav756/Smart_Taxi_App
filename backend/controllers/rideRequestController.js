const RideRequest = require("../models/RideRequest");
const Route = require("../models/Route");
const Taxi = require("../models/Taxi")
const User = require("../models/User")
const { getIo, getConnectedDrivers } = require("../socket");

exports.createRideRequest = async (req, res) => {
  try {
    const passenger = req.user._id;
    const { startingStop, destinationStop } = req.body;

    if (!startingStop || !destinationStop) {
      return res.status(400).json({
        error: "Both starting and destination stops are required for a ride request.",
      });
    }

    const route = await Route.findOne({
      "stops.name": { $all: [startingStop, destinationStop] },
    });

    if (!route) {
      return res.status(404).json({ error: "No route found containing both stops." });
    }

    const startStopObj = route.stops.find((s) => s.name === startingStop);
    const destStopObj = route.stops.find((s) => s.name === destinationStop);

    if (!startStopObj || !destStopObj || startStopObj.order >= destStopObj.order) {
      return res.status(400).json({ error: "Invalid stop order for ride request." });
    }

    const newRideRequest = new RideRequest({
      passenger,
      route: route._id,
      requestType: "ride",
      startingStop,
      destinationStop,
    });

    await newRideRequest.save();

    const taxisOnRoute = await Taxi.find({ routeId: route._id, status: "on trip" });
    const eligibleTaxis = taxisOnRoute.filter((taxi) => {
      const taxiStop = route.stops.find((s) => s.name === taxi.currentStop);
      return taxiStop && taxiStop.order < startStopObj.order;
    });

    // **Emit notification to connected drivers**
    const io = getIo();
    const connectedDrivers = getConnectedDrivers();
    
    eligibleTaxis.forEach((taxi) => {
      if (connectedDrivers.has(taxi.driverId.toString())) {
        io.to(connectedDrivers.get(taxi.driverId.toString())).emit("newRideRequest", {
          requestId: newRideRequest._id,
          startingStop,
          destinationStop,
          route: route.name,
        });
      }
    });

    return res.status(201).json({ rideRequest: newRideRequest, route, eligibleTaxis });
  } catch (err) {
    console.error("Error in createRideRequest:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

exports.createPickupRequest = async (req, res) => {
  try {
    const passenger = req.user._id;
    const { startingStop } = req.body;

    if (!startingStop) {
      return res.status(400).json({ error: "Starting stop is required for pickup requests." });
    }

    const route = await Route.findOne({ "stops.name": startingStop });

    if (!route) {
      return res.status(404).json({ error: "No route found containing the starting stop." });
    }

    const newPickupRequest = new RideRequest({
      passenger,
      route: route._id,
      requestType: "pickup",
      startingStop,
      destinationStop: "", 
    });

    await newPickupRequest.save();

    const eligibleTaxis = await Taxi.find({ routeId: route._id, status: "roaming" });

    // **Emit notification to roaming drivers**
    const io = getIo();
    const connectedDrivers = getConnectedDrivers();

    eligibleTaxis.forEach((taxi) => {
      if (connectedDrivers.has(taxi.driverId.toString())) {
        io.to(connectedDrivers.get(taxi.driverId.toString())).emit("newPickupRequest", {
          requestId: newPickupRequest._id,
          startingStop,
          route: route.name,
        });
      }
    });

    return res.status(201).json({ rideRequest: newPickupRequest, route, eligibleTaxis });
  } catch (err) {
    console.error("Error in createPickupRequest:", err);
    return res.status(500).json({ error: "Server error." });
  }
};


exports.acceptRequest = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { requestId } = req.params;

    const rideRequest = await RideRequest.findById(requestId).populate("route");
    if (!rideRequest) {
      return res.status(404).json({ error: "Ride request not found." });
    }

    if (rideRequest.status !== "pending") {
      return res.status(400).json({ error: "Request is no longer pending." });
    }

    const taxi = await Taxi.findOne({ driverId: driverId });
    if (!taxi) {
      return res.status(404).json({ error: "Taxi for this driver not found." });
    }

    if (String(taxi.routeId) !== String(rideRequest.route._id)) {
      return res.status(400).json({ error: "Taxi is not on the correct route." });
    }

    if (rideRequest.requestType === "ride") {
      if (taxi.status !== "on trip") {
        return res.status(400).json({ error: "Taxi is not available for ride requests." });
      }

      const taxiStop = rideRequest.route.stops.find((s) => s.name === taxi.currentStop);
      const passengerStop = rideRequest.route.stops.find((s) => s.name === rideRequest.startingStop);

      if (!taxiStop || !passengerStop) {
        return res.status(400).json({ error: "Invalid route stops data." });
      }

      if (taxiStop.order >= passengerStop.order) {
        return res.status(400).json({ error: "Taxi has already passed the passenger's starting stop." });
      }
    } else if (rideRequest.requestType === "pickup") {
      if (taxi.status !== "roaming") {
        return res.status(400).json({ error: "Taxi is not available for pickup requests." });
      }
      taxi.status = "on trip"; // Update taxi status
      await taxi.save();
    } else {
      return res.status(400).json({ error: "Unsupported request type." });
    }

    rideRequest.status = "accepted";
    rideRequest.taxi = taxi._id;
    await rideRequest.save();

    // **Emit notification to the passenger**
    const io = getIo();
    io.to(rideRequest.passenger.toString()).emit("requestAccepted", {
      requestId: rideRequest._id,
      driverId: driverId,
      taxi: taxi._id,
      message: "Your ride request has been accepted!",
    });

    return res.status(200).json({ message: "Request accepted.", rideRequest });
  } catch (err) {
    console.error("Error in acceptRequest:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

/**
 * Retrieve all requests made by the authenticated passenger
 * where:
 * - The starting stop is either the current stop or one stop ahead.
 * - The destination stop exists in the taxi route's stops.
 *
 * Expects two query parameters:
 * - currentStop: the name of the passenger's current stop.
 * - routeId: the ID of the route the passenger is on.
 */
exports.getNearbyRequestsForDriver = async (req, res) => {
  try {
    // Ensure req.user exists and has _id.
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized: Driver not authenticated." });
    }

    const driverId = req.user._id;

    // Retrieve the taxi associated with this driver.
    const taxi = await Taxi.findOne({ driverId });
    if (!taxi) {
      return res.status(404).json({ error: "Taxi for this driver not found." });
    }
    
    // Check that taxi has a routeId.
    if (!taxi.routeId) {
      console.error("Taxi found but routeId is undefined for taxi:", taxi);
      return res.status(400).json({ error: "Taxi route information is missing." });
    }

    // Retrieve the route for the taxi.
    const route = await Route.findById(taxi.routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found for the taxi." });
    }

    // Ensure the route has stops defined.
    if (!route.stops || !Array.isArray(route.stops) || route.stops.length === 0) {
      return res.status(400).json({ error: "Route stops are not defined." });
    }

    // Find the taxi's current stop details from the route stops.
    const taxiCurrentStopObj = route.stops.find((s) => s.name === taxi.currentStop);
    if (!taxiCurrentStopObj) {
      return res.status(400).json({ error: "Taxi's current stop is not found in the route stops." });
    }
    const currentOrder = taxiCurrentStopObj.order;
    const nextOrder = currentOrder + 1;

    // Retrieve pending ride requests on the same route.
    const rideRequests = await RideRequest.find({
      route: route._id,
      status: "pending",
    });

    // Filter requests based on startingStop order and ensure destinationStop exists on route.
    const nearbyRequests = rideRequests.filter((request) => {
      // Validate that request has startingStop and destinationStop.
      if (!request.startingStop || !request.destinationStop) return false;
      
      const requestStartStop = route.stops.find((s) => s.name === request.startingStop);
      const requestDestStop = route.stops.find((s) => s.name === request.destinationStop);

      // Only include the request if both stops are valid.
      if (!requestStartStop || !requestDestStop) return false;

      // Include requests that are at the current stop or one stop ahead.
      return requestStartStop.order === currentOrder || requestStartStop.order === nextOrder;
    });

    return res.status(200).json({ rideRequests: nearbyRequests });
  } catch (err) {
    console.error("Error in getNearbyRequestsForDriver:", err);
    return res.status(500).json({ error: "Server error." });
  }
};


exports.getAcceptedTaxiDetails = async (req, res) => {
  try {
    const passengerId = req.user._id;
    const { requestId } = req.params;

    const rideRequest = await RideRequest.findOne({
      passenger: passengerId,
      status: "accepted",
    }).populate("taxi route");

    if (!rideRequest) {
      return res.status(404).json({ error: "Ride request not found or not accepted." });
    }

    if (!rideRequest.taxi) {
        return res.status(404).json({error: "Taxi details not available for this request."})
    }

    const driver = await User.findOne({_id: rideRequest.taxi.driverId});

    if (!driver){
        return res.status(404).json({error: "Driver details not found."})
    }

    const taxiDetails = {
      taxiId: rideRequest.taxi._id,
      numberPlate: rideRequest.taxi.numberPlate,
      driverName: driver.name,
      driverContact: driver.contact,
      route: rideRequest.route.routeName,
      currentStop: rideRequest.taxi.currentStop,
      capacity: rideRequest.taxi.capacity,
      currentLoad: rideRequest.taxi.currentLoad,
      status: rideRequest.taxi.status,
    };

    return res.status(200).json({ taxiDetails });
  } catch (err) {
    console.error("Error in getAcceptedTaxiDetails:", err);
    return res.status(500).json({ error: "Server error." });
  }
};