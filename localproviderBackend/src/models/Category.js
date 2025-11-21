// src/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    color: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', CategorySchema);
