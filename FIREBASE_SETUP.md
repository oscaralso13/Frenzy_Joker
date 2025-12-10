# 🔥 Configuración de Firebase para Frenzy Joker

## Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"**
3. Nombre del proyecto: `Frenzy Joker` (o el que prefieras)
4. (Opcional) Desactiva Google Analytics si no lo necesitas
5. Haz clic en **"Crear proyecto"**

---

## Paso 2: Registrar tu Aplicación Web

1. En la página principal del proyecto, haz clic en el ícono **</> (Web)**
2. Nombre de la app: `Frenzy Joker Web`
3. **NO** marques "Firebase Hosting" por ahora
4. Haz clic en **"Registrar app"**
5. **Copia la configuración** que te muestra (firebaseConfig)

---

## Paso 3: Configurar el Archivo config.js

1. Abre el archivo: `src/firebase/config.js`
2. Reemplaza los valores de `firebaseConfig` con los que copiaste

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## Paso 4: Habilitar Authentication

1. En el menú izquierdo de Firebase Console, ve a **"Authentication"**
2. Haz clic en **"Comenzar"**
3. En la pestaña **"Sign-in method"**:
   - Haz clic en **"Correo electrónico/contraseña"**
   - **Activa** el primer switch (Email/Password)
   - Guarda cambios

---

## Paso 5: Crear Base de Datos Firestore

1. En el menú izquierdo, ve a **"Firestore Database"**
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Iniciar en modo de prueba"** (para desarrollo)
   - Esto permite leer/escribir durante 30 días
4. Selecciona una ubicación (ej: `us-central1`)
5. Haz clic en **"Habilitar"**

---

## Paso 6: Configurar Reglas de Seguridad

### Para Desarrollo (temporal):
En Firestore Database > Reglas, usa esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura durante 30 días
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 3, 1);
    }
  }
}
```

### Para Producción (cuando esté listo):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Solo el usuario autenticado puede leer/escribir sus datos
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Paso 7: Probar la Aplicación

1. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre el navegador en `http://localhost:5175`

3. Prueba crear una cuenta:
   - Email: `test@example.com`
   - Contraseña: `test123` (mínimo 6 caracteres)
   - Username: `Jugador1`

4. Verifica en Firebase Console:
   - **Authentication** > deberías ver el usuario creado
   - **Firestore Database** > deberías ver la colección `users` con datos

---

## 📊 Estructura de Datos en Firestore

La base de datos creará automáticamente esta estructura:

```
users/
  └── {userId}/
      ├── userId: string
      ├── username: string
      ├── email: string
      ├── createdAt: timestamp
      ├── lastLogin: timestamp
      └── stats/
          ├── totalScore: number
          ├── highScore: number
          ├── gamesPlayed: number
          ├── averageScore: number
          ├── totalPlayTime: number (en segundos)
          └── bestHands/
              ├── "Escalera de color": number
              ├── "Póker": number
              ├── "Full House": number
              └── ... (todas las manos)
```

---

## 🔒 Seguridad Importante

### ⚠️ NUNCA subas a GitHub:
- El archivo `config.js` con tus credenciales reales
- Crea un archivo `.env` si planeas hacer el proyecto público

### ✅ Para proyectos públicos:
1. Crea `.gitignore` y añade:
   ```
   src/firebase/config.js
   .env
   ```

2. Crea `src/firebase/config.example.js`:
   ```javascript
   // Ejemplo de configuración
   const firebaseConfig = {
     apiKey: "TU_API_KEY",
     // ... resto de campos
   };
   ```

---

## 🚀 Funcionalidades Implementadas

### ✅ Autenticación:
- Registro de usuarios
- Login con email/contraseña
- Validaciones de email y contraseña
- Mensajes de error en español

### ✅ Base de Datos:
- Creación automática de perfiles
- Guardado de estadísticas por partida
- Seguimiento de manos jugadas
- Cálculo de promedios
- Detección de récords personales

### ✅ UI/UX:
- Menú principal profesional
- Formularios con validación
- Mensajes de feedback
- Transiciones suaves entre escenas
- Pantalla de Game Over con estadísticas

---

## 🐛 Solución de Problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que copiaste correctamente el `apiKey` en `config.js`

### Error: "Missing or insufficient permissions"
- Ve a Firestore > Reglas y asegúrate de tener las reglas correctas
- Para desarrollo, usa las reglas temporales del Paso 6

### No se guardan las estadísticas:
- Verifica que iniciaste sesión correctamente
- Abre la consola del navegador (F12) y busca errores
- Verifica que en Firestore > Data se esté creando la colección `users`

---

## 📚 Próximos Pasos (Opcional)

- [ ] Implementar recuperación de contraseña
- [ ] Añadir autenticación con Google
- [ ] Crear tabla de clasificación global (leaderboard)
- [ ] Implementar sistema de logros
- [ ] Añadir avatares de usuario
- [ ] Modo multijugador

---

¿Necesitas ayuda? Abre un issue en GitHub o consulta la [documentación oficial de Firebase](https://firebase.google.com/docs).
