import Phaser from 'phaser';
import Deck from './Deck.js';
import Card from './Card.js';
import HandEvaluator from './HandEvaluator.js';
import UI from './UI.js';
import DatabaseService from '../services/DatabaseService.js';
import ConfigService from '../services/ConfigService.js';
import { JOKER_CATALOG } from './Joker.js';

/**
 * Calcula el objetivo de puntos para una ronda específica según la dificultad
 * Rondas 1-10: Escalado progresivo según dificultad
 * Rondas 11+: Escalado exponencial agresivo (modo infinito)
 *
 * @param {number} roundNumber - Número de la ronda
 * @param {string} difficulty - Dificultad: 'easy', 'normal', 'hard'
 */
function calculateRoundObjective(roundNumber, difficulty = 'normal') {
  // Objetivos según dificultad para rondas 1-10
  const objectivesByDifficulty = {
    easy: [
      200,   // Ronda 1
      350,   // Ronda 2
      500,   // Ronda 3
      700,   // Ronda 4
      1000,  // Ronda 5
      1350,  // Ronda 6
      1800,  // Ronda 7
      2400,  // Ronda 8
      3200,  // Ronda 9
      4200   // Ronda 10 - ¡VICTORIA!
    ],
    normal: [
      300,   // Ronda 1
      450,   // Ronda 2
      600,   // Ronda 3
      900,   // Ronda 4
      1250,  // Ronda 5
      1700,  // Ronda 6
      2300,  // Ronda 7
      3100,  // Ronda 8
      4200,  // Ronda 9
      5700   // Ronda 10 - ¡VICTORIA!
    ],
    hard: [
      450,   // Ronda 1
      700,   // Ronda 2
      1000,  // Ronda 3
      1500,  // Ronda 4
      2100,  // Ronda 5
      3000,  // Ronda 6
      4200,  // Ronda 7
      5800,  // Ronda 8
      7800,  // Ronda 9
      10500  // Ronda 10 - ¡VICTORIA!
    ]
  };

  const baseObjectives = objectivesByDifficulty[difficulty] || objectivesByDifficulty.normal;

  if (roundNumber <= 10) {
    return baseObjectives[roundNumber - 1];
  }

  // Rondas 11+ (Modo Infinito): Escalado exponencial según dificultad
  const infiniteFactors = {
    easy: 1.3,    // Escalado suave
    normal: 1.5,  // Escalado balanceado
    hard: 1.7     // Escalado agresivo
  };

  const baseRound10 = baseObjectives[9];
  const factor = infiniteFactors[difficulty] || infiniteFactors.normal;
  const exponent = roundNumber - 10;

  return Math.floor(baseRound10 * Math.pow(factor, exponent));
}

/**
 * Clase GameScene - Escena principal del juego
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Obtener datos del usuario desde el registro
    this.currentUser = this.registry.get('currentUser');
    this.userProfile = this.registry.get('userProfile');

    // Verificar si venimos de una partida guardada
    const savedGameData = this.registry.get('savedGameData');
    this.isLoadingFromSave = savedGameData && savedGameData.fromSavedGame;

    // Verificar si venimos de la tienda
    const shopData = this.registry.get('shopData');
    const fromShop = shopData && shopData.fromShop;

    if (this.isLoadingFromSave) {
      // Restaurar desde partida guardada
      this.loadFromSavedGame(savedGameData);
      // Limpiar el registry
      this.registry.set('savedGameData', null);
    } else if (fromShop) {
      // Restaurar estado desde la tienda
      this.selectedDeck = shopData.selectedDeck;

      // Validar dificultad (protección contra valores antiguos como 'medium')
      const validDifficulties = ['easy', 'normal', 'hard'];
      this.selectedDifficulty = validDifficulties.includes(shopData.selectedDifficulty)
        ? shopData.selectedDifficulty
        : 'normal';

      this.config = ConfigService.getAll();
      this.deck = new Deck();
      this.hand = [];
      this.selectedCards = [];
      this.cardSprites = [];
      this.maxHandSize = 8;
      this.maxSelection = 5;
      this.currentRound = shopData.currentRound;
      this.roundScore = shopData.roundScore;
      this.basePlays = shopData.basePlays;
      this.baseDiscards = shopData.baseDiscards;
      this.playsRemaining = shopData.playsRemaining;
      this.discardsRemaining = shopData.discardsRemaining;
      this.totalScore = shopData.totalScore;
      this.coins = shopData.coins;
      this.equippedJokers = shopData.equippedJokers;
      this.maxJokers = shopData.maxJokers;
      this.handsPlayed = shopData.handsPlayed;
      this.gameStartTime = shopData.gameStartTime;
      this.sortMode = 'suit';
      this.currentEvaluation = {
        hand: '',
        chips: 0,
        multiplier: 1,
        bonusChips: 0,
        totalChips: 0,
        score: 0,
        coinsGenerated: 0
      };

      // Tracking de estado para jokers
      this.playsUsed = 0;
      this.coinsGeneratedThisRound = 0;
      this.lastActionWasDiscard = false;

      // Modo infinito (si está en ronda 11+)
      this.infiniteMode = shopData.infiniteMode || false;
    } else {
      // Inicialización normal (nuevo juego)
      this.selectedDeck = this.registry.get('selectedDeck') || 'default';
      this.selectedDifficulty = this.registry.get('selectedDifficulty') || 'easy';
      this.config = ConfigService.getAll();
      this.deck = new Deck();
      this.hand = [];
      this.selectedCards = [];
      this.cardSprites = [];
      this.maxHandSize = 8;
      this.maxSelection = 5;
      this.currentRound = 1;
      this.roundScore = 0;
      this.basePlays = 4;
      this.baseDiscards = 3;

      // Aplicar bonificaciones de baraja a valores base
      if (this.selectedDeck === 'red') {
        this.baseDiscards += 1;
      } else if (this.selectedDeck === 'blue') {
        this.basePlays += 1;
      }

      this.playsRemaining = this.basePlays;
      this.discardsRemaining = this.baseDiscards;
      this.totalScore = 0;
      this.coins = 4;
      this.equippedJokers = [];
      this.maxJokers = 5;
      this.currentEvaluation = {
        hand: '',
        chips: 0,
        multiplier: 1,
        bonusChips: 0,
        totalChips: 0,
        score: 0,
        coinsGenerated: 0
      };
      this.sortMode = 'suit';
      this.gameStartTime = Date.now();
      this.handsPlayed = {
        "Escalera de color": 0,
        "Póker": 0,
        "Full House": 0,
        "Color": 0,
        "Escalera": 0,
        "Trío": 0,
        "Doble pareja": 0,
        "Pareja": 0,
        "Carta alta": 0
      };

      // Tracking de estado para jokers
      this.playsUsed = 0; // Jugadas usadas en esta ronda
      this.coinsGeneratedThisRound = 0; // Monedas generadas por jokers en esta ronda
      this.lastActionWasDiscard = false; // Para tracking de racha

      // Modo infinito (empieza desactivado en nuevo juego)
      this.infiniteMode = false;
    }

    // Flag para prevenir doble clic
    this.isProcessing = false;
  }

  preload() {
    // Aquí se pueden cargar recursos adicionales
  }

  create() {
    console.log('🎨 create() - isLoadingFromSave:', this.isLoadingFromSave);

    this.ui = new UI(this);
    this.ui.createUI();

    // Actualizar display de jokers equipados
    this.ui.updateJokersDisplay(this.equippedJokers);

    // Configurar eventos de botones
    this.setupButtons();

    // Verificar si venimos de la tienda
    const shopData = this.registry.get('shopData');
    const fromShop = shopData && shopData.fromShop;

    if (this.isLoadingFromSave) {
      console.log('📦 Renderizando partida cargada...');

      // Renderizar la mano cargada
      this.renderHand();

      // Actualizar toda la UI
      this.ui.updateRoundInfo(this.currentRound, calculateRoundObjective(this.currentRound, this.selectedDifficulty));
      this.ui.updateRoundScore(this.roundScore);
      this.ui.updateTotalScore(this.totalScore);
      this.ui.updateCoins(this.coins);
      this.ui.updatePlaysRemaining(this.playsRemaining);
      this.ui.updateDiscardsRemaining(this.discardsRemaining);
      this.ui.updateDeckCount(this.deck.remainingCards());

      // Evaluar la selección actual
      this.evaluateSelection();

      console.log('✅ Partida renderizada correctamente');
    } else if (fromShop) {
      // Limpiar flag
      this.registry.set('shopData', null);
      // Volver de la tienda: iniciar siguiente ronda
      this.startNextRound();
    } else {
      // Verificar si hay un estado guardado (volviendo de ajustes)
      const hasGameState = this.registry.get('hasGameState');
      if (hasGameState) {
        // Restaurar el estado guardado
        this.restoreGameState();

        // Re-renderizar la UI con el estado restaurado
        console.log('Renderizando mano restaurada...');
        this.renderHand();

        // Actualizar la UI con los valores restaurados
        console.log('Actualizando UI:', {
          plays: this.playsRemaining,
          discards: this.discardsRemaining,
          score: this.totalScore
        });

        this.ui.updatePlaysRemaining(this.playsRemaining);
        this.ui.updateDiscardsRemaining(this.discardsRemaining);
        this.ui.updateTotalScore(this.totalScore);
        this.ui.updateDeckCount(this.deck.remainingCards());

        // Actualizar la evaluación con los datos restaurados
        if (this.currentEvaluation && this.currentEvaluation.hand) {
          console.log('Actualizando evaluación:', this.currentEvaluation);
          this.ui.updateScore(this.currentEvaluation);
        } else {
          // Si no hay evaluación guardada, evaluar nuevamente
          console.log('Evaluando selección actual...');
          this.evaluateSelection();
        }
      } else {
        // Inicializar una partida nueva
        // Primero mostrar pantalla de introducción
        this.showIntroScreen();
      }
    }
  }

  /**
   * Configura los eventos de los botones
   */
  setupButtons() {
    this.ui.buttons.play.bg.on('pointerdown', () => this.playHand());
    this.ui.buttons.discard.bg.on('pointerdown', () => this.confirmDiscardCards());
    this.ui.buttons.sort.bg.on('pointerdown', () => this.toggleSortMode());
  }

  /**
   * Reparte la mano inicial
   */
  dealInitialHand() {
    this.hand = this.deck.drawMultiple(this.maxHandSize);

    // Verificar que se pudieron robar todas las cartas iniciales
    if (this.hand.length < this.maxHandSize) {
      console.error('💔 Error crítico: No hay suficientes cartas para iniciar el juego');
      this.ui.showMessage('💔 Error al iniciar: baraja insuficiente', 3000);
      this.time.delayedCall(3000, () => {
        this.scene.start('MenuScene');
      });
      return;
    }

    this.renderHand();
    this.evaluateSelection();
  }

  /**
   * Obtiene las dimensiones de las cartas según el modo compacto
   */
  getCardDimensions() {
    const isCompact = ConfigService.get('compactMode');
    return {
      width: isCompact ? 70 : 90,
      height: isCompact ? 100 : 130
    };
  }

  /**
   * Guarda el estado completo del juego en el registry antes de ir a ajustes
   */
  saveGameStateToRegistry() {
    const gameState = {
      // Estado de las cartas
      hand: this.hand.map(card => ({ suit: card.suit, number: card.number, selected: card.selected })),
      selectedCards: this.selectedCards.map(card => ({ suit: card.suit, number: card.number })),

      // Recursos del jugador
      playsRemaining: this.playsRemaining,
      discardsRemaining: this.discardsRemaining,
      totalScore: this.totalScore,

      // Configuración
      maxHandSize: this.maxHandSize,
      maxSelection: this.maxSelection,
      sortMode: this.sortMode,

      // Evaluación actual
      currentEvaluation: { ...this.currentEvaluation },

      // Estadísticas
      gameStartTime: this.gameStartTime,
      handsPlayed: { ...this.handsPlayed },

      // Configuración de baraja y dificultad
      selectedDeck: this.selectedDeck,
      selectedDifficulty: this.selectedDifficulty,

      // Estado de la baraja (cartas restantes)
      deckState: this.deck.cards.map(card => ({ suit: card.suit, number: card.number }))
    };

    this.registry.set('savedGameState', gameState);
  }

  /**
   * Restaura el estado del juego después de volver de ajustes
   */
  restoreGameState() {
    const gameState = this.registry.get('savedGameState');
    if (!gameState) return false;

    console.log('Restaurando estado del juego:', gameState);

    // Restaurar la baraja con las cartas restantes
    // IMPORTANTE: Card constructor espera (number, suit), no (suit, number)
    this.deck.cards = gameState.deckState.map(cardData =>
      new Card(cardData.number, cardData.suit)
    );

    console.log('Baraja restaurada:', this.deck.cards.length, 'cartas');

    // Restaurar la mano
    // IMPORTANTE: Card constructor espera (number, suit), no (suit, number)
    this.hand = gameState.hand.map(cardData => {
      const card = new Card(cardData.number, cardData.suit);
      if (cardData.selected) card.toggleSelect();
      return card;
    });

    console.log('Mano restaurada:', this.hand.length, 'cartas');

    // Restaurar cartas seleccionadas
    this.selectedCards = this.hand.filter(card => card.selected);

    console.log('Cartas seleccionadas restauradas:', this.selectedCards.length);

    // Restaurar recursos
    this.playsRemaining = gameState.playsRemaining;
    this.discardsRemaining = gameState.discardsRemaining;
    this.totalScore = gameState.totalScore;

    // Restaurar configuración
    this.maxHandSize = gameState.maxHandSize;
    this.maxSelection = gameState.maxSelection;
    this.sortMode = gameState.sortMode;

    // Restaurar evaluación actual (con fallback para coinsGenerated)
    this.currentEvaluation = {
      coinsGenerated: 0,
      ...gameState.currentEvaluation
    };

    // Restaurar estadísticas
    this.gameStartTime = gameState.gameStartTime;
    this.handsPlayed = { ...gameState.handsPlayed };

    // Restaurar configuración de baraja y dificultad
    this.selectedDeck = gameState.selectedDeck;
    this.selectedDifficulty = gameState.selectedDifficulty;

    // Limpiar el estado guardado
    this.registry.set('savedGameState', null);
    this.registry.set('hasGameState', false);

    console.log('Estado restaurado completamente');

    return true;
  }

  /**
   * Aplica cambios de configuración cuando se reanuda desde ajustes
   */
  applyConfigChanges() {
    // Recargar configuración
    this.config = ConfigService.getAll();

    // Re-renderizar la mano para aplicar cambios visuales (modo compacto, etc)
    this.renderHand();
  }

  /**
   * Renderiza las cartas en pantalla
   * @param {Array} newCards - Array de cartas nuevas que deben animarse
   */
  renderHand(newCards = []) {
    // Limpiar sprites anteriores
    this.cardSprites.forEach(sprite => sprite.container.destroy());
    this.cardSprites = [];

    // Filtrar cartas null/undefined por seguridad
    this.hand = this.hand.filter(card => card !== null && card !== undefined);

    const dimensions = this.getCardDimensions();
    const cardWidth = dimensions.width;
    const cardHeight = dimensions.height;
    const spacing = 20;
    const totalWidth = (cardWidth + spacing) * this.hand.length - spacing;
    const startX = -totalWidth / 2 + cardWidth / 2;

    this.hand.forEach((card, index) => {
      const x = startX + (cardWidth + spacing) * index;
      const y = 0;

      // Solo animar si la carta está en el array de cartas nuevas Y los efectos visuales están activados
      const shouldAnimate = newCards.includes(card) && ConfigService.get('visualEffects');
      const cardSprite = this.createCardSprite(card, x, y, cardWidth, cardHeight, shouldAnimate);
      this.ui.containers.handCards.add(cardSprite.container);
      this.cardSprites.push(cardSprite);
    });

    // Actualizar contador de cartas en la baraja
    this.ui.updateDeckCount(this.deck.remainingCards());
  }

  /**
   * Crea los símbolos del centro de la carta según su número
   */
  createCardSymbols(card, width, height) {
    const symbols = [];
    const symbol = card.getSuitSymbol();
    const color = card.getSuitColor();

    // Definir área segura central (cuadrado transparente como referencia)
    // Dejamos un margen de 30px desde los bordes para las esquinas
    const marginTop = 45; // Espacio para número y símbolo superior
    const marginBottom = 45; // Espacio para número y símbolo inferior
    const marginSide = 28; // Margen lateral (aumentado para centrar más los símbolos)

    // Dimensiones del área segura
    const safeAreaWidth = width - (marginSide * 2);
    const safeAreaHeight = height - marginTop - marginBottom;

    // Límites del área segura
    const safeLeft = -safeAreaWidth / 2;
    const safeRight = safeAreaWidth / 2;
    const safeTop = -safeAreaHeight / 2;
    const safeBottom = safeAreaHeight / 2;

    const fontSize = '18px';
    const number = card.number;

    // Para figuras (J, Q, K), mostrar símbolo representativo
    if (['J', 'Q', 'K'].includes(number)) {
      const figureSymbols = {
        'J': '𝐉',  // Corona para Jack/Jota
        'Q': '𝐐',  // Reina para Queen
        'K': '𝐊'   // Rey para King
      };

      symbols.push(
        this.add.text(0, 0, figureSymbols[number], {
          fontSize: '48px',
          fill: color
        }).setOrigin(0.5)
      );
      return symbols;
    }

    // Layouts según el número usando el área segura
    switch(number) {
      case 'A':
        // As: 1 símbolo en el centro
        symbols.push(
          this.add.text(0, 0, symbol, { fontSize: '32px', fill: color }).setOrigin(0.5)
        );
        break;

      case '2':
        // 2: arriba y abajo
        symbols.push(
          this.add.text(0, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '3':
        // 3: arriba, centro, abajo
        symbols.push(
          this.add.text(0, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '4':
        // 4: esquinas del área segura
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '5':
        // 5: esquinas + centro
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '6':
        // 6: dos columnas, 3 filas
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '7':
        // 7: como 6 + 1 arriba centro
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, safeTop/2, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '8':
        // 8: como 6 + 2 en centro
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, safeTop/2, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, safeBottom/2, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '9':
        // 9: patrón 4-1-4
        const midTop = safeTop/2;
        const midBottom = safeBottom/2;
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, midTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, midTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, 0, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, midBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, midBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;

      case '10':
        // 10: patrón 4-2-4
        const quarterTop = safeTop * 0.6;
        const quarterBottom = safeBottom * 0.6;
        symbols.push(
          this.add.text(safeLeft, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(0, safeTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, quarterTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeRight, quarterTop, symbol, { fontSize, fill: color }).setOrigin(0.5)
        );
        symbols.push(
          this.add.text(safeLeft, quarterBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, quarterBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(0, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeLeft, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        symbols.push(
          this.add.text(safeRight, safeBottom, symbol, { fontSize, fill: color }).setOrigin(0.5).setAngle(180)
        );
        break;
    }

    return symbols;
  }

  /**
   * Crea un sprite de carta estilizado
   */
  createCardSprite(card, x, y, width, height, animate = false) {
    const container = this.add.container(x, y);

    // Si debe animar, establecer posición inicial en la baraja
    if (animate && this.ui.deckPosition) {
      const deckPosRelative = {
        x: this.ui.deckPosition.x - this.ui.containers.handCards.x,
        y: this.ui.deckPosition.y - this.ui.containers.handCards.y
      };
      container.setPosition(deckPosRelative.x, deckPosRelative.y);
      container.setAlpha(0);
      container.setScale(0.5);
    }

    // Fondo de la carta
    const bg = this.add.rectangle(0, 0, width, height, 0xffffff);
    bg.setStrokeStyle(3, 0x333333);

    // Sombra
    const shadow = this.add.rectangle(3, 3, width, height, 0x000000, 0.3);

    // Borde de selección (inicialmente invisible)
    const selectionBorder = this.add.rectangle(0, 0, width, height);
    selectionBorder.setStrokeStyle(4, 0xffd700);
    selectionBorder.setVisible(false);

    // Número de la carta
    const numberText = this.add.text(-width / 2 + 10, -height / 2 + 10, card.number, {
      fontSize: '16px',
      fill: card.getSuitColor(),
      fontStyle: 'bold'
    });

    // Símbolo del palo (arriba)
    const suitTop = this.add.text(-width / 2 + 10, -height / 2 + 30, card.getSuitSymbol(), {
      fontSize: '18px',
      fill: card.getSuitColor()
    });

    // Crear símbolos centrales según el número de la carta
    const centerSymbols = this.createCardSymbols(card, width, height);

    // Número y palo invertidos (abajo derecha)
    const numberBottomText = this.add.text(width / 2 - 19, height / 2 - 17.5, card.number, {
      fontSize: '16px',
      fill: card.getSuitColor(),
      fontStyle: 'bold'
    }).setOrigin(1, 1).setAngle(180);

    const suitBottom = this.add.text(width / 2 - 19, height / 2 - 35.5, card.getSuitSymbol(), {
      fontSize: '18px',
      fill: card.getSuitColor()
    }).setOrigin(1, 1).setAngle(180);

    container.add([shadow, bg, selectionBorder, numberText, suitTop, ...centerSymbols, numberBottomText, suitBottom]);

    // Hacer interactivo
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerdown', () => {
      this.toggleCardSelection(card, selectionBorder, container);
    });

    // Efecto hover
    bg.on('pointerover', () => {
      if (!card.selected) {
        this.tweens.add({
          targets: container,
          y: y - 15,
          duration: ConfigService.getAnimationDuration(150)
        });
      }
    });

    bg.on('pointerout', () => {
      if (!card.selected) {
        this.tweens.add({
          targets: container,
          y: y,
          duration: ConfigService.getAnimationDuration(150)
        });
      }
    });

    card.sprite = { container, selectionBorder };

    // Animar entrada si es necesario
    if (animate && this.ui.deckPosition) {
      this.tweens.add({
        targets: container,
        x: x,
        y: y,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: ConfigService.getAnimationDuration(400),
        ease: 'Back.easeOut',
        delay: Math.random() * ConfigService.getAnimationDuration(200) // Pequeño delay aleatorio para efecto en cascada
      });
    }

    return { container, bg, selectionBorder };
  }

  /**
   * Alterna la selección de una carta
   */
  toggleCardSelection(card, selectionBorder, container) {
    if (card.selected) {
      card.deselect();
      selectionBorder.setVisible(false);
      this.tweens.add({
        targets: container,
        y: 0,
        duration: ConfigService.getAnimationDuration(150)
      });
      this.selectedCards = this.selectedCards.filter(c => c !== card);
    } else {
      if (this.selectedCards.length >= this.maxSelection) {
        this.ui.showMessage(`No puedes seleccionar más de ${this.maxSelection} cartas`, 1500);
        return;
      }
      card.toggleSelect();
      selectionBorder.setVisible(true);
      this.tweens.add({
        targets: container,
        y: -15,
        duration: ConfigService.getAnimationDuration(150)
      });
      this.selectedCards.push(card);
    }

    this.evaluateSelection();
  }

  /**
   * Evalúa la selección actual
   */
  evaluateSelection() {
    const gameState = {
      coins: this.coins,
      playsRemaining: this.playsRemaining,
      discardsRemaining: this.discardsRemaining,
      playsUsed: this.playsUsed,
      coinsGeneratedThisRound: this.coinsGeneratedThisRound
    };
    this.currentEvaluation = HandEvaluator.evaluate(this.selectedCards, this.equippedJokers, gameState);
    this.ui.updateScore(this.currentEvaluation);
  }

  /**
   * Anima la salida de cartas hacia abajo
   */
  animateCardsOut(cards, onComplete) {
    const promises = [];

    cards.forEach(card => {
      if (card.sprite && card.sprite.container) {
        const promise = new Promise(resolve => {
          this.tweens.add({
            targets: card.sprite.container,
            y: this.scale.height,
            alpha: 0,
            angle: Math.random() * 30 - 15, // Rotación aleatoria
            duration: ConfigService.getAnimationDuration(600),
            ease: 'Power2',
            onComplete: () => resolve()
          });
        });
        promises.push(promise);
      }
    });

    // Cuando todas las animaciones terminen, ejecutar callback
    Promise.all(promises).then(() => {
      if (onComplete) onComplete();
    });
  }

  /**
   * Alterna el modo de ordenamiento y reordena la mano
   */
  toggleSortMode() {
    // Alternar entre 'suit' y 'rank'
    this.sortMode = this.sortMode === 'suit' ? 'rank' : 'suit';
    this.ui.updateSortMode(this.sortMode);

    // Ordenar la mano con animación
    this.sortHand();
  }

  /**
   * Ordena la mano según el modo actual
   */
  sortHand() {
    // Ordenar el array de cartas
    if (this.sortMode === 'suit') {
      this.sortBySuit();
    } else {
      this.sortByRank();
    }

    // Animar el reordenamiento
    this.animateReorder();
  }

  /**
   * Ordena por color (palo) y luego por valor
   */
  sortBySuit() {
    const suitOrder = { 'H': 0, 'D': 1, 'C': 2, 'S': 3 };

    this.hand.sort((a, b) => {
      // Primero por palo
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      // Dentro del mismo palo, por valor (mayor a menor)
      return b.getValue() - a.getValue();
    });
  }

  /**
   * Ordena solo por valor (número/rango)
   */
  sortByRank() {
    this.hand.sort((a, b) => {
      return b.getValue() - a.getValue(); // De mayor a menor
    });
  }

  /**
   * Anima el reordenamiento de las cartas
   */
  animateReorder() {
    const dimensions = this.getCardDimensions();
    const cardWidth = dimensions.width;
    const cardHeight = dimensions.height;
    const spacing = 20;
    const totalWidth = (cardWidth + spacing) * this.hand.length - spacing;
    const startX = -totalWidth / 2 + cardWidth / 2;

    // Animar cada carta a su nueva posición
    this.cardSprites.forEach((sprite, index) => {
      // Encontrar la carta correspondiente en la mano ordenada
      const card = this.hand[index];
      const cardSpriteIndex = this.cardSprites.findIndex(s => s.container === card.sprite.container);

      if (cardSpriteIndex !== -1) {
        const newX = startX + (cardWidth + spacing) * index;

        this.tweens.add({
          targets: this.cardSprites[cardSpriteIndex].container,
          x: newX,
          duration: ConfigService.getAnimationDuration(400),
          ease: 'Cubic.easeInOut'
        });
      }
    });

    // Reorganizar el array de sprites para que coincida con la mano
    const newCardSprites = [];
    this.hand.forEach(card => {
      const sprite = this.cardSprites.find(s => s.container === card.sprite.container);
      if (sprite) {
        newCardSprites.push(sprite);
      }
    });
    this.cardSprites = newCardSprites;
  }

  /**
   * Juega la mano seleccionada
   */
  async playHand() {
    // Verificar si ya hay una acción en proceso
    if (this.isProcessing) {
      console.warn('⚠️ Acción en proceso, ignorando clic');
      return;
    }

    if (this.selectedCards.length === 0) {
      this.ui.showMessage('Debes seleccionar al menos una carta para jugar', 1500);
      return;
    }

    if (this.playsRemaining <= 0) {
      this.ui.showMessage('No tienes jugadas restantes', 1500);
      return;
    }

    // Activar flag de procesamiento
    this.isProcessing = true;

    // Rastrear la mano jugada para estadísticas
    const handName = this.currentEvaluation.hand;
    if (this.handsPlayed[handName] !== undefined) {
      this.handsPlayed[handName]++;
    }

    // Sumar puntos a la ronda actual y total
    this.roundScore += this.currentEvaluation.score;
    this.totalScore += this.currentEvaluation.score;
    this.ui.updateRoundScore(this.roundScore);
    this.ui.updateTotalScore(this.totalScore);

    // Procesar monedas generadas por jokers
    if (this.currentEvaluation.coinsGenerated > 0) {
      this.coins += this.currentEvaluation.coinsGenerated;
      this.coinsGeneratedThisRound += this.currentEvaluation.coinsGenerated;
      this.ui.updateCoins(this.coins);
    }

    // Incrementar contador de jugadas usadas
    this.playsUsed++;

    // Incrementar joker de racha si no se descartó antes
    if (!this.lastActionWasDiscard) {
      this.equippedJokers.forEach(joker => {
        if (joker.effectType === 'accumulative_streak') {
          joker.incrementAccumulation(joker.effectValue);
        }
      });
    }

    // Marcar que la última acción fue jugar
    this.lastActionWasDiscard = false;

    // Verificar si se alcanzó el objetivo de la ronda
    const currentObjective = calculateRoundObjective(this.currentRound, this.selectedDifficulty);
    if (this.roundScore >= currentObjective) {
      // ¡Ronda completada!
      this.time.delayedCall(800, () => {
        if (this.currentRound === 10 && !this.infiniteMode) {
          // ¡Victoria! Completó la ronda 10
          this.winGame();
        } else {
          // Pasar a la siguiente ronda (o continuar en modo infinito)
          this.completeRound();
        }
      });
      return; // Salir para evitar continuar el flujo normal
    }

    // Reducir jugadas
    this.playsRemaining--;
    this.ui.updatePlaysRemaining(this.playsRemaining);

    // Guardar referencia a las cartas seleccionadas
    const cardsToRemove = [...this.selectedCards];

    // Animar salida de cartas
    this.animateCardsOut(cardsToRemove, async () => {
      // Descartar cartas jugadas
      this.deck.discard(cardsToRemove);

      // Remover cartas de la mano
      cardsToRemove.forEach(card => {
        const index = this.hand.indexOf(card);
        if (index > -1) {
          this.hand.splice(index, 1);
        }
      });

      this.selectedCards = [];

      // Rellenar la mano
      const cardsToDrawCount = this.maxHandSize - this.hand.length;
      const drawnCards = this.deck.drawMultiple(cardsToDrawCount);

      // Verificar si se pudieron robar todas las cartas necesarias
      if (drawnCards.length < cardsToDrawCount) {
        console.error('💔 No hay suficientes cartas en la baraja. ¡Derrota!');
        this.ui.showMessage('💔 ¡Se acabaron las cartas!', 2000);
        this.time.delayedCall(2000, () => {
          this.endGame(false); // Derrota por falta de cartas
        });
        return;
      }

      this.hand.push(...drawnCards);

      // Auto-ordenar si está activado
      if (ConfigService.get('autoSort')) {
        this.sortBySuit();
      }

      // Re-renderizar animando solo las cartas nuevas
      this.renderHand(drawnCards);
      this.evaluateSelection();

      // Guardar progreso después de cada jugada (AWAIT para evitar race condition)
      await this.saveGameState();

      // Liberar flag de procesamiento
      this.isProcessing = false;

      // Verificar si se acabaron las jugadas sin alcanzar el objetivo
      if (this.playsRemaining === 0) {
        // Derrota: se acabaron las jugadas sin alcanzar el objetivo
        this.endGame(false); // false = derrota
      }
    });
  }

  /**
   * Confirma y descarta cartas seleccionadas (si es necesario)
   */
  confirmDiscardCards() {
    if (ConfigService.get('confirmDiscard') && this.selectedCards.length > 0) {
      // Crear diálogo de confirmación
      const confirmed = confirm(`¿Descartar ${this.selectedCards.length} carta(s)?`);
      if (confirmed) {
        this.discardCards();
      }
    } else {
      this.discardCards();
    }
  }

  /**
   * Descarta cartas seleccionadas
   */
  discardCards() {
    // Verificar si ya hay una acción en proceso
    if (this.isProcessing) {
      console.warn('⚠️ Acción en proceso, ignorando clic');
      return;
    }

    if (this.selectedCards.length === 0) {
      this.ui.showMessage('Debes seleccionar al menos una carta para descartar', 1500);
      return;
    }

    if (this.discardsRemaining <= 0) {
      this.ui.showMessage('No tienes descartes restantes', 1500);
      return;
    }

    // Activar flag de procesamiento
    this.isProcessing = true;

    // Incrementar joker de entrenador (acumula por descarte)
    this.equippedJokers.forEach(joker => {
      if (joker.effectType === 'accumulative_discard') {
        joker.incrementAccumulation(joker.effectValue);
      }
    });

    // Resetear joker de racha (se pierde al descartar)
    this.equippedJokers.forEach(joker => {
      if (joker.effectType === 'accumulative_streak') {
        joker.resetAccumulation();
      }
    });

    // Marcar que la última acción fue descartar
    this.lastActionWasDiscard = true;

    // Reducir descartes
    this.discardsRemaining--;
    this.ui.updateDiscardsRemaining(this.discardsRemaining);

    // Guardar referencia a las cartas seleccionadas
    const cardsToRemove = [...this.selectedCards];

    // Animar salida de cartas
    this.animateCardsOut(cardsToRemove, () => {
      // Descartar cartas
      this.deck.discard(cardsToRemove);

      // Remover cartas de la mano
      cardsToRemove.forEach(card => {
        const index = this.hand.indexOf(card);
        if (index > -1) {
          this.hand.splice(index, 1);
        }
      });

      this.selectedCards = [];

      // Rellenar la mano
      const cardsToDrawCount = this.maxHandSize - this.hand.length;
      const drawnCards = this.deck.drawMultiple(cardsToDrawCount);

      // Verificar si se pudieron robar todas las cartas necesarias
      if (drawnCards.length < cardsToDrawCount) {
        console.error('💔 No hay suficientes cartas en la baraja. ¡Derrota!');
        this.ui.showMessage('💔 ¡Se acabaron las cartas!', 2000);
        this.time.delayedCall(2000, () => {
          this.endGame(false); // Derrota por falta de cartas
        });
        return;
      }

      this.hand.push(...drawnCards);

      // Auto-ordenar si está activado
      if (ConfigService.get('autoSort')) {
        this.sortBySuit();
      }

      // Re-renderizar animando solo las cartas nuevas
      this.renderHand(drawnCards);
      this.evaluateSelection();

      // Liberar flag de procesamiento
      this.isProcessing = false;
    });
  }

  /**
   * Descarta un joker y devuelve el 50% de su coste
   */
  discardJoker(index, joker) {
    // Calcular el reembolso (50% del coste, redondeado a entero)
    const refund = Math.floor(joker.cost / 2);

    // Eliminar el joker del array
    this.equippedJokers.splice(index, 1);

    // Devolver monedas
    this.coins += refund;

    // Actualizar UI
    this.ui.updateCoins(this.coins);
    this.ui.updateJokersDisplay(this.equippedJokers);

    // Mostrar mensaje de confirmación
    this.ui.showMessage(`Joker descartado\n💰 +${refund} monedas`, 1500);
  }

  /**
   * Muestra la pantalla de introducción al inicio del juego
   */
  showIntroScreen() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Overlay oscuro
    const overlay = this.add.rectangle(
      0, 0,
      this.scale.width, this.scale.height,
      0x000000, 0.85
    );
    overlay.setOrigin(0, 0);

    // Contenedor (aumentado para más texto)
    const bg = this.add.rectangle(
      centerX, centerY,
      750, 750,
      0x1a1a2e
    );
    bg.setStrokeStyle(5, 0x4ecca3);

    // Título
    const title = this.add.text(centerX, centerY - 330, '🎴 FRENZY JOKER 🎴', {
      fontSize: '48px',
      fill: '#e94560',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtítulo
    const subtitle = this.add.text(centerX, centerY - 270, 'Cómo Jugar', {
      fontSize: '28px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Separador
    const separator1 = this.add.rectangle(
      centerX, centerY - 235,
      700, 2,
      0x4ecca3
    );

    // Determinar objetivos según dificultad
    const difficultyLabels = {
      easy: 'Fácil',
      normal: 'Normal',
      hard: 'Difícil'
    };

    const difficultyLabel = difficultyLabels[this.selectedDifficulty] || 'Normal';

    // Obtener objetivos de las primeras 5 rondas para mostrar
    const round1 = calculateRoundObjective(1, this.selectedDifficulty);
    const round2 = calculateRoundObjective(2, this.selectedDifficulty);
    const round3 = calculateRoundObjective(3, this.selectedDifficulty);
    const round4 = calculateRoundObjective(4, this.selectedDifficulty);
    const round5 = calculateRoundObjective(5, this.selectedDifficulty);
    const round10 = calculateRoundObjective(10, this.selectedDifficulty);

    // Instrucciones
    const instructions = [
      `🎯 OBJETIVO: Completa las 10 rondas (Dificultad: ${difficultyLabel})`,
      '',
      '📊 Ejemplos de objetivos:',
      `   • Ronda 1: ${round1} puntos`,
      `   • Ronda 2: ${round2} puntos`,
      `   • Ronda 3: ${round3} puntos`,
      `   • ...`,
      `   • Ronda 10: ${round10} puntos ¡VICTORIA!`,
      '',
      '🃏 Cómo jugar:',
      '   • Selecciona hasta 5 cartas',
      '   • Forma manos de póker para ganar puntos',
      '   • Usa JUGAR para sumar puntos',
      '   • Usa DESCARTAR para cambiar cartas',
      '',
      '♾️ Modo Infinito: Tras la ronda 10, ¡continúa',
      '    jugando con objetivos cada vez mayores!',
      '',
      '⚠️ Si se acaban las jugadas sin alcanzar',
      '    el objetivo, ¡PIERDES!'
    ];

    const instructionText = this.add.text(
      centerX - 330, centerY - 200,
      instructions.join('\n'),
      {
        fontSize: '17px',
        fill: '#ffffff',
        lineSpacing: 4
      }
    );

    // Separador inferior
    const separator2 = this.add.rectangle(
      centerX, centerY + 260,
      700, 2,
      0x4ecca3
    );

    // Botón comenzar
    const startBtn = this.add.rectangle(centerX, centerY + 320, 300, 60, 0x4ecca3);
    startBtn.setInteractive({ useHandCursor: true });
    startBtn.setStrokeStyle(3, 0xffffff);

    const startText = this.add.text(centerX, centerY + 320, '¡COMENZAR!', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => {
      startBtn.setFillStyle(0x5fddac);
      this.tweens.add({
        targets: [startBtn, startText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    startBtn.on('pointerout', () => {
      startBtn.setFillStyle(0x4ecca3);
      this.tweens.add({
        targets: [startBtn, startText],
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    startBtn.on('pointerdown', () => {
      // Destruir overlay y pantalla
      overlay.destroy();
      bg.destroy();
      title.destroy();
      subtitle.destroy();
      separator1.destroy();
      instructionText.destroy();
      separator2.destroy();
      startBtn.destroy();
      startText.destroy();

      // Iniciar el juego
      this.dealInitialHand();

      // Actualizar la UI con los valores iniciales
      this.ui.updatePlaysRemaining(this.playsRemaining);
      this.ui.updateDiscardsRemaining(this.discardsRemaining);
      this.ui.updateTotalScore(this.totalScore);
      this.ui.updateRoundScore(this.roundScore);
      this.ui.updateRoundInfo(this.currentRound, calculateRoundObjective(this.currentRound, this.selectedDifficulty));
    });

    // Animación de entrada
    bg.setScale(0);
    this.tweens.add({
      targets: bg,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Completa una ronda y pasa a la siguiente
   */
  completeRound() {
    // Calcular monedas ganadas
    const baseCoins = 3; // Monedas base por completar ronda
    const playBonus = this.playsRemaining; // Bonus por jugadas sobrantes
    const interest = Math.min(Math.floor(this.coins / 5), 5); // Interés: 1 moneda por cada 5, máximo 5
    const totalCoinsEarned = baseCoins + playBonus + interest;

    // Guardar valores para mostrar en pantalla
    this.lastRoundCoins = {
      base: baseCoins,
      playBonus: playBonus,
      interest: interest,
      total: totalCoinsEarned,
      previousTotal: this.coins
    };

    // Sumar monedas
    this.coins += totalCoinsEarned;

    // Actualizar UI
    this.ui.updateCoins(this.coins);

    // Mostrar pantalla de ronda completada
    this.showRoundCompleteScreen();
  }

  /**
   * Inicia la siguiente ronda después de completar una
   */
  async startNextRound() {
    // Resetear flag de procesamiento para habilitar botones
    this.isProcessing = false;

    // PRIMERO: Resetear acumulaciones de jokers (antes de cualquier otra cosa)
    this.equippedJokers.forEach(joker => {
      joker.resetAccumulation();
    });
    console.log('✅ Jokers reseteados al inicio de ronda');

    // Incrementar ronda
    this.currentRound++;

    // Activar modo infinito automáticamente si llegamos a ronda 11+
    if (this.currentRound >= 11 && !this.infiniteMode) {
      this.infiniteMode = true;
      console.log('🚀 Modo infinito activado automáticamente en ronda', this.currentRound);
    }

    // Resetear puntos de ronda
    this.roundScore = 0;

    // Resetear recursos (jugadas y descartes)
    this.playsRemaining = this.basePlays;
    this.discardsRemaining = this.baseDiscards;

    // Aplicar bonus de joker Reciclador (+1 descarte por ronda)
    this.equippedJokers.forEach(joker => {
      if (joker.effectType === 'resource_boost' && joker.config.resourceType === 'discards') {
        this.discardsRemaining += joker.effectValue;
      }
    });

    // Resetear tracking de estado para jokers
    this.playsUsed = 0;
    this.coinsGeneratedThisRound = 0;
    this.lastActionWasDiscard = false;

    // Guardar progreso
    await this.saveGameState();

    // Resetear baraja (nueva baraja completa)
    this.deck.reset();

    // Descartar cartas actuales y repartir mano nueva
    this.hand.forEach(card => {
      if (card.sprite && card.sprite.container) {
        card.sprite.container.destroy();
      }
    });
    this.hand = [];
    this.selectedCards = [];
    this.cardSprites = [];

    // Repartir nueva mano
    this.hand = this.deck.drawMultiple(this.maxHandSize);
    this.renderHand();

    // Actualizar UI
    this.ui.updateRoundInfo(this.currentRound, calculateRoundObjective(this.currentRound, this.selectedDifficulty));
    this.ui.updateRoundScore(this.roundScore);
    this.ui.updatePlaysRemaining(this.playsRemaining);
    this.ui.updateDiscardsRemaining(this.discardsRemaining);
    this.evaluateSelection();
  }

  /**
   * Finaliza el juego
   */
  async endGame(isVictory = true) {
    // Calcular tiempo de juego
    const playTime = Math.floor((Date.now() - this.gameStartTime) / 1000); // en segundos

    // Si está en modo infinito (ronda 11+), se considera victoria para las estadísticas
    const isVictoryForStats = this.infiniteMode ? true : isVictory;

    // Limpiar partida guardada (el juego terminó)
    if (this.currentUser) {
      await DatabaseService.clearSavedGame(this.currentUser.uid);
    }

    // Guardar estadísticas en Firebase
    if (this.currentUser) {
      const gameData = {
        finalScore: this.totalScore,
        handsPlayed: this.handsPlayed,
        playTime: playTime,
        isVictory: isVictoryForStats,
        difficulty: this.selectedDifficulty
      };

      await DatabaseService.saveGameStats(this.currentUser.uid, gameData);
    }

    this.time.delayedCall(1000, () => {
      // Mostrar pantalla de fin de juego
      // Si está en modo infinito, mostrar como victoria
      this.showGameOverScreen(isVictoryForStats);
    });
  }

  /**
   * Guarda el estado actual del juego
   */
  async saveGameState() {
    if (!this.currentUser) {
      console.warn('⚠️ No se puede guardar: usuario no autenticado');
      // Mostrar mensaje al usuario
      if (this.ui) {
        this.ui.showMessage('⚠️ Sesión expirada. Datos no guardados.', 3000);
      }
      return { success: false, error: 'not_authenticated' };
    }

    try {
      // Serializar el estado de la mano
      const handData = this.hand.map(card => ({
        suit: card.suit,
        number: card.number
      }));

      // Serializar jokers equipados
      const jokersData = this.equippedJokers.map(joker => ({
        id: joker.id,
        accumulatedValue: joker.accumulatedValue
      }));

      // Serializar el estado de la baraja
      const deckCardsData = this.deck.cards.map(card => ({
        suit: card.suit,
        number: card.number
      }));

      // Serializar la pila de descarte
      const discardPileData = this.deck.discardPile.map(card => ({
        suit: card.suit,
        number: card.number
      }));

      const gameState = {
        selectedDeck: this.selectedDeck,
        selectedDifficulty: this.selectedDifficulty,
        currentRound: this.currentRound,
        roundScore: this.roundScore,
        totalScore: this.totalScore,
        coins: this.coins,
        playsRemaining: this.playsRemaining,
        discardsRemaining: this.discardsRemaining,
        basePlays: this.basePlays,
        baseDiscards: this.baseDiscards,
        hand: handData,
        equippedJokers: jokersData,
        maxJokers: this.maxJokers,
        handsPlayed: this.handsPlayed,
        gameStartTime: this.gameStartTime,
        infiniteMode: this.infiniteMode,
        deckCards: deckCardsData,
        discardPile: discardPileData
      };

      const result = await DatabaseService.saveGameProgress(this.currentUser.uid, gameState);

      // Manejar respuestas de guardado
      if (result.success) {
        if (result.cached) {
          // Guardado en cache local (modo offline)
          if (result.fallback) {
            this.ui.showMessage('⚠️ Sin conexión. Partida guardada localmente.', 2500);
          } else {
            this.ui.showMessage('💾 Modo offline. Partida guardada en cache.', 2000);
          }
        }
        // Si no está cacheado, es guardado normal en Firestore (no mostrar mensaje)
      } else {
        // Manejar errores específicos
        if (result.error === 'permission-denied') {
          this.ui.showMessage('⚠️ Error: No se pudo guardar la partida', 2000);
        } else if (result.error === 'offline_cache_failed') {
          this.ui.showMessage('⚠️ Error: No se pudo guardar ni en cache', 2500);
        }
      }

      return result;
    } catch (error) {
      console.error('Error al guardar partida:', error);

      // Notificar errores de guardado al usuario
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        this.ui.showMessage('⚠️ Sesión expirada. Por favor, vuelve a iniciar sesión.', 3000);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Carga el juego desde una partida guardada
   */
  loadFromSavedGame(savedData) {
    console.log('🎮 Cargando partida guardada...', savedData);

    this.selectedDeck = savedData.selectedDeck;

    // Validar dificultad (protección contra valores antiguos como 'medium')
    const validDifficulties = ['easy', 'normal', 'hard'];
    this.selectedDifficulty = validDifficulties.includes(savedData.selectedDifficulty)
      ? savedData.selectedDifficulty
      : 'normal';

    this.config = ConfigService.getAll();

    // Crear baraja vacía y restaurar su estado
    this.deck = new Deck();

    // Restaurar las cartas que quedaban en la baraja
    if (savedData.deckCards && savedData.deckCards.length > 0) {
      this.deck.cards = savedData.deckCards.map(cardData => new Card(cardData.number, cardData.suit));
      console.log('✅ Baraja restaurada:', this.deck.cards.length, 'cartas restantes');
    } else {
      // Si no hay datos de la baraja guardada, crear una nueva
      console.log('⚠️ No había baraja guardada, creando nueva');
    }

    // Restaurar la pila de descarte
    if (savedData.discardPile && savedData.discardPile.length > 0) {
      this.deck.discardPile = savedData.discardPile.map(cardData => new Card(cardData.number, cardData.suit));
      console.log('✅ Pila de descarte restaurada:', this.deck.discardPile.length, 'cartas');
    } else {
      this.deck.discardPile = [];
    }

    this.hand = [];
    this.selectedCards = [];
    this.cardSprites = [];
    this.maxHandSize = 8;
    this.maxSelection = 5;
    this.currentRound = savedData.currentRound;
    this.roundScore = savedData.roundScore;
    this.infiniteMode = savedData.infiniteMode || false;
    this.basePlays = savedData.basePlays;
    this.baseDiscards = savedData.baseDiscards;
    this.playsRemaining = savedData.playsRemaining;
    this.discardsRemaining = savedData.discardsRemaining;
    this.totalScore = savedData.totalScore;
    this.coins = savedData.coins;
    this.maxJokers = savedData.maxJokers;
    this.handsPlayed = savedData.handsPlayed;
    this.gameStartTime = savedData.gameStartTime;
    this.sortMode = 'suit';
    this.currentEvaluation = {
      hand: '',
      chips: 0,
      multiplier: 1,
      bonusChips: 0,
      totalChips: 0,
      score: 0,
      coinsGenerated: 0
    };

    // Reconstruir jokers equipados
    this.equippedJokers = [];
    if (savedData.equippedJokers) {
      savedData.equippedJokers.forEach(jokerData => {
        const jokerTemplate = JOKER_CATALOG[jokerData.id];
        if (jokerTemplate) {
          const joker = Object.create(Object.getPrototypeOf(jokerTemplate));
          Object.assign(joker, jokerTemplate);
          joker.accumulatedValue = jokerData.accumulatedValue || 0;
          this.equippedJokers.push(joker);
        }
      });
    }
    console.log('✅ Jokers reconstruidos:', this.equippedJokers.length);

    // Reconstruir la mano
    if (savedData.hand && savedData.hand.length > 0) {
      this.hand = savedData.hand.map(cardData => new Card(cardData.number, cardData.suit));
      console.log('✅ Mano reconstruida:', this.hand.length, 'cartas');
    } else {
      this.hand = this.deck.drawMultiple(this.maxHandSize);
      console.log('⚠️ No había mano guardada, repartiendo nueva');
    }

    // Tracking de estado para jokers
    this.playsUsed = 0;
    this.coinsGeneratedThisRound = 0;
    this.lastActionWasDiscard = false;

    // Validar integridad de cartas (debe sumar 52)
    const totalCards = this.hand.length + this.deck.cards.length + this.deck.discardPile.length;
    console.log(`📊 Total de cartas: ${totalCards} (Mano: ${this.hand.length}, Baraja: ${this.deck.cards.length}, Descarte: ${this.deck.discardPile.length})`);

    if (totalCards !== 52) {
      console.error(`⚠️ Error: Total de cartas inconsistente: ${totalCards}/52`);
      console.warn('Resetando baraja completa por seguridad...');

      // Resetear baraja completa como fallback
      this.deck.reset();
      this.hand = this.deck.drawMultiple(this.maxHandSize);

      if (this.ui) {
        this.ui.showMessage('⚠️ Se detectó un error en los datos guardados. Mano reiniciada.', 3000);
      }
    }

    console.log('✅ Partida cargada completamente');
  }

  /**
   * Victoria total - Completó todas las rondas
   */
  async winGame() {
    // Calcular monedas ganadas por completar la última ronda
    const baseCoins = 3; // Monedas base por completar ronda
    const playBonus = this.playsRemaining; // Bonus por jugadas sobrantes
    const interest = Math.min(Math.floor(this.coins / 5), 5); // Interés: 1 moneda por cada 5, máximo 5
    const totalCoinsEarned = baseCoins + playBonus + interest;

    // Guardar valores para mostrar en pantalla
    this.lastRoundCoins = {
      base: baseCoins,
      playBonus: playBonus,
      interest: interest,
      total: totalCoinsEarned,
      previousTotal: this.coins
    };

    // Sumar monedas
    this.coins += totalCoinsEarned;

    // Actualizar UI
    this.ui.updateCoins(this.coins);

    // Guardar estadísticas en Firebase
    const playTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
    if (this.currentUser) {
      const gameData = {
        finalScore: this.totalScore,
        handsPlayed: this.handsPlayed,
        playTime: playTime,
        isVictory: true, // winGame() siempre es victoria
        difficulty: this.selectedDifficulty
      };
      await DatabaseService.saveGameStats(this.currentUser.uid, gameData);
    }

    this.time.delayedCall(1000, () => {
      this.showVictoryScreen();
    });
  }

  /**
   * Muestra pantalla de ronda completada
   */
  showRoundCompleteScreen() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Overlay oscuro
    const overlay = this.add.rectangle(
      0, 0,
      this.scale.width, this.scale.height,
      0x000000, 0.7
    );
    overlay.setOrigin(0, 0);

    // Contenedor (más alto para incluir monedas)
    const bg = this.add.rectangle(
      centerX, centerY,
      600, 550,
      0x1a1a2e
    );
    bg.setStrokeStyle(4, 0x4ecca3);

    // Título
    const title = this.add.text(centerX, centerY - 220, `¡RONDA ${this.currentRound} COMPLETADA!`, {
      fontSize: '42px',
      fill: '#4ecca3',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mensaje de logro
    const message = this.add.text(centerX, centerY - 160, `Objetivo alcanzado: ${calculateRoundObjective(this.currentRound, this.selectedDifficulty)} puntos`, {
      fontSize: '20px',
      fill: '#ffd700'
    }).setOrigin(0.5);

    // Puntos de ronda
    const roundPoints = this.add.text(centerX, centerY - 120, `Puntos obtenidos: ${this.roundScore}`, {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Total acumulado
    const totalPoints = this.add.text(centerX, centerY - 80, `Total acumulado: ${this.totalScore}`, {
      fontSize: '20px',
      fill: '#e94560'
    }).setOrigin(0.5);

    // Separador para monedas
    const separator = this.add.rectangle(
      centerX, centerY - 45,
      500, 2,
      0x4ecca3
    );

    // Título de monedas
    const coinsTitle = this.add.text(centerX, centerY - 15, '💰 MONEDAS GANADAS', {
      fontSize: '22px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Desglose de monedas
    let yOffset = 20;
    const coinTexts = [];

    // Base
    const baseText = this.add.text(centerX, centerY + yOffset, `+${this.lastRoundCoins.base} (Base)`, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    coinTexts.push(baseText);
    yOffset += 30;

    // Bonus por jugadas sobrantes
    if (this.lastRoundCoins.playBonus > 0) {
      const playBonusText = this.add.text(centerX, centerY + yOffset, `+${this.lastRoundCoins.playBonus} (Jugadas sobrantes)`, {
        fontSize: '18px',
        fill: '#4ecca3'
      }).setOrigin(0.5);
      coinTexts.push(playBonusText);
      yOffset += 30;
    }

    // Interés
    if (this.lastRoundCoins.interest > 0) {
      const interestText = this.add.text(centerX, centerY + yOffset, `+${this.lastRoundCoins.interest} (Interés)`, {
        fontSize: '18px',
        fill: '#00d9ff'
      }).setOrigin(0.5);
      coinTexts.push(interestText);
      yOffset += 30;
    }

    // Total de monedas
    const totalCoinsText = this.add.text(centerX, centerY + yOffset + 10, `Total monedas: ${this.coins}`, {
      fontSize: '24px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    coinTexts.push(totalCoinsText);

    // Botón continuar (más abajo)
    const continueBtn = this.add.rectangle(centerX, centerY + 210, 300, 60, 0x4ecca3);
    continueBtn.setInteractive({ useHandCursor: true });
    continueBtn.setStrokeStyle(3, 0xffffff);

    const continueText = this.add.text(centerX, centerY + 210, 'CONTINUAR', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    continueBtn.on('pointerover', () => {
      continueBtn.setFillStyle(0x5fddac);
    });

    continueBtn.on('pointerout', () => {
      continueBtn.setFillStyle(0x4ecca3);
    });

    continueBtn.on('pointerdown', async () => {
      // Destruir overlay y pantalla
      overlay.destroy();
      bg.destroy();
      title.destroy();
      message.destroy();
      roundPoints.destroy();
      totalPoints.destroy();
      separator.destroy();
      coinsTitle.destroy();
      coinTexts.forEach(text => text.destroy());
      continueBtn.destroy();
      continueText.destroy();

      // Si es ronda 2 o 4, ir a la tienda
      if (this.currentRound === 2 || this.currentRound === 4) {
        await this.goToShop();
      } else {
        // Si no, iniciar siguiente ronda
        await this.startNextRound();
      }
    });

    // Animación de entrada
    bg.setScale(0);
    this.tweens.add({
      targets: bg,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Muestra pantalla de victoria total
   */
  showVictoryScreen() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Overlay oscuro
    const overlay = this.add.rectangle(
      0, 0,
      this.scale.width, this.scale.height,
      0x000000, 0.9
    );
    overlay.setOrigin(0, 0);

    // Contenedor (más alto para incluir monedas)
    const bg = this.add.rectangle(
      centerX, centerY,
      600, 650,
      0x1a1a2e
    );
    bg.setStrokeStyle(5, 0xffd700);

    // Título
    const title = this.add.text(centerX, centerY - 270, '🏆 ¡VICTORIA TOTAL! 🏆', {
      fontSize: '48px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mensaje
    const message = this.add.text(centerX, centerY - 200, '¡Completaste las 10 rondas!', {
      fontSize: '24px',
      fill: '#4ecca3'
    }).setOrigin(0.5);

    // Submensaje - modo infinito
    const subMessage = this.add.text(centerX, centerY - 165, '¿Quieres continuar en modo infinito?', {
      fontSize: '18px',
      fill: '#ffffff',
      alpha: 0.8
    }).setOrigin(0.5);

    // Puntuación final
    const scoreText = this.add.text(centerX, centerY - 150, `Puntuación Final: ${this.totalScore}`, {
      fontSize: '32px',
      fill: '#e94560',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // High Score
    let highScoreText = '';
    if (this.userProfile && this.userProfile.stats) {
      const isNewHighScore = this.totalScore > this.userProfile.stats.highScore;
      if (isNewHighScore) {
        highScoreText = '🎉 ¡NUEVO RÉCORD! 🎉';
      } else {
        highScoreText = `Tu récord: ${this.userProfile.stats.highScore}`;
      }
    }

    const highScore = this.add.text(centerX, centerY - 100, highScoreText, {
      fontSize: '22px',
      fill: '#4ecca3'
    }).setOrigin(0.5);

    // Separador para monedas
    const separator = this.add.rectangle(
      centerX, centerY - 65,
      500, 2,
      0xffd700
    );

    // Título de monedas
    const coinsTitle = this.add.text(centerX, centerY - 35, '💰 MONEDAS GANADAS', {
      fontSize: '22px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Desglose de monedas
    let yOffset = 0;
    const coinTexts = [];

    // Base
    const baseText = this.add.text(centerX, centerY + yOffset, `+${this.lastRoundCoins.base} (Base)`, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    coinTexts.push(baseText);
    yOffset += 30;

    // Bonus por jugadas sobrantes
    if (this.lastRoundCoins.playBonus > 0) {
      const playBonusText = this.add.text(centerX, centerY + yOffset, `+${this.lastRoundCoins.playBonus} (Jugadas sobrantes)`, {
        fontSize: '18px',
        fill: '#4ecca3'
      }).setOrigin(0.5);
      coinTexts.push(playBonusText);
      yOffset += 30;
    }

    // Interés
    if (this.lastRoundCoins.interest > 0) {
      const interestText = this.add.text(centerX, centerY + yOffset, `+${this.lastRoundCoins.interest} (Interés)`, {
        fontSize: '18px',
        fill: '#00d9ff'
      }).setOrigin(0.5);
      coinTexts.push(interestText);
      yOffset += 30;
    }

    // Total de monedas
    const totalCoinsText = this.add.text(centerX, centerY + yOffset + 10, `Total monedas: ${this.coins}`, {
      fontSize: '24px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    coinTexts.push(totalCoinsText);

    // Botón CONTINUAR (Modo Infinito)
    const continueBtn = this.add.rectangle(centerX, centerY + 180, 350, 60, 0x4ecca3);
    continueBtn.setInteractive({ useHandCursor: true });
    continueBtn.setStrokeStyle(3, 0xffffff);

    const continueText = this.add.text(centerX, centerY + 180, '🚀 CONTINUAR (MODO INFINITO)', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    continueBtn.on('pointerover', () => {
      continueBtn.setFillStyle(0x5fddac);
    });

    continueBtn.on('pointerout', () => {
      continueBtn.setFillStyle(0x4ecca3);
    });

    continueBtn.on('pointerdown', async () => {
      // Destruir todos los elementos
      overlay.destroy();
      bg.destroy();
      title.destroy();
      message.destroy();
      subMessage.destroy();
      scoreText.destroy();
      highScore.destroy();
      separator.destroy();
      coinsTitle.destroy();
      coinTexts.forEach(text => text.destroy());
      continueBtn.destroy();
      continueText.destroy();
      endBtn.destroy();
      endText.destroy();

      // Activar modo infinito
      this.infiniteMode = true;
      console.log('🚀 Modo infinito activado - Ronda 11+');

      // Pasar a la siguiente ronda (ronda 11)
      await this.startNextRound();
    });

    // Botón TERMINAR PARTIDA
    const endBtn = this.add.rectangle(centerX, centerY + 260, 350, 60, 0xe94560);
    endBtn.setInteractive({ useHandCursor: true });
    endBtn.setStrokeStyle(3, 0xffffff);

    const endText = this.add.text(centerX, centerY + 260, '✓ TERMINAR PARTIDA', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    endBtn.on('pointerover', () => {
      endBtn.setFillStyle(0xf05670);
    });

    endBtn.on('pointerout', () => {
      endBtn.setFillStyle(0xe94560);
    });

    endBtn.on('pointerdown', () => {
      // Destruir todos los elementos
      overlay.destroy();
      bg.destroy();
      title.destroy();
      message.destroy();
      subMessage.destroy();
      scoreText.destroy();
      highScore.destroy();
      separator.destroy();
      coinsTitle.destroy();
      coinTexts.forEach(text => text.destroy());
      continueBtn.destroy();
      continueText.destroy();
      endBtn.destroy();
      endText.destroy();

      // Ir al menú de preparación
      this.scene.start('PreparationScene');
    });

    // Animación de entrada
    bg.setScale(0);
    this.tweens.add({
      targets: bg,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Muestra la pantalla de Game Over con opciones
   */
  showGameOverScreen(isVictory = true) {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Overlay oscuro
    const overlay = this.add.rectangle(
      0, 0,
      this.scale.width, this.scale.height,
      0x000000, 0.8
    );
    overlay.setOrigin(0, 0);

    // Contenedor de Game Over
    const gameOverBg = this.add.rectangle(
      centerX, centerY,
      500, 400,
      0x1a1a2e
    );
    gameOverBg.setStrokeStyle(4, 0xe94560);

    // Título (diferente según modo de juego)
    let titleText;
    if (this.infiniteMode) {
      titleText = '🏆 ¡FIN DEL MODO INFINITO! 🏆';
    } else {
      titleText = isVictory ? '¡JUEGO TERMINADO!' : '💔 DERROTA 💔';
    }

    const title = this.add.text(centerX, centerY - 140, titleText, {
      fontSize: '36px',
      fill: this.infiniteMode ? '#ffd700' : '#e94560',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mensaje según el modo
    if (this.infiniteMode) {
      const infiniteMessage = this.add.text(centerX, centerY - 100, `¡Llegaste hasta la ronda ${this.currentRound}!`, {
        fontSize: '20px',
        fill: '#4ecca3',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else if (!isVictory) {
      const defeatMessage = this.add.text(centerX, centerY - 100, `No alcanzaste el objetivo de ${calculateRoundObjective(this.currentRound, this.selectedDifficulty)} puntos`, {
        fontSize: '18px',
        fill: '#ffd700'
      }).setOrigin(0.5);
    }

    // Puntuación final
    const scoreText = this.add.text(centerX, centerY - 80, `Puntuación Final: ${this.totalScore}`, {
      fontSize: '28px',
      fill: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // High Score del usuario
    let highScoreText = '';
    if (this.userProfile && this.userProfile.stats) {
      const isNewHighScore = this.totalScore > this.userProfile.stats.highScore;
      if (isNewHighScore) {
        highScoreText = '🎉 ¡NUEVO RÉCORD! 🎉';
      } else {
        highScoreText = `Tu récord: ${this.userProfile.stats.highScore}`;
      }
    }

    const highScore = this.add.text(centerX, centerY - 40, highScoreText, {
      fontSize: '20px',
      fill: '#4ecca3'
    }).setOrigin(0.5);

    // Botón Jugar de nuevo
    const playAgainBtn = this.add.rectangle(centerX, centerY + 40, 250, 50, 0x4ecca3);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.setStrokeStyle(2, 0xffffff);

    const playAgainText = this.add.text(centerX, centerY + 40, 'JUGAR DE NUEVO', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    playAgainBtn.on('pointerover', () => {
      playAgainBtn.setFillStyle(0x5fddac);
    });

    playAgainBtn.on('pointerout', () => {
      playAgainBtn.setFillStyle(0x4ecca3);
    });

    playAgainBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    // Botón Menú principal
    const menuBtn = this.add.rectangle(centerX, centerY + 110, 250, 50, 0xe94560);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.setStrokeStyle(2, 0xffffff);

    const menuText = this.add.text(centerX, centerY + 110, 'MENÚ PRINCIPAL', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => {
      menuBtn.setFillStyle(0xf05670);
    });

    menuBtn.on('pointerout', () => {
      menuBtn.setFillStyle(0xe94560);
    });

    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * Va a la tienda y guarda el estado del juego
   */
  async goToShop() {
    // PRIMERO: Guardar estado en Firebase antes de cambiar de escena
    if (this.currentUser) {
      const result = await this.saveGameState();
      if (!result.success) {
        console.warn('⚠️ Advertencia: Estado no guardado en Firebase antes de ir a tienda');
        this.ui.showMessage('⚠️ Advertencia: Estado del juego no guardado', 2000);
      }
    }

    // Guardar datos temporales para la tienda
    this.registry.set('shopData', {
      coins: this.coins,
      equippedJokers: this.equippedJokers,
      maxJokers: this.maxJokers,
      currentRound: this.currentRound,
      totalScore: this.totalScore,
      roundScore: this.roundScore,
      playsRemaining: this.playsRemaining,
      discardsRemaining: this.discardsRemaining,
      basePlays: this.basePlays,
      baseDiscards: this.baseDiscards,
      selectedDeck: this.selectedDeck,
      selectedDifficulty: this.selectedDifficulty,
      infiniteMode: this.infiniteMode,
      handsPlayed: this.handsPlayed,
      gameStartTime: this.gameStartTime
    });

    // Ir a la tienda
    this.scene.start('ShopScene');
  }

  update() {
    // Lógica de actualización si es necesaria
  }

  /**
   * Limpieza al salir de la escena
   */
  shutdown() {
    // Detener todas las animaciones
    this.tweens.killAll();
    this.time.removeAllEvents();

    // Limpiar registry de datos temporales (no usuario/perfil)
    const keysToClean = ['savedGameData', 'shopData', 'hasGameState', 'savedGameState', 'returnToScene'];
    keysToClean.forEach(key => {
      this.registry.set(key, null);
    });

    console.log('🧹 GameScene cleanup completado');
  }
}
