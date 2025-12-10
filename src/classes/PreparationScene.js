import Phaser from 'phaser';
import ConfigService from '../services/ConfigService.js';
import AuthService from '../services/AuthService.js';
import DatabaseService from '../services/DatabaseService.js';

/**
 * Escena de preparación antes de jugar
 * Permite seleccionar baraja, dificultad y acceder a ajustes
 */
export default class PreparationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreparationScene' });
  }

  init() {
    this.userProfile = this.registry.get('userProfile');
    this.currentUser = this.registry.get('currentUser');
    this.selectedDeck = ConfigService.get('lastSelectedDeck') || 'default';
    this.selectedDifficulty = ConfigService.get('lastSelectedDifficulty') || 'easy';
    this.hasSavedGame = false;
    this.savedGameData = null;
  }

  async create() {
    this.createBackground();
    this.createTitle();

    // Verificar si hay partida guardada
    await this.checkForSavedGame();

    this.createSelectors();
    this.createActionButtons();
    this.createLeaderboardButton();
    this.createSettingsButton();
    this.createLogoutButton();
  }

  /**
   * Verifica si el usuario tiene una partida guardada
   */
  async checkForSavedGame() {
    if (!this.currentUser) return;

    try {
      const result = await DatabaseService.getSavedGame(this.currentUser.uid);
      if (result.success && result.data) {
        this.hasSavedGame = true;
        this.savedGameData = result.data;

        // Notificar si la partida viene del cache (modo offline)
        if (result.fromCache) {
          const message = result.fallback
            ? '💾 Partida recuperada del cache local (sin conexión)'
            : '💾 Partida obtenida del cache local';

          this.showMessage(message, 2500);
        }
      } else if (!result.success && result.error === 'offline_no_cache') {
        this.showMessage('⚠️ Sin conexión y sin partidas guardadas localmente', 3000);
      }
    } catch (error) {
      console.error('Error al verificar partida guardada:', error);
    }
  }

  /**
   * Muestra mensaje temporal en pantalla
   */
  showMessage(text, duration = 2000) {
    const message = this.add.text(
      this.scale.width / 2,
      100,
      text,
      {
        fontSize: '24px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    );
    message.setOrigin(0.5);

    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: duration,
      delay: duration - 500,
      onComplete: () => message.destroy()
    });
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

    // Partículas decorativas
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * this.scale.width;
      const y = Math.random() * this.scale.height;
      const card = this.add.text(x, y, ['♥', '♦', '♣', '♠'][Math.floor(Math.random() * 4)], {
        fontSize: '32px',
        fill: '#ffffff',
        alpha: 0.1
      });

      this.tweens.add({
        targets: card,
        y: y + 100,
        alpha: 0,
        duration: 5000 + Math.random() * 3000,
        repeat: -1,
        yoyo: true
      });
    }
  }

  /**
   * Crea el título
   */
  createTitle() {
    const centerX = this.scale.width / 2;

    this.add.text(centerX, 80, '🎴 PREPARACIÓN 🎴', {
      fontSize: '48px',
      fill: '#e94560',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Nombre de usuario
    const username = this.userProfile?.username || 'Jugador';
    this.add.text(centerX, 140, `Bienvenido, ${username}`, {
      fontSize: '24px',
      fill: '#ffd700',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  }

  /**
   * Crea los selectores (desplegables HTML)
   */
  createSelectors() {
    const centerX = this.scale.width / 2;

    // Título de baraja
    const deckY = 250;
    this.add.text(centerX, deckY, 'Selecciona tu baraja:', {
      fontSize: '24px',
      fill: '#4ecca3',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Dropdown de baraja
    const deckSelectY = deckY + 60;

    this.deckSelect = this.createDropdown(
      centerX,
      deckSelectY,
      [
        { value: 'default', label: '🃏 Baraja Clásica (Sin bonificación)' },
        { value: 'red', label: '🔴 Baraja Roja (+1 Descarte)' },
        { value: 'blue', label: '🔵 Baraja Azul (+1 Jugada)' }
      ],
      this.selectedDeck
    );

    // Descripción de la baraja seleccionada
    this.deckDescription = this.add.text(centerX, deckSelectY + 70, this.getDeckDescription(this.selectedDeck), {
      fontSize: '16px',
      fill: '#ffd700',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.deckSelect.addEventListener('change', (e) => {
      this.selectedDeck = e.target.value;
      ConfigService.set('lastSelectedDeck', this.selectedDeck);
      this.deckDescription.setText(this.getDeckDescription(this.selectedDeck));
    });

    // Título de dificultad
    const difficultyY = 480;
    this.add.text(centerX, difficultyY, 'Nivel de Pozo:', {
      fontSize: '24px',
      fill: '#4ecca3',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Dropdown de dificultad
    const difficultySelectY = 530;

    this.difficultySelect = this.createDropdown(
      centerX,
      difficultySelectY,
      [
        { value: 'easy', label: '🟢 Fácil' },
        { value: 'normal', label: '🟡 Normal' },
        { value: 'hard', label: '🔴 Difícil' }
      ],
      this.selectedDifficulty
    );

    this.difficultySelect.addEventListener('change', (e) => {
      this.selectedDifficulty = e.target.value;
      ConfigService.set('lastSelectedDifficulty', this.selectedDifficulty);
    });
  }

  /**
   * Crea un dropdown HTML
   */
  createDropdown(x, y, options, selectedValue) {
    const select = document.createElement('select');

    // Añadir clase identificadora para limpieza
    select.className = 'frenzy-joker-dropdown';
    select.dataset.scene = 'preparation';

    // Obtener la posición y escala del canvas
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calcular la escala del canvas
    const scaleX = canvasRect.width / this.scale.width;
    const scaleY = canvasRect.height / this.scale.height;

    // Convertir coordenadas del juego a coordenadas absolutas de la pantalla
    const absoluteX = canvasRect.left + (x * scaleX);
    const absoluteY = canvasRect.top + (y * scaleY);

    // Ancho del dropdown escalado
    const dropdownWidth = 400 * scaleX;

    select.style.cssText = `
      position: absolute;
      left: ${absoluteX - (dropdownWidth / 2)}px;
      top: ${absoluteY}px;
      width: ${dropdownWidth}px;
      padding: ${12 * scaleY}px;
      font-size: ${18 * scaleY}px;
      border: 2px solid #4ecca3;
      border-radius: 5px;
      background: #1a1a2e;
      color: #ffffff;
      font-family: Arial;
      cursor: pointer;
      z-index: 1000;
      transform-origin: top center;
    `;

    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.value === selectedValue) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    document.body.appendChild(select);
    return select;
  }

  /**
   * Obtiene la descripción de una baraja
   */
  getDeckDescription(deckId) {
    const descriptions = {
      default: 'La baraja clásica sin modificaciones especiales',
      red: 'Perfecta para estrategias que requieren más descartes',
      blue: 'Ideal para maximizar oportunidades de jugada'
    };
    return descriptions[deckId] || '';
  }

  /**
   * Crea los botones de acción
   */
  createActionButtons() {
    const centerX = this.scale.width / 2;
    let yOffset = this.hasSavedGame ? 720 : 650;

    // Si hay partida guardada, mostrar botón de continuar
    if (this.hasSavedGame) {
      this.createContinueButton(centerX, 620);
    }

    // Botón JUGAR (o NUEVA PARTIDA si hay guardada)
    const playBtn = this.add.rectangle(centerX, yOffset, 300, 60, 0x4ecca3);
    playBtn.setStrokeStyle(3, 0xffffff);
    playBtn.setInteractive({ useHandCursor: true });

    const playText = this.add.text(centerX, yOffset, this.hasSavedGame ? '🔄 NUEVA PARTIDA' : '▶ JUGAR', {
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    playBtn.on('pointerover', () => {
      playBtn.setFillStyle(0x5fddac);
      this.tweens.add({
        targets: [playBtn, playText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    playBtn.on('pointerout', () => {
      playBtn.setFillStyle(0x4ecca3);
      this.tweens.add({
        targets: [playBtn, playText],
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    playBtn.on('pointerdown', () => {
      if (this.hasSavedGame) {
        // Confirmar que quiere empezar nueva partida
        const confirmed = confirm('¿Estás seguro? Perderás la partida guardada.');
        if (confirmed) {
          this.startNewGame();
        }
      } else {
        this.startGame();
      }
    });
  }

  /**
   * Crea el botón para continuar partida guardada
   */
  createContinueButton(x, y) {
    const continueBtn = this.add.rectangle(x, y, 350, 70, 0xffd700);
    continueBtn.setStrokeStyle(4, 0xffffff);
    continueBtn.setInteractive({ useHandCursor: true });

    // Calcular tiempo desde guardado
    const savedAt = this.savedGameData.savedAt?.toDate();
    const now = new Date();
    const hoursDiff = Math.floor((now - savedAt) / (1000 * 60 * 60));
    const timeText = hoursDiff < 1 ? 'hace menos de 1h' :
                     hoursDiff < 24 ? `hace ${hoursDiff}h` :
                     `hace ${Math.floor(hoursDiff / 24)}d`;

    const continueText = this.add.text(x, y - 5, '⏯ CONTINUAR PARTIDA', {
      fontSize: '30px',
      fill: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const infoText = this.add.text(x, y + 22, `Ronda ${this.savedGameData.currentRound} • ${timeText}`, {
      fontSize: '16px',
      fill: '#000000'
    }).setOrigin(0.5);

    // Efecto de pulso
    this.tweens.add({
      targets: [continueBtn, continueText, infoText],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    continueBtn.on('pointerover', () => {
      continueBtn.setFillStyle(0xffed4e);
    });

    continueBtn.on('pointerout', () => {
      continueBtn.setFillStyle(0xffd700);
    });

    continueBtn.on('pointerdown', () => {
      this.continueGame();
    });
  }

  /**
   * Crea el botón de leaderboard (esquina superior derecha)
   */
  createLeaderboardButton() {
    const x = this.scale.width - 230;
    const y = 30;

    const leaderboardBtn = this.add.rectangle(x, y, 160, 40, 0x16213e);
    leaderboardBtn.setStrokeStyle(2, 0xffd700);
    leaderboardBtn.setInteractive({ useHandCursor: true });

    const leaderboardText = this.add.text(x, y, '🏆 Ranking', {
      fontSize: '18px',
      fill: '#ffd700'
    }).setOrigin(0.5);

    leaderboardBtn.on('pointerover', () => {
      leaderboardBtn.setFillStyle(0x1a1a2e);
      leaderboardText.setStyle({ fill: '#ffed4e' });
      this.tweens.add({
        targets: [leaderboardBtn, leaderboardText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    leaderboardBtn.on('pointerout', () => {
      leaderboardBtn.setFillStyle(0x16213e);
      leaderboardText.setStyle({ fill: '#ffd700' });
      this.tweens.add({
        targets: [leaderboardBtn, leaderboardText],
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    leaderboardBtn.on('pointerdown', () => {
      this.cleanupInputs();
      this.scene.start('LeaderboardScene');
    });
  }

  /**
   * Crea el botón de ajustes (esquina superior derecha)
   */
  createSettingsButton() {
    const x = this.scale.width - 80;
    const y = 30;

    const settingsBtn = this.add.rectangle(x, y, 120, 40, 0x16213e);
    settingsBtn.setStrokeStyle(2, 0x4ecca3);
    settingsBtn.setInteractive({ useHandCursor: true });

    const settingsText = this.add.text(x, y, '⚙ Ajustes', {
      fontSize: '18px',
      fill: '#4ecca3'
    }).setOrigin(0.5);

    settingsBtn.on('pointerover', () => {
      settingsBtn.setFillStyle(0x1a1a2e);
      settingsText.setStyle({ fill: '#5fddac' });
    });

    settingsBtn.on('pointerout', () => {
      settingsBtn.setFillStyle(0x16213e);
      settingsText.setStyle({ fill: '#4ecca3' });
    });

    settingsBtn.on('pointerdown', () => {
      // Guardar escena actual para volver aquí
      this.registry.set('returnToScene', 'PreparationScene');
      this.cleanupInputs();
      this.scene.start('SettingsScene');
    });
  }

  /**
   * Crea el botón de cerrar sesión (esquina superior izquierda)
   */
  createLogoutButton() {
    const x = 100;
    const y = 30;

    const logoutBtn = this.add.rectangle(x, y, 150, 40, 0x16213e);
    logoutBtn.setStrokeStyle(2, 0xe94560);
    logoutBtn.setInteractive({ useHandCursor: true });

    const logoutText = this.add.text(x, y, '🚪 Cerrar sesión', {
      fontSize: '16px',
      fill: '#e94560'
    }).setOrigin(0.5);

    logoutBtn.on('pointerover', () => {
      logoutBtn.setFillStyle(0x1a1a2e);
      logoutText.setStyle({ fill: '#ff5577' });
    });

    logoutBtn.on('pointerout', () => {
      logoutBtn.setFillStyle(0x16213e);
      logoutText.setStyle({ fill: '#e94560' });
    });

    logoutBtn.on('pointerdown', () => {
      this.handleLogout();
    });
  }

  /**
   * Maneja el cierre de sesión
   */
  async handleLogout() {
    try {
      // Limpiar inputs HTML antes de cerrar sesión
      this.cleanupInputs();

      // Cerrar sesión
      await AuthService.logout();

      // Limpiar registry
      this.registry.destroy();
      this.registry.set('userProfile', null);
      this.registry.set('currentUser', null);

      // Volver al menú de inicio
      this.scene.start('MenuScene');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  /**
   * Inicia el juego con la configuración seleccionada
   */
  startGame() {
    // Guardar configuración seleccionada en el registry
    this.registry.set('selectedDeck', this.selectedDeck);
    this.registry.set('selectedDifficulty', this.selectedDifficulty);

    // Limpiar inputs HTML
    this.cleanupInputs();

    // Transición al juego
    this.cameras.main.fadeOut(500);

    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * Continúa una partida guardada
   */
  continueGame() {
    // Preparar datos de partida guardada
    this.savedGameData.fromSavedGame = true;
    this.registry.set('savedGameData', this.savedGameData);

    // Limpiar inputs HTML
    this.cleanupInputs();

    // Transición al juego
    this.cameras.main.fadeOut(500);

    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * Inicia una nueva partida (eliminando la guardada)
   */
  async startNewGame() {
    // Eliminar partida guardada
    if (this.currentUser) {
      await DatabaseService.clearSavedGame(this.currentUser.uid);
    }

    // Iniciar juego normal
    this.startGame();
  }

  /**
   * Limpia los dropdowns HTML
   */
  cleanupInputs() {
    try {
      // Limpiar por clase además de referencias específicas
      const allDropdowns = document.querySelectorAll('.frenzy-joker-dropdown');
      allDropdowns.forEach(dropdown => {
        if (dropdown.parentNode) {
          dropdown.parentNode.removeChild(dropdown);
        }
      });

      // Limpiar referencias específicas
      if (this.deckSelect && this.deckSelect.parentNode) {
        this.deckSelect.parentNode.removeChild(this.deckSelect);
        this.deckSelect = null;
      }
      if (this.difficultySelect && this.difficultySelect.parentNode) {
        this.difficultySelect.parentNode.removeChild(this.difficultySelect);
        this.difficultySelect = null;
      }
    } catch (error) {
      console.warn('Error limpiando inputs:', error);
    }
  }

  /**
   * Limpia inputs al destruir la escena
   */
  shutdown() {
    this.cleanupInputs();

    // Limpiar registry temporal
    const keysToClean = ['savedGameData', 'shopData'];
    keysToClean.forEach(key => {
      this.registry.set(key, null);
    });

    console.log('🧹 PreparationScene cleanup completado');
  }

  /**
   * Destrucción completa de la escena
   */
  destroy() {
    this.cleanupInputs();
    if (super.destroy) {
      super.destroy();
    }
  }
}
