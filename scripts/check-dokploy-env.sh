#!/bin/bash
# Script para verificar variables de entorno configuradas en Dokploy via API

set -e

# Cargar variables del .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

if [ -z "$DOKPLOY_API_TOKEN" ]; then
    echo "ERROR: DOKPLOY_API_TOKEN no está configurado en .env"
    exit 1
fi

DOKPLOY_URL="https://dokploy.ingenio.uno"

echo "=== Verificando variables en Dokploy ==="
echo ""
echo "Nota: Este script requiere conocer el ID del servicio."
echo "Puedes obtenerlo desde el panel de Dokploy."
echo ""

read -p "Ingresa el Application ID de ingenio (ejemplo: abc123): " APP_ID

if [ -z "$APP_ID" ]; then
    echo "ERROR: No se proporcionó Application ID"
    exit 1
fi

echo ""
echo "Consultando variables de entorno para aplicación: $APP_ID"
echo ""

curl -s -X GET \
  "$DOKPLOY_URL/api/application.one?applicationId=$APP_ID" \
  -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
  -H "Content-Type: application/json" | jq -r '
    if .env then
      .env | split("\n") | .[] | select(. != "" and (contains("RESEND") or contains("CONTACT")))
    else
      "No se encontraron variables o la consulta falló"
    end
  ' 2>/dev/null || echo "ERROR: No se pudo consultar la API de Dokploy"

echo ""
echo "=== Fin de verificación ==="
