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
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ingenio_env: str = "development"
    ingenio_allowed_origin: str = "http://localhost:8000"
    ingenio_llm_base_url: str = "https://opencode.ai/zen/v1"
    ingenio_llm_model: str = "deepseek-v4-flash-free"
    ingenio_llm_api_key: str = ""
    ingenio_llm_timeout_seconds: float = 45
    ingenio_llm_max_tokens: int = 2048
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
if not settings.ingenio_llm_api_key:
    raise RuntimeError("Falta INGENIO_LLM_API_KEY en .env o en el entorno")

app = FastAPI(title="INGENIO/64 API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ingenio_allowed_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", CSRF_HEADER],
)

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
        "Si el usuario quiere acceder a una seccion del sitio (ABOUT, STACK, PROYECTOS, EXPERIENCIAS, "
        "SERVICES, CASES, CONTACT, HELP), decile el nombre exacto del comando en mayusculas para que "
        "lo escriba, por ejemplo: > ABOUT, > STACK, > EXPERIENCIAS. "
        "Si no sabes algo del sitio, decilo y sugeri revisar una seccion relacionada. "
        "No inventes datos personales, clientes, credenciales ni informacion privada. "
        "No ejecutes acciones externas."
    )


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                value = item.get("text") or item.get("content")
                if isinstance(value, str):
                    parts.append(value)
        return "".join(parts).strip()

    return ""


def _extract_llm_reply(data: dict[str, Any]) -> str:
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0] if isinstance(choices[0], dict) else {}
        message = first.get("message")
        if isinstance(message, dict):
            content = _content_to_text(message.get("content"))
            if content:
                return content

        text = _content_to_text(first.get("text"))
        if text:
            return text

    output_text = _content_to_text(data.get("output_text"))
    if output_text:
        return output_text

    message = data.get("message")
    if isinstance(message, dict):
        content = _content_to_text(message.get("content"))
        if content:
            return content

    return ""


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "runtime": "zen",
        "model": settings.ingenio_llm_model,
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

    zen_payload = {
        "model": settings.ingenio_llm_model,
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": message},
        ],
        "temperature": 0.4,
        "max_tokens": settings.ingenio_llm_max_tokens,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {settings.ingenio_llm_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ingenio_llm_timeout_seconds) as client:
            resp = await client.post(
                f"{settings.ingenio_llm_base_url}/chat/completions",
                json=zen_payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="model_timeout") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="model_unavailable") from exc

    reply = _extract_llm_reply(data)
    if not reply:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="model_empty_response")

    return ChatResponse(reply=reply, model=settings.ingenio_llm_model)
