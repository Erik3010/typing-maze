import { easeAnimation } from "./utility";

class Cell {
  constructor({ ctx, x, y, width, value, coordinate, word }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.value = value;

    this.coordinate = coordinate;
    this.word = word;

    this.color = this.value === 1 ? "#ffba00" : "#fff3d2";

    this.currentFrame = 0;
    this.step = 12;

    this.fontSize = 16;
  }
  draw() {
    this.drawCell();

    this.word && this.drawText();
  }
  drawText() {
    this.ctx.font = `${this.fontSize}px Arial`;
    this.ctx.fillStyle = "#000";

    const text = this.ctx.measureText(this.word);
    this.ctx.fillText(
      this.word,
      this.x + this.width / 2 - text.width / 2,
      this.y + this.width / 2 + this.fontSize / 2
    );
  }
  drawCell() {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = "#000";
    this.ctx.rect(this.x, this.y, this.width, this.width);
    this.ctx.stroke();
    this.ctx.fill();
    this.ctx.closePath();
  }
  async move({ x, y }) {
    await this.animate({
      x: this.x + x * this.width,
      y: this.y + y * this.width,
    });
  }
  async animate({ x, y }) {
    const distance = {
      x: x - this.x,
      y: y - this.y,
    };

    const start = { x: this.x, y: this.y };

    return new Promise((resolve) => {
      const animate = () => {
        if (this.currentFrame > this.step) {
          this.currentFrame = 0;
          return resolve();
        }

        this.x =
          start.x + easeAnimation(distance.x, this.currentFrame, this.step);
        this.y =
          start.y + easeAnimation(distance.y, this.currentFrame, this.step);

        this.currentFrame++;

        requestAnimationFrame(animate);
      };

      animate();
    });
  }
}

export default Cell;
