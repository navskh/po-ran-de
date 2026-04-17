import Phaser from 'phaser';
import { GAME_WIDTH } from '../game/config';
import { HUD_HEIGHT } from '../game/balance';
import { GameState } from '../state/GameState';

export class Hud extends Phaser.GameObjects.Container {
  private goldText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private gameState: GameState;

  constructor(scene: Phaser.Scene, state: GameState) {
    super(scene, 0, 0);
    this.gameState = state;

    const bg = scene.add.rectangle(0, 0, GAME_WIDTH, HUD_HEIGHT, 0x07080f, 0.92).setOrigin(0, 0);
    const line = scene.add.line(0, HUD_HEIGHT, 0, 0, GAME_WIDTH, 0, 0x44476a, 0.8).setOrigin(0, 0);
    this.add([bg, line]);

    this.goldText = scene.add.text(24, HUD_HEIGHT / 2, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffd34d',
    }).setOrigin(0, 0.5);

    this.livesText = scene.add.text(GAME_WIDTH / 2, HUD_HEIGHT / 2, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ff7b8c',
    }).setOrigin(0.5);

    this.waveText = scene.add.text(GAME_WIDTH - 24, HUD_HEIGHT / 2, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#7afcc9',
    }).setOrigin(1, 0.5);

    this.add([this.goldText, this.livesText, this.waveText]);

    state.on('goldChanged', () => this.refresh());
    state.on('livesChanged', () => this.refresh());
    state.on('waveChanged', () => this.refresh());

    this.refresh();
    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  private refresh() {
    this.goldText.setText(`골드  ${this.gameState.gold}`);
    this.livesText.setText(`라이프  ${this.gameState.lives}`);
    this.waveText.setText(`웨이브  ${this.gameState.wave} / ${this.gameState.maxWave}`);
  }
}
