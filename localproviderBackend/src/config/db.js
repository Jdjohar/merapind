// src/config/db.js
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log('MONGO_URI (masked):', uri ? 'SET' : 'NOT SET');

  if (!uri) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
