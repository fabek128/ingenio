from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time
from collections import defaultdict, deque
from typing import Any
from urllib.parse import urlparse

import httpx
import resend
from app.chat_logs import ChatLogWriter, redact_sensitive_text
from app.rate_limit import init_rate_limiter, get_rate_limiter
from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Request, Response, status
from app.guardrails import (
    build_public_context,
    build_system_prompt,
    classify_prompt,
    validate_model_output,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

COOKIE_NAME = "ingenio_session"
CSRF_HEADER = "X-Ingenio-CSRF"
LOG_VIEW_TOKEN_HEADER = "X-Ingenio-Log-Token"


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
    ingenio_rate_limit_per_hour: int = 100
    ingenio_rate_limit_per_day: int = 500
    ingenio_max_message_chars: int = 2000
    ingenio_chat_log_enabled: bool = True
    ingenio_chat_log_dir: str = "logs/chat"
    ingenio_chat_log_max_bytes: int = 1024 * 1024
    ingenio_chat_log_include_text: bool = True
    ingenio_chat_log_view_token: str = ""
    resend_api_key: str = ""
    resend_from_email: str = "contacto@ingenio64.com"
    contact_recipient_email: str = ""

    @property
    def secure_cookie(self) -> bool:
        return self.ingenio_env.lower() == "production"


settings = Settings()
if not settings.ingenio_session_secret:
    raise RuntimeError("Falta INGENIO_SESSION_SECRET en .env o en el entorno")
if not settings.ingenio_llm_api_key:
    raise RuntimeError("Falta INGENIO_LLM_API_KEY en .env o en el entorno")

app = FastAPI(title="INGENIO/64 API", version="0.2.0")

chat_log_writer = ChatLogWriter(
    enabled=settings.ingenio_chat_log_enabled,
    log_dir=settings.ingenio_chat_log_dir,
    max_bytes=settings.ingenio_chat_log_max_bytes,
    include_text=settings.ingenio_chat_log_include_text,
)

# Inicializar rate limiter avanzado
rate_limiter = init_rate_limiter(
    per_minute=settings.ingenio_rate_limit_per_minute,
    per_hour=settings.ingenio_rate_limit_per_hour,
    per_day=settings.ingenio_rate_limit_per_day,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ingenio_allowed_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", CSRF_HEADER, LOG_VIEW_TOKEN_HEADER],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    reply: str
    model: str
    usage: dict[str, int] | None = None


class ContactRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=200)
    empresa: str = Field(default="", max_length=200)
    que: str = Field(min_length=1, max_length=2000)
    presupuesto: str = Field(default="", max_length=200)


class ContactResponse(BaseModel):
    success: bool
    message: str


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


def _log_hash(value: str) -> str:
    digest = hmac.new(
        settings.ingenio_session_secret.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest[:16]


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


def _validate_optional_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    allowed = settings.ingenio_allowed_origin.rstrip("/")

    if origin and _origin_host(origin) != allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="bad_origin")

    if referer and _origin_host(referer) != allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="bad_referer")


def _check_rate_limit(key: str) -> None:
    """Verifica rate limit usando el sistema avanzado."""
    limiter = get_rate_limiter()
    violation = limiter.check_rate_limit(key)

    if violation:
        # Registrar intento bloqueado para detectar ataques
        limiter.record_blocked_attempt(key)

        # Preparar mensaje de error
        if violation.limit_type == "blacklist":
            detail = f"rate_limited_blacklist:{violation.window_seconds}"
        else:
            detail = f"rate_limited_{violation.limit_type}"

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
        )

    # Registrar request exitoso
    limiter.record_request(key)


def _client_identifier(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    return forwarded_for.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _duration_ms(start: float) -> int:
    return int((time.perf_counter() - start) * 1000)


def _usage_dict(data: dict[str, Any]) -> dict[str, int] | None:
    usage = data.get("usage")
    if usage and isinstance(usage, dict):
        return {k: int(v) for k, v in usage.items() if isinstance(v, (int, float))}
    return None


def _log_security_attack(
    *,
    request: Request,
    session: dict[str, Any],
    reason: str,
    message: str,
) -> None:
    """Loguea intentos de ataque con información completa para análisis forense."""
    client_ip = _client_identifier(request)
    user_agent = request.headers.get("user-agent", "unknown")
    referer = request.headers.get("referer", "none")
    origin = request.headers.get("origin", "none")

    # Log estructurado con toda la información del ataque
    logger.warning(
        "event=security_attack_detected "
        "reason=%s "
        "client_ip_hash=%s "
        "session_hash=%s "
        "user_agent=%s "
        "origin=%s "
        "referer=%s "
        "message_length=%d "
        "full_message=%s",
        reason,
        _log_hash(client_ip),
        _log_hash(str(session.get("sid", "unknown"))),
        user_agent,
        origin,
        referer,
        len(message),
        repr(message),  # repr() para escapar caracteres especiales
    )


def _write_chat_log(
    *,
    request: Request,
    session: dict[str, Any],
    start: float,
    event: str,
    status_code: int,
    message: str | None = None,
    reply: str | None = None,
    reason: str | None = None,
    usage: dict[str, int] | None = None,
    error: str | None = None,
) -> None:
    # Para eventos de seguridad, loguear información completa adicional
    if reason in ("prompt_injection_attempt", "secret_keyword", "private_logs", "private_qa"):
        _log_security_attack(
            request=request,
            session=session,
            reason=reason,
            message=message or "",
        )

    chat_log_writer.write_interaction(
        event=event,
        status_code=status_code,
        session_hash=_log_hash(str(session.get("sid", "unknown"))),
        client_hash=_log_hash(_client_identifier(request)),
        model=settings.ingenio_llm_model,
        duration_ms=_duration_ms(start),
        message=message,
        reply=reply,
        reason=reason,
        usage=usage,
        error=error,
    )


def require_chat_log_view_token(
    request: Request,
    log_token: str | None = Header(default=None, alias=LOG_VIEW_TOKEN_HEADER),
) -> None:
    _validate_optional_origin(request)

    expected = settings.ingenio_chat_log_view_token
    if not expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not_found")

    if len(expected) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="log_view_token_misconfigured",
        )

    if not log_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="log_token_required")

    if not hmac.compare_digest(log_token, expected):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="bad_log_token")


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

    client_host = _client_identifier(request)
    _check_rate_limit(f"sid:{payload['sid']}")
    _check_rate_limit(f"ip:{client_host}")
    return payload


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
    """Extrae el texto de respuesta del modelo desde varias ubicaciones posibles."""
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0] if isinstance(choices[0], dict) else {}

        # Intenta extraer desde message.content (formato OpenAI)
        message = first.get("message")
        if isinstance(message, dict):
            content = _content_to_text(message.get("content"))
            if content:
                return content

            # Algunos modelos usan "text" dentro de message
            text = _content_to_text(message.get("text"))
            if text:
                return text

        # Intenta extraer desde text directo (formato alternativo)
        text = _content_to_text(first.get("text"))
        if text:
            return text

        # Intenta extraer desde delta.content (streaming format)
        delta = first.get("delta")
        if isinstance(delta, dict):
            content = _content_to_text(delta.get("content"))
            if content:
                return content

    # Formato alternativo: output_text o output
    output_text = _content_to_text(data.get("output_text"))
    if output_text:
        return output_text

    output = _content_to_text(data.get("output"))
    if output:
        return output

    # Formato alternativo: message directo
    message = data.get("message")
    if isinstance(message, dict):
        content = _content_to_text(message.get("content"))
        if content:
            return content

    # Formato alternativo: text directo
    text = _content_to_text(data.get("text"))
    if text:
        return text

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
        "capabilities": ["chat", "site_context", "rate_limit_stats"],
        "limits": {
            "max_message_chars": settings.ingenio_max_message_chars,
            "rate_limit_per_minute": settings.ingenio_rate_limit_per_minute,
            "rate_limit_per_hour": settings.ingenio_rate_limit_per_hour,
            "rate_limit_per_day": settings.ingenio_rate_limit_per_day,
        },
    }


@app.get("/api/rate-limit-stats")
async def rate_limit_stats(
    request: Request,
    _session: dict[str, Any] = Depends(require_browser_session),
) -> dict[str, Any]:
    """Retorna estadísticas de rate limiting para el usuario actual."""
    _validate_optional_origin(request)

    limiter = get_rate_limiter()
    client_host = _client_identifier(request)

    # Obtener stats para sesión e IP
    session_stats = limiter.get_stats(f"sid:{_session['sid']}")
    ip_stats = limiter.get_stats(f"ip:{client_host}")

    return {
        "session": session_stats,
        "ip": ip_stats,
    }


@app.get("/api/admin/chat-logs/latest", response_class=PlainTextResponse)
async def latest_chat_log(
    _authorized: None = Depends(require_chat_log_view_token),
) -> PlainTextResponse:
    latest_path = chat_log_writer.latest_uncompressed_path()
    if not latest_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="chat_log_not_found")

    try:
        content = redact_sensitive_text(latest_path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="chat_log_read_failed",
        ) from exc

    return PlainTextResponse(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-store",
            "X-Ingenio-Log-File": latest_path.name,
        },
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: Request,
    payload: ChatRequest,
    _session: dict[str, Any] = Depends(require_browser_session),
) -> ChatResponse:
    start = time.perf_counter()
    message = payload.message.strip()
    if len(message) > settings.ingenio_max_message_chars:
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="message_too_long",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            message=message,
            reason="message_too_long",
        )
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="message_too_long")

    decision = classify_prompt(message)
    if not decision.allowed:
        reply = decision.safe_reply or "No puedo responder eso."
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="blocked",
            status_code=status.HTTP_200_OK,
            message=message,
            reply=reply,
            reason=decision.reason,
        )
        return ChatResponse(
            reply=reply,
            model=settings.ingenio_llm_model,
        )

    public_context = build_public_context()
    system_content = build_system_prompt(public_context)

    zen_payload = {
        "model": settings.ingenio_llm_model,
        "messages": [
            {"role": "system", "content": system_content},
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
        error_detail = f"model_timeout: {str(exc)[:200]}"
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="model_error",
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            message=message,
            error=error_detail,
        )
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="model_timeout") from exc
    except httpx.HTTPStatusError as exc:
        error_detail = f"model_http_error: status={exc.response.status_code} {str(exc)[:200]}"
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="model_error",
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
            error=error_detail,
        )
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="model_unavailable") from exc
    except httpx.HTTPError as exc:
        error_detail = f"model_connection_error: {str(exc)[:200]}"
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="model_error",
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
            error=error_detail,
        )
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="model_unavailable") from exc
    except Exception as exc:
        error_detail = f"model_unexpected_error: {type(exc).__name__} {str(exc)[:200]}"
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="model_error",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=message,
            error=error_detail,
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="model_unavailable") from exc

    reply = _extract_llm_reply(data)
    usage_dict = _usage_dict(data)
    if not reply:
        # Log completo para debugging (primeros 1000 chars)
        raw_data_full = json.dumps(data, ensure_ascii=False, indent=2)
        logger.warning(
            "model_empty_response: extraction failed but model returned data. "
            "usage=%s data_preview=%s",
            usage_dict,
            raw_data_full[:1000]
        )

        # Preview corto para el log de chat
        raw_data_preview = json.dumps(data, ensure_ascii=False)[:300]
        error_detail = f"model_empty_response: no text extracted. Raw preview: {raw_data_preview}"
        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="model_empty_response",
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
            usage=usage_dict,
            error=error_detail,
        )
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="model_empty_response")

    output_decision = validate_model_output(reply)
    if not output_decision.allowed:
        safe_reply = output_decision.safe_reply or "No puedo devolver esa respuesta."
        original_reply_preview = reply[:200] if reply else ""
        error_detail = f"output_blocked: {output_decision.reason}. Original reply preview: {original_reply_preview}"

        # Loguear el output bloqueado con información completa para análisis forense
        logger.warning(
            "event=security_output_blocked "
            "reason=%s "
            "client_ip_hash=%s "
            "session_hash=%s "
            "user_agent=%s "
            "origin=%s "
            "prompt_length=%d "
            "reply_length=%d "
            "full_prompt=%s "
            "full_reply=%s",
            output_decision.reason,
            _log_hash(_client_identifier(request)),
            _log_hash(str(_session.get("sid", "unknown"))),
            request.headers.get("user-agent", "unknown"),
            request.headers.get("origin", "none"),
            len(message),
            len(reply),
            repr(message),
            repr(reply),  # Loguear respuesta completa del modelo bloqueada
        )

        _write_chat_log(
            request=request,
            session=_session,
            start=start,
            event="output_blocked",
            status_code=status.HTTP_200_OK,
            message=message,
            reply=safe_reply,
            reason=output_decision.reason,
            usage=usage_dict,
            error=error_detail,
        )
        return ChatResponse(
            reply=safe_reply,
            model=settings.ingenio_llm_model,
        )

    _write_chat_log(
        request=request,
        session=_session,
        start=start,
        event="completed",
        status_code=status.HTTP_200_OK,
        message=message,
        reply=reply,
        usage=usage_dict,
    )

    return ChatResponse(reply=reply, model=settings.ingenio_llm_model, usage=usage_dict)


@app.post("/api/contact", response_model=ContactResponse)
async def contact(
    request: Request,
    payload: ContactRequest,
    _session: dict[str, Any] = Depends(require_browser_session),
) -> ContactResponse:
    """Endpoint para envío de formulario de contacto con envío de email."""
    start = time.perf_counter()

    # Validación básica de email
    import re
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_email",
        )

    # Validar que Resend esté configurado
    if not settings.resend_api_key or not settings.contact_recipient_email:
        logger.error("Resend not configured: missing RESEND_API_KEY or CONTACT_RECIPIENT_EMAIL")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="contact_service_unavailable",
        )

    # Configurar Resend
    resend.api_key = settings.resend_api_key

    # Construir contenido del email
    email_body = f"""Nueva consulta desde INGENIO/64

NOMBRE: {payload.nombre}
EMAIL: {payload.email}
EMPRESA: {payload.empresa or "No especificada"}
PRESUPUESTO: {payload.presupuesto or "No especificado"}

QUE NECESITA:
{payload.que}

---
Enviado desde: {_origin_host(request.headers.get("origin", "unknown"))}
Session: {_log_hash(str(_session.get("sid", "unknown")))}
IP: {_log_hash(_client_identifier(request))}
Timestamp: {time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())}
"""

    try:
        # Enviar email con Resend
        # Nota: No usamos reply_to porque Resend requiere que el dominio esté verificado.
        # El email del usuario ya está incluido en el cuerpo del mensaje.
        params = {
            "from": settings.resend_from_email,
            "to": [settings.contact_recipient_email],
            "subject": f"[INGENIO/64] Consulta de {payload.nombre}",
            "text": email_body,
        }

        logger.info(
            "event=contact_sending "
            "from=%s to=%s user_email=%s",
            settings.resend_from_email,
            settings.contact_recipient_email,
            payload.email,
        )

        resend_response = resend.Emails.send(params)

        logger.info(
            "event=contact_resend_responded "
            "response_type=%s",
            type(resend_response).__name__,
        )

        # La respuesta de resend.Emails.send() puede ser un dict o un objeto
        # Intentar acceder como dict primero, luego como atributo
        email_id = "unknown"
        if isinstance(resend_response, dict):
            email_id = resend_response.get("id", "unknown")
        elif hasattr(resend_response, "id"):
            email_id = resend_response.id
        elif hasattr(resend_response, "get"):
            email_id = resend_response.get("id", "unknown")

        logger.info(
            "event=contact_sent "
            "email_id=%s "
            "nombre=%s "
            "empresa=%s "
            "session_hash=%s "
            "client_hash=%s "
            "duration_ms=%d",
            email_id,
            payload.nombre,
            payload.empresa or "none",
            _log_hash(str(_session.get("sid", "unknown"))),
            _log_hash(_client_identifier(request)),
            _duration_ms(start),
        )

        return ContactResponse(
            success=True,
            message="contact_sent",
        )

    except Exception as exc:
        logger.error(
            "event=contact_failed "
            "error_type=%s "
            "error=%s "
            "session_hash=%s "
            "client_hash=%s "
            "duration_ms=%d",
            type(exc).__name__,
            str(exc)[:200],
            _log_hash(str(_session.get("sid", "unknown"))),
            _log_hash(_client_identifier(request)),
            _duration_ms(start),
        )
        logger.exception("Contact form exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="contact_send_failed",
        ) from exc
