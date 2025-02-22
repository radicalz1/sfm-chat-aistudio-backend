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

// Array sederhana untuk menyimpan pesan sementara (in-memory)
const chatMessages = [
  { id: '1', sender: 'apoteker', type: 'text', text: 'Selamat datang! Ada yang bisa saya bantu?' },
  { id: '2', sender: 'pasien', type: 'text', text: 'Halo, saya mau bertanya tentang obat demam.' },
  { id: '3', sender: 'apoteker', type: 'text', text: 'Tentu, obat demam apa yang Anda maksud?' },
];

// Endpoint API untuk mengambil pesan (untuk polling dari aplikasi pasien)
app.get('/getMessages', (req, res) => {
  console.log('Permintaan GET /getMessages diterima dari pasien'); // Log permintaan getMessages
  res.status(200).json(chatMessages); // Kirim array pesan sebagai response JSON
});

// Endpoint API untuk menerima pesan dari aplikasi pasien
app.post('/messages', (req, res) => {
  const message = req.body; // Data pesan dari body request
  console.log('Pesan diterima dari pasien:', message); // Log pesan yang diterima di server

  chatMessages.push(message); // SIMPAN PESAN KE ARRAY chatMessages (in-memory) - TAMBAHKAN BARIS INI

  // Kirim respons sukses ke aplikasi pasien
  res.status(200).json({ message: 'Pesan diterima server!' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});