export const MAIN_GRID_COLS = 7;
export const GRID_COLS = 9;
export const GRID_ROWS = 4;
export const CELL_W = 96;
export const CELL_H = 110;
export const GRID_X = 128;
export const GRID_Y = 130;

export const EXT_COL_COUNT = 2;
export const EXT_VALID_ROWS: number[] = [1, 2];

export const HUD_HEIGHT = 70;
export const CONTROL_HEIGHT = 80;

export const PATH_WAYPOINTS: Array<{ x: number; y: number }> = [
  { x: 1100, y: 240 },
  { x: 1015, y: 240 },
  { x: 1015, y: 100 },
  { x: 85,   y: 100 },
  { x: 85,   y: 605 },
  { x: 1015, y: 605 },
  { x: 1015, y: 460 },
  { x: 1100, y: 460 },
];

export const STARTING_GOLD = 100;
export const STARTING_LIVES = 20;
export const GACHA_COST = 10;
export const ADVANCED_GACHA_COST = 50;
export const ENEMY_KILL_GOLD = 5;
export const INITIAL_UNLOCKED_COLS = MAIN_GRID_COLS;
export const EXPAND_COL_COST = 5000;

export const ENEMY_BASE_SPEED = 110;
export const SPAWN_INTERVAL_MS = 800;

export function isValidCell(col: number, row: number): boolean {
  if (row < 0 || row >= GRID_ROWS) return false;
  if (col < 0 || col >= GRID_COLS) return false;
  if (col < MAIN_GRID_COLS) return true;
  return EXT_VALID_ROWS.includes(row);
}

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: GRID_X + col * CELL_W + CELL_W / 2,
    y: GRID_Y + row * CELL_H + CELL_H / 2,
  };
}

export function pointToCell(x: number, y: number): { col: number; row: number } | null {
  if (x < GRID_X || x >= GRID_X + GRID_COLS * CELL_W) return null;
  if (y < GRID_Y || y >= GRID_Y + GRID_ROWS * CELL_H) return null;
  const col = Math.floor((x - GRID_X) / CELL_W);
  const row = Math.floor((y - GRID_Y) / CELL_H);
  if (!isValidCell(col, row)) return null;
  return { col, row };
}

export function cellScale(_col: number): number {
  return 1;
}
