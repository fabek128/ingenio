# Protección contra Flood y Ataques de Fuerza Bruta

Este documento describe el sistema de rate limiting avanzado implementado en INGENIO/64 para proteger contra ataques de flood, fuerza bruta y uso abusivo del agente.

## Características principales

### 1. Rate Limiting Multi-Ventana

El sistema implementa límites en múltiples ventanas de tiempo:

- **Por minuto**: 12 requests (configurable via `INGENIO_RATE_LIMIT_PER_MINUTE`)
- **Por hora**: 100 requests (configurable via `INGENIO_RATE_LIMIT_PER_HOUR`)
- **Por día**: 500 requests (configurable via `INGENIO_RATE_LIMIT_PER_DAY`)

Los límites se aplican **tanto por sesión como por IP**, protegiendo contra:
- Un usuario con múltiples sesiones
- Múltiples usuarios desde la misma IP (NAT corporativa)

### 2. Detección de Patrones Sospechosos

El sistema detecta automáticamente:

**Patrón de flood**:
- Si hay más de 30 requests en 1 minuto (umbral configurable)
- Se marca como "suspicious" y se penaliza

**Ataque de fuerza bruta**:
- Si hay 10+ intentos bloqueados en 5 minutos
- Se aplica blacklist temporal automática

### 3. Penalización Progresiva (Backoff Exponencial)

Cuando un usuario viola los límites repetidamente:

1. **Primera violación**: Mensaje de advertencia, sigue funcionando
2. **2-4 violaciones**: Rate limit 429, debe esperar
3. **5+ violaciones en 1 hora**: Blacklist temporal de 1-60 minutos
4. **Continúa violando**: Backoff exponencial hasta 1 hora máximo

Fórmula:
```
tiempo_bloqueo = min(60 * 2^(violaciones - 5), 3600) segundos
```

Ejemplo:
- 5 violaciones: 60 segundos
- 6 violaciones: 120 segundos (2 minutos)
- 7 violaciones: 240 segundos (4 minutos)
- 8 violaciones: 480 segundos (8 minutos)
- 10+ violaciones: 3600 segundos (1 hora, máximo)

### 4. Blacklist Temporal Automática

Si el sistema detecta:
- 5+ violaciones de rate limit en una hora
- 10+ intentos bloqueados en 5 minutos (ataque activo)

Aplica blacklist temporal que:
- Bloquea **todos** los requests de esa sesión/IP
- Duración aumenta exponencialmente con cada violación
- Se limpia automáticamente al expirar
- Se loggea en los logs de la aplicación

### 5. Logging Completo de Intentos Maliciosos

Todos los eventos de seguridad se registran:

```python
logger.warning(
    "event=rate_limit_blacklist key_hash=%s remaining_seconds=%d",
    hash_key, remaining
)
logger.warning(
    "event=rate_limit_attack_detected key_hash=%s blocked_attempts=%d",
    hash_key, count
)
logger.info(
    "event=rate_limit_exceeded key_hash=%s type=%s requests=%d limit=%d",
    hash_key, limit_type, requests, limit
)
```

**Nota**: Las keys (IPs, session IDs) se hashean antes de loggear para privacidad.

## Configuración

### Variables de entorno

```bash
# Límites por ventana de tiempo
INGENIO_RATE_LIMIT_PER_MINUTE=12    # Default: 12
INGENIO_RATE_LIMIT_PER_HOUR=100     # Default: 100
INGENIO_RATE_LIMIT_PER_DAY=500      # Default: 500
```

### Configuración avanzada (código)

En `backend/app/rate_limit.py`:

```python
RateLimiter(
    per_minute=12,                  # Límite por minuto
    per_hour=100,                   # Límite por hora
    per_day=500,                    # Límite por día
    suspicious_per_minute=30,       # Umbral de patrón sospechoso
    max_violations=5,               # Violaciones antes de blacklist
    violation_window=3600,          # Ventana para contar violaciones (1h)
    backoff_base=60,                # Tiempo base de bloqueo (1 min)
    backoff_max=3600,               # Tiempo máximo de bloqueo (1h)
)
```

## Mensajes al usuario

El frontend muestra mensajes específicos según el tipo de límite:

### Rate limit normal (429)
```
DEMASIADAS CONSULTAS EN POCO TIEMPO.
ESPERA UN MINUTO Y PROBA DE NUEVO.
```

### Rate limit por hora (429)
```
ALCANZASTE EL LIMITE DE CONSULTAS POR HORA.
ESPERA UN RATO O CONTACTANOS PARA ACCESO PRIORITARIO.
```

### Rate limit por día (429)
```
ALCANZASTE EL LIMITE DIARIO DE CONSULTAS.
VOLVE MANANA O CONTACTANOS PARA ACCESO EXTENDIDO.
```

### Blacklist temporal (429)
```
DEMASIADAS CONSULTAS. ACCESO TEMPORALMENTE BLOQUEADO POR X MINUTOS.
SI NECESITAS AYUDA URGENTE, CONTACTANOS.
```

### Patrón sospechoso (429)
```
PATRON DE USO SOSPECHOSO DETECTADO.
SI NO SOS UN BOT, ESPERA UN MINUTO Y PROBA DE NUEVO.
```

## Endpoint de estadísticas

Los usuarios pueden consultar sus propias estadísticas:

```bash
GET /api/rate-limit-stats
```

**Requiere**: Sesión válida

**Respuesta**:
```json
{
  "session": {
    "requests_last_minute": 3,
    "requests_last_hour": 15,
    "requests_last_day": 45,
    "violations_last_hour": 0,
    "blacklisted": false,
    "blacklisted_seconds_remaining": null,
    "limits": {
      "per_minute": 12,
      "per_hour": 100,
      "per_day": 500
    }
  },
  "ip": {
    "requests_last_minute": 3,
    "requests_last_hour": 15,
    "requests_last_day": 45,
    "violations_last_hour": 0,
    "blacklisted": false,
    "blacklisted_seconds_remaining": null,
    "limits": {
      "per_minute": 12,
      "per_hour": 100,
      "per_day": 500
    }
  }
}
```

Útil para:
- Debugging de problemas de rate limiting
- Transparency con el usuario
- Monitoreo proactivo

## Monitoreo en producción

### Ver eventos de rate limiting

```bash
# Ver rate limits en tiempo real
sudo journalctl -u ingenio-api -f | grep rate_limit

# Contar por tipo de evento
sudo journalctl -u ingenio-api --since "1 hour ago" | grep rate_limit | awk '{print $5}' | sort | uniq -c

# Ver ataques detectados
sudo journalctl -u ingenio-api --since "1 day ago" | grep "rate_limit_attack_detected"

# Ver blacklist aplicadas
sudo journalctl -u ingenio-api --since "1 day ago" | grep "rate_limit_blacklist_applied"
```

### Alertas recomendadas

1. **Ataque activo**: Más de 5 `rate_limit_attack_detected` en 10 minutos
2. **Blacklist frecuente**: Más de 10 `rate_limit_blacklist_applied` en 1 hora
3. **Patrones sospechosos**: Más de 20 `rate_limit_suspicious_pattern` en 1 hora

## Casos de uso protegidos

### 1. Scraping automatizado
**Ataque**: Bot hace 100 requests en 1 minuto

**Protección**:
- Después de 12 requests en 1 minuto: bloqueado por límite/minuto
- Después de 30 requests: marcado como sospechoso
- Después de seguir intentando: blacklist temporal de 1-60 minutos

### 2. Credential stuffing
**Ataque**: Atacante prueba múltiples sesiones para encontrar una válida

**Protección**:
- Rate limit por IP detecta múltiples sesiones
- 10+ intentos bloqueados en 5 minutos: blacklist automática
- Backoff exponencial hace impráctica la fuerza bruta

### 3. DoS distribuido (DDoS)
**Ataque**: Múltiples IPs hacen muchos requests

**Protección**:
- Cada IP tiene su propio rate limit independiente
- Límites por hora/día protegen contra ataques sostenidos
- Blacklist temporal automática para IPs maliciosas

### 4. Uso abusivo legítimo
**Caso**: Usuario legítimo hace demasiadas preguntas rápido

**Protección**:
- Rate limit suave por minuto (12 requests)
- Mensaje claro explicando el límite
- Límites por hora/día permiten uso sostenido
- Estadísticas disponibles para que el usuario entienda su uso

## Diferencias con rate limiting básico

### Sistema anterior (simple)
```python
# Solo una ventana (1 minuto)
# Solo contador simple
# Sin penalización progresiva
# Sin detección de ataques
if len(hits) >= 12:
    raise 429
```

### Sistema nuevo (avanzado)
```python
# Múltiples ventanas (minuto, hora, día)
# Detección de patrones sospechosos
# Penalización progresiva (backoff exponencial)
# Blacklist temporal automática
# Detección de ataques activos
# Logging completo
# Estadísticas para el usuario
```

## Limitaciones y consideraciones

### 1. Estado en memoria
El sistema mantiene estado en memoria (no persistente). Esto significa:
- ✅ Muy rápido (no hay DB queries)
- ✅ Simple de implementar y mantener
- ⚠️ Se resetea al reiniciar el backend
- ⚠️ No funciona con múltiples instancias (sin sticky sessions)

**Solución para múltiples instancias**: Usar Redis compartido o sticky sessions en el load balancer.

### 2. Identificación por IP
En entornos con NAT o proxies corporativos:
- Múltiples usuarios legítimos comparten la misma IP
- Pueden alcanzar el límite más rápido

**Mitigación**: Los límites son generosos (100/hora, 500/día) y se aplican también por sesión.

### 3. Evasión mediante rotación de IP
Un atacante con muchas IPs puede rotar:
- VPNs, proxies, botnets

**Mitigación**:
- Límites por sesión (independiente de IP)
- Validación de Origin/Referer
- CSRF tokens
- Monitoreo manual de patrones

### 4. Falsos positivos
Un usuario legítimo muy activo puede ser bloqueado.

**Mitigación**:
- Límites generosos por defecto
- Mensajes claros al usuario
- Endpoint de estadísticas para transparency
- Blacklist temporal (no permanente)
- Posibilidad de contactar soporte

## Testing

Para probar el sistema de rate limiting:

```bash
# Test básico: exceder límite por minuto
for i in {1..15}; do
  curl -X POST https://ingenio.uno/api/chat \
    -H "Cookie: ingenio_session=..." \
    -H "X-Ingenio-CSRF: ..." \
    -H "Content-Type: application/json" \
    -d '{"message": "test"}' &
done
wait

# Ver estadísticas
curl https://ingenio.uno/api/rate-limit-stats \
  -H "Cookie: ingenio_session=..." | jq

# Test de blacklist: hacer muchos requests bloqueados
for i in {1..20}; do
  curl -X POST https://ingenio.uno/api/chat \
    -H "Cookie: ingenio_session=..." \
    -H "X-Ingenio-CSRF: INVALID" \
    -d '{"message": "test"}'
done
```

## Mejoras futuras

1. **Persistencia en Redis**: Para soporte multi-instancia
2. **Whitelist de IPs confiables**: Para socios o clientes premium
3. **Captcha después de X intentos**: Añadir capa adicional
4. **Análisis de comportamiento**: Machine learning para detectar bots
5. **API rate limit tiers**: Diferentes límites según tipo de usuario
6. **Geoblocking**: Bloquear países de alto riesgo
7. **Challenge tokens**: Proof of work para requests sospechosos

## Referencias

- Implementación: `backend/app/rate_limit.py`
- Integración: `backend/app/main.py`
- Frontend: `front/app.jsx` función `agentErrorMessage()`
- Tests: `backend/tests/test_rate_limiting.py` (pendiente)
