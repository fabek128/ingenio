# INGENIO/64 - Especificacion del backend agentico

Fecha: 2026-05-26  
Estado: especificacion tecnica inicial

## 1. Objetivo

Definir el backend minimo para que INGENIO/64 funcione como una consola agentica personal conectada a un modelo local pequeno.

El backend debe:

- Recibir preguntas desde el frontend `front/`.
- Validar y limitar el uso para evitar abuso del modelo.
- Llamar a Ollama localmente.
- Responder como agente del sitio personal de Fabian.
- Mantener Ollama y el modelo fuera de exposicion publica directa.
- Correr siempre como servicio en background.

## 2. Stack recomendado

### 2.1 Lenguaje y framework

- **Python 3.11+**.
- **FastAPI** para API HTTP.
- **Uvicorn** como servidor ASGI.
- **httpx** como cliente HTTP hacia Ollama.
- **pydantic-settings** para configuracion desde variables de entorno.
- **pytest** para tests basicos.

Motivo: es simple, tipado, facil de testear y encaja bien con integraciones de IA.

### 2.2 Runtime LLM

- **Ollama** instalado en el host.
- API de Ollama escuchando solo en localhost o red privada.
- Modelo inicial recomendado: `gemma2:2b`.

Motivo: al 2026-05-26 no se observa una variante oficial `gemma3:2b` en Ollama; `gemma2:2b` cumple mejor el requisito de modelo pequeno de ~2B. Si se prioriza Gemma 3, evaluar `gemma3:1b` o `gemma3:4b`.

### 2.3 Servicio always-on

Produccion recomendada:

- Linux.
- `systemd` para `ollama.service`.
- `systemd` para `ingenio-api.service`.
- Reverse proxy TLS: Caddy, Nginx o Traefik.

## 3. Componentes instalados requeridos

### 3.1 Host Linux

Requerido:

- `curl`
- `git`
- Python 3.11+ con `venv`
- Ollama
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
- LangChain/LlamaIndex: no requeridos para un proxy simple hacia Ollama.
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
  | HTTP local
  v
[Ollama: 127.0.0.1:11434]
  |
  v
[Modelo: gemma2:2b]
```

Reglas:

1. El navegador no debe llamar directo a Ollama.
2. Ollama no debe escuchar en `0.0.0.0` ni exponerse a internet.
3. El backend no debe escuchar publicamente si hay reverse proxy: usar `127.0.0.1:8080`.
4. El frontend y el backend deben operar bajo el mismo dominio cuando sea posible.

## 5. Seguridad de comunicacion frontend-backend

### 5.1 Limite realista

Si el sitio es publico, ningun mecanismo puramente frontend puede impedir al 100% que alguien automatice llamadas: cualquier usuario legitimo necesita poder pedir una sesion y llamar a `/api/chat`.

Por eso la seguridad se basa en capas:

- No exponer Ollama.
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
7. Backend llama a Ollama local.
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
- Timeout de Ollama: 45 segundos.

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

OLLAMA_BASE_URL=http://127.0.0.1:11434
INGENIO_LLM_MODEL=gemma2:2b
INGENIO_OLLAMA_TIMEOUT_SECONDS=45

INGENIO_SESSION_SECRET=GENERAR_EN_CADA_AMBIENTE
INGENIO_SESSION_TTL_SECONDS=3600
INGENIO_RATE_LIMIT_PER_MINUTE=12
INGENIO_MAX_MESSAGE_CHARS=2000
```

`INGENIO_SESSION_SECRET` es secreto. Debe generarse por ambiente y no commitearse.

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
  "runtime": "ollama",
  "model": "gemma2:2b",
  "ollama": "reachable"
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
  "model": "gemma2:2b"
}
```

Errores normalizados:

```json
{
  "detail": "request_rejected"
}
```

No devolver stack traces ni errores crudos de Ollama.

### 7.4 `GET /api/site-context`

Uso: exponer metadata publica del backend.

Respuesta sugerida:

```json
{
  "agent_name": "INGENIO/64",
  "model": "gemma2:2b",
  "capabilities": ["chat", "site_context"],
  "limits": {
    "max_message_chars": 2000
  }
}
```

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
backend/app/ollama_client.py
backend/app/routes.py
```

## 10. Operacion como servicio

### 10.1 Ollama

Debe correr como servicio `ollama.service` con restart automatico.

Requisito critico:

```text
OLLAMA_HOST=127.0.0.1:11434
```

### 10.2 Backend

Debe correr como `ingenio-api.service`:

- `WorkingDirectory=/opt/ingenio/backend`
- `ExecStart=/opt/ingenio/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8080`
- `Restart=always`
- usuario sin privilegios, por ejemplo `ingenio`
- variables desde archivo externo a Git, por ejemplo `/etc/ingenio/ingenio-api.env`

## 11. Logging

Permitido:

- timestamp
- endpoint
- status code
- duracion
- IP truncada o hash
- modelo usado
- cantidad aproximada de caracteres/tokens

No permitido:

- prompts completos
- respuestas completas
- cookies
- CSRF tokens
- `INGENIO_SESSION_SECRET`
- headers de autenticacion
- datos personales del formulario de contacto

## 12. Tests minimos

- `/health` devuelve `ok` aunque Ollama este unreachable debe indicarlo sin stack trace.
- `/api/chat` sin sesion devuelve 401/403.
- `/api/chat` sin CSRF devuelve 403.
- `/api/chat` con mensaje demasiado largo devuelve 413 o 422.
- Rate limit devuelve 429.
- Errores de Ollama devuelven 502 generico.

## 13. Fuentes oficiales

- Ollama Linux/service docs: https://docs.ollama.com/linux
- Ollama API docs: https://docs.ollama.com/api/introduction
- Ollama Gemma 2 library: https://ollama.com/library/gemma2
- FastAPI docs: https://fastapi.tiangolo.com/
