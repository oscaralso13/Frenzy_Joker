/**
 * Clase Joker - Representa un comodín/joker que modifica la puntuación
 */
export default class Joker {
  constructor(id, name, description, cost, effectType, effectValue, config = {}) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.effectType = effectType;
    this.effectValue = effectValue;
    this.config = config; // Configuración adicional (targetSuit, targetHand, targetValue, etc.)
    this.accumulatedValue = 0; // Para efectos acumulativos
  }

  /**
   * Aplica el efecto del joker a la evaluación
   * @param {Object} evaluation - Evaluación de la mano
   * @param {Array} scoringCards - Cartas que puntuaron en la mano
   * @param {Object} gameState - Estado del juego (para efectos especiales)
   * @returns {Object} - { multiplierBonus, chipsBonus, coinsBonus }
   */
  applyEffect(evaluation, scoringCards, gameState = {}) {
    let multiplierBonus = 0;
    let chipsBonus = 0;
    let coinsBonus = 0;

    switch (this.effectType) {
      case 'constant':
        // Efecto constante: siempre suma al multiplicador
        multiplierBonus = this.effectValue;
        break;

      case 'suit_multiplier':
        // Efecto por palo: suma multiplicador por cada carta del palo que puntúe
        scoringCards.forEach(card => {
          if (card.suit === this.config.targetSuit) {
            multiplierBonus += this.effectValue;
          }
        });
        break;

      case 'hand_type':
        // Efecto basado en tipo de mano
        if (evaluation.hand === this.config.targetHand) {
          multiplierBonus = this.effectValue;
        }
        break;

      case 'card_value':
        // Efecto basado en valores específicos de cartas
        scoringCards.forEach(card => {
          if (card.number === this.config.targetValue) {
            multiplierBonus += this.effectValue;
          }
        });
        break;

      case 'figures':
        // Efecto basado en figuras (J, Q, K)
        const figureCount = scoringCards.filter(card =>
          ['J', 'Q', 'K'].includes(card.number)
        ).length;
        if (figureCount >= this.config.minFigures) {
          chipsBonus = this.effectValue;
        }
        break;

      case 'pair_only':
        // Efecto si juegas exactamente 2 cartas del mismo número
        if (scoringCards.length === 2 && evaluation.hand === 'Pareja') {
          multiplierBonus = this.effectValue;
        }
        break;

      case 'consecutive':
        // Efecto por cartas consecutivas que puntúan
        if (this.areConsecutive(scoringCards)) {
          multiplierBonus = scoringCards.length * this.effectValue;
        }
        break;

      case 'accumulative_discard':
        // Efecto acumulativo por descartes
        // Este se actualiza desde GameScene cuando se descarta
        multiplierBonus = this.accumulatedValue;
        break;

      case 'accumulative_streak':
        // Efecto acumulativo por racha de jugadas sin descartar
        // Este se actualiza desde GameScene
        multiplierBonus = this.accumulatedValue;
        break;

      case 'coins_based':
        // Efecto basado en monedas actuales
        if (gameState.coins) {
          multiplierBonus = Math.floor(gameState.coins / this.config.coinsPerMultiplier);
        }
        break;

      case 'card_count':
        // Efecto basado en cantidad de cartas jugadas
        if (scoringCards.length <= this.config.maxCards) {
          multiplierBonus = this.effectValue;
        }
        break;

      case 'chips_per_card':
        // Fichas por cada carta jugada
        chipsBonus = scoringCards.length * this.effectValue;
        break;

      case 'color_combo':
        // Efecto si todas las cartas son del mismo color
        const allRed = scoringCards.every(card => card.suit === 'H' || card.suit === 'D');
        const allBlack = scoringCards.every(card => card.suit === 'C' || card.suit === 'S');
        if (allRed || allBlack) {
          multiplierBonus = this.effectValue;
        }
        break;

      case 'early_play':
        // Efecto en las primeras jugadas
        if (gameState.playsUsed && gameState.playsUsed <= this.config.maxPlaysUsed) {
          chipsBonus = this.effectValue;
        }
        break;

      case 'coin_generator':
        // Genera monedas al jugar
        if (gameState.coinsGeneratedThisRound < this.config.maxCoinsPerRound) {
          coinsBonus = this.effectValue;
        }
        break;

      case 'no_discards':
        // Efecto si no quedan descartes
        if (gameState.discardsRemaining === 0) {
          multiplierBonus = this.effectValue;
        }
        break;

      case 'resource_boost':
        // Este tipo se maneja al inicio de ronda en GameScene
        break;

      case 'probability':
        // Efecto probabilístico
        const random = Math.random();
        if (random < this.config.probability) {
          multiplierBonus = this.effectValue;
        } else {
          multiplierBonus = this.config.failureValue || 0;
        }
        break;

      case 'last_play':
        // Efecto en la última jugada
        if (gameState.playsRemaining === 1) {
          multiplierBonus = this.effectValue;
        }
        break;
    }

    return { multiplierBonus, chipsBonus, coinsBonus };
  }

  /**
   * Verifica si las cartas son consecutivas
   */
  areConsecutive(cards) {
    if (cards.length < 2) return false;
    const values = cards.map(card => card.getValue()).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Resetea valores acumulativos
   */
  resetAccumulation() {
    this.accumulatedValue = 0;
  }

  /**
   * Incrementa valor acumulativo
   */
  incrementAccumulation(amount = 1) {
    this.accumulatedValue += amount;
    // Aplicar límite si existe
    if (this.config.maxAccumulation) {
      this.accumulatedValue = Math.min(this.accumulatedValue, this.config.maxAccumulation);
    }
  }
}

/**
 * Catálogo de jokers disponibles en el juego
 */
export const JOKER_CATALOG = {
  // Originales
  comodin: new Joker(
    'comodin',
    '🃏 Comodín',
    '+4 Multiplicador',
    5,
    'constant',
    4
  ),
  amante: new Joker(
    'amante',
    '❤️ Amante',
    '+3 Mult. por ♥ que puntúe',
    6,
    'suit_multiplier',
    3,
    { targetSuit: 'H' }
  ),
  jardinero: new Joker(
    'jardinero',
    '☘️ Jardinero',
    '+3 Mult. por ♣ que puntúe',
    6,
    'suit_multiplier',
    3,
    { targetSuit: 'C' }
  ),
  rico: new Joker(
    'rico',
    '💎 Rico',
    '+3 Mult. por ♦ que puntúe',
    6,
    'suit_multiplier',
    3,
    { targetSuit: 'D' }
  ),
  puntas: new Joker(
    'puntas',
    '⚔️ Puntas',
    '+3 Mult. por ♠ que puntúe',
    6,
    'suit_multiplier',
    3,
    { targetSuit: 'S' }
  ),

  // Por tipo de mano
  actor: new Joker(
    'actor',
    '🎭 Actor',
    'x2 Mult. si juegas Pareja',
    5,
    'hand_type',
    2,
    { targetHand: 'Pareja' }
  ),
  escalador: new Joker(
    'escalador',
    '🔥 Escalador',
    'x3 Mult. con Escalera',
    7,
    'hand_type',
    3,
    { targetHand: 'Escalera' }
  ),
  realeza: new Joker(
    'realeza',
    '👑 Realeza',
    '+50 Fichas con 3+ figuras',
    6,
    'figures',
    50,
    { minFigures: 3 }
  ),

  // Por valores de cartas
  afortunado: new Joker(
    'afortunado',
    '🎲 Afortunado',
    '+2 Mult. por cada 7',
    6,
    'card_value',
    2,
    { targetValue: '7' }
  ),
  parOnada: new Joker(
    'parOnada',
    '🃏 Par o Nada',
    'x4 Mult. con pareja pura',
    6,
    'pair_only',
    4
  ),
  ascendente: new Joker(
    'ascendente',
    '📈 Ascendente',
    '+1 Mult. por carta consecutiva',
    7,
    'consecutive',
    1
  ),

  // Acumulativos
  entrenador: new Joker(
    'entrenador',
    '💪 Entrenador',
    '+0.5 Mult. cada descarte',
    5,
    'accumulative_discard',
    0.5,
    { maxAccumulation: 5 }
  ),
  racha: new Joker(
    'racha',
    '🌟 Racha',
    '+1 Mult. por jugada sin descartar',
    6,
    'accumulative_streak',
    1,
    { maxAccumulation: 6 }
  ),
  economista: new Joker(
    'economista',
    '📊 Economista',
    '+1 Mult. cada 10 monedas',
    8,
    'coins_based',
    1,
    { coinsPerMultiplier: 10 }
  ),

  // Por cantidad de cartas
  minimalista: new Joker(
    'minimalista',
    '🎯 Minimalista',
    'x2 Mult. con 3 cartas o menos',
    5,
    'card_count',
    2,
    { maxCards: 3 }
  ),
  malabarista: new Joker(
    'malabarista',
    '🎪 Malabarista',
    '+10 Fichas por carta',
    6,
    'chips_per_card',
    10
  ),

  // Combos
  pintor: new Joker(
    'pintor',
    '🎨 Pintor',
    'x3 Mult. si todas mismo color',
    6,
    'color_combo',
    3
  ),
  velocista: new Joker(
    'velocista',
    '⚡ Velocista',
    '+20 Fichas en 1ª o 2ª jugada',
    5,
    'early_play',
    20,
    { maxPlaysUsed: 2 }
  ),
  generoso: new Joker(
    'generoso',
    '🎁 Generoso',
    '+1 Moneda al jugar (max 3)',
    7,
    'coin_generator',
    1,
    { maxCoinsPerRound: 3 }
  ),

  // Especiales
  nocturno: new Joker(
    'nocturno',
    '🌙 Nocturno',
    'x2 Mult. sin descartes',
    6,
    'no_discards',
    2
  ),
  reciclador: new Joker(
    'reciclador',
    '🔄 Reciclador',
    '+1 Descarte por ronda',
    8,
    'resource_boost',
    1,
    { resourceType: 'discards' }
  ),
  apostador: new Joker(
    'apostador',
    '🎰 Apostador',
    '50% x3 Mult. o x0.5',
    4,
    'probability',
    3,
    { probability: 0.5, failureValue: 0.5 }
  ),
  campeon: new Joker(
    'campeon',
    '🏆 Campeón',
    'x2 Mult. última jugada',
    6,
    'last_play',
    2
  )
};
