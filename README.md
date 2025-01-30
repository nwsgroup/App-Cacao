# Guía para Ejecutar y Construir una Aplicación Android con Apache Cordova

Este archivo `README.md` proporciona una guía paso a paso para ejecutar y construir una aplicación Android utilizando Apache Cordova. Asegúrate de tener todas las dependencias necesarias instaladas antes de comenzar.

## Requisitos Previos

Antes de empezar, asegúrate de tener instalado lo siguiente en tu sistema:

1. **Node.js**: Cordova se ejecuta sobre Node.js. Puedes descargarlo e instalarlo desde [nodejs.org](https://nodejs.org/).
2. **Apache Cordova**: Una vez que tengas Node.js instalado, puedes instalar Cordova globalmente usando npm (Node Package Manager) con el siguiente comando:
   ```bash
   npm install -g cordova

3. **Java Development Kit (JDK):** Asegúrate de tener el JDK instalado. Puedes descargarlo desde Oracle.

4. **Android Studio:** Necesitarás Android Studio para gestionar los SDKs de Android y las herramientas de construcción. Descárgalo desde developer.android.com.

5. **Variables de Entorno:** Configura las variables de entorno JAVA_HOME y ANDROID_HOME en tu sistema. Esto es crucial para que Cordova pueda encontrar las herramientas necesarias.

6. **Construir el APKÑ** Ejecute el siguiente comando para construir el APK
```bash
   cordova build android
```
7. Tu apk estara ubicada en la ruta MyApp/platforms/android/app/build/outputs/apk/debug/

 
