const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startLocation: {
      type: String,
      required: true,
      trim: true,
    },
    endLocation: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedTime: {
      type: Number, // Time in minutes
      required: true,
      default: 15, // Default estimate (adjustable)
    },
  },
  { timestamps: true }
);

const Route = mongoose.model("Route", routeSchema);
module.exports = Route;
