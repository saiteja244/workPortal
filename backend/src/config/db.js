const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Try to connect to MongoDB Atlas first
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://demo:demo123@cluster0.mongodb.net/job-networking-portal?retryWrites=true&w=majority';
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Starting without database connection - some features may not work');
    // Don't exit process, let the app continue without database
  }
};

module.exports = connectDB; 