export interface Vector2D {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
  vx?: number;
  vy?: number;
  mass?: number;
}

export class Physics {
  static distance(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(vector: Vector2D): Vector2D {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  static circleCollision(a: Circle, b: Circle): boolean {
    return this.distance(a, b) < (a.radius + b.radius);
  }

  static resolveCircleCollision(a: Circle, b: Circle): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < a.radius + b.radius) {
      const overlap = a.radius + b.radius - distance;
      const separationX = (dx / distance) * overlap * 0.5;
      const separationY = (dy / distance) * overlap * 0.5;
      
      a.x -= separationX;
      a.y -= separationY;
      b.x += separationX;
      b.y += separationY;
      
      // Velocity exchange
      if (a.vx !== undefined && a.vy !== undefined && b.vx !== undefined && b.vy !== undefined) {
        const normalX = dx / distance;
        const normalY = dy / distance;
        
        const relativeVelocityX = a.vx - b.vx;
        const relativeVelocityY = a.vy - b.vy;
        
        const speed = relativeVelocityX * normalX + relativeVelocityY * normalY;
        
        if (speed < 0) return;
        
        const impulse = 2 * speed / ((a.mass || 1) + (b.mass || 1));
        
        a.vx -= impulse * (b.mass || 1) * normalX;
        a.vy -= impulse * (b.mass || 1) * normalY;
        b.vx += impulse * (a.mass || 1) * normalX;
        b.vy += impulse * (a.mass || 1) * normalY;
      }
    }
  }

  static wallBounce(circle: Circle, width: number, height: number, damping: number = 0.8): void {
    if (circle.x - circle.radius < 0) {
      circle.x = circle.radius;
      if (circle.vx) circle.vx *= -damping;
    }
    if (circle.x + circle.radius > width) {
      circle.x = width - circle.radius;
      if (circle.vx) circle.vx *= -damping;
    }
    if (circle.y - circle.radius < 0) {
      circle.y = circle.radius;
      if (circle.vy) circle.vy *= -damping;
    }
    if (circle.y + circle.radius > height) {
      circle.y = height - circle.radius;
      if (circle.vy) circle.vy *= -damping;
    }
  }

  static applyFriction(circle: Circle, friction: number = 0.99): void {
    if (circle.vx) circle.vx *= friction;
    if (circle.vy) circle.vy *= friction;
  }
}