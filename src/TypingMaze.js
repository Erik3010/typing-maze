import Player from "./Player";
import Cell from "./Cell";

class TypingMaze {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.path = 0;
    this.wall = 1;

    this.maps = [
      [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
    this.cells = [];
    this.extenderCells = [];
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

    this.isAnimating = false;

    this.overflowedView = { x: 0, y: 0 };
  }
  init() {
    console.log("init");

    const { x, y } = this.playerInitialPosition;
    this.player = new Player({
      ctx: this.ctx,
      x: x,
      y: y,
      position: this.centerPoint,
      width: this.cellSize,
    });
    this.setViewBox();

    this.listener();

    this.render();
  }
  setViewBox() {
    const startX = (this.canvas.width - this.cellSize) / 2;
    const startY = (this.canvas.height - this.cellSize) / 2;

    this.viewBox.x = startX;
    this.viewBox.y = startY;

    console.log(this.viewBox);
    this.initViewBoxMap();
  }
  listener() {
    const eventMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    window.addEventListener("keydown", async (event) => {
      if (!Object.keys(eventMap).includes(event.code) || this.isAnimating)
        return;

      const { x: dirX, y: dirY } = eventMap[event.code];
      const nextX = this.player.x + dirX + this.blockToRender.x * dirX;
      const nextY = this.player.y + dirY + this.blockToRender.y * dirY;
      // console.log(nextY);

      const isYAxisExceed = nextY < 0 || nextY > this.maps.length - 1;
      const isXAxisExceed = nextX < 0 || nextX > this.maps[0].length - 1;

      // const needChangePosition =
      //   isYAxisExceed || isXAxisExceed || !this.player.isCenter;
      let position = null;
      const needChangePosition =
        (isYAxisExceed && dirY !== 0) ||
        (!this.player.isCenterY && dirY !== 0) ||
        (isXAxisExceed && dirX !== 0) ||
        (!this.player.isCenterX && dirX !== 0);

      if (needChangePosition) {
        position = { x: this.cellSize * dirX, y: this.cellSize * dirY };
      }

      if (
        needChangePosition &&
        dirY !== 0 &&
        Math.abs(this.overflowedView.y) !== this.getViewBoxRemainder.y
      ) {
        this.overflowedView.y += this.getViewBoxRemainder.y * dirY;
        // this.moveMapOverflow();
        console.log(this.overflowedView.y);
      }

      if (!needChangePosition && dirY !== 0 && this.overflowedView.y) {
        this.overflowedView.y = 0;
        // this.moveMapOverflow();
      }

      // if (
      //   this.getViewBoxRemainder.y &&
      //   isYAxisExceed &&
      //   dirY !== 0 &&
      //   this.overflowedView.y !== this.getViewBoxRemainder.y * dirY * -1
      // ) {
      //   console.log("-----");
      //   console.log("before: ", this.overflowedView.y);
      //   this.overflowedView.y += this.getViewBoxRemainder.y * dirY * -1;
      //   console.log("after: ", this.overflowedView.y);
      //   console.log("-----");

      //   // this.player.centerCoordinate += this.getViewBoxRemainder.y * dirY;
      //   // // console.log(this.player, this.player.centerCoordinate);
      //   // position.y += this.getViewBoxRemainder.y * dirY * -1;
      //   // await this.moveMapOverflow();
      //   // // console.log(this.cellSize * dirY, this.getViewBoxRemainder.y * dirY);
      //   // // console.log(this.overflowedView);
      //   // // this.moveMapOverflow();
      // }

      // if (!needChangePosition && this.overflowedView.y && dirY !== 0) {
      //   await this.moveMapOverflow(true);
      //   this.player.centerCoordinate += this.getViewBoxRemainder.y * dirY;
      //   this.overflowedView.y += this.getViewBoxRemainder.y * dirY;

      //   await this.player.animate({
      //     x: this.player.position.x,
      //     y: this.player.position.y + this.getViewBoxRemainder.y * dirY * -1,
      //   });
      // }

      this.isAnimating = true;

      await this.player.move(eventMap[event.code], position);
      if (!needChangePosition) {
        // if (this.overflowedView.y && dirY !== 0) {
        //   this.player.centerCoordinate +=
        //     this.getViewBoxRemainder.y * dirY * -1;
        //   await this.moveMapOverflow(true);
        //   await this.player.animate({
        //     x: this.player.position.x,
        //     y: this.player.position.y + this.getViewBoxRemainder.y * dirY * -1,
        //   });
        //   this.overflowedView.y += this.getViewBoxRemainder.y * dirY;
        //   // this.player.position.y += this.getViewBoxRemainder.y * dirY * -1;
        // }
        await this.moveViewBoxMap(eventMap[event.code]);
      }

      // console.log(this.overflowedView, this.player.centerCoordinate);

      this.isAnimating = false;
      // console.log(this.player.distanceToCenter);
      // console.log(this.player.isCenterY, this.player.distanceToCenter.y);

      // console.log(JSON.parse(JSON.stringify(this.cells)));
    });
  }
  draw() {
    this.drawMap();
    this.player.draw();
  }
  initViewBoxMap() {
    const { x: centerX, y: centerY } = this.centerPoint;
    const blockToRender = this.blockToRender;

    // this.cells = [];
    // const data = [];
    // for (let y = blockToRender.y * 2 + 1; y > 0; y--) {
    //   const row = [];
    //   const prevY = this.player.y - (blockToRender.y - y) - 1;

    //   if (prevY < 0 || prevY > this.maps.length - 1) continue;
    //   for (let x = blockToRender.x * 2 + 1; x > 0; x--) {
    //     const prevX = this.player.x - (blockToRender.x - x) - 1;
    //     if (prevX < 0 || prevX > this.maps[0].length - 1) continue;

    //     const col = new Cell({
    //       ctx: this.ctx,
    //       width: this.cellSize,
    //       x: centerX - this.cellSize * (blockToRender.x - x + 1),
    //       y: centerY - this.cellSize * (blockToRender.y - y + 1),
    //       value: this.maps[prevY][prevX],
    //       color: this.maps[prevY][prevX] === this.wall ? "#ffba00" : "#fff3d2",
    //     });
    //     row.push(col);
    //   }
    //   this.cells.push(row);
    //   data.push(row);
    // }

    for (let y = 0; y < blockToRender.y * 2 + 1; y++) {
      const row = [];
      const nextY = this.player.y - (blockToRender.y - y);
      for (let x = 0; x < blockToRender.x * 2 + 1; x++) {
        const nextX = this.player.x - (blockToRender.x - x);
        const cell = new Cell({
          ctx: this.ctx,
          width: this.cellSize,
          x: centerX + (x - blockToRender.x) * this.cellSize,
          y: centerY + (y - blockToRender.y) * this.cellSize,
          value: this.maps[nextY][nextX],
          color: this.maps[nextY][nextX] === this.wall ? "#ffba00" : "#fff3d2",
        });

        row.push(cell);
      }
      this.cells.push(row);
    }

    // console.log(this.cells);
    console.log(this.cells.map((row) => row.map((cell) => cell.value)));
    console.log(JSON.parse(JSON.stringify(this.cells)));
    // console.log(data);
  }
  async moveViewBoxMap({ x: targetX, y: targetY }) {
    // this.isAnimating = true;
    let skipRender = false;

    const animationQueue = [];

    const { x: centerX, y: centerY } = this.centerPoint;
    const blockToRender = this.blockToRender;

    for (let y = 0; y < blockToRender.y * 2 + 1; y++) {
      const nextY = this.player.y + this.blockToRender.y * targetY;
      if (targetY !== 0 && !this.extenderCells.length) {
        const row = [];
        for (let x = 0; x < blockToRender.x * 2 + 1; x++) {
          const exceedTolerance =
            (this.player.distanceToCenter.x / this.cellSize) * -1;
          const nextX = this.blockToRender.x - x;
          const cell = new Cell({
            ctx: this.ctx,
            x: centerX + (x - blockToRender.x) * this.cellSize,
            y: centerY + blockToRender.y * this.cellSize * targetY,
            width: this.cellSize,
            value: this.maps[nextY][this.player.x + exceedTolerance - nextX],
            color:
              this.maps[nextY][this.player.x + exceedTolerance - nextX] ===
              this.wall
                ? "#ffba00"
                : "#fff3d2",
          });

          row.push(cell);
        }
        this.extenderCells.push(row);
      }

      for (let x = 0; x < blockToRender.x * 2 + 1; x++) {
        if (targetX !== 0 && !this.extenderCells.length) {
          const row = [];
          // const nextX = this.player.x + (this.blockToRender.x - x) * targetX;
          const nextX = this.player.x + blockToRender.x * targetX;

          for (let tempY = 0; tempY < blockToRender.y * 2 + 1; tempY++) {
            const exceedTolerance =
              (this.player.distanceToCenter.y / this.cellSize) * -1;
            // console.log(exceedTolerance);
            const dY =
              this.player.y + exceedTolerance - (blockToRender.y - tempY);

            const cell = new Cell({
              ctx: this.ctx,
              x: centerX + blockToRender.x * targetX * this.cellSize,
              y: centerY + (tempY - blockToRender.y) * this.cellSize,
              width: this.cellSize,
              value: this.maps[dY][nextX],
              color: this.maps[dY][nextX] === this.wall ? "#ffba00" : "#fff3d2",
            });
            row.push(cell);
          }
          this.extenderCells.push(row);
        }

        // this.cells[y][x].move({ x: targetX * -1, y: targetY * -1 });
        animationQueue.push(
          this.cells[y][x].move({ x: targetX * -1, y: targetY * -1 })
        );
      }
    }

    await Promise.all(animationQueue);
    // this.isAnimating = false;

    if (targetY !== 0) {
      if (targetY === 1) {
        this.cells.shift();
        this.cells.push(...this.extenderCells);
      } else {
        this.cells.pop();
        this.cells.unshift(...this.extenderCells);
      }
    } else if (targetX !== 0) {
      for (const [index, row] of this.cells.entries()) {
        if (targetX === 1) {
          row.shift();
          row.push(this.extenderCells[0][index]);
        } else {
          row.pop();
          row.unshift(this.extenderCells[0][index]);
        }
      }
    }

    // console.log(JSON.parse(JSON.stringify(this.extenderCells)));

    // console.log(this.cells.map((row) => row.map((cell) => cell.value)));
    // console.log(JSON.parse(JSON.stringify(this.cells)));
    this.extenderCells = [];
  }
  async moveMapOverflow(isRevert = false) {
    const animationQueue = [];
    // console.log(this.overflowedView.y * (isRevert ? -1 : 1) * -1);

    for (const row of this.cells) {
      for (const cell of row) {
        animationQueue.push(
          cell.move({
            x: (this.overflowedView.x * -1) / this.cellSize,
            y: (this.overflowedView.y * -1) / this.cellSize,
          })
        );
      }
    }

    await Promise.all(animationQueue);

    // console.log(this.overflowedView);
  }
  drawMap() {
    for (const row of this.extenderCells) {
      for (const cell of row) {
        cell.draw();
      }
    }

    for (const row of this.cells) {
      for (const cell of row) {
        cell.draw();
      }
    }

    // const { x: centerX, y: centerY } = this.centerPoint;
    // this.ctx.fillStyle = "#ff0000";
    // this.ctx.fillRect(centerX, centerY, this.cellSize, this.cellSize);

    // for (const [y, row] of this.maps.entries()) {
    //   for (const [x, col] of row.entries()) {
    //     this.ctx.beginPath();
    //     this.ctx.fillStyle = col === this.wall ? "#ffba00" : "#fff3d2";
    //     this.ctx.strokeStyle = "#000";
    //     this.ctx.rect(
    //       x * this.cellSize,
    //       y * this.cellSize,
    //       this.cellSize,
    //       this.cellSize
    //     );
    //     this.ctx.stroke();
    //     this.ctx.fill();
    //     this.ctx.closePath();
    //   }
    // }
  }
  get centerPoint() {
    return {
      x: this.canvas.width / 2 - this.cellSize / 2,
      y: this.canvas.height / 2 - this.cellSize / 2,
    };
  }
  get blockToRender() {
    return {
      x: Math.ceil(this.viewBox.x / this.cellSize),
      y: Math.ceil(this.viewBox.y / this.cellSize),
    };
  }
  get getViewBoxRemainder() {
    return {
      x:
        this.viewBox.x % this.cellSize
          ? this.cellSize - (this.viewBox.x % this.cellSize)
          : 0,
      y:
        this.viewBox.y % this.cellSize
          ? this.cellSize - (this.viewBox.x % this.cellSize)
          : 0,
    };
  }
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    requestAnimationFrame(this.render.bind(this));
    this.draw();
  }
}

export default TypingMaze;
