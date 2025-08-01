import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { BallData, GameState, PlayerData } from '@/lib/socket';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';

export const useSocket = (roomId: string, playerName: string, team: 'red' | 'blue') => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerData>>({});
  const [ball, setBall] = useState<BallData>({
    position: { x: 400, y: 210 },
    velocity: { x: 0, y: 0 },
  });
  const [scores, setScores] = useState({ red: 0, blue: 0 });
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [countdown, setCountdown] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_SERVER_URL, {
      query: { roomId },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      
      // Join the game with player info
      socketInstance.emit('joinGame', {
        name: playerName,
        team,
        position: { x: team === 'red' ? 200 : 600, y: 210 },
      });
    });

    socketInstance.on('gameState', (state: any) => {
      setPlayers(state.players || {});
      setBall(state.ball || { position: { x: 400, y: 210 }, velocity: { x: 0, y: 0 } });
      setScores(state.scores || { red: 0, blue: 0 });
      setGameState(state.state || 'waiting');
      setCountdown(state.countdown || 0);
    });

    socketInstance.on('playerJoined', (player: PlayerData) => {
      setPlayers(prev => ({
        ...prev,
        [player.id]: player,
      }));
    });

    socketInstance.on('playerLeft', (playerId: string) => {
      setPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[playerId];
        return newPlayers;
      });
    });

    socketInstance.on('playerUpdate', (playerData: PlayerData) => {
      setPlayers(prev => ({
        ...prev,
        [playerData.id]: {
          ...prev[playerData.id],
          ...playerData,
        },
      }));
    });

    socketInstance.on('ballUpdate', (ballData: BallData) => {
      setBall(ballData);
    });

    socketInstance.on('scoreUpdate', (newScores: { red: number; blue: number }) => {
      setScores(newScores);
    });

    socketInstance.on('gameStateChange', (state: GameState) => {
      setGameState(state);
    });

    socketInstance.on('countdownUpdate', (countdown: number) => {
      setCountdown(countdown);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    socketInstance.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Helper functions to emit events
  const updatePlayer = (data: Partial<PlayerData>) => {
    if (socketRef.current) {
      socketRef.current.emit('playerUpdate', data);
    }
  };

  const updateBall = (ballData: BallData) => {
    if (socketRef.current) {
      socketRef.current.emit('ballUpdate', ballData);
    }
  };

  const updateScores = (scores: { red: number; blue: number }) => {
    if (socketRef.current) {
      socketRef.current.emit('scoreUpdate', scores);
    }
  };

  const changeGameState = (state: GameState) => {
    if (socketRef.current) {
      socketRef.current.emit('gameStateChange', state);
    }
  };

  const updateCountdown = (countdown: number) => {
    if (socketRef.current) {
      socketRef.current.emit('countdownUpdate', countdown);
    }
  };

  const changeTeam = (newTeam: 'red' | 'blue') => {
    if (socketRef.current) {
      socketRef.current.emit('changeTeam', { team: newTeam });
    }
  };

  return {
    socket,
    players,
    ball,
    scores,
    gameState,
    countdown,
    updatePlayer,
    updateBall,
    updateScores,
    changeGameState,
    updateCountdown,
    changeTeam,
  };
};
