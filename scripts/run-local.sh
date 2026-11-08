#!/bin/bash

echo "======================================"
echo "   LEVANTANDO MOONPHASES EN LOCAL"
echo "======================================"

if ! command -v docker &> /dev/null
then
    echo "ERROR: Docker no está instalado o no está disponible."
    exit 1
fi

docker compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "   MOONPHASES SE EJECUTA EN LOCAL"
    echo "======================================"
    echo ""
    echo "Frontend:"
    echo "http://localhost:8080/MoonPhases/"
    echo ""
    echo "Backend:"
    echo "http://localhost:3001/api/health"
else
    echo ""
    echo "======================================"
    echo "   ERROR AL LEVANTAR EL PROYECTO"
    echo "======================================"
    exit 1
fi
