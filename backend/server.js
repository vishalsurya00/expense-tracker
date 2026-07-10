const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middlewares
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', healthRouter);

// Basic root route for verification
app.get('/', (req, res) => {
  res.send('Expenses App API is running.');
});

// Database Connection
if (!MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
  })
  .catch((error) => {
    console.error('MongoDB connection warning:', error.message);
  });

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

