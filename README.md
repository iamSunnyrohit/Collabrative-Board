# 🎨 Collaborative Web Board

A real-time, multi-user digital whiteboard application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB**. 

This platform allows teams or friends to join private rooms and brainstorm together instantly on a live canvas.

![Whiteboard Application UI](./client/public/logo.png)

## 🚀 Features

- **Real-Time Collaboration**: See what others draw and exactly where their cursors are on the screen instantly, powered by Socket.IO.
- **Private Rooms**: Generate unique 8-character Room IDs on the landing page or securely join an existing session.
- **Canvas Persistence**: Your strokes and texts are automatically saved to MongoDB. If you accidentally refresh the page, your artwork will re-load exactly how you left it.
- **Advanced Toolbar**: 
  - Switch between Pen and Text placement tools.
  - Quick-select colors from a modern 6-swatch palette.
  - Define exact #RRGGBB custom colors.
  - Dynamically resize your drawing tools.
  - "Erase" specific strokes.
  - A local 10-state Undo Stack.
- **Export Magic**: Export your masterpiece as a `.png` file locally.

## 🛠️ Technology Stack

**Frontend Framework**: React.js with Canvas API
**Backend**: Node.js & Express.js
**Real-Time Engine**: Socket.IO
**Database**: MongoDB & Mongoose

## ⚙️ Installation & Setup

You will need two separate terminal windows to run both the Client and Server components locally.

### 1. Database Setup
Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or run a local instance of Mongo. Obtain your Connection URI.

### 2. Configure the Backend (Server)

1. Open a terminal and navigate to the `server` directory.
   ```bash
   cd server
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to create a live `.env`.
   ```bash
   cp .env.example .env
   ```
4. Paste your MongoDB URI inside your newly created `.env`:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_cluster_uri_here
   ```
5. Start the backend:
   ```bash
   node server.js
   ```

### 3. Configure the Frontend (Client)

1. Open a *new* terminal window and navigate to the `client` directory.
   ```bash
   cd client
   ```
2. Install frontend dependencies.
   ```bash
   npm install
   ```
3. Start the React development server.
   ```bash
   npm start
   ```

The application will automatically launch on `http://localhost:3000`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to modify the tools, add new ones (like shapes!), or increase the security of the application.
