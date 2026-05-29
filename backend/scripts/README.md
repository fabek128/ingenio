# Scripts de análisis y debugging

## Scripts disponibles

### 1. `analyze_chat_errors.py` - Análisis general de logs

Analiza el log de chat completo mostrando estadísticas de todos los eventos.

**Uso:**
```bash
python scripts/analyze_chat_errors.py
# o especificar un log:
python scripts/analyze_chat_errors.py logs/chat/chat-20250115T103045Z-abc123.txt
```

**Muestra:**
- Resumen de eventos con porcentajes
- Últimos 10 errores del modelo
- Últimas 5 respuestas vacías
- Distribución de bloqueos por razón
- Estadísticas de éxito (duración, tokens)

### 2. `debug_empty_responses.py` - Debug de respuestas vacías

Analiza específicamente eventos de `model_empty_response` para diagnosticar por qué el modelo no devuelve texto.

**Uso:**
```bash
python scripts/debug_empty_responses.py
```

**Muestra:**
- Lista de todos los eventos de respuesta vacía
- Uso de tokens en cada evento
- Preview de la respuesta raw (si está disponible)
- Recomendaciones específicas para resolver el problema

**Casos comunes:**

1. **El modelo genera tokens pero no hay texto extraíble**
   - Indica problema en la función de extracción
   - Solución: Reiniciar backend para aplicar mejoras

2. **El modelo no genera tokens (completion_tokens = 0)**
   - Indica problema con el prompt o límites
   - Solución: Revisar configuración y contexto

## Aplicar cambios de logging mejorado

Si los logs no muestran los detalles completos del error, seguir estos pasos:

### Paso 1: Verificar que los cambios están en el código

```bash
cd backend
grep -A 3 "raw_data_preview = json.dumps" app/main.py
```

Debería mostrar:
```python
raw_data_preview = json.dumps(data, ensure_ascii=False)[:300]
error_detail = f"model_empty_response: no text extracted. Raw preview: {raw_data_preview}"
```

Si no aparece, hacer pull del código actualizado.

### Paso 2: Reiniciar el backend

**En desarrollo (local):**
```bash
# Detener el proceso actual (Ctrl+C)
# Iniciar de nuevo:
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

**En producción (systemd):**
```bash
sudo systemctl restart ingenio-api
sudo systemctl status ingenio-api
```

**Verificar que reinició correctamente:**
```bash
# Ver logs en tiempo real
sudo journalctl -u ingenio-api -f
```

### Paso 3: Reproducir el problema

```bash
# Hacer una consulta que cause el error
curl -X POST https://ingenio.uno/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: ingenio_session=..." \
  -H "X-Ingenio-CSRF: ..." \
  -d '{"message": "QUE MAS ME PODES DECIR DE OTTO"}'
```

### Paso 4: Verificar los logs mejorados

```bash
# Ver el último log
curl -H "X-Ingenio-Log-Token: $INGENIO_CHAT_LOG_VIEW_TOKEN" \
  https://ingenio.uno/api/admin/chat-logs/latest | tail -1 | jq
```

Debería aparecer algo como:
```json
{
  "error": "model_empty_response: no text extracted. Raw preview: {\"choices\":[{\"message\":{...}}]}",
  ...
}
```

### Paso 5: Ver el WARNING completo en los logs de uvicorn

```bash
# En producción
sudo journalctl -u ingenio-api --since "10 minutes ago" | grep model_empty_response

# En desarrollo
# Buscar en la salida de uvicorn la línea que contiene:
# "model_empty_response: extraction failed but model returned data"
```

Este log incluye los primeros 1000 caracteres de la respuesta raw del modelo.

## Troubleshooting

### Los logs siguen sin mostrar el detalle

1. Verificar que el código tiene los cambios:
   ```bash
   git status
   git log --oneline -5
   ```

2. Verificar que el backend reinició con el código nuevo:
   ```bash
   # Ver la hora del último inicio
   sudo systemctl status ingenio-api | grep Active
   ```

3. Verificar que no hay múltiples procesos corriendo:
   ```bash
   ps aux | grep uvicorn
   ```

### El error persiste después de reiniciar

1. Ejecutar el script de debugging:
   ```bash
   python scripts/debug_empty_responses.py
   ```

2. Revisar el WARNING completo en los logs de uvicorn

3. Verificar la estructura de respuesta del modelo:
   - El campo `completion_tokens` > 0 indica que el modelo SÍ generó contenido
   - Si es así, el problema está en la extracción, no en el modelo

4. Posibles causas:
   - El modelo está usando un formato de respuesta no estándar
   - El modelo está generando tool calls en lugar de texto
   - El contenido está truncado por límites de tokens

5. Solución temporal:
   - Reducir el tamaño del contexto (menos archivos en `knowledge/public/`)
   - Aumentar `INGENIO_LLM_MAX_TOKENS` (actualmente 2048)
   - Probar con un prompt más corto

## Monitoreo continuo

Para monitorear errores en tiempo real:

```bash
# Ver eventos de error según ocurren
tail -f logs/chat/chat-active.txt | grep model_empty_response | jq .

# Ver resumen cada 5 minutos
watch -n 300 'python scripts/analyze_chat_errors.py'
```

## Referencia rápida de jq

```bash
# Ver solo errores del modelo
cat logs/chat/chat-active.txt | jq 'select(.event == "model_error")'

# Contar eventos por tipo
cat logs/chat/chat-active.txt | jq -r '.event' | sort | uniq -c

# Ver respuestas vacías con tokens generados
cat logs/chat/chat-active.txt | \
  jq 'select(.event == "model_empty_response" and .usage.completion_tokens > 0)'

# Ver prompts que causan problemas
cat logs/chat/chat-active.txt | \
  jq 'select(.event == "model_empty_response") | .message' | \
  sort | uniq -c | sort -rn
```
