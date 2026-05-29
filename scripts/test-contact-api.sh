#!/bin/bash
# Script para testear el endpoint /api/contact paso a paso

set -e

API_URL="https://ingenio.uno"

echo "=== Test del endpoint /api/contact de INGENIO/64 ==="
echo ""

# Paso 1: Obtener sesión
echo "1. Obteniendo sesión..."
SESSION_RESPONSE=$(curl -s -i "$API_URL/api/session")
echo "$SESSION_RESPONSE" | head -20

# Extraer cookie
COOKIE=$(echo "$SESSION_RESPONSE" | grep -i "set-cookie:" | grep "ingenio_session" | sed 's/set-cookie: //i' | cut -d';' -f1)
echo ""
echo "Cookie obtenida: ${COOKIE:0:50}..."

# Extraer CSRF del cuerpo JSON
CSRF=$(echo "$SESSION_RESPONSE" | tail -1 | grep -o '"csrf_token":"[^"]*"' | cut -d'"' -f4)
echo "CSRF obtenido: $CSRF"
echo ""

if [ -z "$COOKIE" ] || [ -z "$CSRF" ]; then
    echo "ERROR: No se pudo obtener sesión o CSRF"
    exit 1
fi

# Paso 2: Enviar formulario de contacto
echo "2. Enviando formulario de contacto..."
CONTACT_RESPONSE=$(curl -s -i "$API_URL/api/contact" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://ingenio.uno" \
  -H "Cookie: $COOKIE" \
  -H "X-Ingenio-CSRF: $CSRF" \
  -d '{
    "nombre": "Test Usuario",
    "email": "test@example.com",
    "empresa": "Test Corp",
    "que": "Este es un mensaje de prueba desde el script de testing",
    "presupuesto": "5000-10000"
  }')

echo "$CONTACT_RESPONSE"
echo ""

# Analizar respuesta
HTTP_CODE=$(echo "$CONTACT_RESPONSE" | head -1 | cut -d' ' -f2)
BODY=$(echo "$CONTACT_RESPONSE" | tail -1)

echo "HTTP Code: $HTTP_CODE"
echo "Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS: Email enviado correctamente"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ ERROR 500: Fallo interno del servidor"
    echo "Revisa los logs del backend en Dokploy"
elif [ "$HTTP_CODE" = "503" ]; then
    echo "❌ ERROR 503: Servicio no disponible (Resend no configurado)"
else
    echo "❌ ERROR $HTTP_CODE: Código inesperado"
fi

echo ""
echo "=== Fin del test ==="
