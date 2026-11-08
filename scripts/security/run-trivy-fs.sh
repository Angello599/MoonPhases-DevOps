#!/bin/bash
# SCA con Trivy: vulnerabilidades HIGH/CRITICAL en las dependencias del proyecto
# (package-lock.json de raiz, backend y frontend).
# Reporte: reports/sca/trivy-report.json

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="reports/sca"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/trivy"

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker no esta instalado o no esta disponible."
    exit 1
fi

mkdir -p "$ROOT/$REPORT_DIR" "$CACHE_DIR"

echo "======================================"
echo "   TRIVY (SCA) - dependencias"
echo "======================================"

# --security-opt label=disable: necesario con SELinux en Enforcing para los bind mounts.
# --user: el reporte queda a nombre del usuario, no de root.
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --security-opt label=disable \
  -e TRIVY_CACHE_DIR=/tmp/trivy-cache \
  -v "$ROOT":/src \
  -v "$CACHE_DIR":/tmp/trivy-cache \
  aquasec/trivy:latest fs /src \
  --scanners vuln \
  --severity HIGH,CRITICAL \
  --format json --output "/src/$REPORT_DIR/trivy-report.json"
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "Reporte: $REPORT_DIR/trivy-report.json"
else
    echo "ERROR: Trivy termino con codigo $STATUS"
fi
exit $STATUS
