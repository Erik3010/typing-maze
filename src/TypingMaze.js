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
  needChangePlayerPosition({ x: dirX, y: dirY }) {
    const nextX = this.player.x + dirX + this.blockToRender.x * dirX;
    const nextY = this.player.y + dirY + this.blockToRender.y * dirY;

    const isXAxisExceed = nextX < 0 || nextX > this.maps[0].length - 1;
    const isYAxisExceed = nextY < 0 || nextY > this.maps.length - 1;

    return (
      (isYAxisExceed && dirY !== 0) ||
      (!this.player.isCenterY && dirY !== 0) ||
      (isXAxisExceed && dirX !== 0) ||
      (!this.player.isCenterX && dirX !== 0)
    );
  }
  async handleMapOverflow({ axis, dir, expandCb, collapseCb }) {
    const isStartMapExceed =
      this.player[axis] + dir - this.blockToRender[axis] < 0;
    const isEndMapExceed =
      this.player[axis] + dir + this.blockToRender[axis] >=
      (axis === "y" ? this.maps.length : this.maps[0].length);

    const position = { x: 0, y: 0 };

    const overflowed = this.overflowedView[axis];
    const remainder = this.getViewBoxRemainder[axis];

    // start boundary
    const shouldExpandStartMap = dir === -1 && isStartMapExceed && !overflowed;
    const shouldCollapseStartMap =
      dir === 1 && !isStartMapExceed && overflowed < 0;

    // end boundary
    const shouldExpandEndMap = dir === 1 && isEndMapExceed && !overflowed;
    const shouldCollapseEndMap =
      dir === -1 && !isEndMapExceed && overflowed > 0;

    if (shouldExpandStartMap || shouldExpandEndMap) {
      this.overflowedView[axis] += remainder * dir;
      expandCb();
      await this.moveMapOverflow({
        ...position,
        [axis]: this.overflowedView[axis],
      });
    } else if (shouldCollapseStartMap || shouldCollapseEndMap) {
      collapseCb();
      await Promise.all([
        this.moveMapOverflow({
          ...position,
          [axis]: this.overflowedView[axis] * -1,
        }),
        this.player.animateMovement({ ...position, [axis]: remainder * dir }),
      ]);
      this.overflowedView[axis] = 0;
    }
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

      const keyCode = eventMap[event.code];
      const { x: dirX, y: dirY } = keyCode;
      const needChangePosition = this.needChangePlayerPosition(keyCode);

      let position = null;
      if (needChangePosition) {
        position = { x: this.cellSize * dirX, y: this.cellSize * dirY };
      }

      this.isAnimating = true;
      const animationQueue = [];

      animationQueue.push(
        this.handleMapOverflow({
          axis: "y",
          dir: dirY,
          expandCb: () => (position.y -= this.overflowedView.y),
          collapseCb: () => (position = null),
        })
      );

      animationQueue.push(
        this.handleMapOverflow({
          axis: "x",
          dir: dirX,
          expandCb: () => (position.x -= this.overflowedView.x),
          collapseCb: () => (position = null),
        })
      );

      animationQueue.push(this.player.move(keyCode, position));
      if (!needChangePosition) {
        animationQueue.push(this.moveViewBoxMap(keyCode));
      }

      await Promise.all(animationQueue);
      this.isAnimating = false;
    });
  }
  draw() {
    this.drawMap();
    this.player.draw();
  }
  initViewBoxMap() {
    const { x: centerX, y: centerY } = this.centerPoint;
    const blockToRender = this.blockToRender;

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

    console.log(this.cells.map((row) => row.map((cell) => cell.value)));
    console.log(JSON.parse(JSON.stringify(this.cells)));
  }
  async moveViewBoxMap({ x: targetX, y: targetY }) {
    const animationQueue = [];

    const { x: centerX, y: centerY } = this.centerPoint;
    const blockToRender = this.blockToRender;

    for (let y = 0; y < blockToRender.y * 2 + 1; y++) {
      const nextY = this.player.y + this.blockToRender.y * targetY;
      if (targetY !== 0 && !this.extenderCells.length) {
        const row = [];
        for (let x = 0; x < blockToRender.x * 2 + 1; x++) {
          const distance = this.player.distanceToCenter.x;
          const exceedTolerance =
            Math.ceil(Math.abs(distance / this.cellSize)) *
            Math.sign(distance) *
            -1;
          // const exceedTolerance =
          //   (this.player.distanceToCenter.x / this.cellSize) * -1;

          const nextX = this.blockToRender.x - x;
          const dX = this.player.x + exceedTolerance - nextX;
          const cell = new Cell({
            ctx: this.ctx,
            x:
              centerX +
              (x - blockToRender.x) * this.cellSize -
              this.overflowedView.x,
            y: centerY + blockToRender.y * this.cellSize * targetY,
            width: this.cellSize,
            value: this.maps[nextY][dX],
            color: this.maps[nextY][dX] === this.wall ? "#ffba00" : "#fff3d2",
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
            // either ceil or floor
            // ceil for upper, floor for lower
            // const exceedTolerance = Math.ceil(
            //   (this.player.distanceToCenter.y / this.cellSize) * -1
            // );

            const distance = this.player.distanceToCenter.y;
            const exceedTolerance =
              Math.ceil(Math.abs(distance / this.cellSize)) *
              Math.sign(distance) *
              -1;

            const dY =
              this.player.y + exceedTolerance - (blockToRender.y - tempY);

            const cell = new Cell({
              ctx: this.ctx,
              x: centerX + blockToRender.x * targetX * this.cellSize,
              y:
                centerY +
                (tempY - blockToRender.y) * this.cellSize -
                this.overflowedView.y,
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

    this.extenderCells = [];
  }
  async moveMapOverflow({ x, y }) {
    const animationQueue = [];

    for (const row of this.cells) {
      for (const cell of row) {
        animationQueue.push(
          cell.move({
            x: (x * -1) / this.cellSize,
            y: (y * -1) / this.cellSize,
          })
        );
      }
    }

    await Promise.all(animationQueue);
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
