const RideRequest = require("../models/RideRequest");
const Route = require("../models/Route");
const Taxi = require("../models/Taxi");

/**
 * Create a ride request.
 * Business logic:
 * - Passenger provides both startingStop and destinationStop.
 * - The system finds a route that contains both stops.
 * - Validates that startingStop comes before destinationStop.
 * - Eligible taxis are those on the same route with status "on trip"
 *   whose current stop order is less than the passenger's starting stop order.
 */
exports.createRideRequest = async (req, res) => {
  try {
    const passenger = req.user._id;
    const { startingStop, destinationStop } = req.body;

    if (!startingStop || !destinationStop) {
      return res.status(400).json({
        error: "Both starting and destination stops are required for a ride request.",
      });
    }

    // Find a route that contains both stops.
    const route = await Route.findOne({
      "stops.name": { $all: [startingStop, destinationStop] },
    });

    if (!route) {
      return res.status(404).json({ error: "No route found containing both stops." });
    }

    // Retrieve stop details to validate the order.
    const startStopObj = route.stops.find((s) => s.name === startingStop);
    const destStopObj = route.stops.find((s) => s.name === destinationStop);

    if (!startStopObj || !destStopObj || startStopObj.order >= destStopObj.order) {
      return res.status(400).json({ error: "Invalid stop order for ride request." });
    }

    // Create the ride request with requestType "ride".
    const newRideRequest = new RideRequest({
      passenger,
      route: route._id,
      requestType: "ride",
      startingStop,
      destinationStop,
    });

    await newRideRequest.save();

    // Find eligible taxis:
    // Taxis on the same route with status "on trip"
    // whose current stop order is less than the startingStop order.
    const taxisOnRoute = await Taxi.find({ routeId: route._id, status: "on trip" });
    const eligibleTaxis = taxisOnRoute.filter((taxi) => {
      // Map taxi's current stop name to its order in the route.
      const taxiStop = route.stops.find((s) => s.name === taxi.currentStop);
      return taxiStop && taxiStop.order < startStopObj.order;
    });

    // TODO: Notify eligible taxis as needed (e.g., via Socket.io).

    return res.status(201).json({ rideRequest: newRideRequest, route, eligibleTaxis });
  } catch (err) {
    console.error("Error in createRideRequest:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

/**
 * Create a pickup request.
 * Business logic:
 * - Passenger provides only the startingStop.
 * - The system finds a route that contains that startingStop.
 * - Eligible taxis are those on the same route with status "roaming".
 */
exports.createPickupRequest = async (req, res) => {
  try {
    const passenger = req.user._id;
    const { startingStop } = req.body;

    if (!startingStop) {
      return res.status(400).json({
        error: "Starting stop is required for pickup requests.",
      });
    }

    // Find a route that contains the starting stop.
    const route = await Route.findOne({
      "stops.name": startingStop,
    });

    if (!route) {
      return res.status(404).json({ error: "No route found containing the starting stop." });
    }

    // Create the pickup request. destinationStop is not needed.
    const newPickupRequest = new RideRequest({
      passenger,
      route: route._id,
      requestType: "pickup",
      startingStop,
      destinationStop: "", // Not used for pickup.
    });

    await newPickupRequest.save();

    // Find eligible taxis:
    // Taxis on the same route with status "roaming".
    const eligibleTaxis = await Taxi.find({ routeId: route._id, status: "roaming" });

    // TODO: Notify eligible taxis as needed.

    return res.status(201).json({ rideRequest: newPickupRequest, route, eligibleTaxis });
  } catch (err) {
    console.error("Error in createPickupRequest:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

/**
 * Allow a driver to accept a ride or pickup request.
 * Business logic:
 * - For ride requests: the taxi must have status "on trip", be on the same route,
 *   and its current stop order must be less than the passenger's starting stop order.
 * - For pickup requests: the taxi must have status "roaming" and be on the same route.
 */
exports.acceptRequest = async (req, res) => {
  try {
    // Driver details are assumed to be set in req.user (including taxiId).
    const driverId = req.user._id;
    const taxiId = req.user.taxiId; // Taxi associated with this driver.
    const { requestId } = req.params;

    // Retrieve the request and populate its route.
    const rideRequest = await RideRequest.findById(requestId).populate("route");
    if (!rideRequest) {
      return res.status(404).json({ error: "Ride request not found." });
    }

    // The request must still be pending.
    if (rideRequest.status !== "pending") {
      return res.status(400).json({ error: "Request is no longer pending." });
    }

    // Retrieve taxi details.
    const taxi = await Taxi.findById(taxiId);
    if (!taxi) {
      return res.status(404).json({ error: "Taxi not found." });
    }

    // Ensure taxi is on the same route as the request.
    if (String(taxi.routeId) !== String(rideRequest.route._id)) {
      return res.status(400).json({ error: "Taxi is not on the correct route." });
    }

    if (rideRequest.requestType === "ride") {
      // Taxi must be "on trip".
      if (taxi.status !== "on trip") {
        return res.status(400).json({ error: "Taxi is not available for ride requests." });
      }

      // Verify taxi's current stop order is less than passenger's starting stop.
      const taxiStop = rideRequest.route.stops.find((s) => s.name === taxi.currentStop);
      const passengerStop = rideRequest.route.stops.find((s) => s.name === rideRequest.startingStop);

      if (!taxiStop || !passengerStop || taxiStop.order >= passengerStop.order) {
        return res.status(400).json({ error: "Taxi has already passed the passenger's starting stop." });
      }
    } else if (rideRequest.requestType === "pickup") {
      // Taxi must be "roaming" for pickup.
      if (taxi.status !== "roaming") {
        return res.status(400).json({ error: "Taxi is not available for pickup requests." });
      }
    }

    // Accept the request.
    rideRequest.status = "accepted";
    rideRequest.taxi = taxi._id;
    await rideRequest.save();

    // Optionally update taxi status. For example, if the taxi accepted a pickup, you might set it to "on trip".
    if (rideRequest.requestType === "pickup") {
      taxi.status = "on trip";
      await taxi.save();
    }

    // TODO: Notify the passenger and driver of the acceptance.

    return res.status(200).json({ message: "Request accepted.", rideRequest });
  } catch (err) {
    console.error("Error in acceptRequest:", err);
    return res.status(500).json({ error: "Server error." });
  }
};
