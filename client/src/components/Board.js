import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Board.css';

const socket = io('http://localhost:5001');

const Board = ({ roomId, onLeave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursors, setCursors] = useState({});
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const contextRef = useRef(null);
  
  // Preset Colors
  const PRESET_COLORS = ['#000000', '#ff3366', '#33ccff', '#33cc33', '#ffcc00', '#9933cc'];
  
  // Undo Stack
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => {
    socket.emit('join-room', roomId);
    const canvas = canvasRef.current;
    
    // Using a 2x scale to ensure high-DPI clarity
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 5;
    contextRef.current = context;

    // Listen for socket events from other users
    socket.on('draw-line', (data) => {
      const { x0, y0, x1, y1, color, size, isErase } = data;
      drawLine(x0, y0, x1, y1, color, size, false, isErase);
    });

    socket.on('draw-text', (data) => {
      const { text, x, y, color, size } = data;
      drawText(text, x, y, color, size, false);
    });
    
    socket.on('clear-canvas', () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('mouse-move', (data) => {
      setCursors(prev => ({ ...prev, [data.id]: data }));
    });

    socket.on('user-disconnected', (id) => {
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[id];
        return newCursors;
      });
    });

    // Listen for initial board data on connect
    socket.on('load-board-data', (data) => {
      if (data.lines) {
        data.lines.forEach((line) => {
          drawLine(line.x0, line.y0, line.x1, line.y1, line.color, line.size, false, line.isErase);
        });
      }
      if (data.texts) {
        data.texts.forEach((textItem) => {
          drawText(textItem.text, textItem.x, textItem.y, textItem.color, textItem.size, false);
        });
      }
      
      // Save initial loaded state to Undo Stack
      const canvas = canvasRef.current;
      setUndoStack([canvas.toDataURL()]);
    });

    // Handle window resize dynamically while keeping canvas content
    const handleResize = () => {
        // Safe check for canvas dimensions, save previous content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        
        const newCtx = canvas.getContext('2d');
        newCtx.scale(2, 2);
        newCtx.lineCap = 'round';
        newCtx.lineJoin = 'round';
        newCtx.strokeStyle = 'black';
        newCtx.lineWidth = 5;
        contextRef.current = newCtx;

        newCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width / 2, tempCanvas.height / 2);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      socket.off('draw-line');
      socket.off('draw-text');
      socket.off('clear-canvas');
      socket.off('mouse-move');
      socket.off('user-disconnected');
      socket.off('load-board-data');
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const drawLine = (x0, y0, x1, y1, color, size, emit, isErase = false) => {
    if (!contextRef.current) return;
    const context = contextRef.current;
    
    // Make line width inversely proportional to speed (distance) for a dynamic brush effect
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let dynamicSize = emit ? Math.max(2, 10 - distance / 5) : size; 

    context.save();
    if (isErase) {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = dynamicSize * 2 || size * 2; // Eraser is slightly bigger
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = color || 'black';
      context.lineWidth = dynamicSize || size;
    }

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
    context.closePath();
    context.restore();

    if (!emit) return;
    
    // Broadcast the draw event
    socket.emit('draw-line', {
      x0, y0, x1, y1, color, size: dynamicSize, isErase
    });
  };

  const drawText = (text, x, y, fontColor, fontSize, emit) => {
    if (!contextRef.current) return;
    const context = contextRef.current;
    
    context.save();
    context.font = `${fontSize * 4}px Inter, sans-serif`;
    context.fillStyle = fontColor || 'black';
    context.fillText(text, x, y);
    context.restore();

    if (!emit) return;
    
    socket.emit('draw-text', { text, x, y, color: fontColor, size: fontSize });
  };

  const currentPos = useRef({ x: 0, y: 0 });

  const startDrawing = ({ nativeEvent }) => {
    const { clientX, clientY } = nativeEvent;
    
    if (tool === 'text') {
      const textToDraw = prompt('Enter your text:');
      if (textToDraw) {
        drawText(textToDraw, clientX, clientY, color, size, true);
        saveState();
      }
      return;
    }
    
    currentPos.current = { x: clientX, y: clientY };
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (isDrawing) {
      saveState();
    }
    setIsDrawing(false);
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setUndoStack(prev => [...prev.slice(-10), dataUrl]); // Keep only last 10 states
    }
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    
    const newStack = [...undoStack];
    newStack.pop(); // Remove current state
    const previousState = newStack[newStack.length - 1];
    
    setUndoStack(newStack);

    // Broadcast clear to room so everyone sees the undo (sync logic can be complex, so for now we just clear and redraw the image locally, and clear remotely)
    socket.emit('clear-canvas');
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      // scale coordinates to match high DPI
      context.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
  };

  const draw = ({ nativeEvent }) => {
    const { clientX, clientY } = nativeEvent;
    
    // Broadcast own cursor
    socket.emit('mouse-move', { x: clientX, y: clientY });

    if (!isDrawing) return;
    
    drawLine(
        currentPos.current.x,
        currentPos.current.y,
        clientX,
        clientY,
        color,
        size,
        true,
        tool === 'eraser'
    );
    
    currentPos.current = { x: clientX, y: clientY };
  };

  const exportToImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link element to trigger the download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert(`Room ID ${roomId} copied to clipboard!`);
  };

  const handleCustomColorChange = (e) => {
    setColor(e.target.value);
  };

  return (
    <div className="board-container">
      <div className="toolbar">
        <h2>Whiteboard</h2>
        <div className="tool-controls">
          <select value={tool} onChange={(e) => setTool(e.target.value)} className="tool-select">
            <option value="pen">Pen</option>
            <option value="eraser">Eraser</option>
            <option value="text">Text</option>
          </select>
          <div className={`color-palette ${tool === 'eraser' ? 'disabled' : ''}`}>
            {PRESET_COLORS.map(preset => (
              <button
                key={preset}
                className={`color-swatch ${color === preset ? 'active' : ''}`}
                style={{ backgroundColor: preset }}
                onClick={() => setColor(preset)}
                disabled={tool === 'eraser'}
              />
            ))}
            {/* Custom Color Toggle */}
            <button 
              className={`custom-color-wrapper ${!PRESET_COLORS.includes(color) && !showCustomColor ? 'active' : ''}`}
              onClick={() => setShowCustomColor(!showCustomColor)}
              title="Enter Custom Hex Color"
              disabled={tool === 'eraser'}
            >
              {!PRESET_COLORS.includes(color) && !showCustomColor && (
                <div className="current-random-dot" style={{ backgroundColor: color }}></div>
              )}
            </button>
          </div>
          
          {showCustomColor && (
            <div className="custom-hex-input">
              <input 
                type="text" 
                value={color} 
                onChange={handleCustomColorChange} 
                className="hex-input"
                placeholder="#RRGGBB"
              />
              <button className="confirm-color-btn" onClick={() => setShowCustomColor(false)}>OK</button>
            </div>
          )}

          <input 
            type="range" 
            min="1" 
            max="20" 
            value={size} 
            onChange={(e) => setSize(parseInt(e.target.value))} 
            className="size-slider"
            title="Brush Size"
          />
          <button 
            className="undo-btn" 
            onClick={handleUndo} 
            disabled={undoStack.length <= 1}
            title="Undo"
          >
            ↩️ Undo
          </button>
        </div>
        <div className="room-info">
          <span>Room: {roomId}</span>
          <button className="copy-btn" onClick={copyRoomId} title="Copy Room ID">
            📋
          </button>
        </div>
        <button className="export-btn" onClick={exportToImage}>
          Export to Image
        </button>
        <button className="leave-btn" onClick={onLeave} title="Logout / Leave Room">
          Leave Room
        </button>
      </div>
      <canvas
        className="canvas"
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseOut={finishDrawing}
        onMouseMove={draw}
      />
      
      {/* Render other users' cursors */}
      {Object.values(cursors).map(cursor => (
        <div 
          key={cursor.id} 
          className="user-cursor"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <div className="cursor-pointer"></div>
          <div className="cursor-label">User {cursor.id.slice(0, 4)}</div>
        </div>
      ))}
    </div>
  );
};

export default Board;
