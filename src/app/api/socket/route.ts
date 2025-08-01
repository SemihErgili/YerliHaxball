import { NextRequest } from 'next/server';
import { Server } from 'socket.io';

const rooms: any = {};

class HaxballGame {
  players: any = {};
  ball = { x: 600, y: 300, vx: 0, vy: 0, radius: 12 };
  scores = { red: 0, blue: 0 };
  messages: any[] = [];

  addPlayer(id: string, name: string) {
    const team = Object.keys(this.players).length % 2 === 0 ? 'red' : 'blue';
    this.players[id] = {
      id, name, x: team === 'red' ? 200 : 1000, y: 300, radius: 18, team,
      input: { up: false, down: false, left: false, right: false, kick: false }
    };
    return this.players[id];
  }

  removePlayer(id: string) {
    delete this.players[id];
  }

  updatePlayerInput(id: string, input: any) {
    if (this.players[id]) {
      Object.assign(this.players[id].input, input);
    }
  }

  update() {
    Object.values(this.players).forEach((player: any) => {
      let dx = 0, dy = 0;
      if (player.input.up) dy -= 5;
      if (player.input.down) dy += 5;
      if (player.input.left) dx -= 5;
      if (player.input.right) dx += 5;

      player.x = Math.max(18, Math.min(1182, player.x + dx));
      player.y = Math.max(18, Math.min(582, player.y + dy));

      if (player.input.kick) {
        const dx = this.ball.x - player.x;
        const dy = this.ball.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 30) {
          this.ball.vx = (dx/dist) * 18;
          this.ball.vy = (dy/dist) * 18;
        }
        player.input.kick = false;
      }
    });

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    this.ball.vx *= 0.985;
    this.ball.vy *= 0.985;

    // Goals
    if (this.ball.x <= 12 && this.ball.y > 225 && this.ball.y < 375) {
      this.scores.blue++;
      this.ball = { x: 600, y: 300, vx: 0, vy: 0, radius: 12 };
    }
    if (this.ball.x >= 1188 && this.ball.y > 225 && this.ball.y < 375) {
      this.scores.red++;
      this.ball = { x: 600, y: 300, vx: 0, vy: 0, radius: 12 };
    }

    // Walls
    if (this.ball.x <= 12) { this.ball.x = 12; this.ball.vx *= -0.8; }
    if (this.ball.x >= 1188) { this.ball.x = 1188; this.ball.vx *= -0.8; }
    if (this.ball.y <= 12) { this.ball.y = 12; this.ball.vy *= -0.8; }
    if (this.ball.y >= 588) { this.ball.y = 588; this.ball.vy *= -0.8; }

    return { players: this.players, ball: this.ball, scores: this.scores, messages: this.messages };
  }
}

export async function GET() {
  return Response.json({ message: 'Socket server ready' });
}

export async function POST() {
  return Response.json({ message: 'Socket server ready' });
}