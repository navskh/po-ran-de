export const MAIN_GRID_COLS = 7;
export const GRID_COLS = 9;
export const GRID_ROWS = 4;
export const CELL_W = 96;
export const CELL_H = 110;
export const GRID_X = 288;  // 중앙 이동 (기존 128 + 160)
export const GRID_Y = 130;

export const EXT_COL_COUNT = 2;
export const EXT_VALID_ROWS: number[] = [0, 1, 2, 3];

export const HUD_HEIGHT = 70;
export const CONTROL_HEIGHT = 80;

// GAME_WIDTH 1440 기준. 그리드 288~1152. path는 그 바깥쪽으로
export const PATH_WAYPOINTS: Array<{ x: number; y: number }> = [
  { x: 1400, y: 240 },
  { x: 1180, y: 240 },
  { x: 1180, y: 100 },
  { x: 240,  y: 100 },
  { x: 240,  y: 605 },
  { x: 1180, y: 605 },
  { x: 1180, y: 460 },
  { x: 1400, y: 460 },
];

export const STARTING_GOLD = 100;
export const STARTING_LIVES = 20;
export const GACHA_COST = 10;
export const ADVANCED_GACHA_COST = 50;
export const ENEMY_KILL_GOLD = 5;
export const INITIAL_UNLOCKED_COLS = MAIN_GRID_COLS;
export const EXPAND_COL_COST = 500; // legacy
export const EXPAND_COL_COSTS = [500, 2000]; // col 7 해금, col 8 해금 비용

export function getExpandCost(currentUnlockedCols: number): number {
  const idx = currentUnlockedCols - MAIN_GRID_COLS;
  return EXPAND_COL_COSTS[idx] ?? 99999;
}

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

// 보너스 셀: 특정 위치에 배치하면 버프 적용 (보드 전략 요소)
export type BuffCellType = 'range' | 'attack' | 'attackSpeed';
export interface IBuffCell {
  col: number;
  row: number;
  type: BuffCellType;
  value: number; // 1.3 = +30%
  icon: string;
  color: number;
}

export const BUFF_CELLS: IBuffCell[] = [
  // 중앙 (path coverage 좋음): range +30%
  { col: 3, row: 1, type: 'range',       value: 1.30, icon: '🎯', color: 0x66ddff },
  { col: 3, row: 2, type: 'range',       value: 1.30, icon: '🎯', color: 0x66ddff },
  // 상단 모서리: 공격력 +25%
  { col: 1, row: 0, type: 'attack',      value: 1.25, icon: '⚔',  color: 0xff7b8c },
  { col: 5, row: 0, type: 'attack',      value: 1.25, icon: '⚔',  color: 0xff7b8c },
  // 하단 모서리: 공속 +20%
  { col: 1, row: 3, type: 'attackSpeed', value: 1.20, icon: '⚡', color: 0xffd34d },
  { col: 5, row: 3, type: 'attackSpeed', value: 1.20, icon: '⚡', color: 0xffd34d },
];

export function getBuffAt(col: number, row: number): IBuffCell | null {
  return BUFF_CELLS.find((b) => b.col === col && b.row === row) ?? null;
}
