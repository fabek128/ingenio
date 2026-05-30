#!/usr/bin/env bash
# Script para configurar métricas de INGENIO con Prometheus
# Ejecutar desde el servidor donde está corriendo INGENIO

set -euo pipefail

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Configurando métricas de INGENIO para Prometheus            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
OBSERVABILITY_NETWORK="down-master-observability"
PROMETHEUS_CONTAINER="metricas-grafana-qxiznw-prometheus-1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 1: Encontrar contenedor de ingenio-api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INGENIO_CONTAINER=$(sudo docker ps --filter "name=ingenio" --filter "name=api" --format "{{.Names}}" | head -1)

if [ -z "$INGENIO_CONTAINER" ]; then
    echo -e "${RED}✗ Error: No se encontró contenedor de ingenio-api corriendo${NC}"
    echo
    echo "Contenedores disponibles:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo -e "${GREEN}✓ Contenedor encontrado: $INGENIO_CONTAINER${NC}"
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 2: Verificar endpoint /metrics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Intentar con curl
if sudo docker exec "$INGENIO_CONTAINER" sh -c "command -v curl >/dev/null 2>&1"; then
    echo "Probando endpoint con curl..."
    if sudo docker exec "$INGENIO_CONTAINER" curl -sf http://localhost:8080/metrics >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Endpoint /metrics responde correctamente${NC}"
        echo
        echo "Primeras líneas del endpoint:"
        sudo docker exec "$INGENIO_CONTAINER" curl -s http://localhost:8080/metrics | head -15
    else
        echo -e "${RED}✗ Endpoint /metrics no responde${NC}"
        echo
        echo "Verifica los logs del backend:"
        echo "  sudo docker logs $INGENIO_CONTAINER --tail 50"
        exit 1
    fi
elif sudo docker exec "$INGENIO_CONTAINER" sh -c "command -v wget >/dev/null 2>&1"; then
    echo "Probando endpoint con wget..."
    if sudo docker exec "$INGENIO_CONTAINER" wget -qO- http://localhost:8080/metrics >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Endpoint /metrics responde correctamente${NC}"
        echo
        echo "Primeras líneas del endpoint:"
        sudo docker exec "$INGENIO_CONTAINER" wget -qO- http://localhost:8080/metrics | head -15
    else
        echo -e "${RED}✗ Endpoint /metrics no responde${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ No se puede verificar desde dentro del contenedor (curl/wget no disponibles)${NC}"
    echo "Verifica manualmente: curl http://<host>:8080/metrics"
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 3: Conectar a la red $OBSERVABILITY_NETWORK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que la red existe
if ! sudo docker network inspect "$OBSERVABILITY_NETWORK" &>/dev/null; then
    echo -e "${RED}✗ Error: La red $OBSERVABILITY_NETWORK no existe${NC}"
    echo "El stack de observabilidad debe estar corriendo"
    echo
    echo "Redes disponibles:"
    sudo docker network ls | grep -v "bridge\|host\|none"
    exit 1
fi

# Verificar si ya está conectado
IS_CONNECTED=$(sudo docker inspect "$INGENIO_CONTAINER" | grep -c "$OBSERVABILITY_NETWORK" || true)

if [ "$IS_CONNECTED" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Contenedor NO está en la red $OBSERVABILITY_NETWORK${NC}"
    echo "Conectando..."
    sudo docker network connect "$OBSERVABILITY_NETWORK" "$INGENIO_CONTAINER"
    echo -e "${GREEN}✓ Contenedor conectado a $OBSERVABILITY_NETWORK${NC}"
else
    echo -e "${GREEN}✓ Contenedor ya está en la red $OBSERVABILITY_NETWORK${NC}"
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 4: Verificar conectividad con Prometheus"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if sudo docker exec "$INGENIO_CONTAINER" getent hosts prometheus >/dev/null 2>&1; then
    PROMETHEUS_IP=$(sudo docker exec "$INGENIO_CONTAINER" getent hosts prometheus | awk '{print $1}')
    echo -e "${GREEN}✓ Prometheus es accesible desde el contenedor${NC}"
    echo "  IP: $PROMETHEUS_IP"
else
    echo -e "${YELLOW}⚠ No se puede resolver 'prometheus' desde el contenedor${NC}"
    echo "Esto puede ser normal si Prometheus usa otro nombre de host"
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 5: Reiniciar Prometheus"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Encontrar Prometheus
PROM_FOUND=$(sudo docker ps --filter "name=prometheus" --format "{{.Names}}" | head -1 || true)

if [ -n "$PROM_FOUND" ]; then
    echo "Contenedor de Prometheus encontrado: $PROM_FOUND"
    echo "Reiniciando..."
    sudo docker restart "$PROM_FOUND" >/dev/null
    echo -e "${GREEN}✓ Prometheus reiniciado${NC}"

    echo "Esperando a que Prometheus esté listo..."
    sleep 8
else
    echo -e "${YELLOW}⚠ No se encontró contenedor de Prometheus${NC}"
    echo "Busca manualmente: sudo docker ps | grep prometheus"
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 6: Verificación final"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Verificando métricas disponibles..."
if sudo docker exec "$INGENIO_CONTAINER" sh -c "command -v curl >/dev/null 2>&1"; then
    METRICS_COUNT=$(sudo docker exec "$INGENIO_CONTAINER" curl -s http://localhost:8080/metrics | grep -c "^ingenio_" || true)
    echo -e "${GREEN}✓ Métricas INGENIO encontradas: $METRICS_COUNT${NC}"
elif sudo docker exec "$INGENIO_CONTAINER" sh -c "command -v wget >/dev/null 2>&1"; then
    METRICS_COUNT=$(sudo docker exec "$INGENIO_CONTAINER" wget -qO- http://localhost:8080/metrics | grep -c "^ingenio_" || true)
    echo -e "${GREEN}✓ Métricas INGENIO encontradas: $METRICS_COUNT${NC}"
fi
echo

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Configuración completada                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo
echo -e "${GREEN}Próximos pasos:${NC}"
echo
echo "1. Accede a Prometheus UI:"
echo "   → Status > Targets"
echo "   → Busca el job 'ingenio-api'"
echo "   → Verifica que el estado sea UP (verde)"
echo
echo "2. Prueba queries de ejemplo:"
echo "   → ingenio_chat_requests_total"
echo "   → rate(ingenio_chat_requests_total[5m])"
echo "   → histogram_quantile(0.95, rate(ingenio_chat_duration_seconds_bucket[5m]))"
echo
echo "3. Crea un dashboard en Grafana con las queries de:"
echo "   → docs/metricas-prometheus.md"
echo
echo -e "${YELLOW}Nota:${NC} Si el target aparece DOWN en Prometheus:"
echo "  - Espera 1-2 minutos (scrape interval)"
echo "  - Verifica los logs de Prometheus: sudo docker logs $PROM_FOUND --tail 50"
echo
