const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values while ensuring uniqueness when set
    },
    role: {
      type: String,
      enum: ['passenger', 'driver'],
      default: 'passenger',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values while ensuring uniqueness when set
    },
    password: {
      type: String,
      select: false, // Exclude password from queries by default
    },
  },
  { timestamps: true }
);

// Hash password before saving if it exists
userSchema.pre('save', async function (next) {
  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false; // Prevent password comparison for Google users
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
