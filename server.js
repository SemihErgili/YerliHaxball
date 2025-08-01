const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = {};

class HaxballGame {
  constructor() {
    this.players = {};
    this.ball = { x: 600, y: 300, vx: 0, vy: 0, radius: 12 };
    this.scores = { red: 0, blue: 0 };
    this.messages = [];
  }

  addPlayer(id, name) {
    const team = Object.keys(this.players).length % 2 === 0 ? 'red' : 'blue';
    const teamPlayers = Object.values(this.players).filter(p => p.team === team).length;
    
    this.players[id] = {
      id, name, 
      x: team === 'red' ? 150 : 1050, 
      y: 200 + (teamPlayers * 80), 
      radius: 18, team,
      input: { up: false, down: false, left: false, right: false, kick: false }
    };
    this.addMessage('system', `${name} joined!`, '#888');
    return this.players[id];
  }

  removePlayer(id) {
    if (this.players[id]) {
      this.addMessage('system', `${this.players[id].name} left!`, '#888');
      delete this.players[id];
    }
  }

  addMessage(playerId, text, color = '#fff') {
    const message = {
      id: Date.now() + Math.random(),
      playerId,
      playerName: playerId === 'system' ? 'System' : (this.players[playerId]?.name || 'Unknown'),
      text, color, timestamp: Date.now()
    };
    this.messages.push(message);
    if (this.messages.length > 50) this.messages.shift();
    return message;
  }

  resetPositions() {
    // Reset ball
    setTimeout(() => {
      this.ball = { x: 600, y: 300, vx: 0, vy: 0, radius: 12 };
    }, 2000);
    
    // Reset players to starting positions with spread
    const redPlayers = Object.values(this.players).filter(p => p.team === 'red');
    const bluePlayers = Object.values(this.players).filter(p => p.team === 'blue');
    
    redPlayers.forEach((player, index) => {
      player.x = 150;
      player.y = 200 + (index * 80); // Dikey olarak dağıt
    });
    
    bluePlayers.forEach((player, index) => {
      player.x = 1050;
      player.y = 200 + (index * 80); // Dikey olarak dağıt
    });
  }

  updatePlayerInput(id, input) {
    if (this.players[id]) {
      Object.assign(this.players[id].input, input);
    }
  }

  update() {
    Object.values(this.players).forEach(player => {
      let dx = 0, dy = 0;
      const speed = 8;
      if (player.input.up) dy -= speed;
      if (player.input.down) dy += speed;
      if (player.input.left) dx -= speed;
      if (player.input.right) dx += speed;

      player.x = Math.max(player.radius, Math.min(1200 - player.radius, player.x + dx));
      player.y = Math.max(player.radius, Math.min(600 - player.radius, player.y + dy));

      if (player.input.kick) {
        const dx = this.ball.x - player.x;
        const dy = this.ball.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 50) {
          this.ball.vx = (dx/dist) * 30;
          this.ball.vy = (dy/dist) * 30;
        }
        player.input.kick = false;
      }
    });

    // Ball physics
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    this.ball.vx *= 0.99;
    this.ball.vy *= 0.99;
    
    // Player-ball collision - basit çarpışma
    Object.values(this.players).forEach(player => {
      const dx = this.ball.x - player.x;
      const dy = this.ball.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < player.radius + this.ball.radius + 5) {
        const angle = Math.atan2(dy, dx);
        
        // Push ball away
        const pushForce = 8;
        this.ball.vx += Math.cos(angle) * pushForce;
        this.ball.vy += Math.sin(angle) * pushForce;
        
        // Player movement effect
        if (player.input.up) this.ball.vy -= 5;
        if (player.input.down) this.ball.vy += 5;
        if (player.input.left) this.ball.vx -= 5;
        if (player.input.right) this.ball.vx += 5;
        
        // Separate ball
        const overlap = player.radius + this.ball.radius - distance + 5;
        this.ball.x += Math.cos(angle) * overlap;
        this.ball.y += Math.sin(angle) * overlap;
      }
    });

    let goalScored = false;
    const goalTop = (600 - 150) / 2;
    const goalBottom = goalTop + 150;
    
    if (this.ball.x <= this.ball.radius) {
      if (this.ball.y >= goalTop && this.ball.y <= goalBottom) {
        this.scores.blue++;
        this.addMessage('system', `🔵 GOOOAL! Blue team scores! ${this.scores.red}-${this.scores.blue}`, '#3b82f6');
        this.resetPositions();
        goalScored = 'blue';
      } else {
        this.ball.x = this.ball.radius;
        this.ball.vx *= -0.8;
      }
    }
    
    if (this.ball.x >= 1200 - this.ball.radius) {
      if (this.ball.y >= goalTop && this.ball.y <= goalBottom) {
        this.scores.red++;
        this.addMessage('system', `🔴 GOOOAL! Red team scores! ${this.scores.red}-${this.scores.blue}`, '#ef4444');
        this.resetPositions();
        goalScored = 'red';
      } else {
        this.ball.x = 1200 - this.ball.radius;
        this.ball.vx *= -0.8;
      }
    }

    if (this.ball.y <= this.ball.radius) { 
      this.ball.y = this.ball.radius; 
      this.ball.vy *= -0.8; 
    }
    if (this.ball.y >= 600 - this.ball.radius) { 
      this.ball.y = 600 - this.ball.radius; 
      this.ball.vy *= -0.8; 
    }

    return { 
      players: this.players, 
      ball: this.ball, 
      scores: this.scores, 
      messages: this.messages,
      goalScored 
    };
  }
}

io.on('connection', (socket) => {
  const roomId = socket.handshake.query.roomId;
  if (!roomId) return;

  if (!rooms[roomId]) {
    rooms[roomId] = {
      game: new HaxballGame(),
      interval: setInterval(() => {
        const state = rooms[roomId].game.update();
        io.to(roomId).emit('gameState', state);
      }, 20)
    };
  }

  socket.join(roomId);

  socket.on('joinGame', (data) => {
    rooms[roomId].game.addPlayer(socket.id, data.name);
  });

  socket.on('playerInput', (input) => {
    rooms[roomId].game.updatePlayerInput(socket.id, input);
  });

  socket.on('chatMessage', (message) => {
    const player = rooms[roomId].game.players[socket.id];
    if (player) {
      const msg = rooms[roomId].game.addMessage(socket.id, message, player.team === 'red' ? '#ef4444' : '#3b82f6');
      io.to(roomId).emit('newMessage', msg);
    }
  });

  socket.on('disconnect', () => {
    rooms[roomId].game.removePlayer(socket.id);
    if (Object.keys(rooms[roomId].game.players).length === 0) {
      clearInterval(rooms[roomId].interval);
      delete rooms[roomId];
    }
  });
});

httpServer.listen(3001, () => {
  console.log('🏈 Online Haxball server running on port 3001');
});