import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { ALL_POKEMON_IDS, getSpriteKey, getSpriteUrl } from '../data/pokemonData';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 80, '포켓몬 도감 로딩 중...', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffd34d',
      })
      .setOrigin(0.5);

    this.add.rectangle(cx, cy, 600, 24, 0x222244).setOrigin(0.5);
    const bar = this.add.rectangle(cx - 300, cy, 0, 20, 0x7afcc9).setOrigin(0, 0.5);
    const text = this.add
      .text(cx, cy + 40, '0%', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#aab0d4',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 600 * value;
      text.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('loaderror', (file: { src: string }) => {
      console.warn('Failed to load asset:', file.src);
    });

    for (const id of ALL_POKEMON_IDS) {
      this.load.image(getSpriteKey(id), getSpriteUrl(id));
    }
  }

  create() {
    this.scene.start('Game');
  }
}
