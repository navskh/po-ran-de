import Phaser from 'phaser';
import { GRID_COLS, GRID_ROWS, cellCenter, cellScale, isValidCell, INITIAL_UNLOCKED_COLS, BUFF_CELLS } from '../game/balance';
import { TowerUnit } from '../entities/TowerUnit';
import { SYNERGY_GROUPS, IActiveSynergy } from '../data/synergies';

export type SortMode = 'attack' | 'type' | 'optimal';

// Splash/beam 타워 (광역) 판별 - CombatSystem과 동기화
const SPLASH_IDS = new Set([6, 9, 143, 144, 145, 146, 150, 151, 130, 149, 76, 75]);

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

  sortAndRearrange(scene: Phaser.Scene, mode: SortMode, enemyPath?: Phaser.Curves.Path): boolean {
    const towers = this.getAllTowers();
    if (towers.length === 0) return false;

    if (mode === 'optimal') {
      return this.sortOptimal(scene, towers, enemyPath);
    }

    const sorted = [...towers].sort((a, b) => {
      if (mode === 'type') {
        const ta = a.pokemon.types[0];
        const tb = b.pokemon.types[0];
        if (ta !== tb) return ta.localeCompare(tb);
      }
      return b.computeAttack() - a.computeAttack();
    });

    this.placeInOrder(scene, sorted, this.collectValidCells().map((c) => ({ ...c, score: 0 })));
    return true;
  }

  private sortOptimal(scene: Phaser.Scene, towers: TowerUnit[], enemyPath?: Phaser.Curves.Path): boolean {
    const cells = this.collectValidCells().map((c) => ({ ...c, score: 0 }));

    // 1. 각 셀의 path coverage 점수 계산
    if (enemyPath) {
      const SAMPLES = 120;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        const p = enemyPath.getPoint(i / (SAMPLES - 1));
        pts.push({ x: p.x, y: p.y });
      }
      // 평균 range로 coverage 계산 (구체적 매칭 전 대략)
      const avgRange = towers.reduce((s, t) => s + t.computeRange(), 0) / Math.max(towers.length, 1);
      for (const cell of cells) {
        const { x, y } = cellCenter(cell.col, cell.row);
        let count = 0;
        for (const p of pts) {
          const dx = p.x - x;
          const dy = p.y - y;
          if (dx * dx + dy * dy <= avgRange * avgRange) count++;
        }
        cell.score = count;
      }
    }
    // 2. 보너스 셀에 가산점
    for (const buff of BUFF_CELLS) {
      const cell = cells.find((c) => c.col === buff.col && c.row === buff.row);
      if (cell) cell.score += 30;
    }

    // 3. 활성 시너지 멤버 파악
    const active = this.computeActiveSynergies(towers);
    const synIds = new Set<number>();
    for (const a of active) for (const id of a.group.memberIds) synIds.add(id);

    // 4. 타워 DPS 평가 (시너지/광역 가중치)
    const scored = towers.map((t) => {
      const dps = t.computeAttack() * t.pokemon.attackSpeed;
      const synBonus = synIds.has(t.pokemon.id) ? 1.3 : 1;
      const splashBonus = SPLASH_IDS.has(t.pokemon.id) ? 1.2 : 1;
      return { tower: t, score: dps * synBonus * splashBonus };
    });

    // 5. 점수 내림차순 정렬
    scored.sort((a, b) => b.score - a.score);
    cells.sort((a, b) => b.score - a.score);

    this.placeInOrder(scene, scored.map((s) => s.tower), cells);
    return true;
  }

  private collectValidCells(): { col: number; row: number }[] {
    const cells: { col: number; row: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < Math.min(this.unlockedCols, GRID_COLS); c++) {
        if (!isValidCell(c, r)) continue;
        cells.push({ col: c, row: r });
      }
    }
    return cells;
  }

  private placeInOrder(scene: Phaser.Scene, towers: TowerUnit[], cells: { col: number; row: number }[]) {
    // 기존 grid 클리어
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) this.cells[r][c] = null;
    }
    for (let i = 0; i < towers.length && i < cells.length; i++) {
      const { col, row } = cells[i];
      const unit = towers[i];
      this.cells[row][col] = unit;
      unit.col = col;
      unit.row = row;
      unit.applyCellBuff();
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
  }

  private computeActiveSynergies(towers: TowerUnit[]): IActiveSynergy[] {
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
    return active;
  }
}
