
export interface UserProfile {
  username: string;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  team: 'red' | 'blue';
  position: {
    x: number;
    y: number;
  };
  isUser?: boolean;
  isAdmin?: boolean;
  kicking?: boolean;
}

export interface Ball {
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  timestamp: number;
}

export type GameState = 'playing' | 'paused' | 'goal';
