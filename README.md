# El Buen Sabor 🍽️

Sistema integral de gestión para un emprendimiento gastronómico con delivery, que moderniza la atención al cliente y optimiza las operaciones internas del negocio. Desarrollado como proyecto final académico.

---

## 🛠️ Tecnologías utilizadas

### Backend
- Java 17 + Spring Boot
- Gradle
- MySQL
- Firebase Authentication (servicio de autenticación)
- Cloudinary (almacenamiento de imágenes)
- Checkout Pro de Mercado Pago (integración de pagos)

### Frontend
- React 18
- Vite
- TypeScript
- Bootstrap 5
- React Bootstrap

---

## 🧩 Estructura del proyecto

El repositorio contiene dos carpetas principales:

- `BUEN_SABOR_BACKEND/` → Contiene el backend implementado en Java Spring Boot.
- `BUEN_SABOR_FRONTEND/` → Contiene el frontend desarrollado con React + Vite.

---

## 🚀 Instrucciones de instalación y ejecución

### 1. Base de datos

1. Iniciar el motor de base de datos MySQL.
2. Crear una base de datos llamada `buen_sabor`.
3. Modificar las credenciales en el archivo `application.properties` ubicado en:

```
BUEN_SABOR_BACKEND/src/main/resources/application.properties
```

Con el siguiente contenido (actualizando usuario y contraseña):

```properties
spring.application.name=BUEN_SABOR_BACKEND

spring.datasource.url=jdbc:mysql://localhost:3306/buen_sabor?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=

spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.hibernate.ddl-auto=update

spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB

server.port=8080
```

4. Contactar a un integrante del grupo para obtener el archivo `firebase-service-account-buen-sabor.json` y colocarlo en:

```
BUEN_SABOR_BACKEND/src/main/resources/firebase/
```

5. Desde la carpeta `BUEN_SABOR_BACKEND`, ejecutar:

```bash
./gradlew build
```

6. Correr el proyecto desde tu IDE o terminal. Esto creará las tablas en la base de datos.

7. Ejecutar manualmente el script `script_datos1.sql` en la base de datos.
8. Luego ejecutar manualmente el script `script_datos2.sql` en la base de datos.
9. Luego ejecutar manualmente el script `script_datos3.sql` en la base de datos.
10. Por ultimo ejecutar manualmente el script `script_datos4.sql` en la base de datos.

---

### 2. Frontend

1. Abrir una terminal y posicionarse dentro de la carpeta `BUEN_SABOR_FRONTEND`.
2. Ejecutar:

```bash
npm install
```

3. Luego correr la app:

```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173`.

---

## 📦 Descripción general de los módulos implementados

- **Gestión de usuarios** (clientes y empleados)
- **Dashboard administrativo**
- **Panel de empleados** (cajero, cocinero, delivery)
- **Catálogo y compra de productos**
- **Carrito de compras y confirmación de pedidos**
- **Control de stock de insumos**
- **Estadísticas y reportes**
- **Historial de pedidos**
- **Integración con Mercado Pago**
- **Autenticación segura con Firebase**
- **Subida de imágenes a Cloudinary**

Cada módulo está adaptado a los distintos roles del sistema: Cliente, Administrador, Cajero, Cocinero y Delivery.

---

## 👤 Integrantes del grupo

- Lucas Gonzalez
- Juan Cruz Gonzalez
- Manuel Rodríguez
- Sebatian Luna
- Juan Cruz Vargas

---

## 🧪 Cuentas de prueba

### Administradores
- `admin@buensa.com` / `123456`
- `mln204manutup@gmail.com` / `123456`

### Sucursal 1
- Cajero: `cajero@buensa.com` / `123456`
- Cocinero: `cocinero@buensa.com` / `123456`
- Delivery: `delivery@buensa.com` / `123456`

### Sucursal 2
- Cajero: `cajero2@buensa.com` / `123456A.a`
- Cocinero: `cocinero2@buensa.com` / `123456A.a`
- Delivery: `delivery2@buensa.com` / `123456A.a`

### Clientes
- `clientebuensabor@gmail.com` / `123456`
- `luis@hotmail.com` / `123456A.a`
- `max@hotmail.com` / `123456A.a`
