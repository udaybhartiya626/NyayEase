const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Check if local-mongo.js exists and import it conditionally
const localMongoPath = path.join(__dirname, 'local-mongo.js');
const hasLocalMongo = fs.existsSync(localMongoPath);
const localMongo = hasLocalMongo ? require('./local-mongo') : null;

let isUsingMockDB = false;

const connectDB = async () => {
  try {
    // Debug log
    console.log(`Attempting to connect to MongoDB with URI: ${process.env.MONGO_URI ? '[CONFIGURED]' : 'undefined'}`);
    
    // Skip DB connection if MONGO_URI is not defined (for development without MongoDB)
    if (!process.env.MONGO_URI) {
      console.log('MongoDB connection skipped: No MONGO_URI provided.');
      
      if (hasLocalMongo) {
        console.log('Running with local mock database for development');
        isUsingMockDB = true;
        return;
      } else {
        throw new Error('No MongoDB URI provided and no local mock database available');
      }
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // New URL parser and topology are now default in mongoose 7+
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    if (hasLocalMongo) {
      console.log('Running with local mock database due to connection error');
      isUsingMockDB = true;
    } else {
      console.error('No local mock database available. Exiting...');
      process.exit(1);
    }
  }
};

// Export the connection function and mock DB status
module.exports = connectDB;
module.exports.isMockDB = () => isUsingMockDB;
module.exports.mockDB = localMongo; 