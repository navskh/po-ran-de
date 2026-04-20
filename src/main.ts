import Phaser from 'phaser';
import { inject } from '@vercel/analytics';
import { gameConfig } from './game/config';

inject();

new Phaser.Game(gameConfig);
