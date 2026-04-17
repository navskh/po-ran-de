import Phaser from 'phaser';
import { IPokemon, getSpriteKey } from '../data/pokemonData';

export interface IEnemySpawnOpts {
  hp: number;
  speed: number;
  isBoss?: boolean;
}

const _tmpPoint = new Phaser.Math.Vector2();
const _tmpTangent = new Phaser.Math.Vector2();

export class EnemyPokemon extends Phaser.GameObjects.Container {
  pokemon: IPokemon;
  hpMax: number;
  hpCurrent: number;
  speed: number;
  isBoss: boolean;
  isDead = false;
  reachedEnd = false;
  private path: Phaser.Curves.Path;
  private pathLength: number;
  private pathProgress = 0;
  private sprite?: Phaser.GameObjects.Image;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private barWidth: number;

  constructor(
    scene: Phaser.Scene,
    pokemon: IPokemon,
    path: Phaser.Curves.Path,
    opts: IEnemySpawnOpts,
  ) {
    const start = path.getStartPoint();
    super(scene, start.x, start.y);
    this.pokemon = pokemon;
    this.path = path;
    this.pathLength = path.getLength();
    this.hpMax = opts.hp;
    this.hpCurrent = opts.hp;
    this.speed = opts.speed;
    this.isBoss = opts.isBoss ?? false;
    this.barWidth = this.isBoss ? 96 : 50;
    this.buildVisual(scene);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  private buildVisual(scene: Phaser.Scene) {
    if (scene.textures.exists(getSpriteKey(this.pokemon.id))) {
      this.sprite = scene.add.image(0, 0, getSpriteKey(this.pokemon.id));
      this.sprite.setScale(this.isBoss ? 1.8 : 1.0);
      this.sprite.setFlipX(true);
      this.add(this.sprite);
    } else {
      const ph = scene.add.text(0, 0, '?', { fontSize: '32px', color: '#ff6666' }).setOrigin(0.5);
      this.add(ph);
    }

    const barY = this.isBoss ? -42 : -28;
    this.hpBarBg = scene.add.rectangle(0, barY, this.barWidth, 7, 0x222233).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-this.barWidth / 2, barY, this.barWidth, 5, 0x66ff88).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);

    if (this.isBoss) {
      const label = scene.add.text(0, -56, `BOSS  ${this.pokemon.ko}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffaa44',
      }).setOrigin(0.5);
      this.add(label);
    }
  }

  tick(deltaMs: number) {
    if (this.isDead) return;
    this.pathProgress += (this.speed * deltaMs / 1000) / this.pathLength;
    if (this.pathProgress >= 1) {
      this.reachedEnd = true;
      return;
    }
    this.path.getPoint(this.pathProgress, _tmpPoint);
    this.x = _tmpPoint.x;
    this.y = _tmpPoint.y;
    if (this.sprite) {
      this.path.getTangent(this.pathProgress, _tmpTangent);
      if (Math.abs(_tmpTangent.x) > 0.2) {
        this.sprite.setFlipX(_tmpTangent.x < 0);
      }
    }
  }

  takeDamage(amount: number) {
    if (this.isDead) return;
    this.hpCurrent = Math.max(0, this.hpCurrent - amount);
    const ratio = this.hpCurrent / this.hpMax;
    this.hpBar.width = this.barWidth * ratio;
    if (ratio > 0.5) this.hpBar.setFillStyle(0x66ff88);
    else if (ratio > 0.25) this.hpBar.setFillStyle(0xffcc44);
    else this.hpBar.setFillStyle(0xff5555);
    if (this.hpCurrent <= 0) this.isDead = true;
  }
}
