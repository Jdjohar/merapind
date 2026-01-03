const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['USER', 'PROVIDER'],
      default: 'USER',
    },

    phone: String,
    address: String,
    lat: Number,
    lng: Number,

    // ✅ ADMIN CONTROL FLAGS
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
