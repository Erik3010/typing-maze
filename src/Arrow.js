import { degreeToRadian, easeAnimation } from "./utility";

class Arrow {
  constructor({ ctx, x, y }) {
    this.ctx = ctx;

    this.x = x;
    this.y = y;

    this.scale = 4;

    this.imageUrl = "./assets/arrow.png";

    this.image = new Image();
    this.image.src = this.imageUrl;

    this.angle = 0;

    this.currentFrame = 0;
    this.step = 15;
  }
  draw() {
    const width = this.image.width / this.scale;
    const height = this.image.height / this.scale;

    this.ctx.save();
    this.ctx.translate(width / 2 + this.x, height / 2 + this.y);
    this.ctx.rotate(degreeToRadian(this.angle));
    this.ctx.drawImage(this.image, -width / 2, -height / 2, width, height);
    this.ctx.restore();
  }
  animateRotate(angle) {
    const distance = angle - this.angle;
    const startAngle = this.angle;

    return new Promise((resolve) => {
      const animate = () => {
        if (this.currentFrame > this.step) {
          this.currentFrame = 0;
          return resolve();
        }

        this.angle =
          startAngle + easeAnimation(distance, this.currentFrame, this.step);

        this.currentFrame++;
        requestAnimationFrame(animate);
      };

      animate();
    });
  }
}

export default Arrow;
