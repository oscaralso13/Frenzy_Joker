# 🎴 Frenzy Joker

Juego de póker desarrollado con **Phaser 3** y **Firebase** para el proyecto de 2º DAW. Incluye sistema de autenticación, estadísticas, comodines (jokers) y tienda.

---

## Índice

- [Características](#características)
- [Instalación](#instalación)
- [Cómo Jugar](#cómo-jugar)
- [Sistema de Jokers](#sistema-de-jokers)
- [Tecnologías](#tecnologías)
- [Autor](#autor)

---

## Características

### Jugabilidad
- 9 tipos de manos de póker
- 8 cartas en mano, selecciona hasta 5 para jugar
- 10 rondas progresivas + modo infinito
- 24 comodines (jokers) con efectos únicos
- Sistema de monedas y tienda para comprar jokers
- 3 barajas diferentes con bonificaciones
- Ordenamiento de cartas por palo o valor

### Autenticación
- Registro e inicio de sesión con Firebase
- Estadísticas guardadas por usuario (puntuación máxima, partidas jugadas, etc.)

### Configuración
- Velocidad de animaciones ajustable
- Auto-ordenar cartas
- Modo compacto
- Confirmar descartes

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/oscaralso13/Frenzy_Joker.git
cd Frenzy_Joker
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication (Email/Password)
3. Crea una base de datos Firestore
4. Copia `src/firebase/config.example.js` a `src/firebase/config.js` y añade tus credenciales

### 4. Ejecutar
```bash
npm run dev
```

Abre el navegador en `http://localhost:5176`

---

## Cómo Jugar

### Inicio
1. Regístrate o inicia sesión con tu email
2. Selecciona una baraja (Clásica, Roja +1 descarte, o Azul +1 jugada)
3. Elige la dificultad

### Durante el juego
1. Selecciona hasta 5 cartas haciendo clic en ellas
2. Haz clic en **JUGAR** para usar las cartas y sumar puntos
3. Haz clic en **DESCARTAR** para cambiar cartas
4. Tienes 4 jugadas y 3 descartes por ronda

### Objetivo
- Completa 10 rondas alcanzando el objetivo de puntos de cada una
- Gana monedas al completar rondas
- Compra jokers en la tienda (aparece después de rondas 2 y 4)
- Los jokers modifican tu puntuación con efectos especiales

### Manos de Póker

| Mano | Fichas | Multiplicador |
|------|--------|---------------|
| Escalera de color | 100 | x8 |
| Póker | 60 | x7 |
| Full House | 40 | x4 |
| Color | 35 | x4 |
| Escalera | 30 | x4 |
| Trío | 30 | x3 |
| Doble pareja | 20 | x2 |
| Pareja | 10 | x2 |
| Carta alta | 5 | x1 |

---

## Sistema de Jokers

Los jokers modifican tu puntuación con efectos especiales. Puedes equipar hasta 5 simultáneamente y se compran en la tienda con monedas.

**Ejemplos de jokers:**
- **Comodín**: +4 Multiplicador constante
- **Amante**: +3 Mult. por cada corazón
- **Actor**: x2 Mult. con pareja
- **Escalador**: x3 Mult. con escalera
- **Entrenador**: +0.5 Mult. por cada descarte (acumulativo)
- **Racha**: +1 Mult. por jugada sin descartar (acumulativo)
- **Economista**: +1 Mult. por cada 10 monedas
- **Apostador**: 50% probabilidad de x3 o x0.5 Mult.

*En total hay 24 jokers únicos con diferentes efectos.*

---

## Tecnologías

- **Phaser 3** - Motor de juegos HTML5
- **Firebase** - Autenticación y base de datos (Firestore)
- **Vite** - Bundler y servidor de desarrollo
- **JavaScript ES6+**

---

## Autor

**Oscar Alcober Soria** - Proyecto de 2º DAW
