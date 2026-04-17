import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';

interface IEndSceneData {
  victory: boolean;
  wave: number;
  maxWave: number;
}

export class EndScene extends Phaser.Scene {
  private endData!: IEndSceneData;

  constructor() {
    super('End');
  }

  init(data: IEndSceneData) {
    this.endData = data;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    if (this.endData.victory) {
      bg.fillGradientStyle(0x1a1428, 0x1a1428, 0x6b3a1c, 0x6b3a1c, 1);
    } else {
      bg.fillGradientStyle(0x1a1828, 0x1a1828, 0x4a1a1a, 0x4a1a1a, 1);
    }
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleText = this.endData.victory ? '승리!' : '게임 오버';
    const titleColor = this.endData.victory ? '#ffd34d' : '#ff5566';

    this.add.text(cx, cy - 100, titleText, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '88px', color: titleColor,
    }).setOrigin(0.5);

    const subText = this.endData.victory
      ? `모든 ${this.endData.maxWave}개 웨이브 클리어!`
      : `웨이브 ${this.endData.wave} / ${this.endData.maxWave} 까지 도달`;
    this.add.text(cx, cy, subText, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ddddee',
    }).setOrigin(0.5);

    const btn = this.add.rectangle(cx, cy + 100, 220, 60, 0x4a5fc4)
      .setStrokeStyle(2, 0x88aaff)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 100, '다시 시작', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x6680ff));
    btn.on('pointerout', () => btn.setFillStyle(0x4a5fc4));
    btn.on('pointerdown', () => this.scene.start('Game'));
  }
}
