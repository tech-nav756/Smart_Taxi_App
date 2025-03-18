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
    taxiId: {
      type: Schema.Types.ObjectId,
      ref: 'Taxi',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
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

rideRequestSchema.index({ pickupLocation: '2dsphere' });
rideRequestSchema.index({ dropoffLocation: '2dsphere' });

module.exports = mongoose.model('PickUp', rideRequestSchema);
