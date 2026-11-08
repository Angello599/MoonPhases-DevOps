#!/bin/bash
# Funciones comunes de los scripts DAST (ZAP). Se carga con `source`, no se ejecuta.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="reports/dast"
ZAP_IMAGE="${ZAP_IMAGE:-zaproxy/zap-stable}"

require_docker() {
    if ! command -v docker &> /dev/null; then
        echo "ERROR: Docker no esta instalado o no esta disponible."
        exit 1
    fi
}

# Devuelve el nombre de la red de Docker a la que esta conectado el frontend.
# Se obtiene del contenedor en ejecucion para no depender del nombre del proyecto Compose.
resolve_network() {
    local cid
    cid="$(cd "$ROOT" && docker compose ps -q frontend 2>/dev/null)"
    [ -z "$cid" ] && return 1
    docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$cid" | awk '{print $1}'
}

require_stack() {
    NETWORK="$(resolve_network)"
    if [ -z "${NETWORK:-}" ]; then
        echo "ERROR: el stack no esta levantado (no hay contenedor 'frontend')."
        echo "       Levantalo primero con: ./scripts/run-local.sh"
        exit 1
    fi
}
