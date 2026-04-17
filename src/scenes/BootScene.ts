import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 60, 'po-ran-de', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '88px',
        color: '#ffd34d',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 30, '포켓몬 랜덤 디펜스', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#aab0d4',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 90, '클릭하여 시작', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#7afcc9',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 36, '— 또는 잠시 후 자동으로 시작 —', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a608a',
      })
      .setOrigin(0.5);

    const advance = () => this.scene.start('Preload');
    this.input.once('pointerdown', advance);
    this.time.delayedCall(2000, advance);
  }
}
