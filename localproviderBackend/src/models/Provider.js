const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    name: { type: String, required: true },
    category: { type: String, required: true },

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    hourlyRate: { type: Number, required: true },
    description: { type: String, required: true },

    imageUrl: { type: String },
    phone: { type: String },

    // 🔐 ADMIN CONTROLS
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },

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

    location: { type: String },
    lat: Number,
    lng: Number,

    availability: { type: String, default: 'Available Now' },
    tags: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Provider', ProviderSchema);
