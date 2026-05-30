#!/usr/bin/env bash
# Script para conectar INGENIO al stack de observabilidad y configurar Prometheus

set -euo pipefail

OBSERVABILITY_NETWORK="down-master-observability"
PROMETHEUS_CONTAINER="metricas-grafana-qxiznw-prometheus-1"

echo "=== Configurando INGENIO para Prometheus ==="
echo

# 1. Buscar contenedor de ingenio-api
echo "[1/4] Buscando contenedor de ingenio-api..."
INGENIO_CONTAINER=$(sudo docker ps --filter "name=ingenio" --filter "name=api" --format "{{.Names}}" | head -1)

if [ -z "$INGENIO_CONTAINER" ]; then
    echo "❌ Error: No se encontró contenedor de ingenio-api corriendo"
    echo "Busca manualmente con: sudo docker ps | grep ingenio"
    exit 1
fi

echo "✓ Contenedor encontrado: $INGENIO_CONTAINER"
echo

# 2. Verificar si está en la red down-master-observability
echo "[2/4] Verificando conexión a red $OBSERVABILITY_NETWORK..."
IS_CONNECTED=$(sudo docker inspect "$INGENIO_CONTAINER" | grep -c "$OBSERVABILITY_NETWORK" || true)

if [ "$IS_CONNECTED" -eq 0 ]; then
    echo "⚠️  Contenedor NO está en la red $OBSERVABILITY_NETWORK"
    echo "Conectando..."

    # Verificar que la red existe
    if ! sudo docker network inspect "$OBSERVABILITY_NETWORK" &>/dev/null; then
        echo "❌ Error: La red $OBSERVABILITY_NETWORK no existe"
        echo "El stack de observabilidad debe estar corriendo"
        exit 1
    fi

    # Conectar a la red
    sudo docker network connect "$OBSERVABILITY_NETWORK" "$INGENIO_CONTAINER"
    echo "✓ Contenedor conectado a $OBSERVABILITY_NETWORK"
else
    echo "✓ Contenedor ya está en la red $OBSERVABILITY_NETWORK"
fi
echo

# 3. Verificar que el endpoint /metrics responde
echo "[3/4] Verificando endpoint /metrics..."
if sudo docker exec "$INGENIO_CONTAINER" sh -c "command -v curl >/dev/null && curl -sf http://localhost:8080/metrics >/dev/null" 2>/dev/null; then
    echo "✓ Endpoint /metrics responde correctamente"
elif sudo docker exec "$INGENIO_CONTAINER" sh -c "command -v wget >/dev/null && wget -qO- http://localhost:8080/metrics >/dev/null" 2>/dev/null; then
    echo "✓ Endpoint /metrics responde correctamente"
else
    echo "⚠️  No se pudo verificar el endpoint (curl/wget no disponibles en el contenedor)"
    echo "Verifica manualmente: curl http://<host>:8080/metrics"
fi
echo

# 4. Reiniciar Prometheus para cargar nueva configuración
echo "[4/4] Reiniciando Prometheus..."
if sudo docker ps --format "{{.Names}}" | grep -q "$PROMETHEUS_CONTAINER"; then
    sudo docker restart "$PROMETHEUS_CONTAINER"
    echo "✓ Prometheus reiniciado"

    # Esperar a que Prometheus esté listo
    echo "Esperando a que Prometheus esté listo..."
    sleep 5

    echo
    echo "=== Configuración completada ==="
    echo
    echo "Próximos pasos:"
    echo "1. Accede a Prometheus UI: https://grafana.ingenio.uno (o el dominio configurado)"
    echo "2. Ve a Status > Targets"
    echo "3. Busca el job 'ingenio-api'"
    echo "4. Verifica que el estado sea 'UP'"
    echo
    echo "Queries de ejemplo:"
    echo "  rate(ingenio_chat_requests_total[5m])"
    echo "  histogram_quantile(0.95, rate(ingenio_chat_duration_seconds_bucket[5m]))"
    echo
else
    echo "⚠️  Contenedor de Prometheus no encontrado: $PROMETHEUS_CONTAINER"
    echo "Reinicia manualmente el contenedor de Prometheus para aplicar cambios"
    exit 1
fi
