import { NextApiRequest, NextApiResponse } from 'next';

const rooms: any = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (!rooms[roomId as string]) {
    rooms[roomId as string] = {
      players: {},
      ball: { x: 600, y: 300, vx: 0, vy: 0, radius: 12 },
      scores: { red: 0, blue: 0 },
      messages: []
    };
  }

  const room = rooms[roomId as string];

  if (method === 'GET') {
    res.json(room);
  } else if (method === 'POST') {
    const { action, data } = req.body;
    
    switch (action) {
      case 'join':
        const team = Object.keys(room.players).length % 2 === 0 ? 'red' : 'blue';
        room.players[data.playerId] = {
          id: data.playerId,
          name: data.name,
          x: team === 'red' ? 150 : 1050,
          y: 300,
          radius: 18,
          team
        };
        break;

      case 'update':
        if (room.players[data.playerId]) {
          Object.assign(room.players[data.playerId], data.player);
        }
        if (data.ball) {
          room.ball = data.ball;
        }
        if (data.scores) {
          room.scores = data.scores;
        }
        break;

      case 'chat':
        room.messages.push({
          id: Date.now(),
          playerId: data.playerId,
          playerName: data.playerName,
          text: data.text,
          color: data.color,
          timestamp: Date.now()
        });
        break;
    }
    
    res.json(room);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}