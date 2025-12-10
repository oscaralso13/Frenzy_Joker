import Phaser from 'phaser';
import { JOKER_CATALOG } from './Joker.js';

/**
 * Escena de tienda - Aparece después de las rondas 2 y 4
 */
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  init() {
    // Obtener datos del juego desde el registry
    this.gameData = this.registry.get('shopData');
    this.coins = this.gameData.coins;
    this.equippedJokers = this.gameData.equippedJokers;
    this.maxJokers = this.gameData.maxJokers;

    // Si ya hay jokers guardados en la tienda, usarlos; si no, generar nuevos
    if (this.gameData.shopJokers && this.gameData.shopJokers.length > 0) {
      this.availableJokers = this.gameData.shopJokers;
    } else {
      // Generar 2 jokers aleatorios sin repetir (solo la primera vez)
      this.availableJokers = this.getRandomJokers(2);
      this.gameData.shopJokers = this.availableJokers;
      this.registry.set('shopData', this.gameData);
    }
  }

  create() {
    this.createBackground();
    this.createTitle();
    this.createShopSlots();
    this.createSkipButton();
  }

  /**
   * Crea el fondo
   */
  createBackground() {
    const bg = this.add.rectangle(
      0, 0,
      this.scale.width,
      this.scale.height,
      0x0f0c29
    );
    bg.setOrigin(0, 0);
  }

  /**
   * Crea el título
   */
  createTitle() {
    const centerX = this.scale.width / 2;

    this.add.text(centerX, 80, '🛒 TIENDA 🛒', {
      fontSize: '48px',
      fill: '#ffa500',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Mostrar monedas
    this.coinsText = this.add.text(centerX, 140, `💰 Monedas: ${this.coins}`, {
      fontSize: '24px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Info de jokers equipados
    this.add.text(centerX, 180, `Equipados: ${this.equippedJokers.length}/${this.maxJokers}`, {
      fontSize: '18px',
      fill: '#a0a0a0'
    }).setOrigin(0.5);
  }

  /**
   * Crea los 2 slots de la tienda
   */
  createShopSlots() {
    const centerX = this.scale.width / 2;
    const startX = centerX - 250;
    const y = this.scale.height / 2;

    this.availableJokers.forEach((joker, index) => {
      const x = startX + (index * 500);
      this.createJokerSlot(joker, x, y);
    });
  }

  /**
   * Crea un slot individual de joker
   */
  createJokerSlot(joker, x, y) {
    const isEquipped = this.equippedJokers.some(j => j.id === joker.id);
    const canAfford = this.coins >= joker.cost;
    const canEquip = this.equippedJokers.length < this.maxJokers;

    // Contenedor del slot
    const slotBg = this.add.rectangle(
      x, y,
      400, 300,
      0x1a1a2e
    );
    slotBg.setStrokeStyle(4, isEquipped ? 0x4ecca3 : 0xffa500);

    // Nombre del joker
    this.add.text(x, y - 100, joker.name, {
      fontSize: '28px',
      fill: isEquipped ? '#4ecca3' : '#ffd700',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Descripción
    this.add.text(x, y - 40, joker.description, {
      fontSize: '18px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);

    // Precio
    this.add.text(x, y + 20, `💰 ${joker.cost} monedas`, {
      fontSize: '22px',
      fill: canAfford ? '#ffd700' : '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón de compra
    let btnText, btnColor, btnAction;
    if (isEquipped) {
      btnText = 'YA EQUIPADO';
      btnColor = 0x4ecca3;
      btnAction = null;
    } else if (!canEquip) {
      btnText = 'SIN ESPACIO';
      btnColor = 0x4a4a4a;
      btnAction = null;
    } else if (!canAfford) {
      btnText = 'SIN MONEDAS';
      btnColor = 0x4a4a4a;
      btnAction = null;
    } else {
      btnText = 'COMPRAR';
      btnColor = 0x4ecca3;
      btnAction = () => this.buyJoker(joker);
    }

    const buyBtn = this.add.rectangle(x, y + 90, 250, 60, btnColor);
    buyBtn.setStrokeStyle(3, 0xffffff);
    if (btnAction) {
      buyBtn.setInteractive({ useHandCursor: true });
      buyBtn.on('pointerover', () => {
        buyBtn.setFillStyle(this.lightenColor(btnColor));
      });
      buyBtn.on('pointerout', () => {
        buyBtn.setFillStyle(btnColor);
      });
      buyBtn.on('pointerdown', btnAction);
    }

    const buyBtnText = this.add.text(x, y + 90, btnText, {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  /**
   * Crea el botón de saltar
   */
  createSkipButton() {
    const centerX = this.scale.width / 2;
    const y = this.scale.height - 100;

    const skipBtn = this.add.rectangle(centerX, y, 300, 60, 0xe94560);
    skipBtn.setInteractive({ useHandCursor: true });
    skipBtn.setStrokeStyle(3, 0xffffff);

    const skipText = this.add.text(centerX, y, 'CONTINUAR', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    skipBtn.on('pointerover', () => {
      skipBtn.setFillStyle(0xf05670);
    });

    skipBtn.on('pointerout', () => {
      skipBtn.setFillStyle(0xe94560);
    });

    skipBtn.on('pointerdown', () => {
      this.exitShop();
    });
  }

  /**
   * Compra un joker
   */
  buyJoker(joker) {
    if (this.coins >= joker.cost && this.equippedJokers.length < this.maxJokers) {
      this.coins -= joker.cost;
      this.equippedJokers.push(joker);

      // Actualizar gameData
      this.gameData.coins = this.coins;
      this.gameData.equippedJokers = this.equippedJokers;
      this.registry.set('shopData', this.gameData);

      // Recrear la escena para actualizar visualmente
      this.scene.restart();
    }
  }

  /**
   * Sale de la tienda y vuelve al juego
   */
  exitShop() {
    // Actualizar datos en el registry
    this.gameData.coins = this.coins;
    this.gameData.equippedJokers = this.equippedJokers;
    this.gameData.fromShop = true; // Marcar que venimos de la tienda
    this.gameData.shopJokers = null; // Limpiar jokers de la tienda para la próxima vez
    this.registry.set('shopData', this.gameData);

    // Volver al juego
    this.scene.start('GameScene');
  }

  /**
   * Obtiene N jokers aleatorios sin repetir
   */
  getRandomJokers(count) {
    const allJokers = Object.values(JOKER_CATALOG);
    const shuffled = allJokers.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Aclara un color (para efectos hover)
   */
  lightenColor(color) {
    const r = Math.min(255, ((color >> 16) & 0xFF) + 30);
    const g = Math.min(255, ((color >> 8) & 0xFF) + 30);
    const b = Math.min(255, (color & 0xFF) + 30);
    return (r << 16) + (g << 8) + b;
  }
}
