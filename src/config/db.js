const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    // Attempt connection with a short timeout to fail fast if DB is down
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
  } catch (error) {
    console.warn(`==================================================`);
    console.warn(`  WARNING: MongoDB Connection Failed!`);
    console.warn(`  Reason: ${error.message}`);
    console.warn(`  Falling back to In-Memory store for development.`);
    console.warn(`==================================================`);
    isConnected = false;
  }
};

connectDB.isConnected = () => isConnected;

module.exports = connectDB;
