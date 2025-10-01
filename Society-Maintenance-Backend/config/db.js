// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

export const connectDB = async () => {
  try {
    // Connect to MongoDB using the MONGO_URI from the environment variables
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    // Log error message and exit the process with failure
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// export default connectDB;  // Using `export default` to export the function
