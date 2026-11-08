#!/bin/bash
# Genera la lista completa de reglas de ZAP baseline (todas en WARN) para decidir el gate.
# Reporte: reports/dast/gen.conf
# Requiere el stack levantado (./scripts/run-local.sh).
#
# Uso: ./scripts/security/run-zap-gen-rules.sh [url-objetivo]

set -u
source "$(dirname "${BASH_SOURCE[0]}")/_zap-common.sh"

TARGET="${1:-http://frontend:8080/MoonPhases/}"

require_docker
require_stack
mkdir -p "$ROOT/$REPORT_DIR"

echo "======================================"
echo "   ZAP - generar lista de reglas"
echo "======================================"
echo "Red:      $NETWORK"
echo "Objetivo: $TARGET"

# --security-opt label=disable: necesario con SELinux en Enforcing para los bind mounts.
docker run --rm \
  --network "$NETWORK" \
  --security-opt label=disable \
  -v "$ROOT/$REPORT_DIR":/zap/wrk/:rw \
  -t "$ZAP_IMAGE" zap-baseline.py \
  -t "$TARGET" \
  -g gen.conf -s
STATUS=$?

# Para -g, ZAP termina con 0/1/2 segun las alertas; solo 3 o mas es un error de ejecucion.
if [ ! -s "$ROOT/$REPORT_DIR/gen.conf" ]; then
    echo "ERROR: ZAP no genero gen.conf (codigo $STATUS)"
    exit 1
fi

echo "Reglas generadas: $(grep -c . "$ROOT/$REPORT_DIR/gen.conf")"
echo "Reporte: $REPORT_DIR/gen.conf"
