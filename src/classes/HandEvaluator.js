/**
 * Clase HandEvaluator - Evalúa manos de póker y calcula puntuaciones
 */
export default class HandEvaluator {
  static HAND_VALUES = {
    "Escalera de color": { chips: 100, multiplier: 8 },
    "Póker": { chips: 60, multiplier: 7 },
    "Full House": { chips: 40, multiplier: 4 },
    "Color": { chips: 35, multiplier: 4 },
    "Escalera": { chips: 30, multiplier: 4 },
    "Trío": { chips: 30, multiplier: 3 },
    "Doble pareja": { chips: 20, multiplier: 2 },
    "Pareja": { chips: 10, multiplier: 2 },
    "Carta alta": { chips: 5, multiplier: 1 }
  };

  /**
   * Evalúa una mano de cartas seleccionadas
   * @param {Array} selectedCards - Cartas seleccionadas
   * @param {Array} equippedJokers - Jokers equipados (opcional)
   * @param {Object} gameState - Estado del juego (opcional)
   */
  static evaluate(selectedCards, equippedJokers = [], gameState = {}) {
    if (!selectedCards || selectedCards.length === 0) {
      return {
        hand: "No hay cartas seleccionadas",
        chips: 0,
        multiplier: 0,
        bonusChips: 0,
        score: 0,
        jokerMultiplier: 0,
        jokerChips: 0,
        coinsGenerated: 0
      };
    }

    const handName = this.getHandName(selectedCards);
    const handValue = this.HAND_VALUES[handName] || { chips: 0, multiplier: 0 };
    const relevantCards = this.getRelevantCards(selectedCards, handName);
    const bonusChips = this.calculateBonusChips(relevantCards);

    // Aplicar efectos de jokers
    let jokerMultiplier = 0;
    let jokerChips = 0;
    let coinsGenerated = 0;

    if (equippedJokers && equippedJokers.length > 0) {
      equippedJokers.forEach(joker => {
        const evaluation = {
          hand: handName,
          chips: handValue.chips,
          multiplier: handValue.multiplier,
          bonusChips: bonusChips
        };
        const effect = joker.applyEffect(evaluation, relevantCards, gameState);
        jokerMultiplier += effect.multiplierBonus;
        jokerChips += effect.chipsBonus;
        coinsGenerated += effect.coinsBonus;
      });
    }

    const totalChips = handValue.chips + bonusChips + jokerChips;
    const totalMultiplier = handValue.multiplier + jokerMultiplier;
    const score = totalChips * totalMultiplier;

    return {
      hand: handName,
      chips: handValue.chips,
      multiplier: handValue.multiplier,
      bonusChips: bonusChips,
      jokerChips: jokerChips,
      totalChips: totalChips,
      jokerMultiplier: jokerMultiplier,
      totalMultiplier: totalMultiplier,
      score: score,
      coinsGenerated: coinsGenerated
    };
  }

  /**
   * Determina el nombre de la mano
   */
  static getHandName(cards) {
    if (cards.length === 0) return "No hay cartas seleccionadas";

    const numbers = cards.map(card => card.number);
    const suits = cards.map(card => card.suit);

    // Contar ocurrencias de cada número
    const numberCounts = this.countOccurrences(numbers);
    const counts = Object.values(numberCounts);

    // Verificar mismo palo
    const isFlush = suits.every(suit => suit === suits[0]);

    // Verificar escalera
    const isStraight = this.isStraight(cards);

    // Evaluar manos
    if (isFlush && isStraight && cards.length === 5) return "Escalera de color";
    if (counts.includes(4)) return "Póker";
    if (counts.includes(3) && counts.includes(2)) return "Full House";
    if (isFlush && cards.length === 5) return "Color";
    if (isStraight && cards.length === 5) return "Escalera";
    if (counts.includes(3)) return "Trío";
    if (counts.filter(c => c === 2).length === 2) return "Doble pareja";
    if (counts.includes(2)) return "Pareja";

    return "Carta alta";
  }

  /**
   * Verifica si las cartas forman una escalera
   */
  static isStraight(cards) {
    if (cards.length !== 5) return false;

    let values = cards.map(card => card.getValue()).sort((a, b) => a - b);

    // Escalera normal
    const isNormalStraight = values.every((val, i, arr) =>
      i === 0 || val === arr[i - 1] + 1
    );

    if (isNormalStraight) return true;

    // Escalera baja con As (A-2-3-4-5)
    // Si tenemos un As (14), intentar como As bajo (1)
    if (values[4] === 14) {
      const lowAceValues = [1, ...values.slice(0, 4)].sort((a, b) => a - b);
      return lowAceValues.every((val, i, arr) =>
        i === 0 || val === arr[i - 1] + 1
      );
    }

    return false;
  }

  /**
   * Cuenta las ocurrencias de elementos en un array
   */
  static countOccurrences(array) {
    const counts = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return counts;
  }

  /**
   * Obtiene las cartas relevantes para el cálculo de bonus
   */
  static getRelevantCards(cards, handName) {
    const numberCounts = this.countOccurrences(cards.map(c => c.number));

    switch (handName) {
      case "Póker":
        return cards.filter(card => numberCounts[card.number] === 4);
      case "Trío":
        return cards.filter(card => numberCounts[card.number] === 3);
      case "Doble pareja":
      case "Pareja":
        return cards.filter(card => numberCounts[card.number] === 2);
      case "Full House":
        return cards.filter(card =>
          numberCounts[card.number] === 3 || numberCounts[card.number] === 2
        );
      case "Carta alta":
        // Solo devolver la carta más alta
        return [cards.reduce((highest, card) =>
          card.getValue() > highest.getValue() ? card : highest
        )];
      default:
        // Para escaleras, colores y escalera de color devolver todas
        return cards;
    }
  }

  /**
   * Calcula las fichas bonus basadas en el valor de las cartas
   */
  static calculateBonusChips(cards) {
    return cards.reduce((total, card) => total + card.getChipValue(), 0);
  }

  /**
   * Obtiene información de una mano específica
   */
  static getHandInfo(handName) {
    return this.HAND_VALUES[handName] || null;
  }

  /**
   * Obtiene todas las manos ordenadas por valor
   */
  static getAllHands() {
    return Object.keys(this.HAND_VALUES);
  }
}
