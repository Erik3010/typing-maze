import { easeAnimation } from "./utility";
import { WALL } from "./constants";

class Cell {
  constructor({ ctx, x, y, width, value, coordinate, word, isFinishCell }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.value = value;

    this.coordinate = coordinate;
    this.word = word;

    this.color = this.value === WALL ? "#ffba00" : "#fff3d2";

    this.currentFrame = 0;
    this.step = 12;

    this.fontSize = 16;

    this.isFinishCell = isFinishCell;
    this.finishFlagImage = null;

    if (this.isFinishCell) {
      this.finishFlagImage = new Image();
      this.finishFlagImage.src = "./assets/finish-flag.png";
    }
  }
  draw() {
    this.drawCell();

    this.isFinishCell && this.drawFinishFlag();
    this.word && this.drawText();
  }
  drawFinishFlag() {
    const width = this.finishFlagImage.width / 2;
    const height = this.finishFlagImage.height / 2;

    this.ctx.drawImage(
      this.finishFlagImage,
      this.x + this.width / 2 - width / 2,
      this.y + this.width / 2 - height / 2,
      width,
      height
    );
  }
  drawTextBg(textWidth) {
    const padding = 3;

    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.rect(
      this.x + this.width / 2 - textWidth / 2 - padding,
      this.y + this.width / 2 - this.fontSize / 2,
      textWidth + padding * 2,
      this.fontSize + padding
    );
    this.ctx.fill();
    this.ctx.closePath();
  }
  drawText() {
    this.ctx.font = `${this.fontSize}px Arial`;

    const text = this.ctx.measureText(this.word);
    this.drawTextBg(text.width);

    this.ctx.fillStyle = "#fff";
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
