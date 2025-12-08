// src/models/Provider.js
const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true },
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    hourlyRate: { type: Number, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
 // ✅ NEW
    phone: { type: String },

    isVerified: { type: Boolean, default: false },

    location: { type: String },
    lat: Number,
    lng: Number,

    availability: { type: String, default: 'Available Now' },

    tags: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Provider', ProviderSchema);
