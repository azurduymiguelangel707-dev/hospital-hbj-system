# 🏥 Sistema de Gestión Hospitalaria con Blockchain

Sistema hospitalario enterprise con auditoría inmutable usando blockchain y Proof of Work.

## 🚀 Tecnologías

- **Backend:** NestJS 10 + TypeORM + PostgreSQL
- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Blockchain:** SHA-256 + Proof of Work
- **Autenticación:** Keycloak OAuth2
- **Infraestructura:** Docker + Docker Compose

## 📋 Requisitos

- Docker Desktop
- Git (para clonar)
- 8GB RAM mínimo
- 5GB espacio en disco

## ⚙️ Instalación

### 1. Clonar repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd hospital-system1
```

### 2. Configurar variables de entorno

**Backend:**
```bash
cd backend
cp .env.example .env
# Editar .env con tus configuraciones
cd ..
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Editar .env.local si es necesario
cd ..
```

### 3. Iniciar con Docker
```bash
# Construir imágenes
docker-compose build --no-cache

# Iniciar contenedores
docker-compose up -d

# Ver estado
docker-compose ps
```

### 4. Configurar Keycloak

1. Ir a: http://localhost:8080
2. Login: admin / admin123
3. Crear Realm: "hospital"
4. Crear usuario de prueba

## 🌐 Acceso

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/api
- **Keycloak:** http://localhost:8080
- **PostgreSQL:** localhost:5432

## 🔐 Credenciales por defecto

- **Keycloak Admin:** admin / admin123
- **PostgreSQL:** hospital_admin / hospital_secure_2024

## 📊 Características

- ✅ CRUD completo de pacientes, médicos, citas
- ✅ Blockchain con Proof of Work (dificultad 2)
- ✅ Dashboard de auditoría con gráficas
- ✅ Autenticación OAuth2 con Keycloak
- ✅ Base de datos inmutable con triggers
- ✅ Exportación de auditoría (JSON/CSV)

## 🛠️ Comandos útiles
```bash
# Ver logs
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Eliminar todo (incluye datos)
docker-compose down -v
```

## 📁 Estructura
```
hospital-system1/
├── backend/        # API NestJS
├── frontend/       # UI Next.js
├── database/       # Scripts SQL
└── docker-compose.yml
```