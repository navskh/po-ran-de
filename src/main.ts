import Phaser from 'phaser';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { gameConfig } from './game/config';

inject();
injectSpeedInsights();

new Phaser.Game(gameConfig);
