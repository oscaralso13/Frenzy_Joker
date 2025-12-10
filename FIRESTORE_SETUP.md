# 🔒 Configuración de Seguridad de Firestore

## Paso 1: Desplegar Reglas de Seguridad

### Opción A: Desde Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto **frenzy-joker**
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Reglas** (Rules)
5. Copia y pega el contenido del archivo `firestore.rules` de este proyecto
6. Haz clic en **Publicar** (Publish)

### Opción B: Usando Firebase CLI

```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar Firebase en el proyecto
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

---

## Paso 2: Crear Índice para Leaderboard

Para que el **Leaderboard** funcione, necesitas crear un índice en Firestore.

### Método 1: Automático (cuando se ejecute por primera vez)

1. Ejecuta la aplicación y ve a la sección de **Ranking/Leaderboard**
2. Si no existe el índice, verás un error en la consola del navegador
3. **Firebase te dará un enlace directo** para crear el índice
4. Haz clic en ese enlace, te llevará a Firebase Console
5. Haz clic en **Crear índice** y espera 1-2 minutos

### Método 2: Manual

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Índices**
4. Haz clic en **Crear índice**
5. Configura:
   - **Colección:** `users`
   - **Campo 1:** `stats.highScore` → **Descendente**
   - **Query Scopes:** Collection
6. Haz clic en **Crear**

---

## 🛡️ Qué Protegen las Reglas de Seguridad

### ✅ Permitido:
- Un usuario puede leer y editar **solo su propio perfil**
- Un usuario puede ver estadísticas públicas de otros (para el leaderboard)
- Solo se puede crear un perfil si el UID coincide con el usuario autenticado
- Las estadísticas solo pueden **incrementar** (anti-trampas básico)

### ❌ Bloqueado:
- Un usuario **NO puede** modificar datos de otros usuarios
- **NO se pueden** modificar campos críticos como `userId`, `email`, `createdAt`
- **NO se pueden** poner puntuaciones mayores a 10,000 (límite anti-trampas)
- **NO se pueden** decrementar estadísticas (gamesPlayed, totalScore)
- **NO se puede** eliminar perfiles de usuario

---

## 🧪 Probar las Reglas

Puedes probar las reglas en Firebase Console:

1. Ve a **Firestore Database** → **Reglas**
2. Haz clic en **Simulador de reglas**
3. Prueba diferentes operaciones:
   - Lectura de documento propio ✅
   - Escritura en documento ajeno ❌
   - Modificar campo `userId` ❌
   - Incrementar `highScore` ✅

---

## 📊 Verificar que Funciona

Una vez configurado:

1. Inicia sesión en la aplicación
2. Juega una partida y complétala
3. Ve al **Ranking** en el menú de preparación
4. Deberías ver tu puntuación y la de otros jugadores

---

## ⚠️ Importante para Producción

Antes de lanzar la aplicación al público:

1. ✅ Verifica que las reglas estén desplegadas
2. ✅ Prueba el simulador de reglas
3. ✅ Crea el índice del leaderboard
4. ✅ Considera añadir límites de tasa (rate limiting)
5. ✅ Activa dominios autorizados en Firebase Authentication

---

## 🔍 Troubleshooting

### Error: "Missing or insufficient permissions"
- Las reglas no están desplegadas correctamente
- Verifica que las reglas en Firebase Console coincidan con `firestore.rules`

### Error: "The query requires an index"
- Necesitas crear el índice para el leaderboard
- Sigue el enlace que aparece en el error de la consola

### El leaderboard no muestra datos
- Verifica que haya usuarios con `highScore > 0`
- Comprueba en Firebase Console → Firestore → Colección `users`
