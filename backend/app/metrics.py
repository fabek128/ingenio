"""Metricas de Prometheus para INGENIO/64."""
from __future__ import annotations

from prometheus_client import Counter, Histogram, Gauge, Info

# Informacion del servicio
ingenio_info = Info("ingenio_service", "Informacion del servicio INGENIO/64")

# Contadores de interacciones del chat
chat_requests_total = Counter(
    "ingenio_chat_requests_total",
    "Total de requests al chat",
    ["event", "status_code"],
)

chat_blocked_total = Counter(
    "ingenio_chat_blocked_total",
    "Total de prompts bloqueados por guardrails",
    ["reason"],
)

chat_model_errors_total = Counter(
    "ingenio_chat_model_errors_total",
    "Total de errores del modelo LLM",
    ["error_type"],
)

# Histogramas de latencia
chat_duration_seconds = Histogram(
    "ingenio_chat_duration_seconds",
    "Duracion de interacciones del chat en segundos",
    ["event"],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
)

# Histogramas de tokens/caracteres
chat_message_chars = Histogram(
    "ingenio_chat_message_chars",
    "Distribucion de caracteres en mensajes de usuario",
    buckets=(10, 50, 100, 200, 500, 1000, 2000),
)

chat_reply_chars = Histogram(
    "ingenio_chat_reply_chars",
    "Distribucion de caracteres en respuestas del agente",
    buckets=(10, 50, 100, 200, 500, 1000, 2000, 5000),
)

# Metricas de uso del modelo
model_tokens_total = Counter(
    "ingenio_model_tokens_total",
    "Total de tokens consumidos del modelo",
    ["token_type"],  # prompt_tokens, completion_tokens, total_tokens
)

# Rate limiting
rate_limit_violations_total = Counter(
    "ingenio_rate_limit_violations_total",
    "Total de violaciones de rate limit",
    ["limit_type"],  # per_minute, per_hour, per_day, blacklist
)

# Sesiones activas (aproximado)
active_sessions = Gauge(
    "ingenio_active_sessions",
    "Numero aproximado de sesiones activas en la ultima hora",
)


def record_chat_interaction(
    *,
    event: str,
    status_code: int,
    duration_ms: int,
    message_chars: int | None = None,
    reply_chars: int | None = None,
    reason: str | None = None,
    usage: dict[str, int] | None = None,
) -> None:
    """Registra metricas de una interaccion del chat."""
    # Contador total de requests
    chat_requests_total.labels(event=event, status_code=status_code).inc()

    # Duracion
    chat_duration_seconds.labels(event=event).observe(duration_ms / 1000.0)

    # Caracteres
    if message_chars is not None:
        chat_message_chars.observe(message_chars)
    if reply_chars is not None:
        chat_reply_chars.observe(reply_chars)

    # Bloqueos
    if event == "blocked" and reason:
        chat_blocked_total.labels(reason=reason).inc()

    # Errores del modelo
    if event == "model_error":
        error_type = reason or "unknown"
        chat_model_errors_total.labels(error_type=error_type).inc()

    # Tokens
    if usage:
        for key, value in usage.items():
            model_tokens_total.labels(token_type=key).inc(value)


def record_rate_limit_violation(limit_type: str) -> None:
    """Registra una violacion de rate limit."""
    rate_limit_violations_total.labels(limit_type=limit_type).inc()
