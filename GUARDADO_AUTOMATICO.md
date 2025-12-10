# 💾 Sistema de Guardado Automático

## Descripción General

El sistema de guardado automático permite a los jugadores **pausar y continuar** sus partidas sin perder el progreso. El juego se guarda automáticamente en **Firestore** después de cada acción importante.

---

## 🎮 Funcionalidades

### ✅ Guardado Automático
El juego se guarda automáticamente en:
- ✨ **Después de cada jugada** (cuando juegas cartas)
- ✨ **Al iniciar una nueva ronda**
- ✨ **Al salir del juego** (cerrar navegador)

### ✅ Recuperación Automática
- Al volver al menú de preparación, si hay una partida guardada, aparece un **botón dorado pulsante** para continuar
- Muestra información de la partida: ronda actual y tiempo desde el guardado

### ✅ Expiración Automática
- Las partidas guardadas se eliminan automáticamente después de **7 días**
- Cuando terminas una partida (victoria o derrota), se elimina el guardado

---

## 🔧 Implementación Técnica

### 1. DatabaseService - Métodos

#### `saveGameProgress(userId, gameState)`
Guarda el estado completo del juego en Firestore.

```javascript
const gameState = {
  selectedDeck: 'default',
  selectedDifficulty: 'easy',
  currentRound: 2,
  roundScore: 450,
  totalScore: 850,
  coins: 15,
  playsRemaining: 3,
  discardsRemaining: 2,
  hand: [/* cartas */],
  equippedJokers: [/* jokers */],
  gameStartTime: timestamp
};

await DatabaseService.saveGameProgress(userId, gameState);
```

#### `getSavedGame(userId)`
Recupera la partida guardada del usuario.

```javascript
const result = await DatabaseService.getSavedGame(userId);
if (result.success && result.data) {
  // Hay partida guardada
  const savedGame = result.data;
}
```

#### `clearSavedGame(userId)`
Elimina la partida guardada.

```javascript
await DatabaseService.clearSavedGame(userId);
```

---

### 2. GameScene - Serialización

#### Datos Guardados

```javascript
{
  selectedDeck: string,           // 'default', 'red', 'blue'
  selectedDifficulty: string,     // 'easy', 'medium', 'hard'
  currentRound: number,           // 1-5
  roundScore: number,
  totalScore: number,
  coins: number,
  playsRemaining: number,
  discardsRemaining: number,
  basePlays: number,
  baseDiscards: number,
  hand: [                         // Mano serializada
    { suit: 'H', number: 'A' },
    { suit: 'D', number: '7' }
  ],
  equippedJokers: [              // Jokers serializados
    { id: 'comodin', accumulatedValue: 0 },
    { id: 'entrenador', accumulatedValue: 2.5 }
  ],
  handsPlayed: {                 // Historial de manos
    "Pareja": 5,
    "Trío": 2
  },
  gameStartTime: timestamp,
  roundObjectives: [300, 450, 600, 900, 1250],
  savedAt: serverTimestamp       // Añadido automáticamente
}
```

#### Método `saveGameState()`

```javascript
async saveGameState() {
  if (!this.currentUser) return;

  try {
    // Serializar mano
    const handData = this.hand.map(card => ({
      suit: card.suit,
      number: card.number
    }));

    // Serializar jokers
    const jokersData = this.equippedJokers.map(joker => ({
      id: joker.id,
      accumulatedValue: joker.accumulatedValue
    }));

    const gameState = { /* ... */ };
    await DatabaseService.saveGameProgress(this.currentUser.uid, gameState);
  } catch (error) {
    console.error('Error al guardar partida:', error);
  }
}
```

#### Método `loadFromSavedGame(savedData)`

```javascript
loadFromSavedGame(savedData) {
  // Restaurar variables primitivas
  this.currentRound = savedData.currentRound;
  this.totalScore = savedData.totalScore;
  // ...

  // Reconstruir jokers desde JOKER_CATALOG
  const { JOKER_CATALOG } = require('./Joker.js');
  this.equippedJokers = savedData.equippedJokers.map(jokerData => {
    const jokerTemplate = JOKER_CATALOG[jokerData.id];
    const joker = Object.create(Object.getPrototypeOf(jokerTemplate));
    Object.assign(joker, jokerTemplate);
    joker.accumulatedValue = jokerData.accumulatedValue || 0;
    return joker;
  });

  // Reconstruir mano
  const Card = require('./Card.js').default;
  this.hand = savedData.hand.map(cardData =>
    new Card(cardData.suit, cardData.number)
  );
}
```

---

### 3. PreparationScene - Detección y UI

#### Verificar Partida Guardada

```javascript
async checkForSavedGame() {
  if (!this.currentUser) return;

  const result = await DatabaseService.getSavedGame(this.currentUser.uid);
  if (result.success && result.data) {
    this.hasSavedGame = true;
    this.savedGameData = result.data;
  }
}
```

#### Botón de Continuar

Si hay partida guardada, se muestra un **botón dorado** con:
- Texto: "⏯ CONTINUAR PARTIDA"
- Info: "Ronda X • hace Yh"
- Efecto de pulso para llamar la atención

```javascript
createContinueButton(x, y) {
  const continueBtn = this.add.rectangle(x, y, 350, 70, 0xffd700);
  // ... diseño y animación

  continueBtn.on('pointerdown', () => {
    this.continueGame();
  });
}
```

#### Continuar vs Nueva Partida

```javascript
continueGame() {
  // Marcar que viene de partida guardada
  this.savedGameData.fromSavedGame = true;
  this.registry.set('savedGameData', this.savedGameData);
  this.scene.start('GameScene');
}

async startNewGame() {
  // Confirmar y eliminar partida guardada
  await DatabaseService.clearSavedGame(this.currentUser.uid);
  this.startGame();
}
```

---

## 🔄 Flujo Completo

### Escenario 1: Guardar y Continuar

```mermaid
Usuario juega mano
    ↓
GameScene.playSelectedCards()
    ↓
Actualiza estado (roundScore, playsRemaining, hand, etc.)
    ↓
saveGameState()
    ├─→ Serializa mano y jokers
    └─→ DatabaseService.saveGameProgress()
           └─→ Firestore: users/{userId}/savedGame

---

Usuario cierra navegador
    ↓
Usuario vuelve más tarde
    ↓
PreparationScene.checkForSavedGame()
    ↓
DatabaseService.getSavedGame()
    ├─→ Verifica que no tenga más de 7 días
    └─→ Retorna savedGameData

Si hay partida guardada:
    ↓
Muestra botón "⏯ CONTINUAR PARTIDA"
    ↓
Usuario hace clic
    ↓
continueGame()
    ├─→ registry.set('savedGameData', data)
    └─→ scene.start('GameScene')
           ↓
       GameScene.init()
           └─→ loadFromSavedGame(savedData)
                  ├─→ Deserializa estado
                  ├─→ Reconstruye objetos (Card, Joker)
                  └─→ ¡Partida restaurada!
```

### Escenario 2: Completar Partida

```mermaid
Usuario gana/pierde
    ↓
GameScene.endGame() o winGame()
    ↓
clearSavedGame(userId)
    └─→ Firestore: users/{userId}/savedGame = null
    ↓
saveGameStats(gameData)
    └─→ Guarda estadísticas finales
```

---

## 📊 Ventajas para el TFG

### 1. Demuestra Conocimientos Avanzados

**Serialización/Deserialización:**
```javascript
// Objetos complejos → JSON simple
Card object → { suit: 'H', number: 'A' }
Joker object → { id: 'comodin', accumulatedValue: 0 }

// JSON simple → Objetos complejos
{ suit: 'H', number: 'A' } → new Card('H', 'A')
{ id: 'comodin', ... } → Object.assign(new Joker(), JOKER_CATALOG.comodin)
```

**Gestión de Estado:**
- Estado distribuido entre cliente (Phaser) y servidor (Firestore)
- Sincronización automática
- Validación de datos (edad de la partida)

### 2. Aspectos Técnicos a Explicar

**En la Defensa del TFG:**

*"El sistema de guardado automático implementa un patrón de serialización
donde los objetos complejos del juego (cartas, jokers) se convierten a
estructuras planas para almacenarlas en Firestore.

Al recuperar la partida, se realiza el proceso inverso: deserialización,
reconstruyendo los objetos con sus prototipos y métodos originales.

La expiración automática de 7 días garantiza que no se acumulen datos
innecesarios en la base de datos. El guardado se activa en momentos
estratégicos para balancear UX y rendimiento."*

### 3. Mejora la UX

- ✅ No pierdes progreso al cerrar el navegador
- ✅ Puedes pausar y volver cuando quieras
- ✅ Detección automática y transparente
- ✅ Confirmación antes de sobrescribir
- ✅ Indicador visual llamativo (botón dorado pulsante)

---

## 🧪 Testing

### Prueba 1: Guardar y Recuperar

1. Inicia una partida
2. Juega 2-3 manos
3. Cierra el navegador (o recarga la página)
4. Vuelve al menú de preparación
5. Deberías ver el botón "CONTINUAR PARTIDA"
6. Haz clic → La partida debe continuar exactamente donde la dejaste

### Prueba 2: Nueva Partida

1. Con una partida guardada
2. Haz clic en "NUEVA PARTIDA"
3. Confirma el diálogo
4. La partida guardada se elimina
5. Inicia una partida nueva desde cero

### Prueba 3: Expiración

1. Modificar temporalmente el código para simular 8 días
2. La partida guardada debe eliminarse automáticamente
3. No debe aparecer el botón de continuar

### Prueba 4: Completar Juego

1. Completa una partida (gana o pierde)
2. Vuelve al menú
3. La partida guardada debe haberse eliminado automáticamente

---

## 🔍 Troubleshooting

### Error: "Cannot read property 'suit' of undefined"
- La mano no se deserializó correctamente
- Verifica que `savedData.hand` exista y tenga el formato correcto

### La partida no se guarda
- Verifica que `currentUser` esté definido (usuario logueado)
- Comprueba la consola por errores de Firestore
- Verifica reglas de seguridad

### El botón de continuar no aparece
- Verifica que `getSavedGame()` retorne datos
- Comprueba que la partida no tenga más de 7 días
- Revisa la consola por errores

---

## 📝 Notas para Documentación del TFG

### Diagrama de Clases (UML)

```
GameScene
├── saveGameState()
├── loadFromSavedGame(data)
└── variables: hand, jokers, scores, etc.

DatabaseService
├── saveGameProgress(userId, state)
├── getSavedGame(userId)
└── clearSavedGame(userId)

PreparationScene
├── checkForSavedGame()
├── continueGame()
└── startNewGame()
```

### Patrón de Diseño

**Memento Pattern** (Patrón Memento):
- Captura y externaliza el estado interno de un objeto sin violar encapsulación
- Permite restaurar el objeto a ese estado más tarde

```
Originator: GameScene
Memento: savedGameData (en Firestore)
Caretaker: DatabaseService
```
