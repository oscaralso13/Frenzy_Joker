# Frenzy Joker - Notas de Refactorización

## Cambios Realizados

### 1. Reorganización del Código

El código ha sido completamente reorganizado en una arquitectura orientada a objetos con las siguientes clases:

#### `/src/classes/Card.js`
- Representa una carta individual del juego
- Métodos para obtener valor numérico, fichas, símbolo y color del palo
- Gestión del estado de selección

#### `/src/classes/Deck.js`
- Maneja la baraja completa de 52 cartas
- Sistema de barajado usando el algoritmo Fisher-Yates
- Gestión de cartas descartadas y rebarajado automático
- Métodos para sacar cartas individuales o múltiples

#### `/src/classes/HandEvaluator.js`
- Evalúa las manos de póker
- Calcula puntuaciones, multiplicadores y fichas bonus
- Identifica todas las combinaciones: Escalera de color, Póker, Full House, Color, Escalera, Trío, Doble pareja, Pareja, Carta alta
- **FIX**: Ahora detecta correctamente la escalera baja con As (A-2-3-4-5)

#### `/src/classes/UI.js`
- Gestiona toda la interfaz de usuario
- Contenedores para puntuación, botones y mano
- Animaciones y efectos visuales
- Sistema de mensajes emergentes

#### `/src/classes/GameScene.js`
- Escena principal del juego en Phaser
- Coordina toda la lógica del juego
- Maneja eventos y flujo del juego
- Renderiza las cartas con efectos visuales mejorados

### 2. Bugs Solucionados

#### Bug #1: Filtrado incorrecto de cartas
**Problema**: Se filtraban cartas del `deck` completo en vez de la `mano` actual
**Solución**: Ahora se gestiona correctamente con `this.hand` y `this.selectedCards`
**Ubicación**: `GameScene.js:225`

#### Bug #2: Las cartas no se reponían
**Problema**: Después de jugar o descartar, la mano no se rellenaba
**Solución**: Implementado sistema automático de relleno de mano
**Ubicación**: `GameScene.js:253-256, 286-289`

#### Bug #3: Actualización visual de múltiples cartas
**Problema**: Solo se actualizaba el color de una carta al seleccionar múltiples
**Solución**: Cada carta tiene su propio sprite con borde de selección independiente
**Ubicación**: `GameScene.js:171-191`

#### Bug #4: Cálculo incorrecto de fichas
**Problema**: Las fichas adicionales no se reseteaban correctamente
**Solución**: Se calcula en cada evaluación usando el sistema modular de `HandEvaluator`
**Ubicación**: `HandEvaluator.js:38-40`

#### Bug #5: Escalera con As
**Problema**: No manejaba la escalera baja (A-2-3-4-5)
**Solución**: Implementada detección de escalera baja con As valiendo 1
**Ubicación**: `HandEvaluator.js:81-96`

#### Bug #6: Código muerto
**Problema**: `counter.js` no se usaba
**Solución**: Eliminado de las referencias (no se elimina el archivo por si acaso)

### 3. Mejoras Visuales

#### CSS (`style.css`)
- Fondo con gradiente azul/morado profesional
- Patrón diagonal sutil para dar textura
- Sombras y bordes redondeados en el canvas
- Animaciones de fade-in para mensajes

#### Interfaz Phaser
- **Cartas estilizadas**: Diseño realista con símbolos de palo, números y colores apropiados
- **Borde de selección**: Borde dorado que indica cartas seleccionadas
- **Animaciones**:
  - Hover: Las cartas se elevan al pasar el cursor
  - Selección: Las cartas seleccionadas permanecen elevadas
  - Puntuación: Escala animada al cambiar
- **Colores profesionales**:
  - Fondo oscuro azulado (#1a1a2e)
  - Acentos rojos (#e94560) y dorados (#ffd700)
  - Texto con múltiples colores según función

#### Contenedores UI
- Panel de puntuación con información clara
- Botones con efectos hover y animaciones
- Separadores visuales entre secciones
- Sombras para dar profundidad

### 4. Arquitectura del Proyecto

```
Frenzy_Joker/
├── src/
│   ├── classes/
│   │   ├── Card.js           # Clase de carta individual
│   │   ├── Deck.js           # Manejo de baraja
│   │   ├── HandEvaluator.js  # Evaluación de manos
│   │   ├── UI.js             # Interfaz de usuario
│   │   └── GameScene.js      # Escena principal
│   ├── main.js               # Punto de entrada
│   └── style.css             # Estilos globales
├── index.html
└── package.json
```

### 5. Características Mejoradas

1. **Sistema de rebarajado**: Cuando se acaban las cartas, automáticamente se mezclan las descartadas
2. **Feedback visual mejorado**: Mensajes emergentes en lugar de alerts
3. **Responsive**: Se adapta al tamaño de ventana
4. **Fin de juego**: Muestra puntuación final y reinicia automáticamente
5. **Código mantenible**: Separación clara de responsabilidades

## Cómo Jugar

1. Ejecuta `npm run dev` en la terminal
2. Abre el navegador en `http://localhost:5174`
3. Selecciona hasta 5 cartas haciendo clic en ellas
4. Observa la evaluación automática de tu mano
5. Haz clic en "JUGAR" para puntuar o "DESCARTAR" para cambiar cartas
6. Intenta conseguir la mayor puntuación posible en 4 jugadas

## Puntuaciones

| Mano                | Fichas Base | Multiplicador |
|---------------------|-------------|---------------|
| Escalera de color   | 100         | x8            |
| Póker               | 60          | x7            |
| Full House          | 40          | x4            |
| Color               | 35          | x4            |
| Escalera            | 30          | x4            |
| Trío                | 30          | x3            |
| Doble pareja        | 20          | x2            |
| Pareja              | 10          | x2            |
| Carta alta          | 5           | x1            |

**Bonus**: Las cartas aportan fichas adicionales (As=11, J/Q/K=10, números=valor)

## Recursos

- **Phaser 3**: Motor de juegos
- **Vite**: Bundler y servidor de desarrollo
- **ES6 Modules**: Código modular y organizado
