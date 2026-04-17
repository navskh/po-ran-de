import Phaser from 'phaser';

export class GameState extends Phaser.Events.EventEmitter {
  private _gold: number;
  private _lives: number;
  private _wave: number;
  private _maxWave: number;
  private _isWaveActive = false;
  private _unlockedCols: number;

  constructor(opts: { gold: number; lives: number; maxWave: number; unlockedCols: number }) {
    super();
    this._gold = opts.gold;
    this._lives = opts.lives;
    this._wave = 0;
    this._maxWave = opts.maxWave;
    this._unlockedCols = opts.unlockedCols;
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
    if (this._wave >= this._maxWave) return false;
    this._wave++;
    this._isWaveActive = true;
    this.emit('waveChanged', this._wave);
    this.emit('waveStart', this._wave);
    return true;
  }

  endWave() {
    this._isWaveActive = false;
    this.emit('waveEnd', this._wave);
    if (this._wave >= this._maxWave) {
      this.emit('victory');
    }
  }
}
