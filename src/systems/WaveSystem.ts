import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { EnemyPokemon } from '../entities/EnemyPokemon';
import { getPokemon } from '../data/pokemonData';
import { ENEMY_BASE_SPEED, SPAWN_INTERVAL_MS, ENEMY_KILL_GOLD } from '../game/balance';

interface IWaveConfig {
  count: number;
  pool: number[];
  hpMult: number;
  speedMult: number;
  bossId?: number;
  bossHpMult?: number;
}

export const WAVES: IWaveConfig[] = [
  { count: 8,  pool: [16, 19],             hpMult: 1.0,  speedMult: 1.0 },
  { count: 10, pool: [16, 19, 10],         hpMult: 1.2,  speedMult: 1.0 },
  { count: 10, pool: [10, 13, 19],         hpMult: 1.4,  speedMult: 1.05 },
  { count: 12, pool: [16, 19, 25],         hpMult: 1.6,  speedMult: 1.1 },
  { count: 1,  pool: [],                   hpMult: 1.0,  speedMult: 0.55, bossId: 143, bossHpMult: 14 },
  { count: 12, pool: [10, 13, 50, 60],     hpMult: 1.9,  speedMult: 1.15 },
  { count: 14, pool: [25, 39, 35, 60],     hpMult: 2.2,  speedMult: 1.2 },
  { count: 14, pool: [60, 25, 92, 50],     hpMult: 2.6,  speedMult: 1.25 },
  { count: 15, pool: [92, 25, 39, 66],     hpMult: 3.0,  speedMult: 1.3 },
  { count: 1,  pool: [],                   hpMult: 1.0,  speedMult: 0.5,  bossId: 150, bossHpMult: 45 },
  { count: 16, pool: [60, 92, 66, 74, 25], hpMult: 3.5,  speedMult: 1.35 },
  { count: 16, pool: [92, 74, 50, 60, 25], hpMult: 4.0,  speedMult: 1.4 },
  { count: 18, pool: [25, 92, 66, 74, 60], hpMult: 4.5,  speedMult: 1.45 },
  { count: 18, pool: [92, 25, 39, 60, 74], hpMult: 5.0,  speedMult: 1.5 },
  { count: 1,  pool: [],                   hpMult: 1.0,  speedMult: 0.45, bossId: 151, bossHpMult: 75 },
  { count: 18, pool: [10, 13, 16, 19, 25],     hpMult: 5.5,  speedMult: 1.5 },
  { count: 20, pool: [60, 50, 92, 66, 74],     hpMult: 6.0,  speedMult: 1.55 },
  { count: 20, pool: [25, 39, 35, 92, 74],     hpMult: 6.5,  speedMult: 1.6 },
  { count: 22, pool: [60, 25, 92, 50, 74, 66], hpMult: 7.0,  speedMult: 1.6 },
  { count: 1,  pool: [],                       hpMult: 1.0,  speedMult: 0.5,  bossId: 130, bossHpMult: 95 },
  { count: 22, pool: [13, 16, 25, 50, 60, 92], hpMult: 7.5,  speedMult: 1.65 },
  { count: 24, pool: [25, 35, 39, 60, 92, 74], hpMult: 8.0,  speedMult: 1.7 },
  { count: 24, pool: [60, 92, 66, 74, 50, 25, 39], hpMult: 8.5,  speedMult: 1.7 },
  { count: 26, pool: [92, 25, 60, 74, 66, 50],     hpMult: 9.0,  speedMult: 1.75 },
  { count: 1,  pool: [],                           hpMult: 1.0,  speedMult: 0.5,  bossId: 149, bossHpMult: 115 },
  { count: 26, pool: [10, 13, 16, 19, 25, 50, 60], hpMult: 9.5,  speedMult: 1.8 },
  { count: 28, pool: [25, 39, 35, 92, 66, 74],     hpMult: 10.0, speedMult: 1.8 },
  { count: 28, pool: [60, 25, 92, 50, 74, 66, 39], hpMult: 10.5, speedMult: 1.85 },
  { count: 30, pool: [92, 74, 50, 60, 25, 66],     hpMult: 11.0, speedMult: 1.9 },
  { count: 1,  pool: [],                           hpMult: 1.0,  speedMult: 0.55, bossId: 65, bossHpMult: 135 },
  // 후반 웨이브는 진화체 위주로 (1차 진화체/완전체 포함)
  { count: 30, pool: [17, 20, 11, 14, 26, 51, 61, 93], hpMult: 11.5, speedMult: 1.9 },
  { count: 32, pool: [26, 40, 36, 61, 93, 75, 67],     hpMult: 12.0, speedMult: 1.95 },
  { count: 32, pool: [61, 93, 67, 75, 51, 26, 40, 20], hpMult: 12.5, speedMult: 2.0 },
  { count: 34, pool: [93, 26, 40, 61, 75, 67, 51],     hpMult: 13.0, speedMult: 2.0 },
  { count: 1,  pool: [],                               hpMult: 1.0,  speedMult: 0.5,  bossId: 9, bossHpMult: 165 },
  { count: 34, pool: [12, 15, 17, 20, 26, 51, 61, 93], hpMult: 13.5, speedMult: 2.05 },
  { count: 36, pool: [26, 40, 36, 61, 93, 75, 67, 20], hpMult: 14.0, speedMult: 2.1 },
  { count: 36, pool: [61, 93, 67, 75, 51, 26, 40],     hpMult: 14.5, speedMult: 2.1 },
  { count: 38, pool: [93, 75, 51, 61, 26, 67, 40],     hpMult: 15.0, speedMult: 2.15 },
  { count: 1,  pool: [],                               hpMult: 1.0,  speedMult: 0.5,  bossId: 6, bossHpMult: 195 },
  // 최종 웨이브: 완전체 중심
  { count: 38, pool: [12, 15, 18, 26, 62, 94, 68, 76], hpMult: 15.5, speedMult: 2.2 },
  { count: 40, pool: [26, 40, 36, 62, 94, 76, 68, 51], hpMult: 16.0, speedMult: 2.25 },
  { count: 40, pool: [62, 94, 68, 76, 51, 26, 40, 20], hpMult: 16.5, speedMult: 2.3 },
  { count: 42, pool: [94, 26, 40, 62, 76, 68, 51, 36], hpMult: 17.0, speedMult: 2.35 },
  { count: 1,  pool: [],                               hpMult: 1.0,  speedMult: 0.5,  bossId: 3, bossHpMult: 220 },
  { count: 42, pool: [26, 62, 94, 68, 76, 51, 20, 40], hpMult: 17.5, speedMult: 2.4 },
  { count: 44, pool: [26, 40, 62, 94, 76, 68, 51],     hpMult: 18.0, speedMult: 2.45 },
  { count: 44, pool: [62, 94, 68, 76, 51, 26, 40, 36], hpMult: 18.5, speedMult: 2.5 },
  { count: 46, pool: [94, 26, 40, 62, 76, 68, 51, 20], hpMult: 19.0, speedMult: 2.5 },
  { count: 1,  pool: [],                               hpMult: 1.0,  speedMult: 0.55, bossId: 150, bossHpMult: 280 },
];

export const TOTAL_WAVE_COUNT = WAVES.length;

export class WaveSystem {
  enemies: EnemyPokemon[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private remainingToSpawn = 0;

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private path: Phaser.Curves.Path,
  ) {
    state.on('waveStart', (wave: number) => this.onWaveStart(wave));
  }

  private onWaveStart(wave: number) {
    const cfg = WAVES[wave - 1];
    if (!cfg) return;

    if (cfg.bossId !== undefined) {
      this.remainingToSpawn = 0;
      this.spawnBoss(cfg);
      return;
    }

    this.remainingToSpawn = cfg.count;
    this.spawnEnemy(cfg);
    if (cfg.count > 1) {
      this.spawnTimer = this.scene.time.addEvent({
        delay: SPAWN_INTERVAL_MS,
        repeat: cfg.count - 2,
        callback: () => this.spawnEnemy(cfg),
      });
    }
  }

  private spawnEnemy(cfg: IWaveConfig) {
    const id = cfg.pool[Math.floor(Math.random() * cfg.pool.length)];
    const pokemon = getPokemon(id);
    const baseHp = 40 + this.state.wave * 12;
    const hp = Math.floor(baseHp * cfg.hpMult);
    const speed = ENEMY_BASE_SPEED * cfg.speedMult;
    const enemy = new EnemyPokemon(this.scene, pokemon, this.path, { hp, speed });
    this.enemies.push(enemy);
    this.remainingToSpawn--;
  }

  private spawnBoss(cfg: IWaveConfig) {
    if (cfg.bossId === undefined) return;
    const pokemon = getPokemon(cfg.bossId);
    const baseHp = 60 + this.state.wave * 14;
    const hp = Math.floor(baseHp * (cfg.bossHpMult ?? 10));
    const speed = ENEMY_BASE_SPEED * cfg.speedMult;
    const enemy = new EnemyPokemon(this.scene, pokemon, this.path, { hp, speed, isBoss: true });
    this.enemies.push(enemy);
  }

  killEnemy(enemy: EnemyPokemon) {
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) {
      this.enemies.splice(idx, 1);
      const cfg = WAVES[this.state.wave - 1];
      const hpMult = cfg ? cfg.hpMult : 1;
      const goldMult = 1 + (hpMult - 1) * 0.4;
      const baseGold = enemy.isBoss ? 80 : ENEMY_KILL_GOLD;
      this.state.addGold(Math.max(1, Math.floor(baseGold * goldMult)));
      enemy.destroy();
    }
  }

  update(_time: number, deltaMs: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.tick(deltaMs);
      if (e.reachedEnd) {
        this.state.loseLives(e.isBoss ? 5 : 1);
        this.enemies.splice(i, 1);
        e.destroy();
      }
    }
    if (this.state.isWaveActive
        && this.enemies.length === 0
        && this.remainingToSpawn === 0
        && (!this.spawnTimer || this.spawnTimer.getRepeatCount() === 0)) {
      this.state.endWave();
    }
  }

  hasMoreWaves(): boolean {
    return this.state.wave < WAVES.length;
  }
}
