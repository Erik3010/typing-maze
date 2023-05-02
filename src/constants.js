export const WALL = 1;

export const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

export const DIAGONAL_DIRECTIONS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

export const DIRECTIONS_WITH_DIAGONAL = [...DIRECTIONS, ...DIAGONAL_DIRECTIONS];
