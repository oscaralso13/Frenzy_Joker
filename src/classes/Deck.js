import Card from './Card.js';

/**
 * Clase Deck - Maneja la baraja de cartas
 */
export default class Deck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
    this.suits = ['H', 'D', 'C', 'S'];
    this.numbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.initialize();
  }

  /**
   * Inicializa y crea todas las cartas
   */
  initialize() {
    this.cards = [];
    for (let suit of this.suits) {
      for (let number of this.numbers) {
        this.cards.push(new Card(number, suit));
      }
    }
    this.shuffle();
  }

  /**
   * Baraja las cartas usando el algoritmo Fisher-Yates
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this;
  }

  /**
   * Saca una carta del mazo
   */
  draw() {
    if (this.cards.length === 0) {
      this.reshuffleDiscards();
    }

    // Verificar nuevamente después de reshuffle
    if (this.cards.length === 0) {
      console.warn('⚠️ No hay cartas disponibles en baraja ni descarte');
      return null;
    }

    return this.cards.pop();
  }

  /**
   * Saca múltiples cartas
   */
  drawMultiple(count) {
    const drawnCards = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw();
      if (card) {
        drawnCards.push(card);
      } else {
        // No hay más cartas disponibles
        console.warn(`⚠️ Solo se pudieron robar ${drawnCards.length} de ${count} cartas solicitadas`);
        break;
      }
    }
    return drawnCards;
  }

  /**
   * Descarta cartas
   */
  discard(cards) {
    if (Array.isArray(cards)) {
      this.discardPile.push(...cards);
    } else {
      this.discardPile.push(cards);
    }
  }

  /**
   * Mezcla las cartas descartadas de nuevo en el mazo
   */
  reshuffleDiscards() {
    if (this.discardPile.length === 0) {
      console.warn('No hay cartas para mezclar');
      return;
    }

    this.cards = [...this.discardPile];
    this.discardPile = [];
    this.shuffle();
    console.log('Mazo rebarajado con cartas descartadas');
  }

  /**
   * Resetea el mazo completamente
   */
  reset() {
    this.initialize();
    this.discardPile = [];
  }

  /**
   * Retorna el número de cartas restantes
   */
  remainingCards() {
    return this.cards.length;
  }

  /**
   * Retorna el número de cartas descartadas
   */
  discardedCards() {
    return this.discardPile.length;
  }
}
