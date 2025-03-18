// models/TaxiDriverGroup.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// TaxiDriverGroup schema definition
const taxiDriverGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,  // Ensuring the group name is unique
      minlength: [3, 'Group name must be at least 3 characters long'],
      maxlength: [50, 'Group name must be under 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description must be under 200 characters'],
    },
    drivers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model (drivers)
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model (driver who created the group)
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Ensuring that the user adding a new driver to the group is actually a driver
taxiDriverGroupSchema.pre('save', function (next) {
  if (!this.drivers.includes(this.createdBy)) {
    this.drivers.push(this.createdBy); // Add creator to the drivers list
  }
  next();
});

module.exports = mongoose.model('TaxiDriverGroup', taxiDriverGroupSchema);
