# Selección de herramientas SAST, DAST, secretos y SCA basada en STRIDE

Documento de la **Fase 2**. Elige las herramientas de análisis estático (SAST), dinámico (DAST), de detección de secretos y de análisis de dependencias (SCA), y justifica cada elección con las amenazas del modelo STRIDE de la [Fase 1](../threat-model/threat-model.md).

Escrito para: el equipo del proyecto y los docentes del curso de DevSecOps.

## 1. Criterio de selección

Una herramienta entra al pipeline si cumple al menos una de estas condiciones:

1. **Cubre amenazas concretas** del catálogo STRIDE (IDs `S-xx`, `T-xx`, `I-xx`, `D-xx`, `E-xx`, `R-xx`, `A-xx`).
2. **Funciona con el stack actual:** JavaScript/TypeScript (Express, Vite), Dockerfile, Compose y PostgreSQL.
3. **Se ejecuta en GitHub Actions** sin infraestructura adicional, o con un servicio que el proyecto puede justificar.
4. **Es gratuita** para un repositorio académico, o tiene una edición gratuita suficiente.

Una herramienta que no cubre ninguna amenaza del modelo no se incluye, aunque sea popular.

## 2. Herramientas evaluadas

| Herramienta | Tipo | Qué analiza | Decisión | Motivo |
|---|---|---|---|---|
| **Semgrep** (CLI, reglas OSS) | SAST | Código JS/TS, Dockerfile, reglas de taint para inyección y fugas | **Se usa** (principal SAST) | Rápida, con reglas para Express y Node, se ejecuta en cada PR. Permite escribir reglas propias para T-05 (CORS `*`) y I-01 (`err.message`). |
| **SonarCloud** | SAST / calidad | Bugs, vulnerabilidades, *code smells*, cobertura, duplicación | **Se usa** como complemento | Analiza calidad además de seguridad y ofrece un panel. Gratuito para repositorios públicos. Depende de la visibilidad del repositorio (ver sección 5). |
| **SonarQube Community** | SAST | Igual que SonarCloud, self-hosted | **No se usa** | Requiere un servidor propio y un servicio extra en Compose. Solo se considera si el repositorio es privado y SonarCloud no aplica. |
| **OWASP ZAP** | DAST | Aplicación en ejecución: cabeceras, cookies, CORS, inyecciones, control de acceso | **Se usa** (único DAST) | Gratuita, de código abierto, con imágenes oficiales y escaneo *baseline* pasivo (seguro) y *full* activo (solo en entorno local). |
| **Trivy** | SCA / contenedor / IaC | Vulnerabilidades en imágenes, dependencias (lockfiles) y configuración de Dockerfile/Compose | **Se usa** (SCA principal) | Cubre las imágenes base (T-04), los tres lockfiles del proyecto y la configuración de contenedores (E). Un solo binario para varios objetivos. |
| **Snyk** | SCA / SAST / contenedor | Vulnerabilidades en dependencias, con PR de corrección automática | **No se usa** en el pipeline | Base de datos sólida y sugerencias de corrección, pero requiere cuenta, un token en los secretos de CI, y envía los manifiestos a la nube de Snyk. Su plan gratuito tiene cuotas mensuales limitadas. Trivy cubre el mismo alcance en dependencias npm sin esos costos. Ver sección 2.1. |
| **Gitleaks** | Secretos | Credenciales en el código y en el historial de Git | **Se usa** | Rápida, ideal para PR (solo diferencias) y para escaneo completo del historial. Detecta `pg_password` si alguna vez se commitea. |
| **git-secrets** | Secretos (prevención local) | Patrones de credenciales mediante *hooks* de Git | **No se usa** en CI; opcional en local | Su conjunto de patrones por defecto es de AWS, y necesita instalarse en cada clon. Un desarrollador puede saltar el *hook* con `--no-verify`, así que no es una garantía. Ver sección 2.1. |
| **TruffleHog** | Secretos | Credenciales con verificación contra el proveedor | **Reserva** (no en el pipeline inicial) | Verifica si una credencial está activa, útil, pero más lenta y con licencia AGPL. Gitleaks cubre el alcance del proyecto. |

**Duplicado en la lista original:** Semgrep aparece dos veces. Se considera una sola herramienta.

### 2.1 Secret scanning y SCA

#### Secret scanning: Gitleaks

Se elige **Gitleaks** por tres razones:

- **Dos modos de uso:** `gitleaks git` escanea el historial completo y las diferencias de un PR. El mismo binario sirve para la CI y para el escaneo programado.
- **Prevención en el origen:** puede instalarse como *pre-commit hook* opcional para desarrolladores. La CI sigue siendo la barrera obligatoria, porque el hook local puede saltarse.
- **Sin cuenta ni servicio externo:** no requiere token para funcionar.

Relación con el modelo: detecta credenciales en código y en historial, que es la vía para las amenazas **S** de la sección 3 (credenciales reutilizables) y **I-05** (secreto en archivo). El secreto actual está en `pg_password.txt`, excluido de Git por `.gitignore`. Gitleaks permite comprobar que ese valor no aparece en el historial.

**Por qué no git-secrets:** es útil como barrera local en un equipo que ya lo usa, pero no sustituye a un escaneo en CI. Sus patrones por defecto son de AWS, así que para tokens y contraseñas genéricas hay que escribir patrones propios. Solo tiene sentido como complemento local.

#### SCA: Trivy

Se elige **Trivy** por:

- **Alcance:** escanea `package-lock.json` en la raíz, en `backend/` y en `frontend/`, las imágenes base de Docker (incluidos paquetes del sistema de Alpine) y los Dockerfile/Compose en busca de malas configuraciones.
- **Una herramienta para tres objetivos:** `trivy fs` para lockfiles, `trivy image` para imágenes y `trivy config` para archivos de configuración. Así se reduce la cantidad de acciones y de versiones que hay que fijar.
- **Sin cuenta:** no requiere token.

Relación con el modelo: cubre **T-04** (imágenes sin digest, como riesgo de cadena de suministro) y las vulnerabilidades de dependencias que afectan a **T** y **E**.

**Por qué no Snyk, por ahora:** tiene mejor base de datos de corrección y genera PR automáticos, pero para este proyecto la diferencia no justifica:

- Crear una cuenta y gestionar un token de CI.
- Enviar los manifiestos del proyecto a un servicio externo.
- Depender de cuotas del plan gratuito.

Si el curso exige un panel de remediación o PR automáticos, Snyk puede añadirse como segunda fuente de SCA sin cambiar el resto del pipeline.

## 3. Cobertura STRIDE

Esta tabla muestra qué herramienta detecta cada amenaza del modelo de la Fase 1. Una celda vacía indica que la herramienta no cubre esa amenaza.

| STRIDE | Amenaza (Fase 1) | Semgrep | SonarCloud | ZAP | Trivy | Gitleaks | git-secrets | Snyk | Control complementario |
|---|---|---|---|---|---|---|---|---|---|
| **S** | S-01 Sin autenticación | | | ● (acceso sin sesión a `/api/notes`) | | | | | Prueba manual de DAST con la API |
| **S** | S-02 Backend publicado en `3001` | | | | | | | | Prueba en CI: `curl` a `:3001` debe fallar |
| **S/T** | Credenciales en código | | | | | ● | ◐ (local) | | |
| **S/T** | Credenciales en historial de Git | | | | | ● | ◐ (`--scan-history`) | | |
| **T** | T-01 POST/DELETE sin autorización | ◐ | | ● | | | | | Pruebas de integración |
| **T** | T-02 Entrada sin validar | ● (taint) | ◐ | ● (inyección) | | | | | |
| **T** | T-03 Sin cabeceras de seguridad | | | ● (pasivo) | | | | | |
| **T** | T-04 Imágenes sin digest | | | | ◐ (vulnerabilidades) | | | | Revisión manual del pinning |
| **T** | Dependencias npm con CVE | ◐ (reglas) | | | ● (lockfiles) | | | ● | Actualizaciones de dependencias |
| **T** | T-05 CORS `*` | ● (regla propia) | | ◐ | | | | | |
| **R** | R-01 Sin auditoría | | | | | | | | Revisión manual (sin herramienta) |
| **I** | I-01 `err.message` en respuestas | ● (regla propia) | ◐ | ● (respuesta con error) | | | | | |
| **I** | I-02 HTTP sin TLS | | | ◐ (pasivo) | | | | | Revisión de la configuración de Nginx |
| **I** | I-03 PostgreSQL sin TLS | | | | | | | | Revisión manual (red interna) |
| **I** | I-04 Volumen sin cifrado | | | | ◐ (config) | | | | Fuera de alcance del pipeline |
| **I** | I-05 Secreto en archivo | | | | | ◐ (si se commitea) | ◐ (local) | | Revisión de `.gitignore` |
| **D** | D-01 Sin límites de tasa ni tamaño | | | | | | | | Revisión manual de Nginx y Express |
| **E** | A-01 Acceso del runner al Docker daemon | | | | ◐ (config) | | | | Revisión manual del workflow |
| **E** | Contenedor como root | ◐ (Dockerfile) | | | ● (config) | | | | |

Leyenda: ● cobertura directa · ◐ cobertura parcial · vacío sin cobertura.

**Brechas declaradas:**

- **R-01 (repudio)** no se detecta con ninguna herramienta. Requiere revisión manual y, en el futuro, trazabilidad en DefectDojo.
- **D-01 (denegación)** tiene poca cobertura automatizada. Un análisis DAST real de carga está fuera de alcance por seguridad y costo, y no se realizará contra el servicio.
- **S-02 (puerto expuesto)** se verifica con una prueba propia en CI, no con una herramienta de escaneo.

## 4. Stack seleccionado y momento de ejecución

| Momento del pipeline | Herramienta | Objetivo | Bloquea el PR |
|---|---|---|---|
| Pull request | Gitleaks (`git`, diferencia) | Secretos en los cambios | Sí |
| Pull request | Semgrep | SAST sobre código y Dockerfile | Sí (severidad alta) |
| Pull request | SonarCloud | SAST de calidad y seguridad | Sí (*quality gate*) |
| Pull request | Trivy (`fs`) | Dependencias de los tres lockfiles | Sí (crítico) |
| Push a `main` / tras build | Trivy (`image`, `config`) | Imágenes y configuración de Compose | Sí (crítico) |
| Tras `docker compose up` (entorno de pruebas) | OWASP ZAP baseline | DAST pasivo contra `http://localhost:8080` | No (informa) |
| Programado (semanal) | Gitleaks (`git`, historial completo) | Secretos en todo el historial | No (informa) |
| Programado (semanal) | OWASP ZAP full | DAST activo, solo en entorno local | No (informa) |

Reglas de uso:

- **ZAP activo** (*full scan*) solo corre contra el stack local de la propia CI. Nunca contra un servidor ajeno ni contra producción.
- **Umbral de bloqueo** inicial: solo severidad alta o crítica. Los demás hallazgos se registran en DefectDojo (Fase posterior).
- **Gitleaks en PR** se ejecuta con el historial completo, no solo con la diferencia, porque una credencial ya commitida en `main` seguiría activa aunque se borre en el PR. Si el historial es muy grande, se limita el escaneo programado.
- Cada hallazgo de estas herramientas se asocia a un ID del modelo STRIDE, o se registra como nuevo.

## 5. Decisiones pendientes y supuestos

1. **Visibilidad del repositorio.** SonarCloud es gratuito solo si el repositorio es público. Si es privado, se usa SonarQube Community en Compose, o se elimina Sonar y se mantiene Semgrep como SAST único. Confirmar antes de implementar la Fase 3.
2. **Licencias.** Verificar la licencia vigente de cada herramienta antes de adoptarla en el curso. TruffleHog usa AGPL-3.0; el resto usa licencias permisivas o copyleft débil.
3. **Versiones.** Fijar versiones exactas de cada acción y de cada imagen Docker en el pipeline (ver amenaza T-04). No usar `latest`.
4. **Reglas propias de Semgrep.** Escribir al menos dos reglas: CORS con `origin: '*'` (T-05) y envío de `err.message` en respuestas (I-01).
5. **Snyk.** Decidir si el curso exige un panel o PR automáticos. Si lo exige, se requiere cuenta y el token `SNYK_TOKEN` en los secretos de GitHub. Hasta entonces no se incluye.
6. **Historial de Git.** Si Gitleaks encuentra una credencial ya commitida, hay que rotarla. Borrarla del historial no basta, porque el repositorio puede haberse clonado.

## 6. Siguientes pasos

1. Confirmar la visibilidad del repositorio (sección 5, punto 1).
2. Crear `.github/workflows/security.yml` con los jobs de la tabla de la sección 4.
3. Escribir las dos reglas propias de Semgrep.
4. Ejecutar Gitleaks sobre el historial actual antes de activar el pipeline, para confirmar que no hay credenciales ya commitidas.
5. Ejecutar ZAP baseline contra el stack de Compose y registrar la línea base de hallazgos en `reports/dast/`.
