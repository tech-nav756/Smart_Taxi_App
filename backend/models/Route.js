// models/Route.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Route schema definition
const routeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    startPoint: {
      type: String,
      required: true,
      trim: true,
    },
    endPoint: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedTime: {
      type: Number, // Time in minutes
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Route', routeSchema);
