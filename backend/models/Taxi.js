// models/Taxi.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Taxi schema definition
const taxiSchema = new Schema(
  {
    taxiId: {
      type: String,
      required: true,
      unique: true,
    },
    numberPlate: {
      type: String,
      required: true,
      unique: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentLoad: {
      type: Number,
      default: 0,
      min: 0,
      max: function () {
        return this.capacity;
      },
    },
    status: {
      type: String,
      enum: ['waiting', 'available', 'almost full', 'full', 'on-trip'],
      default: 'available',
    },
    location: {
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
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create index for geospatial queries
taxiSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Taxi', taxiSchema);
