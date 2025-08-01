import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as IOServer } from 'socket.io';

export type PlayerPosition = {
  x: number;
  y: number;
};

export type PlayerData = {
  id: string;
  position: PlayerPosition;
  team: 'red' | 'blue';
  isAdmin: boolean;
  name: string;
};

export type BallData = {
  position: PlayerPosition;
  velocity: { x: number; y: number };
};

export type GameState = 'waiting' | 'playing' | 'paused' | 'goal';

export type GameRoom = {
  players: Record<string, PlayerData>;
  ball: BallData;
  scores: { red: number; blue: number };
  state: GameState;
  countdown: number;
};

const rooms: Record<string, GameRoom> = {};

const createRoom = (roomId: string): GameRoom => ({
  players: {},
  ball: {
    position: { x: 400, y: 210 },
    velocity: { x: 0, y: 0 },
  },
  scores: { red: 0, blue: 0 },
  state: 'waiting',
  countdown: 0,
});

const getOrCreateRoom = (roomId: string): GameRoom => {
  if (!rooms[roomId]) {
    rooms[roomId] = createRoom(roomId);
  }
  return rooms[roomId];
};

export const initSocket = (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any).server.io) {
    const httpServer: HTTPServer = (res.socket as any).server;
    const io = new Server(httpServer, {
      path: '/api/socketio',
      // @ts-ignore
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      const roomId = socket.handshake.query.roomId as string;
      if (!roomId) {
        socket.disconnect();
        return;
      }

      const room = getOrCreateRoom(roomId);
      socket.join(roomId);

      // Send current room state to the new player
      socket.emit('gameState', room);

      // Handle player updates
      socket.on('playerUpdate', (playerData: PlayerData) => {
        if (!room.players[socket.id]) return;
        room.players[socket.id] = { ...room.players[socket.id], ...playerData };
        socket.to(roomId).emit('playerUpdate', { id: socket.id, ...playerData });
      });

      // Handle ball updates
      socket.on('ballUpdate', (ballData: BallData) => {
        room.ball = ballData;
        socket.to(roomId).emit('ballUpdate', ballData);
      });

      // Handle score updates
      socket.on('scoreUpdate', (scores: { red: number; blue: number }) => {
        room.scores = scores;
        socket.to(roomId).emit('scoreUpdate', scores);
      });

      // Handle game state changes
      socket.on('gameStateChange', (state: GameState) => {
        room.state = state;
        io.to(roomId).emit('gameStateChange', state);
      });

      // Handle countdown updates
      socket.on('countdownUpdate', (countdown: number) => {
        room.countdown = countdown;
        io.to(roomId).emit('countdownUpdate', countdown);
      });

      // Handle player disconnect
      socket.on('disconnect', () => {
        if (room.players[socket.id]) {
          delete room.players[socket.id];
          io.to(roomId).emit('playerLeft', socket.id);
          
          // If no players left, clean up the room after a delay
          if (Object.keys(room.players).length === 0) {
            setTimeout(() => {
              if (Object.keys(room.players).length === 0) {
                delete rooms[roomId];
              }
            }, 300000); // 5 minutes
          }
        }
      });

      // Add new player to the room
      socket.on('joinGame', (playerData: Omit<PlayerData, 'id' | 'isAdmin'>) => {
        const isFirstPlayer = Object.keys(room.players).length === 0;
        
        room.players[socket.id] = {
          ...playerData,
          id: socket.id,
          isAdmin: isFirstPlayer, // First player is admin
        };

        // Notify all players about the new player
        io.to(roomId).emit('playerJoined', room.players[socket.id]);
        
        // If this is the first player, start the game
        if (isFirstPlayer) {
          room.state = 'waiting';
          io.to(roomId).emit('gameStateChange', 'waiting');
        }
      });
    });

    (res.socket as any).server.io = io;
  }

  res.end();
};

export default initSocket;
