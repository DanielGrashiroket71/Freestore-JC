# 🟢 FreeStore — Plataforma Libre de APKs

> Sin registro · Sin costos · Sin censura · 100% libre

## 🚀 Inicio Rápido

### Requisitos
- **Node.js 22+** (usa SQLite nativo, cero dependencias externas)

### Instalar y correr
```bash
# Entra a la carpeta
cd freestore

# Iniciar el servidor
node server.js
```

Abre tu navegador en: **http://localhost:3000**

---

## 🌐 Desplegar en producción (VPS)

### Opción 1 — VPS básico (Ubuntu/Debian)
```bash
# Instala Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# Copia la carpeta al servidor, luego:
PORT=80 node server.js

# O con PM2 para que corra siempre:
npm install -g pm2
pm2 start server.js --name freestore
pm2 startup && pm2 save
```

### Opción 2 — Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN mkdir -p data public/uploads/apks public/uploads/icons
EXPOSE 3000
CMD ["node", "server.js"]
```
```bash
docker build -t freestore .
docker run -d -p 3000:3000 -v ./data:/app/data -v ./uploads:/app/public/uploads --name freestore freestore
```

### Opción 3 — Railway / Render (gratis)
1. Sube el proyecto a GitHub
2. Conecta en railway.app o render.com
3. Deploy automático ✅

---

## 📁 Estructura del Proyecto
```
freestore/
├── server.js          # Servidor completo (cero dependencias)
├── data/
│   └── freestore.db   # Base de datos SQLite (se crea sola)
└── public/
    ├── index.html     # Frontend completo
    └── uploads/
        ├── apks/      # APKs subidas por usuarios
        └── icons/     # Íconos de apps
```

---

## 🔌 API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/apps` | Listar apps (filtros: q, cat, sort, page, limit) |
| GET | `/api/apps/featured` | Apps destacadas |
| GET | `/api/apps/:id` | Detalle de una app |
| POST | `/api/apps` | Publicar nueva app (multipart) |
| POST | `/api/apps/:id/download` | Registrar descarga + URL |
| POST | `/api/apps/:id/rate` | Enviar calificación |
| GET | `/api/stats` | Estadísticas globales |

---

## ✨ Características

- ✅ **Sin registro** — publica y descarga sin cuenta
- ✅ **Sin costos** — 100% gratuito para siempre  
- ✅ **Cero dependencias** — solo Node.js 22+
- ✅ **Base de datos SQLite** — persistencia sin instalar nada
- ✅ **Subida de APKs** — almacenamiento en el servidor
- ✅ **Búsqueda y filtros** — por nombre, categoría, desarrollador
- ✅ **Sistema de calificaciones** — rating y reseñas
- ✅ **Contador de descargas** — estadísticas en tiempo real
- ✅ **Apps destacadas** — curación editorial
- ✅ **Responsive** — funciona en móvil y desktop
- ✅ **Dark mode** — diseño cyberpunk oscuro

---

## ⚙️ Configuración

Variables de entorno:
```bash
PORT=3000          # Puerto (default: 3000)
```

Para destacar una app, actualiza manualmente en SQLite:
```bash
sqlite3 data/freestore.db "UPDATE apps SET featured=1 WHERE name='MiApp';"
```

---

## 📄 Licencia
MIT — usa, modifica, distribuye libremente.
