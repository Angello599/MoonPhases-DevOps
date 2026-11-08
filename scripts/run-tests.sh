#!/bin/bash

echo "======================================"
echo "   EJECUTANDO TESTS DE MOONPHASES"
echo "======================================"

npm test

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "   TODOS LOS TESTS PASARON"
    echo "======================================"
else
    echo ""
    echo "======================================"
    echo "   ALGUN TEST FALLO"
    echo "======================================"
    exit 1
fi
