# Frenzy Joker - Documentación Completa

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
3. [Flujo de la Aplicación](#flujo-de-la-aplicación)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Servicios](#servicios)
6. [Clases del Juego](#clases-del-juego)
7. [Escenas de Phaser](#escenas-de-phaser)
8. [Sistema de Puntuación](#sistema-de-puntuación)
9. [Sistema de Barajas](#sistema-de-barajas)
10. [Sistema de Monedas](#sistema-de-monedas)
11. [Sistema de Comodines (Jokers)](#sistema-de-comodines-jokers)
12. [Tienda (ShopScene)](#tienda-shopscene)
13. [Integración con Firebase](#integración-con-firebase)
14. [Configuración y Ajustes](#configuración-y-ajustes)
15. [Registro de Cambios y Correcciones](#registro-de-cambios-y-correcciones)

---

## Descripción General

**Frenzy Joker** es un juego de cartas tipo póker desarrollado con **Phaser 3** (motor de juegos 2D) y **Firebase** (backend). Los jugadores deben formar manos de póker para acumular puntos a través de **5 rondas progresivas**, cada una con un objetivo de puntuación más alto.

### Características principales:
- Sistema de autenticación con email/contraseña
- **Sistema de rondas progresivas** con 5 niveles de dificultad
- **Objetivos por ronda**: 300 → 450 → 600 → 900 → 1250 puntos
- 3 tipos de barajas con bonificaciones únicas
- **Sistema de monedas**: Gana monedas por completar rondas, con bonus por jugadas sobrantes e interés
- **Sistema de comodines (Jokers)**: 24 jokers únicos con efectos variados para modificar la puntuación
- **Tienda**: Aparece después de las rondas 2 y 4 para comprar jokers
- Sistema de puntuación basado en manos de póker
- Persistencia de estadísticas en Firebase Firestore
- Interfaz visual estilo cartas de póker realistas
- Configuraciones personalizables (velocidad de animación, modo compacto, etc.)
- Pantalla de introducción explicativa
- Transiciones entre rondas con pantallas informativas

---

## Arquitectura de la Aplicación

### Stack Tecnológico
```
Frontend:
- Phaser 3 (motor de juego 2D)
- Vite (bundler y dev server)
- JavaScript (ES6+)

Backend:
- Firebase Authentication
- Firebase Firestore (base de datos)
- Firebase Hosting (opcional)
```

### Patrón de Diseño
- **Singleton**: Los servicios (AuthService, DatabaseService, ConfigService) son instancias únicas
- **Scene Management**: Phaser maneja el flujo entre escenas (MenuScene → PreparationScene → GameScene → SettingsScene)
- **MVC-like**:
  - **Model**: Clases Card, Deck, HandEvaluator
  - **View**: UI, Escenas de Phaser
  - **Controller**: GameScene orquesta la lógica del juego

---

## Flujo de la Aplicación

### Diagrama de Flujo General
```
┌─────────────────┐
│   index.html    │
│   carga main.js │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          main.js (Phaser Config)        │
│  - Inicializa Phaser con 4 escenas     │
│  - Configuración de escala y física     │
└────────┬────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│          1. MenuScene                    │
│  - Login / Registro con Firebase Auth   │
│  - Validación de credenciales           │
│  - Si autenticado → PreparationScene    │
└────────┬─────────────────────────────────┘
         │ (Usuario autenticado)
         ▼
┌──────────────────────────────────────────┐
│      2. PreparationScene                 │
│  - Selección de baraja (default/red/blue)│
│  - Selección de dificultad (easy/medium/hard)│
│  - Botón Jugar → GameScene              │
│  - Botón Ajustes → SettingsScene        │
│  - Botón Cerrar sesión → MenuScene      │
└────────┬─────────────────────────────────┘
         │ (Configuración lista)
         ▼
┌──────────────────────────────────────────┐
│           3. GameScene                   │
│  - Muestra pantalla de introducción     │
│  - Inicializa sistema de 5 rondas       │
│  - Aplica bonificaciones de baraja      │
│                                          │
│  RONDA 1 (Objetivo: 300 puntos):        │
│  - Inicializa baraja (52 cartas)        │
│  - Reparte 8 cartas                      │
│  - Loop de juego:                        │
│    • Seleccionar hasta 5 cartas         │
│    • Evaluar mano (HandEvaluator)       │
│    • JUGAR: suma puntos a la ronda      │
│    • DESCARTAR: reemplaza cartas        │
│    • Rellena mano hasta 8 cartas        │
│                                          │
│  ¿Alcanzó objetivo de la ronda?         │
│    SÍ → Pantalla Ronda Completada       │
│    NO y jugadas=0 → DERROTA             │
│                                          │
│  RONDAS 2-4: Mismo flujo con objetivos  │
│  crecientes (450, 600, 900)             │
│                                          │
│  RONDA 5 (Objetivo: 1250 puntos):       │
│  - Si completa → ¡VICTORIA TOTAL!       │
│  - Si falla → DERROTA                   │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│       Pantallas de Finalización          │
│                                          │
│  A) Ronda Completada (rondas 1-4):      │
│     - Muestra objetivo alcanzado        │
│     - Total acumulado                   │
│     - Botón CONTINUAR → Siguiente ronda │
│                                          │
│  B) Victoria Total (ronda 5):           │
│     - "¡VICTORIA TOTAL!"                │
│     - Puntuación final                  │
│     - Compara con high score            │
│     - Guarda estadísticas               │
│     - Opciones: Jugar de nuevo / Menú   │
│                                          │
│  C) Derrota (cualquier ronda):          │
│     - "DERROTA"                         │
│     - Objetivo no alcanzado             │
│     - Puntuación alcanzada              │
│     - Guarda estadísticas               │
│     - Opciones: Jugar de nuevo / Menú   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│        4. SettingsScene                  │
│  - Ajustes de animación                  │
│  - Modo compacto                         │
│  - Auto-ordenar cartas                   │
│  - Confirmar descartes                   │
│  - Efectos visuales                      │
│  - Volver a escena anterior              │
└──────────────────────────────────────────┘
```

---

## Estructura de Archivos

```
Frenzy_Joker/
│
├── index.html                  # Punto de entrada HTML
├── package.json                # Dependencias del proyecto
│
├── src/
│   ├── main.js                 # Configuración inicial de Phaser
│   ├── style.css               # Estilos CSS
│   │
│   ├── classes/
│   │   ├── Card.js             # Clase carta individual
│   │   ├── Deck.js             # Clase baraja de 52 cartas
│   │   ├── HandEvaluator.js    # Evaluador de manos de póker
│   │   ├── Joker.js            # Clase comodín y catálogo de 24 jokers
│   │   ├── UI.js               # Interfaz de usuario del juego
│   │   ├── MenuScene.js        # Escena de login/registro
│   │   ├── PreparationScene.js # Escena de selección de baraja
│   │   ├── GameScene.js        # Escena principal del juego
│   │   ├── ShopScene.js        # Escena de tienda de jokers
│   │   └── SettingsScene.js    # Escena de configuración
│   │
│   ├── services/
│   │   ├── AuthService.js      # Servicio de autenticación Firebase
│   │   ├── DatabaseService.js  # Servicio de Firestore
│   │   └── ConfigService.js    # Servicio de configuración local
│   │
│   └── firebase/
│       ├── config.js           # Configuración de Firebase (credenciales)
│       └── config.example.js   # Plantilla de configuración
│
└── public/                     # Archivos estáticos (si los hay)
```

---

## Servicios

### 1. AuthService (src/services/AuthService.js)

**Propósito**: Gestiona la autenticación de usuarios con Firebase Authentication.

**Métodos principales**:

```javascript
// Registrar nuevo usuario
async register(email, password, username)
// Retorna: { success: true, user: { uid, email, username } } o { success: false, error: string }

// Iniciar sesión
async login(email, password)
// Retorna: { success: true, user: { uid, email, username } } o { success: false, error: string }

// Cerrar sesión
async logout()
// Retorna: { success: true } o { success: false, error: string }

// Observar cambios en autenticación
onAuthStateChange(callback)
// Ejecuta callback(user) cuando el estado de auth cambia

// Obtener usuario actual
getCurrentUser()
// Retorna: objeto user o null
```

**Manejo de errores**:
- Convierte códigos de error de Firebase en mensajes legibles en español
- Ejemplos: `auth/email-already-in-use` → "Este email ya está registrado"

**Validaciones**:
- Email: formato válido con regex
- Contraseña: mínimo 6 caracteres
- Username: entre 3 y 20 caracteres

---

### 2. DatabaseService (src/services/DatabaseService.js)

**Propósito**: Gestiona las operaciones con Firebase Firestore (base de datos).

**Estructura de datos en Firestore**:
```javascript
users/{userId}/
  {
    userId: string,
    username: string,
    email: string,
    createdAt: timestamp,
    lastLogin: timestamp,

    stats: {
      totalScore: number,      // Suma de todas las partidas
      highScore: number,       // Mejor puntuación
      gamesPlayed: number,     // Partidas jugadas
      averageScore: number,    // Promedio de puntuaciones
      totalPlayTime: number,   // Tiempo total en segundos

      bestHands: {
        "Escalera de color": number,
        "Póker": number,
        "Full House": number,
        "Color": number,
        "Escalera": number,
        "Trío": number,
        "Doble pareja": number,
        "Pareja": number,
        "Carta alta": number
      }
    }
  }
```

**Métodos principales**:

```javascript
// Crear perfil de usuario nuevo
async createUserProfile(userId, username, email)

// Obtener perfil de usuario
async getUserProfile(userId)

// Actualizar último login
async updateLastLogin(userId)

// Guardar estadísticas al finalizar partida
async saveGameStats(userId, gameData)
// gameData = { finalScore, handsPlayed, playTime }

// Actualizar contador de una mano específica
async updateHandPlayed(userId, handName)
```

**Funciones futuras**:
- `getLeaderboard(limit)`: Obtener ranking global (requiere índices en Firestore)

---

### 3. ConfigService (src/services/ConfigService.js)

**Propósito**: Gestiona configuraciones del juego en localStorage (cliente).

**Configuración predeterminada**:
```javascript
{
  // Ajustes de juego
  animationSpeed: 'normal',        // 'slow', 'normal', 'fast', 'none'
  autoSort: false,                 // Auto-ordenar cartas
  compactMode: false,              // Modo compacto (cartas más pequeñas)
  confirmDiscard: false,           // Confirmar antes de descartar
  visualEffects: true,             // Efectos visuales activados

  // Barajas desbloqueadas
  unlockedDecks: ['default'],      // ['default', 'red', 'blue']

  // Última configuración
  lastSelectedDeck: 'default',
  lastSelectedDifficulty: 'easy'
}
```

**Métodos principales**:

```javascript
// Obtener valor de configuración
get(key)

// Establecer valor de configuración
set(key, value)

// Obtener toda la configuración
getAll()

// Resetear a valores predeterminados
reset()

// Desbloquear baraja
unlockDeck(deckId)

// Verificar si baraja está desbloqueada
isDeckUnlocked(deckId)

// Obtener duración de animación según config
getAnimationDuration(baseDuration)
// Ejemplo: si animationSpeed='fast', retorna baseDuration * 0.5
```

**Persistencia**:
- Se guarda automáticamente en `localStorage` con la clave `frenzyJokerConfig`
- Se carga al iniciar la aplicación

---

## Clases del Juego

### 1. Card (src/classes/Card.js)

**Propósito**: Representa una carta individual del mazo.

**Propiedades**:
```javascript
{
  number: string,        // 'A', '2', '3', ..., '10', 'J', 'Q', 'K'
  suit: string,          // 'H' (Hearts), 'D' (Diamonds), 'C' (Clubs), 'S' (Spades)
  selected: boolean,     // Si la carta está seleccionada
  sprite: object         // Referencia al sprite de Phaser
}
```

**Métodos**:

```javascript
getValue()
// Retorna valor numérico para ordenar: A=14, K=13, Q=12, J=11, otros=número

getChipValue()
// Retorna valor en fichas para puntuación: A=11, K/Q/J=10, otros=número

getSuitSymbol()
// Retorna símbolo unicode: H='♥', D='♦', C='♣', S='♠'

getSuitColor()
// Retorna color CSS según el palo:
// - Modo normal: H/D='#ff0000' (rojo), C/S='#000000' (negro)
// - Modo contraste: H='#ff0000', D='#ff8800', C='#22748dff', S='#000000'

toString()
// Retorna representación de texto: "A♥", "K♠", etc.

toggleSelect()
// Alterna estado de selección y retorna nuevo estado

deselect()
// Deselecciona la carta
```

**Ejemplo de uso**:
```javascript
const card = new Card('A', 'H');
console.log(card.toString());        // "A♥"
console.log(card.getValue());        // 14
console.log(card.getChipValue());    // 11
console.log(card.getSuitColor());    // "#ff0000"
```

---

### 2. Deck (src/classes/Deck.js)

**Propósito**: Gestiona un mazo completo de 52 cartas.

**Propiedades**:
```javascript
{
  cards: Card[],           // Array de cartas en el mazo
  discardPile: Card[],     // Pila de cartas descartadas
  suits: ['H', 'D', 'C', 'S'],
  numbers: ['A', '2', '3', ..., 'K']
}
```

**Métodos**:

```javascript
initialize()
// Crea las 52 cartas (13 números x 4 palos) y baraja

shuffle()
// Baraja usando algoritmo Fisher-Yates

draw()
// Saca una carta del mazo. Si el mazo está vacío, rebaraja los descartes

drawMultiple(count)
// Saca múltiples cartas del mazo

discard(cards)
// Añade cartas a la pila de descarte

reshuffleDiscards()
// Mezcla las cartas descartadas de nuevo en el mazo

reset()
// Reinicia completamente el mazo (52 cartas nuevas)

remainingCards()
// Retorna número de cartas restantes en el mazo

discardedCards()
// Retorna número de cartas en la pila de descarte
```

**Flujo de cartas**:
```
[Mazo de 52] --draw()--> [Mano del jugador]
                             |
                             | (jugadas/descartes)
                             ▼
                       [discardPile]
                             |
                             | (cuando mazo vacío)
                             ▼
                    reshuffleDiscards()
                             |
                             ▼
                       [Mazo rebarajado]
```

---

### 3. HandEvaluator (src/classes/HandEvaluator.js)

**Propósito**: Evalúa manos de póker y calcula puntuaciones.

**Valores de manos** (de mayor a menor):
```javascript
{
  "Escalera de color": { chips: 100, multiplier: 8 },  // 5 cartas consecutivas del mismo palo
  "Póker": { chips: 60, multiplier: 7 },               // 4 cartas del mismo número
  "Full House": { chips: 40, multiplier: 4 },          // 3 de un número + 2 de otro
  "Color": { chips: 35, multiplier: 4 },               // 5 cartas del mismo palo
  "Escalera": { chips: 30, multiplier: 4 },            // 5 cartas consecutivas
  "Trío": { chips: 30, multiplier: 3 },                // 3 cartas del mismo número
  "Doble pareja": { chips: 20, multiplier: 2 },        // 2 pares
  "Pareja": { chips: 10, multiplier: 2 },              // 2 cartas del mismo número
  "Carta alta": { chips: 5, multiplier: 1 }            // Ninguna combinación
}
```

**Método principal**:

```javascript
evaluate(selectedCards)
// Retorna objeto:
{
  hand: string,           // Nombre de la mano
  chips: number,          // Fichas base de la mano
  multiplier: number,     // Multiplicador de la mano
  bonusChips: number,     // Fichas bonus por valores de cartas
  totalChips: number,     // chips + bonusChips
  score: number           // totalChips * multiplier
}
```

**Cálculo de puntuación**:
```
1. Detectar tipo de mano → Obtener chips y multiplier base
2. Identificar cartas relevantes (ejemplo: en un trío, solo las 3 cartas del trío)
3. Sumar bonusChips de las cartas relevantes (A=11, K/Q/J=10, otros=valor)
4. totalChips = chips + bonusChips
5. score = totalChips * multiplier
```

**Ejemplo**:
```javascript
// Mano: [A♥, A♦, A♣, K♠, Q♠]
const result = HandEvaluator.evaluate(selectedCards);
// {
//   hand: "Trío",
//   chips: 30,
//   multiplier: 3,
//   bonusChips: 33,        // 11+11+11 (3 ases)
//   totalChips: 63,        // 30 + 33
//   score: 189             // 63 * 3
// }
```

**Métodos auxiliares**:
```javascript
getHandName(cards)          // Determina el nombre de la mano
isStraight(cards)           // Verifica si es escalera (incluye A-2-3-4-5)
countOccurrences(array)     // Cuenta ocurrencias de elementos
getRelevantCards(cards, handName)  // Filtra cartas relevantes para bonus
calculateBonusChips(cards)  // Suma valores de fichas de las cartas
```

---

### 4. UI (src/classes/UI.js)

**Propósito**: Gestiona toda la interfaz gráfica del juego en GameScene.

**Componentes principales**:

1. **Contenedor de Puntuación** (lado izquierdo):
   - Multiplicador actual
   - Fichas base
   - Puntos de la jugada actual
   - Puntuación total acumulada
   - Mano detectada (ej: "Trío")

2. **Contenedor de Botones** (lado derecho):
   - Botón JUGAR: juega la mano seleccionada
   - Botón DESCARTAR: descarta cartas seleccionadas
   - Botón ORDENAR: alterna entre ordenar por palo o por valor
   - Botón AJUSTES: abre SettingsScene
   - Contadores de jugadas y descartes restantes
   - Contador de cartas en el mazo

3. **Contenedor de Cartas** (centro inferior):
   - Muestra hasta 8 cartas en la mano
   - Cartas seleccionadas se elevan y tienen borde dorado

4. **Texto de Resultado** (centro superior):
   - Muestra la mano actual evaluada (ej: "Pareja de Ases")

5. **Menú de Usuario** (esquina superior izquierda):
   - Nombre de usuario
   - Avatar

**Métodos principales**:

```javascript
createUI()                           // Crea toda la interfaz
updateScore(evaluation)              // Actualiza panel de puntuación
updateTotalScore(score)              // Actualiza puntuación total
updatePlaysRemaining(count)          // Actualiza jugadas restantes
updateDiscardsRemaining(count)       // Actualiza descartes restantes
updateDeckCount(count)               // Actualiza cartas en mazo
updateResult(handName)               // Actualiza texto de mano actual
updateSortMode(mode)                 // Actualiza indicador de modo de ordenamiento
showMessage(text, duration)          // Muestra mensaje temporal
```

---

## Escenas de Phaser

### 1. MenuScene (src/classes/MenuScene.js)

**Propósito**: Pantalla inicial de login y registro.

**Flujo**:
```
1. Usuario ve formulario de login
2. Puede alternar a modo registro
3. Ingresa email, contraseña (y username si es registro)
4. Al hacer clic en ENTRAR/REGISTRARSE:
   - Valida campos
   - Llama a AuthService.login() o AuthService.register()
   - Si éxito: guarda user en registry y va a PreparationScene
   - Si error: muestra mensaje de error
```

**Elementos visuales**:
- Título "FRENZY JOKER"
- Fondo con partículas de cartas flotantes
- Inputs HTML para email, password, username
- Botón de acción principal (ENTRAR/REGISTRARSE)
- Enlace para alternar entre login y registro
- Mensajes de error/éxito

**Características técnicas**:
- Usa inputs HTML reales (no Phaser) para mejor UX
- Posiciona inputs calculando escala del canvas
- Limpia inputs del DOM al salir de la escena
- Soporta tecla Enter para enviar formulario

---

### 2. PreparationScene (src/classes/PreparationScene.js)

**Propósito**: Selección de baraja y dificultad antes de jugar.

**Opciones disponibles**:

**Barajas**:
1. **Baraja Clásica**: Sin bonificación
2. **Baraja Roja**: +1 descarte (total 4 descartes)
3. **Baraja Azul**: +1 jugada (total 5 jugadas)

**Dificultades** (afecta el "nivel de pozo", futuro):
- Fácil
- Medio
- Difícil

**Elementos visuales**:
- Saludo personalizado con nombre de usuario
- Dropdown HTML para seleccionar baraja
- Descripción de la baraja seleccionada
- Dropdown HTML para seleccionar dificultad
- Botón JUGAR (grande, verde)
- Botón Ajustes (esquina superior derecha)
- Botón Cerrar sesión (esquina superior izquierda)

**Flujo**:
```
1. Carga última configuración desde ConfigService
2. Usuario selecciona baraja y dificultad
3. Configuración se guarda en ConfigService
4. Al hacer clic en JUGAR:
   - Guarda selección en registry
   - Limpia dropdowns del DOM
   - Transición con fade a GameScene
```

---

### 3. GameScene (src/classes/GameScene.js)

**Propósito**: Escena principal del juego donde se desarrolla la partida.

**Inicialización** (`init()`):
```javascript
// Obtiene datos del usuario y configuración
this.currentUser = registry.get('currentUser');
this.userProfile = registry.get('userProfile');
this.selectedDeck = registry.get('selectedDeck');
this.selectedDifficulty = registry.get('selectedDifficulty');

// Crea baraja y inicializa estado
this.deck = new Deck();
this.hand = [];
this.selectedCards = [];

// Configuración del juego
this.maxHandSize = 8;          // Cartas en mano
this.maxSelection = 5;         // Máximo de cartas seleccionables
this.playsRemaining = 4;       // Jugadas disponibles
this.discardsRemaining = 3;    // Descartes disponibles

// Aplica bonificaciones de baraja
if (selectedDeck === 'red') this.discardsRemaining += 1;
if (selectedDeck === 'blue') this.playsRemaining += 1;

// Inicializa estadísticas
this.totalScore = 0;
this.handsPlayed = { "Escalera de color": 0, ... };
this.gameStartTime = Date.now();
```

**Loop de Juego**:

```
┌─────────────────────────────────────────┐
│  1. Repartir 8 cartas iniciales         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  2. Renderizar cartas en pantalla       │
│     - Cartas estilo póker realistas     │
│     - Interactivas (hover, clic)        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  3. Usuario selecciona cartas (0-5)     │
│     - Clic en carta: toggleSelect()     │
│     - Carta seleccionada: borde dorado  │
│     - Se eleva visualmente              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  4. Evaluar selección en tiempo real    │
│     - HandEvaluator.evaluate()          │
│     - Actualiza UI con puntuación       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  5. Usuario elige acción:               │
│     A) JUGAR                            │
│     B) DESCARTAR                        │
│     C) ORDENAR                          │
└────┬────────────┬───────────┬───────────┘
     │            │           │
     ▼            ▼           ▼
 ┌───────┐  ┌──────────┐  ┌─────────┐
 │ JUGAR │  │DESCARTAR │  │ORDENAR  │
 └───┬───┘  └────┬─────┘  └────┬────┘
     │           │             │
     ▼           ▼             │
┌─────────┐ ┌─────────┐       │
│ Suma    │ │ No suma │       │
│ puntos  │ │ puntos  │       │
│ -1 jug. │ │ -1 desc.│       │
└───┬─────┘ └────┬────┘       │
    │            │             │
    ▼            ▼             ▼
┌──────────────────────────────────────┐
│ Descarta cartas y rellena mano       │
│ - Cartas descartadas → discardPile   │
│ - Roba cartas hasta tener 8          │
│ - Animación de entrada de cartas     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ ¿Jugadas restantes = 0?              │
└────┬───────────────────┬─────────────┘
     │ NO                │ SÍ
     │                   ▼
     │            ┌───────────────┐
     │            │  FIN DE JUEGO │
     │            │ saveGameStats()│
     │            │  Game Over    │
     │            └───────────────┘
     │
     └──────> Volver al paso 2
```

**Acciones del jugador**:

**A) JUGAR** (`playHand()`):
```javascript
1. Verificar que hay cartas seleccionadas
2. Verificar que quedan jugadas
3. Incrementar contador de mano jugada en handsPlayed
4. Sumar puntos al totalScore
5. Reducir playsRemaining
6. Animar salida de cartas seleccionadas
7. Descartar cartas jugadas
8. Remover de this.hand
9. Rellenar mano con deck.drawMultiple()
10. Renderizar nuevas cartas con animación
11. Si playsRemaining === 0 → endGame()
```

**B) DESCARTAR** (`discardCards()`):
```javascript
1. Verificar que hay cartas seleccionadas
2. Verificar que quedan descartes
3. Reducir discardsRemaining
4. Animar salida de cartas seleccionadas
5. Descartar cartas
6. Remover de this.hand
7. Rellenar mano con deck.drawMultiple()
8. Renderizar nuevas cartas con animación
```

**C) ORDENAR** (`toggleSortMode()`):
```javascript
1. Alternar entre 'suit' y 'rank'
2. Ordenar this.hand según modo:
   - 'suit': por palo primero, luego por valor
   - 'rank': solo por valor descendente
3. Animar reordenamiento de cartas
```

**Renderizado de Cartas** (`createCardSprite()`):

Crea cartas estilo póker realista con:
- **Fondo blanco** con borde negro
- **Esquina superior izquierda**: número y símbolo pequeño
- **Centro**: Patrón de símbolos según el número:
  - As: 1 símbolo grande
  - 2: 2 símbolos (arriba/abajo)
  - 3: 3 símbolos (arriba/centro/abajo)
  - 4-10: Patrones tipo cartas reales
  - J/Q/K: 1 símbolo grande (𝐉, 𝐐, 𝐊)
- **Esquina inferior derecha**: número y símbolo invertidos
- **Área segura**: Los símbolos se posicionan dentro de un área central para evitar superposición con las esquinas
- **Colores**: Todos los símbolos (incluyendo J/Q/K) cambian de color según su palo:
  - Corazones (♥) y Diamantes (♦): Rojo (#ff0000)
  - Tréboles (♣) y Picas (♠): Negro (#000000)
  - En modo contraste: Cada palo tiene su propio color único

**Interactividad**:
- **Hover**: Carta se eleva ligeramente
- **Clic**: Alterna selección (borde dorado, se eleva)
- **Límite**: Máximo 5 cartas seleccionadas

**Finalización del juego** (`endGame()`):
```javascript
1. Calcular tiempo de juego
2. Preparar gameData = { finalScore, handsPlayed, playTime }
3. Guardar en Firestore con DatabaseService.saveGameStats()
4. Mostrar pantalla Game Over con:
   - Puntuación final
   - Comparación con high score
   - Botón "Jugar de nuevo" → scene.restart()
   - Botón "Menú principal" → PreparationScene
```

**Guardado de Estado** (`saveGameState()`):

Antes de ir a SettingsScene, guarda:
- Estado de la mano (cartas y selección)
- Recursos (jugadas, descartes, puntuación)
- Estado del mazo
- Configuración de baraja y dificultad
- Estadísticas actuales

Al regresar, restaura todo con `restoreGameState()`.

---

### 4. SettingsScene (src/classes/SettingsScene.js)

**Propósito**: Configurar ajustes del juego.

**Configuraciones disponibles**:

1. **Velocidad de Animación**:
   - Lenta (1.5x duración)
   - Normal (1x)
   - Rápida (0.5x)
   - Sin animaciones (0x)

2. **Auto-ordenar**:
   - Activa/Desactiva ordenamiento automático al robar cartas

3. **Modo Compacto**:
   - Cartas más pequeñas (70x100 en vez de 90x130)

4. **Confirmar Descartes**:
   - Pide confirmación antes de descartar

5. **Efectos Visuales**:
   - Activa/Desactiva partículas y efectos

**Flujo**:
```
1. Carga configuración desde ConfigService
2. Renderiza controles (checkboxes, dropdowns)
3. Usuario modifica configuración
4. Al cambiar algo:
   - Actualiza ConfigService
   - Si vino de GameScene, actualiza saveGameState
5. Al hacer clic en VOLVER:
   - Limpia controles del DOM
   - Regresa a escena anterior
   - Si era GameScene, aplica cambios visuales
```

---

## Sistema de Rondas

**Frenzy Joker** se juega a través de **5 rondas progresivas**. Cada ronda tiene un objetivo de puntuación que el jugador debe alcanzar antes de quedarse sin jugadas.

### Objetivos por Ronda

| Ronda | Objetivo de Puntos | Dificultad |
|-------|-------------------|------------|
| 1     | 300               | ⭐         |
| 2     | 450               | ⭐⭐       |
| 3     | 600               | ⭐⭐⭐     |
| 4     | 900               | ⭐⭐⭐⭐   |
| 5     | 1,250             | ⭐⭐⭐⭐⭐ |

### Mecánica de Rondas

#### Inicio de Ronda
- El jugador comienza con recursos completos (jugadas y descartes según la baraja seleccionada)
- Se reparte una baraja nueva de 52 cartas
- Se reparten 8 cartas iniciales
- El contador de puntos de la ronda se resetea a 0

#### Durante la Ronda
- El jugador juega manos de póker para acumular puntos
- Los puntos se suman tanto a:
  - **Puntos de Ronda**: Contador que determina si se alcanza el objetivo
  - **Total Acumulado**: Suma de todas las rondas completadas

#### Finalización de Ronda

**Caso 1: Objetivo Alcanzado**
```
Si roundScore >= objetivoRonda:
  - Mostrar pantalla "Ronda Completada"
  - Guardar puntos acumulados
  - Si es ronda 5 → ¡VICTORIA TOTAL!
  - Si es ronda 1-4 → Avanzar a siguiente ronda
```

**Caso 2: Sin Jugadas Restantes**
```
Si playsRemaining === 0 && roundScore < objetivoRonda:
  - ¡DERROTA!
  - Guardar estadísticas en Firebase
  - Mostrar pantalla Game Over
  - Opciones: Jugar de nuevo o Menú principal
```

### Transición Entre Rondas

Al completar una ronda (excepto la 5ta):

1. **Pantalla de Ronda Completada** muestra:
   - "¡RONDA X COMPLETADA!"
   - Objetivo alcanzado
   - Puntos obtenidos en la ronda
   - Total acumulado
   - Botón "CONTINUAR"

2. **Al continuar** (`startNextRound()`):
   - Incrementa `currentRound`
   - Resetea `roundScore = 0`
   - Resetea recursos (jugadas y descartes)
   - Crea baraja nueva de 52 cartas
   - Descarta mano actual
   - Reparte 8 cartas nuevas
   - Actualiza UI con nuevo objetivo

### Pantalla de Introducción

Al iniciar una partida nueva, se muestra una pantalla explicativa con:

**Contenido**:
- Título del juego
- Objetivo principal: Completar las 5 rondas
- Tabla de objetivos por ronda
- Instrucciones básicas:
  - Selecciona hasta 5 cartas
  - Forma manos de póker
  - Juega para sumar puntos
  - Descarta para cambiar cartas
- Advertencia: Si se acaban las jugadas sin alcanzar el objetivo, pierdes
- Botón "¡COMENZAR!" para iniciar

### Condiciones de Victoria y Derrota

#### Victoria Total 🏆
```javascript
Condición: Completar ronda 5 (alcanzar 1,250 puntos)

Recompensas:
- Pantalla especial "¡VICTORIA TOTAL!"
- Se guarda en Firebase como partida completada
- Compara con high score personal
- Muestra mensaje si es nuevo récord
```

#### Derrota 💔
```javascript
Condición: Quedarse sin jugadas antes de alcanzar objetivo

Resultado:
- Pantalla "DERROTA"
- Muestra ronda en la que falló
- Muestra objetivo no alcanzado
- Guarda estadísticas parciales en Firebase
- Opciones para reintentar
```

### Progresión de Dificultad

La dificultad aumenta naturalmente por:

1. **Objetivos crecientes**: Cada ronda requiere más puntos
2. **Recursos limitados**: Mismas jugadas/descartes para objetivos mayores
3. **Presión acumulativa**: El jugador debe mantener el rendimiento a través de 5 rondas
4. **Baraja nueva**: Cada ronda comienza con baraja mezclada, sin memoria de cartas anteriores

### Estrategia Recomendada

**Ronda 1 (300 pts)**:
- Juega de forma conservadora
- Aprende los patrones de cartas
- No desperdicies descartes innecesariamente

**Rondas 2-3 (450-600 pts)**:
- Balancea riesgo y recompensa
- Usa descartes estratégicamente para buscar manos altas
- Calcula si puedes alcanzar el objetivo con las jugadas restantes

**Rondas 4-5 (900-1250 pts)**:
- Sé más agresivo buscando manos altas (Póker, Escalera de color)
- Usa todos los recursos disponibles
- Calcula exactamente cuántos puntos necesitas por jugada

**Bonificaciones de Baraja**:
- **Baraja Roja (+1 Descarte)**: Mejor para rondas difíciles donde necesitas buscar manos específicas
- **Baraja Azul (+1 Jugada)**: Más oportunidades de acumular puntos, ideal para juego constante

---

## Sistema de Puntuación

### Fórmula de Puntuación

```
score = totalChips × multiplier

donde:
totalChips = chips_base + bonus_chips
```

### Ejemplo detallado

**Mano: Trío de Ases + Rey + Reina**
```
Cartas: [A♥, A♦, A♣, K♠, Q♥]

1. Detectar mano: "Trío"
   - chips_base = 30
   - multiplier = 3

2. Identificar cartas relevantes: [A♥, A♦, A♣]
   (Solo los 3 Ases cuentan para bonus)

3. Calcular bonus_chips:
   A♥ = 11
   A♦ = 11
   A♣ = 11
   bonus_chips = 33

4. totalChips = 30 + 33 = 63

5. score = 63 × 3 = 189
```

### Tabla de Valores de Fichas

| Carta | Valor de Fichas |
|-------|----------------|
| As    | 11             |
| K     | 10             |
| Q     | 10             |
| J     | 10             |
| 10    | 10             |
| 9     | 9              |
| 8     | 8              |
| ...   | ...            |
| 2     | 2              |

### Tabla Completa de Puntuaciones

| Mano | Chips Base | Multiplicador | Ejemplo | Score Mínimo | Score Máximo |
|------|-----------|---------------|---------|--------------|--------------|
| Escalera de color | 100 | 8 | A-K-Q-J-10 mismo palo | 800 | 1,320 |
| Póker | 60 | 7 | Cuatro Ases | 420 | 728 |
| Full House | 40 | 4 | Tres Ases + Dos Reyes | 160 | 412 |
| Color | 35 | 4 | 5 cartas mismo palo | 140 | 420 |
| Escalera | 30 | 4 | A-K-Q-J-10 mezclado | 120 | 420 |
| Trío | 30 | 3 | Tres Ases | 90 | 279 |
| Doble pareja | 20 | 2 | Dos Ases + Dos Reyes | 40 | 122 |
| Pareja | 10 | 2 | Dos Ases | 20 | 54 |
| Carta alta | 5 | 1 | As alto | 5 | 16 |

**Nota**: Score Máximo asume las cartas de mayor valor posible (Ases y figuras).

---

## Sistema de Barajas

### Tipos de Barajas

#### 1. Baraja Clásica (Default)
- **Código**: `default`
- **Bonificación**: Ninguna
- **Jugadas**: 4
- **Descartes**: 3
- **Descripción**: "La baraja clásica sin modificaciones especiales"
- **Desbloqueada**: Por defecto

#### 2. Baraja Roja
- **Código**: `red`
- **Bonificación**: +1 Descarte
- **Jugadas**: 4
- **Descartes**: 4 ← (3 + 1)
- **Descripción**: "Perfecta para estrategias que requieren más descartes"
- **Desbloqueada**: Por defecto (puede configurarse)

#### 3. Baraja Azul
- **Código**: `blue`
- **Bonificación**: +1 Jugada
- **Jugadas**: 5 ← (4 + 1)
- **Descartes**: 3
- **Descripción**: "Ideal para maximizar oportunidades de jugada"
- **Desbloqueada**: Por defecto (puede configurarse)

### Aplicación de Bonificaciones

En `GameScene.init()`:
```javascript
// Valores base
this.playsRemaining = 4;
this.discardsRemaining = 3;

// Aplicar bonificaciones de baraja
if (this.selectedDeck === 'red') {
  this.discardsRemaining += 1; // 4 descartes
} else if (this.selectedDeck === 'blue') {
  this.playsRemaining += 1; // 5 jugadas
}
```

### Estrategia por Baraja

**Baraja Clásica**:
- Equilibrada
- Requiere planificación cuidadosa
- Ideal para jugadores experimentados

**Baraja Roja (+1 Descarte)**:
- Más flexibilidad para buscar manos altas
- Permite descartar cartas malas sin penalización
- Estrategia: descartar agresivamente para buscar Póker/Escalera de color

**Baraja Azul (+1 Jugada)**:
- Más oportunidades de sumar puntos
- Permite jugar manos medianas sin tanto riesgo
- Estrategia: jugar manos buenas frecuentemente, incluso Tríos/Doble pareja

---

## Sistema de Monedas

El sistema de monedas permite a los jugadores acumular recursos para comprar comodines en la tienda.

### Monedas Iniciales
- Cada partida comienza con **4 monedas**

### Ganancias por Completar Ronda

Al completar exitosamente una ronda, el jugador recibe monedas de tres fuentes:

#### 1. Monedas Base
- **+3 monedas** por completar cualquier ronda

#### 2. Bonus por Jugadas Sobrantes
- **+1 moneda** por cada jugada restante al completar la ronda
- Ejemplo: Si completas la ronda con 2 jugadas sobrantes → +2 monedas

#### 3. Interés
- **+1 moneda** por cada 5 monedas que tengas (solo enteros)
- **Máximo: 5 monedas** de interés por ronda
- Fórmula: `Math.min(Math.floor(monedas / 5), 5)`

**Ejemplos de interés**:
```
Monedas actuales: 4  → Interés: 0 monedas
Monedas actuales: 7  → Interés: 1 moneda  (7 / 5 = 1.4 → 1)
Monedas actuales: 15 → Interés: 3 monedas (15 / 5 = 3)
Monedas actuales: 30 → Interés: 5 monedas (30 / 5 = 6, pero máx. 5)
Monedas actuales: 50 → Interés: 5 monedas (máximo alcanzado)
```

### Cálculo Total

```javascript
// Ejemplo al completar ronda 2 con 1 jugada sobrante y 12 monedas
const baseCoins = 3;                                    // +3
const playBonus = 1;                                    // +1 (1 jugada sobrante)
const interest = Math.min(Math.floor(12 / 5), 5);      // +2 (12/5 = 2.4 → 2)
const totalEarned = baseCoins + playBonus + interest;  // = 6 monedas

// Monedas finales: 12 + 6 = 18 monedas
```

### Visualización en Pantallas

#### Pantalla de Ronda Completada
Muestra desglose detallado:
```
💰 MONEDAS GANADAS
+3 (Base)
+1 (Jugadas sobrantes)
+2 (Interés)
Total monedas: 18
```

#### UI del Juego
- Contador de monedas visible en la esquina superior derecha
- Se actualiza en tiempo real al completar rondas
- También se actualiza si jokers generan monedas durante el juego

### Uso de Monedas

Las monedas se usan exclusivamente para:
- **Comprar jokers** en la tienda (ShopScene)
- Cada joker tiene un costo entre 4 y 8 monedas

### Persistencia

Las monedas persisten:
- **Entre rondas**: Se mantienen durante toda la partida
- **En la tienda**: El total de monedas se preserva al entrar y salir de la tienda
- **No persisten** entre partidas diferentes (cada juego nuevo comienza con 4 monedas)

---

## Sistema de Comodines (Jokers)

Los comodines o jokers son objetos especiales que modifican la puntuación de diferentes formas. Se pueden equipar hasta **5 jokers simultáneamente**.

### Clase Joker

**Ubicación**: `src/classes/Joker.js`

**Propiedades**:
```javascript
{
  id: string,              // Identificador único
  name: string,            // Nombre con emoji (ej: "🃏 Comodín")
  description: string,     // Descripción del efecto
  cost: number,            // Precio en monedas (4-8)
  effectType: string,      // Tipo de efecto (ver tabla abajo)
  effectValue: number,     // Valor del efecto
  config: object,          // Configuración adicional
  accumulatedValue: number // Para efectos acumulativos
}
```

### Tipos de Efectos

| Tipo de Efecto | Descripción | Ejemplo |
|----------------|-------------|---------|
| `constant` | Bonus constante | +4 multiplicador siempre |
| `suit_multiplier` | Bonus por palo específico | +3 mult. por cada ♥ que puntúe |
| `hand_type` | Bonus si juegas mano específica | x2 mult. con Pareja |
| `card_value` | Bonus por valor de carta | +2 mult. por cada 7 |
| `figures` | Bonus por figuras (J/Q/K) | +50 fichas con 3+ figuras |
| `pair_only` | Bonus con pareja pura (2 cartas) | x4 mult. con pareja de 2 cartas |
| `consecutive` | Bonus por cartas consecutivas | +1 mult. por carta consecutiva |
| `accumulative_discard` | Acumula por descartes | +0.5 mult. cada descarte |
| `accumulative_streak` | Acumula por racha sin descartar | +1 mult. por jugada sin descartar |
| `coins_based` | Bonus según monedas actuales | +1 mult. cada 10 monedas |
| `card_count` | Bonus por cantidad de cartas | x2 mult. con ≤3 cartas |
| `chips_per_card` | Fichas por carta jugada | +10 fichas por carta |
| `color_combo` | Bonus por mismo color (rojo/negro) | x3 mult. si todas mismo color |
| `early_play` | Bonus en primeras jugadas | +20 fichas en 1ª o 2ª jugada |
| `coin_generator` | Genera monedas al jugar | +1 moneda al jugar (máx 3/ronda) |
| `no_discards` | Bonus sin descartes | x2 mult. con 0 descartes |
| `resource_boost` | Aumenta recursos por ronda | +1 descarte por ronda |
| `probability` | Efecto probabilístico | 50% x3 mult. o x0.5 |
| `last_play` | Bonus en última jugada | x2 mult. en última jugada |

### Catálogo Completo de Jokers

#### Originales (5 jokers)

1. **🃏 Comodín**
   - Costo: 5 monedas
   - Efecto: +4 Multiplicador constante
   - Tipo: `constant`

2. **❤️ Amante**
   - Costo: 6 monedas
   - Efecto: +3 Mult. por ♥ que puntúe
   - Tipo: `suit_multiplier`

3. **☘️ Jardinero**
   - Costo: 6 monedas
   - Efecto: +3 Mult. por ♣ que puntúe
   - Tipo: `suit_multiplier`

4. **💎 Rico**
   - Costo: 6 monedas
   - Efecto: +3 Mult. por ♦ que puntúe
   - Tipo: `suit_multiplier`

5. **⚔️ Puntas**
   - Costo: 6 monedas
   - Efecto: +3 Mult. por ♠ que puntúe
   - Tipo: `suit_multiplier`

#### Por Tipo de Mano (3 jokers)

6. **🎭 Actor**
   - Costo: 5 monedas
   - Efecto: x2 Mult. si juegas Pareja
   - Tipo: `hand_type`

7. **🔥 Escalador**
   - Costo: 7 monedas
   - Efecto: x3 Mult. con Escalera
   - Tipo: `hand_type`

8. **👑 Realeza**
   - Costo: 6 monedas
   - Efecto: +50 Fichas con 3+ figuras
   - Tipo: `figures`

#### Por Valores de Cartas (3 jokers)

9. **🎲 Afortunado**
   - Costo: 6 monedas
   - Efecto: +2 Mult. por cada 7
   - Tipo: `card_value`

10. **🃏 Par o Nada**
    - Costo: 6 monedas
    - Efecto: x4 Mult. con pareja pura (exactamente 2 cartas)
    - Tipo: `pair_only`

11. **📈 Ascendente**
    - Costo: 7 monedas
    - Efecto: +1 Mult. por carta consecutiva
    - Tipo: `consecutive`

#### Acumulativos (3 jokers)

12. **💪 Entrenador**
    - Costo: 5 monedas
    - Efecto: +0.5 Mult. cada descarte (máx. +5)
    - Tipo: `accumulative_discard`
    - **Mecánica**: Se acumula cada vez que usas un descarte. Se resetea al inicio de cada ronda.

13. **🌟 Racha**
    - Costo: 6 monedas
    - Efecto: +1 Mult. por jugada sin descartar (máx. +6)
    - Tipo: `accumulative_streak`
    - **Mecánica**: Se incrementa por cada jugada realizada sin haber descartado antes. Se resetea si descartas o al inicio de cada ronda.

14. **📊 Economista**
    - Costo: 8 monedas
    - Efecto: +1 Mult. cada 10 monedas
    - Tipo: `coins_based`
    - **Mecánica**: Se calcula dinámicamente según tus monedas actuales.

#### Por Cantidad de Cartas (2 jokers)

15. **🎯 Minimalista**
    - Costo: 5 monedas
    - Efecto: x2 Mult. con 3 cartas o menos
    - Tipo: `card_count`

16. **🎪 Malabarista**
    - Costo: 6 monedas
    - Efecto: +10 Fichas por carta
    - Tipo: `chips_per_card`

#### Combos (3 jokers)

17. **🎨 Pintor**
    - Costo: 6 monedas
    - Efecto: x3 Mult. si todas mismo color (rojo o negro)
    - Tipo: `color_combo`

18. **⚡ Velocista**
    - Costo: 5 monedas
    - Efecto: +20 Fichas en 1ª o 2ª jugada
    - Tipo: `early_play`

19. **🎁 Generoso**
    - Costo: 7 monedas
    - Efecto: +1 Moneda al jugar (máx 3 por ronda)
    - Tipo: `coin_generator`

#### Especiales (5 jokers)

20. **🌙 Nocturno**
    - Costo: 6 monedas
    - Efecto: x2 Mult. sin descartes (cuando te quedan 0 descartes)
    - Tipo: `no_discards`

21. **🔄 Reciclador**
    - Costo: 8 monedas
    - Efecto: +1 Descarte por ronda
    - Tipo: `resource_boost`
    - **Mecánica**: Se aplica al inicio de cada nueva ronda.

22. **🎰 Apostador**
    - Costo: 4 monedas
    - Efecto: 50% x3 Mult. o x0.5
    - Tipo: `probability`
    - **Mecánica**: Cada vez que juegas, tiene 50% de probabilidad de darte x3 multiplicador o x0.5 multiplicador.

23. **🏆 Campeón**
    - Costo: 6 monedas
    - Efecto: x2 Mult. última jugada
    - Tipo: `last_play`

24. **Total**: 24 jokers únicos

### Aplicación de Efectos

Los jokers se aplican durante la evaluación de la mano en `HandEvaluator.evaluate()`:

```javascript
// Estructura de retorno con efectos de jokers
{
  hand: "Trío",
  chips: 30,
  multiplier: 3,
  bonusChips: 33,
  jokerChips: 20,         // Fichas añadidas por jokers
  totalChips: 83,         // chips + bonusChips + jokerChips
  jokerMultiplier: 4,     // Multiplicador añadido por jokers
  totalMultiplier: 7,     // multiplier + jokerMultiplier
  score: 581,             // totalChips * totalMultiplier
  coinsGenerated: 1       // Monedas generadas por jokers
}
```

### Tracking de Estado

GameScene mantiene el tracking necesario para efectos dinámicos:

```javascript
// Variables de tracking en GameScene
this.playsUsed = 0;                    // Jugadas usadas en la ronda
this.coinsGeneratedThisRound = 0;      // Monedas generadas por jokers
this.lastActionWasDiscard = false;     // Para tracking de racha
```

### Límite de Jokers

- **Máximo equipado**: 5 jokers simultáneamente
- Los jokers se muestran horizontalmente debajo del área de mano seleccionada
- Cada joker equipado afecta TODAS las jugadas mientras esté equipado

---

## Tienda (ShopScene)

La tienda es una escena especial donde los jugadores pueden comprar jokers usando sus monedas.

### Cuándo Aparece

La tienda aparece automáticamente **después de completar**:
- **Ronda 2**
- **Ronda 4**

**No** aparece después de las rondas 1, 3 o 5.

### Mecánica de la Tienda

#### Slots de Jokers
- La tienda muestra **2 slots** con jokers aleatorios
- Los jokers se seleccionan aleatoriamente del catálogo completo (24 jokers)
- **No se repiten**: Los 2 jokers mostrados son diferentes

#### Persistencia de Slots
- Los mismos 2 jokers permanecen disponibles durante toda la visita
- Si compras uno, el otro permanece disponible
- Si sales sin comprar, los jokers disponibles cambian en la siguiente visita

### Interfaz de la Tienda

Cada slot muestra:
```
┌─────────────────────────────┐
│     [Emoji] Nombre Joker    │
│                             │
│     Descripción del efecto  │
│                             │
│     💰 X monedas            │
│                             │
│     [BOTÓN DE ACCIÓN]       │
└─────────────────────────────┘
```

#### Estados del Botón

1. **COMPRAR** (verde)
   - Tienes suficientes monedas
   - Tienes espacio para equipar (< 5 jokers)
   - Al hacer clic: compra y equipa automáticamente

2. **YA EQUIPADO** (verde claro)
   - Ya compraste este joker anteriormente
   - No se puede comprar de nuevo

3. **SIN ESPACIO** (gris)
   - Ya tienes 5 jokers equipados
   - No puedes comprar más hasta desequipar alguno

4. **SIN MONEDAS** (gris)
   - No tienes suficientes monedas
   - Muestra el costo en rojo

### Información Mostrada

En la parte superior:
```
🛒 TIENDA 🛒
💰 Monedas: X
Equipados: Y/5
```

### Flujo de Compra

```
1. Jugador completa ronda 2 o 4
2. Pantalla "Ronda Completada" aparece
3. Jugador hace clic en CONTINUAR
4. Transición a ShopScene
5. ShopScene muestra 2 jokers aleatorios
6. Jugador puede:
   - Comprar joker 1 (si cumple condiciones)
   - Comprar joker 2 (si cumple condiciones)
   - Hacer clic en CONTINUAR (sin comprar)
7. Al hacer clic en CONTINUAR:
   - Guarda estado actualizado
   - Limpia slots de la tienda
   - Vuelve a GameScene
   - Inicia siguiente ronda
```

### Código Relevante

**Inicialización de tienda** (`ShopScene.init()`):
```javascript
// Si hay jokers guardados de esta visita, usarlos
if (this.gameData.shopJokers && this.gameData.shopJokers.length > 0) {
  this.availableJokers = this.gameData.shopJokers;
} else {
  // Generar 2 jokers aleatorios (primera vez en esta tienda)
  this.availableJokers = this.getRandomJokers(2);
  this.gameData.shopJokers = this.availableJokers;
}
```

**Al salir de la tienda** (`exitShop()`):
```javascript
// Limpiar jokers de la tienda para la próxima vez
this.gameData.shopJokers = null;

// Marcar que venimos de la tienda
this.gameData.fromShop = true;

// Volver a GameScene
this.scene.start('GameScene');
```

### Estrategia de Compra

**Factores a considerar**:

1. **Monedas disponibles**: ¿Cuántas monedas tienes?
2. **Rondas restantes**: ¿Cuántas rondas quedan? (Tras ronda 2 → 3 rondas; tras ronda 4 → 1 ronda)
3. **Sinergia**: ¿El joker complementa tus jokers actuales?
4. **Dificultad de ronda**: La ronda 5 es muy difícil (1250 puntos)

**Recomendaciones**:

- **Tienda tras ronda 2**: Compra jokers que escalen bien (Economista, Entrenador, Racha)
- **Tienda tras ronda 4**: Compra jokers de alto impacto inmediato (Escalador, Apostador, Campeón)
- **Prioriza jokers** que se adapten a tu estrategia:
  - ¿Juegas muchas parejas? → Actor, Par o Nada
  - ¿Buscas manos altas? → Escalador, Realeza
  - ¿Acumulas monedas? → Economista, Generoso
- **No compres** si el joker no se ajusta a tu estilo de juego

---

## Integración con Firebase

### Configuración

**Archivo**: `src/firebase/config.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Flujo de Autenticación

```
┌──────────────────────────────────────┐
│  1. Usuario ingresa email/password   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  2. AuthService.login() o register() │
│     - Llama a Firebase Auth          │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  3. Firebase valida credenciales     │
└────┬───────────────────┬─────────────┘
     │ Éxito             │ Error
     ▼                   ▼
┌─────────┐      ┌──────────────┐
│ User    │      │ Error code   │
│ object  │      │ → Mensaje ES │
└────┬────┘      └──────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│  4. onAuthStateChanged se dispara    │
│     - Actualiza currentUser          │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  5. Si es registro nuevo:            │
│     - DatabaseService.createUserProfile()│
│     - Inicializa stats en Firestore  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  6. MenuScene → PreparationScene     │
│     - Guarda user y profile en registry│
└──────────────────────────────────────┘
```

### Flujo de Guardado de Estadísticas

```
┌──────────────────────────────────────┐
│  1. Juego termina (playsRemaining=0) │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  2. GameScene.endGame()              │
│     - Calcula playTime               │
│     - Prepara gameData               │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  3. DatabaseService.saveGameStats()  │
│     - Lee stats actuales de Firestore│
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  4. Calcula nuevas estadísticas:     │
│     - gamesPlayed += 1               │
│     - totalScore += finalScore       │
│     - averageScore = total/games     │
│     - highScore = max(current, new)  │
│     - bestHands[hand] += count       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  5. updateDoc() en Firestore         │
│     - Actualiza documento del user   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  6. Muestra Game Over Screen         │
│     - Compara con high score         │
│     - Muestra si es nuevo récord     │
└──────────────────────────────────────┘
```

### Seguridad de Firestore

**Reglas recomendadas** (Firestore Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Explicación**:
- Usuarios solo pueden acceder a su propio documento
- Previene que usuarios lean/modifiquen datos de otros
- Para leaderboard global, se necesitaría una función Cloud o reglas más complejas

---

## Configuración y Ajustes

### Ajustes Disponibles

#### 1. Velocidad de Animación
```javascript
// ConfigService.animationSpeed
'slow'   → baseDuration * 1.5
'normal' → baseDuration * 1.0
'fast'   → baseDuration * 0.5
'none'   → 0
```

**Ejemplo**:
```javascript
// Animación de carta saliendo dura 600ms normalmente
this.tweens.add({
  targets: card,
  y: this.scale.height,
  duration: ConfigService.getAnimationDuration(600),
  // Si animationSpeed='fast' → duration=300ms
  // Si animationSpeed='none' → duration=0ms (instantáneo)
});
```

#### 2. Auto-Ordenar
```javascript
// ConfigService.autoSort = true/false

// En GameScene después de robar cartas:
if (ConfigService.get('autoSort')) {
  this.sortBySuit(); // Ordena por palo y valor
}
```

#### 3. Modo Compacto
```javascript
// ConfigService.compactMode = true/false

getCardDimensions() {
  const isCompact = ConfigService.get('compactMode');
  return {
    width: isCompact ? 70 : 90,
    height: isCompact ? 100 : 130
  };
}
```

#### 4. Confirmar Descartes
```javascript
// ConfigService.confirmDiscard = true/false

confirmDiscardCards() {
  if (ConfigService.get('confirmDiscard')) {
    const confirmed = confirm('¿Descartar N cartas?');
    if (!confirmed) return;
  }
  this.discardCards();
}
```

#### 5. Efectos Visuales
```javascript
// ConfigService.visualEffects = true/false

// Controla animaciones de entrada de cartas
const shouldAnimate = newCards.includes(card) &&
                      ConfigService.get('visualEffects');
```

---

## Glosario de Términos

- **Baraja (Deck)**: Conjunto de 52 cartas
- **Mano (Hand)**: Cartas que el jugador tiene disponibles (máximo 8)
- **Jugada (Play)**: Acción de jugar cartas seleccionadas para sumar puntos
- **Descarte (Discard)**: Acción de eliminar cartas para robar nuevas
- **Palo (Suit)**: H (Corazones), D (Diamantes), C (Tréboles), S (Picas)
- **Fichas (Chips)**: Valor base de una mano de póker
- **Multiplicador (Multiplier)**: Factor que multiplica las fichas para obtener el score
- **Bonus Chips**: Fichas adicionales por el valor de las cartas
- **Registry**: Sistema de Phaser para compartir datos entre escenas
- **Scene**: Pantalla o estado del juego en Phaser

---

## Flujo Completo de Datos

```
Usuario ingresa → Firebase Auth
                       ↓
                  AuthService
                       ↓
              [token + uid guardado]
                       ↓
              DatabaseService.getUserProfile()
                       ↓
            [Perfil desde Firestore]
                       ↓
       Phaser registry.set('currentUser', user)
       Phaser registry.set('userProfile', profile)
                       ↓
            PreparationScene lee registry
                       ↓
      Usuario selecciona baraja/dificultad
                       ↓
       ConfigService guarda en localStorage
                       ↓
          registry.set('selectedDeck', deck)
                       ↓
              GameScene lee registry
                       ↓
         Aplica bonificaciones de baraja
                       ↓
              Inicializa Deck (52 cartas)
                       ↓
             Reparte mano de 8 cartas
                       ↓
                 LOOP DE JUEGO
                       ↓
           Usuario juega/descarta cartas
                       ↓
         HandEvaluator calcula puntuación
                       ↓
        totalScore += currentScore
                       ↓
           playsRemaining === 0 ?
                   ↓ SÍ
       DatabaseService.saveGameStats()
                       ↓
         Actualiza Firestore con stats
                       ↓
           Muestra Game Over Screen
                       ↓
        Usuario puede jugar de nuevo
```

---

## Preguntas Frecuentes

### ¿Cómo se calcula la puntuación?
`score = (chips_base + bonus_chips) × multiplier`

### ¿Cuántas cartas puedo seleccionar?
Máximo 5 cartas a la vez.

### ¿Qué pasa si el mazo se queda sin cartas?
Las cartas descartadas se mezclan de nuevo y se reinicia el mazo automáticamente.

### ¿Las configuraciones se guardan entre sesiones?
Sí, se guardan en `localStorage` del navegador.

### ¿Las estadísticas se sincronizan entre dispositivos?
Sí, están en Firebase Firestore vinculadas al usuario.

### ¿Puedo jugar offline?
No, requiere conexión para autenticación y guardar estadísticas.

### ¿Cómo desbloqueo nuevas barajas?
Actualmente todas están desbloqueadas. El sistema de desbloqueo está preparado para implementación futura.

### ¿Qué es la "dificultad" en PreparationScene?
Actualmente no afecta el juego. Está preparado para futuras mecánicas (ej: nivel de pozo, objetivos de puntuación).

---

## Diagrama de Arquitectura Completo

```
┌────────────────────────────────────────────────────────────┐
│                     FRENZY JOKER                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
├────────────────────────────────────────────────────────────┤
│  MenuScene          PreparationScene      GameScene        │
│  - Login UI         - Selección baraja    - UI del juego  │
│  - Registro UI      - Selección dif.      - Renderizado   │
│                     - Botones             - Interacción    │
│                                                             │
│              SettingsScene                                  │
│              - Configuración UI                             │
└────────────────────────────────────────────────────────────┘
                          ↕
┌────────────────────────────────────────────────────────────┐
│                    CAPA DE LÓGICA                          │
├────────────────────────────────────────────────────────────┤
│  Card               Deck                HandEvaluator      │
│  - Propiedades      - 52 cartas         - Evalúa manos    │
│  - Métodos          - Barajar           - Calcula score   │
│                     - Robar/Descartar                      │
│                                                             │
│  UI                                                         │
│  - Renderiza interfaz                                      │
│  - Actualiza displays                                      │
└────────────────────────────────────────────────────────────┘
                          ↕
┌────────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                       │
├────────────────────────────────────────────────────────────┤
│  AuthService          DatabaseService     ConfigService    │
│  - Login              - CRUD Firestore    - localStorage   │
│  - Registro           - Guardar stats     - Configuración  │
│  - Logout             - Leer perfil       - Barajas        │
└────────────────────────────────────────────────────────────┘
                          ↕
┌────────────────────────────────────────────────────────────┐
│                   CAPA DE PERSISTENCIA                     │
├────────────────────────────────────────────────────────────┤
│  Firebase Auth              Firebase Firestore             │
│  - Usuarios autenticados    - users/{userId}              │
│                             - stats, bestHands            │
│                                                             │
│  localStorage                                               │
│  - frenzyJokerConfig (configuración local)                 │
└────────────────────────────────────────────────────────────┘
```

---

## Registro de Cambios y Correcciones

### Bugs Corregidos

#### Bug: Botones bloqueados después de completar ronda
- **Problema**: Después de completar una ronda, los botones de JUGAR y DESCARTAR quedaban deshabilitados en la siguiente ronda.
- **Causa**: El flag `isProcessing` se activaba en `playHand()` para prevenir doble clic, pero no se reseteaba cuando se alcanzaba el objetivo de la ronda (se hacía `return` antes de liberarlo).
- **Solución**: Se agregó `this.isProcessing = false;` al inicio del método `startNextRound()` para asegurar que el flag se resetee correctamente al comenzar cada nueva ronda.
- **Ubicación**: `src/classes/GameScene.js:1464`
- **Fecha**: 2025-12-10

#### Mejora: Símbolos de figuras con colores según palo
- **Antes**: Los símbolos de las figuras (J, Q, K) tenían el color hardcodeado a negro (#000000), independientemente del palo de la carta.
- **Después**: Los símbolos 𝐉, 𝐐, 𝐊 ahora utilizan el color del palo (`getSuitColor()`), igual que el resto de los símbolos en las cartas.
- **Beneficio**: Consistencia visual mejorada. Las figuras ahora son rojas si son corazones o diamantes, y negras si son tréboles o picas. Compatible con modo contraste.
- **Ubicación**: `src/classes/GameScene.js:526`
- **Fecha**: 2025-12-10

---

## Conclusión

Frenzy Joker es una aplicación completa de juego de cartas que combina:
- **Frontend moderno** con Phaser 3
- **Backend robusto** con Firebase
- **Lógica de póker completa** con evaluación precisa de manos
- **Sistema de progresión** con estadísticas persistentes
- **Configuración flexible** con múltiples opciones

La arquitectura modular permite fácil extensión para:
- Nuevas barajas
- Nuevas mecánicas de juego
- Sistema de logros
- Leaderboards globales
- Modos multijugador

---

**Versión de la documentación**: 2.1
**Última actualización**: 2025-12-10
**Características documentadas**:
- Sistema de Monedas (v2.0)
- Sistema de Comodines/Jokers con 24 jokers únicos (v2.0)
- Tienda (ShopScene) que aparece tras rondas 2 y 4 (v2.0)

**Bugs corregidos y mejoras (v2.1)**:
- Corrección: Botones bloqueados después de completar ronda
- Mejora: Símbolos de figuras (J/Q/K) con colores según palo
