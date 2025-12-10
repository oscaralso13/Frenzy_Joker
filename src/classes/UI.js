/**
 * Clase UI - Maneja toda la interfaz de usuario del juego
 */
export default class UI {
  constructor(scene) {
    this.scene = scene;
    this.containers = {};
    this.texts = {};
    this.buttons = {};
    this.cardSprites = [];
  }

  /**
   * Crea toda la interfaz de usuario
   */
  createUI() {
    this.createScoreContainer();
    this.createButtonContainer();
    this.createHandDisplay();
    this.createJokersDisplay();
    this.createUserMenu();
  }

  /**
   * Crea el contenedor de puntuación
   */
  createScoreContainer() {
    const containerWidth = this.scene.scale.width / 5;
    const containerHeight = (this.scene.scale.height * 2) / 3;

    this.containers.score = this.scene.add.container(20, 20);

    // Fondo con gradiente simulado
    const bg = this.scene.add.rectangle(
      0, 0,
      containerWidth, containerHeight,
      0x1a1a2e
    );
    bg.setStrokeStyle(3, 0x16213e);
    bg.setOrigin(0, 0);

    // Agregar efecto de sombra
    const shadow = this.scene.add.rectangle(
      5, 5,
      containerWidth, containerHeight,
      0x000000, 0.3
    );
    shadow.setOrigin(0, 0);

    // Título
    this.texts.scoreTitle = this.scene.add.text(
      containerWidth / 2, 30,
      '🎴 PUNTUACIÓN',
      {
        fontSize: '28px',
        fill: '#e94560',
        fontStyle: 'bold',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Información de ronda
    this.texts.roundInfo = this.scene.add.text(
      containerWidth / 2, 65,
      'Ronda 1',
      {
        fontSize: '20px',
        fill: '#ffd700',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Objetivo de ronda
    this.texts.roundObjective = this.scene.add.text(
      containerWidth / 2, 90,
      'Objetivo: 300',
      {
        fontSize: '16px',
        fill: '#a0a0a0'
      }
    ).setOrigin(0.5);

    // Separador
    const separator1 = this.scene.add.rectangle(
      containerWidth / 2, 115,
      containerWidth - 40, 2,
      0xe94560
    );

    // Multiplicador
    this.texts.multiplier = this.scene.add.text(
      20, 135,
      'Multiplicador: x1',
      {
        fontSize: '20px',
        fill: '#ffd700',
        fontStyle: 'bold'
      }
    );

    // Fichas
    this.texts.chips = this.scene.add.text(
      20, 165,
      'Fichas: 0',
      {
        fontSize: '20px',
        fill: '#00d9ff'
      }
    );

    // Puntos de jugada
    this.texts.roundScore = this.scene.add.text(
      20, 205,
      'Puntos Jugada: 0',
      {
        fontSize: '20px',
        fill: '#4ecca3'
      }
    );

    // Separador
    const separator2 = this.scene.add.rectangle(
      containerWidth / 2, 245,
      containerWidth - 40, 2,
      0x16213e
    );

    // Puntos de la ronda actual (destacado)
    this.texts.roundScoreTotal = this.scene.add.text(
      containerWidth / 2, 285,
      '0',
      {
        fontSize: '42px',
        fill: '#4ecca3',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.texts.roundScoreLabel = this.scene.add.text(
      containerWidth / 2, 325,
      'PUNTOS RONDA',
      {
        fontSize: '14px',
        fill: '#a0a0a0'
      }
    ).setOrigin(0.5);

    // Separador 3
    const separator3 = this.scene.add.rectangle(
      containerWidth / 2, 355,
      containerWidth - 40, 2,
      0x16213e
    );

    // Puntos totales acumulados
    this.texts.totalScore = this.scene.add.text(
      containerWidth / 2, 390,
      '0',
      {
        fontSize: '36px',
        fill: '#e94560',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.texts.totalLabel = this.scene.add.text(
      containerWidth / 2, 425,
      'TOTAL ACUMULADO',
      {
        fontSize: '14px',
        fill: '#a0a0a0'
      }
    ).setOrigin(0.5);

    // Separador 4
    const separator4 = this.scene.add.rectangle(
      containerWidth / 2, 455,
      containerWidth - 40, 2,
      0x16213e
    );

    // Monedas
    this.texts.coins = this.scene.add.text(
      containerWidth / 2, 490,
      '4',
      {
        fontSize: '36px',
        fill: '#ffd700',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.texts.coinsLabel = this.scene.add.text(
      containerWidth / 2, 525,
      '💰 MONEDAS',
      {
        fontSize: '14px',
        fill: '#a0a0a0'
      }
    ).setOrigin(0.5);

    // Agregar todo al contenedor
    this.containers.score.add([shadow, bg, this.texts.scoreTitle, this.texts.roundInfo,
      this.texts.roundObjective, separator1, this.texts.multiplier, this.texts.chips,
      this.texts.roundScore, separator2, this.texts.roundScoreTotal, this.texts.roundScoreLabel,
      separator3, this.texts.totalScore, this.texts.totalLabel, separator4, this.texts.coins,
      this.texts.coinsLabel]);
  }

  /**
   * Crea el contenedor de botones
   */
  createButtonContainer() {
    const containerWidth = this.scene.scale.width / 5;
    const containerHeight = 220;
    const yPosition = (this.scene.scale.height * 2) / 3 + 40;

    this.containers.buttons = this.scene.add.container(20, yPosition);

    // Fondo
    const bg = this.scene.add.rectangle(
      0, 0,
      containerWidth, containerHeight,
      0x1a1a2e
    );
    bg.setStrokeStyle(3, 0x16213e);
    bg.setOrigin(0, 0);

    // Sombra
    const shadow = this.scene.add.rectangle(
      5, 5,
      containerWidth, containerHeight,
      0x000000, 0.3
    );
    shadow.setOrigin(0, 0);

    // Botón de jugar
    this.buttons.play = this.createButton(
      containerWidth / 2, 50,
      'JUGAR',
      0x4ecca3,
      containerWidth - 40
    );

    this.texts.playsRemaining = this.scene.add.text(
      containerWidth / 2, 90,
      'Jugadas: 4',
      {
        fontSize: '16px',
        fill: '#ffffff'
      }
    ).setOrigin(0.5);

    // Separador
    const separator = this.scene.add.rectangle(
      containerWidth / 2, 120,
      containerWidth - 40, 2,
      0x16213e
    );

    // Botón de descartar
    this.buttons.discard = this.createButton(
      containerWidth / 2, 150,
      'DESCARTAR',
      0xe94560,
      containerWidth - 40
    );

    this.texts.discardsRemaining = this.scene.add.text(
      containerWidth / 2, 190,
      'Descartes: 3',
      {
        fontSize: '16px',
        fill: '#ffffff'
      }
    ).setOrigin(0.5);

    this.containers.buttons.add([shadow, bg, this.buttons.play.container,
      this.texts.playsRemaining, separator, this.buttons.discard.container,
      this.texts.discardsRemaining]);
  }

  /**
   * Crea un botón estilizado
   */
  createButton(x, y, text, color, width) {
    const container = this.scene.add.container(x, y);
    const height = 35;

    const bg = this.scene.add.rectangle(0, 0, width, height, color);
    bg.setInteractive({ useHandCursor: true });

    const label = this.scene.add.text(0, 0, text, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Efectos hover
    bg.on('pointerover', () => {
      bg.setFillStyle(this.lightenColor(color));
      this.scene.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    container.add([bg, label]);

    return { container, bg, label };
  }

  /**
   * Crea el display de la mano
   */
  createHandDisplay() {
    const containerWidth = this.scene.scale.width * 0.7;
    const containerHeight = 280;
    const xPosition = this.scene.scale.width - containerWidth - 20;
    const yPosition = this.scene.scale.height - containerHeight - 20;

    this.containers.hand = this.scene.add.container(xPosition, yPosition);

    // Fondo
    const bg = this.scene.add.rectangle(
      0, 0,
      containerWidth, containerHeight,
      0x1a1a2e
    );
    bg.setStrokeStyle(3, 0x16213e);
    bg.setOrigin(0, 0);

    // Sombra
    const shadow = this.scene.add.rectangle(
      5, 5,
      containerWidth, containerHeight,
      0x000000, 0.3
    );
    shadow.setOrigin(0, 0);

    // Título
    const title = this.scene.add.text(
      containerWidth / 2, 30,
      'TU MANO',
      {
        fontSize: '28px',
        fill: '#e94560',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Separador
    const separator = this.scene.add.rectangle(
      containerWidth / 2, 60,
      containerWidth - 40, 2,
      0xe94560
    );

    // Contador de cartas restantes (abajo a la derecha)
    const deckCounterX = containerWidth - 120;
    const deckCounterY = containerHeight - 80;

    // Crear carta del dorso
    this.deckCardBack = this.createCardBack(deckCounterX, deckCounterY, 60, 85);

    // Texto con número de cartas
    this.texts.deckCount = this.scene.add.text(
      deckCounterX + 45,
      deckCounterY,
      '52',
      {
        fontSize: '32px',
        fill: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0, 0.5);

    const deckLabel = this.scene.add.text(
      deckCounterX + 45,
      deckCounterY + 25,
      'cartas',
      {
        fontSize: '14px',
        fill: '#ffffff'
      }
    ).setOrigin(0, 0.5);

    // Botón de ordenar (arriba a la derecha)
    const sortButtonX = containerWidth - 80;
    const sortButtonY = 30;

    this.buttons.sort = this.createSortButton(sortButtonX, sortButtonY);
    this.texts.sortMode = this.scene.add.text(
      sortButtonX,
      sortButtonY + 25,
      'Color',
      {
        fontSize: '12px',
        fill: '#ffd700'
      }
    ).setOrigin(0.5);

    this.containers.hand.add([shadow, bg, title, separator, this.deckCardBack, this.texts.deckCount, deckLabel, this.buttons.sort.container, this.texts.sortMode]);
    this.containers.handCards = this.scene.add.container(
      xPosition + containerWidth / 2,
      yPosition + 160
    );

    // Guardar posición de la baraja para animaciones
    this.deckPosition = {
      x: xPosition + deckCounterX,
      y: yPosition + deckCounterY
    };
  }

  /**
   * Crea una carta del dorso
   */
  createCardBack(x, y, width, height) {
    const container = this.scene.add.container(x, y);

    // Fondo de la carta (azul)
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x1e3a8a);
    bg.setStrokeStyle(3, 0xffd700);

    // Patrón decorativo
    const pattern1 = this.scene.add.rectangle(0, 0, width - 10, height - 10);
    pattern1.setStrokeStyle(2, 0x3b82f6);
    pattern1.setFillStyle(0x1e40af);

    const pattern2 = this.scene.add.ellipse(0, 0, width - 20, height - 20);
    pattern2.setStrokeStyle(2, 0x60a5fa);
    pattern2.setFillStyle(0x1e3a8a, 0);

    // Símbolo central decorativo
    const centerText = this.scene.add.text(0, 0, '🎴', {
      fontSize: '24px'
    }).setOrigin(0.5);

    container.add([bg, pattern1, pattern2, centerText]);
    return container;
  }

  /**
   * Crea el botón de ordenar
   */
  createSortButton(x, y) {
    const container = this.scene.add.container(x, y);
    const size = 40;

    const bg = this.scene.add.circle(0, 0, size / 2, 0x4ecca3);
    bg.setStrokeStyle(2, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    // Icono de ordenar (flechas arriba/abajo)
    const icon = this.scene.add.text(0, 0, '⇅', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Efectos hover
    bg.on('pointerover', () => {
      bg.setFillStyle(0x5fddac);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x4ecca3);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    container.add([bg, icon]);

    return { container, bg, icon };
  }

  /**
   * Crea el display de jokers equipados
   */
  createJokersDisplay() {
    const centerX = this.scene.scale.width / 2;
    const yPosition = 100; // Debajo del texto de resultado

    // Contenedor de jokers
    this.containers.jokers = this.scene.add.container(0, 0);

    // Fondo del contenedor
    const containerWidth = 600;
    const containerHeight = 100;
    const bg = this.scene.add.rectangle(
      centerX, yPosition,
      containerWidth, containerHeight,
      0x1a1a2e, 0.8
    );
    bg.setStrokeStyle(2, 0x4ecca3);

    // Título
    this.texts.jokersTitle = this.scene.add.text(
      centerX, yPosition - 35,
      '🃏 COMODINES EQUIPADOS',
      {
        fontSize: '18px',
        fill: '#4ecca3',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.containers.jokers.add([bg, this.texts.jokersTitle]);

    // Array para almacenar sprites de jokers
    this.jokerSprites = [];
  }

  /**
   * Actualiza el display de jokers equipados
   */
  updateJokersDisplay(equippedJokers) {
    // Limpiar jokers anteriores
    this.jokerSprites.forEach(sprite => sprite.destroy());
    this.jokerSprites = [];

    const centerX = this.scene.scale.width / 2;
    const yPosition = 115; // Centro vertical del contenedor
    const spacing = 110; // Espaciado entre jokers
    const startX = centerX - (equippedJokers.length - 1) * spacing / 2;

    equippedJokers.forEach((joker, index) => {
      const x = startX + (index * spacing);

      // Contenedor del joker (para agrupar elementos y efectos)
      const jokerContainer = this.scene.add.container(x, yPosition);

      // Fondo del joker
      const jokerBg = this.scene.add.rectangle(
        0, 0,
        90, 60,
        0x16213e
      );
      jokerBg.setStrokeStyle(2, 0xffd700);

      // Nombre del joker
      const jokerText = this.scene.add.text(
        0, 0,
        joker.name,
        {
          fontSize: '14px',
          fill: '#ffd700',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 85 }
        }
      ).setOrigin(0.5);

      // Botón de descartar (inicialmente oculto)
      const discardBtn = this.scene.add.rectangle(
        0, 0,
        90, 60,
        0xe94560,
        0.95
      );
      discardBtn.setStrokeStyle(2, 0xff6b6b);
      discardBtn.setVisible(false);

      // Texto del botón de descartar
      const refundAmount = Math.floor(joker.cost / 2);
      const discardText = this.scene.add.text(
        0, 0,
        `DESCARTAR\n💰 +${refundAmount}`,
        {
          fontSize: '12px',
          fill: '#ffffff',
          fontStyle: 'bold',
          align: 'center'
        }
      ).setOrigin(0.5);
      discardText.setVisible(false);

      // Hacer el contenedor interactivo
      jokerBg.setInteractive({ useHandCursor: true });

      // Eventos de hover
      jokerBg.on('pointerover', () => {
        // Mostrar botón de descartar
        discardBtn.setVisible(true);
        discardText.setVisible(true);
        jokerText.setVisible(false);

        // Efecto de escala
        this.scene.tweens.add({
          targets: jokerContainer,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100
        });
      });

      jokerBg.on('pointerout', () => {
        // Ocultar botón de descartar
        discardBtn.setVisible(false);
        discardText.setVisible(false);
        jokerText.setVisible(true);

        // Restaurar escala
        this.scene.tweens.add({
          targets: jokerContainer,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      });

      // Evento de clic en el botón de descartar
      jokerBg.on('pointerdown', () => {
        // Llamar al método de descarte en GameScene
        if (this.scene.discardJoker) {
          this.scene.discardJoker(index, joker);
        }
      });

      // Añadir elementos al contenedor del joker
      jokerContainer.add([jokerBg, jokerText, discardBtn, discardText]);

      this.jokerSprites.push(jokerContainer);
      this.containers.jokers.add(jokerContainer);
    });

    // Actualizar visibilidad del título
    if (equippedJokers.length === 0) {
      this.texts.jokersTitle.setText('🃏 SIN COMODINES');
      this.texts.jokersTitle.setStyle({ fill: '#808080' });
    } else {
      this.texts.jokersTitle.setText('🃏 COMODINES EQUIPADOS');
      this.texts.jokersTitle.setStyle({ fill: '#4ecca3' });
    }
  }

  /**
   * Actualiza la puntuación mostrada
   */
  updateScore(evaluation) {
    // Mostrar multiplicador total si hay jokers equipados
    const multText = evaluation.jokerMultiplier > 0
      ? `Multiplicador: x${evaluation.multiplier} (+${evaluation.jokerMultiplier}) = x${evaluation.totalMultiplier}`
      : `Multiplicador: x${evaluation.multiplier}`;
    this.texts.multiplier.setText(multText);
    this.texts.chips.setText(`Fichas: ${evaluation.totalChips}`);
    this.texts.roundScore.setText(`Puntos Jugada: ${evaluation.score}`);

    // Animar el cambio de puntos
    this.scene.tweens.add({
      targets: this.texts.roundScore,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true
    });
  }

  /**
   * Actualiza puntos totales
   */
  updateTotalScore(score) {
    this.texts.totalScore.setText(score.toString());

    // Animar
    this.scene.tweens.add({
      targets: this.texts.totalScore,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true
    });
  }

  /**
   * Actualiza puntos de la ronda actual
   */
  updateRoundScore(score) {
    this.texts.roundScoreTotal.setText(score.toString());

    // Animar
    this.scene.tweens.add({
      targets: this.texts.roundScoreTotal,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true
    });
  }

  /**
   * Actualiza monedas
   */
  updateCoins(coins) {
    this.texts.coins.setText(coins.toString());

    // Animar
    this.scene.tweens.add({
      targets: this.texts.coins,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true
    });
  }

  /**
   * Actualiza información de la ronda
   */
  updateRoundInfo(round, objective) {
    this.texts.roundInfo.setText(`Ronda ${round}`);
    this.texts.roundObjective.setText(`Objetivo: ${objective}`);
  }

  /**
   * Actualiza jugadas restantes
   */
  updatePlaysRemaining(plays) {
    this.texts.playsRemaining.setText(`Jugadas: ${plays}`);
  }

  /**
   * Actualiza descartes restantes
   */
  updateDiscardsRemaining(discards) {
    this.texts.discardsRemaining.setText(`Descartes: ${discards}`);
  }

  /**
   * Actualiza el contador de cartas en la baraja
   */
  updateDeckCount(count) {
    this.texts.deckCount.setText(count.toString());

    // Animar el cambio
    this.scene.tweens.add({
      targets: this.texts.deckCount,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true
    });
  }

  /**
   * Actualiza el modo de ordenamiento
   */
  updateSortMode(mode) {
    this.texts.sortMode.setText(mode === 'suit' ? 'Color' : 'Número');
  }

  /**
   * Aclara un color hexadecimal
   */
  lightenColor(color) {
    const r = ((color >> 16) & 0xFF);
    const g = ((color >> 8) & 0xFF);
    const b = (color & 0xFF);

    return ((Math.min(255, r + 30) << 16) |
            (Math.min(255, g + 30) << 8) |
            Math.min(255, b + 30));
  }

  /**
   * Muestra un mensaje temporal
   */
  showMessage(message, duration = 2000) {
    const messageText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      message,
      {
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: messageText,
      alpha: 1,
      duration: 200,
      onComplete: () => {
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: messageText,
            alpha: 0,
            duration: 200,
            onComplete: () => messageText.destroy()
          });
        });
      }
    });
  }

  /**
   * Crea el menú de usuario en la esquina superior derecha
   */
  createUserMenu() {
    const username = this.scene.userProfile?.username || 'Jugador';

    // Posición en la esquina superior derecha
    const menuX = this.scene.scale.width - 20;
    const menuY = 20;

    this.containers.userMenu = this.scene.add.container(menuX, menuY);

    // Fondo del menú
    const menuBg = this.scene.add.rectangle(
      0, -15,
      200, 60,
      0x1a1a2e
    );
    menuBg.setOrigin(1, 0);
    menuBg.setStrokeStyle(2, 0x4ecca3);

    // Icono de usuario
    const userIcon = this.scene.add.text(-180, 15, '👤', {
      fontSize: '24px'
    }).setOrigin(0, 0.5);

    // Nombre de usuario
    const usernameText = this.scene.add.text(-145, 15, username, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Botón de menú (tres puntos)
    const menuButton = this.scene.add.text(-20, 15, '⋮', {
      fontSize: '28px',
      fill: '#4ecca3',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hacer el botón interactivo
    menuButton.setInteractive({ useHandCursor: true });

    // Crear menú desplegable (inicialmente oculto)
    this.createDropdownMenu(menuX, menuY + 70);

    // Event del botón
    menuButton.on('pointerdown', () => {
      this.toggleDropdownMenu();
    });

    menuButton.on('pointerover', () => {
      menuButton.setStyle({ fill: '#5fddac' });
    });

    menuButton.on('pointerout', () => {
      menuButton.setStyle({ fill: '#4ecca3' });
    });

    this.containers.userMenu.add([menuBg, userIcon, usernameText, menuButton]);
  }

  /**
   * Crea el menú desplegable
   */
  createDropdownMenu(x, y) {
    this.containers.dropdown = this.scene.add.container(x, y);
    this.containers.dropdown.setVisible(false);

    // Fondo del dropdown (más alto para 3 opciones)
    const dropdownBg = this.scene.add.rectangle(
      0, 0,
      180, 150,
      0x1a1a2e
    );
    dropdownBg.setOrigin(1, 0);
    dropdownBg.setStrokeStyle(2, 0xe94560);

    // Opción de Menú Principal
    const mainMenuButton = this.scene.add.rectangle(
      -90, 25,
      160, 40,
      0xffd700
    );
    mainMenuButton.setInteractive({ useHandCursor: true });

    const mainMenuText = this.scene.add.text(-90, 25, '🏠 Menú Principal', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Eventos del botón de menú principal
    mainMenuButton.on('pointerover', () => {
      mainMenuButton.setFillStyle(0xffe44d);
    });

    mainMenuButton.on('pointerout', () => {
      mainMenuButton.setFillStyle(0xffd700);
    });

    mainMenuButton.on('pointerdown', () => {
      this.handleMainMenu();
    });

    // Opción de Ajustes
    const settingsButton = this.scene.add.rectangle(
      -90, 75,
      160, 40,
      0x4ecca3
    );
    settingsButton.setInteractive({ useHandCursor: true });

    const settingsText = this.scene.add.text(-90, 75, '⚙ Ajustes', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Eventos del botón de ajustes
    settingsButton.on('pointerover', () => {
      settingsButton.setFillStyle(0x5fddac);
    });

    settingsButton.on('pointerout', () => {
      settingsButton.setFillStyle(0x4ecca3);
    });

    settingsButton.on('pointerdown', () => {
      this.handleSettings();
    });

    // Opción de cerrar sesión
    const logoutButton = this.scene.add.rectangle(
      -90, 125,
      160, 40,
      0xe94560
    );
    logoutButton.setInteractive({ useHandCursor: true });

    const logoutText = this.scene.add.text(-90, 125, '🚪 Cerrar Sesión', {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Eventos del botón de logout
    logoutButton.on('pointerover', () => {
      logoutButton.setFillStyle(0xf05670);
    });

    logoutButton.on('pointerout', () => {
      logoutButton.setFillStyle(0xe94560);
    });

    logoutButton.on('pointerdown', () => {
      this.handleLogout();
    });

    this.containers.dropdown.add([
      dropdownBg,
      mainMenuButton,
      mainMenuText,
      settingsButton,
      settingsText,
      logoutButton,
      logoutText
    ]);
  }

  /**
   * Alterna la visibilidad del menú desplegable
   */
  toggleDropdownMenu() {
    const isVisible = this.containers.dropdown.visible;
    this.containers.dropdown.setVisible(!isVisible);

    if (!isVisible) {
      // Animar entrada
      this.containers.dropdown.setAlpha(0);
      this.scene.tweens.add({
        targets: this.containers.dropdown,
        alpha: 1,
        duration: 200
      });
    }
  }

  /**
   * Maneja la vuelta al menú principal (PreparationScene)
   */
  handleMainMenu() {
    // Ocultar menú
    this.containers.dropdown.setVisible(false);

    // Ir a la escena de preparación (Menú Principal)
    this.scene.scene.start('PreparationScene');
  }

  /**
   * Maneja la apertura de ajustes
   */
  handleSettings() {
    // Ocultar menú
    this.containers.dropdown.setVisible(false);

    // Guardar el estado completo del juego
    this.scene.saveGameState();

    // Guardar que venimos de GameScene con estado guardado
    this.scene.registry.set('returnToScene', 'GameScene');
    this.scene.registry.set('hasGameState', true);

    // Ir a la escena de ajustes (ahora con scene.start para que se vea bien)
    this.scene.scene.start('SettingsScene');
  }

  /**
   * Maneja el cierre de sesión
   */
  async handleLogout() {
    // Ocultar menú
    this.containers.dropdown.setVisible(false);

    // Importar AuthService dinámicamente para evitar circular dependency
    const AuthService = (await import('../services/AuthService.js')).default;

    // Cerrar sesión
    const result = await AuthService.logout();

    if (result.success) {
      // Fade out
      this.scene.cameras.main.fadeOut(500);

      this.scene.time.delayedCall(500, () => {
        // Volver al menú
        this.scene.scene.start('MenuScene');
      });
    } else {
      this.showMessage('Error al cerrar sesión', 2000);
    }
  }
}
