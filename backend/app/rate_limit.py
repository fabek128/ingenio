"""Sistema de rate limiting avanzado con protección contra flood y ataques de fuerza bruta."""

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class RateLimitViolation:
    """Representa una violación de rate limit."""
    key: str
    limit_type: str
    window_seconds: int
    max_requests: int
    current_requests: int
    blocked_until: float | None = None


class RateLimiter:
    """Rate limiter avanzado con múltiples ventanas y penalización progresiva."""

    def __init__(
        self,
        *,
        per_minute: int = 12,
        per_hour: int = 100,
        per_day: int = 500,
        suspicious_per_minute: int = 30,
        max_violations: int = 5,
        violation_window: int = 3600,
        backoff_base: int = 60,
        backoff_max: int = 3600,
    ):
        """Inicializa el rate limiter.

        Args:
            per_minute: Máximo de requests por minuto
            per_hour: Máximo de requests por hora
            per_day: Máximo de requests por día
            suspicious_per_minute: Umbral de requests sospechosos por minuto
            max_violations: Máximo de violaciones antes de blacklist temporal
            violation_window: Ventana en segundos para contar violaciones
            backoff_base: Tiempo base de bloqueo en segundos
            backoff_max: Tiempo máximo de bloqueo en segundos
        """
        self.per_minute = per_minute
        self.per_hour = per_hour
        self.per_day = per_day
        self.suspicious_per_minute = suspicious_per_minute
        self.max_violations = max_violations
        self.violation_window = violation_window
        self.backoff_base = backoff_base
        self.backoff_max = backoff_max

        # Almacenamiento de hits por ventana
        self._hits_minute: dict[str, deque[float]] = defaultdict(deque)
        self._hits_hour: dict[str, deque[float]] = defaultdict(deque)
        self._hits_day: dict[str, deque[float]] = defaultdict(deque)

        # Almacenamiento de violaciones
        self._violations: dict[str, deque[float]] = defaultdict(deque)

        # Blacklist temporal
        self._blacklist: dict[str, float] = {}

        # Contador de requests bloqueados (para detectar ataques)
        self._blocked_attempts: dict[str, deque[float]] = defaultdict(deque)

    def check_rate_limit(self, key: str) -> RateLimitViolation | None:
        """Verifica si una key ha excedido algún rate limit.

        Returns:
            RateLimitViolation si se excedió un límite, None si todo ok
        """
        now = time.time()

        # Verificar blacklist temporal
        if key in self._blacklist:
            blocked_until = self._blacklist[key]
            if now < blocked_until:
                remaining = int(blocked_until - now)
                logger.warning(
                    "event=rate_limit_blacklist key_hash=%s remaining_seconds=%d",
                    self._hash_key(key),
                    remaining,
                )
                return RateLimitViolation(
                    key=key,
                    limit_type="blacklist",
                    window_seconds=remaining,
                    max_requests=0,
                    current_requests=0,
                    blocked_until=blocked_until,
                )
            else:
                # Expiró el bloqueo
                del self._blacklist[key]
                logger.info(
                    "event=rate_limit_blacklist_expired key_hash=%s",
                    self._hash_key(key),
                )

        # Limpiar requests antiguos
        self._cleanup_old_hits(key, now)

        # Verificar límite por minuto
        violation = self._check_window(
            key, self._hits_minute[key], now, 60, self.per_minute, "per_minute"
        )
        if violation:
            self._record_violation(key, now)
            return violation

        # Verificar límite por hora
        violation = self._check_window(
            key, self._hits_hour[key], now, 3600, self.per_hour, "per_hour"
        )
        if violation:
            self._record_violation(key, now)
            return violation

        # Verificar límite por día
        violation = self._check_window(
            key, self._hits_day[key], now, 86400, self.per_day, "per_day"
        )
        if violation:
            self._record_violation(key, now)
            return violation

        # Verificar patrón sospechoso (muchos requests en poco tiempo)
        violation = self._check_window(
            key,
            self._hits_minute[key],
            now,
            60,
            self.suspicious_per_minute,
            "suspicious",
        )
        if violation:
            logger.warning(
                "event=rate_limit_suspicious_pattern key_hash=%s requests=%d",
                self._hash_key(key),
                len(self._hits_minute[key]),
            )
            self._record_violation(key, now)
            return violation

        return None

    def record_request(self, key: str) -> None:
        """Registra un request exitoso."""
        now = time.time()
        self._hits_minute[key].append(now)
        self._hits_hour[key].append(now)
        self._hits_day[key].append(now)

    def record_blocked_attempt(self, key: str) -> None:
        """Registra un intento bloqueado y verifica si es un ataque."""
        now = time.time()
        self._blocked_attempts[key].append(now)

        # Limpiar intentos antiguos (últimos 5 minutos)
        window_start = now - 300
        q = self._blocked_attempts[key]
        while q and q[0] < window_start:
            q.popleft()

        # Si hay muchos intentos bloqueados, considerar blacklist
        if len(q) >= 10:
            logger.warning(
                "event=rate_limit_attack_detected key_hash=%s blocked_attempts=%d",
                self._hash_key(key),
                len(q),
            )
            self._apply_blacklist(key, now, multiplier=2)

    def _check_window(
        self,
        key: str,
        hits: deque[float],
        now: float,
        window: int,
        limit: int,
        limit_type: str,
    ) -> RateLimitViolation | None:
        """Verifica si se excedió el límite en una ventana de tiempo."""
        window_start = now - window
        while hits and hits[0] < window_start:
            hits.popleft()

        if len(hits) >= limit:
            logger.info(
                "event=rate_limit_exceeded key_hash=%s type=%s requests=%d limit=%d",
                self._hash_key(key),
                limit_type,
                len(hits),
                limit,
            )
            return RateLimitViolation(
                key=key,
                limit_type=limit_type,
                window_seconds=window,
                max_requests=limit,
                current_requests=len(hits),
            )

        return None

    def _cleanup_old_hits(self, key: str, now: float) -> None:
        """Limpia hits antiguos de todas las ventanas."""
        # Minuto
        window_start = now - 60
        q = self._hits_minute[key]
        while q and q[0] < window_start:
            q.popleft()

        # Hora
        window_start = now - 3600
        q = self._hits_hour[key]
        while q and q[0] < window_start:
            q.popleft()

        # Día
        window_start = now - 86400
        q = self._hits_day[key]
        while q and q[0] < window_start:
            q.popleft()

    def _record_violation(self, key: str, now: float) -> None:
        """Registra una violación y aplica penalización si es necesario."""
        self._violations[key].append(now)

        # Limpiar violaciones antiguas
        window_start = now - self.violation_window
        q = self._violations[key]
        while q and q[0] < window_start:
            q.popleft()

        # Si hay muchas violaciones, aplicar blacklist temporal
        if len(q) >= self.max_violations:
            logger.warning(
                "event=rate_limit_max_violations key_hash=%s violations=%d",
                self._hash_key(key),
                len(q),
            )
            self._apply_blacklist(key, now)

    def _apply_blacklist(self, key: str, now: float, multiplier: int = 1) -> None:
        """Aplica blacklist temporal con backoff exponencial."""
        # Calcular tiempo de bloqueo basado en número de violaciones
        violation_count = len(self._violations[key])
        backoff = min(
            self.backoff_base * (2 ** (violation_count - self.max_violations)) * multiplier,
            self.backoff_max,
        )

        blocked_until = now + backoff
        self._blacklist[key] = blocked_until

        logger.warning(
            "event=rate_limit_blacklist_applied key_hash=%s duration_seconds=%d violations=%d",
            self._hash_key(key),
            backoff,
            violation_count,
        )

    def _hash_key(self, key: str) -> str:
        """Hash de la key para logging seguro."""
        import hashlib
        return hashlib.sha256(key.encode()).hexdigest()[:16]

    def get_stats(self, key: str) -> dict[str, Any]:
        """Retorna estadísticas para una key."""
        now = time.time()
        self._cleanup_old_hits(key, now)

        blacklisted_until = None
        if key in self._blacklist and now < self._blacklist[key]:
            blacklisted_until = int(self._blacklist[key] - now)

        return {
            "requests_last_minute": len(self._hits_minute[key]),
            "requests_last_hour": len(self._hits_hour[key]),
            "requests_last_day": len(self._hits_day[key]),
            "violations_last_hour": len(self._violations[key]),
            "blacklisted": blacklisted_until is not None,
            "blacklisted_seconds_remaining": blacklisted_until,
            "limits": {
                "per_minute": self.per_minute,
                "per_hour": self.per_hour,
                "per_day": self.per_day,
            },
        }


# Instancia global del rate limiter
_global_limiter: RateLimiter | None = None


def get_rate_limiter() -> RateLimiter:
    """Retorna la instancia global del rate limiter."""
    global _global_limiter
    if _global_limiter is None:
        _global_limiter = RateLimiter()
    return _global_limiter


def init_rate_limiter(
    *,
    per_minute: int = 12,
    per_hour: int = 100,
    per_day: int = 500,
) -> RateLimiter:
    """Inicializa el rate limiter global con configuración personalizada."""
    global _global_limiter
    _global_limiter = RateLimiter(
        per_minute=per_minute,
        per_hour=per_hour,
        per_day=per_day,
    )
    return _global_limiter
