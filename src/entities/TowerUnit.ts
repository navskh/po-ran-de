import Phaser from 'phaser';
import { CELL_W, CELL_H, getBuffAt } from '../game/balance';
import { IPokemon, getSpriteKey, RARITY_COLORS, getMaxLevel } from '../data/pokemonData';

export class TowerUnit extends Phaser.GameObjects.Container {
  pokemon: IPokemon;
  level = 1;
  extraStars = 0;
  col: number;
  row: number;
  hpCurrent: number;
  bg!: Phaser.GameObjects.Rectangle;
  isMerging = false;
  buffAttack = 1;
  buffHp = 1;
  buffAttackSpeed = 1;
  // 셀 버프 (보너스 셀에 배치됐을 때)
  cellBuffAttack = 1;
  cellBuffRange = 1;
  cellBuffSpeed = 1;
  // 영구 업그레이드 (등급별)
  permAttack = 1;
  permRange = 1;
  permSpeed = 1;
  private sprite?: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private starsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private buffMark?: Phaser.GameObjects.Text;
  private lastAttackAt = 0;
  private rangeCircle?: Phaser.GameObjects.Arc;
  private didDrag = false;
  private longPressTimer?: Phaser.Time.TimerEvent;
  private longPressFired = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    pokemon: IPokemon,
    col: number,
    row: number,
  ) {
    super(scene, x, y);
    this.pokemon = pokemon;
    this.col = col;
    this.row = row;
    this.hpCurrent = pokemon.hp;
    this.buildVisual(scene);

    this.bg.setData('unit', this);
    this.bg.setInteractive({ useHandCursor: true, draggable: true });
    this.bg.on('pointerover', () => this.setHover(true));
    this.bg.on('pointerout', () => this.setHover(false));
    this.bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.didDrag = false;
      this.longPressFired = false;
      if (pointer.rightButtonDown()) {
        scene.events.emit('unitRightClick', this);
        return;
      }
      // Long-press (500ms): 모바일 우클릭 대체 = 버리기
      this.longPressTimer = scene.time.delayedCall(500, () => {
        this.longPressFired = true;
        this.longPressTimer = undefined;
        scene.events.emit('unitRightClick', this);
      });
    });
    this.bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.longPressTimer) {
        this.longPressTimer.remove();
        this.longPressTimer = undefined;
      }
      if (pointer.rightButtonReleased()) return;
      if (this.longPressFired) return;
      if (!this.didDrag) {
        scene.events.emit('unitClick', this);
      }
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.rangeCircle?.destroy();
    });

    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  markDragStarted() {
    this.didDrag = true;
    if (this.longPressTimer) {
      this.longPressTimer.remove();
      this.longPressTimer = undefined;
    }
    this.longPressFired = false;
    this.setHover(false);
  }

  setHover(on: boolean) {
    const rarityColor = RARITY_COLORS[this.pokemon.rarity];
    if (on) {
      this.bg.setFillStyle(rarityColor, 0.4);
      this.bg.setStrokeStyle(3, rarityColor, 1.0);
      if (!this.rangeCircle && this.scene) {
        this.rangeCircle = this.scene.add.circle(this.x, this.y, this.computeRange(), 0xffeebb, 0.06)
          .setStrokeStyle(2, 0xffeebb, 0.5)
          .setDepth(60);
      }
    } else {
      this.bg.setFillStyle(rarityColor, 0.18);
      this.bg.setStrokeStyle(2, rarityColor, 0.85);
      if (this.rangeCircle) {
        this.rangeCircle.destroy();
        this.rangeCircle = undefined;
      }
    }
  }

  syncRangeCircle() {
    if (this.rangeCircle) {
      this.rangeCircle.setPosition(this.x, this.y);
    }
  }

  private buildVisual(scene: Phaser.Scene) {
    const rarityColor = RARITY_COLORS[this.pokemon.rarity];
    this.bg = scene.add.rectangle(0, 0, CELL_W - 6, CELL_H - 6, rarityColor, 0.18)
      .setStrokeStyle(2, rarityColor, 0.85);
    this.add(this.bg);

    if (scene.textures.exists(getSpriteKey(this.pokemon.id))) {
      this.sprite = scene.add.image(0, -14, getSpriteKey(this.pokemon.id)).setScale(1.0);
      this.add(this.sprite);
    } else {
      const ph = scene.add.text(0, -14, '?', { fontSize: '36px', color: '#888' }).setOrigin(0.5);
      this.add(ph);
    }

    this.starsText = scene.add.text(0, -CELL_H / 2 + 10, '★'.repeat(this.pokemon.stage), {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#ffd34d',
    }).setOrigin(0.5);
    this.add(this.starsText);

    this.nameText = scene.add.text(0, 26, this.pokemon.ko, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.nameText);

    this.levelText = scene.add.text(0, 42, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ddddee',
    }).setOrigin(0.5);
    this.add(this.levelText);
    this.refreshLevelDisplay();
  }

  setCell(col: number, row: number, x: number, y: number, scale = 1) {
    this.col = col;
    this.row = row;
    this.setPosition(x, y);
    this.setScale(scale);
    this.applyCellBuff();
    this.syncRangeCircle();
  }

  applyCellBuff() {
    const buff = getBuffAt(this.col, this.row);
    this.cellBuffAttack = buff?.type === 'attack' ? buff.value : 1;
    this.cellBuffRange = buff?.type === 'range' ? buff.value : 1;
    this.cellBuffSpeed = buff?.type === 'attackSpeed' ? buff.value : 1;
    this.refreshBuffMark();
  }

  isMaxLevel(): boolean {
    return this.level >= getMaxLevel(this.pokemon.stage, this.pokemon.id);
  }

  maxLevel(): number {
    return getMaxLevel(this.pokemon.stage, this.pokemon.id);
  }

  canEvolve(): boolean {
    return this.isMaxLevel() && this.pokemon.evolvesTo !== null;
  }

  levelUp() {
    if (!this.isMaxLevel()) {
      this.level += 1;
      this.hpCurrent = this.computeHp();
      this.refreshLevelDisplay();
    }
  }

  setLevel(newLevel: number) {
    this.level = Math.max(1, Math.min(newLevel, this.maxLevel()));
    this.hpCurrent = this.computeHp();
    this.refreshLevelDisplay();
  }

  addStar() {
    this.extraStars += 1;
    this.hpCurrent = this.computeHp();
    this.starsText.setText('★'.repeat(this.effectiveStage()));
    this.refreshLevelDisplay();
  }

  setStars(n: number) {
    this.extraStars = Math.max(0, n);
    this.hpCurrent = this.computeHp();
    this.starsText.setText('★'.repeat(this.effectiveStage()));
    this.refreshLevelDisplay();
  }

  inherit(level: number, stars: number) {
    this.extraStars = stars;
    this.level = Math.max(1, Math.min(level, this.maxLevel()));
    this.hpCurrent = this.computeHp();
    this.starsText.setText('★'.repeat(this.effectiveStage()));
    this.refreshLevelDisplay();
  }

  effectiveStage(): number {
    return this.pokemon.stage + this.extraStars;
  }

  evolveTo(newPokemon: IPokemon) {
    this.pokemon = newPokemon;
    this.level = 1;
    this.extraStars = 0;
    this.hpCurrent = this.computeHp();
    const rarityColor = RARITY_COLORS[newPokemon.rarity];
    this.bg.setFillStyle(rarityColor, 0.18);
    this.bg.setStrokeStyle(2, rarityColor, 0.95);
    if (this.sprite && this.scene.textures.exists(getSpriteKey(newPokemon.id))) {
      this.sprite.setTexture(getSpriteKey(newPokemon.id));
    }
    this.nameText.setText(newPokemon.ko);
    this.starsText.setText('★'.repeat(this.effectiveStage()));
    this.refreshLevelDisplay();
    this.scene.events.emit('unitEvolved', this);
  }

  private refreshLevelDisplay() {
    if (this.canEvolve()) {
      this.levelText.setColor('#ffd34d');
      this.levelText.setText(`Lv ${this.level} ↑`);
    } else if (this.isMaxLevel()) {
      this.levelText.setColor('#aab0d4');
      this.levelText.setText(`Lv ${this.level} MAX`);
    } else {
      this.levelText.setColor('#ddddee');
      this.levelText.setText(`Lv ${this.level}/${this.maxLevel()}`);
    }
  }

  computeAttack(): number {
    const lvBonus = 1 + (this.level - 1) * 0.18;
    const starBonus = 1 + this.extraStars * 0.4;
    return Math.floor(this.pokemon.attack * lvBonus * starBonus * this.buffAttack * this.cellBuffAttack * this.permAttack);
  }

  computeHp(): number {
    const lvBonus = 1 + (this.level - 1) * 0.15;
    const starBonus = 1 + this.extraStars * 0.3;
    return Math.floor(this.pokemon.hp * lvBonus * starBonus * this.buffHp);
  }

  computeRange(): number {
    return Math.floor(this.pokemon.range * this.cellBuffRange * this.permRange);
  }

  canAttack(now: number): boolean {
    const cooldownMs = 1000 / (this.pokemon.attackSpeed * this.buffAttackSpeed * this.cellBuffSpeed * this.permSpeed);
    return now - this.lastAttackAt >= cooldownMs;
  }

  setPermUpgrade(atkMul: number, rngMul: number, spdMul: number) {
    this.permAttack = atkMul;
    this.permRange = rngMul;
    this.permSpeed = spdMul;
  }

  setBuff(atk: number, hp: number, spd: number) {
    const prevMaxHp = this.computeHp();
    this.buffAttack = atk;
    this.buffHp = hp;
    this.buffAttackSpeed = spd;
    const newMaxHp = this.computeHp();
    const ratio = prevMaxHp > 0 ? this.hpCurrent / prevMaxHp : 1;
    this.hpCurrent = Math.min(newMaxHp, Math.max(1, Math.floor(newMaxHp * ratio)));
    this.refreshBuffMark();
  }

  private refreshBuffMark() {
    const hasBuff = this.buffAttack > 1.001 || this.buffHp > 1.001 || this.buffAttackSpeed > 1.001
      || this.cellBuffAttack > 1.001 || this.cellBuffRange > 1.001 || this.cellBuffSpeed > 1.001;
    if (hasBuff) {
      if (!this.buffMark && this.scene) {
        this.buffMark = this.scene.add.text(CELL_W / 2 - 10, -CELL_H / 2 + 8, '⚡', {
          fontFamily: 'sans-serif', fontSize: '14px', color: '#ffd34d',
        }).setOrigin(0.5);
        this.add(this.buffMark);
      } else if (this.buffMark) {
        this.buffMark.setVisible(true);
      }
    } else if (this.buffMark) {
      this.buffMark.setVisible(false);
    }
  }

  markAttacked(now: number) {
    this.lastAttackAt = now;
  }
}
