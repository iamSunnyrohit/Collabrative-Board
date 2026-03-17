import React, { useState } from 'react';
import './App.css';
import Board from './components/Board';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [joinError, setJoinError] = useState('');

  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 8); // Generate a short 8-char room ID
    setRoomId(newRoomId);
    setIsJoined(true);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim() === '') {
      setJoinError('Please enter a valid Room ID.');
      return;
    }
    setIsJoined(true);
  };

  const leaveRoom = () => {
    setIsJoined(false);
    setRoomId('');
    setJoinError('');
  };

  if (isJoined) {
    return (
      <div className="App">
        <Board roomId={roomId} onLeave={leaveRoom} />
      </div>
    );
  }

  return (
    <div className="App landing-page">
      <div className="landing-card">
        <h1>Collaborative Whiteboard</h1>
        <p>Create a new room to start drawing or join an existing one.</p>
        
        <div className="admin-section">
          <button className="create-btn" onClick={createRoom}>
            Create New Room
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <form className="join-section" onSubmit={joinRoom}>
          <input 
            type="text" 
            placeholder="Enter Room ID" 
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
              setJoinError('');
            }}
          />
          <button type="submit" className="join-btn">Join Room</button>
        </form>
        {joinError && <p className="error-text">{joinError}</p>}
      </div>
    </div>
  );
}

export default App;
