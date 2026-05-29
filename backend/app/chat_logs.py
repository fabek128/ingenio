from __future__ import annotations

import json
import logging
import re
import sys
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

_PRIVATE_KEY_BLOCK_RE = re.compile(
    r"-----BEGIN\s+[^-]*PRIVATE\s+KEY-----.*?-----END\s+[^-]*PRIVATE\s+KEY-----",
    re.IGNORECASE | re.DOTALL,
)
_BEARER_RE = re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{8,}", re.IGNORECASE)
_BASIC_AUTH_RE = re.compile(r"\bBasic\s+[A-Za-z0-9._~+/=-]{8,}", re.IGNORECASE)
_JWT_RE = re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b")
_SECRET_ASSIGNMENT_RE = re.compile(
    r"(?i)\b([A-Z0-9_]*(?:API[_-]?KEY|KEY|TOKEN|SECRET|PASSWORD|PASS|PASSWD|CREDENTIAL|COOKIE|CSRF)[A-Z0-9_]*)"
    r"\s*[:=]\s*"
    r"([^\s,;'\"`]+)"
)
_SK_STYLE_RE = re.compile(r"\b(?:sk|pk|rk)-[A-Za-z0-9_-]{8,}\b", re.IGNORECASE)


class ChatLogWriter:
    """Escribe logs de interacciones del agente como JSON a stdout para ingestion via Promtail/Loki."""

    def __init__(
        self,
        *,
        enabled: bool,
        include_text: bool,
    ) -> None:
        self.enabled = enabled
        self.include_text = include_text

    def write_interaction(
        self,
        *,
        event: str,
        status_code: int,
        session_hash: str,
        client_hash: str,
        model: str,
        duration_ms: int,
        message: str | None = None,
        reply: str | None = None,
        reason: str | None = None,
        usage: dict[str, int] | None = None,
        error: str | None = None,
    ) -> None:
        if not self.enabled:
            return

        record: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": uuid.uuid4().hex,
            "event": event,
            "status_code": status_code,
            "session_hash": session_hash,
            "client_hash": client_hash,
            "model": model,
            "duration_ms": duration_ms,
        }
        if reason:
            record["reason"] = reason
        if error:
            record["error"] = error
        if usage:
            record["usage"] = usage
        if message is not None:
            record["message_chars"] = len(message)
        if reply is not None:
            record["reply_chars"] = len(reply)

        if self.include_text:
            if message is not None:
                record["message"] = redact_sensitive_text(message)
            if reply is not None:
                record["reply"] = redact_sensitive_text(reply)

        line = json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n"
        sys.stdout.write(line)
        sys.stdout.flush()


def redact_sensitive_text(text: str) -> str:
    """Redact common secret shapes before writing user/model text."""
    redacted = _PRIVATE_KEY_BLOCK_RE.sub("[REDACTED_PRIVATE_KEY]", text)
    redacted = _BEARER_RE.sub("Bearer [REDACTED]", redacted)
    redacted = _BASIC_AUTH_RE.sub("Basic [REDACTED]", redacted)
    redacted = _JWT_RE.sub("[REDACTED_JWT]", redacted)
    redacted = _SECRET_ASSIGNMENT_RE.sub(lambda m: f"{m.group(1)}=[REDACTED]", redacted)
    redacted = _SK_STYLE_RE.sub("[REDACTED_KEY]", redacted)
    return redacted
