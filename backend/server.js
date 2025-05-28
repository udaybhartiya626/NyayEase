const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Show current directory for debugging
console.log('Current directory:', __dirname);

// Check if .env file exists
const envPath = path.resolve(__dirname, '.env');
console.log('.env path:', envPath);
console.log('.env file exists:', fs.existsSync(envPath) ? 'Yes' : 'No');

// Load env variables with explicit path
dotenv.config({ path: envPath });

// Debug: Log the environment variables (excluding sensitive info)
console.log('Environment variables loaded:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- MONGO_URI set: ${process.env.MONGO_URI ? 'Yes' : 'No'}`);
console.log(`- JWT_SECRET set: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
console.log(`- JWT_EXPIRE: ${process.env.JWT_EXPIRE}`);

const connectDB = require('./config/db');

// Connect to database
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
  console.log('Server will run without database functionality');
});

// Load all models
require('./models');

// Start hearing notifier
const startHearingNotifier = require('./utils/hearingNotifier');
const notifierCleanup = startHearingNotifier();

// Start hearing status scheduler
const { startScheduler } = require('./scheduler');
startScheduler();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  if (notifierCleanup) {
    notifierCleanup();
    console.log('Hearing notifier stopped');
  }
  process.exit(0);
});

const app = express();
const options = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


// Middleware
app.use(cors(options));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/hearings', require('./routes/hearings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/case-requests', require('./routes/caseRequests'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/hearings', require('./routes/hearings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ratings', require('./routes/ratings'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to NyayEase API' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 