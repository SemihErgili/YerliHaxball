import { Physics, Circle } from './physics';

export interface Player extends Circle {
  id: string;
  name: string;
  team: 'red' | 'blue';
  color: string;
  input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    kick: boolean;
  };
}

export interface Ball extends Circle {
  color: string;
}

export interface GameState {
  players: { [id: string]: Player };
  ball: Ball;
  scores: { red: number; blue: number };
  field: {
    width: number;
    height: number;
    goalWidth: number;
    goalDepth: number;
  };
}

export class GameEngine {
  private state: GameState;
  private readonly PLAYER_SPEED = 5;
  private readonly KICK_POWER = 15;
  private readonly FRICTION = 0.985;
  private readonly BALL_DAMPING = 0.95;

  constructor() {
    this.state = {
      players: {},
      ball: {
        x: 600,
        y: 300,
        radius: 12,
        vx: 0,
        vy: 0,
        mass: 1,
        color: '#ffffff'
      },
      scores: { red: 0, blue: 0 },
      field: {
        width: 1200,
        height: 600,
        goalWidth: 150,
        goalDepth: 30
      }
    };
  }

  addPlayer(id: string, name: string): Player {
    const team = Object.keys(this.state.players).length % 2 === 0 ? 'red' : 'blue';
    const startX = team === 'red' ? 200 : 1000;
    
    const player: Player = {
      id,
      name,
      x: startX,
      y: 300,
      radius: 18,
      vx: 0,
      vy: 0,
      mass: 1,
      team,
      color: team === 'red' ? '#ff4444' : '#4444ff',
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
        kick: false
      }
    };

    this.state.players[id] = player;
    return player;
  }

  removePlayer(id: string): void {
    delete this.state.players[id];
  }

  updatePlayerInput(id: string, input: Partial<Player['input']>): void {
    if (this.state.players[id]) {
      Object.assign(this.state.players[id].input, input);
    }
  }

  update(): GameState {
    // Update player positions
    Object.values(this.state.players).forEach(player => {
      let dx = 0;
      let dy = 0;

      if (player.input.up) dy -= this.PLAYER_SPEED;
      if (player.input.down) dy += this.PLAYER_SPEED;
      if (player.input.left) dx -= this.PLAYER_SPEED;
      if (player.input.right) dx += this.PLAYER_SPEED;

      player.x += dx;
      player.y += dy;

      // Keep player in bounds
      player.x = Math.max(player.radius, Math.min(this.state.field.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(this.state.field.height - player.radius, player.y));

      // Kick ball
      if (player.input.kick) {
        this.kickBall(player);
        player.input.kick = false; // Reset kick
      }
    });

    // Update ball physics
    this.state.ball.x += this.state.ball.vx!;
    this.state.ball.y += this.state.ball.vy!;

    // Apply friction to ball
    Physics.applyFriction(this.state.ball, this.FRICTION);

    // Ball wall collisions
    this.handleBallWallCollisions();

    // Player-ball collisions
    Object.values(this.state.players).forEach(player => {
      if (Physics.circleCollision(player, this.state.ball)) {
        Physics.resolveCircleCollision(player, this.state.ball);
      }
    });

    // Player-player collisions
    const players = Object.values(this.state.players);
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        if (Physics.circleCollision(players[i], players[j])) {
          Physics.resolveCircleCollision(players[i], players[j]);
        }
      }
    }

    return this.state;
  }

  private kickBall(player: Player): void {
    const distance = Physics.distance(player, this.state.ball);
    if (distance < player.radius + this.state.ball.radius + 10) {
      const dx = this.state.ball.x - player.x;
      const dy = this.state.ball.y - player.y;
      const angle = Math.atan2(dy, dx);
      
      this.state.ball.vx = Math.cos(angle) * this.KICK_POWER;
      this.state.ball.vy = Math.sin(angle) * this.KICK_POWER;
    }
  }

  private handleBallWallCollisions(): void {
    const { ball, field, scores } = this.state;
    const goalTop = (field.height - field.goalWidth) / 2;
    const goalBottom = goalTop + field.goalWidth;

    // Left goal
    if (ball.x - ball.radius <= 0) {
      if (ball.y >= goalTop && ball.y <= goalBottom) {
        // Goal scored by blue team
        this.state.scores.blue++;
        this.resetBall();
        return;
      } else {
        ball.x = ball.radius;
        ball.vx! *= -this.BALL_DAMPING;
      }
    }

    // Right goal
    if (ball.x + ball.radius >= field.width) {
      if (ball.y >= goalTop && ball.y <= goalBottom) {
        // Goal scored by red team
        this.state.scores.red++;
        this.resetBall();
        return;
      } else {
        ball.x = field.width - ball.radius;
        ball.vx! *= -this.BALL_DAMPING;
      }
    }

    // Top and bottom walls
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy! *= -this.BALL_DAMPING;
    }
    if (ball.y + ball.radius >= field.height) {
      ball.y = field.height - ball.radius;
      ball.vy! *= -this.BALL_DAMPING;
    }
  }

  private resetBall(): void {
    this.state.ball.x = this.state.field.width / 2;
    this.state.ball.y = this.state.field.height / 2;
    this.state.ball.vx = 0;
    this.state.ball.vy = 0;
  }

  getState(): GameState {
    return this.state;
  }
}