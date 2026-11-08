#!/bin/bash
# SAST con Semgrep: reglas p/ci, p/security-audit y p/javascript.
# Reporte: reports/sast/semgrep-report.json
# Las reglas se descargan del registro de Semgrep (requiere Internet).

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="reports/sast"

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker no esta instalado o no esta disponible."
    exit 1
fi

mkdir -p "$ROOT/$REPORT_DIR"

echo "======================================"
echo "   SEMGREP (SAST) - codigo fuente"
echo "======================================"

# HOME=/tmp: Semgrep escribe cache/logs en $HOME y el usuario del contenedor no tiene uno.
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --security-opt label=disable \
  -e HOME=/tmp \
  -v "$ROOT":/src \
  semgrep/semgrep:latest semgrep \
  --config "p/ci" \
  --config "p/security-audit" \
  --config "p/javascript" \
  --metrics=off \
  --exclude reports \
  --json --output "/src/$REPORT_DIR/semgrep-report.json" \
  /src
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "Reporte: $REPORT_DIR/semgrep-report.json"
else
    echo "ERROR: Semgrep termino con codigo $STATUS"
fi
exit $STATUS
