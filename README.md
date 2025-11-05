# MedifyLocal

Aplicación móvil para la gestión de recetas médicas y compra de medicamentos en farmacias locales.

## 📱 Descripción

MedifyLocal es una aplicación React Native desarrollada con Expo que permite a los usuarios cargar sus recetas médicas, recibir cotizaciones de diferentes farmacias y realizar pedidos de manera sencilla y conveniente. La aplicación conecta a pacientes con farmacias locales, facilitando la comparación de precios y la compra de medicamentos.

## ✨ Características

- 🔐 **Autenticación de usuarios**: Sistema completo de login y registro
- 📸 **Carga de recetas**: Permite a los usuarios subir fotos de sus recetas médicas
- 💰 **Cotizaciones**: Recibe y compara precios de diferentes farmacias
- 🛒 **Gestión de pedidos**: Realiza y rastrea tus pedidos de medicamentos
- 💳 **Pagos integrados**: Proceso de pago seguro con MercadoPago
- 👤 **Perfil de usuario**: Gestiona tu información personal y preferencias
- 📱 **Diseño responsive**: Optimizado para iOS y Android

## 🛠️ Tecnologías

- **Framework**: [React Native](https://reactnative.dev/) 0.81.4
- **Runtime**: [Expo](https://expo.dev/) ~54.0.13
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) ~5.9.2
- **Navegación**: [Expo Router](https://docs.expo.dev/router/introduction/) ~6.0.11
- **Backend**: [Firebase](https://firebase.google.com/) ^12.4.0 (Firestore & Authentication)
- **Pagos**: [MercadoPago](https://www.mercadopago.com/) ^2.10.0
- **UI**: React Native Components con iconos de @expo/vector-icons

## 📋 Requisitos Previos

- Node.js (versión 18 o superior recomendada)
- npm o yarn
- Expo CLI
- Cuenta de Expo (para desarrollo)
- Android Studio o Xcode (para emuladores nativos)
- Cuenta de Firebase (para backend)
- Cuenta de MercadoPago (para pagos)

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/littleg0d/MedifyLocal.git
   cd MedifyLocal
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication y Firestore
   - Crea el archivo de configuración en `src/lib/firebase.ts` con tus credenciales:
   ```typescript
   // Nota: Este archivo está en .gitignore por seguridad
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

4. **Configurar MercadoPago**
   - Configura tus credenciales de MercadoPago según la documentación

## 💻 Ejecución

### Modo Desarrollo

```bash
# Iniciar el servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web
npm run web
```

### Linting

```bash
npm run lint
```

## 📱 Estructura del Proyecto

```
MedifyLocal/
├── app/                    # Rutas de la aplicación (Expo Router)
│   ├── (tabs)/            # Pantallas con navegación por pestañas
│   │   ├── index.tsx      # Inicio/Dashboard
│   │   ├── recetas.tsx    # Mis Recetas
│   │   ├── pedidos.tsx    # Mis Pedidos
│   │   ├── perfil.tsx     # Perfil de usuario
│   │   ├── pagar.tsx      # Pantalla de pago
│   │   └── solicitudes.tsx # Solicitudes
│   ├── auth/              # Pantallas de autenticación
│   │   ├── login.tsx      # Inicio de sesión
│   │   ├── register.tsx   # Registro
│   │   └── forgot.tsx     # Recuperar contraseña
│   └── _layout.tsx        # Layout principal
├── assets/                # Recursos estáticos
│   └── styles.ts          # Estilos globales
├── components/            # Componentes reutilizables
├── constants/             # Constantes de la aplicación
├── hooks/                 # Hooks personalizados
└── src/                   # Código fuente (gitignored)
    └── lib/               # Librerías y configuraciones
        └── firebase.ts    # Configuración de Firebase
```

## 🔐 Seguridad

- Las credenciales de Firebase y otras configuraciones sensibles se mantienen en el directorio `src/` que está excluido del control de versiones
- Nunca subas tus claves API o tokens al repositorio
- Utiliza variables de entorno para información sensible

## 📱 Navegación

La aplicación utiliza una navegación por pestañas con las siguientes secciones:

1. **Inicio**: Dashboard principal con opción de cargar nuevas recetas
2. **Mis Recetas**: Visualización de todas las recetas cargadas
3. **Mis Pedidos**: Seguimiento de pedidos activos y completados
4. **Perfil**: Gestión de información personal

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado.

## 👥 Autores

- Desarrollado por ex1t

## 📞 Soporte

Para soporte o preguntas, por favor abre un issue en el repositorio de GitHub.

## 🔄 Estado del Proyecto

En desarrollo activo.

---

Desarrollado con ❤️ usando React Native y Expo
