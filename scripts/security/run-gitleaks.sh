#!/bin/bash
# Secret scanning con Gitleaks sobre el historial de Git.
# Reporte: reports/secrets/gitleaks-report.json
# Con --exit-code 0 el script solo falla por errores de ejecucion, no por hallazgos;
# los hallazgos se cuentan al final.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="reports/secrets"

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker no esta instalado o no esta disponible."
    exit 1
fi

mkdir -p "$ROOT/$REPORT_DIR"

echo "======================================"
echo "   GITLEAKS - secretos en el historial"
echo "======================================"

docker run --rm \
  --user "$(id -u):$(id -g)" \
  --security-opt label=disable \
  -v "$ROOT":/src \
  zricethezav/gitleaks:latest detect \
  --source /src \
  --report-format json \
  --report-path "/src/$REPORT_DIR/gitleaks-report.json" \
  --exit-code 0
STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "ERROR: Gitleaks termino con codigo $STATUS"
    exit $STATUS
fi

echo "Reporte: $REPORT_DIR/gitleaks-report.json"
echo "AVISO: el reporte puede contener los valores de los secretos detectados. No lo subas a Git."
