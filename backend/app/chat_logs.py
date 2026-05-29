from __future__ import annotations

import json
import logging
import re
import tarfile
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
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
    """Append-only JSONL .txt writer with size rotation and tar.gz compression.

    The active file is `chat-active.txt`. When the active file would exceed
    `max_bytes`, it is archived as `chat-<timestamp>-<id>.txt.tar.gz` and a new
    active file is started.

    Events logged:
    - completed: Successful chat completion
    - blocked: User prompt blocked by guardrails
    - output_blocked: Model response blocked by output validation
    - model_error: Error calling the model (timeout, connection, HTTP error)
    - model_empty_response: Model returned empty response
    - message_too_long: User message exceeded max length
    """

    def __init__(
        self,
        *,
        enabled: bool,
        log_dir: str | Path,
        max_bytes: int,
        include_text: bool,
    ) -> None:
        self.enabled = enabled
        self.log_dir = Path(log_dir)
        self.max_bytes = max(1024, int(max_bytes))
        self.include_text = include_text
        self.active_path = self.log_dir / "chat-active.txt"
        self._lock = threading.Lock()

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

        self._append_line(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    def _append_line(self, line: str) -> None:
        encoded = line.encode("utf-8")
        with self._lock:
            try:
                self.log_dir.mkdir(parents=True, exist_ok=True)
                if self._should_rotate(len(encoded)):
                    self._compress_active_locked()
                with self.active_path.open("ab") as fh:
                    fh.write(encoded)
            except OSError:
                logger.exception("event=chat_log_write_failed")

    def _should_rotate(self, incoming_bytes: int) -> bool:
        if not self.active_path.exists():
            return False
        current_size = self.active_path.stat().st_size
        return current_size > 0 and current_size + incoming_bytes > self.max_bytes

    def _compress_active_locked(self) -> None:
        if not self.active_path.exists() or self.active_path.stat().st_size == 0:
            return

        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        archive_base = f"chat-{stamp}-{uuid.uuid4().hex[:8]}.txt"
        archive_path = self.log_dir / f"{archive_base}.tar.gz"

        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(self.active_path, arcname=archive_base)

        self.active_path.unlink()

    def latest_uncompressed_path(self) -> Path | None:
        """Return the newest plain .txt chat log, excluding compressed archives."""
        try:
            if not self.log_dir.exists():
                return None

            candidates = [path for path in self.log_dir.glob("*.txt") if path.is_file()]
            if not candidates:
                return None

            return max(candidates, key=lambda path: (path.stat().st_mtime, path.name))
        except OSError:
            logger.exception("event=chat_log_latest_lookup_failed")
            return None


def redact_sensitive_text(text: str) -> str:
    """Redact common secret shapes before writing user/model text to disk."""
    redacted = _PRIVATE_KEY_BLOCK_RE.sub("[REDACTED_PRIVATE_KEY]", text)
    redacted = _BEARER_RE.sub("Bearer [REDACTED]", redacted)
    redacted = _BASIC_AUTH_RE.sub("Basic [REDACTED]", redacted)
    redacted = _JWT_RE.sub("[REDACTED_JWT]", redacted)
    redacted = _SECRET_ASSIGNMENT_RE.sub(lambda m: f"{m.group(1)}=[REDACTED]", redacted)
    redacted = _SK_STYLE_RE.sub("[REDACTED_KEY]", redacted)
    return redacted
