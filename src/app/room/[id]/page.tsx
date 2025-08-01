"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  team: 'red' | 'blue';
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  color: string;
  timestamp: number;
}

interface GameState {
  players: { [id: string]: Player };
  ball: Ball;
  scores: { red: number; blue: number };
  messages: Message[];
  lastGoal?: { team: string; scorer: string } | null;
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const roomCode = resolvedParams.id;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const keysPressed = useRef<{[key: string]: boolean}>({});
  const myPlayerIdRef = useRef<string>('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    ball: { x: 600, y: 300, vx: 0, vy: 0, radius: 12 },
    scores: { red: 0, blue: 0 },
    messages: []
  });
  const [connected, setConnected] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showGoalEffect, setShowGoalEffect] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('Player');
  
  // Get user name from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('web-arena-user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setPlayerName(user.username || user.name || 'Player');
      }
    } catch (e) {
      setPlayerName('Player');
    }
  }, []);

  const FIELD_WIDTH = 1200;
  const FIELD_HEIGHT = 600;
  const GOAL_SIZE = 150;

  // Sound effects
  const playSound = (type: 'kick' | 'goal' | 'join') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'kick':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        break;
      case 'goal':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        break;
      case 'join':
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        break;
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Socket connection
  useEffect(() => {
    const socket = io(process.env.NODE_ENV === 'production' ? 'https://your-app.vercel.app' : 'http://localhost:3001', {
      query: { roomId: roomCode }
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      myPlayerIdRef.current = socket.id;
      playSound('join');
      socket.emit('joinGame', { name: playerName });
    });

    socket.on('gameState', (state: any) => {
      if (state.goalScored && !showGoalEffect) {
        setShowGoalEffect(state.goalScored);
        playSound('goal');
        setTimeout(() => setShowGoalEffect(null), 3000);
      }
      setGameState(state);
    });

    socket.on('newMessage', (message: Message) => {
      setGameState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }));
    });

    return () => socket.disconnect();
  }, [roomCode, showGoalEffect]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target === chatInputRef.current) return;
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      
      if (key === ' ') {
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target === chatInputRef.current) return;
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };
    
    // Focus olaylarında tuşları sıfırla
    const handleBlur = () => {
      keysPressed.current = {};
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleBlur);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleBlur);
    }
  }, []);

  // Input loop
  useEffect(() => {
    if (!connected) return;

    const inputLoop = () => {
      if (!socketRef.current) return;
      
      const input = {
        up: !!(keysPressed.current['w'] || keysPressed.current['arrowup']),
        down: !!(keysPressed.current['s'] || keysPressed.current['arrowdown']),
        left: !!(keysPressed.current['a'] || keysPressed.current['arrowleft']),
        right: !!(keysPressed.current['d'] || keysPressed.current['arrowright']),
        kick: !!keysPressed.current[' ']
      };

      socketRef.current.emit('playerInput', input);
    };

    const interval = setInterval(inputLoop, 20);
    return () => clearInterval(interval);
  }, [connected]);

  // Chat functions
  const sendMessage = () => {
    if (chatMessage.trim() && socketRef.current) {
      socketRef.current.emit('chatMessage', chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
      
      // Field markings
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      
      // Border
      ctx.strokeRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
      
      // Center line
      ctx.beginPath();
      ctx.moveTo(FIELD_WIDTH/2, 0);
      ctx.lineTo(FIELD_WIDTH/2, FIELD_HEIGHT);
      ctx.stroke();
      
      // Center circle
      ctx.beginPath();
      ctx.arc(FIELD_WIDTH/2, FIELD_HEIGHT/2, 100, 0, Math.PI * 2);
      ctx.stroke();
      
      // Goals
      const goalTop = (FIELD_HEIGHT - GOAL_SIZE) / 2;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-10, goalTop, 40, GOAL_SIZE);
      ctx.fillRect(FIELD_WIDTH - 30, goalTop, 40, GOAL_SIZE);
      
      ctx.strokeStyle = 'white';
      ctx.strokeRect(0, goalTop, 30, GOAL_SIZE);
      ctx.strokeRect(FIELD_WIDTH - 30, goalTop, 30, GOAL_SIZE);
      
      // Players
      Object.values(gameState.players).forEach(player => {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(player.x + 3, player.y + 3, player.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Player - takım rengine göre
        if (player.team === 'red') {
          ctx.fillStyle = player.id === myPlayerIdRef.current ? '#dc2626' : '#ef4444';
        } else {
          ctx.fillStyle = player.id === myPlayerIdRef.current ? '#1d4ed8' : '#3b82f6';
        }
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(player.name, player.x, player.y - 25);
        ctx.fillText(player.name, player.x, player.y - 25);
      });
      
      // Ball - her zaman render et
      const ball = gameState.ball || { x: 600, y: 300, radius: 12 };
      
      // Ball shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Ball pattern
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      
      // Ball lines
      ctx.beginPath();
      ctx.moveTo(ball.x - ball.radius * 0.7, ball.y);
      ctx.lineTo(ball.x + ball.radius * 0.7, ball.y);
      ctx.moveTo(ball.x, ball.y - ball.radius * 0.7);
      ctx.lineTo(ball.x, ball.y + ball.radius * 0.7);
      ctx.stroke();
      
      requestAnimationFrame(render);
    };
    
    render();
  }, [gameState]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <div className="text-3xl font-bold">Connecting to Haxball...</div>
          <div className="text-lg mt-2">Room: {roomCode}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">⚽ Haxball - Room: {roomCode}</h1>
            <div className="flex gap-6 text-xl font-bold">
              <span className="text-red-400">🔴 {gameState.scores.red}</span>
              <span className="text-blue-400">🔵 {gameState.scores.blue}</span>
            </div>
            <button 
              onClick={() => router.push('/lobby')}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Leave
            </button>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 flex justify-center items-center p-4 relative">
          <canvas
            ref={canvasRef}
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            className="border-4 border-white rounded-lg shadow-2xl"
          />
          
          {/* Goal Effect */}
          {showGoalEffect && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-8xl font-bold animate-bounce ${
                showGoalEffect === 'red' ? 'text-red-500' : 'text-blue-500'
              }`}>
                ⚽ GOAL! ⚽
              </div>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="p-3 bg-gray-800 border-t border-gray-700 text-center text-sm">
          <span>🎮 WASD/Arrows: Move | ⚽ SPACE: Kick | 💬 Chat on the right</span>
        </div>
      </div>
      
      {/* Chat Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-bold">💬 Chat</h3>
          <div className="text-sm text-gray-400">Players: {Object.keys(gameState.players).length}</div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {gameState.messages.map(msg => (
            <div key={msg.id} className="text-sm">
              <span className="font-bold" style={{ color: msg.color }}>
                {msg.playerName}:
              </span>
              <span className="ml-2">{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              ref={chatInputRef}
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleChatKeyPress}
              placeholder="Type message..."
              className="flex-1 px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
              maxLength={100}
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}