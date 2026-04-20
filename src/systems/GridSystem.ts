import Phaser from 'phaser';
import { GRID_COLS, GRID_ROWS, cellCenter, cellScale, isValidCell, INITIAL_UNLOCKED_COLS } from '../game/balance';
import { TowerUnit } from '../entities/TowerUnit';
import { SYNERGY_GROUPS, IActiveSynergy } from '../data/synergies';

export type SortMode = 'attack' | 'type';

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

  updateSynergies(): IActiveSynergy[] {
    const towers = this.getAllTowers();
    const idSet = new Set<number>();
    for (const t of towers) idSet.add(t.pokemon.id);

    const active: IActiveSynergy[] = [];
    for (const group of SYNERGY_GROUPS) {
      if (group.requireAll) {
        if (group.memberIds.every((id) => idSet.has(id))) {
          active.push({ group, count: group.memberIds.length });
        }
      } else {
        const count = towers.filter((t) => group.memberIds.includes(t.pokemon.id)).length;
        if (count > 0) active.push({ group, count });
      }
    }

    // 각 유닛에 buff 적용
    for (const t of towers) {
      let atk = 1, hp = 1, spd = 1;
      for (const a of active) {
        if (!a.group.memberIds.includes(t.pokemon.id)) continue;
        const reps = a.group.requireAll ? 1 : a.count;
        if (a.group.effect.attack) atk *= Math.pow(a.group.effect.attack, reps);
        if (a.group.effect.hp) hp *= Math.pow(a.group.effect.hp, reps);
        if (a.group.effect.attackSpeed) spd *= Math.pow(a.group.effect.attackSpeed, reps);
      }
      t.setBuff(atk, hp, spd);
    }
    return active;
  }

  sortAndRearrange(scene: Phaser.Scene, mode: SortMode): boolean {
    const towers = this.getAllTowers();
    if (towers.length === 0) return false;

    const sorted = [...towers].sort((a, b) => {
      if (mode === 'type') {
        const ta = a.pokemon.types[0];
        const tb = b.pokemon.types[0];
        if (ta !== tb) return ta.localeCompare(tb);
      }
      return b.computeAttack() - a.computeAttack();
    });

    const validCells: { col: number; row: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < Math.min(this.unlockedCols, GRID_COLS); c++) {
        if (!isValidCell(c, r)) continue;
        validCells.push({ col: c, row: r });
      }
    }

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.cells[r][c] = null;
      }
    }

    for (let i = 0; i < sorted.length && i < validCells.length; i++) {
      const { col, row } = validCells[i];
      const unit = sorted[i];
      this.cells[row][col] = unit;
      unit.col = col;
      unit.row = row;
      const { x, y } = cellCenter(col, row);
      scene.tweens.add({
        targets: unit,
        x,
        y,
        scale: cellScale(col),
        duration: 320,
        ease: 'Quad.out',
        onUpdate: () => unit.syncRangeCircle(),
      });
    }
    return true;
  }
}
