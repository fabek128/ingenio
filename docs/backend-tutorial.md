# INGENIO/64 - Tutorial paso a paso para crear el backend pequeno

Fecha: 2026-05-26  

> Estado actual: este tutorial conserva el diseno original con Ollama/Gemma local como referencia historica. La implementacion vigente del repo usa FastAPI + OpenCode Zen API cloud. Para correr el backend actual, ver `backend/README.md` y `docs/backend-specification.md`.

Objetivo: construir un backend FastAPI pequeno que conecte el frontend de INGENIO/64 con Ollama usando un modelo local y controles basicos de seguridad.

Este tutorial esta escrito para que pueda seguirlo un programador junior o un subagente con contexto limitado.

## 0. Supuestos

- Estas parado en la raiz del repo `ingenio`.
- El frontend vive en `front/`.
- El backend nuevo vivira en `backend/`.
- El host de produccion recomendado es Linux con systemd.
- El modelo inicial sera `gemma2:2b`.
- Ollama debe quedar privado en `127.0.0.1:11434`.
- El backend debe quedar privado en `127.0.0.1:8080` y publicarse solo mediante reverse proxy.

> Seguridad: no leer ni pegar valores reales de `.env`. No commitear `.env`. Versionar solo `.env.example`.

## 1. Resultado esperado

Al finalizar, deberias tener:

```text
backend/
├── app/
│   ├── __init__.py
│   └── main.py
├── knowledge/
│   ├── public/
│   │   ├── about.md
│   │   ├── proyectos.md
│   │   ├── experiencias-ia.md
│   │   ├── servicios.md
│   │   └── imagenes.md
│   └── policies/
│       ├── scope.md
│       └── refusals.md
├── tests/
│   └── test_health.py
├── requirements.txt
└── README.md
```

Y estos endpoints:

```text
GET  /health
GET  /api/session
GET  /api/site-context
POST /api/chat
```

La seguridad minima sera:

- Ollama no expuesto a internet.
- Backend no expuesto directo a internet.
- Cookie HttpOnly firmada.
- Token CSRF asociado a la sesion.
- Validacion de `Origin`/`Referer`.
- CORS restringido.
- Rate limit en memoria.
- Limite de longitud de mensaje.
- Timeout contra Ollama.

## 2. Preparar variables locales

### 2.1 Verificar `.gitignore`

Debe existir una regla para ignorar `.env`:

```gitignore
.env
.env.*
!.env.example
```

Verificacion:

```bash
git check-ignore -v .env
```

Resultado esperado: Git indica que `.env` esta ignorado.

### 2.2 Actualizar `.env.example`

Crear o ajustar `.env.example` con nombres de variables no sensibles:

```env
INGENIO_ENV=development
INGENIO_API_HOST=127.0.0.1
INGENIO_API_PORT=8080
INGENIO_ALLOWED_ORIGIN=http://localhost:8000

OLLAMA_BASE_URL=http://127.0.0.1:11434
INGENIO_LLM_MODEL=gemma2:2b
INGENIO_OLLAMA_TIMEOUT_SECONDS=45

INGENIO_SESSION_SECRET=
INGENIO_SESSION_TTL_SECONDS=3600
INGENIO_RATE_LIMIT_PER_MINUTE=12
INGENIO_MAX_MESSAGE_CHARS=2000

INGENIO_CHAT_LOG_ENABLED=true
INGENIO_CHAT_LOG_DIR=logs/chat
INGENIO_CHAT_LOG_MAX_BYTES=1048576
INGENIO_CHAT_LOG_INCLUDE_TEXT=true
INGENIO_CHAT_LOG_VIEW_TOKEN=
```

### 2.3 Crear `.env` local

No copiar valores reales a este tutorial. En tu maquina, desde la raiz del repo:

```bash
cp .env.example .env
```

El codigo del backend busca `.env` tanto en la raiz del repo como en `backend/`, para que funcione al ejecutar comandos desde cualquiera de esas ubicaciones.

Generar un secreto local:

```bash
openssl rand -hex 32
```

Copiar ese valor dentro de `.env` en:

```env
INGENIO_SESSION_SECRET=<valor-generado-localmente>
```

Aplicar permisos restrictivos:

```bash
chmod 600 .env
```

Verificar que no esta trackeado:

```bash
git status --short --ignored .env
```

Resultado esperado:

```text
!! .env
```

## 2.4 Crear base de conocimiento publica versionada

El agente no debe leer todo el repo. Debe usar una allowlist de Markdown curado:

```text
backend/knowledge/public/
backend/knowledge/policies/
```

Crear archivos publicos:

```text
backend/knowledge/public/README.md
backend/knowledge/public/about.md
backend/knowledge/public/proyectos.md
backend/knowledge/public/experiencias-ia.md
backend/knowledge/public/servicios.md
backend/knowledge/public/imagenes.md
```

Crear politicas:

```text
backend/knowledge/policies/scope.md
backend/knowledge/policies/refusals.md
```

Reglas:

- Todo lo que se agregue en `backend/knowledge/public/` debe poder publicarse sin riesgo.
- No incluir `.env`, logs, tokens, passwords, IPs privadas, VPN, usuarios, clientes privados ni documentos internos.
- Para imagenes, agregar descripciones/captions en Markdown. No inferir datos sensibles desde imagenes.
- No usar `docs/`, `front/`, `logs/` ni todo el repo como contexto del modelo.
- Ignorar carpetas privadas o generadas:

```gitignore
backend/knowledge/private/
backend/knowledge/cache/
backend/knowledge/generated/
```

Si se usa Docker, copiar `knowledge/` en la imagen:

```dockerfile
COPY app/ app/
COPY knowledge/ knowledge/
COPY tests/ tests/
```

## 3. Instalar Ollama

> No ejecutes comandos con `sudo` sin confirmar ambiente y alcance si estas en un servidor productivo.

### 3.1 Instalacion Linux

Comando oficial de Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verificar:

```bash
ollama -v
```

### 3.2 Configurar Ollama para localhost

Crear override systemd:

```bash
sudo systemctl edit ollama
```

Agregar:

```ini
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
```

Guardar y salir.

Aplicar cambios:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl restart ollama
sudo systemctl status ollama
```

Verificar que escucha localmente:

```bash
curl http://127.0.0.1:11434/api/tags
```

Resultado esperado: JSON con modelos instalados o lista vacia.

### 3.3 Descargar modelo

```bash
ollama pull gemma2:2b
```

Prueba directa local:

```bash
curl http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemma2:2b",
    "stream": false,
    "messages": [
      {"role": "user", "content": "Responde en espanol en una frase: que es INGENIO/64?"}
    ]
  }'
```

Si responde, Ollama y el modelo funcionan.

## 4. Crear estructura del backend

Desde la raiz del repo:

```bash
mkdir -p backend/app backend/tests
: > backend/app/__init__.py
```

Crear `backend/requirements.txt`:

```text
fastapi
uvicorn[standard]
httpx
pydantic-settings
python-dotenv
pytest
```

Crear entorno virtual:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

## 5. Crear el backend FastAPI

Crear `backend/app/main.py` con este contenido:

```python
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from collections import defaultdict, deque
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

COOKIE_NAME = "ingenio_session"
CSRF_HEADER = "X-Ingenio-CSRF"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Permite correr desde la raiz del repo o desde backend/.
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ingenio_env: str = "development"
    ingenio_allowed_origin: str = "http://localhost:8000"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ingenio_llm_model: str = "gemma2:2b"
    ingenio_ollama_timeout_seconds: float = 45
    ingenio_session_secret: str = ""
    ingenio_session_ttl_seconds: int = 3600
    ingenio_rate_limit_per_minute: int = 12
    ingenio_max_message_chars: int = 2000

    @property
    def secure_cookie(self) -> bool:
        return self.ingenio_env.lower() == "production"


settings = Settings()
if not settings.ingenio_session_secret:
    raise RuntimeError("Falta INGENIO_SESSION_SECRET en .env o en el entorno")

app = FastAPI(title="INGENIO/64 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ingenio_allowed_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", CSRF_HEADER],
)

# Rate limit simple en memoria.
# Sirve para MVP con un solo proceso. Para multiples workers/instancias usar Redis o reverse proxy.
_hits: dict[str, deque[float]] = defaultdict(deque)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    reply: str
    model: str


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(value: str) -> str:
    digest = hmac.new(
        settings.ingenio_session_secret.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return _b64url_encode(digest)


def _create_session() -> tuple[str, str, int]:
    now = int(time.time())
    exp = now + settings.ingenio_session_ttl_seconds
    payload = {"sid": secrets.token_urlsafe(24), "exp": exp}
    payload_raw = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(payload_raw)
    session_token = f"{payload_raw}.{signature}"
    csrf_token = _sign(f"csrf:{payload['sid']}:{exp}")
    return session_token, csrf_token, settings.ingenio_session_ttl_seconds


def _verify_session(session_token: str | None) -> dict[str, Any]:
    if not session_token or "." not in session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="session_required")

    payload_raw, signature = session_token.rsplit(".", 1)
    expected = _sign(payload_raw)
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_session")

    try:
        payload = json.loads(_b64url_decode(payload_raw))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_session") from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="expired_session")

    if not payload.get("sid"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_session")

    return payload


def _expected_csrf(payload: dict[str, Any]) -> str:
    return _sign(f"csrf:{payload['sid']}:{payload['exp']}")


def _origin_host(origin: str) -> str:
    parsed = urlparse(origin)
    return f"{parsed.scheme}://{parsed.netloc}"


def _validate_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    allowed = settings.ingenio_allowed_origin.rstrip("/")

    if origin and _origin_host(origin) != allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="bad_origin")

    if not origin and referer and _origin_host(referer) != allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="bad_referer")

    if settings.ingenio_env.lower() == "production" and not origin and not referer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="missing_origin")


def _rate_limit(key: str) -> None:
    now = time.time()
    window_start = now - 60
    q = _hits[key]
    while q and q[0] < window_start:
        q.popleft()
    if len(q) >= settings.ingenio_rate_limit_per_minute:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="rate_limited")
    q.append(now)


def require_browser_session(
    request: Request,
    ingenio_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
    csrf_header: str | None = Header(default=None, alias=CSRF_HEADER),
) -> dict[str, Any]:
    _validate_origin(request)
    payload = _verify_session(ingenio_session)

    expected = _expected_csrf(payload)
    if not csrf_header or not hmac.compare_digest(csrf_header, expected):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="bad_csrf")

    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_host = forwarded_for.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    _rate_limit(f"sid:{payload['sid']}")
    _rate_limit(f"ip:{client_host}")
    return payload


def _system_prompt() -> str:
    return (
        "Sos el agente de INGENIO/64, el sitio personal de Fabian. "
        "Respondes en espanol neutro, directo y tecnico. "
        "Tu objetivo es ayudar a explorar experiencias, herramientas y aprendizajes sobre IA publicados por Fabian. "
        "Si no sabes algo del sitio, decilo y sugeri revisar una seccion relacionada. "
        "No inventes datos personales, clientes, credenciales ni informacion privada. "
        "No ejecutes acciones externas."
    )


@app.get("/health")
async def health() -> dict[str, str]:
    ollama_status = "unreachable"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            if resp.status_code == 200:
                ollama_status = "reachable"
    except httpx.HTTPError:
        ollama_status = "unreachable"

    return {
        "status": "ok",
        "runtime": "ollama",
        "model": settings.ingenio_llm_model,
        "ollama": ollama_status,
    }


@app.get("/api/session")
async def create_session(response: Response) -> dict[str, Any]:
    token, csrf_token, ttl = _create_session()
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.secure_cookie,
        samesite="lax",
        max_age=ttl,
        path="/",
    )
    return {"csrf_token": csrf_token, "expires_in": ttl}


@app.get("/api/site-context")
async def site_context() -> dict[str, Any]:
    return {
        "agent_name": "INGENIO/64",
        "model": settings.ingenio_llm_model,
        "capabilities": ["chat", "site_context"],
        "limits": {"max_message_chars": settings.ingenio_max_message_chars},
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    _session: dict[str, Any] = Depends(require_browser_session),
) -> ChatResponse:
    message = payload.message.strip()
    if len(message) > settings.ingenio_max_message_chars:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="message_too_long")

    ollama_payload = {
        "model": settings.ingenio_llm_model,
        "stream": False,
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": message},
        ],
        "options": {
            "temperature": 0.4,
            "num_predict": 512,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ingenio_ollama_timeout_seconds) as client:
            resp = await client.post(f"{settings.ollama_base_url}/api/chat", json=ollama_payload)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="model_timeout") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="model_unavailable") from exc

    reply = data.get("message", {}).get("content") or "No pude generar una respuesta."
    return ChatResponse(reply=reply, model=settings.ingenio_llm_model)
```

## 6. Crear test basico

Crear `backend/tests/test_health.py`:

```python
from fastapi.testclient import TestClient
from app.main import app


def test_health_returns_ok():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

Nota: este test importa `app.main`, por eso debe ejecutarse desde `backend/`.

Ejecutar:

```bash
cd backend
source .venv/bin/activate
pytest
cd ..
```

## 7. Correr backend en desarrollo

Terminal 1: asegurar Ollama corriendo.

```bash
curl http://127.0.0.1:11434/api/tags
```

Terminal 2: levantar backend.

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

Verificar health:

```bash
curl http://127.0.0.1:8080/health
```

## 8. Probar flujo seguro con curl

Este flujo simula al navegador.

### 8.1 Pedir sesion

```bash
curl -i \
  -c /tmp/ingenio-cookies.txt \
  -H 'Origin: http://localhost:8000' \
  http://127.0.0.1:8080/api/session
```

Copiar el valor de `csrf_token` de la respuesta JSON en una variable local de shell:

```bash
CSRF='<csrf_token_devuelto>'
```

No commitear ni documentar valores reales de tokens.

### 8.2 Llamar chat

```bash
curl -i \
  -b /tmp/ingenio-cookies.txt \
  -H 'Origin: http://localhost:8000' \
  -H 'Content-Type: application/json' \
  -H "X-Ingenio-CSRF: $CSRF" \
  -d '{"message":"Que es INGENIO/64?"}' \
  http://127.0.0.1:8080/api/chat
```

Resultado esperado: JSON con `reply` y `model`.

### 8.3 Verificar rechazo sin sesion

```bash
curl -i \
  -H 'Origin: http://localhost:8000' \
  -H 'Content-Type: application/json' \
  -d '{"message":"hola"}' \
  http://127.0.0.1:8080/api/chat
```

Resultado esperado: `401` o `403`.

### 8.4 Verificar rechazo con origin incorrecto

```bash
curl -i \
  -b /tmp/ingenio-cookies.txt \
  -H 'Origin: https://atacante.example' \
  -H 'Content-Type: application/json' \
  -H "X-Ingenio-CSRF: $CSRF" \
  -d '{"message":"hola"}' \
  http://127.0.0.1:8080/api/chat
```

Resultado esperado: `403`.

## 9. Integrar con el frontend

### 9.1 Funcion cliente sugerida

En `front/app.jsx`, cuando una frase no matchee comandos locales, el frontend debe llamar al backend.

Ejemplo conceptual:

```javascript
let ingenioCsrfToken = null;

async function ensureApiSession() {
  if (ingenioCsrfToken) return ingenioCsrfToken;

  const res = await fetch("/api/session", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("SESSION_FAILED");
  const data = await res.json();
  ingenioCsrfToken = data.csrf_token;
  return ingenioCsrfToken;
}

async function askBackendAgent(message) {
  const csrf = await ensureApiSession();

  const res = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Ingenio-CSRF": csrf,
    },
    body: JSON.stringify({ message }),
  });

  if (res.status === 401 || res.status === 403) {
    ingenioCsrfToken = null;
    throw new Error("SESSION_REJECTED");
  }

  if (!res.ok) throw new Error("AGENT_FAILED");
  return res.json();
}
```

### 9.2 Donde engancharlo

En el flujo actual de `app.jsx`:

1. `handleCommand(rawInput)` intenta detectar comando.
2. Si no detecta comando, hoy muestra `?SYNTAX ERROR`.
3. Cambiar ese default para:
   - mostrar vista `AGENT_WORKING`;
   - llamar `askBackendAgent(raw)`;
   - renderizar `reply` como respuesta de consola;
   - si falla, mostrar error generico estilo terminal.

No hacer que el navegador llame a `http://127.0.0.1:11434`. Eso apuntaria al localhost del usuario, no al servidor, y ademas expondria el runtime si se configurara mal.

## 10. Configurar reverse proxy

Ejemplo con Caddy:

```caddyfile
ingenio.example.com {
  root * /opt/ingenio/front
  file_server

  handle /api/* {
    reverse_proxy 127.0.0.1:8080
  }

  handle /health {
    reverse_proxy 127.0.0.1:8080
  }
}
```

Ajustar:

- dominio real;
- path real del repo/build;
- TLS segun ambiente.

Para Nginx, usar el mismo principio: servir `front/` como estatico y proxyear `/api/*` al backend local.

## 11. Crear servicio systemd del backend

### 11.1 Usuario de servicio

En servidor Linux:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin ingenio
```

### 11.2 Archivo de entorno fuera de Git

Crear carpeta:

```bash
sudo mkdir -p /etc/ingenio
sudo touch /etc/ingenio/ingenio-api.env
sudo chmod 600 /etc/ingenio/ingenio-api.env
sudo chown root:root /etc/ingenio/ingenio-api.env
```

Editar:

```bash
sudo nano /etc/ingenio/ingenio-api.env
```

Contenido ejemplo sin valores reales:

```env
INGENIO_ENV=production
INGENIO_ALLOWED_ORIGIN=https://ingenio.example.com
OLLAMA_BASE_URL=http://127.0.0.1:11434
INGENIO_LLM_MODEL=gemma2:2b
INGENIO_OLLAMA_TIMEOUT_SECONDS=45
INGENIO_SESSION_SECRET=<generar-en-servidor-con-openssl-rand-hex-32>
INGENIO_SESSION_TTL_SECONDS=3600
INGENIO_RATE_LIMIT_PER_MINUTE=12
INGENIO_MAX_MESSAGE_CHARS=2000
```

### 11.3 Unit file

Crear:

```bash
sudo nano /etc/systemd/system/ingenio-api.service
```

Contenido:

```ini
[Unit]
Description=INGENIO/64 API
After=network-online.target ollama.service
Wants=network-online.target

[Service]
User=ingenio
Group=ingenio
WorkingDirectory=/opt/ingenio/backend
EnvironmentFile=/etc/ingenio/ingenio-api.env
ExecStart=/opt/ingenio/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8080
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ingenio-api
sudo systemctl start ingenio-api
sudo systemctl status ingenio-api
```

Ver logs sin imprimir secretos:

```bash
journalctl -u ingenio-api -e
```

Los logs propios de interacciones del agente quedan en:

```text
logs/chat/chat-active.txt
```

Cuando `chat-active.txt` supera `INGENIO_CHAT_LOG_MAX_BYTES` (`1048576`, 1 MiB por defecto), el backend lo comprime como `chat-<timestamp>-<id>.txt.tar.gz` y crea un nuevo `chat-active.txt`.

Reglas:

- No versionar `logs/chat/`.
- No copiar contenido de estos logs a tickets, documentacion o respuestas.
- Los prompts y respuestas se guardan con redaccion automatica de secretos.
- Para guardar solo metadatos, usar `INGENIO_CHAT_LOG_INCLUDE_TEXT=false`.

### Ver el ultimo log no comprimido por API

El endpoint administrativo es:

```text
GET /api/admin/chat-logs/latest
```

Debe estar protegido con token. Generar un token local o productivo:

```bash
openssl rand -hex 32
```

Guardar el valor solo en `.env`, Dokploy secrets o secret manager:

```env
INGENIO_CHAT_LOG_VIEW_TOKEN=<valor-generado>
```

No pegar ese valor en Git, documentacion, screenshots, issues ni respuestas.

Consultar:

```bash
curl -H "X-Ingenio-Log-Token: $INGENIO_CHAT_LOG_VIEW_TOKEN" \
  http://127.0.0.1:8080/api/admin/chat-logs/latest
```

Comportamiento esperado:

- si el token no esta configurado: `404 not_found`;
- si falta el header: `401 log_token_required`;
- si el token es incorrecto: `403 bad_log_token`;
- si no hay `.txt` activo: `404 chat_log_not_found`;
- si esta autorizado: `200 text/plain` con `Cache-Control: no-store`.

Aunque los logs se escriben con redaccion automatica, el endpoint vuelve a redactar patrones sensibles antes de devolver el contenido.

## 12. Checklist de seguridad antes de publicar

- [ ] `.env` no aparece en `git status` salvo como ignorado.
- [ ] `INGENIO_SESSION_SECRET` no esta en ningun archivo versionado.
- [ ] `INGENIO_CHAT_LOG_VIEW_TOKEN` esta configurado solo como secreto y tiene al menos 32 caracteres.
- [ ] Ollama escucha en `127.0.0.1:11434`.
- [ ] Backend escucha en `127.0.0.1:8080`.
- [ ] Reverse proxy expone solo HTTPS.
- [ ] `/api/chat` sin cookie falla.
- [ ] `/api/chat` sin CSRF falla.
- [ ] `/api/chat` con Origin invalido falla.
- [ ] Rate limit devuelve `429` al exceder el limite.
- [ ] Mensajes largos son rechazados.
- [ ] `logs/chat/` esta ignorado por Git y protegido con permisos restrictivos.
- [ ] Logs no muestran tokens, cookies, CSRF, headers de autenticacion ni valores de `.env`.
- [ ] Si se guardan prompts/respuestas, se guardan con redaccion automatica de secretos.
- [ ] El frontend no contiene secrets ni URLs privadas.

## 13. Problemas comunes

### `RuntimeError: Falta INGENIO_SESSION_SECRET`

Falta configurar `.env` o `EnvironmentFile`.

Solucion:

```bash
openssl rand -hex 32
```

Pegar el resultado solo en `.env` local o `/etc/ingenio/ingenio-api.env` del servidor.

### `model_unavailable`

El backend no puede hablar con Ollama.

Verificar:

```bash
curl http://127.0.0.1:11434/api/tags
systemctl status ollama
```

### `bad_origin`

`INGENIO_ALLOWED_ORIGIN` no coincide con el dominio real.

Ejemplo correcto en produccion:

```env
INGENIO_ALLOWED_ORIGIN=https://ingenio.example.com
```

Sin slash final.

### `rate_limited`

Se excedio el limite por minuto. Reducir frecuencia o ajustar:

```env
INGENIO_RATE_LIMIT_PER_MINUTE=12
```

No subirlo demasiado si el sitio es publico.

## 14. Siguiente mejora recomendada

Cuando el MVP funcione:

1. Agregar streaming SSE para respuesta tipo consola.
2. Mover rate limiting a reverse proxy o Redis.
3. Agregar contenido Markdown y RAG local.
4. Agregar monitoreo de latencia y errores.
5. Evaluar captcha/Turnstile solo si hay abuso real.

## 15. Fuentes oficiales

- Ollama Linux/service docs: https://docs.ollama.com/linux
- Ollama API docs: https://docs.ollama.com/api/introduction
- Ollama Gemma 2 library: https://ollama.com/library/gemma2
- FastAPI docs: https://fastapi.tiangolo.com/
