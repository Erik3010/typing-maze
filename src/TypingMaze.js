import Player from "./Player";
import Cell from "./Cell";
import { getWords, padString, radianToDegree, random } from "./utility";
import { DIRECTIONS, DIRECTIONS_WITH_DIAGONAL, WALL } from "./constants";
import Arrow from "./Arrow";

class TypingMaze {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.path = 0;

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

    this.wordsMap = Array.from({ length: this.maps.length }, () =>
      Array(this.maps[0].length).fill(null)
    );
    this.availableWords = [];

    this.currentTypingValue = "";

    this.arrow = null;
    this.finishCoordinate = {
      x: this.playerInitialPosition.x + 3,
      y: this.playerInitialPosition.y - 1,
    };

    this.start = null;
    this.timer = null;
    this.timerInterval = null;

    this.isDevMode = true;
  }
  async init() {
    console.log("init");

    const { x, y } = this.playerInitialPosition;
    this.player = new Player({
      ctx: this.ctx,
      x: x,
      y: y,
      position: this.centerPoint,
      width: this.cellSize,
    });

    this.arrow = new Arrow({
      ctx: this.ctx,
      x: this.canvas.width - 100,
      y: this.canvas.height - 100,
    });

    this.availableWords = await getWords();
    this.initWordsMap();

    this.initTimer();

    this.setViewBox();
    this.listener();
    this.render();

    this.changeArrow();
  }
  initTimer() {
    this.start = Date.now();

    const runTimer = () => {
      const date = Date.now();
      this.timer = Math.floor((date - this.start) / 1000);

      this.timerInterval = setTimeout(runTimer, 1000);
    };

    runTimer();
  }
  initWordsMap() {
    const hasSameWordArounds = ({ x, y }, word) => {
      for (const [dirX, dirY] of DIRECTIONS_WITH_DIAGONAL) {
        const { x: nextX, y: nextY } = { x: x + dirX, y: y + dirY };
        if (!this.isValidCoordinate({ x: nextX, y: nextY })) continue;
        if (this.wordsMap[nextY][nextX] === word) return true;
      }
      return false;
    };

    for (const [rowIndex, row] of this.wordsMap.entries()) {
      for (const [colIndex, col] of row.entries()) {
        if (this.maps[rowIndex][colIndex] === WALL) continue;

        let word;
        do {
          word = this.availableWords[random(0, this.availableWords.length - 1)];
        } while (hasSameWordArounds({ x: colIndex, y: rowIndex }, word));
        this.wordsMap[rowIndex][colIndex] = word;
      }
    }
  }
  setViewBox() {
    const startX = (this.canvas.width - this.cellSize) / 2;
    const startY = (this.canvas.height - this.cellSize) / 2;

    this.viewBox.x = startX;
    this.viewBox.y = startY;

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
    window.addEventListener("keydown", async (event) => {
      const alphabet = [...Array(26)].map((_, i) =>
        String.fromCharCode(i + "a".charCodeAt())
      );
      const key = event.key.toLowerCase();

      if (alphabet.indexOf(key) !== -1) {
        this.currentTypingValue += key;
      } else {
        if (key === " ") {
          for (const [dirX, dirY] of DIRECTIONS) {
            const { x: nextX, y: nextY } = {
              x: this.player.x + dirX,
              y: this.player.y + dirY,
            };
            if (!this.isValidCoordinate({ x: nextX, y: nextY })) continue;

            if (this.wordsMap[nextY][nextX] === this.currentTypingValue) {
              this.currentTypingValue = "";

              await this.handlePlayerMovement({ x: dirX, y: dirY });
            }
          }
        } else if (key === "backspace") {
          if (event.ctrlKey) {
            this.currentTypingValue = "";
          } else {
            const value = this.currentTypingValue;
            this.currentTypingValue = value.substring(0, value.length - 1);
          }
        }
      }

      if (this.isDevMode) {
        const eventMap = {
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
        };
        if (!Object.keys(eventMap).includes(event.code) || this.isAnimating)
          return;

        await this.handlePlayerMovement(eventMap[event.code]);
      }
    });
  }
  async handlePlayerMovement(direction) {
    if (this.isAnimating) return;

    const { x: dirX, y: dirY } = direction;
    const needChangePosition = this.needChangePlayerPosition(direction);

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

    animationQueue.push(this.player.move(direction, position));
    if (!needChangePosition) {
      animationQueue.push(this.moveViewBoxMap(direction));
    }

    await Promise.all(animationQueue);
    this.isAnimating = false;

    this.changeArrow();

    this.isGameFinish && this.showGameFinish();
  }
  changeArrow() {
    const { x: endX, y: endY } = this.finishCoordinate;
    const { x, y } = this.player;

    // const angle = Math.atan2(Math.sign(endY - y), Math.sign(endX - x));
    const angleRadian = Math.atan2(endY - y, endX - x);
    let angleDegree = radianToDegree(angleRadian);
    if (angleDegree < 0) {
      angleDegree += 360;
    }

    // this.arrow.animateRotate(radianToDegree(angleRadian) + 90);
    this.arrow.animateRotate((angleDegree + 90) % 360);
  }
  showGameFinish() {
    clearTimeout(this.timerInterval);

    const { minute, second } = this.formattedTimer;
    const time = `${padString(minute.toString())}:${padString(
      second.toString()
    )}`;

    alert(`Game finish! Time: ${time}`);

    window.location.reload();
  }
  draw() {
    this.drawMap();
    this.player.draw();
    this.arrow.draw();

    this.drawTimer();

    this.player.text = this.currentTypingValue;
  }
  drawTimer() {
    const { minute, second } = this.formattedTimer;

    const timerString =
      padString(minute.toString()) + ":" + padString(second.toString());

    this.ctx.save();
    this.ctx.font = "32px Arial";

    const { width } = this.ctx.measureText(timerString);

    this.ctx.fillStyle = "#000";
    this.ctx.fillText(timerString, canvas.width / 2 - width / 2, 60);
    this.ctx.restore();
  }
  initViewBoxMap() {
    const { x: centerX, y: centerY } = this.centerPoint;
    const blockToRender = this.blockToRender;

    for (let y = 0; y < blockToRender.y * 2 + 1; y++) {
      const row = [];
      const nextY = this.player.y - (blockToRender.y - y);
      for (let x = 0; x < blockToRender.x * 2 + 1; x++) {
        const nextX = this.player.x - (blockToRender.x - x);
        const cell = this.createCell({
          x: centerX + (x - blockToRender.x) * this.cellSize,
          y: centerY + (y - blockToRender.y) * this.cellSize,
          value: this.maps[nextY][nextX],
          coordinate: { x: nextX, y: nextY },
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

          const nextX = this.blockToRender.x - x;
          const dX = this.player.x + exceedTolerance - nextX;
          const cell = this.createCell({
            x:
              centerX +
              (x - blockToRender.x) * this.cellSize -
              this.overflowedView.x,
            y: centerY + blockToRender.y * this.cellSize * targetY,
            value: this.maps[nextY][dX],
            coordinate: { x: dX, y: nextY },
          });

          row.push(cell);
        }
        this.extenderCells.push(row);
      }

      for (let x = 0; x < blockToRender.x * 2 + 1; x++) {
        if (targetX !== 0 && !this.extenderCells.length) {
          const row = [];
          const nextX = this.player.x + blockToRender.x * targetX;
          for (let tempY = 0; tempY < blockToRender.y * 2 + 1; tempY++) {
            const distance = this.player.distanceToCenter.y;
            const exceedTolerance =
              Math.ceil(Math.abs(distance / this.cellSize)) *
              Math.sign(distance) *
              -1;

            const dY =
              this.player.y + exceedTolerance - (blockToRender.y - tempY);

            const cell = this.createCell({
              x: centerX + blockToRender.x * targetX * this.cellSize,
              y:
                centerY +
                (tempY - blockToRender.y) * this.cellSize -
                this.overflowedView.y,
              value: this.maps[dY][nextX],
              coordinate: { x: nextX, y: dY },
            });
            row.push(cell);
          }
          this.extenderCells.push(row);
        }

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
  createCell({ x, y, value, coordinate }) {
    return new Cell({
      x,
      y,
      value,
      coordinate,
      ctx: this.ctx,
      width: this.cellSize,
      word: this.wordsMap[coordinate.y][coordinate.x],
      isFinishCell: Object.keys(coordinate).every(
        (key) => coordinate[key] === this.finishCoordinate[key]
      ),
    });
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
    //     this.ctx.fillStyle = col === WALL ? "#ffba00" : "#fff3d2";
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
  isValidCoordinate({ x, y }) {
    return x >= 0 && x < this.maps[0].length && y >= 0 && y < this.maps.length;
  }
  get isGameFinish() {
    return Object.keys(this.finishCoordinate).every(
      (key) => this.finishCoordinate[key] === this.player[key]
    );
  }
  get formattedTimer() {
    return {
      minute: Math.floor(this.timer / 60),
      second: this.timer % 60,
    };
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
