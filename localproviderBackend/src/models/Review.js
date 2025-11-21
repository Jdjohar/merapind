// src/models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    rating: { type: Number, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', ReviewSchema);
