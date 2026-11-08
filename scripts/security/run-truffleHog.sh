#!/bin/bash
# Secret scanning con TruffleHog sobre el sistema de archivos del proyecto.
# Reporte: reports/secrets/trufflehog-report.json (una linea JSON por hallazgo)
#
# --results=verified,unknown: TruffleHog intenta verificar las credenciales detectadas
# contra el proveedor correspondiente (peticion saliente a Internet). Con secretos reales
# esto los envia al proveedor para validarlos; usa --no-verification si no se desea.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="reports/secrets"

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker no esta instalado o no esta disponible."
    exit 1
fi

mkdir -p "$ROOT/$REPORT_DIR"

echo "======================================"
echo "   TRUFFLEHOG - secretos en archivos"
echo "======================================"

# stdout contiene solo los resultados JSON; los logs van a stderr.
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --security-opt label=disable \
  -e HOME=/tmp \
  -v "$ROOT":/src \
  trufflesecurity/trufflehog:latest filesystem /src \
  --no-update \
  --exclude-paths=/src/scripts/security/trufflehog-exclude.txt \
  --results=verified,unknown \
  --json > "$ROOT/$REPORT_DIR/trufflehog-report.json"
STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "ERROR: TruffleHog termino con codigo $STATUS"
    exit $STATUS
fi

echo "Reporte: $REPORT_DIR/trufflehog-report.json"
echo "AVISO: el reporte puede contener los valores de los secretos detectados. No lo subas a Git."
