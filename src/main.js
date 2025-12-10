import './style.css';
import Phaser from 'phaser';
import MenuScene from './classes/MenuScene.js';
import PreparationScene from './classes/PreparationScene.js';
import SettingsScene from './classes/SettingsScene.js';
import GameScene from './classes/GameScene.js';
import ShopScene from './classes/ShopScene.js';
import LeaderboardScene from './classes/LeaderboardScene.js';

/**
 * Limpieza global: Eliminar dropdowns huérfanos al inicio
 */
document.querySelectorAll('.frenzy-joker-dropdown').forEach(el => el.remove());
console.log('🧹 Limpieza global de dropdowns completada');

/**
 * Configuración principal del juego Frenzy Joker
 */
const config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  backgroundColor: "#0f0c29",
  parent: 'app',
  scene: [MenuScene, PreparationScene, SettingsScene, GameScene, ShopScene, LeaderboardScene], // Orden de escenas
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080
  }
};

// Inicializar el juego
const game = new Phaser.Game(config);
