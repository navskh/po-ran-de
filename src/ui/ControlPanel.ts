import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { CONTROL_HEIGHT, GACHA_COST, EXPAND_COL_COST, GRID_COLS } from '../game/balance';
import { GameState } from '../state/GameState';

export class ControlPanel extends Phaser.GameObjects.Container {
  private gameState: GameState;
  private drawBtn: Phaser.GameObjects.Container;
  private startBtn: Phaser.GameObjects.Container;
  private startLabel: Phaser.GameObjects.Text;

  private expandBtn!: Phaser.GameObjects.Container;
  private expandLabel!: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onDraw: () => void,
    onStart: () => void,
    onRecipes: () => void,
    onExpand: () => void,
  ) {
    super(scene, 0, 0);
    this.gameState = state;

    const y = GAME_HEIGHT - CONTROL_HEIGHT / 2;

    const bg = scene.add.rectangle(0, GAME_HEIGHT - CONTROL_HEIGHT, GAME_WIDTH, CONTROL_HEIGHT, 0x07080f, 0.92)
      .setOrigin(0, 0);
    const line = scene.add.line(0, GAME_HEIGHT - CONTROL_HEIGHT, 0, 0, GAME_WIDTH, 0, 0x44476a, 0.8).setOrigin(0, 0);
    this.add([bg, line]);

    const recipesBtn = this.makeSmallButton(scene, 80, y, '조합표', 0x4a3f70, 0x8866cc, onRecipes);
    this.add(recipesBtn);

    this.expandBtn = this.makeSmallButton(scene, 200, y, `칸+ ${EXPAND_COL_COST}G`, 0x6a4a3f, 0xcc8866, onExpand);
    this.expandLabel = this.expandBtn.getData('text') as Phaser.GameObjects.Text;
    this.add(this.expandBtn);

    this.drawBtn = this.makeButton(scene, GAME_WIDTH / 2 - 110, y, `뽑기 ${GACHA_COST}G`, 0x4a5fc4, 0x6680ff, onDraw);
    const start = this.makeButton(scene, GAME_WIDTH / 2 + 110, y, '웨이브 시작', 0x4a8fc4, 0x66ddff, onStart);
    this.startBtn = start;
    this.startLabel = start.getData('text') as Phaser.GameObjects.Text;
    this.add([this.drawBtn, this.startBtn]);

    state.on('goldChanged', (gold: number) => {
      this.refreshDrawBtn(gold);
      this.refreshExpandBtn(gold);
    });
    state.on('waveStart', () => this.refreshStartBtn());
    state.on('waveEnd', () => this.refreshStartBtn());
    state.on('colsChanged', () => this.refreshExpandBtn(state.gold));

    this.refreshDrawBtn(state.gold);
    this.refreshStartBtn();
    this.refreshExpandBtn(state.gold);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  private refreshExpandBtn(gold: number) {
    const maxed = this.gameState.unlockedCols >= GRID_COLS;
    if (maxed) {
      this.expandBtn.setAlpha(0.4);
      this.expandLabel.setText('칸 최대');
      return;
    }
    const canAfford = gold >= EXPAND_COL_COST;
    this.expandBtn.setAlpha(canAfford ? 1.0 : 0.5);
    this.expandLabel.setText(`칸+ ${EXPAND_COL_COST}G`);
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    fillColor: number,
    strokeColor: number,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);
    const rect = scene.add.rectangle(0, 0, 200, 50, fillColor)
      .setStrokeStyle(2, strokeColor)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);
    c.add([rect, text]);
    rect.on('pointerdown', onClick);
    rect.on('pointerover', () => rect.setFillStyle(strokeColor));
    rect.on('pointerout', () => rect.setFillStyle(fillColor));
    c.setData('rect', rect);
    c.setData('text', text);
    return c;
  }

  private makeSmallButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    fillColor: number,
    strokeColor: number,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);
    const rect = scene.add.rectangle(0, 0, 110, 42, fillColor)
      .setStrokeStyle(2, strokeColor)
      .setInteractive({ useHandCursor: true });
    const text = scene.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5);
    c.add([rect, text]);
    rect.on('pointerdown', onClick);
    rect.on('pointerover', () => rect.setFillStyle(strokeColor));
    rect.on('pointerout', () => rect.setFillStyle(fillColor));
    c.setData('rect', rect);
    c.setData('text', text);
    return c;
  }

  private refreshDrawBtn(gold: number) {
    const enough = gold >= GACHA_COST;
    this.drawBtn.setAlpha(enough ? 1.0 : 0.5);
  }

  private refreshStartBtn() {
    if (this.gameState.isWaveActive) {
      this.startBtn.setAlpha(0.5);
      this.startLabel.setText('웨이브 진행 중');
    } else if (this.gameState.wave >= this.gameState.maxWave) {
      this.startBtn.setAlpha(0.5);
      this.startLabel.setText('완료');
    } else {
      this.startBtn.setAlpha(1.0);
      this.startLabel.setText(this.gameState.wave === 0 ? '웨이브 시작' : '다음 웨이브');
    }
  }
}
