// models/RideRequest.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

const rideRequestSchema = new Schema(
  {
    passengerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTaxiId: {
      type: Schema.Types.ObjectId,
      ref: 'Taxi',
      default: null, // Assigned automatically when available
    },
    assignedBy: {
      type: String,
      enum: ['system', 'admin'],
      default: 'system', // Most assignments will be automated
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    dropoffLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for geospatial queries
rideRequestSchema.index({ pickupLocation: '2dsphere' });
rideRequestSchema.index({ dropoffLocation: '2dsphere' });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
