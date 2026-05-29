#!/bin/bash
# Script para verificar configuración de Resend en producción

set -e

echo "=== Verificando configuración de Resend en contenedores ==="
echo ""

# Detectar servidor (localserver o VPS)
if ping -c 1 -W 1 10.125.115.1 &>/dev/null; then
    SERVER="fabian@10.125.115.1"
    echo "Conectando a localserver (10.125.115.1)..."
elif ping -c 1 -W 1 10.125.115.57 &>/dev/null; then
    SERVER="root@10.125.115.57"
    echo "Conectando a VPS (10.125.115.57)..."
else
    echo "ERROR: No se puede conectar a ningún servidor"
    exit 1
fi

echo ""
echo "1. Buscando contenedores de ingenio..."
ssh "$SERVER" "docker ps --filter name=ingenio --format 'table {{.Names}}\t{{.Status}}'"

echo ""
echo "2. Verificando variables de entorno en backend..."
BACKEND_CONTAINER=$(ssh "$SERVER" "docker ps --filter name=ingenio.*api --format '{{.Names}}' | head -1")

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "ERROR: No se encontró contenedor del backend"
    exit 1
fi

echo "Contenedor backend: $BACKEND_CONTAINER"
echo ""

ssh "$SERVER" "docker exec $BACKEND_CONTAINER env | grep -E '^(RESEND|CONTACT)' || echo 'No se encontraron variables RESEND o CONTACT'"

echo ""
echo "3. Últimos logs del backend (últimas 30 líneas)..."
ssh "$SERVER" "docker logs --tail 30 $BACKEND_CONTAINER 2>&1 | grep -i 'resend\|contact\|email' || echo 'No hay logs relacionados con email'"

echo ""
echo "=== Verificación completa ==="
