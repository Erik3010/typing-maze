class Player {
  constructor({ ctx, x, y, width }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;

    this.width = width;
  }
  draw() {
    // this.ctx.beginPath();
    // this.ctx.fillStyle = "#ff0000";
    // this.ctx.fillRect(
    //   this.x * this.width,
    //   this.y * this.width,
    //   this.width,
    //   this.width
    // );
    // this.ctx.closePath();
  }
  move({ x, y }) {
    this.x += x;
    this.y += y;
    // this[axis] += direction;
  }
}

export default Player;
