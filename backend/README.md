# INGENIO/64 — Backend

Backend FastAPI que conecta el frontend con el modelo DeepSeek V4 Flash Free via OpenCode Zen API (cloud).

## Desarrollo local (sin Docker)

```bash
# 1. Configurar .env (desde la raiz del repo)
cp .env.example .env
# Editar .env y completar INGENIO_LLM_API_KEY e INGENIO_SESSION_SECRET

# 2. Crear venv e instalar
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Servir frontend (otra terminal)
cd front
python3 -m http.server 8000

# 4. Levantar backend
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

## Desarrollo local (Docker Compose)

```bash
docker compose up -d --build
```

Levanta backend + frontend:

```text
http://localhost:8000  # frontend + proxy /api
http://localhost:8080  # backend directo para debug
```

**Nota**: el modelo se ejecuta en la nube via OpenCode Zen. No requiere Ollama local.

## Produccion (systemd)

Ver `docs/backend-specification.md` y `docs/backend-tutorial.md`.

## Endpoints

| Metodo | Ruta               | Descripcion                |
|--------|--------------------|----------------------------|
| GET    | /health            | Health check               |
| GET    | /api/session       | Iniciar sesion (cookie)    |
| GET    | /api/site-context  | Metadata publica           |
| POST   | /api/chat          | Enviar mensaje al modelo   |

## Tests

```bash
cd backend
PYTHONPATH="$PWD" pytest
```

## Base de conocimiento publica

El modelo recibe contexto solo desde una allowlist versionada:

```text
backend/knowledge/public/
backend/knowledge/policies/
```

Reglas:

- `backend/knowledge/public/` contiene Markdown curado y publicable.
- `backend/knowledge/policies/` contiene alcance permitido y rechazos.
- No se carga todo el repo, `docs/`, `front/`, `.env` ni `logs/` como contexto del modelo.
- `backend/knowledge/private/`, `backend/knowledge/cache/` y `backend/knowledge/generated/` estan ignorados por Git.
- Si se agregan imagenes como conocimiento, usar captions/descripciones curadas en Markdown.

En Docker, `backend/Dockerfile` copia `knowledge/` dentro de la imagen para que el contexto exista en produccion.


## Logs de chat

El backend registra cada interaccion de `/api/chat` en formato JSONL dentro de archivos `.txt`:

```text
logs/chat/chat-active.txt
```

Cuando el archivo activo supera `INGENIO_CHAT_LOG_MAX_BYTES` (`1048576`, 1 MiB por defecto), se comprime como `.tar.gz` y se inicia un nuevo `chat-active.txt`.

Configuracion:

```env
INGENIO_CHAT_LOG_ENABLED=true
INGENIO_CHAT_LOG_DIR=logs/chat
INGENIO_CHAT_LOG_MAX_BYTES=1048576
INGENIO_CHAT_LOG_INCLUDE_TEXT=true
INGENIO_CHAT_LOG_VIEW_TOKEN=
```

Seguridad:

- Los logs estan ignorados por Git mediante `logs/`.
- No se guardan cookies, CSRF, headers ni API keys.
- Los prompts y respuestas se escriben con redaccion automatica de patrones sensibles.
- Si `INGENIO_CHAT_LOG_INCLUDE_TEXT=false`, se guardan solo metadatos, longitudes, estado y razon.
- El endpoint `GET /api/admin/chat-logs/latest` queda deshabilitado si `INGENIO_CHAT_LOG_VIEW_TOKEN` esta vacio.
- Para consultar el ultimo `.txt` no comprimido, enviar `X-Ingenio-Log-Token` con un token de al menos 32 caracteres.
- Antes de devolver el archivo, el endpoint vuelve a aplicar redaccion de secretos como defensa adicional.

Ejemplo local:

```bash
curl -H "X-Ingenio-Log-Token: $INGENIO_CHAT_LOG_VIEW_TOKEN" \
  http://127.0.0.1:8080/api/admin/chat-logs/latest
```

## Nota sobre respuestas vacias del modelo

DeepSeek V4 puede consumir tokens en razonamiento interno y devolver `content` vacio si `max_tokens` queda corto.
Por eso el backend usa `INGENIO_LLM_MAX_TOKENS=2048` por defecto y si el proveedor responde sin texto visible devuelve `502 model_empty_response` en vez de ocultarlo con una respuesta falsa.
