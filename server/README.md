# Collaborative Whiteboard - Server (Backend)

This directory contains the Node.js backend for the Collaborative Whiteboard application.

## 🏗️ Architecture & Implementation

The backend operates simultaneously as an **Express** web server and a **Socket.IO** real-time WebSocket messaging layer. It is responsible for routing real-time traffic between connected clients and persisting long-term drawing data into **MongoDB**.

### 1. The Real-Time Engine (Socket.IO)
Standard REST APIs operate on a Request-Response cycle, which is far too slow for real-time drawing where coordinates change every millisecond. Instead, we use `socket.io` to maintain a persistent, bi-directional, low-latency connection.
- **Room Management**: When a client connects, they emit a `join-room` event with an 8-character ID. The backend executes `socket.join(roomId)`. This ensures that drawing events (`draw-line`) are *only* broadcasted using `socket.to(roomId).emit(...)` rather than broadcasting to every single globally connected user.
- **Cursor multiplexing**: Every mouse movement is piped through the server and immediately fanned out to all other clients in the room to render remote user position pointers.

### 2. Database Persistence (MongoDB)
We use `mongoose` to define a schema and interact with a remote MongoDB Atlas cluster.
- **The Board Schema**: Contains arrays for `lines` (freehand drawing instances) and `texts` (string annotations).
- **Silent Saving**: When the server receives a `draw-line` or `draw-text` event, it does two things simultaneously:
  1. *Fires the event out* to the rest of the room.
  2. *Saves the exact payload* to MongoDB using `$push` on the specific Room's document.
- **Hydration**: When a user first connects to a room (or refreshes the page), the server executes a query to locate the Room document. If it exists, the server emits a `load-board-data` event straight to that singular client containing the entire history of strokes for the room, instantly recreating the board.

### 3. Express Configuration
- Utilizes the `cors` middleware to accept cross-origin requests from the React development server (`http://localhost:3000`).
- Loads secure credentials via the `dotenv` package.

## 🚀 Running Locally

Inside this directory:
1. Create a `.env` file containing your `PORT` (default 5001) and active `MONGODB_URI`.
2. `npm install`
3. `npm start` or `node server.js`
