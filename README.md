# 🏨 Hotel El Rincón del Carmen - Sistema de Reservas

Sistema web completo para la gestión de reservas y visualización de habitaciones del Hotel El Rincón del Carmen. Desarrollado con Web Components, HTML5, CSS3 y JavaScript vanilla.

## 📋 Descripción del Proyecto

Sitio web funcional y atractivo que permite a los clientes explorar las instalaciones del hotel, consultar disponibilidad de habitaciones y gestionar reservas de forma sencilla. Incluye un panel administrativo para la gestión completa del inventario de habitaciones y reservas.

## ✨ Características Principales

### Sitio Web Público

- **Landing Page Atractiva**: Página de inicio con carrusel de habitaciones, galería de instalaciones y servicios (comidas, spa, zonas húmedas)
- **Sistema de Reservas**: Consulta de disponibilidad por fechas, número de personas y visualización de habitaciones disponibles
- **Detalles de Habitaciones**: Información completa sobre camas, servicios incluidos (internet, minibar, jacuzzi) y precios
- **Página de Contacto**: Ubicación, dirección y múltiples formas de contacto
- **Diseño Responsivo**: Optimizado principalmente para dispositivos móviles

### Sistema de Usuarios

- **Registro de Usuarios**: Con datos completos (identificación, nombre, nacionalidad, email, teléfono, contraseña)
- **Autenticación**: Sistema de login para usuarios registrados
- **Gestión de Reservas**: Los usuarios pueden realizar y cancelar sus propias reservas

### Panel Administrativo

- **Gestión de Habitaciones**: CRUD completo para administrar el inventario
  - Cantidad de camas
  - Número máximo de personas
  - Valor por noche
  - Servicios incluidos
- **Gestión de Reservas**: Visualización, modificación y cancelación de reservas de clientes

### Funcionalidades del Sistema

- ✅ Validación de disponibilidad en tiempo real
- ✅ Prevención de solapamiento de reservas
- ✅ Liberación automática de habitaciones al cancelar
- ✅ Cálculo automático de precios según noches y personas
- ✅ Almacenamiento persistente en LocalStorage

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Diseño responsivo y moderno
- **JavaScript (ES6+)**: Lógica de negocio y gestión de datos
- **Web Components**: Arquitectura modular y escalable
- **LocalStorage**: Simulación de persistencia de datos

## 📁 Estructura del Proyecto

```
hotel-rincon-carmen/
├── index.html              # Landing page
├── reservas.html           # Página de consulta y reservas
├── contacto.html           # Página de contacto
├── admin.html              # Panel administrativo
├── css/
│   ├── styles.css          # Estilos globales
│   ├── landing.css         # Estilos de landing page
│   ├── reservas.css        # Estilos de reservas
│   └── admin.css           # Estilos del panel admin
├── js/
│   ├── components/         # Web Components
│   │   ├── header.js
│   │   ├── footer.js
│   │   ├── room-card.js
│   │   └── carousel.js
│   ├── services/           # Servicios y lógica de negocio
│   │   ├── storage.js
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   └── reservations.js
│   └── utils/              # Utilidades
│       └── helpers.js
├── assets/
│   └── images/             # Imágenes del hotel
└── README.md
```

## 🚀 Instalación y Uso

### Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, para desarrollo)

### Instalación

1. Clonar el repositorio:
```bash
git clone [URL-del-repositorio]
cd hotel-rincon-carmen
```

2. Abrir con Live Server o servidor local:
```bash
# Con Python
python -m http.server 8000

# Con Node.js (http-server)
npx http-server
```

3. Acceder a `http://localhost:8000` en el navegador

### Uso Sin Servidor

También puedes abrir directamente el archivo `index.html` en tu navegador.

## 👥 Usuarios de Prueba

### Usuario Cliente
- **Email**: cliente@example.com
- **Contraseña**: cliente123

### Usuario Administrador
- **Email**: admin@hotel.com
- **Contraseña**: admin123

## 📱 Funcionalidades por Página

### 1. Landing Page (/)
- Carrusel de habitaciones destacadas
- Galería de servicios (restaurante, spa, zonas húmedas)
- Información general del hotel
- Call-to-action para reservas

### 2. Reservas (/reservas.html)
- Formulario de búsqueda (fechas, personas)
- Listado de habitaciones disponibles
- Vista detallada de cada habitación
- Sistema de reserva (requiere login)
- Gestión de reservas propias

### 3. Contacto (/contacto.html)
- Mapa de ubicación
- Dirección física
- Teléfonos de contacto
- Email de contacto
- Formulario de consultas

### 4. Panel Admin (/admin.html)
- Dashboard con estadísticas
- CRUD de habitaciones
- Gestión de reservas de todos los clientes
- Visualización de calendario de ocupación

## 🔐 Sistema de Autenticación

El sistema distingue entre dos tipos de usuarios:

1. **Clientes**: Pueden hacer y cancelar sus propias reservas
2. **Administradores**: Acceso completo al panel de gestión

## 💾 Estructura de Datos (LocalStorage)

### Habitaciones
```javascript
{
  id: "room-001",
  nombre: "Suite Presidencial",
  camas: 2,
  personasMax: 4,
  valorNoche: 250000,
  servicios: ["internet", "minibar", "jacuzzi", "tv"],
  imagenes: ["url1", "url2"],
  descripcion: "..."
}
```

### Reservas
```javascript
{
  id: "res-001",
  habitacionId: "room-001",
  usuarioId: "user-001",
  fechaInicio: "2025-10-15",
  fechaFin: "2025-10-18",
  personas: 2,
  valorTotal: 750000,
  estado: "activa"
}
```

### Usuarios
```javascript
{
  id: "user-001",
  identificacion: "1234567890",
  nombre: "Juan Pérez",
  nacionalidad: "Colombiano",
  email: "juan@email.com",
  telefono: "3001234567",
  rol: "cliente" // o "admin"
}
```

## ✅ Validaciones Implementadas

- ✔️ Validación de fechas (no permitir fechas pasadas)
- ✔️ Verificación de disponibilidad en tiempo real
- ✔️ Prevención de solapamiento de reservas
- ✔️ Validación de capacidad de personas por habitación
- ✔️ Autenticación requerida para reservas
- ✔️ Validación de formularios completa

## 🎨 Diseño Responsivo

El sitio está optimizado para:
- 📱 Dispositivos móviles (320px - 767px)
- 📱 Tablets (768px - 1024px)
- 💻 Desktop (1025px+)

## 🔄 Funcionalidades Futuras

- [ ] Integración con backend real
- [ ] Pasarela de pagos
- [ ] Notificaciones por email
- [ ] Sistema de reviews y calificaciones
- [ ] Chat de soporte en vivo
- [ ] Multi-idioma

## 👨‍💻 Desarrollo

### Buenas Prácticas Implementadas

- Código modular con Web Components
- Separación de responsabilidades
- Naming conventions consistente
- Comentarios en código complejo
- Validación de datos de entrada
- Manejo de errores robusto

### Comandos Git

```bash
# Inicializar repositorio
git init

# Agregar cambios
git add .

# Commit
git commit -m "Descripción del cambio"

# Push a GitHub
git push origin main
```

## 📄 Licencia

Este proyecto es de uso académico para el programa de desarrollo web.

## 📧 Contacto

Para más información sobre el proyecto, contactar a través del repositorio de GitHub.

---

**Desarrollado con ❤️ para Hotel El Rincón del Carmen**

##Creado 
por Felipe Corredor Silva 
