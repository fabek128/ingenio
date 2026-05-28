# INGENIO/64 - Especificacion del backend agentico

Fecha: 2026-05-26  
Estado: especificacion tecnica — v2 (cambio a modelo cloud)

## 1. Objetivo

Definir el backend minimo para que INGENIO/64 funcione como una consola agentica personal conectada a un modelo via API cloud (OpenCode Zen).

El backend debe:

- Recibir preguntas desde el frontend `front/`.
- Validar y limitar el uso para evitar abuso del modelo.
- Llamar a OpenCode Zen API con el modelo `deepseek-v4-flash-free`.
- Responder como agente del sitio personal de Fabian.
- No exponer la API key del modelo al frontend.
- Correr siempre como servicio en background.

## 2. Stack recomendado

### 2.1 Lenguaje y framework

- **Python 3.11+**.
- **FastAPI** para API HTTP.
- **Uvicorn** como servidor ASGI.
- **httpx** como cliente HTTP hacia OpenCode Zen API.
- **pydantic-settings** para configuracion desde variables de entorno.
- **pytest** para tests basicos.

Motivo: es simple, tipado, facil de testear y encaja bien con integraciones de IA.

### 2.2 Runtime LLM

- **OpenCode Zen API** (cloud).
- API compatible con OpenAI: `https://opencode.ai/zen/v1/chat/completions`.
- Modelo por defecto: `deepseek-v4-flash-free` (gratuito).
- API Key via variable de entorno `INGENIO_LLM_API_KEY`.

Motivo: modelo gratuito, sin necesidad de hardware local, API OpenAI-compatible, facil de cambiar a otro modelo en el futuro.

### 2.3 Servicio always-on

Produccion recomendada:

- Linux.
- `systemd` para `ingenio-api.service`.
- Reverse proxy TLS: Caddy, Nginx o Traefik.

## 3. Componentes instalados requeridos

### 3.1 Host Linux

Requerido:

- `curl`
- `git`
- Python 3.11+ con `venv`
- systemd
- reverse proxy con HTTPS

Opcional segun hardware:

- Drivers NVIDIA + CUDA si se usa GPU NVIDIA.
- ROCm si se usa GPU AMD compatible.

### 3.2 Backend Python

Dependencias minimas:

```text
fastapi
uvicorn[standard]
httpx
pydantic-settings
python-dotenv
pytest
```

Dependencias evitadas en MVP:

- Redis: no requerido para un solo proceso; necesario si se escala a multiples workers/instancias con rate limit compartido.
- LangChain/LlamaIndex: no requeridos para un proxy simple hacia OpenCode Zen API.
- Base vectorial: no requerida hasta que haya RAG con contenido del sitio.

## 4. Arquitectura

```text
Internet
  |
  | HTTPS
  v
[Reverse proxy: Caddy/Nginx]
  |                 \
  |                  \ sirve archivos estaticos de front/
  | /api/*
  v
[FastAPI backend: 127.0.0.1:8080]
  |
  | HTTPS (OpenCode Zen API)
  v
[Modelo cloud: deepseek-v4-flash-free]
```

Reglas:

1. El navegador no debe llamar directo a la API del modelo.
2. La API key del modelo solo vive en el backend, no en el frontend.
3. El backend no debe escuchar publicamente si hay reverse proxy: usar `127.0.0.1:8080`.
4. El frontend y el backend deben operar bajo el mismo dominio cuando sea posible.

## 5. Seguridad de comunicacion frontend-backend

### 5.1 Limite realista

Si el sitio es publico, ningun mecanismo puramente frontend puede impedir al 100% que alguien automatice llamadas: cualquier usuario legitimo necesita poder pedir una sesion y llamar a `/api/chat`.

Por eso la seguridad se basa en capas:

- No exponer la API key del modelo.
- Requerir sesion firmada por el backend.
- Requerir token CSRF asociado a esa sesion.
- Validar `Origin`/`Referer` en navegadores.
- CORS restrictivo.
- Rate limit por IP y por sesion.
- Limite de longitud de prompt.
- Timeout de inferencia.
- Reverse proxy con rate limiting adicional.
- Logs sin prompts completos ni secretos.

Esto no reemplaza autenticacion real. Si se quiere que solo Fabian o usuarios autorizados usen el modelo, se debe agregar login, Basic Auth, magic link o una proteccion equivalente.

### 5.2 Flujo requerido

```text
1. Browser carga el sitio.
2. Frontend llama GET /api/session.
3. Backend crea una sesion firmada y setea cookie HttpOnly.
4. Backend devuelve un csrf_token no sensible, ligado a la sesion.
5. Frontend llama POST /api/chat con:
   - cookie HttpOnly automatica
   - header X-Ingenio-CSRF
   - body JSON con message
6. Backend valida sesion, CSRF, origin, rate limit y payload.
7. Backend llama a OpenCode Zen API.
8. Backend devuelve respuesta normalizada.
```

### 5.3 Cookies

Cookie recomendada:

```text
Name: ingenio_session
HttpOnly: true
Secure: true en produccion
SameSite: Lax
Path: /
TTL: 1 hora inicial
```

En desarrollo local sin HTTPS puede usarse `Secure=false`, pero en produccion debe ser `Secure=true`.

### 5.4 CSRF

Header requerido:

```text
X-Ingenio-CSRF: <token-devuelto-por-/api/session>
```

El token no debe guardarse en `.env`. Debe generarse por sesion y validarse en backend.

### 5.5 CORS

Configurar una lista cerrada de origenes permitidos:

```text
INGENIO_ALLOWED_ORIGIN=https://ingenio.example.com
```

CORS ayuda contra navegadores, pero no protege contra `curl` o scripts. Por eso debe combinarse con sesion, CSRF y rate limiting.

### 5.6 Rate limit

MVP:

- Por sesion: 12 requests/minuto.
- Por IP: 30 requests/minuto.
- Maximo mensaje: 2.000 caracteres.
- Timeout de modelo/API: 45 segundos.

Produccion con mas trafico:

- Mover rate limit a Redis o al reverse proxy.
- Agregar limite diario por IP/sesion.
- Evaluar captcha/Turnstile al emitir sesion si hay abuso.

## 6. Variables de entorno

No guardar valores reales en Git. `.env` es local y debe estar ignorado. Versionar solo `.env.example` con placeholders no sensibles.

```env
INGENIO_ENV=development
INGENIO_API_HOST=127.0.0.1
INGENIO_API_PORT=8080
INGENIO_ALLOWED_ORIGIN=http://localhost:8000

INGENIO_LLM_BASE_URL=https://opencode.ai/zen/v1
INGENIO_LLM_MODEL=deepseek-v4-flash-free
INGENIO_LLM_API_KEY=
INGENIO_LLM_TIMEOUT_SECONDS=45
INGENIO_LLM_MAX_TOKENS=2048

INGENIO_SESSION_SECRET=GENERAR_EN_CADA_AMBIENTE
INGENIO_SESSION_TTL_SECONDS=3600
INGENIO_RATE_LIMIT_PER_MINUTE=12
INGENIO_MAX_MESSAGE_CHARS=2000

INGENIO_CHAT_LOG_ENABLED=true
INGENIO_CHAT_LOG_DIR=logs/chat
INGENIO_CHAT_LOG_MAX_BYTES=1048576
INGENIO_CHAT_LOG_INCLUDE_TEXT=true
INGENIO_CHAT_LOG_VIEW_TOKEN=
```

`INGENIO_SESSION_SECRET` e `INGENIO_LLM_API_KEY` son secretos. Deben generarse por ambiente y no commitearse.
`INGENIO_CHAT_LOG_VIEW_TOKEN` tambien es secreto: debe tener al menos 32 caracteres, vivir solo en `.env`/secret manager y rotarse si se expone.

Comando recomendado para generar valor local:

```bash
openssl rand -hex 32
```

No pegar el resultado en documentacion, issues, chats ni commits.

## 7. API requerida

### 7.1 `GET /health`

Uso: monitoreo basico.

Respuesta esperada:

```json
{
  "status": "ok",
  "runtime": "zen",
  "model": "deepseek-v4-flash-free"
}
```

No debe exponer rutas internas, variables de entorno ni secretos.

### 7.2 `GET /api/session`

Uso: emitir sesion para navegador.

Respuesta esperada:

```json
{
  "csrf_token": "token-efimero",
  "expires_in": 3600
}
```

Setea cookie `ingenio_session` HttpOnly.

### 7.3 `POST /api/chat`

Headers requeridos:

```text
Content-Type: application/json
X-Ingenio-CSRF: <csrf_token>
```

Cookie requerida:

```text
ingenio_session=<cookie-firmada>
```

Request:

```json
{
  "message": "Que herramientas de IA usas todos los dias?"
}
```

Respuesta:

```json
{
  "reply": "...",
  "model": "deepseek-v4-flash-free"
}
```

Errores normalizados:

```json
{
  "detail": "request_rejected"
}
```

No devolver stack traces ni errores crudos de la API del modelo.

### 7.4 `GET /api/site-context`

Uso: exponer metadata publica del backend.

Respuesta sugerida:

```json
{
  "agent_name": "INGENIO/64",
  "model": "deepseek-v4-flash-free",
  "capabilities": ["chat", "site_context"],
  "limits": {
    "max_message_chars": 2000
  }
}
```

### 7.5 `GET /api/admin/chat-logs/latest`

Uso: inspeccion administrativa del ultimo archivo de log de chat que no este comprimido.

Seguridad:

- No es publico.
- Requiere header `X-Ingenio-Log-Token`.
- El valor esperado viene de `INGENIO_CHAT_LOG_VIEW_TOKEN`.
- Si `INGENIO_CHAT_LOG_VIEW_TOKEN` esta vacio, el endpoint responde `404 not_found`.
- El token debe tener al menos 32 caracteres; si es menor, el endpoint responde `503 log_view_token_misconfigured`.
- Valida `Origin`/`Referer` si esos headers vienen presentes.
- No requiere cookie de usuario ni CSRF porque esta pensado para uso administrativo con `curl`/herramientas internas.

Request:

```bash
curl -H "X-Ingenio-Log-Token: $INGENIO_CHAT_LOG_VIEW_TOKEN" \
  https://ingenio.example.com/api/admin/chat-logs/latest
```

Respuesta:

- `200 text/plain`: contenido del `.txt` activo o mas reciente.
- Header `Cache-Control: no-store`.
- Header `X-Ingenio-Log-File` con el nombre del archivo devuelto.
- El contenido vuelve a pasar por redaccion de secretos antes de enviarse.

Errores:

```text
401 log_token_required
403 bad_log_token
404 not_found
404 chat_log_not_found
503 log_view_token_misconfigured
```

Reglas:

- No mostrar archivos `.tar.gz`.
- No permitir elegir rutas desde el request.
- No usar este endpoint desde el frontend publico.
- No guardar el token en JavaScript, Markdown, issues, commits ni screenshots.

## 8. Prompt de sistema

Prompt inicial recomendado:

```text
Sos el agente de INGENIO/64, el sitio personal de Fabian.
Respondes en espanol neutro, directo y tecnico.
Tu objetivo es ayudar a explorar experiencias, herramientas y aprendizajes sobre IA publicados por Fabian.
Si no sabes algo del sitio, decilo y sugeri revisar una seccion relacionada.
No inventes datos personales, clientes, credenciales ni informacion privada.
No ejecutes acciones externas.
```

## 9. Layout esperado del backend

```text
backend/
├── app/
│   ├── __init__.py
│   └── main.py
├── tests/
│   └── test_health.py
├── requirements.txt
└── README.md
```

Para el MVP se permite un `main.py` autocontenido. Cuando crezca, separar:

```text
backend/app/config.py
backend/app/security.py
backend/app/llm_client.py
backend/app/routes.py
```

## 10. Operacion como servicio

### 10.1 Backend

Debe correr como `ingenio-api.service`:

- `WorkingDirectory=/opt/ingenio/backend`
- `ExecStart=/opt/ingenio/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8080`
- `Restart=always`
- usuario sin privilegios, por ejemplo `ingenio`
- variables desde archivo externo a Git, por ejemplo `/etc/ingenio/ingenio-api.env`

## 11. Logging

El backend debe guardar las interacciones de `/api/chat` en archivos `.txt` dentro de:

```text
logs/chat/
```

Formato:

- JSON Lines (`.jsonl`) dentro de archivo `.txt`.
- Un registro por interaccion.
- Archivo activo: `chat-active.txt`.
- Rotacion por tamano: `INGENIO_CHAT_LOG_MAX_BYTES=1048576` (1 MiB).
- Al rotar, el `.txt` cerrado se comprime como `chat-<timestamp>-<id>.txt.tar.gz`.
- Luego se crea un nuevo `chat-active.txt`.

Campos permitidos:

- timestamp UTC
- request_id aleatorio
- evento: `completed`, `blocked`, `output_blocked`, `model_error`, `model_empty_response`, `message_too_long`
- status code devuelto
- hash de sesion
- hash de IP/cliente
- modelo usado
- duracion
- reason/error cuando aplique
- usage/tokens si el proveedor lo devuelve
- cantidad de caracteres del prompt y respuesta
- prompt y respuesta, siempre con redaccion automatica si `INGENIO_CHAT_LOG_INCLUDE_TEXT=true`

No permitido:

- cookies
- CSRF tokens
- headers completos
- headers de autenticacion
- `INGENIO_SESSION_SECRET`
- `INGENIO_LLM_API_KEY`
- valores de `.env`
- respuestas inseguras bloqueadas por guardrails

Reglas de seguridad:

- `logs/` debe permanecer ignorado por Git.
- Los textos se guardan con redaccion de patrones comunes: `Bearer ...`, `*_TOKEN=...`, `*_KEY=...`, `*_SECRET=...`, passwords, JWT y bloques de private key.
- Para mayor privacidad, configurar `INGENIO_CHAT_LOG_INCLUDE_TEXT=false`; en ese modo quedan solo metadatos y longitudes.
- En produccion, montar `logs/chat` en un volumen persistente y protegerlo con permisos restrictivos.
- No usar estos logs como fuente de contexto del modelo.
- Si un usuario pega un secreto en el prompt, el log debe guardar el valor redactado y se debe recomendar rotacion si se detecta exposicion.

## 12. Tests minimos

- `/health` devuelve `ok` con `runtime: "zen"` aunque la API cloud este inaccesible debe indicarlo sin stack trace.
- `/api/chat` sin sesion devuelve 401/403.
- `/api/chat` sin CSRF devuelve 403.
- `/api/chat` con mensaje demasiado largo devuelve 413 o 422.
- Rate limit devuelve 429.
- Errores de la API del modelo devuelven 502 generico.

## 13. Fuentes oficiales

- OpenCode Zen API docs: https://opencode.ai/docs/zen
- FastAPI docs: https://fastapi.tiangolo.com/


### Manejo de respuestas vacias del modelo

El backend no debe devolver una respuesta fallback como si fuera generada por el modelo cuando el proveedor devuelve `content` vacio.
Debe responder `502 model_empty_response`. Para DeepSeek V4 / OpenCode Zen se configura `INGENIO_LLM_MAX_TOKENS=2048` por defecto, porque prompts medianos pueden gastar tokens en razonamiento interno antes de emitir texto final.
