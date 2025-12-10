import Phaser from 'phaser';
import AuthService from '../services/AuthService.js';
import DatabaseService from '../services/DatabaseService.js';

/**
 * Escena del menú principal con autenticación
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init() {
    this.isLoginMode = true; // true = login, false = registro
    this.isLoading = false;
  }

  create() {
    // Verificar si ya hay un usuario logueado
    AuthService.onAuthStateChange((user) => {
      if (user && !this.isLoading) {
        this.loadUserDataAndStart(user);
      }
    });

    this.createBackground();
    this.createTitle();
    this.createLoginForm();
    this.createToggleButton();
  }

  /**
   * Crea el fondo
   */
  createBackground() {
    // Fondo degradado
    const bg = this.add.rectangle(
      0, 0,
      this.scale.width,
      this.scale.height,
      0x0f0c29
    );
    bg.setOrigin(0, 0);

    // Partículas decorativas (cartas flotantes)
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * this.scale.width;
      const y = Math.random() * this.scale.height;
      const card = this.add.text(x, y, ['♥', '♦', '♣', '♠'][Math.floor(Math.random() * 4)], {
        fontSize: '32px',
        fill: '#ffffff',
        alpha: 0.1
      });

      this.tweens.add({
        targets: card,
        y: y + 100,
        alpha: 0,
        duration: 5000 + Math.random() * 3000,
        repeat: -1,
        yoyo: true
      });
    }
  }

  /**
   * Crea el título
   */
  createTitle() {
    const centerX = this.scale.width / 2;

    // Título principal
    const title = this.add.text(centerX, 100, '🎴 FRENZY JOKER 🎴', {
      fontSize: '64px',
      fill: '#e94560',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Animación del título
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtítulo
    this.add.text(centerX, 170, '¿Quién llegará más alto?', {
      fontSize: '24px',
      fill: '#ffd700',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  }

  /**
   * Crea el formulario de login/registro
   */
  createLoginForm() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Contenedor del formulario
    const formWidth = 450;
    const formHeight = 400;

    const formBg = this.add.rectangle(
      centerX, centerY,
      formWidth, formHeight,
      0x1a1a2e
    );
    formBg.setStrokeStyle(3, 0x16213e);

    // Título del formulario
    this.formTitle = this.add.text(centerX, centerY - 150, 'INICIAR SESIÓN', {
      fontSize: '32px',
      fill: '#4ecca3',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Crear campos HTML (email, password, username)
    this.createHTMLInputs(centerX, centerY);

    // Botón de acción principal (LOGIN/REGISTRO)
    this.createActionButton(centerX, centerY + 110);

    // Mensaje de error/éxito
    this.messageText = this.add.text(centerX, centerY + 160, '', {
      fontSize: '16px',
      fill: '#e94560',
      wordWrap: { width: formWidth - 40 }
    }).setOrigin(0.5);
  }

  /**
   * Crea inputs HTML (más funcionales que los de Phaser)
   */
  createHTMLInputs(centerX, centerY) {
    // Obtener la posición del canvas en la página
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calcular la escala del canvas
    const scaleX = canvasRect.width / this.scale.width;
    const scaleY = canvasRect.height / this.scale.height;

    // Calcular coordenadas absolutas
    const absoluteX = canvasRect.left + (centerX * scaleX);
    const absoluteY = canvasRect.top + (centerY * scaleY);

    // Ancho y tamaño escalados (fijos, no cambian dinámicamente)
    const inputWidth = 350 * scaleX;
    const inputPadding = 12 * scaleY;
    const inputFontSize = 16 * scaleY;

    const inputStyle = `
      width: ${inputWidth}px;
      padding: ${inputPadding}px;
      font-size: ${inputFontSize}px;
      border: 2px solid #16213e;
      border-radius: 5px;
      background: #0f0c29;
      color: #ffffff;
      font-family: Arial;
      margin-bottom: 15px;
      z-index: 1000;
    `;

    // Email
    this.emailInput = document.createElement('input');
    this.emailInput.type = 'email';
    this.emailInput.placeholder = 'Email';
    this.emailInput.style.cssText = inputStyle;
    this.emailInput.style.position = 'absolute';
    this.emailInput.style.left = `${absoluteX - (inputWidth / 2)}px`;
    this.emailInput.style.top = `${absoluteY - (50 * scaleY)}px`;

    // Password
    this.passwordInput = document.createElement('input');
    this.passwordInput.type = 'password';
    this.passwordInput.placeholder = 'Contraseña (mín. 6 caracteres)';
    this.passwordInput.style.cssText = inputStyle;
    this.passwordInput.style.position = 'absolute';
    this.passwordInput.style.left = `${absoluteX - (inputWidth / 2)}px`;
    this.passwordInput.style.top = `${absoluteY + (10 * scaleY)}px`;

    // Username (solo para registro)
    this.usernameInput = document.createElement('input');
    this.usernameInput.type = 'text';
    this.usernameInput.placeholder = 'Nombre de usuario';
    this.usernameInput.style.cssText = inputStyle;
    this.usernameInput.style.position = 'absolute';
    this.usernameInput.style.left = `${absoluteX - (inputWidth / 2)}px`;
    this.usernameInput.style.top = `${absoluteY - (110 * scaleY)}px`;
    this.usernameInput.style.display = 'none'; // Oculto inicialmente

    // Añadir al DOM
    document.body.appendChild(this.emailInput);
    document.body.appendChild(this.passwordInput);
    document.body.appendChild(this.usernameInput);

    // Event listeners para Enter
    this.emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAuth();
    });
    this.passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAuth();
    });
    this.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAuth();
    });
  }

  /**
   * Crea el botón de acción principal
   */
  createActionButton(centerX, centerY) {
    const buttonBg = this.add.rectangle(centerX, centerY, 200, 50, 0x4ecca3);
    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.setStrokeStyle(2, 0xffffff);

    this.actionButtonText = this.add.text(centerX, centerY, 'ENTRAR', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x5fddac);
      this.tweens.add({
        targets: [buttonBg, this.actionButtonText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x4ecca3);
      this.tweens.add({
        targets: [buttonBg, this.actionButtonText],
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    buttonBg.on('pointerdown', () => this.handleAuth());
  }

  /**
   * Crea el botón para alternar entre login y registro
   */
  createToggleButton() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 200;

    this.toggleText = this.add.text(
      centerX, centerY -20,
      '¿No tienes cuenta? Regístrate',
      {
        fontSize: '16px',
        fill: '#ffd700',
        fontStyle: 'italic'
      }
    ).setOrigin(0.5);

    this.toggleText.setInteractive({ useHandCursor: true });

    this.toggleText.on('pointerover', () => {
      this.toggleText.setStyle({ fill: '#ffffff' });
    });

    this.toggleText.on('pointerout', () => {
      this.toggleText.setStyle({ fill: '#ffd700' });
    });

    this.toggleText.on('pointerdown', () => {
      this.toggleMode();
    });
  }

  /**
   * Alterna entre modo login y registro
   */
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;

    if (this.isLoginMode) {
      this.formTitle.setText('INICIAR SESIÓN');
      this.actionButtonText.setText('ENTRAR');
      this.toggleText.setText('¿No tienes cuenta? Regístrate');
      this.usernameInput.style.display = 'none';
    } else {
      this.formTitle.setText('CREAR CUENTA');
      this.actionButtonText.setText('REGISTRARSE');
      this.toggleText.setText('¿Ya tienes cuenta? Inicia sesión');
      this.usernameInput.style.display = 'block';
    }

    this.messageText.setText('');
  }

  /**
   * Maneja el login o registro
   */
  async handleAuth() {
    if (this.isLoading) return;

    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const username = this.usernameInput.value.trim();

    // Validar
    if (!email || !password) {
      this.showMessage('Por favor completa todos los campos', 'error');
      return;
    }

    if (!this.isLoginMode && !username) {
      this.showMessage('Por favor ingresa un nombre de usuario', 'error');
      return;
    }

    this.isLoading = true;
    this.showMessage('Procesando...', 'info');

    try {
      let result;

      if (this.isLoginMode) {
        // LOGIN
        result = await AuthService.login(email, password);
      } else {
        // REGISTRO
        result = await AuthService.register(email, password, username);

        if (result.success) {
          // Crear perfil en Firestore
          await DatabaseService.createUserProfile(
            result.user.uid,
            username,
            email
          );
        }
      }

      if (result.success) {
        this.showMessage('¡Éxito! Cargando...', 'success');
        await this.loadUserDataAndStart(result.user);
      } else {
        this.showMessage(result.error, 'error');
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('Error inesperado', 'error');
      this.isLoading = false;
    }
  }

  /**
   * Carga datos del usuario e inicia el juego
   */
  async loadUserDataAndStart(user) {
    // Actualizar último login
    await DatabaseService.updateLastLogin(user.uid);

    // Obtener datos del usuario
    const profileResult = await DatabaseService.getUserProfile(user.uid);

    if (profileResult.success) {
      // Guardar datos para la siguiente escena
      this.registry.set('currentUser', user);
      this.registry.set('userProfile', profileResult.data);

      // Limpia los inputs del DOM
      this.cleanupInputs();

      // Transición al juego
      this.cameras.main.fadeOut(1000);

      this.time.delayedCall(1000, () => {
        this.scene.start('PreparationScene');
      });
    } else {
      this.showMessage('Error al cargar perfil', 'error');
      this.isLoading = false;
    }
  }

  /**
   * Muestra mensajes al usuario
   */
  showMessage(text, type = 'error') {
    const colors = {
      error: '#e94560',
      success: '#4ecca3',
      info: '#ffd700'
    };

    this.messageText.setText(text);
    this.messageText.setStyle({ fill: colors[type] || colors.error });
  }

  /**
   * Limpia los inputs HTML al salir
   */
  cleanupInputs() {
    if (this.emailInput && this.emailInput.parentNode) {
      this.emailInput.parentNode.removeChild(this.emailInput);
    }
    if (this.passwordInput && this.passwordInput.parentNode) {
      this.passwordInput.parentNode.removeChild(this.passwordInput);
    }
    if (this.usernameInput && this.usernameInput.parentNode) {
      this.usernameInput.parentNode.removeChild(this.usernameInput);
    }
  }

  /**
   * Limpia inputs al destruir la escena
   */
  shutdown() {
    this.cleanupInputs();
  }
}
