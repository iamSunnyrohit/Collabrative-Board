require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const Board = require('./models/Board');

const app = express();
app.use(cors());

// Creating the HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Default React development port
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Setting up the Socket.io connection event
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', async (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;

    try {
      // Send existing lines and texts to the newly connected user for exactly this room
      let board = await Board.findOne({ roomId });
      if (!board) {
        board = await Board.create({ roomId, lines: [], texts: [] });
      }
      socket.emit('load-board-data', { 
        lines: board.lines, 
        texts: board.texts || [] 
      });
    } catch (error) {
      console.error('Error loading board data:', error);
    }
  });

  // When a user starts or continues drawing, broadcast the coordinates
  socket.on('draw-line', async (data) => {
    const roomId = socket.roomId || 'default';
    
    // Broadcast to everyone else connected in the same room
    socket.to(roomId).emit('draw-line', data);

    try {
      // Save line to the database for this specific room
      await Board.updateOne(
        { roomId },
        { $push: { lines: data } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving line:', error);
    }
  });

  socket.on('draw-text', async (data) => {
    const roomId = socket.roomId || 'default';
    
    // Broadcast to everyone else connected in the same room
    socket.to(roomId).emit('draw-text', data);

    try {
      // Save text to the database for this specific room
      await Board.updateOne(
        { roomId },
        { $push: { texts: data } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving text:', error);
    }
  });

  socket.on('clear-canvas', async () => {
    const roomId = socket.roomId || 'default';
    socket.to(roomId).emit('clear-canvas');

    try {
      // Clear data for this room
      await Board.updateOne(
        { roomId },
        { $set: { lines: [], texts: [] } }
      );
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  });

  // Relay mouse movements for user cursors
  socket.on('mouse-move', (data) => {
     const roomId = socket.roomId || 'default';
     socket.to(roomId).emit('mouse-move', { ...data, id: socket.id });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    socket.to(socket.roomId || 'default').emit('user-disconnected', socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
