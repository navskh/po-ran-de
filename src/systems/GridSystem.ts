import { GRID_COLS, GRID_ROWS, cellCenter, cellScale, isValidCell, INITIAL_UNLOCKED_COLS } from '../game/balance';
import { TowerUnit } from '../entities/TowerUnit';

export class GridSystem {
  cells: (TowerUnit | null)[][] = [];
  private unlockedCols = INITIAL_UNLOCKED_COLS;

  constructor() {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.cells[r] = new Array(GRID_COLS).fill(null);
    }
  }

  setUnlockedCols(n: number) {
    this.unlockedCols = n;
  }

  getUnlockedCols(): number {
    return this.unlockedCols;
  }

  isUnlocked(col: number): boolean {
    return col < this.unlockedCols;
  }

  getCell(col: number, row: number): TowerUnit | null {
    return this.cells[row]?.[col] ?? null;
  }

  findEmptyCell(): { col: number; row: number } | null {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < Math.min(this.unlockedCols, GRID_COLS); c++) {
        if (!isValidCell(c, r)) continue;
        if (!this.cells[r][c]) return { col: c, row: r };
      }
    }
    return null;
  }

  isFull(): boolean {
    return this.findEmptyCell() === null;
  }

  place(unit: TowerUnit, col: number, row: number) {
    this.cells[row][col] = unit;
    const { x, y } = cellCenter(col, row);
    unit.setCell(col, row, x, y, cellScale(col));
  }

  removeAt(col: number, row: number): TowerUnit | null {
    const u = this.cells[row][col];
    this.cells[row][col] = null;
    return u;
  }

  removeUnit(unit: TowerUnit) {
    if (this.cells[unit.row][unit.col] === unit) {
      this.cells[unit.row][unit.col] = null;
    }
  }

  swap(unit: TowerUnit, targetCol: number, targetRow: number) {
    const oldCol = unit.col;
    const oldRow = unit.row;
    if (oldCol === targetCol && oldRow === targetRow) {
      const { x, y } = cellCenter(oldCol, oldRow);
      unit.setCell(oldCol, oldRow, x, y, cellScale(oldCol));
      return;
    }
    const occupant = this.cells[targetRow][targetCol];
    this.cells[oldRow][oldCol] = null;
    this.cells[targetRow][targetCol] = null;
    if (occupant) {
      this.place(occupant, oldCol, oldRow);
    }
    this.place(unit, targetCol, targetRow);
  }

  findMergeableGroup(): TowerUnit[] | null {
    const groups = new Map<number, TowerUnit[]>();
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const u = this.cells[r][c];
        if (u && u.pokemon.evolvesTo !== null) {
          const list = groups.get(u.pokemon.id) ?? [];
          list.push(u);
          groups.set(u.pokemon.id, list);
        }
      }
    }
    for (const list of groups.values()) {
      if (list.length >= 3) return list.slice(0, 3);
    }
    return null;
  }

  getAllTowers(): TowerUnit[] {
    const towers: TowerUnit[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const u = this.cells[r][c];
        if (u) towers.push(u);
      }
    }
    return towers;
  }

  getTowersInLane(row: number): TowerUnit[] {
    const towers: TowerUnit[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const u = this.cells[row][c];
      if (u) towers.push(u);
    }
    return towers;
  }
}
