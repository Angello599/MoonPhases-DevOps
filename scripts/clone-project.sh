#!/bin/bash

REPO_URL="https://github.com/Angello599/MoonPhases-DevOps.git"
PROJECT_DIR="MoonPhases-DevOps"

echo "======================================"
echo "   CLONANDO PROYECTO MOONPHASES"
echo "======================================"

if [ -d "$PROJECT_DIR" ]; then
    echo "El directorio $PROJECT_DIR ya existe."
    exit 1
fi

git clone "$REPO_URL" "$PROJECT_DIR"

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "   PROYECTO CLONADO CORRECTAMENTE"
    echo "======================================"
else
    echo ""
    echo "======================================"
    echo "   ERROR AL CLONAR EL PROYECTO"
    echo "======================================"
    exit 1
fi
