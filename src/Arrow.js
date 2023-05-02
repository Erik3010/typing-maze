class Arrow {
  constructor({ ctx, x, y }) {
    this.ctx = ctx;

    this.x = x;
    this.y = y;

    this.scale = 4;

    this.imageUrl = "./assets/arrow.png";

    this.image = new Image();
    this.image.src = this.imageUrl;
  }
  draw() {
    this.ctx.drawImage(
      this.image,
      this.x,
      this.y,
      this.image.width / this.scale,
      this.image.height / this.scale
    );
  }
}

export default Arrow;
