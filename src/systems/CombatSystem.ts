import Phaser from 'phaser';
import { GridSystem } from './GridSystem';
import { WaveSystem } from './WaveSystem';
import { TowerUnit } from '../entities/TowerUnit';
import { EnemyPokemon } from '../entities/EnemyPokemon';
import { getTypeMultiplier, TYPE_COLORS, PokemonType } from '../data/typeChart';

function colorHexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

type AttackPattern = 'melee' | 'projectile' | 'beam' | 'splash';

const SPLASH_IDS = new Set([6, 9, 143, 144, 145, 146, 150, 151, 130, 149, 76, 75]);
const BEAM_IDS = new Set([63, 64, 65, 92, 93, 94, 132, 133, 134, 135, 136]);
const MELEE_TYPES = new Set<PokemonType>(['fighting', 'normal', 'rock', 'ground', 'bug']);

function getAttackPattern(unit: TowerUnit): AttackPattern {
  if (SPLASH_IDS.has(unit.pokemon.id)) return 'splash';
  if (BEAM_IDS.has(unit.pokemon.id)) return 'beam';
  const primary = unit.pokemon.types[0];
  if (MELEE_TYPES.has(primary)) return 'melee';
  return 'projectile';
}

const SPLASH_RADIUS = 70;

export class CombatSystem {
  constructor(
    private scene: Phaser.Scene,
    private grid: GridSystem,
    private wave: WaveSystem,
  ) {}

  update(time: number) {
    const towers = this.grid.getAllTowers();
    for (const tower of towers) {
      if (!tower.canAttack(time)) continue;
      const target = this.findTarget(tower);
      if (!target) continue;
      this.attack(tower, target, time);
    }
  }

  private playAttackMotion(tower: TowerUnit) {
    this.scene.tweens.killTweensOf(tower);
    tower.setScale(1);
    this.scene.tweens.add({
      targets: tower,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 70,
      yoyo: true,
      ease: 'Quad.out',
    });
  }

  private findTarget(tower: TowerUnit): EnemyPokemon | null {
    let target: EnemyPokemon | null = null;
    let minDist = Infinity;
    const range = tower.pokemon.range;
    for (const e of this.wave.enemies) {
      if (e.isDead) continue;
      const dx = e.x - tower.x;
      const dy = e.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= range && dist < minDist) {
        minDist = dist;
        target = e;
      }
    }
    return target;
  }

  private attack(tower: TowerUnit, target: EnemyPokemon, time: number) {
    tower.markAttacked(time);
    this.playAttackMotion(tower);

    const attackType: PokemonType = tower.pokemon.types[0];
    const mult = getTypeMultiplier(attackType, target.pokemon.types);
    const dmg = Math.max(1, Math.floor(tower.computeAttack() * mult));
    const pattern = getAttackPattern(tower);

    if (pattern === 'splash') {
      this.applySplash(tower, target, dmg, attackType);
    } else if (pattern === 'beam') {
      target.takeDamage(dmg);
      this.drawBeam(tower, target, attackType, mult);
      if (target.isDead) this.wave.killEnemy(target);
    } else if (pattern === 'melee') {
      target.takeDamage(dmg);
      this.drawMelee(tower, target, attackType);
      if (target.isDead) this.wave.killEnemy(target);
    } else {
      target.takeDamage(dmg);
      this.drawProjectile(tower, target, attackType);
      if (target.isDead) this.wave.killEnemy(target);
    }

    this.drawHitText(target, mult);
  }

  private applySplash(tower: TowerUnit, target: EnemyPokemon, dmg: number, attackType: PokemonType) {
    target.takeDamage(dmg);
    const aoeDmg = Math.floor(dmg * 0.5);
    for (const e of this.wave.enemies) {
      if (e === target || e.isDead) continue;
      const dx = e.x - target.x;
      const dy = e.y - target.y;
      if (dx * dx + dy * dy < SPLASH_RADIUS * SPLASH_RADIUS) {
        e.takeDamage(aoeDmg);
        if (e.isDead) this.wave.killEnemy(e);
      }
    }
    this.drawSplash(tower, target, attackType);
    if (target.isDead) this.wave.killEnemy(target);
  }

  private drawProjectile(tower: TowerUnit, target: EnemyPokemon, type: PokemonType) {
    const color = colorHexToInt(TYPE_COLORS[type]);
    const proj = this.scene.add.circle(tower.x, tower.y, 7, color, 1)
      .setStrokeStyle(2, 0xffffff, 0.7).setDepth(500);
    this.scene.tweens.add({
      targets: proj,
      x: target.x,
      y: target.y,
      duration: 220,
      onComplete: () => {
        proj.destroy();
        const burst = this.scene.add.circle(target.x, target.y, 8, color, 0.85).setDepth(550);
        this.scene.tweens.add({
          targets: burst, scale: 2.4, alpha: 0, duration: 260,
          onComplete: () => burst.destroy(),
        });
      },
    });
  }

  private drawBeam(tower: TowerUnit, target: EnemyPokemon, type: PokemonType, mult: number) {
    const color = colorHexToInt(TYPE_COLORS[type]);
    const beam = this.scene.add.line(0, 0, tower.x, tower.y, target.x, target.y, color, 1)
      .setLineWidth(mult >= 2 ? 5 : 3)
      .setOrigin(0, 0)
      .setDepth(500);
    this.scene.tweens.add({
      targets: beam, alpha: 0, duration: 260,
      onComplete: () => beam.destroy(),
    });
  }

  private drawMelee(tower: TowerUnit, target: EnemyPokemon, type: PokemonType) {
    const color = colorHexToInt(TYPE_COLORS[type]);
    const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    const slashLen = 28;
    const cx = target.x;
    const cy = target.y;
    const sx1 = cx + Math.cos(angle - 0.6) * slashLen;
    const sy1 = cy + Math.sin(angle - 0.6) * slashLen;
    const sx2 = cx + Math.cos(angle + Math.PI - 0.6) * slashLen;
    const sy2 = cy + Math.sin(angle + Math.PI - 0.6) * slashLen;
    const slash = this.scene.add.line(0, 0, sx1, sy1, sx2, sy2, color, 1)
      .setLineWidth(4).setOrigin(0, 0).setDepth(500);
    this.scene.tweens.add({
      targets: slash, alpha: 0, duration: 200,
      onComplete: () => slash.destroy(),
    });
    const sx3 = cx + Math.cos(angle + 0.6) * slashLen;
    const sy3 = cy + Math.sin(angle + 0.6) * slashLen;
    const sx4 = cx + Math.cos(angle + Math.PI + 0.6) * slashLen;
    const sy4 = cy + Math.sin(angle + Math.PI + 0.6) * slashLen;
    const slash2 = this.scene.add.line(0, 0, sx3, sy3, sx4, sy4, color, 1)
      .setLineWidth(4).setOrigin(0, 0).setDepth(500);
    this.scene.tweens.add({
      targets: slash2, alpha: 0, duration: 200,
      onComplete: () => slash2.destroy(),
    });
  }

  private drawSplash(tower: TowerUnit, target: EnemyPokemon, type: PokemonType) {
    const color = colorHexToInt(TYPE_COLORS[type]);
    const proj = this.scene.add.circle(tower.x, tower.y, 10, color, 1)
      .setStrokeStyle(2, 0xffffff, 0.7).setDepth(500);
    this.scene.tweens.add({
      targets: proj,
      x: target.x,
      y: target.y,
      duration: 240,
      onComplete: () => {
        proj.destroy();
        const burst = this.scene.add.circle(target.x, target.y, 14, color, 0.7).setDepth(550);
        this.scene.tweens.add({
          targets: burst, scale: 5, alpha: 0, duration: 420,
          onComplete: () => burst.destroy(),
        });
        const ring = this.scene.add.circle(target.x, target.y, SPLASH_RADIUS, color, 0)
          .setStrokeStyle(3, color, 0.9).setDepth(540);
        this.scene.tweens.add({
          targets: ring, scale: 1.1, alpha: 0, duration: 420,
          onComplete: () => ring.destroy(),
        });
      },
    });
  }

  private drawHitText(target: EnemyPokemon, mult: number) {
    if (mult === 1) return;
    const label = mult >= 2 ? '효과 굉장' : mult === 0 ? '효과 없음' : '효과 별로';
    const labelColor = mult >= 2 ? '#ffaa00' : '#888888';
    const t = this.scene.add.text(target.x, target.y - 50, label, {
      fontFamily: 'sans-serif', fontSize: '11px', color: labelColor,
    }).setOrigin(0.5).setDepth(700);
    this.scene.tweens.add({
      targets: t, y: target.y - 70, alpha: 0, duration: 700,
      onComplete: () => t.destroy(),
    });
  }
}
