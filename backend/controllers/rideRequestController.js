const RideRequest = require("../models/RideRequest");
const Taxi = require("../models/Taxi");
const { getIo, getConnectedDrivers } = require("../socket"); // Import getIo and getConnectedDrivers
const io = getIo(); // Initialize io

// Request a ride
exports.requestRide = async (req, res) => {
  try {
    const { startStop, destinationStop } = req.body;
    const passengerId = req.user.id;

    // Find taxis that are on trip and have a stop at startStop before destinationStop
    const availableTaxis = await Taxi.find({
      status: "on trip",
      "route.stops.name": startStop,
    });

    if (availableTaxis.length === 0) {
      return res.status(400).json({ message: "No available taxis for your request." });
    }

    const rideRequest = new RideRequest({
      passengerId,
      type: "requestRide",
      startStop,
      destinationStop,
      status: "pending",
    });
    await rideRequest.save();

    // Notify available taxis via Socket.io
    availableTaxis.forEach((taxi) => {
      const driverSocketId = getConnectedDrivers().get(taxi.driverId.toString());
      if (driverSocketId) {
        io.to(driverSocketId).emit("newRideRequest", {
          message: `New ride request at ${startStop}`,
          rideRequest,
        });
      }
    });

    res.status(201).json({ message: "Ride request sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Request a pickup
exports.requestPickup = async (req, res) => {
  try {
    const { startStop } = req.body;
    const passengerId = req.user.id;

    // Find roaming taxis at the passenger's location
    const availableTaxis = await Taxi.find({ status: "roaming", currentStop: startStop });

    if (availableTaxis.length === 0) {
      return res.status(400).json({ message: "No roaming taxis available." });
    }

    const rideRequest = new RideRequest({
      passengerId,
      type: "pickUp",
      startStop,
      status: "pending",
    });
    await rideRequest.save();

    // Notify roaming taxis via Socket.io
    availableTaxis.forEach((taxi) => {
      const driverSocketId = getConnectedDrivers().get(taxi.driverId.toString());
      if (driverSocketId) {
        io.to(driverSocketId).emit("newPickupRequest", {
          message: `New pickup request at ${startStop}`,
          rideRequest,
        });
      }
    });

    res.status(201).json({ message: "Pickup request sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Accept ride request
exports.acceptRideRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const driverId = req.user.id;

    // Find the ride request
    const rideRequest = await RideRequest.findById(requestId);
    if (!rideRequest) {
      return res.status(404).json({ message: "Ride request not found." });
    }

    // Update ride request status
    rideRequest.status = "accepted";
    rideRequest.driverId = driverId;
    await rideRequest.save();

    // Notify the passenger that their ride request was accepted
    const passengerSocketId = getConnectedDrivers().get(rideRequest.passengerId.toString());
    if (passengerSocketId) {
      io.to(passengerSocketId).emit("rideRequestAccepted", {
        message: "A driver has accepted your ride request.",
        rideRequest,
      });
    }

    res.json({ message: "Ride request accepted successfully.", rideRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Cancel ride request
exports.cancelRideRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const rideRequest = await RideRequest.findById(requestId);

    if (!rideRequest) {
      return res.status(404).json({ message: "Ride request not found." });
    }

    rideRequest.status = "canceled";
    await rideRequest.save();

    // Notify the passenger and drivers about cancellation via Socket.io
    io.to(rideRequest.passengerId.toString()).emit("rideRequestCanceled", {
      message: "Your ride request has been canceled.",
      requestId,
    });

    res.json({ message: "Ride request canceled." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};
