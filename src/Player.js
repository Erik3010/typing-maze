import { easeAnimation } from "./utility";

class Player {
  constructor({ ctx, x, y, width, position }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;

    this.position = position;

    this.width = width;

    this.distanceToCenter = { x: 0, y: 0 };

    this.currentFrame = 0;
    this.step = 12;
  }
  get isCenterX() {
    return this.distanceToCenter.x === 0;
  }
  get isCenterY() {
    return this.distanceToCenter.y === 0;
  }
  get isCenter() {
    return this.isCenterX && this.isCenterY;
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.fillStyle = "#ff0000";
    this.ctx.fillRect(this.position.x, this.position.y, this.width, this.width);
    this.ctx.closePath();
  }
  async move({ x, y }, position) {
    if (position) {
      await this.animate({
        x: this.position.x + position.x,
        y: this.position.y + position.y,
      });

      this.distanceToCenter.x += position.x;
      this.distanceToCenter.y += position.y;
    }

    this.x += x;
    this.y += y;

    // this[axis] += direction;
  }
  async animate({ x: targetX, y: targetY }) {
    const distance = {
      x: targetX - this.position.x,
      y: targetY - this.position.y,
    };

    const start = { x: this.position.x, y: this.position.y };

    return new Promise((resolve) => {
      const animate = () => {
        if (this.currentFrame > this.step) {
          this.currentFrame = 0;
          return resolve();
        }

        this.position.x =
          start.x + easeAnimation(distance.x, this.currentFrame, this.step);
        this.position.y =
          start.y + easeAnimation(distance.y, this.currentFrame, this.step);

        this.currentFrame++;

        requestAnimationFrame(animate);
      };

      animate();
    });
  }
}

export default Player;
