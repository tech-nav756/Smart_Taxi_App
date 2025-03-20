const mongoose = require("mongoose");
const { Schema } = mongoose;

const taxiDriverGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Group name must be unique
      minlength: [3, "Group name must be at least 3 characters long"],
      maxlength: [50, "Group name must be under 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description must be under 200 characters"],
    },
    drivers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to User model (drivers)
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Driver who created the group
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure creator is part of the group
taxiDriverGroupSchema.pre("save", function (next) {
  if (!this.drivers.includes(this.createdBy)) {
    this.drivers.push(this.createdBy);
  }
  next();
});

module.exports = mongoose.model("TaxiDriverGroup", taxiDriverGroupSchema);

