# AgroNex

Plataforma SaaS agrícola premium diseñada como app móvil real con React Native + Expo.

## Inicio rápido

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Ejecuta la app:
   ```bash
   npm start
   ```
3. Abre en Android o iOS con Expo Go o genera un APK con `expo run:android`.

## Arquitectura

- `src/navigation`: rutas y navegación premium
- `src/screens`: pantallas principales
- `src/components`: UI reusable y componentes glasosos
- `src/context`: estado global y autenticación
- `src/services`: API, storage y sincronización
- `src/theme`: diseño dark mode premium
- `src/hooks`: lógica reutilizable
