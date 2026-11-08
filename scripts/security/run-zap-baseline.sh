#!/bin/bash
# DAST con OWASP ZAP baseline (escaneo pasivo) y gate definido en zap/rules.conf.
# Reportes: reports/dast/<prefijo>.html, .json y .xml
# Requiere el stack levantado (./scripts/run-local.sh). Solo escanea el entorno local.
#
# Uso: ./scripts/security/run-zap-baseline.sh [url-objetivo] [prefijo-reporte]
#   frontend (por defecto): ./scripts/security/run-zap-baseline.sh
#   API:                    ./scripts/security/run-zap-baseline.sh http://frontend:8080/api/notes baseline-api
#
# El objetivo se indica con el nombre de servicio de Compose (frontend), porque ZAP corre
# en un contenedor dentro de la misma red.
#
# Codigo de salida (el gate):
#   0 = sin alertas FAIL ni WARN
#   1 = al menos una alerta FAIL (bloquea)
#   2 = solo alertas WARN
#   3 = error de ejecucion

set -u
source "$(dirname "${BASH_SOURCE[0]}")/_zap-common.sh"

TARGET="${1:-http://frontend:8080/MoonPhases/}"
PREFIX="${2:-baseline}"
RULES="$ROOT/zap/rules.conf"

require_docker
require_stack

if [ ! -s "$RULES" ]; then
    echo "ERROR: no existe $RULES"
    exit 3
fi

mkdir -p "$ROOT/$REPORT_DIR"
# ZAP lee el archivo de reglas desde su directorio de trabajo (/zap/wrk = reports/dast).
cp "$RULES" "$ROOT/$REPORT_DIR/rules.conf"

echo "======================================"
echo "   ZAP BASELINE (DAST pasivo)"
echo "======================================"
echo "Red:      $NETWORK"
echo "Objetivo: $TARGET"
echo "Reglas:   zap/rules.conf"

docker run --rm \
  --network "$NETWORK" \
  --security-opt label=disable \
  -v "$ROOT/$REPORT_DIR":/zap/wrk/:rw \
  -t "$ZAP_IMAGE" zap-baseline.py \
  -t "$TARGET" \
  -c rules.conf \
  -r "$PREFIX.html" -J "$PREFIX.json" -x "$PREFIX.xml"
STATUS=$?

echo "exit=$STATUS"
case $STATUS in
    0) echo "Gate: OK (sin alertas FAIL ni WARN)" ;;
    1) echo "Gate: FALLA (hay alertas FAIL)" ;;
    2) echo "Gate: OK con avisos (solo alertas WARN)" ;;
    *) echo "Gate: ERROR de ejecucion de ZAP" ;;
esac
echo "Reportes: $REPORT_DIR/$PREFIX.{html,json,xml}"
exit $STATUS
