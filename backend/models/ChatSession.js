const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatSessionSchema = new Schema(
  {
    // Link to the ride this chat belongs to.
    rideRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideRequest",
      required: true,
      unique: true, // One chat session per ride request.
      index: true,
    },
    // The passenger user involved.
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The driver user involved (populated from the assigned Taxi's driverId).
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional: For sorting or UI hints.
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true } // Adds createdAt, updatedAt.
);

// Index to efficiently find chats for a specific user (either passenger or driver)
chatSessionSchema.index({ passenger: 1 });
chatSessionSchema.index({ driver: 1 });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
module.exports = ChatSession;