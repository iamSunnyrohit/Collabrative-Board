# Collaborative Whiteboard - Client (Frontend)

This directory contains the React-based frontend for the Collaborative Whiteboard application.

## 🏗️ Architecture & Implementation

The frontend is a Single Page Application (SPA) built using **React**. It is responsible for rendering the UI, managing the local drawing state, capturing user inputs, and communicating with the backend over WebSockets.

### 1. Canvas Rendering (HTML5)
We utilize the native HTML5 `<canvas>` element rather than a heavy third-party drawing library. 
- The canvas context (`getContext('2d')`) is exposed and controlled via a React `useRef`.
- We implement DPI scaling (`canvas.width = window.innerWidth * 2`) to ensure that lines drawn on high-resolution Retina displays remain crisp rather than blurry.
- A dynamic window `resize` event listener dynamically creates a temporary canvas to cache the current drawing state, resizes the main canvas window, and then repaints the cached image so that drawings are not lost when the user adjusts their browser size.

### 2. State Management
React's `useState` hooks are utilized to track:
- Active Tools (Pen, Eraser, Text).
- Stroke characteristics (Color hex codes, Line thickness).
- The `roomId` the user is currently authenticated within.
- Other active user cursors (`{ [userId]: {x, y} }`).

### 3. Real-Time Socket Interfacing
The `socket.io-client` dependency connects to our backend server on mount.
- **Emitting**: Whenever the user draws a stroke (`onMouseMove`), drops text, or moves their mouse, an event (`draw-line`, `draw-text`, `mouse-move`) is broadcasted to the server containing the exact `x/y` coordinates and color selections.
- **Listening**: The component actively listens for real-time broadcasts from other users. When a remote `draw-line` event fires, the local canvas immediately executes a `context.stroke()` at those remote coordinates, creating the illusion of synchronized multi-player drawing.

### 4. Advanced Drawing Features
- **Dynamic Brush Stroke**: The `drawLine` function calculates the Euclidean distance between the previous coordinate and the current coordinate to determine the "speed" of the mouse. The line thickness dynamically scales inversely to speed, providing a natural, calligraphy-style brush effect.
- **True Eraser**: Employs the `destination-out` global composite operation to genuinely delete pixels from the canvas buffer, rather than simply painting white lines over the background.
- **Local Undo Cache**: Every time a discrete drawing action is finished (`onMouseUp`), the canvas is exported as a Base64 data URI (`toDataURL`) and pushed to an array. Pressing the Undo button replaces the current canvas view with the previous Base64 snapshot and commands the server to clear and redraw all remote clients.

## 🚀 Running Locally

Inside this directory:
1. `npm install`
2. `npm start` (Runs on `http://localhost:3000` by default)
