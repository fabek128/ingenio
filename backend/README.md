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
| POST   | /api/contact       | Enviar formulario contacto |

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
- Si se actualiza la seccion publica `front/secciones/agentes/agentes.md`, revisar si corresponde sincronizar `backend/knowledge/public/agentes.md` para el agente del backend.
- `backend/knowledge/private/`, `backend/knowledge/cache/` y `backend/knowledge/generated/` estan ignorados por Git.
- Si se agregan imagenes como conocimiento, usar captions/descripciones curadas en Markdown.

En Docker, `backend/Dockerfile` copia `knowledge/` dentro de la imagen para que el contexto exista en produccion.


## Logs de chat

El backend emite cada interaccion de `/api/chat` como JSON a stdout para ingestion via Promtail/Loki.

Configuracion:

```env
INGENIO_CHAT_LOG_ENABLED=true
INGENIO_CHAT_LOG_INCLUDE_TEXT=true
```

Seguridad:

- No se guardan cookies, CSRF, headers ni API keys.
- Los prompts y respuestas se escriben con redaccion automatica de patrones sensibles antes de emitirlos.
- Si `INGENIO_CHAT_LOG_INCLUDE_TEXT=false`, se emiten solo metadatos, longitudes, estado y razon sin textos.

## Formulario de contacto

El endpoint `POST /api/contact` permite enviar consultas desde el frontend con envío de email via Resend.

Configuracion requerida:

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=contacto@tudominio.com
CONTACT_RECIPIENT_EMAIL=tu-email@dominio.com
```

- `RESEND_API_KEY`: obtener en [resend.com/api-keys](https://resend.com/api-keys)
- `RESEND_FROM_EMAIL`: debe ser un dominio verificado en Resend
- `CONTACT_RECIPIENT_EMAIL`: email donde llegarán las consultas

El endpoint aplica rate limiting (usa el mismo sistema que `/api/chat`) y validacion de email. Si falta la configuracion, devuelve `503 service_unavailable`.

## Nota sobre respuestas vacias del modelo

DeepSeek V4 puede consumir tokens en razonamiento interno y devolver `content` vacio si `max_tokens` queda corto.
Por eso el backend usa `INGENIO_LLM_MAX_TOKENS=2048` por defecto y si el proveedor responde sin texto visible devuelve `502 model_empty_response` en vez de ocultarlo con una respuesta falsa.
