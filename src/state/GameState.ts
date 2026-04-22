import Phaser from 'phaser';

const DEX_STORAGE_KEY = 'porande-dex';
const BEST_WAVE_STORAGE_KEY = 'porande-best-wave';
const ACHIEVEMENTS_STORAGE_KEY = 'porande-achievements';
const SYNERGY_SEEN_STORAGE_KEY = 'porande-synergy-seen';

export class GameState extends Phaser.Events.EventEmitter {
  private _gold: number;
  private _lives: number;
  private _wave: number;
  private _maxWave: number;
  private _isWaveActive = false;
  private _unlockedCols: number;
  private _dex: Set<number> = new Set();
  private _bestWave = 0;
  private _milestone50Fired = false;
  private _achievements: Set<string> = new Set();
  private _synergySeen: Set<string> = new Set(); // synergy-all 업적용

  constructor(opts: { gold: number; lives: number; maxWave: number; unlockedCols: number }) {
    super();
    this._gold = opts.gold;
    this._lives = opts.lives;
    this._wave = 0;
    this._maxWave = opts.maxWave;
    this._unlockedCols = opts.unlockedCols;
    this.loadDex();
    this.loadBestWave();
    this.loadAchievements();
  }

  private loadAchievements() {
    try {
      const a = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (a) this._achievements = new Set(JSON.parse(a) as string[]);
      const s = localStorage.getItem(SYNERGY_SEEN_STORAGE_KEY);
      if (s) this._synergySeen = new Set(JSON.parse(s) as string[]);
    } catch { /* ignore */ }
  }

  private saveAchievements() {
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify([...this._achievements]));
      localStorage.setItem(SYNERGY_SEEN_STORAGE_KEY, JSON.stringify([...this._synergySeen]));
    } catch { /* ignore */ }
  }

  hasAchievement(id: string): boolean {
    return this._achievements.has(id);
  }

  get achievements(): ReadonlySet<string> {
    return this._achievements;
  }

  get synergySeen(): ReadonlySet<string> {
    return this._synergySeen;
  }

  markSynergySeen(id: string) {
    if (this._synergySeen.has(id)) return;
    this._synergySeen.add(id);
    this.saveAchievements();
  }

  unlockAchievement(id: string): boolean {
    if (this._achievements.has(id)) return false;
    this._achievements.add(id);
    this.saveAchievements();
    this.emit('achievementUnlocked', id);
    return true;
  }

  private loadBestWave() {
    try {
      const raw = localStorage.getItem(BEST_WAVE_STORAGE_KEY);
      if (raw) this._bestWave = parseInt(raw, 10) || 0;
    } catch { /* ignore */ }
  }

  private saveBestWave() {
    try {
      if (this._wave > this._bestWave) {
        this._bestWave = this._wave;
        localStorage.setItem(BEST_WAVE_STORAGE_KEY, String(this._bestWave));
        this.emit('bestWaveUpdated', this._bestWave);
      }
    } catch { /* ignore */ }
  }

  get bestWave(): number {
    return this._bestWave;
  }

  private loadDex() {
    try {
      const raw = localStorage.getItem(DEX_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as number[];
        this._dex = new Set(arr);
      }
    } catch {
      // ignore
    }
  }

  private saveDex() {
    try {
      localStorage.setItem(DEX_STORAGE_KEY, JSON.stringify([...this._dex]));
    } catch {
      // ignore
    }
  }

  addToDex(id: number) {
    if (this._dex.has(id)) return;
    this._dex.add(id);
    this.saveDex();
    this.emit('dexAdded', id);
  }

  get dex(): ReadonlySet<number> {
    return this._dex;
  }

  get gold() { return this._gold; }
  get lives() { return this._lives; }
  get wave() { return this._wave; }
  get maxWave() { return this._maxWave; }
  get isWaveActive() { return this._isWaveActive; }
  get unlockedCols() { return this._unlockedCols; }

  expandCol(cost: number, maxCols: number): boolean {
    if (this._unlockedCols >= maxCols) return false;
    if (this._gold < cost) return false;
    this._gold -= cost;
    this._unlockedCols += 1;
    this.emit('goldChanged', this._gold);
    this.emit('colsChanged', this._unlockedCols);
    return true;
  }

  addGold(amount: number) {
    this._gold += amount;
    this.emit('goldChanged', this._gold);
  }

  spendGold(amount: number): boolean {
    if (this._gold < amount) return false;
    this._gold -= amount;
    this.emit('goldChanged', this._gold);
    return true;
  }

  loseLives(amount: number) {
    this._lives = Math.max(0, this._lives - amount);
    this.emit('livesChanged', this._lives);
    if (this._lives <= 0) this.emit('gameOver');
  }

  startWave(): boolean {
    if (this._isWaveActive) return false;
    // 엔드리스: maxWave 제한 없이 무한 진행
    this._wave++;
    this._isWaveActive = true;
    this.emit('waveChanged', this._wave);
    this.emit('waveStart', this._wave);
    return true;
  }

  endWave() {
    this._isWaveActive = false;
    this.emit('waveEnd', this._wave);
    this.saveBestWave();
    if (this._wave === this._maxWave && !this._milestone50Fired) {
      this._milestone50Fired = true;
      this.emit('milestone50', this._wave);
    }
  }
}
