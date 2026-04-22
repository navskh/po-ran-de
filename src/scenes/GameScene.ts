import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import {
  GRID_COLS, GRID_ROWS, CELL_W, CELL_H, GRID_X, GRID_Y,
  HUD_HEIGHT, CONTROL_HEIGHT, cellCenter, cellScale, pointToCell, PATH_WAYPOINTS,
  STARTING_GOLD, STARTING_LIVES, GACHA_COST, ADVANCED_GACHA_COST,
  INITIAL_UNLOCKED_COLS, EXPAND_COL_COST, getExpandCost,
  MAIN_GRID_COLS, isValidCell, BUFF_CELLS,
} from '../game/balance';
import { RECIPES, IRecipe } from '../data/recipes';
import { getPokemon, rollRandomPokemonId, rollAdvancedRandomPokemonId, getSpriteKey, ALL_POKEMON_IDS } from '../data/pokemonData';
import { RECIPE_PAGES } from '../data/recipes';
import { SYNERGY_GROUPS } from '../data/synergies';
void RECIPES;
import { GameState } from '../state/GameState';
import { GridSystem } from '../systems/GridSystem';
import { MergeSystem, IMergeEvaluation } from '../systems/MergeSystem';
import { WaveSystem, TOTAL_WAVE_COUNT, getWaveConfig } from '../systems/WaveSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { AchievementSystem } from '../systems/AchievementSystem';
import { TowerUnit } from '../entities/TowerUnit';
import { Hud } from '../ui/Hud';
import { ControlPanel } from '../ui/ControlPanel';
import { ACHIEVEMENTS } from '../data/achievements';

const TRASH_X = 200;   // 그리드 좌측 인접 (GRID_X 288 - TRASH_W/2 - 여유)
const TRASH_Y = 360;
const TRASH_W = 64;
const TRASH_H = 110;
const REFUND_GOLD = 5;

export class GameScene extends Phaser.Scene {
  state!: GameState;
  grid!: GridSystem;
  mergeSystem!: MergeSystem;
  waveSystem!: WaveSystem;
  combatSystem!: CombatSystem;
  achievements!: AchievementSystem;
  enemyPath!: Phaser.Curves.Path;
  private nextWaveLabel?: Phaser.GameObjects.Text;
  private dragOriginCell?: { col: number; row: number };
  private trashZone!: Phaser.GameObjects.Container;
  private trashBg!: Phaser.GameObjects.Rectangle;
  private trashHover = false;
  private mergePreview?: Phaser.GameObjects.Text;
  private dragOffset = { x: 0, y: 0 };
  private detailsContainer?: Phaser.GameObjects.Container;
  private recipesContainer?: Phaser.GameObjects.Container;
  private recipesPageIndex = 0;
  private lockOverlays: Array<{ col: number; row: number; group: Phaser.GameObjects.GameObject[] }> = [];
  private possibleMatchesUI?: Phaser.GameObjects.Container;
  private gameSpeed: 1 | 2 | 3 = 1;
  private isPaused = false;
  private gameTime = 0;
  private speedBtnText?: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private comboCount = 0;
  private lastKillTime = 0;

  constructor() {
    super('Game');
  }

  create() {
    this.enemyPath = this.buildPath();

    this.state = new GameState({
      gold: STARTING_GOLD,
      lives: STARTING_LIVES,
      maxWave: TOTAL_WAVE_COUNT,
      unlockedCols: INITIAL_UNLOCKED_COLS,
    });
    this.grid = new GridSystem();
    this.mergeSystem = new MergeSystem(this.grid);
    this.waveSystem = new WaveSystem(this, this.state, this.enemyPath);
    this.combatSystem = new CombatSystem(this, this.grid, this.waveSystem);
    this.achievements = new AchievementSystem(this.state, this.grid);

    this.drawBackground();
    this.drawPath();
    this.drawGrid();
    this.createTrashZone();
    this.createSortButtons();
    this.drawNextWavePreview();

    new Hud(this, this.state);
    new ControlPanel(
      this,
      this.state,
      () => this.handleDraw(),
      () => this.handleAdvancedDraw(),
      () => this.handleStartWave(),
      () => this.openRecipes(),
      () => this.handleExpandCol(),
    );

    this.state.on('waveChanged', () => this.refreshNextWavePreview());
    this.state.on('waveEnd', (w: number) => {
      this.refreshNextWavePreview();
      this.achievements.onWaveEnd(w, this.state.lives);
    });
    this.state.on('gameOver', () => this.endGame(false));
    this.state.on('milestone50', (w: number) => {
      this.flashMessage(`🏆 ${w} 웨이브 클리어! 엔드리스 모드 진입!`, '#ffd34d');
    });
    this.state.on('bestWaveUpdated', (best: number) => {
      this.flashMessage(`⭐ 최고 기록 갱신! 웨이브 ${best}`, '#66ddff');
    });
    this.state.on('colsChanged', (n: number) => {
      this.onColsChanged(n);
      this.achievements.onColsChanged(n, GRID_COLS);
    });
    this.state.on('goldChanged', (g: number) => this.achievements.onGoldChange(g));
    this.state.on('dexAdded', () => this.achievements.onDexAdded());
    this.state.on('achievementUnlocked', (id: string) => this.showAchievementToast(id));
    this.events.on('bossKilled', () => this.achievements.onBossKill());

    this.input.dragDistanceThreshold = 8;
    this.input.mouse?.disableContextMenu();
    this.events.on('unitClick', (unit: TowerUnit) => this.openDetails(unit));
    this.events.on('unitRightClick', (unit: TowerUnit) => this.discardUnit(unit));
    this.events.on('gridChanged', () => {
      const active = this.grid.updateSynergies();
      this.refreshPossibleMatches();
      this.achievements.onSynergyActive(active.map((a) => a.group.id));
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.closeDetails();
      this.closeRecipes();
    });
    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this.recipesContainer) this.shiftRecipesPage(-1);
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.recipesContainer) this.shiftRecipesPage(1);
    });
    // 키보드 단축키
    this.input.keyboard?.on('keydown-SPACE', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.input.keyboard?.on('keydown-ONE', () => this.setGameSpeed(1));
    this.input.keyboard?.on('keydown-TWO', () => this.setGameSpeed(2));
    this.input.keyboard?.on('keydown-THREE', () => this.setGameSpeed(3));
    this.input.keyboard?.on('keydown-S', () => this.handleSort('attack'));
    this.input.keyboard?.on('keydown-T', () => this.handleSort('type'));
    this.input.keyboard?.on('keydown-D', () => this.handleDraw());
    this.input.keyboard?.on('keydown-F', () => this.handleAdvancedDraw());
    this.input.keyboard?.on('keydown-W', () => this.handleStartWave());
    this.input.keyboard?.on('keydown-R', () => {
      if (this.recipesContainer) this.closeRecipes();
      else this.openRecipes();
    });

    this.setupDragHandlers();
    this.refreshNextWavePreview();
  }

  update(_time: number, deltaMs: number) {
    if (this.isPaused) return;
    const scaled = deltaMs * this.gameSpeed;
    this.gameTime += scaled;
    this.waveSystem?.update(this.gameTime, scaled);
    this.combatSystem?.update(this.gameTime);
    // 콤보 시간 초과 시 리셋
    if (this.comboCount > 0 && this.gameTime - this.lastKillTime > 2000) {
      this.comboCount = 0;
    }
  }

  private setGameSpeed(speed: 1 | 2 | 3) {
    this.gameSpeed = speed;
    this.tweens.timeScale = speed;
    this.time.timeScale = speed;
    if (this.speedBtnText) {
      this.speedBtnText.setText(`${speed}x`);
    }
    this.flashMessage(`속도 ${speed}배`, '#66ddff');
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.tweens.pauseAll();
      this.showPauseOverlay();
    } else {
      this.tweens.resumeAll();
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay() {
    if (this.pauseOverlay) return;
    const c = this.add.container(0, 0).setDepth(3000);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0, 0);
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⏸ 일시정지\n\nSpace / P 로 재개', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#ffffff', align: 'center',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    c.add([bg, text]);
    this.pauseOverlay = c;
  }

  private hidePauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = undefined;
    }
  }

  incrementCombo() {
    this.comboCount += 1;
    this.lastKillTime = this.gameTime;
    if (this.comboCount >= 5 && this.comboCount % 5 === 0) {
      this.flashMessage(`${this.comboCount} 콤보!`, '#ffaa00');
    }
    this.achievements?.onCombo(this.comboCount);
  }

  private showAchievementToast(id: string) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    const toast = this.add.container(GAME_WIDTH / 2, 150).setDepth(3000);
    const bg = this.add.rectangle(0, 0, 420, 72, 0x1a1c2f, 0.95)
      .setStrokeStyle(2, 0xffd34d, 1);
    const iconTxt = this.add.text(-180, 0, a.icon, {
      fontFamily: 'sans-serif', fontSize: '32px',
    }).setOrigin(0.5);
    const title = this.add.text(-140, -12, '업적 달성!', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffd34d',
    }).setOrigin(0, 0.5);
    const name = this.add.text(-140, 8, `${a.name} — ${a.description}`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffffff',
    }).setOrigin(0, 0.5);
    toast.add([bg, iconTxt, title, name]);
    toast.setAlpha(0);
    this.tweens.add({
      targets: toast, alpha: 1, y: 130, duration: 300, ease: 'Quad.out',
      yoyo: false,
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: toast, alpha: 0, y: 110, duration: 400,
            onComplete: () => toast.destroy(),
          });
        });
      },
    });
  }

  resetCombo() {
    this.comboCount = 0;
  }

  private buildPath(): Phaser.Curves.Path {
    const wp = PATH_WAYPOINTS;
    const path = new Phaser.Curves.Path(wp[0].x, wp[0].y);
    for (let i = 1; i < wp.length; i++) {
      path.lineTo(wp[i].x, wp[i].y);
    }
    return path;
  }

  private setupDragHandlers() {
    this.input.on('dragstart', (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      const unit = obj.getData('unit') as TowerUnit | undefined;
      if (!unit) return;
      unit.markDragStarted();
      this.dragOriginCell = { col: unit.col, row: unit.row };
      this.dragOffset.x = pointer.x - unit.x;
      this.dragOffset.y = pointer.y - unit.y;
      unit.setAlpha(0.8);
      unit.setScale(1.1);
      unit.setDepth(1500);
      this.trashZone.setAlpha(1.0);
    });

    this.input.on('drag', (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      const unit = obj.getData('unit') as TowerUnit | undefined;
      if (!unit) return;
      const nx = pointer.x - this.dragOffset.x;
      const ny = pointer.y - this.dragOffset.y;
      unit.x = nx;
      unit.y = ny;

      const inTrash = this.isInTrash(nx, ny);
      if (inTrash !== this.trashHover) {
        this.trashHover = inTrash;
        this.highlightTrash(inTrash);
      }
      this.updateMergePreview(unit, nx, ny);
    });

    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      const unit = obj.getData('unit') as TowerUnit | undefined;
      if (!unit) return;
      unit.setAlpha(1);
      unit.setScale(1);
      unit.setDepth(0);
      this.trashZone.setAlpha(0.35);
      this.highlightTrash(false);
      this.trashHover = false;
      this.clearMergePreview();

      if (this.isInTrash(unit.x, unit.y)) {
        this.discardUnit(unit);
        return;
      }

      const cell = pointToCell(unit.x, unit.y);
      if (!cell) {
        this.snapBack(unit);
        return;
      }

      const occupant = this.grid.getCell(cell.col, cell.row);
      if (occupant && occupant !== unit) {
        const evalResult = this.mergeSystem.evaluate(unit, occupant);
        if (evalResult.type !== 'none') {
          this.performMerge(unit, occupant, evalResult);
          return;
        }
      }

      this.grid.swap(unit, cell.col, cell.row);
    });
  }

  private updateMergePreview(unit: TowerUnit, x: number, y: number) {
    const cell = pointToCell(x, y);
    if (!cell) {
      this.clearMergePreview();
      return;
    }
    const occupant = this.grid.getCell(cell.col, cell.row);
    if (!occupant || occupant === unit) {
      this.clearMergePreview();
      return;
    }
    const evalResult = this.mergeSystem.evaluate(unit, occupant);
    if (evalResult.type === 'none') {
      this.clearMergePreview();
      return;
    }
    let label: string;
    let color: string;
    if (evalResult.type === 'levelup') {
      const newLv = Math.min(occupant.level + unit.level, occupant.maxLevel());
      label = `Lv ${occupant.level} → Lv ${newLv}`;
      color = '#7afcc9';
    } else if (evalResult.type === 'starUp' || evalResult.type === 'metamonStar') {
      label = `★ +1 (${'★'.repeat(occupant.effectiveStage() + 1)})`;
      color = '#ffaa00';
    } else if (evalResult.type === 'evolve') {
      label = `진화! → ${getPokemon(occupant.pokemon.evolvesTo!).ko}`;
      color = '#ffd34d';
    } else if (evalResult.type === 'metamonMerge') {
      label = `메타몽 진화! → ${getPokemon(occupant.pokemon.evolvesTo!).ko}`;
      color = '#ffd34d';
    } else if (evalResult.type === 'eeveeMerge') {
      label = `이브이 → ${evalResult.eeveeKo}`;
      color = '#7afcc9';
    } else {
      label = `★ 전설! → ${evalResult.legendaryKo}`;
      color = '#ffaa00';
    }
    if (!this.mergePreview) {
      this.mergePreview = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '13px',
        backgroundColor: '#000000cc', padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setDepth(2000);
    }
    this.mergePreview.setText(label);
    this.mergePreview.setColor(color);
    this.mergePreview.setPosition(occupant.x, occupant.y - CELL_H / 2 - 14);
  }

  private clearMergePreview() {
    if (this.mergePreview) {
      this.mergePreview.destroy();
      this.mergePreview = undefined;
    }
  }

  private snapBack(unit: TowerUnit) {
    const home = this.dragOriginCell ?? { col: unit.col, row: unit.row };
    const { x, y } = cellCenter(home.col, home.row);
    const scale = cellScale(home.col);
    this.tweens.add({ targets: unit, x, y, scale, duration: 200, ease: 'Quad.out' });
  }

  private performMerge(dragged: TowerUnit, target: TowerUnit, evalResult: IMergeEvaluation) {
    dragged.isMerging = true;
    target.isMerging = true;
    this.tweens.add({
      targets: dragged,
      x: target.x,
      y: target.y,
      scale: 0,
      alpha: 0,
      duration: 220,
      ease: 'Quad.in',
      onComplete: () => {
        const result = this.mergeSystem.apply(dragged, target);
        target.isMerging = false;

        if (result.type === 'eeveeMerge') {
          target.destroy();
          dragged.isMerging = false;
          dragged.setAlpha(1).setScale(cellScale(dragged.col));
          this.state.addToDex(dragged.pokemon.id);
          this.achievements.onEvolveTo(dragged.pokemon.id);
          this.playLegendaryEffect(dragged);
          this.flashMessage(`이브이 → ${result.eeveeKo}!`, '#7afcc9');
          this.events.emit('gridChanged');
          return;
        }
        this.state.addToDex(target.pokemon.id);
        this.achievements.onEvolveTo(target.pokemon.id);

        dragged.destroy();
        if (result.type === 'levelup') this.playLevelUpEffect(target);
        else if (result.type === 'starUp') this.playStarEffect(target);
        else if (result.type === 'metamonStar') this.playStarEffect(target);
        else if (result.type === 'evolve') this.playEvolveEffect(target);
        else if (result.type === 'metamonMerge') this.playEvolveEffect(target);
        else if (result.type === 'legendary') this.playLegendaryEffect(target);
        else this.flashMessage('합성 실패', '#ff7b8c');
        this.events.emit('gridChanged');
      },
    });
    void evalResult;
  }

  private playStarEffect(unit: TowerUnit) {
    this.tweens.add({
      targets: unit,
      scale: { from: 1.4, to: 1 },
      duration: 320,
      ease: 'Back.out',
    });
    for (let i = 0; i < 2; i++) {
      this.time.delayedCall(i * 100, () => {
        const ring = this.add.circle(unit.x, unit.y, 36, 0xffaa00, 0.6).setDepth(unit.depth + 1);
        this.tweens.add({
          targets: ring, scale: 2.4, alpha: 0, duration: 480,
          onComplete: () => ring.destroy(),
        });
      });
    }
    this.flashMessage(`★ +1 → ${unit.pokemon.ko} ${'★'.repeat(unit.effectiveStage())}`, '#ffaa00');
  }

  private discardUnit(unit: TowerUnit) {
    this.tweens.add({
      targets: unit,
      scale: 0,
      alpha: 0,
      angle: 360,
      duration: 320,
      onComplete: () => {
        this.grid.removeUnit(unit);
        unit.destroy();
        this.events.emit('gridChanged');
      },
    });
    const refund = this.computeRefund(unit);
    this.state.addGold(refund);
    this.flashMessage(`${unit.pokemon.ko} 버림 +${refund}G`, '#ffd34d');
  }

  private computeRefund(unit: TowerUnit): number {
    const lvBonus = (unit.level - 1) * 2;
    const starBonus = unit.extraStars * 15;
    const stageBonus = (unit.pokemon.stage - 1) * 8;
    const rarityBonus = (unit.pokemon.rarity - 1) * 4;
    return REFUND_GOLD + lvBonus + starBonus + stageBonus + rarityBonus;
  }

  private endGame(victory: boolean) {
    this.time.delayedCall(900, () => {
      this.scene.start('End', {
        victory,
        wave: this.state.wave,
        maxWave: this.state.maxWave,
      });
    });
  }

  private handleDraw() {
    this.spawnDrawnUnit(GACHA_COST, rollRandomPokemonId);
  }

  private handleAdvancedDraw() {
    this.spawnDrawnUnit(ADVANCED_GACHA_COST, rollAdvancedRandomPokemonId);
  }

  private spawnDrawnUnit(cost: number, roller: () => number) {
    if (this.grid.isFull()) {
      this.flashMessage('자리가 가득 찼어요! 합치거나 버려서 자리 만드세요', '#ff7b8c');
      return;
    }
    if (!this.state.spendGold(cost)) {
      this.flashMessage('골드 부족!', '#ff7b8c');
      return;
    }
    const id = roller();
    this.state.addToDex(id);
    const pokemon = getPokemon(id);
    const cell = this.grid.findEmptyCell()!;
    const { x, y } = cellCenter(cell.col, cell.row);
    const unit = new TowerUnit(this, x, y, pokemon, cell.col, cell.row);
    this.grid.place(unit, cell.col, cell.row);

    const finalScale = cellScale(cell.col);
    this.tweens.add({
      targets: unit,
      scale: { from: finalScale * 0.5, to: finalScale },
      duration: 220,
      ease: 'Back.out',
    });
    this.events.emit('gridChanged');
  }

  private handleStartWave() {
    if (!this.state.startWave()) {
      this.flashMessage('웨이브 시작 불가', '#ff7b8c');
    }
  }

  private playLevelUpEffect(unit: TowerUnit) {
    this.tweens.add({
      targets: unit,
      scale: { from: 1.2, to: 1 },
      duration: 240,
      ease: 'Back.out',
    });
    const ring = this.add.circle(unit.x, unit.y, 40, 0x7afcc9, 0.5).setDepth(unit.depth + 1);
    this.tweens.add({
      targets: ring, scale: 1.6, alpha: 0, duration: 380,
      onComplete: () => ring.destroy(),
    });
    this.flashMessage(`레벨업! ${unit.pokemon.ko} Lv ${unit.level}`, '#7afcc9');
  }

  private playEvolveEffect(unit: TowerUnit) {
    this.tweens.add({
      targets: unit,
      scale: { from: 1.5, to: 1 },
      duration: 360,
      ease: 'Back.out',
    });
    const flash = this.add.rectangle(unit.x, unit.y, CELL_W, CELL_H, 0xffffff, 0.85)
      .setDepth(unit.depth + 1);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 500,
      onComplete: () => flash.destroy(),
    });
    this.flashMessage(`진화! → ${unit.pokemon.ko}`, '#ffd34d');
  }

  private playLegendaryEffect(unit: TowerUnit) {
    this.tweens.add({
      targets: unit,
      scale: { from: 2.4, to: 1 },
      duration: 600,
      ease: 'Back.out',
    });
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 130, () => {
        const ring = this.add.circle(unit.x, unit.y, 40, 0xffeeaa, 0.7).setDepth(unit.depth + 1);
        this.tweens.add({
          targets: ring, scale: 4, alpha: 0, duration: 700,
          onComplete: () => ring.destroy(),
        });
      });
    }
    this.flashMessage(`★ 전설의 등장! ${unit.pokemon.ko} ★`, '#ffaa00');
  }

  private flashMessage(msg: string, color = '#ffd34d') {
    const t = this.add.text(GAME_WIDTH / 2, 92, msg, {
      fontFamily: 'sans-serif', fontSize: '18px', color,
      backgroundColor: '#000000aa', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({
      targets: t, alpha: 0, duration: 1600, ease: 'Quad.in',
      onComplete: () => t.destroy(),
    });
  }

  private drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x141528, 0x141528, 0x1f2247, 0x1f2247, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawPath() {
    const g = this.add.graphics();
    g.lineStyle(28, 0x252845, 0.85);
    this.enemyPath.draw(g);
    const inner = this.add.graphics();
    inner.lineStyle(2, 0x6e75aa, 0.55);
    this.enemyPath.draw(inner);

    const startPt = this.enemyPath.getStartPoint();
    this.add.text(startPt.x - 14, startPt.y - 22, 'SPAWN', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aab0d4',
    }).setOrigin(1, 0.5);

    const endPt = this.enemyPath.getEndPoint();
    this.add.text(endPt.x + 14, endPt.y - 22, 'EXIT', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff7b8c',
    }).setOrigin(0, 0.5);
  }

  private drawGrid() {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!isValidCell(c, r)) continue;
        const { x, y } = cellCenter(c, r);
        this.add.rectangle(x, y, CELL_W - 6, CELL_H - 6, 0x1a1c2f, 0.85)
          .setStrokeStyle(2, 0x3a3f6a);

        if (c >= INITIAL_UNLOCKED_COLS) {
          const overlay = this.add.rectangle(x, y, CELL_W - 6, CELL_H - 6, 0x000000, 0.74)
            .setDepth(200);
          const lockText = this.add.text(x, y - 6, 'LOCK', {
            fontFamily: 'monospace', fontSize: '11px', color: '#ff7b8c',
          }).setOrigin(0.5).setDepth(201);
          const colCost = c === MAIN_GRID_COLS ? 500 : 2000;
          const costText = this.add.text(x, y + 10, `${colCost}G`, {
            fontFamily: 'monospace', fontSize: '10px', color: '#ffd34d',
          }).setOrigin(0.5).setDepth(201);
          void EXPAND_COL_COST;
          this.lockOverlays.push({ col: c, row: r, group: [overlay, lockText, costText] });
        }
      }
    }
    void MAIN_GRID_COLS; void GRID_X; void GRID_Y;

    // 보너스 셀 시각 표시 (배치 전략 유도)
    for (const buff of BUFF_CELLS) {
      const { x, y } = cellCenter(buff.col, buff.row);
      // 바닥 글로우
      const glow = this.add.rectangle(x, y, CELL_W - 10, CELL_H - 10, buff.color, 0.08)
        .setStrokeStyle(2, buff.color, 0.7)
        .setDepth(1);
      // pulse 애니메이션
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.25 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      // 아이콘 (셀 좌상단)
      this.add.text(x - CELL_W / 2 + 12, y - CELL_H / 2 + 10, buff.icon, {
        fontFamily: 'sans-serif', fontSize: '14px',
      }).setOrigin(0.5).setDepth(2);
      // 값 레이블 (셀 좌하단)
      const label = buff.type === 'range' ? `R+${Math.round((buff.value - 1) * 100)}%`
        : buff.type === 'attack' ? `A+${Math.round((buff.value - 1) * 100)}%`
        : `S+${Math.round((buff.value - 1) * 100)}%`;
      this.add.text(x, y + CELL_H / 2 - 10, label, {
        fontFamily: 'monospace', fontSize: '9px', color: '#' + buff.color.toString(16).padStart(6, '0'),
      }).setOrigin(0.5).setDepth(2);
    }
  }

  private handleExpandCol() {
    const cost = getExpandCost(this.state.unlockedCols);
    if (!this.state.expandCol(cost, GRID_COLS)) {
      this.flashMessage('골드 부족 또는 최대 확장 도달', '#ff7b8c');
    }
  }

  private onColsChanged(newCols: number) {
    this.grid.setUnlockedCols(newCols);
    const justUnlockedCol = newCols - 1;
    this.lockOverlays = this.lockOverlays.filter((ov) => {
      if (ov.col === justUnlockedCol) {
        ov.group.forEach((g) => g.destroy());
        return false;
      }
      return true;
    });
    this.flashMessage(`${newCols}열 해금!`, '#7afcc9');
  }

  private createTrashZone() {
    this.trashZone = this.add.container(TRASH_X, TRASH_Y);
    this.trashBg = this.add.rectangle(0, 0, TRASH_W, TRASH_H, 0x331122, 0.5)
      .setStrokeStyle(2, 0x884466, 0.7);
    const icon = this.add.text(0, -22, 'X', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ff7b8c',
    }).setOrigin(0.5);
    const label = this.add.text(0, 18, '버리기', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ddddee',
    }).setOrigin(0.5);
    const refund = this.add.text(0, 36, `+${REFUND_GOLD}G`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffd34d',
    }).setOrigin(0.5);
    this.trashZone.add([this.trashBg, icon, label, refund]);
    this.trashZone.setAlpha(0.35);
    this.trashZone.setDepth(900);
  }

  private createSortButtons() {
    const x = TRASH_X;
    const attackY = TRASH_Y + TRASH_H / 2 + 30;
    const typeY = attackY + 50;

    const makeBtn = (y: number, label: string, fill: number, stroke: number, onClick: () => void) => {
      const rect = this.add.rectangle(x, y, TRASH_W, 40, fill, 0.6)
        .setStrokeStyle(2, stroke, 0.85)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, y - 8, '정렬', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ddddee',
      }).setOrigin(0.5);
      const mode = this.add.text(x, y + 6, label, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffd34d',
      }).setOrigin(0.5);
      rect.on('pointerover', () => rect.setFillStyle(stroke, 0.6));
      rect.on('pointerout', () => rect.setFillStyle(fill, 0.6));
      rect.on('pointerdown', onClick);
      void text; void mode;
    };

    makeBtn(attackY, '공격순', 0x1a3a3a, 0x44aaaa, () => this.handleSort('attack'));
    makeBtn(typeY, '타입순', 0x3a1a3a, 0xaa44aa, () => this.handleSort('type'));

    // 최적 정렬 버튼 (path coverage + DPS + 시너지)
    const optimalY = typeY + 50;
    const optRect = this.add.rectangle(TRASH_X, optimalY, TRASH_W, 40, 0x3a2a1a, 0.6)
      .setStrokeStyle(2, 0xffd34d, 0.85)
      .setInteractive({ useHandCursor: true });
    this.add.text(TRASH_X, optimalY - 8, '정렬', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ddddee',
    }).setOrigin(0.5);
    this.add.text(TRASH_X, optimalY + 6, '⚡최적', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffd34d',
    }).setOrigin(0.5);
    optRect.on('pointerover', () => optRect.setFillStyle(0xffd34d, 0.3));
    optRect.on('pointerout', () => optRect.setFillStyle(0x3a2a1a, 0.6));
    optRect.on('pointerdown', () => this.handleSort('optimal'));

    // 속도 조절 버튼
    const speedY = optimalY + 50;
    const speedRect = this.add.rectangle(TRASH_X, speedY, TRASH_W, 40, 0x1a2a3a, 0.6)
      .setStrokeStyle(2, 0x66ddff, 0.85)
      .setInteractive({ useHandCursor: true });
    const speedLabel = this.add.text(TRASH_X, speedY - 8, '속도', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ddddee',
    }).setOrigin(0.5);
    this.speedBtnText = this.add.text(TRASH_X, speedY + 6, '1x', {
      fontFamily: 'monospace', fontSize: '12px', color: '#66ddff',
    }).setOrigin(0.5);
    speedRect.on('pointerdown', () => {
      const next = (this.gameSpeed === 3 ? 1 : this.gameSpeed + 1) as 1 | 2 | 3;
      this.setGameSpeed(next);
    });
    void speedLabel;

    // 키 힌트는 조합표에 있으니 좁은 하단 여백 문제로 제거
  }

  private handleSort(mode: 'attack' | 'type' | 'optimal') {
    const changed = this.grid.sortAndRearrange(this, mode, this.enemyPath);
    if (!changed) {
      this.flashMessage('정렬할 포켓몬 없음', '#ff7b8c');
      return;
    }
    const label = mode === 'attack' ? '공격력 순 정렬' :
                  mode === 'type' ? '타입 순 정렬' :
                  '⚡ 최적 정렬 (DPS + 시너지 + 보너스 셀)';
    const color = mode === 'optimal' ? '#ffd34d' : '#7afcc9';
    this.flashMessage(label, color);
    this.events.emit('gridChanged');
  }

  private isInTrash(x: number, y: number): boolean {
    return Math.abs(x - TRASH_X) < TRASH_W / 2 && Math.abs(y - TRASH_Y) < TRASH_H / 2;
  }

  private highlightTrash(active: boolean) {
    this.trashBg.setFillStyle(active ? 0x661133 : 0x331122, active ? 0.85 : 0.5);
    this.trashBg.setStrokeStyle(active ? 3 : 2, active ? 0xff5577 : 0x884466, active ? 1 : 0.7);
  }

  private drawNextWavePreview() {
    this.nextWaveLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - CONTROL_HEIGHT - 18, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#7afcc9',
    }).setOrigin(0.5);
  }

  private refreshPossibleMatches() {
    if (this.possibleMatchesUI) {
      this.possibleMatchesUI.destroy();
      this.possibleMatchesUI = undefined;
    }
    const towers = this.grid.getAllTowers();
    const idCounts = new Map<number, number>();
    for (const t of towers) {
      idCounts.set(t.pokemon.id, (idCounts.get(t.pokemon.id) ?? 0) + 1);
    }

    const possible: IRecipe[] = [];

    // 레시피 조합
    for (const r of RECIPES) {
      const [a, b] = r.ingredients;
      if (a === b) {
        if ((idCounts.get(a) ?? 0) >= 2) possible.push(r);
      } else {
        if ((idCounts.get(a) ?? 0) >= 1 && (idCounts.get(b) ?? 0) >= 1) possible.push(r);
      }
    }

    // 자연 진화/별 강화/레벨업 추천 (같은 종 2마리 이상)
    for (const [id, count] of idCounts.entries()) {
      if (count < 2) continue;
      const matches = towers.filter((t) => t.pokemon.id === id);
      const sorted = [...matches].sort((a, b) => b.level - a.level);
      const target = sorted[0];
      const dragged = sorted[1];
      const evalResult = this.mergeSystem.evaluate(dragged, target);

      if (evalResult.type === 'evolve') {
        const evolved = getPokemon(target.pokemon.evolvesTo!);
        possible.push({
          ingredients: [id, id] as [number, number],
          result: target.pokemon.evolvesTo!,
          ko: evolved.ko,
        });
      } else if (evalResult.type === 'starUp') {
        possible.push({
          ingredients: [id, id] as [number, number],
          result: id,
          ko: `★+1`,
        });
      } else if (evalResult.type === 'levelup') {
        const newLevel = Math.min(target.level + dragged.level, target.maxLevel());
        possible.push({
          ingredients: [id, id] as [number, number],
          result: id,
          ko: `Lv${newLevel}`,
        });
      }
    }

    if (possible.length === 0) return;

    const container = this.add.container(0, 0).setDepth(300);
    this.possibleMatchesUI = container;
    const baseY = GAME_HEIGHT - CONTROL_HEIGHT - 44;
    container.add(this.add.text(GAME_WIDTH / 2, baseY - 18, `가능한 조합 ${possible.length} (클릭하여 합성)`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#7afcc9',
    }).setOrigin(0.5));

    const maxDisplay = 8;
    const displayed = possible.slice(0, maxDisplay);
    const itemWidth = 92;
    const totalWidth = displayed.length * itemWidth;
    const startX = (GAME_WIDTH - totalWidth) / 2 + itemWidth / 2;

    for (let i = 0; i < displayed.length; i++) {
      const r = displayed[i];
      const x = startX + i * itemWidth;
      const y = baseY;

      const hit = this.add.rectangle(x + 8, y, itemWidth - 6, 42, 0x1a1c2f, 0.5)
        .setStrokeStyle(1, 0x44476a, 0.7)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => hit.setStrokeStyle(2, 0x7afcc9, 1));
      hit.on('pointerout', () => hit.setStrokeStyle(1, 0x44476a, 0.7));
      hit.on('pointerdown', () => this.executeRecipe(r));
      container.add(hit);

      const [aId, bId] = r.ingredients;
      if (this.textures.exists(getSpriteKey(aId))) {
        container.add(this.add.image(x - 24, y, getSpriteKey(aId)).setScale(0.5));
      }
      container.add(this.add.text(x - 6, y, '+', {
        fontFamily: 'monospace', fontSize: '10px', color: '#aab0d4',
      }).setOrigin(0.5));
      if (this.textures.exists(getSpriteKey(bId))) {
        container.add(this.add.image(x + 12, y, getSpriteKey(bId)).setScale(0.5));
      }
      container.add(this.add.text(x + 28, y, '→', {
        fontFamily: 'monospace', fontSize: '10px', color: '#aab0d4',
      }).setOrigin(0.5));
      if (this.textures.exists(getSpriteKey(r.result))) {
        container.add(this.add.image(x + 44, y, getSpriteKey(r.result)).setScale(0.6));
      }
    }
  }

  private executeRecipe(r: IRecipe) {
    const [aId, bId] = r.ingredients;
    const towers = this.grid.getAllTowers();

    let dragged: TowerUnit | null = null;
    let target: TowerUnit | null = null;

    if (aId === bId) {
      const matches = towers.filter((t) => t.pokemon.id === aId);
      if (matches.length < 2) return;
      dragged = matches[0];
      target = matches[1];
    } else {
      dragged = towers.find((t) => t.pokemon.id === aId) ?? null;
      target = towers.find((t) => t.pokemon.id === bId) ?? null;
    }

    if (!dragged || !target || dragged === target) return;

    const evalResult = this.mergeSystem.evaluate(dragged, target);
    if (evalResult.type === 'none') {
      this.flashMessage('합성 불가', '#ff7b8c');
      return;
    }
    this.performMerge(dragged, target, evalResult);
  }

  private refreshNextWavePreview() {
    if (!this.nextWaveLabel) return;
    const nextWaveNum = this.state.wave + 1;
    const next = getWaveConfig(nextWaveNum);
    const endlessTag = nextWaveNum > TOTAL_WAVE_COUNT ? ' ♾' : '';
    if (next.bossId !== undefined) {
      const boss = getPokemon(next.bossId);
      this.nextWaveLabel.setText(`다음 웨이브 ${nextWaveNum}${endlessTag}: 보스 — ${boss.ko}`);
    } else {
      const names = next.pool.slice(0, 5).map((id) => getPokemon(id).ko).join(', ');
      this.nextWaveLabel.setText(`다음 웨이브 ${nextWaveNum}${endlessTag}: ${next.count}마리 (${names})`);
    }
  }

  private openDetails(unit: TowerUnit) {
    this.closeDetails();
    this.closeRecipes();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const w = 320;
    const h = 460;

    this.detailsContainer = this.add.container(0, 0).setDepth(2500);

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeDetails());

    const card = this.add.rectangle(cx, cy, w, h, 0x1a1c2f, 1)
      .setStrokeStyle(2, 0x6680ff);

    const sprite = this.add.image(cx, cy - 150, getSpriteKey(unit.pokemon.id)).setScale(2.4);

    const stars = this.add.text(cx, cy - 78, '★'.repeat(unit.pokemon.stage), {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#ffd34d',
    }).setOrigin(0.5);

    const name = this.add.text(cx, cy - 50, unit.pokemon.ko, {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);

    const typeStr = unit.pokemon.types.join(' / ');
    const types = this.add.text(cx, cy - 22, `타입  ${typeStr}`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#aab0d4',
    }).setOrigin(0.5);

    const lines: string[] = [
      `Lv  ${unit.level} / ${unit.maxLevel()}`,
      `공격력  ${unit.computeAttack()}  (기본 ${unit.pokemon.attack})`,
      `체력  ${unit.computeHp()}`,
      `사거리  ${unit.pokemon.range}`,
      `공격속도  ${unit.pokemon.attackSpeed.toFixed(2)}/s`,
    ];
    const stats = this.add.text(cx, cy + 20, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddddee',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);

    let evoText = '';
    let evoColor = '#aab0d4';
    if (unit.pokemon.evolvesTo) {
      const next = getPokemon(unit.pokemon.evolvesTo);
      if (unit.canEvolve()) {
        evoText = `만렙! 같은 종 합치면 → ${next.ko}`;
        evoColor = '#ffd34d';
      } else {
        evoText = `다음 진화: ${next.ko} (Lv ${unit.maxLevel()} 만렙 후 합성)`;
      }
    } else {
      evoText = '최종 진화체';
    }
    const evo = this.add.text(cx, cy + h / 2 - 36, evoText, {
      fontFamily: 'sans-serif', fontSize: '12px', color: evoColor, align: 'center',
      wordWrap: { width: w - 32 },
    }).setOrigin(0.5);

    const closeBtn = this.add.text(cx + w / 2 - 18, cy - h / 2 + 18, 'X', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ff7b8c',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeDetails());

    this.detailsContainer.add([overlay, card, sprite, stars, name, types, stats, evo, closeBtn]);
  }

  private closeDetails() {
    if (this.detailsContainer) {
      this.detailsContainer.destroy();
      this.detailsContainer = undefined;
    }
  }

  private openRecipes() {
    this.closeDetails();
    this.recipesPageIndex = 0;
    this.renderRecipesPage();
  }

  private shiftRecipesPage(delta: number) {
    const total = RECIPE_PAGES.length + 4; // +synergy +probability +dex +achievements
    this.recipesPageIndex = (this.recipesPageIndex + delta + total) % total;
    this.renderRecipesPage();
  }

  private renderRecipesPage() {
    if (this.recipesContainer) {
      this.recipesContainer.destroy();
      this.recipesContainer = undefined;
    }
    if (this.recipesPageIndex === RECIPE_PAGES.length) {
      this.renderSynergyPage();
      return;
    }
    if (this.recipesPageIndex === RECIPE_PAGES.length + 1) {
      this.renderProbabilityPage();
      return;
    }
    if (this.recipesPageIndex === RECIPE_PAGES.length + 2) {
      this.renderDexPage();
      return;
    }
    if (this.recipesPageIndex === RECIPE_PAGES.length + 3) {
      this.renderAchievementsPage();
      return;
    }

    const cx = GAME_WIDTH / 2;
    const cy = (HUD_HEIGHT + GAME_HEIGHT - CONTROL_HEIGHT) / 2;
    const w = 980;
    const h = 540;
    const page = RECIPE_PAGES[this.recipesPageIndex];

    const container = this.add.container(0, 0).setDepth(2500);
    this.recipesContainer = container;

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeRecipes());
    container.add(overlay);

    const card = this.add.rectangle(cx, cy, w, h, 0x1a1c2f, 1)
      .setStrokeStyle(2, 0xffaa00)
      .setInteractive();
    card.on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event.stopPropagation());
    container.add(card);

    container.add(this.add.text(cx, cy - h / 2 + 26, page.title, {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffd34d',
    }).setOrigin(0.5));

    container.add(this.add.text(cx, cy - h / 2 + 50, page.subtitle, {
      fontFamily: 'monospace', fontSize: '11px', color: '#aab0d4',
    }).setOrigin(0.5));

    container.add(this.add.text(cx, cy - h / 2 + 68, '두 마리 있으면 바로 합성 가능 (만렙 조건 없음)', {
      fontFamily: 'monospace', fontSize: '10px', color: '#7afcc9',
    }).setOrigin(0.5));

    const cols = 3;
    const rows = Math.ceil(page.recipes.length / cols);
    const colWidth = (w - 40) / cols;
    const rowHeight = 72;
    const startTopY = cy - h / 2 + 95;
    const startLeftX = cx - w / 2 + 20;

    for (let i = 0; i < page.recipes.length; i++) {
      const recipe = page.recipes[i];
      const colIdx = Math.floor(i / rows);
      const rowIdx = i % rows;
      const baseX = startLeftX + colIdx * colWidth;
      const yPos = startTopY + rowIdx * rowHeight;

      const [aId, bId] = recipe.ingredients;
      const aP = getPokemon(aId);
      const bP = getPokemon(bId);
      const rP = getPokemon(recipe.result);

      if (this.textures.exists(getSpriteKey(aId))) {
        container.add(this.add.image(baseX + 18, yPos, getSpriteKey(aId)).setScale(0.65));
      }
      container.add(this.add.text(baseX + 18, yPos + 24, aP.ko, {
        fontFamily: 'sans-serif', fontSize: '10px', color: '#aab0d4',
      }).setOrigin(0.5));

      container.add(this.add.text(baseX + 56, yPos, '+', {
        fontFamily: 'monospace', fontSize: '14px', color: '#ddddee',
      }).setOrigin(0.5));

      if (this.textures.exists(getSpriteKey(bId))) {
        container.add(this.add.image(baseX + 92, yPos, getSpriteKey(bId)).setScale(0.65));
      }
      container.add(this.add.text(baseX + 92, yPos + 24, bP.ko, {
        fontFamily: 'sans-serif', fontSize: '10px', color: '#aab0d4',
      }).setOrigin(0.5));

      container.add(this.add.text(baseX + 130, yPos, '→', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aab0d4',
      }).setOrigin(0.5));

      if (this.textures.exists(getSpriteKey(recipe.result))) {
        container.add(this.add.image(baseX + 172, yPos, getSpriteKey(recipe.result)).setScale(0.85));
      }
      container.add(this.add.text(baseX + 200, yPos, rP.ko, {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#ffd34d',
      }).setOrigin(0, 0.5));
    }

    // 페이지 인디케이터 + 화살표
    const pagerY = cy + h / 2 - 26;
    const prevBg = this.add.rectangle(cx - 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    prevBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.shiftRecipesPage(-1);
    });
    const prevText = this.add.text(cx - 80, pagerY, '‹', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);

    const pageText = this.add.text(cx, pagerY, `${this.recipesPageIndex + 1} / ${RECIPE_PAGES.length + 4}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddddee',
    }).setOrigin(0.5);

    const nextBg = this.add.rectangle(cx + 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    nextBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.shiftRecipesPage(1);
    });
    const nextText = this.add.text(cx + 80, pagerY, '›', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);

    container.add([prevBg, prevText, pageText, nextBg, nextText]);

    // 닫기 버튼
    const closeBg = this.add.rectangle(cx + w / 2 - 22, cy - h / 2 + 22, 32, 32, 0x4a1a1a, 1)
      .setStrokeStyle(2, 0xff5577)
      .setInteractive({ useHandCursor: true });
    closeBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.closeRecipes();
    });
    const closeText = this.add.text(cx + w / 2 - 22, cy - h / 2 + 22, 'X', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff5577',
    }).setOrigin(0.5);
    container.add([closeBg, closeText]);
  }

  private closeRecipes() {
    if (this.recipesContainer) {
      this.recipesContainer.destroy();
      this.recipesContainer = undefined;
    }
  }

  private renderProbabilityPage() {
    const cx = GAME_WIDTH / 2;
    const cy = (HUD_HEIGHT + GAME_HEIGHT - CONTROL_HEIGHT) / 2;
    const w = 980;
    const h = 540;

    const container = this.add.container(0, 0).setDepth(2500);
    this.recipesContainer = container;

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeRecipes());
    container.add(overlay);

    const card = this.add.rectangle(cx, cy, w, h, 0x1a1c2f, 1)
      .setStrokeStyle(2, 0xffaa66)
      .setInteractive();
    card.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());
    container.add(card);

    container.add(this.add.text(cx, cy - h / 2 + 26, '뽑기 확률', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffaa66',
    }).setOrigin(0.5));

    const colW = w / 2;
    const leftX = cx - colW / 2;
    const rightX = cx + colW / 2;
    const startY = cy - h / 2 + 70;

    // 기본 뽑기
    container.add(this.add.text(leftX, startY, '기본 뽑기 (10G)', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#6680ff',
    }).setOrigin(0.5));
    container.add(this.add.text(leftX, startY + 28, '전설/단독 합성 result 제외', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aab0d4',
    }).setOrigin(0.5));

    const basicRates = [
      { label: 'C (1성)', chance: '55%', color: '#9aa0c5' },
      { label: 'U (2성)', chance: '30%', color: '#66cc66' },
      { label: 'R (3성)', chance: '11%', color: '#4488ff' },
      { label: 'E (4성)', chance: '3.5%', color: '#aa55ee' },
      { label: 'L (5성)', chance: '0.5%', color: '#ff9933' },
    ];
    for (let i = 0; i < basicRates.length; i++) {
      const y = startY + 60 + i * 30;
      container.add(this.add.text(leftX - 80, y, basicRates[i].label, {
        fontFamily: 'monospace', fontSize: '14px', color: basicRates[i].color,
      }).setOrigin(0, 0.5));
      container.add(this.add.text(leftX + 80, y, basicRates[i].chance, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ddddee',
      }).setOrigin(1, 0.5));
    }

    // 고급 뽑기
    container.add(this.add.text(rightX, startY, '고급 뽑기 (50G)', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#aa66ff',
    }).setOrigin(0.5));
    container.add(this.add.text(rightX, startY + 28, '전설 제외 · 단독 result + 2~4성', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aab0d4',
    }).setOrigin(0.5));

    const advRates = [
      { label: '단독 합성 result (20종)', chance: '40%', color: '#ffd34d' },
      { label: '2성 기본 풀', chance: '33%', color: '#66cc66' },
      { label: '3성 기본 풀', chance: '20%', color: '#4488ff' },
      { label: '4성 기본 풀', chance: '7%', color: '#aa55ee' },
    ];
    for (let i = 0; i < advRates.length; i++) {
      const y = startY + 60 + i * 30;
      container.add(this.add.text(rightX - 120, y, advRates[i].label, {
        fontFamily: 'monospace', fontSize: '13px', color: advRates[i].color,
      }).setOrigin(0, 0.5));
      container.add(this.add.text(rightX + 120, y, advRates[i].chance, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ddddee',
      }).setOrigin(1, 0.5));
    }

    // 하단 안내
    const noteY = cy + h / 2 - 80;
    container.add(this.add.text(cx, noteY, '※ 전설/신화는 조합으로만 획득 가능', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff9933',
    }).setOrigin(0.5));
    container.add(this.add.text(cx, noteY + 20, '※ 단독 합성 result: 잠만보/마그마/쁘사이저/롱스톤 등 20종', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aab0d4',
    }).setOrigin(0.5));

    // pager
    const pagerY = cy + h / 2 - 26;
    const prevBg = this.add.rectangle(cx - 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    prevBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(-1);
    });
    const prevText = this.add.text(cx - 80, pagerY, '‹', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);

    const pageText = this.add.text(cx, pagerY, `${this.recipesPageIndex + 1} / ${RECIPE_PAGES.length + 4}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddddee',
    }).setOrigin(0.5);

    const nextBg = this.add.rectangle(cx + 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    nextBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(1);
    });
    const nextText = this.add.text(cx + 80, pagerY, '›', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);
    container.add([prevBg, prevText, pageText, nextBg, nextText]);

    const closeBg = this.add.rectangle(cx + w / 2 - 22, cy - h / 2 + 22, 32, 32, 0x4a1a1a, 1)
      .setStrokeStyle(2, 0xff5577)
      .setInteractive({ useHandCursor: true });
    closeBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeRecipes();
    });
    const closeText = this.add.text(cx + w / 2 - 22, cy - h / 2 + 22, 'X', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff5577',
    }).setOrigin(0.5);
    container.add([closeBg, closeText]);
  }

  private renderSynergyPage() {
    const cx = GAME_WIDTH / 2;
    const cy = (HUD_HEIGHT + GAME_HEIGHT - CONTROL_HEIGHT) / 2;
    const w = 980;
    const h = 540;

    const container = this.add.container(0, 0).setDepth(2500);
    this.recipesContainer = container;

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeRecipes());
    container.add(overlay);

    const card = this.add.rectangle(cx, cy, w, h, 0x1a1c2f, 1)
      .setStrokeStyle(2, 0x66ddff)
      .setInteractive();
    card.on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event.stopPropagation());
    container.add(card);

    container.add(this.add.text(cx, cy - h / 2 + 26, '시너지', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#66ddff',
    }).setOrigin(0.5));

    container.add(this.add.text(cx, cy - h / 2 + 50, '특정 조합이 필드에 있으면 자동 발동 (공격/체력/속도 버프)', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aab0d4',
    }).setOrigin(0.5));

    const active = this.grid.updateSynergies();
    const activeIds = new Set(active.map((a) => a.group.id));

    const rowHeight = 62;
    const startY = cy - h / 2 + 90;
    const leftX = cx - w / 2 + 30;

    for (let i = 0; i < SYNERGY_GROUPS.length; i++) {
      const g = SYNERGY_GROUPS[i];
      const yPos = startY + i * rowHeight;
      const on = activeIds.has(g.id);

      const rowBg = this.add.rectangle(cx, yPos + 8, w - 40, rowHeight - 8, on ? 0x1a3a3a : 0x232540, on ? 0.6 : 0.4)
        .setStrokeStyle(1, on ? 0x66ddff : 0x44476a, 0.8);
      container.add(rowBg);

      // member sprites (왼쪽, 최대 8개)
      const maxShow = Math.min(g.memberIds.length, 8);
      for (let k = 0; k < maxShow; k++) {
        const mid = g.memberIds[k];
        if (this.textures.exists(getSpriteKey(mid))) {
          const img = this.add.image(leftX + k * 34, yPos + 8, getSpriteKey(mid)).setScale(0.55);
          img.setAlpha(on ? 1 : 0.4);
          container.add(img);
        }
      }

      // 이름
      const nameX = leftX + maxShow * 34 + 12;
      container.add(this.add.text(nameX, yPos, g.name, {
        fontFamily: 'sans-serif', fontSize: '14px', color: on ? '#ffd34d' : '#aab0d4',
      }).setOrigin(0, 0.5));

      // 설명
      container.add(this.add.text(nameX, yPos + 18, g.description, {
        fontFamily: 'monospace', fontSize: '10px', color: on ? '#7afcc9' : '#8890a8',
      }).setOrigin(0, 0.5));

      // 활성 뱃지
      const badgeColor = on ? 0x66ddff : 0x44476a;
      const badgeBg = this.add.rectangle(cx + w / 2 - 60, yPos + 8, 70, 26, badgeColor, on ? 1 : 0.3)
        .setStrokeStyle(1, badgeColor, 1);
      const badgeText = this.add.text(cx + w / 2 - 60, yPos + 8, on ? 'ON' : 'OFF', {
        fontFamily: 'monospace', fontSize: '12px', color: on ? '#07080f' : '#aab0d4',
      }).setOrigin(0.5);
      container.add([badgeBg, badgeText]);
    }

    // pager
    const pagerY = cy + h / 2 - 26;
    const prevBg = this.add.rectangle(cx - 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    prevBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(-1);
    });
    const prevText = this.add.text(cx - 80, pagerY, '‹', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);

    const pageText = this.add.text(cx, pagerY, `${this.recipesPageIndex + 1} / ${RECIPE_PAGES.length + 4}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddddee',
    }).setOrigin(0.5);

    const nextBg = this.add.rectangle(cx + 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    nextBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(1);
    });
    const nextText = this.add.text(cx + 80, pagerY, '›', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);

    container.add([prevBg, prevText, pageText, nextBg, nextText]);

    const closeBg = this.add.rectangle(cx + w / 2 - 22, cy - h / 2 + 22, 32, 32, 0x4a1a1a, 1)
      .setStrokeStyle(2, 0xff5577)
      .setInteractive({ useHandCursor: true });
    closeBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeRecipes();
    });
    const closeText = this.add.text(cx + w / 2 - 22, cy - h / 2 + 22, 'X', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff5577',
    }).setOrigin(0.5);
    container.add([closeBg, closeText]);
  }

  private renderDexPage() {
    const cx = GAME_WIDTH / 2;
    const cy = (HUD_HEIGHT + GAME_HEIGHT - CONTROL_HEIGHT) / 2;
    const w = 980;
    const h = 540;

    const container = this.add.container(0, 0).setDepth(2500);
    this.recipesContainer = container;

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeRecipes());
    container.add(overlay);

    const card = this.add.rectangle(cx, cy, w, h, 0x1a1c2f, 1)
      .setStrokeStyle(2, 0x66ff99)
      .setInteractive();
    card.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());
    container.add(card);

    const dex = this.state.dex;
    const total = ALL_POKEMON_IDS.length;
    const acquired = ALL_POKEMON_IDS.filter((id) => dex.has(id)).length;

    container.add(this.add.text(cx, cy - h / 2 + 26, '포켓몬 도감', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#66ff99',
    }).setOrigin(0.5));
    container.add(this.add.text(cx, cy - h / 2 + 52, `${acquired} / ${total}  (${Math.floor(acquired / total * 100)}%)`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddddee',
    }).setOrigin(0.5));

    // 그리드: 14열 × 행수 (모달 내 fit)
    const cols = 14;
    const cellSize = 48;
    const gridW = cols * cellSize;
    const startX = cx - gridW / 2 + cellSize / 2;
    const startY = cy - h / 2 + 82;

    for (let i = 0; i < ALL_POKEMON_IDS.length; i++) {
      const id = ALL_POKEMON_IDS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellSize;
      const y = startY + row * cellSize;
      const has = dex.has(id);

      const bg = this.add.rectangle(x, y, cellSize - 4, cellSize - 4, has ? 0x2a3a4a : 0x151625, 1)
        .setStrokeStyle(1, has ? 0x66ff99 : 0x333344, 0.8);
      container.add(bg);

      if (this.textures.exists(getSpriteKey(id))) {
        const img = this.add.image(x, y, getSpriteKey(id)).setScale(0.42);
        if (!has) {
          img.setTint(0x000000);
          img.setAlpha(0.75);
        }
        container.add(img);
      }
    }

    // pager
    const pagerY = cy + h / 2 - 26;
    const prevBg = this.add.rectangle(cx - 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    prevBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(-1);
    });
    const prevText = this.add.text(cx - 80, pagerY, '‹', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);

    const pageText = this.add.text(cx, pagerY, `${this.recipesPageIndex + 1} / ${RECIPE_PAGES.length + 4}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddddee',
    }).setOrigin(0.5);

    const nextBg = this.add.rectangle(cx + 80, pagerY, 32, 28, 0x2a2f55)
      .setStrokeStyle(2, 0x6680ff)
      .setInteractive({ useHandCursor: true });
    nextBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(1);
    });
    const nextText = this.add.text(cx + 80, pagerY, '›', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aab0ff',
    }).setOrigin(0.5);
    container.add([prevBg, prevText, pageText, nextBg, nextText]);

    const closeBg = this.add.rectangle(cx + w / 2 - 22, cy - h / 2 + 22, 32, 32, 0x4a1a1a, 1)
      .setStrokeStyle(2, 0xff5577)
      .setInteractive({ useHandCursor: true });
    closeBg.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeRecipes();
    });
    const closeText = this.add.text(cx + w / 2 - 22, cy - h / 2 + 22, 'X', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff5577',
    }).setOrigin(0.5);
    container.add([closeBg, closeText]);
  }

  private renderAchievementsPage() {
    const cx = GAME_WIDTH / 2;
    const cy = (HUD_HEIGHT + GAME_HEIGHT - CONTROL_HEIGHT) / 2;
    const w = 980;
    const h = 540;
    const res = Math.max(2, Math.floor(window.devicePixelRatio || 1));

    const container = this.add.container(0, 0).setDepth(2500);
    this.recipesContainer = container;

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.on('pointerdown', () => this.closeRecipes());
    container.add(overlay);

    // 둥근 메인 카드
    const cardGfx = this.add.graphics();
    cardGfx.fillStyle(0x0f1224, 1);
    cardGfx.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 18);
    cardGfx.lineStyle(2, 0xffcb05, 0.5);
    cardGfx.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 18);
    const card = this.add.rectangle(cx, cy, w, h, 0x000000, 0).setInteractive();
    card.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());
    container.add([cardGfx, card]);

    const unlocked = this.state.achievements;
    const total = ACHIEVEMENTS.length;
    const got = unlocked.size;
    const pct = Math.floor((got / total) * 100);

    // 타이틀
    container.add(this.add.text(cx, cy - h / 2 + 30, '🏆  업 적', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffcb05', fontStyle: 'bold',
    }).setOrigin(0.5).setResolution(res));

    // 프로그레스 바
    const barX = cx - 200;
    const barY = cy - h / 2 + 62;
    const barW = 400;
    const barH = 16;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1a1d30, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, barH / 2);
    barBg.lineStyle(1, 0x2a2d45, 1);
    barBg.strokeRoundedRect(barX, barY, barW, barH, barH / 2);
    container.add(barBg);

    if (got > 0) {
      const barFill = this.add.graphics();
      const fillW = Math.max(barH, (barW - 2) * (got / total));
      barFill.fillGradientStyle(0xffcb05, 0xffe357, 0xf0a800, 0xffcb05, 1);
      barFill.fillRoundedRect(barX + 1, barY + 1, fillW, barH - 2, (barH - 2) / 2);
      container.add(barFill);
    }

    container.add(this.add.text(cx, barY + barH / 2, `${got} / ${total}  ·  ${pct}%`, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setResolution(res));

    // 3열 그리드
    const cols = 3;
    const gap = 8;
    const gridTop = cy - h / 2 + 92;
    const gridBottom = cy + h / 2 - 48;
    const gridH = gridBottom - gridTop;
    const rows = Math.ceil(ACHIEVEMENTS.length / cols);
    const cardH = Math.floor((gridH - (rows - 1) * gap) / rows);
    const innerW = w - 28;
    const cardW = Math.floor((innerW - (cols - 1) * gap) / cols);
    const gridLeft = cx - w / 2 + 14;

    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      const ach = ACHIEVEMENTS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridLeft + col * (cardW + gap);
      const y = gridTop + row * (cardH + gap);
      const got_ = unlocked.has(ach.id);

      // 카드 배경 (둥근)
      const cg = this.add.graphics();
      if (got_) {
        cg.fillStyle(0x2a2510, 1);
        cg.fillRoundedRect(x, y, cardW, cardH, 10);
        cg.lineStyle(1.5, 0xffcb05, 0.75);
        cg.strokeRoundedRect(x, y, cardW, cardH, 10);
        // 글로우
        cg.fillStyle(0xffcb05, 0.04);
        cg.fillRoundedRect(x + 2, y + 2, cardW - 4, cardH - 4, 8);
      } else {
        cg.fillStyle(0x14162a, 1);
        cg.fillRoundedRect(x, y, cardW, cardH, 10);
        cg.lineStyle(1, 0x2a2d45, 1);
        cg.strokeRoundedRect(x, y, cardW, cardH, 10);
      }
      container.add(cg);

      // 아이콘 배경 원
      const iconCX = x + 26;
      const iconCY = y + cardH / 2;
      const iconBg = this.add.graphics();
      if (got_) {
        iconBg.fillStyle(0xffcb05, 0.18);
        iconBg.fillCircle(iconCX, iconCY, 18);
      } else {
        iconBg.fillStyle(0x1a1d35, 1);
        iconBg.fillCircle(iconCX, iconCY, 18);
      }
      container.add(iconBg);

      // 아이콘
      const icon = this.add.text(iconCX, iconCY, ach.icon, {
        fontFamily: 'sans-serif', fontSize: '20px',
      }).setOrigin(0.5).setResolution(res);
      if (!got_) icon.setAlpha(0.4);
      container.add(icon);

      // 이름
      const nameText = this.add.text(x + 52, y + cardH / 2 - 10, ach.name, {
        fontFamily: 'sans-serif', fontSize: '13px',
        color: got_ ? '#ffd760' : '#8a8fad',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setResolution(res);
      container.add(nameText);

      // 설명
      const descText = this.add.text(x + 52, y + cardH / 2 + 9, ach.description, {
        fontFamily: 'sans-serif', fontSize: '10px',
        color: got_ ? '#c8cce8' : '#5a5d75',
      }).setOrigin(0, 0.5).setResolution(res);
      container.add(descText);

      // 달성/잠금 표시
      if (got_) {
        const checkBg = this.add.graphics();
        checkBg.fillStyle(0x4ade80, 0.18);
        checkBg.fillCircle(x + cardW - 14, y + 13, 8);
        container.add(checkBg);
        const check = this.add.text(x + cardW - 14, y + 13, '✓', {
          fontFamily: 'sans-serif', fontSize: '11px',
          color: '#4ade80', fontStyle: 'bold',
        }).setOrigin(0.5).setResolution(res);
        container.add(check);
      }
    }

    // pager
    const pagerY = cy + h / 2 - 24;
    const prevGfx = this.add.graphics();
    prevGfx.fillStyle(0x1f2340, 1);
    prevGfx.fillRoundedRect(cx - 96, pagerY - 14, 32, 28, 6);
    prevGfx.lineStyle(1.5, 0x6680ff, 0.7);
    prevGfx.strokeRoundedRect(cx - 96, pagerY - 14, 32, 28, 6);
    const prevHit = this.add.rectangle(cx - 80, pagerY, 32, 28, 0x000000, 0).setInteractive({ useHandCursor: true });
    prevHit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(-1);
    });
    const prevText = this.add.text(cx - 80, pagerY, '‹', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#aab0ff', fontStyle: 'bold',
    }).setOrigin(0.5).setResolution(res);

    const pageText = this.add.text(cx, pagerY, `${this.recipesPageIndex + 1} / ${RECIPE_PAGES.length + 4}`, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#ddddee', fontStyle: 'bold',
    }).setOrigin(0.5).setResolution(res);

    const nextGfx = this.add.graphics();
    nextGfx.fillStyle(0x1f2340, 1);
    nextGfx.fillRoundedRect(cx + 64, pagerY - 14, 32, 28, 6);
    nextGfx.lineStyle(1.5, 0x6680ff, 0.7);
    nextGfx.strokeRoundedRect(cx + 64, pagerY - 14, 32, 28, 6);
    const nextHit = this.add.rectangle(cx + 80, pagerY, 32, 28, 0x000000, 0).setInteractive({ useHandCursor: true });
    nextHit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.shiftRecipesPage(1);
    });
    const nextText = this.add.text(cx + 80, pagerY, '›', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#aab0ff', fontStyle: 'bold',
    }).setOrigin(0.5).setResolution(res);
    container.add([prevGfx, prevHit, prevText, pageText, nextGfx, nextHit, nextText]);

    // 닫기
    const closeGfx = this.add.graphics();
    closeGfx.fillStyle(0x3a1420, 1);
    closeGfx.fillRoundedRect(cx + w / 2 - 40, cy - h / 2 + 8, 32, 32, 8);
    closeGfx.lineStyle(1.5, 0xff5577, 0.7);
    closeGfx.strokeRoundedRect(cx + w / 2 - 40, cy - h / 2 + 8, 32, 32, 8);
    const closeHit = this.add.rectangle(cx + w / 2 - 24, cy - h / 2 + 24, 32, 32, 0x000000, 0).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeRecipes();
    });
    const closeText = this.add.text(cx + w / 2 - 24, cy - h / 2 + 24, '✕', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#ff5577', fontStyle: 'bold',
    }).setOrigin(0.5).setResolution(res);
    container.add([closeGfx, closeHit, closeText]);
  }
}
