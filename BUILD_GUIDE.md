# Guía: Generar APK y QR para iOS/Android

## Opción 1: Usar Expo Go (más rápido)

Descarga **Expo Go** en tu teléfono (iOS App Store / Google Play).

Luego, en la carpeta del proyecto:

```powershell
npm start
```

Escanea el QR que sale en la terminal con tu teléfono y listo.

---

## Opción 2: Generar APK/TestFlight (producción)

### Paso 1: Crear cuenta en Expo
1. Ve a https://expo.dev
2. Crea una cuenta gratuita
3. Confirma tu email

### Paso 2: Login en la terminal
```powershell
eas login
```

Ingresa:
- Email: `guilhebassolouveira@gmail.com`
- Contraseña: tu contraseña de Expo

### Paso 3: Generar APK (Android)
```powershell
eas build --platform android --profile preview
```

Te dará un QR que puedes escanear para descargar el APK.

### Paso 4: Generar TestFlight (iOS)
```powershell
eas build --platform ios --profile preview
```

Similar al Android, pero será para TestFlight.

---

## Opción 3: Build local (sin servidor Expo)

Si EAS falla, instala:
- Android Studio + SDK
- Xcode (solo macOS)

Luego:
```powershell
eas build --platform android --local
```

---

## Status actual

✅ Código compilado sin errores TypeScript
✅ Configuración de Expo lista (`eas.json`, `app.json`)
✅ Variables de entorno configuradas
⏳ Pendiente: Login en Expo y generar builds
