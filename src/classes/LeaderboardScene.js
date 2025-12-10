import Phaser from 'phaser';
import DatabaseService from '../services/DatabaseService.js';

/**
 * Escena del Leaderboard - Tabla de clasificación global
 */
export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  init() {
    this.currentUser = this.registry.get('currentUser');
    this.userProfile = this.registry.get('userProfile');
    this.leaderboardData = [];
    this.userRank = null;
    this.loading = true;
  }

  create() {
    this.createBackground();
    this.createTitle();
    this.createLoadingIndicator();

    // Cargar datos del leaderboard
    this.loadLeaderboard();
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

    this.add.text(centerX, 60, '🏆 CLASIFICACIÓN GLOBAL 🏆', {
      fontSize: '48px',
      fill: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(centerX, 115, 'Top 10 Mejores Puntuaciones', {
      fontSize: '20px',
      fill: '#a0a0a0'
    }).setOrigin(0.5);
  }

  /**
   * Crea indicador de carga
   */
  createLoadingIndicator() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.loadingText = this.add.text(centerX, centerY, 'Cargando clasificación...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Animación de puntos
    this.time.addEvent({
      delay: 500,
      callback: () => {
        if (this.loading && this.loadingText) {
          const currentText = this.loadingText.text;
          const dots = (currentText.match(/\./g) || []).length;
          this.loadingText.setText('Cargando clasificación' + '.'.repeat((dots % 3) + 1));
        }
      },
      loop: true
    });
  }

  /**
   * Carga los datos del leaderboard
   */
  async loadLeaderboard() {
    try {
      // Obtener top 10
      const result = await DatabaseService.getLeaderboard(10);

      if (result.success) {
        this.leaderboardData = result.data;
      } else {
        this.showError(result.error);
        return;
      }

      // Obtener ranking del usuario actual (si está logueado)
      if (this.currentUser) {
        const rankResult = await DatabaseService.getUserRank(this.currentUser.uid);
        if (rankResult.success) {
          this.userRank = rankResult.data;
        }
      }

      this.loading = false;
      this.displayLeaderboard();
    } catch (error) {
      console.error('Error al cargar leaderboard:', error);
      this.showError('Error al cargar la clasificación');
    }
  }

  /**
   * Muestra el leaderboard
   */
  displayLeaderboard() {
    // Destruir indicador de carga
    if (this.loadingText) {
      this.loadingText.destroy();
    }

    const centerX = this.scale.width / 2;
    const startY = 180;
    const itemHeight = 55;

    // Contenedor para la tabla
    const tableWidth = 700;
    const tableHeight = 600;

    const tableBg = this.add.rectangle(
      centerX, startY + tableHeight / 2,
      tableWidth, tableHeight,
      0x1a1a2e, 0.9
    );
    tableBg.setStrokeStyle(3, 0x4ecca3);

    // Encabezados
    const headerY = startY + 20;
    this.add.text(centerX - 280, headerY, 'POS', {
      fontSize: '18px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(centerX - 200, headerY, 'JUGADOR', {
      fontSize: '18px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(centerX + 50, headerY, 'RÉCORD', {
      fontSize: '18px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(centerX + 180, headerY, 'PARTIDAS', {
      fontSize: '18px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Línea separadora
    const separatorY = startY + 45;
    this.add.rectangle(centerX, separatorY, tableWidth - 40, 2, 0x4ecca3);

    // Entradas del leaderboard
    this.leaderboardData.forEach((entry, index) => {
      const y = separatorY + 30 + (index * itemHeight);
      const isCurrentUser = this.currentUser && entry.userId === this.currentUser.uid;

      // Fondo para el usuario actual
      if (isCurrentUser) {
        this.add.rectangle(
          centerX, y,
          tableWidth - 40, itemHeight - 5,
          0x4ecca3, 0.2
        );
      }

      // Color según posición
      let posColor = '#ffffff';
      let medal = '';
      if (index === 0) {
        posColor = '#ffd700'; // Oro
        medal = '🥇';
      } else if (index === 1) {
        posColor = '#c0c0c0'; // Plata
        medal = '🥈';
      } else if (index === 2) {
        posColor = '#cd7f32'; // Bronce
        medal = '🥉';
      }

      // Posición
      this.add.text(centerX - 280, y, `${medal} ${index + 1}`, {
        fontSize: '20px',
        fill: posColor,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // Nombre de usuario
      const username = entry.username || 'Jugador';
      const usernameText = isCurrentUser ? `${username} (Tú)` : username;
      this.add.text(centerX - 200, y, usernameText, {
        fontSize: '18px',
        fill: isCurrentUser ? '#4ecca3' : '#ffffff',
        fontStyle: isCurrentUser ? 'bold' : 'normal'
      }).setOrigin(0, 0.5);

      // High Score
      this.add.text(centerX + 50, y, entry.highScore.toString(), {
        fontSize: '20px',
        fill: '#e94560',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // Partidas jugadas
      this.add.text(centerX + 180, y, entry.gamesPlayed.toString(), {
        fontSize: '18px',
        fill: '#a0a0a0'
      }).setOrigin(0, 0.5);
    });

    // Mostrar posición del usuario si no está en el top 10
    if (this.userRank && this.userRank.rank > 10) {
      const userInfoY = separatorY + 30 + (10 * itemHeight) + 20;

      this.add.text(centerX, userInfoY, '━━━━━━━━━━━━━━━━━', {
        fontSize: '18px',
        fill: '#4ecca3'
      }).setOrigin(0.5);

      this.add.text(centerX, userInfoY + 35, `Tu posición: #${this.userRank.rank} de ${this.userRank.totalPlayers}`, {
        fontSize: '20px',
        fill: '#4ecca3',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(centerX, userInfoY + 65, `Tu récord: ${this.userRank.highScore}`, {
        fontSize: '18px',
        fill: '#ffffff'
      }).setOrigin(0.5);
    }

    // Botón de volver
    this.createBackButton();
  }

  /**
   * Muestra un error
   */
  showError(message) {
    if (this.loadingText) {
      this.loadingText.destroy();
    }

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.text(centerX, centerY - 50, '⚠️ Error', {
      fontSize: '32px',
      fill: '#e94560',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY, message, {
      fontSize: '20px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 600 }
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 60, 'Puede que necesites crear un índice en Firestore.\nRevisa la consola para más información.', {
      fontSize: '16px',
      fill: '#a0a0a0',
      align: 'center',
      wordWrap: { width: 600 }
    }).setOrigin(0.5);

    this.createBackButton();
  }

  /**
   * Crea el botón de volver
   */
  createBackButton() {
    const centerX = this.scale.width / 2;
    const y = this.scale.height - 80;

    const backBtn = this.add.rectangle(centerX, y, 250, 60, 0xe94560);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.setStrokeStyle(3, 0xffffff);

    const backText = this.add.text(centerX, y, 'VOLVER', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    backBtn.on('pointerover', () => {
      backBtn.setFillStyle(0xf05670);
    });

    backBtn.on('pointerout', () => {
      backBtn.setFillStyle(0xe94560);
    });

    backBtn.on('pointerdown', () => {
      this.scene.start('PreparationScene');
    });
  }
}
