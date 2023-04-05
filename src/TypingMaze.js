import Player from "./Player";

class TypingMaze {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.path = 0;
    this.wall = 1;

    this.maps = [
      [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1],
      [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    ];
    // this.cellSize = this.canvas.width / this.maps[0].length;
    this.cellSize = 100;
    this.cellPadding = 5;

    this.viewBox = {
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height,
    };

    this.playerInitialPosition = {
      x: Math.floor(this.maps[0].length / 2),
      y: Math.floor(this.maps.length / 2),
    };

    this.player = null;
  }
  init() {
    console.log("init");

    const { x, y } = this.playerInitialPosition;
    this.player = new Player({
      ctx: this.ctx,
      x: x,
      y: y,
      width: this.cellSize,
    });
    this.setViewBox();

    this.listener();

    this.render();
  }
  setViewBox() {
    const { x, y } = this.player;
    const position = {
      x: x * this.cellSize,
      y: y * this.cellSize,
    };

    const startX = (this.canvas.width - this.cellSize) / 2;
    const startY = (this.canvas.height - this.cellSize) / 2;

    this.viewBox.x = startX;
    this.viewBox.y = startY;

    console.log(this.viewBox);
  }
  listener() {
    const eventMap = {
      ArrowUp: { axis: "y", direction: -1 },
      ArrowDown: { axis: "y", direction: 1 },
      ArrowLeft: { axis: "x", direction: -1 },
      ArrowRight: { axis: "x", direction: 1 },
    };
    window.addEventListener("keydown", (event) => {
      if (!Object.keys(eventMap).includes(event.code)) return;
      this.player.move(eventMap[event.code]);
    });
  }
  draw() {
    this.drawMap();
    this.player.draw();
  }
  drawMap() {
    for (const [y, row] of this.maps.entries()) {
      for (const [x, col] of row.entries()) {
        this.ctx.beginPath();
        this.ctx.fillStyle = col === this.wall ? "#ffba00" : "#fff3d2";
        this.ctx.strokeStyle = "#000";

        this.ctx.rect(
          x * this.cellSize,
          y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.closePath();
      }
    }
  }
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    requestAnimationFrame(this.render.bind(this));
    this.draw();
  }
}

export default TypingMaze;
