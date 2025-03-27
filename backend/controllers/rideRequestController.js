const RideRequest = require("../models/RideRequest");
const Route = require("../models/Route");
const Taxi = require("../models/Taxi")
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
exports.getNearbyRequests = async (req, res) => {
  try {
    const passengerId = req.user._id;
    const { currentStop, routeId } = req.query;

    if (!currentStop || !routeId) {
      return res.status(400).json({ error: "Both currentStop and routeId are required." });
    }

    // Retrieve the route details.
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found." });
    }

    // Find the current stop object to get its order.
    const currentStopObj = route.stops.find(s => s.name === currentStop);
    if (!currentStopObj) {
      return res.status(400).json({ error: "Invalid current stop provided." });
    }
    const currentOrder = currentStopObj.order;

    // Retrieve all ride requests for the passenger on this route.
    const rideRequests = await RideRequest.find({
      passenger: passengerId,
      route: routeId
    }).populate("route");

    // Filter the requests:
    // - Check that startingStop is either the current stop or one stop ahead.
    // - Check that the destinationStop is among the stops of the taxi route.
    const nearbyRequests = rideRequests.filter(request => {
      const requestStartStop = route.stops.find(s => s.name === request.startingStop);
      const requestDestStop = route.stops.find(s => s.name === request.destinationStop);

      // If either the startingStop or destinationStop is not valid in the route, skip the request.
      if (!requestStartStop || !requestDestStop) return false;

      // Only include requests where startingStop order is current or next.
      return requestStartStop.order === currentOrder || requestStartStop.order === currentOrder + 1;
    });

    return res.status(200).json({ rideRequests: nearbyRequests });
  } catch (err) {
    console.error("Error in getNearbyRequests:", err);
    return res.status(500).json({ error: "Server error." });
  }
};
