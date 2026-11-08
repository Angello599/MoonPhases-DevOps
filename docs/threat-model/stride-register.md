# Registro STRIDE — Cinco vulnerabilidades principales

Documento de la **Fase 1**. Resume las cinco vulnerabilidades de mayor prioridad identificadas en el modelo de amenazas [threat-model.md](threat-model.md). Los IDs (`S-01`, `T-01`, etc.) corresponden al catálogo de esa sección 5.

Criterio de priorización: severidad (impacto × probabilidad en el despliegue actual) y evidencia en el código. Todas las vulnerabilidades de este registro son **confirmadas**, es decir, aparecen directamente en el código o en la configuración.

## 1. Tabla de vulnerabilidades

| ID | STRIDE | Componente / flujo | Vulnerabilidad | Evidencia | Impacto | Severidad | Mitigación propuesta | Fase de tratamiento |
|---|---|---|---|---|---|---|---|---|
| **V-01** | S, T, E | P2 Express · F1, F1b · amenazas S-01, T-01 | La API no tiene autenticación ni autorización. Cualquiera puede leer, crear, modificar y borrar notas de cualquier fecha. | [server.js:43](../../backend/src/server.js), [:64](../../backend/src/server.js) | Pérdida o alteración de datos del diario; cualquier visitante actúa como administrador. | **Alta** | Añadir autenticación (p. ej., sesión o JWT) y autorización por recurso. Como mínimo, proteger `POST` y `DELETE` detrás de un token. | Fase de correcciones y pruebas DAST |
| **V-02** | S, T, I, D | P2 Express · F1b · amenaza S-02 | El backend publica el puerto `3001` en el host, así que la API es accesible sin pasar por Nginx. | [compose.yaml:26-27](../../compose.yaml) | Evita cualquier control del proxy (límites, cabeceras, futuras reglas de WAF). Expone el backend directamente a Internet. | **Alta** | Eliminar `ports: "3001:3001"` del servicio `backend`. El acceso debe pasar siempre por Nginx. | Corrección inmediata (cambio de una línea) |
| **V-03** | D | P1 Nginx, P2 Express · F1, F2 · amenaza D-01 | No hay límite de tasa ni de tamaño de peticiones. Nginx usa el valor por defecto de 1 MB, Express acepta hasta 100 KB por defecto, y `content` no tiene longitud máxima. | [nginx.conf](../../frontend/nginx.conf), [server.js:7](../../backend/src/server.js) | Un cliente puede saturar el backend o el volumen de PostgreSQL con peticiones repetidas o notas muy grandes. | **Media** | En Nginx: `limit_req_zone` y `limit_req`, además de `client_max_body_size` explícito. En Express: validar la longitud de `content` (p. ej., 10 000 caracteres). | Fase de correcciones |
| **V-04** | I | P2 Express · F1 · amenaza I-01 | Los errores devuelven `err.message` al cliente. | [server.js:22](../../backend/src/server.js), [:38](../../backend/src/server.js), [:59](../../backend/src/server.js), [:71](../../backend/src/server.js) | Un error de PostgreSQL puede revelar tablas, columnas y versión del motor. Facilita la explotación posterior. | **Media** | Registrar el error completo en el servidor (`console.error`) y responder con un mensaje genérico (`{"error":"Error interno"}`). | Fase de correcciones |
| **V-05** | T, I | P1 Nginx, P2 Express · F1, F1b · amenazas T-03, T-05, I-02 | Canal y navegador sin protección: tráfico HTTP sin TLS, CORS abierto (`*`) y ausencia de cabeceras de seguridad. | [nginx.conf:2](../../frontend/nginx.conf), [server.js:6](../../backend/src/server.js) | Un atacante en la red puede leer o modificar el tráfico. Cualquier sitio web visitado por el usuario puede llamar a la API desde su navegador. | **Media** | Terminar TLS en Nginx (certificado en el entorno de despliegue). Restringir CORS al origen del frontend (`cors({ origin: 'http://localhost:8080' })`). Añadir `add_header` con CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y HSTS. | Fase de correcciones y pruebas DAST |

## 2. Explicación de cada vulnerabilidad

### V-01 · Ausencia de autenticación y autorización (S, T, E)

El esquema de base de datos declara "sin autenticación de usuario" ([schema.sql:2](../../backend/db/schema.sql)). En el código, ninguna ruta verifica identidad: `GET`, `POST` y `DELETE` están abiertos a quien pueda llegar al servicio. Esto habilita:

- **Suplantación (S):** no hay forma de distinguir a un usuario de otro.
- **Manipulación (T):** cualquiera puede sobrescribir la nota de cualquier fecha (`POST` hace un *upsert*) o borrarla.
- **Escalada (E):** la distinción entre "usuario" y "administrador" no existe, así que el atacante ya tiene el máximo privilegio disponible.

Es la vulnerabilidad más grave del sistema. Además, sin identidad no es posible implementar auditoría (R-01).

### V-02 · Backend expuesto directamente en el host (S, T, I, D)

En [compose.yaml:26-27](../../compose.yaml), el servicio `backend` publica `3001:3001`. El tráfico del usuario debería pasar solo por Nginx (puerto `8080`), que actúa como punto de control: proxy, cabeceras y límites. Con el puerto publicado, un cliente llega a Express sin pasar por ese punto.

Este hallazgo es una **violación de límite de confianza** (TB1): el flujo F1b existe, aunque en el diseño no debería. Se corrige eliminando una línea del `compose.yaml`. Es la acción de menor esfuerzo y mayor impacto de este registro.

### V-03 · Ausencia de límites de tasa y de tamaño (D)

El servicio no define:

- `limit_req` en Nginx, por lo que un cliente puede enviar peticiones sin límite.
- `client_max_body_size` explícito. Se usa el valor por defecto de Nginx (1 MB).
- Longitud máxima para `content`. La columna es `TEXT` sin límite lógico ([schema.sql:7](../../backend/db/schema.sql)).

Un atacante puede guardar notas de decenas de kilobytes en bucle y llenar el volumen `postgres-data`, o saturar el pool de conexiones de `pg`. Se clasifica como **denegación de servicio por agotamiento de recursos**.

### V-04 · Fuga de información en los errores (I)

Los cuatro bloques `catch` de [server.js](../../backend/src/server.js) responden con `err.message`. Con datos inválidos, como una fecha mal formada en `GET /api/notes/:date`, PostgreSQL devuelve un mensaje que describe el tipo de dato esperado y el contexto de la consulta. Un atacante puede usar esos mensajes para mapear la aplicación, sin necesidad de acceso privilegiado.

Es una fuga de **nivel medio**: no da acceso directo, pero reduce el costo de cualquier ataque posterior.

### V-05 · Canal sin TLS, CORS abierto y cabeceras ausentes (T, I)

Tres problemas relacionados, agrupados porque se corrigen en los mismos archivos:

1. **HTTP sin TLS (I-02):** `listen 8080` sin `ssl`. Las notas y las credenciales viajan sin cifrar. El riesgo es mayor si el host se usa fuera de una red local.
2. **CORS abierto (T-05):** `app.use(cors())` equivale a `Access-Control-Allow-Origin: *`. Un sitio malicioso puede hacer que el navegador del usuario envíe `DELETE` o `POST` a la API, o leer sus notas. Es una variante de CSRF favorecida por la falta de autenticación (V-01).
3. **Cabeceras ausentes (T-03):** sin CSP ni `X-Frame-Options`, el frontend puede embeberse en un `iframe` (*clickjacking*) y no tiene una política que limite la ejecución de scripts.

## 3. Hallazgos adicionales (no priorizados en el top 5)

| ID | Hallazgo | Estado | Nota |
|---|---|---|---|
| R-01 | Sin auditoría de escrituras | Confirmada | Se resuelve junto con V-01 (identidad). |
| T-04 | Imágenes base sin digest | Confirmada | Riesgo de cadena de suministro; se trata en la fase de CI/CD. |
| I-03 | PostgreSQL sin TLS | Candidata | Bajo riesgo: red `internal: true`. |
| I-04 | Volumen sin cifrado en reposo | Candidata | Depende del cifrado de disco del host. |
| I-05 | Secreto en archivo plano | Mitigada (residual) | Fuera de Git e imágenes; legible con acceso al host. |
| A-01 | Runner con acceso al Docker daemon | Anticipada | Equivale a root en el host. Revisar al crear el pipeline. |
| A-02 | Workflows de PR de forks con secretos | Anticipada | Revisar al crear `.github/workflows/`. |

## 4. Controles existentes que no deben retirarse

- PostgreSQL no se publica en el host y está en una red privada `internal: true`.
- Contenedores sin root (`USER node` y `nginx-unprivileged`).
- Consultas SQL parametrizadas en todo el backend.
- Secreto gestionado como Docker secret y excluido de Git.
- Build multietapa en el frontend.

## 5. Orden sugerido de corrección

1. **V-02** (eliminar `ports` del backend): cambio de una línea, impacto inmediato.
2. **V-04** (errores genéricos): cambio local en `server.js`.
3. **V-01** (autenticación): requiere diseño; es el cambio de mayor alcance.
4. **V-03** y **V-05** (límites, TLS, CORS, cabeceras): cambios en `nginx.conf` y `server.js`.

La validación de estas correcciones se hará con SAST y DAST en las fases siguientes. Cada hallazgo de esas herramientas debe asociarse a uno de estos IDs o registrarse como nuevo.
