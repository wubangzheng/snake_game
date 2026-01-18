
import { Difficulty, Point } from './types';

export const GRID_SIZE = 20;
export const CELL_SIZE = 25; // pixels

export const OBSTACLES: Record<Difficulty, Point[]> = {
  [Difficulty.EASY]: [],
  [Difficulty.MEDIUM]: [
    { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
    { x: 14, y: 5 }, { x: 14, y: 6 }, { x: 13, y: 5 },
    { x: 5, y: 14 }, { x: 5, y: 13 }, { x: 6, y: 14 },
    { x: 14, y: 14 }, { x: 14, y: 13 }, { x: 13, y: 14 },
  ],
  [Difficulty.HARD]: [
    { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 2 },
    { x: 17, y: 2 }, { x: 17, y: 3 }, { x: 16, y: 2 },
    { x: 2, y: 17 }, { x: 2, y: 16 }, { x: 3, y: 17 },
    { x: 17, y: 17 }, { x: 17, y: 16 }, { x: 16, y: 17 },
    // Center cross
    { x: 10, y: 7 }, { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 },
    { x: 7, y: 10 }, { x: 8, y: 10 }, { x: 9, y: 10 }, { x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 },
  ]
};

export const BASE_SPEEDS = [
  250, // Level 1 (Slowest)
  200,
  150,
  110,
  80   // Level 5 (Fastest)
];
