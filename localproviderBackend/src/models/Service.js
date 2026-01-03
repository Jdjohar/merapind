// src/models/Service.js
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    providerName: { type: String },
    providerHourlyRate: { type: Number },

    title: { type: String, required: true },
    slug: { type: String, required: true },
    category: { type: String },
    description: { type: String },

    price: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 60 },

    images: [String], // array of image URLs (Cloudinary or external)
    imageUrl: String, // primary image

    tags: [String],
    location: { type: String }, // optional location string

    isActive: { type: Boolean, default: true },
    meta: { type: Object }, // free-form metadata (optional)
    isDeleted: { type: Boolean, default: false, index: true }

  },
  { timestamps: true }
);

// optional: text index for search (create in mongo or via mongoose)
ServiceSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);
