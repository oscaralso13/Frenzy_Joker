import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * Helper para verificar conectividad
 */
const isOnline = () => {
  return navigator.onLine;
};

/**
 * Servicio de base de datos con Firestore
 * Ahora incluye manejo robusto de reconexión y eventos de red
 */
class DatabaseService {
  constructor() {
    this.usersCollection = 'users';
    this.localCacheKey = 'frenzyJoker_cachedGame';
    this.isOnlineState = navigator.onLine;
    this.syncInProgress = false;

    // Configurar listeners de eventos de red
    this.setupNetworkListeners();
  }

  /**
   * Configura listeners para eventos de red (online/offline)
   * Esto detecta cambios de red y sincroniza automáticamente
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // También detectar cambios de visibilidad de la página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        // Cuando el usuario vuelve a la pestaña, verificar conexión
        this.handleOnline();
      }
    });
  }

  /**
   * Maneja el evento cuando la conexión se restaura
   */
  async handleOnline() {
    const wasOffline = !this.isOnlineState;
    this.isOnlineState = true;

    if (wasOffline) {
      console.log('✅ Conexión restaurada - Sincronizando datos pendientes...');

      // Sincronizar cache pendiente automáticamente
      try {
        await this.syncCachedGame();
      } catch (error) {
        console.error('Error al sincronizar después de reconexión:', error);
      }
    }
  }

  /**
   * Maneja el evento cuando se pierde la conexión
   */
  handleOffline() {
    this.isOnlineState = false;
    console.log('⚠️ Conexión perdida - Los cambios se guardarán localmente');
  }

  /**
   * Ejecuta una operación con reintentos automáticos y backoff exponencial
   * Útil para operaciones que pueden fallar por problemas de red
   */
  async retryWithBackoff(fn, maxRetries = 3, operation = 'operación') {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;

        // Si es un error de red y no es el último intento, reintentar
        if (!isLastAttempt && this.isNetworkError(error)) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`⚠️ Error de red en ${operation}. Reintentando en ${delay/1000}s... (intento ${attempt + 2}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Si es el último intento o no es un error de red, lanzar error
        throw error;
      }
    }
  }

  /**
   * Verifica si un error es de tipo red/conectividad
   */
  isNetworkError(error) {
    if (!error) return false;

    const networkErrorCodes = [
      'unavailable',
      'deadline-exceeded',
      'network-request-failed',
      'timeout'
    ];

    const errorCode = error.code?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    return networkErrorCodes.some(code =>
      errorCode.includes(code) || errorMessage.includes(code)
    );
  }

  /**
   * Crea el perfil inicial del usuario
   */
  async createUserProfile(userId, username, email) {
    try {
      const userRef = doc(db, this.usersCollection, userId);

      const userData = {
        userId: userId,
        username: username,
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),

        stats: {
          totalScore: 0,
          highScore: 0,
          gamesPlayed: 0,
          averageScore: 0,
          totalPlayTime: 0,

          // Victorias por dificultad
          victoriesEasy: 0,
          victoriesNormal: 0,
          victoriesHard: 0,

          // Estadísticas de manos jugadas
          bestHands: {
            "Escalera de color": 0,
            "Póker": 0,
            "Full House": 0,
            "Color": 0,
            "Escalera": 0,
            "Trío": 0,
            "Doble pareja": 0,
            "Pareja": 0,
            "Carta alta": 0
          }
        }
      };

      await setDoc(userRef, userData);

      console.log('Perfil de usuario creado exitosamente');
      return { success: true, data: userData };
    } catch (error) {
      console.error('Error al crear perfil:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el perfil del usuario
   * Ahora con reintentos automáticos
   */
  async getUserProfile(userId) {
    try {
      return await this.retryWithBackoff(
        async () => {
          const userRef = doc(db, this.usersCollection, userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            return { success: true, data: userSnap.data() };
          } else {
            return { success: false, error: 'Usuario no encontrado' };
          }
        },
        3,
        'obtener perfil de usuario'
      );
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza el último inicio de sesión
   */
  async updateLastLogin(userId) {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error al actualizar login:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Guarda estadísticas de una partida completada
   * Ahora con reintentos automáticos
   */
  async saveGameStats(userId, gameData) {
    try {
      return await this.retryWithBackoff(
        async () => {
          const userRef = doc(db, this.usersCollection, userId);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            return { success: false, error: 'Usuario no encontrado' };
          }

          const currentData = userSnap.data();
          const currentStats = currentData.stats || {};

          // Calcular nuevo promedio
          const newGamesPlayed = (currentStats.gamesPlayed || 0) + 1;
          const newTotalScore = (currentStats.totalScore || 0) + gameData.finalScore;
          const newAverageScore = Math.round(newTotalScore / newGamesPlayed);

          // Actualizar high score si es necesario
          const newHighScore = Math.max(
            currentStats.highScore || 0,
            gameData.finalScore
          );

          // Actualizar contador de manos jugadas
          const updatedBestHands = { ...(currentStats.bestHands || {}) };
          if (gameData.handsPlayed) {
            Object.keys(gameData.handsPlayed).forEach(handName => {
              updatedBestHands[handName] = (updatedBestHands[handName] || 0) + gameData.handsPlayed[handName];
            });
          }

          // Preparar objeto de actualización
          const updateData = {
            'stats.totalScore': newTotalScore,
            'stats.highScore': newHighScore,
            'stats.gamesPlayed': newGamesPlayed,
            'stats.averageScore': newAverageScore,
            'stats.totalPlayTime': increment(gameData.playTime || 0),
            'stats.bestHands': updatedBestHands
          };

          // Incrementar victorias por dificultad si es victoria
          if (gameData.isVictory) {
            // Validar y normalizar dificultad
            const validDifficulties = ['easy', 'normal', 'hard'];
            const difficulty = validDifficulties.includes(gameData.difficulty)
              ? gameData.difficulty
              : 'normal'; // Fallback a normal si es inválido o undefined

            const difficultyMap = {
              'easy': 'victoriesEasy',
              'normal': 'victoriesNormal',
              'hard': 'victoriesHard'
            };

            const victoryField = difficultyMap[difficulty];
            updateData[`stats.${victoryField}`] = increment(1);
            console.log(`✅ Victoria registrada en dificultad: ${difficulty}`);

            if (gameData.difficulty !== difficulty) {
              console.warn(`⚠️ Dificultad inválida '${gameData.difficulty}' normalizada a '${difficulty}'`);
            }
          }

          // Actualizar documento
          await updateDoc(userRef, updateData);

          console.log('Estadísticas guardadas exitosamente');
          return {
            success: true,
            data: {
              totalScore: newTotalScore,
              highScore: newHighScore,
              gamesPlayed: newGamesPlayed,
              averageScore: newAverageScore
            }
          };
        },
        3,
        'guardar estadísticas del juego'
      );
    } catch (error) {
      console.error('Error al guardar estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza estadísticas en tiempo real durante el juego
   */
  async updateHandPlayed(userId, handName) {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      const fieldPath = `stats.bestHands.${handName}`;

      await updateDoc(userRef, {
        [fieldPath]: increment(1)
      });

      return { success: true };
    } catch (error) {
      console.error('Error al actualizar mano:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene las mejores puntuaciones globales (leaderboard)
   */
  async getLeaderboard(limitCount = 10) {
    try {
      const usersRef = collection(db, this.usersCollection);

      // Crear query ordenada por highScore descendente
      const q = query(
        usersRef,
        orderBy('stats.highScore', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      const leaderboard = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaderboard.push({
          userId: data.userId,
          username: data.username,
          highScore: data.stats?.highScore || 0,
          gamesPlayed: data.stats?.gamesPlayed || 0,
          averageScore: data.stats?.averageScore || 0
        });
      });

      return { success: true, data: leaderboard };
    } catch (error) {
      console.error('Error al obtener leaderboard:', error);

      // Si el error es por falta de índice, dar instrucciones
      if (error.code === 'failed-precondition') {
        console.error('NECESITAS CREAR UN ÍNDICE EN FIRESTORE:');
        console.error('1. Ve a Firebase Console > Firestore Database > Indexes');
        console.error('2. Crea un índice compuesto para:');
        console.error('   - Collection: users');
        console.error('   - Field: stats.highScore (Descending)');
        console.error('O haz clic en el enlace que aparece en el error de la consola');
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene la posición de un usuario en el leaderboard
   */
  async getUserRank(userId) {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const userScore = userSnap.data().stats?.highScore || 0;

      // Contar cuántos usuarios tienen mejor puntuación
      const usersRef = collection(db, this.usersCollection);
      const q = query(
        usersRef,
        orderBy('stats.highScore', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let rank = 1;

      for (const doc of querySnapshot.docs) {
        const score = doc.data().stats?.highScore || 0;
        if (score > userScore) {
          rank++;
        } else if (doc.id === userId) {
          break;
        }
      }

      return {
        success: true,
        data: {
          rank: rank,
          highScore: userScore,
          totalPlayers: querySnapshot.size
        }
      };
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Guarda el estado actual de la partida
   * Ahora con reintentos automáticos y mejor manejo de errores
   */
  async saveGameProgress(userId, gameState) {
    // Verificar conectividad
    if (!isOnline()) {
      console.warn('⚠️ Sin conexión. Guardando en cache local...');
      const cacheResult = this.saveToLocalCache(userId, gameState);

      if (cacheResult.success) {
        return { success: true, cached: true };
      } else {
        return { success: false, error: 'offline_cache_failed', cached: false };
      }
    }

    try {
      // Intentar guardar con reintentos automáticos
      await this.retryWithBackoff(
        async () => {
          const userRef = doc(db, this.usersCollection, userId);
          await updateDoc(userRef, {
            savedGame: {
              ...gameState,
              savedAt: serverTimestamp()
            }
          });
        },
        3,
        'guardar progreso del juego'
      );

      console.log('✅ Partida guardada automáticamente');

      // Si había cache pendiente, marcarla como sincronizada
      const cachedData = localStorage.getItem(this.localCacheKey);
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        if (!cache.synced) {
          cache.synced = true;
          localStorage.setItem(this.localCacheKey, JSON.stringify(cache));
          console.log('✅ Cache local sincronizada');
        }
      }

      return { success: true, cached: false };
    } catch (error) {
      console.error('❌ Error al guardar progreso después de reintentos:', error);

      // Si falla Firestore después de reintentos, guardar en cache como fallback
      console.warn('⚠️ Guardando en cache como fallback...');
      const cacheResult = this.saveToLocalCache(userId, gameState);

      if (cacheResult.success) {
        return { success: true, cached: true, fallback: true };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene la partida guardada del usuario
   */
  async getSavedGame(userId) {
    // Si estamos online, intentar sincronizar cache pendiente primero
    if (isOnline()) {
      try {
        await this.syncCachedGame();
      } catch (error) {
        console.warn('Error al sincronizar cache:', error);
        // Continuar de todas formas
      }
    }

    // Verificar conectividad antes de intentar Firestore
    if (!isOnline()) {
      console.warn('⚠️ Sin conexión. Obteniendo partida del cache local...');
      const cacheResult = this.getFromLocalCache(userId);

      if (cacheResult.success && cacheResult.data) {
        return { success: true, data: cacheResult.data, fromCache: true };
      } else {
        return { success: false, error: 'offline_no_cache' };
      }
    }

    try {
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const savedGame = userSnap.data().savedGame || null;

      if (savedGame) {
        // Verificar que la partida no sea muy antigua (más de 7 días)
        const savedAt = savedGame.savedAt?.toDate();
        const now = new Date();
        const daysDiff = (now - savedAt) / (1000 * 60 * 60 * 24);

        if (daysDiff > 7) {
          // Partida muy antigua, eliminarla
          await this.clearSavedGame(userId);
          return { success: true, data: null };
        }
      }

      return { success: true, data: savedGame, fromCache: false };
    } catch (error) {
      console.error('Error al obtener partida guardada:', error);

      // Si falla Firestore, intentar obtener del cache como fallback
      console.warn('⚠️ Error de Firestore. Intentando obtener del cache...');
      const cacheResult = this.getFromLocalCache(userId);

      if (cacheResult.success && cacheResult.data) {
        return { success: true, data: cacheResult.data, fromCache: true, fallback: true };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Elimina la partida guardada
   */
  async clearSavedGame(userId) {
    try {
      const userRef = doc(db, this.usersCollection, userId);

      await updateDoc(userRef, {
        savedGame: null
      });

      console.log('Partida guardada eliminada');
      return { success: true };
    } catch (error) {
      console.error('Error al limpiar partida guardada:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Guarda partida en cache local (localStorage)
   */
  saveToLocalCache(userId, gameState) {
    try {
      const cacheData = {
        userId: userId,
        gameState: gameState,
        cachedAt: new Date().toISOString(),
        synced: false
      };

      localStorage.setItem(this.localCacheKey, JSON.stringify(cacheData));
      console.log('💾 Partida guardada en cache local');
      return { success: true };
    } catch (error) {
      console.error('Error al guardar en cache local:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza partida cacheada con Firestore
   * Ahora con protección contra sincronizaciones concurrentes
   */
  async syncCachedGame() {
    // Evitar sincronizaciones múltiples simultáneas
    if (this.syncInProgress) {
      console.log('⏳ Sincronización ya en progreso, omitiendo...');
      return { success: false, error: 'sync_in_progress' };
    }

    this.syncInProgress = true;

    try {
      const cachedData = localStorage.getItem(this.localCacheKey);
      if (!cachedData) {
        return { success: true, synced: false };
      }

      const cache = JSON.parse(cachedData);

      // Si ya está sincronizada, no hacer nada
      if (cache.synced) {
        return { success: true, synced: true };
      }

      // Verificar conectividad
      if (!isOnline()) {
        console.log('⚠️ Sin conexión, no se puede sincronizar cache');
        return { success: false, error: 'offline' };
      }

      // Intentar sincronizar con Firestore usando reintentos
      console.log('🔄 Sincronizando cache con Firestore...');

      const result = await this.retryWithBackoff(
        async () => {
          const userRef = doc(db, this.usersCollection, cache.userId);
          await updateDoc(userRef, {
            savedGame: {
              ...cache.gameState,
              savedAt: serverTimestamp()
            }
          });
          return { success: true };
        },
        3,
        'sincronización de cache'
      );

      if (result.success) {
        // Marcar como sincronizado
        cache.synced = true;
        localStorage.setItem(this.localCacheKey, JSON.stringify(cache));
        console.log('✅ Cache sincronizada con Firestore');
        return { success: true, synced: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error al sincronizar cache:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obtiene partida del cache local
   */
  getFromLocalCache(userId) {
    try {
      const cachedData = localStorage.getItem(this.localCacheKey);
      if (!cachedData) {
        return { success: true, data: null };
      }

      const cache = JSON.parse(cachedData);

      // Verificar que sea del mismo usuario
      if (cache.userId !== userId) {
        return { success: true, data: null };
      }

      // Verificar que no sea muy antigua (más de 7 días)
      const cachedAt = new Date(cache.cachedAt);
      const now = new Date();
      const daysDiff = (now - cachedAt) / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) {
        localStorage.removeItem(this.localCacheKey);
        return { success: true, data: null };
      }

      return { success: true, data: cache.gameState };
    } catch (error) {
      console.error('Error al obtener cache local:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica si el usuario tiene una partida guardada
   */
  async hasSavedGame(userId) {
    try {
      const result = await this.getSavedGame(userId);
      if (!result.success) return { success: false, error: result.error };

      return { success: true, data: result.data !== null };
    } catch (error) {
      console.error('Error al verificar partida guardada:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia única
export default new DatabaseService();
