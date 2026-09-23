# MoonPhases

MoonPhases es una aplicación para visualizar las fases lunares de forma interactiva. La solución consiste en un simulador 3D desarrollado con Three.js que permite explorar el ciclo lunar y consultar sus fases a lo largo del tiempo.

## Equipo y roles

- **Angello:** adaptación del proyecto a Frontend, Backend y Base de Datos.
- **Eddison:** dockerización de cada servicio.
- **Nicol:** automatización de pruebas.

## Tecnologías

- Vite
- TypeScript
- Three.js

## Prerrequisitos

- Node.js 20+
- npm

## Instalación y ejecución local

```bash
git clone https://github.com/Angello599/MoonPhases-DevOps
cd MoonPhases-DevOps
npm install
npm run dev
```

## Construcción y ejecución con Docker Compose

### Prerrequisitos

- Docker Engine
- Docker Compose v2 (`docker compose`)

El archivo `pg_password.txt` contiene la contraseña que utilizan PostgreSQL y el backend. Debe existir en la raíz del proyecto antes de iniciar los servicios.

### Construir e iniciar los servicios

Desde la raíz del proyecto, ejecuta:

```bash
docker compose up --build -d
```

Este comando construye las imágenes del frontend y backend, inicia PostgreSQL y levanta los tres servicios en segundo plano.

La aplicación estará disponible en:

```text
http://localhost:8080/MoonPhases/
```

El backend también publica su comprobación de salud en:

```text
http://localhost:3001/api/health
```

### Comandos útiles

Ver el estado de los servicios:

```bash
docker compose ps
```

Consultar los logs:

```bash
docker compose logs -f
```

Detener los servicios sin borrar los datos:

```bash
docker compose down
```

Detener los servicios y borrar el volumen de PostgreSQL:

```bash
docker compose down -v
```

La base de datos se inicializa automáticamente con `backend/db/schema.sql` la primera vez que se crea el volumen.

## Pruebas

- Pruebas unitarias

Desde la raíz del proyecto, ejecutar:

```bash
npm test
```

Este comando ejecuta las 9 pruebas unitarias mediante Vitest.  

- Automatización de pruebas
Para ejecutar el script de automatización mediante Bash:

```bash
./run-tests.sh
```

---
Proyecto basado en [MoonPhases](https://github.com/NeaByteLab/MoonPhases) de NeaByteLab.
