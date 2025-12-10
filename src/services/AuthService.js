import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config.js';

/**
 * Servicio de autenticación con Firebase
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateCallbacks = [];
  }

  /**
   * Registra un nuevo usuario
   */
  async register(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Actualizar el perfil con el nombre de usuario
      await updateProfile(userCredential.user, {
        displayName: username
      });

      this.currentUser = userCredential.user;

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          username: username
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Inicia sesión
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          username: userCredential.user.displayName || 'Jugador'
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Cierra sesión
   */
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Observa cambios en el estado de autenticación
   */
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);

    return onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      callback(user);
    });
  }

  /**
   * Maneja errores de Firebase
   */
  handleError(error) {
    let message = 'Ha ocurrido un error';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este email ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operación no permitida';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-credential':
        message = 'Credenciales inválidas';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        message = error.message;
    }

    console.error('Auth Error:', error.code, error.message);

    return {
      success: false,
      error: message
    };
  }

  /**
   * Valida el formato del email
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Valida la contraseña
   */
  validatePassword(password) {
    return password.length >= 6;
  }

  /**
   * Valida el nombre de usuario
   */
  validateUsername(username) {
    return username.length >= 3 && username.length <= 20;
  }
}

// Exportar instancia única
export default new AuthService();
