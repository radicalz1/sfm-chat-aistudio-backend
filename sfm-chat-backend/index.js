require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const app = express();
app.use(cors());
app.use(express.json());

// Add basic route handler
app.get('/', (req, res) => {
  res.json({ message: 'Chat Backend Server is running' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
let messagesCollection;

async function uploadToCloudinary(base64Data, patientId) {
  const uploadResponse = await cloudinary.uploader.upload(base64Data, {
    folder: `patients/${patientId}`,
    resource_type: 'auto',
    access_mode: 'authenticated'
  });
  return uploadResponse.secure_url;
}

async function startServer() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    const db = mongoClient.db('chat-app');
    messagesCollection = db.collection('messages');

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('message', async (message) => {
        console.log('Received message type:', message.type);
        try {
          let messageWithMetadata = {
            ...message,
            timestamp: new Date(),
            socketId: socket.id
          };

          if (message.type === 'image' && message.uri) {
            const imageUrl = await uploadToCloudinary(
              message.uri,
              message.patientId || 'default'
            );
            messageWithMetadata.uri = imageUrl;
          }

          await messagesCollection.insertOne(messageWithMetadata);
          console.log('Message saved to DB');

          socket.broadcast.emit('message', messageWithMetadata);
          console.log('Message broadcasted');

          socket.emit('message:ack', {
            messageId: message.id,
            status: 'delivered'
          });
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      socket.on('fetch:history', async () => {
        try {
          const history = await messagesCollection
            .find({})
            .sort({ timestamp: 1 })
            .toArray();
          socket.emit('history', history);
          console.log('Sent message history to client:', socket.id);
        } catch (error) {
          console.error('Error fetching history:', error);
          socket.emit('error', { message: 'Failed to fetch history' });
        }
      });
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Error handling for MongoDB connection
mongoClient.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

process.on('SIGINT', async () => {
  try {
    await mongoClient.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

startServer();