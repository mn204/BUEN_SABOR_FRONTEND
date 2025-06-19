# 🍽️ El Buen Sabor - Frontend

Frontend del sistema integral para la gestión de un emprendimiento gastronómico con delivery. Esta aplicación web permite a clientes, empleados y administradores interactuar con el sistema de forma moderna, fluida y segura.

---

## 🧪 Cuentas de prueba

Consultar el [README del backend](https://github.com/tu-usuario/buen-sabor-backend) para acceder a los usuarios por rol (cliente, cajero, cocinero, delivery, admin).

---

## 🛠️ Tecnologías utilizadas

- ⚛️ React 18
- ⚡ Vite
- 🔠 TypeScript
- 💅 Bootstrap 5 + React Bootstrap
- 🌐 Fetch
- 🔄 Context API
- 🔐 Firebase Authentication

---

## ⚙️ Instalación y ejecución

### Prerrequisitos

- Node.js 18+
- npm

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/buen-sabor-frontend.git
cd buen-sabor-frontend
npm install
```

### Correr el proyecto

```bash
npm run dev
```

👉 Disponible en: [http://localhost:5173](http://localhost:5173)

### Otros scripts útiles

```bash
npm run build       # Generar versión de producción
npm run preview     # Previsualizar build
npm run lint        # Linting
```

---

## 🧩 Estructura del proyecto

```
📦 src
├── 📁 components       → Componentes reutilizables
├── 📁 services         → Llamadas a la API con Axios
├── 📁 hooks            → Hooks personalizados
├── 📁 context          → Contextos globales (auth, carrito, etc.)
├── 📁 models           → Interfaces y tipos TypeScript para datos
├── 📁 functions        → Funciones auxiliares y helpers reutilizables
└── 📁 assets           → Imágenes, íconos, etc.
```

---

## 🔐 Autenticación

- Implementada con Firebase Authentication.
- Roles disponibles: Administrador, Cajero, Cocinero, Delivery, Cliente.

---

## 📦 Funcionalidades destacadas

- Registro y login de usuarios
- Paneles separados según el rol
- Visualización de productos con imágenes
- Carrito de compras y confirmación de pedido
- Seguimiento de estado del pedido
- Administración de productos, insumos, usuarios y promociones
- Responsive design para experiencia móvil
- Notificaciones en tiempo real (en desarrollo con WebSockets)

---

## 🌍 Conexión al backend

Por defecto, la app se conecta al backend vía:

```
http://localhost:8080
```

> ⚠️ Asegurate de tener el backend corriendo antes de iniciar el frontend.

---

## 👥 Autores

- Lucas Gonzalez  
- Juan Cruz Gonzalez  
- Manuel Rodríguez  
- Sebatian Luna  
- Juan Cruz Vargas

---

## 🤝 Contribuciones

1. Haz un fork del repositorio
2. Crea una nueva rama: `feature/nueva-funcionalidad`
3. Realiza tus cambios y haz commit: `git commit -m "Nueva funcionalidad"`
4. Sube tus cambios: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

---

## 📝 Licencia

Proyecto académico desarrollado para **Laboratorio de Computación 4 - UTN**.  
Para uso profesional o comercial, contactar a los autores.
