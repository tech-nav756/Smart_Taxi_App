const RideRequest = require('../models/RideRequest');
const Taxi = require('../models/Taxi');
const { getConnectedDrivers } = require('../socket'); // Import getConnectedDrivers

exports.requestRide = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation } = req.body;
    const passengerId = req.user.id;

    const nearestTaxi = await Taxi.findOne({ status: 'roaming' }).sort({ updatedAt: 1 });

    if (!nearestTaxi) {
      return res.status(400).json({ message: 'No available roaming taxis' });
    }

    const rideRequest = new RideRequest({
      passengerId,
      assignedTaxiId: nearestTaxi._id,
      assignedBy: 'system',
      status: 'assigned',
      pickupLocation,
      dropoffLocation,
    });

    await rideRequest.save();

    nearestTaxi.status = 'en route';
    await nearestTaxi.save();

    // Notify the assigned driver in real-time
    const connectedDrivers = getConnectedDrivers();  // Get the current list of connected drivers
    const driverSocketId = connectedDrivers.get(nearestTaxi.driverId);
    
    if (driverSocketId) {
      io.to(driverSocketId).emit('rideRequest', {
        rideRequestId: rideRequest._id,
        pickupLocation,
        dropoffLocation,
      });
    }

    res.status(201).json({ message: 'Ride request created', rideRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.acceptRide = async (req, res) => {
    try {
      const { rideRequestId } = req.body;
      const driverId = req.user.id;
  
      const rideRequest = await RideRequest.findById(rideRequestId);
      if (!rideRequest || rideRequest.status !== 'assigned') {
        return res.status(400).json({ message: 'Invalid ride request' });
      }
  
      rideRequest.status = 'accepted';
      await rideRequest.save();
  
      // Notify the passenger that the driver accepted the ride
      io.emit(`rideAccepted-${rideRequest.passengerId}`, {
        message: 'Your ride request has been accepted!',
        driverId,
        rideRequestId,
      });
  
      res.status(200).json({ message: 'Ride accepted', rideRequest });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

  exports.completeRide = async (req, res) => {
    try {
      const { rideRequestId } = req.body;
      const driverId = req.user.id;
  
      const rideRequest = await RideRequest.findById(rideRequestId);
      if (!rideRequest || rideRequest.status !== 'accepted') {
        return res.status(400).json({ message: 'Invalid or already completed ride' });
      }
  
      // Verify that the driver completing the ride is the one assigned
      const taxi = await Taxi.findOne({ _id: rideRequest.taxiId, driverId });
      if (!taxi) {
        return res.status(403).json({ message: 'Unauthorized: You are not assigned to this ride' });
      }
  
      rideRequest.status = 'completed';
      await rideRequest.save();
  
      // Mark taxi as available again
      taxi.status = 'available';
      await taxi.save();
  
      // Notify the passenger in real-time
      io.emit(`rideCompleted-${rideRequest.passengerId}`, {
        message: 'Your ride has been completed!',
        rideRequestId,
      });
  
      res.status(200).json({ message: 'Ride completed successfully', rideRequest });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
  exports.getRideHistory = async (req, res) => {
    try {
      const passengerId = req.user.id;
  
      const rides = await RideRequest.find({ passengerId })
        .populate('taxiId', 'numberPlate routeName')
        .sort({ createdAt: -1 });
  
      res.status(200).json({ rides });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
  exports.cancelRide = async (req, res) => {
    try {
      const { rideRequestId } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role; // Assuming role is included in authentication middleware
  
      const rideRequest = await RideRequest.findById(rideRequestId);
      if (!rideRequest || rideRequest.status !== 'pending') {
        return res.status(400).json({ message: 'Invalid or already processed ride request' });
      }
  
      if (userRole === 'passenger' && rideRequest.passengerId.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized: This is not your ride request' });
      }
  
      if (userRole === 'driver') {
        const taxi = await Taxi.findById(rideRequest.taxiId);
        if (!taxi || taxi.driverId.toString() !== userId) {
          return res.status(403).json({ message: 'Unauthorized: You are not assigned to this ride' });
        }
      }
  
      // Mark ride as cancelled
      rideRequest.status = 'cancelled';
      await rideRequest.save();
  
      // Notify the other party in real-time
      if (userRole === 'passenger') {
        io.emit(`rideCancelled-${rideRequest.taxiId}`, {
          message: 'The passenger has cancelled the ride.',
          rideRequestId,
        });
      } else {
        io.emit(`rideCancelled-${rideRequest.passengerId}`, {
          message: 'The driver has cancelled the ride.',
          rideRequestId,
        });
  
        // Auto-assign a new taxi to the passenger if a driver cancels
        const availableTaxi = await Taxi.findOne({ status: 'available' });
        if (availableTaxi) {
          rideRequest.taxiId = availableTaxi._id;
          rideRequest.status = 'pending';
          await rideRequest.save();
  
          io.emit(`rideReassigned-${rideRequest.passengerId}`, {
            message: 'Your ride has been reassigned to a new taxi.',
            rideRequestId,
          });
        }
      }
  
      res.status(200).json({ message: 'Ride cancelled successfully', rideRequest });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
