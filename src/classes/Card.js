import ConfigService from '../services/ConfigService.js';

/**
 * Clase Card - Representa una carta individual
 */
export default class Card {
  constructor(number, suit) {
    this.number = number;
    this.suit = suit;
    this.selected = false;
    this.sprite = null; // Referencia al sprite de Phaser
  }

  /**
   * Obtiene el valor numérico de la carta
   */
  getValue() {
    if (this.number === 'A') return 14;
    if (this.number === 'K') return 13;
    if (this.number === 'Q') return 12;
    if (this.number === 'J') return 11;
    return parseInt(this.number);
  }

  /**
   * Obtiene las fichas que aporta esta carta
   */
  getChipValue() {
    if (this.number === 'A') return 11;
    if (['K', 'Q', 'J'].includes(this.number)) return 10;
    return parseInt(this.number);
  }

  /**
   * Obtiene el símbolo del palo
   */
  getSuitSymbol() {
    const symbols = {
      'H': '♥',
      'D': '♦',
      'C': '♣',
      'S': '♠'
    };
    return symbols[this.suit] || this.suit;
  }

  /**
   * Obtiene el color del palo
   */
  getSuitColor() {
    const contrastMode = ConfigService.get('contrastMode');

    if (contrastMode) {
      // Modo contraste: colores diferenciados
      switch (this.suit) {
        case 'H': // Corazones - Rojo
          return '#ff0000';
        case 'D': // Diamantes - Naranja
          return '#ff8800';
        case 'C': // Tréboles - Azul/Cian
          return '#22748dff';
        case 'S': // Picas - Negro
          return '#000000';
        default:
          return '#000000';
      }
    } else {
      // Modo normal: colores tradicionales (rojo y negro)
      return (this.suit === 'H' || this.suit === 'D') ? '#ff0000' : '#000000';
    }
  }

  /**
   * Retorna representación en texto
   */
  toString() {
    return `${this.number}${this.getSuitSymbol()}`;
  }

  /**
   * Alterna el estado de selección
   */
  toggleSelect() {
    this.selected = !this.selected;
    return this.selected;
  }

  /**
   * Deselecciona la carta
   */
  deselect() {
    this.selected = false;
  }
}
