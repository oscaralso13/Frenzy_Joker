import Phaser from 'phaser';
import ConfigService from '../services/ConfigService.js';

/**
 * Escena de ajustes del juego
 */
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  init() {
    this.config = ConfigService.getAll();
    // Obtener de qué escena venimos (por defecto PreparationScene)
    this.returnToScene = this.registry.get('returnToScene') || 'PreparationScene';
  }

  create() {
    // Limpiar cualquier elemento HTML residual que pueda estar bloqueando
    this.cleanupOrphanedHTMLElements();

    // Pequeño delay para asegurar que la limpieza se complete
    this.time.delayedCall(10, () => {
      this.createBackground();
      this.createTitle();
      this.createSettingsPanel();
      this.createBackButton();
      this.createResetButton();
    });
  }

  /**
   * Limpia elementos HTML huérfanos que puedan estar bloqueando la interacción
   */
  cleanupOrphanedHTMLElements() {
    console.log('Limpiando elementos HTML...');

    // SettingsScene NO usa elementos HTML, así que eliminamos TODO
    // Esto asegura que no haya nada bloqueando el canvas de Phaser

    // Eliminar TODOS los selects
    const selects = document.querySelectorAll('select');
    console.log('Selects encontrados:', selects.length);
    selects.forEach(select => {
      try {
        if (select.parentNode) {
          select.parentNode.removeChild(select);
        }
      } catch (e) {
        console.warn('Error eliminando select:', e);
      }
    });

    // Eliminar TODOS los inputs con position absolute (de otras escenas)
    const inputs = document.querySelectorAll('input[style*="position: absolute"]');
    console.log('Inputs encontrados:', inputs.length);
    inputs.forEach(input => {
      try {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      } catch (e) {
        console.warn('Error eliminando input:', e);
      }
    });

    console.log('Limpieza completada');
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

    this.add.text(centerX, 60, '⚙ AJUSTES ⚙', {
      fontSize: '48px',
      fill: '#4ecca3',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  /**
   * Crea el panel de ajustes
   */
  createSettingsPanel() {
    const centerX = this.scale.width / 2;
    let currentY = 150;

    // Panel contenedor
    const panelWidth = 600;
    const panelHeight = 580;
    const panelBg = this.add.rectangle(centerX, 430, panelWidth, panelHeight, 0x1a1a2e);
    panelBg.setStrokeStyle(3, 0x16213e);

    // VELOCIDAD DE ANIMACIÓN
    currentY = 180;
    this.createSettingTitle(centerX, currentY, 'Velocidad de Animaciones');
    currentY += 40;
    this.createAnimationSpeedButtons(centerX, currentY);

    // AUTO-ORDENAR
    currentY += 80;
    this.createToggleSetting(
      centerX,
      currentY,
      'Auto-ordenar cartas',
      'autoSort',
      'Ordena automáticamente tu mano'
    );

    // MODO COMPACTO
    currentY += 80;
    this.createToggleSetting(
      centerX,
      currentY,
      'Modo compacto',
      'compactMode',
      'Interfaz más pequeña y ajustada'
    );

    // CONFIRMAR DESCARTE
    currentY += 80;
    this.createToggleSetting(
      centerX,
      currentY,
      'Confirmar descartes',
      'confirmDiscard',
      'Pide confirmación antes de descartar'
    );

    // EFECTOS VISUALES
    currentY += 80;
    this.createToggleSetting(
      centerX,
      currentY,
      'Efectos visuales',
      'visualEffects',
      'Partículas y efectos especiales'
    );

    // MODO CONTRASTE
    currentY += 80;
    this.createToggleSetting(
      centerX,
      currentY,
      'Modo contraste',
      'contrastMode',
      'Colores diferenciados para cada palo'
    );
  }

  /**
   * Crea un título de sección
   */
  createSettingTitle(x, y, text) {
    this.add.text(x, y, text, {
      fontSize: '20px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  /**
   * Crea los botones de velocidad de animación
   */
  createAnimationSpeedButtons(centerX, y) {
    const speeds = [
      { id: 'slow', label: 'Lenta', icon: '🐌' },
      { id: 'normal', label: 'Normal', icon: '🚶' },
      { id: 'fast', label: 'Rápida', icon: '🏃' },
      { id: 'none', label: 'Sin animaciones', icon: '⚡' }
    ];

    const buttonWidth = 120;
    const spacing = 10;
    const totalWidth = (buttonWidth * speeds.length) + (spacing * (speeds.length - 1));
    const startX = centerX - (totalWidth / 2) + (buttonWidth / 2);

    this.speedButtons = {};

    speeds.forEach((speed, index) => {
      const x = startX + (index * (buttonWidth + spacing));
      const isSelected = this.config.animationSpeed === speed.id;

      const btn = this.add.rectangle(
        x, y,
        buttonWidth, 60,
        isSelected ? 0x4ecca3 : 0x16213e
      );
      btn.setStrokeStyle(2, isSelected ? 0xffd700 : 0x2a2a3e);
      btn.setInteractive({ useHandCursor: true });

      const icon = this.add.text(x, y - 10, speed.icon, {
        fontSize: '20px'
      }).setOrigin(0.5);

      const label = this.add.text(x, y + 15, speed.label, {
        fontSize: '12px',
        fill: '#ffffff'
      }).setOrigin(0.5);

      btn.on('pointerover', () => {
        if (this.config.animationSpeed !== speed.id) {
          btn.setFillStyle(0x2a2a3e);
        }
      });

      btn.on('pointerout', () => {
        if (this.config.animationSpeed !== speed.id) {
          btn.setFillStyle(0x16213e);
        }
      });

      btn.on('pointerdown', () => {
        this.setAnimationSpeed(speed.id);
      });

      this.speedButtons[speed.id] = { btn, icon, label };
    });
  }

  /**
   * Establece la velocidad de animación
   */
  setAnimationSpeed(speed) {
    this.config.animationSpeed = speed;
    ConfigService.set('animationSpeed', speed);

    // Actualizar visualización de botones
    Object.keys(this.speedButtons).forEach(id => {
      const { btn } = this.speedButtons[id];
      if (id === speed) {
        btn.setFillStyle(0x4ecca3);
        btn.setStrokeStyle(2, 0xffd700);
      } else {
        btn.setFillStyle(0x16213e);
        btn.setStrokeStyle(2, 0x2a2a3e);
      }
    });
  }

  /**
   * Crea un ajuste con toggle (on/off)
   */
  createToggleSetting(centerX, y, title, configKey, description) {
    // Título
    this.add.text(centerX - 200, y - 10, title, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Descripción
    this.add.text(centerX - 200, y + 15, description, {
      fontSize: '12px',
      fill: '#888888'
    }).setOrigin(0, 0.5);

    // Toggle
    const toggleX = centerX + 180;
    const isOn = this.config[configKey];

    const toggleBg = this.add.rectangle(
      toggleX, y,
      60, 30,
      isOn ? 0x4ecca3 : 0x555555
    );
    toggleBg.setStrokeStyle(2, 0x2a2a3e);
    toggleBg.setInteractive({ useHandCursor: true });

    const toggleCircle = this.add.circle(
      toggleX + (isOn ? 15 : -15), y,
      12,
      0xffffff
    );

    toggleBg.on('pointerdown', () => {
      const newValue = !this.config[configKey];
      this.config[configKey] = newValue;
      ConfigService.set(configKey, newValue);

      // Animar toggle
      toggleBg.setFillStyle(newValue ? 0x4ecca3 : 0x555555);
      this.tweens.add({
        targets: toggleCircle,
        x: toggleX + (newValue ? 15 : -15),
        duration: 200,
        ease: 'Cubic.easeOut'
      });
    });

    toggleBg.on('pointerover', () => {
      this.tweens.add({
        targets: [toggleBg, toggleCircle],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    toggleBg.on('pointerout', () => {
      this.tweens.add({
        targets: [toggleBg, toggleCircle],
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });
  }

  /**
   * Crea el botón de volver
   */
  createBackButton() {
    const x = 100;
    const y = 60;

    const btn = this.add.rectangle(x, y, 140, 45, 0x16213e);
    btn.setStrokeStyle(2, 0x4ecca3);
    btn.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, '← Volver', {
      fontSize: '18px',
      fill: '#4ecca3'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      console.log('Hover sobre botón volver');
      btn.setFillStyle(0x1a1a2e);
      text.setStyle({ fill: '#5fddac' });
    });

    btn.on('pointerout', () => {
      console.log('Salió del hover del botón volver');
      btn.setFillStyle(0x16213e);
      text.setStyle({ fill: '#4ecca3' });
    });

    btn.on('pointerdown', () => {
      console.log('Click en botón volver!');
      this.returnToPreviousScene();
    });
  }

  /**
   * Vuelve a la escena anterior
   */
  returnToPreviousScene() {
    console.log('Volviendo a:', this.returnToScene);

    // Limpiar elementos HTML antes de cambiar de escena
    this.cleanupOrphanedHTMLElements();

    // Iniciar la escena de retorno (restaurará el estado si venimos de una partida)
    this.scene.start(this.returnToScene);
  }

  /**
   * Crea el botón de resetear configuración
   */
  createResetButton() {
    const centerX = this.scale.width / 2;
    const y = 680;

    const btn = this.add.rectangle(centerX, y, 250, 45, 0xe94560);
    btn.setStrokeStyle(2, 0xff5577);
    btn.setInteractive({ useHandCursor: true });

    const text = this.add.text(centerX, y, '🔄 Restaurar valores', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(0xff5577);
      this.tweens.add({
        targets: [btn, text],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    btn.on('pointerout', () => {
      btn.setFillStyle(0xe94560);
      this.tweens.add({
        targets: [btn, text],
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    btn.on('pointerdown', () => {
      this.resetConfig();
    });
  }

  /**
   * Resetea la configuración a valores por defecto
   */
  resetConfig() {
    ConfigService.reset();
    this.scene.restart();
  }
}
