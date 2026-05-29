import json

from app.chat_logs import ChatLogWriter, redact_sensitive_text


def test_redact_sensitive_text_removes_common_secret_values():
    text = (
        "DOKPLOY_API_TOKEN=super-secret-value "
        "Authorization: Bearer abcdefghijklmnop "
        "INGENIO_LLM_API_KEY=sk-1234567890abcdef"
    )

    redacted = redact_sensitive_text(text)

    assert "super-secret-value" not in redacted
    assert "abcdefghijklmnop" not in redacted
    assert "sk-1234567890abcdef" not in redacted
    assert "DOKPLOY_API_TOKEN=[REDACTED]" in redacted
    assert "Bearer [REDACTED]" in redacted
