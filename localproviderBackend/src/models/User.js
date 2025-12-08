// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Roles
    role: {
      type: String,
      enum: ["USER", "PROVIDER"],
      default: "USER",
    },

    phone: String,
    address: String,
    lat: Number,
    lng: Number,

    // Password reset fields (used by authController)
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
