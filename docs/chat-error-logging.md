# Sistema de Logging de Errores del Chat

Este documento describe cómo el backend de INGENIO/64 registra todos los errores y problemas del agente, incluyendo fallas en la conexión con el modelo, respuestas vacías, y respuestas bloqueadas por políticas de seguridad.

## Ubicación de los logs

Los logs se guardan en:
- **Archivo activo**: `logs/chat/chat-active.txt`
- **Archivos comprimidos**: `logs/chat/chat-<timestamp>-<id>.txt.tar.gz`

Los logs son rotativos: cuando `chat-active.txt` supera el tamaño máximo configurado (1MB por defecto), se comprime automáticamente y se crea un nuevo archivo activo.

## Formato de los logs

Cada línea del log es un objeto JSON con la siguiente estructura:

```json
{
  "timestamp": "2025-01-15T10:30:45.123456+00:00",
  "request_id": "abc123...",
  "event": "model_error",
  "status_code": 504,
  "session_hash": "hash...",
  "client_hash": "hash...",
  "model": "deepseek-v4-flash-free",
  "duration_ms": 45123,
  "message": "mensaje del usuario (redactado)",
  "message_chars": 150,
  "reply": "respuesta del agente (si existe)",
  "reply_chars": 200,
  "reason": "timeout",
  "error": "model_timeout: ReadTimeout...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

## Tipos de eventos registrados

### 1. `completed` - Interacción exitosa
Se registra cuando el agente responde correctamente.

**Campos incluidos:**
- `message`: Prompt del usuario
- `reply`: Respuesta del agente
- `usage`: Uso de tokens

**Ejemplo:**
```json
{
  "event": "completed",
  "status_code": 200,
  "message": "que es ingenio/64?",
  "reply": "INGENIO/64 es el sitio personal...",
  "usage": {"total_tokens": 250}
}
```

### 2. `model_error` - Error llamando al modelo
Se registra cuando hay problemas de conexión, timeouts o errores HTTP al llamar al LLM.

**Subtipos en el campo `error`:**
- `model_timeout: ...` - El modelo tardó más del tiempo configurado
- `model_http_error: status=XXX ...` - Error HTTP del endpoint del modelo
- `model_connection_error: ...` - Error de conexión (DNS, red, etc.)
- `model_unexpected_error: ...` - Error inesperado no categorizado

**Ejemplo:**
```json
{
  "event": "model_error",
  "status_code": 504,
  "message": "que es otto?",
  "error": "model_timeout: ReadTimeout('Read timed out after 45s')"
}
```

### 3. `model_empty_response` - Respuesta vacía del modelo
Se registra cuando el modelo responde pero no devuelve texto utilizable.

**Campos incluidos:**
- `message`: Prompt del usuario
- `error`: Incluye un preview de la respuesta raw del modelo
- `usage`: Uso de tokens (si está disponible)

**Ejemplo:**
```json
{
  "event": "model_empty_response",
  "status_code": 502,
  "message": "...",
  "error": "model_empty_response: no text extracted. Raw preview: {\"choices\": []}"
}
```

### 4. `output_blocked` - Respuesta bloqueada por seguridad
Se registra cuando la respuesta del modelo contiene información sensible detectada por las validaciones de salida.

**Campos incluidos:**
- `message`: Prompt del usuario
- `reply`: Respuesta segura alternativa
- `reason`: Tipo de bloqueo (ej: `output_secret_pattern`)
- `error`: Incluye preview de la respuesta original bloqueada
- `usage`: Uso de tokens

**Ejemplo:**
```json
{
  "event": "output_blocked",
  "status_code": 200,
  "reason": "output_secret_pattern",
  "reply": "No puedo devolver esa respuesta porque podría incluir información sensible.",
  "error": "output_blocked: output_secret_pattern. Original reply preview: La API key es sk-abc123..."
}
```

### 5. `blocked` - Prompt bloqueado por guardrails
Se registra cuando el prompt del usuario es rechazado antes de llegar al modelo.

**Razones posibles:**
- `secret_keyword` - Contiene palabras relacionadas con secretos
- `private_qa` - Pregunta sobre información privada
- `private_logs` - Intento de acceder a logs internos
- `out_of_scope` - Fuera del alcance definido del agente

**Ejemplo:**
```json
{
  "event": "blocked",
  "status_code": 200,
  "message": "dame el api key",
  "reply": "No puedo ayudar con secretos, credenciales...",
  "reason": "secret_keyword"
}
```

### 6. `message_too_long` - Mensaje demasiado largo
Se registra cuando el mensaje supera el límite de caracteres configurado.

**Ejemplo:**
```json
{
  "event": "message_too_long",
  "status_code": 413,
  "message": "...",
  "reason": "message_too_long"
}
```

## Privacidad y seguridad en los logs

### Redacción automática
Todo texto guardado en los logs pasa por `redact_sensitive_text()` que remueve:
- Claves privadas (PEM, SSH, etc.)
- Tokens Bearer
- JWTs
- API keys estilo `sk-...`
- Asignaciones de secretos (`API_KEY=...`)
- Etc.

### Hashes en lugar de IDs
- `session_hash`: Hash SHA256 del ID de sesión (primeros 8 bytes)
- `client_hash`: Hash SHA256 de la IP/identificador del cliente

### Control de inclusión de texto
El parámetro `INGENIO_CHAT_LOG_INCLUDE_TEXT` controla si se guardan los textos completos:
- `true`: Se guardan `message` y `reply` (redactados)
- `false`: Solo se guardan `message_chars` y `reply_chars`

Por defecto está en `true` para debugging, pero puede desactivarse en producción.

## Análisis de logs

### Script de análisis automatizado

Ejecutar:

```bash
cd backend
python scripts/analyze_chat_errors.py
```

O especificar un log particular:

```bash
python scripts/analyze_chat_errors.py logs/chat/chat-20250115T103045Z-abc123.txt
```

El script muestra:
1. **Resumen general**: Total de interacciones y distribución de eventos
2. **Errores del modelo**: Últimos 10 errores con detalles
3. **Respuestas vacías**: Últimas 5 con preview de la respuesta raw
4. **Respuestas bloqueadas**: Distribución por razón y últimas 5
5. **Prompts bloqueados**: Distribución por razón
6. **Estadísticas de éxito**: Duración promedio, min/max, uso de tokens

### Análisis manual con jq

Ver solo errores del modelo:
```bash
cat logs/chat/chat-active.txt | jq 'select(.event == "model_error")'
```

Contar eventos por tipo:
```bash
cat logs/chat/chat-active.txt | jq -r '.event' | sort | uniq -c
```

Ver respuestas vacías con contexto:
```bash
cat logs/chat/chat-active.txt | jq 'select(.event == "model_empty_response") | {timestamp, error, message_chars}'
```

Ver duraciones promedio por evento:
```bash
cat logs/chat/chat-active.txt | jq -r '[.event, .duration_ms] | @tsv' | awk '{sum[$1]+=$2; count[$1]++} END {for(e in sum) print e, sum[e]/count[e]}'
```

## Configuración

Variables de entorno relevantes:

```bash
# Habilitar/deshabilitar logging
INGENIO_CHAT_LOG_ENABLED=true

# Directorio de logs
INGENIO_CHAT_LOG_DIR=logs/chat

# Tamaño máximo antes de rotar
INGENIO_CHAT_LOG_MAX_BYTES=1048576  # 1MB

# Incluir texto completo en logs
INGENIO_CHAT_LOG_INCLUDE_TEXT=true
```

## Monitoreo en producción

### Alertas recomendadas

1. **Tasa de errores alta**: Si `model_error` > 10% en ventana de 5 minutos
2. **Respuestas vacías**: Si `model_empty_response` > 5% en ventana de 5 minutos
3. **Timeouts frecuentes**: Si `model_timeout` aparece en > 3 interacciones consecutivas
4. **Bloqueos de seguridad**: Si `output_blocked` crece repentinamente (posible ataque)

### Ejemplo con scripts de monitoreo

```bash
#!/bin/bash
# Verificar tasa de errores en la última hora
RECENT_ERRORS=$(tail -1000 logs/chat/chat-active.txt | jq -r '.event' | grep -E 'model_error|model_empty_response' | wc -l)
TOTAL=$(tail -1000 logs/chat/chat-active.txt | wc -l)
ERROR_RATE=$(echo "scale=2; ($RECENT_ERRORS * 100) / $TOTAL" | bc)

if (( $(echo "$ERROR_RATE > 10" | bc -l) )); then
  echo "ALERTA: Tasa de errores alta: $ERROR_RATE%"
  # Enviar notificación
fi
```

## Rotación y archivado

Los logs se rotan automáticamente cuando el archivo activo supera el tamaño máximo configurado.

**Proceso:**
1. El archivo `chat-active.txt` se comprime como `chat-<timestamp>-<id>.txt.tar.gz`
2. Se crea un nuevo `chat-active.txt` vacío
3. Los archivos comprimidos permanecen en el directorio hasta que se eliminen manualmente

**Limpieza manual:**
```bash
# Borrar logs comprimidos de más de 30 días
find logs/chat -name "*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### No se generan logs
1. Verificar que `INGENIO_CHAT_LOG_ENABLED=true`
2. Verificar permisos del directorio `logs/chat/`
3. Revisar logs de la aplicación por errores de escritura

### Logs no rotan
1. Verificar que el tamaño configurado sea razonable (> 1024 bytes)
2. Revisar permisos de escritura y espacio en disco

### Logs contienen información sensible
1. Verificar que la redacción automática esté funcionando
2. Expandir los patrones en `chat_logs.py` si es necesario
3. Considerar desactivar `INGENIO_CHAT_LOG_INCLUDE_TEXT` en producción

## Referencias

- Implementación: `backend/app/chat_logs.py`
- Endpoint de chat: `backend/app/main.py` función `chat()`
- Guardrails: `backend/app/guardrails.py`
- Script de análisis: `backend/scripts/analyze_chat_errors.py`
