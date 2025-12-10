/**
 * Servicio de configuración del juego
 * Guarda configuraciones en localStorage
 */
class ConfigService {
  constructor() {
    this.configKey = 'frenzyJokerConfig';
    this.defaultConfig = {
      // Ajustes de juego
      animationSpeed: 'normal', // 'slow', 'normal', 'fast', 'none'
      autoSort: false,
      compactMode: false,
      confirmDiscard: false,
      visualEffects: true,
      contrastMode: true, // Colores diferenciados para los palos

      // Barajas desbloqueadas
      unlockedDecks: ['default'], // 'default', 'red', 'blue'

      // Última configuración de juego
      lastSelectedDeck: 'default',
      lastSelectedDifficulty: 'easy'
    };

    this.loadConfig();
  }

  /**
   * Carga la configuración desde localStorage
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        this.config = { ...this.defaultConfig, ...JSON.parse(saved) };
      } else {
        this.config = { ...this.defaultConfig };
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  /**
   * Guarda la configuración en localStorage
   */
  saveConfig() {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config));
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  }

  /**
   * Obtiene un valor de configuración
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Establece un valor de configuración
   */
  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  /**
   * Obtiene toda la configuración
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Resetea la configuración a valores por defecto
   */
  reset() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
  }

  /**
   * Desbloquea una baraja
   */
  unlockDeck(deckId) {
    if (!this.config.unlockedDecks.includes(deckId)) {
      this.config.unlockedDecks.push(deckId);
      this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * Verifica si una baraja está desbloqueada
   */
  isDeckUnlocked(deckId) {
    return this.config.unlockedDecks.includes(deckId);
  }

  /**
   * Obtiene la duración de animación según la configuración
   */
  getAnimationDuration(baseDuration) {
    const speed = this.config.animationSpeed;
    switch (speed) {
      case 'slow':
        return baseDuration * 1.5;
      case 'normal':
        return baseDuration;
      case 'fast':
        return baseDuration * 0.5;
      case 'none':
        return 0;
      default:
        return baseDuration;
    }
  }
}

// Exportar instancia única
export default new ConfigService();
