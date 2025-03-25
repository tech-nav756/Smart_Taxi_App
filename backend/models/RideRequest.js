const mongoose = require("mongoose");

const rideRequestSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taxiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Taxi",
      required: false, // Assigned when a taxi accepts the request
    },
    type: {
      type: String,
      enum: ["requestRide", "pickUp"],
      required: true,
    },
    startStop: {
      type: String,
      required: true,
    },
    startOrder: {
      type: Number,
      required: true,
    },
    destinationStop: {
      type: String,
      required: function () {
        return this.type === "requestRide";
      },
    },
    destinationOrder: {
      type: Number,
      required: function () {
        return this.type === "requestRide";
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "canceled"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const RideRequest = mongoose.model("RideRequest", rideRequestSchema);
module.exports = RideRequest;