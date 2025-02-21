// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000; // Use port from .env or default to 5000

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies

// MongoDB Connection
const uri = process.env.MONGODB_URI; // Get MongoDB URI from .env file
mongoose.connect(uri, { });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Endpoint API untuk menerima pesan dari aplikasi pasien
app.post('/messages', (req, res) => {
  const message = req.body; // Data pesan dari body request
  console.log('Pesan diterima dari pasien:', message); // Log pesan yang diterima di server

  // Kirim respons sukses ke aplikasi pasien
  res.status(200).json({ message: 'Pesan diterima server!' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});