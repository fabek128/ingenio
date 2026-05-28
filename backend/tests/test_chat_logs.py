import json
import tarfile

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


def test_chat_log_writer_writes_jsonl_txt(tmp_path):
    writer = ChatLogWriter(
        enabled=True,
        log_dir=tmp_path,
        max_bytes=1024 * 1024,
        include_text=True,
    )

    writer.write_interaction(
        event="completed",
        status_code=200,
        session_hash="sessionhash",
        client_hash="clienthash",
        model="test-model",
        duration_ms=12,
        message="Que es INGENIO/64?",
        reply="Un sitio personal.",
        usage={"total_tokens": 10},
    )

    active = tmp_path / "chat-active.txt"
    assert active.exists()
    record = json.loads(active.read_text(encoding="utf-8").strip())
    assert record["event"] == "completed"
    assert record["message"] == "Que es INGENIO/64?"
    assert record["reply"] == "Un sitio personal."
    assert record["usage"] == {"total_tokens": 10}


def test_chat_log_writer_rotates_and_compresses_old_txt(tmp_path):
    writer = ChatLogWriter(
        enabled=True,
        log_dir=tmp_path,
        max_bytes=1024,
        include_text=True,
    )

    writer.write_interaction(
        event="completed",
        status_code=200,
        session_hash="sessionhash",
        client_hash="clienthash",
        model="test-model",
        duration_ms=1,
        message="a" * 900,
        reply="primera respuesta",
    )
    writer.write_interaction(
        event="completed",
        status_code=200,
        session_hash="sessionhash",
        client_hash="clienthash",
        model="test-model",
        duration_ms=1,
        message="b" * 900,
        reply="segunda respuesta",
    )

    archives = list(tmp_path.glob("chat-*.txt.tar.gz"))
    assert len(archives) == 1
    assert (tmp_path / "chat-active.txt").exists()

    with tarfile.open(archives[0], "r:gz") as tar:
        names = tar.getnames()
        assert len(names) == 1
        assert names[0].endswith(".txt")

from fastapi.testclient import TestClient

from app.main import LOG_VIEW_TOKEN_HEADER, app, chat_log_writer, settings


def test_latest_log_endpoint_returns_latest_uncompressed_file(monkeypatch, tmp_path):
    token = "a" * 32
    monkeypatch.setattr(settings, "ingenio_chat_log_view_token", token)
    monkeypatch.setattr(chat_log_writer, "log_dir", tmp_path)
    monkeypatch.setattr(chat_log_writer, "active_path", tmp_path / "chat-active.txt")

    older = tmp_path / "chat-old.txt"
    older.write_text("older\n", encoding="utf-8")
    latest = tmp_path / "chat-active.txt"
    latest.write_text("latest\n", encoding="utf-8")

    client = TestClient(app)
    response = client.get(
        "/api/admin/chat-logs/latest",
        headers={LOG_VIEW_TOKEN_HEADER: token},
    )

    assert response.status_code == 200
    assert response.text == "latest\n"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-ingenio-log-file"] == "chat-active.txt"


def test_latest_log_endpoint_requires_token(monkeypatch, tmp_path):
    token = "a" * 32
    monkeypatch.setattr(settings, "ingenio_chat_log_view_token", token)
    monkeypatch.setattr(chat_log_writer, "log_dir", tmp_path)
    monkeypatch.setattr(chat_log_writer, "active_path", tmp_path / "chat-active.txt")
    (tmp_path / "chat-active.txt").write_text("latest\n", encoding="utf-8")

    client = TestClient(app)

    missing = client.get("/api/admin/chat-logs/latest")
    assert missing.status_code == 401

    wrong = client.get(
        "/api/admin/chat-logs/latest",
        headers={LOG_VIEW_TOKEN_HEADER: "b" * 32},
    )
    assert wrong.status_code == 403


def test_latest_log_endpoint_is_disabled_without_configured_token(monkeypatch):
    monkeypatch.setattr(settings, "ingenio_chat_log_view_token", "")

    client = TestClient(app)
    response = client.get(
        "/api/admin/chat-logs/latest",
        headers={LOG_VIEW_TOKEN_HEADER: "a" * 32},
    )

    assert response.status_code == 404


def test_latest_log_endpoint_redacts_content_before_returning(monkeypatch, tmp_path):
    token = "a" * 32
    monkeypatch.setattr(settings, "ingenio_chat_log_view_token", token)
    monkeypatch.setattr(chat_log_writer, "log_dir", tmp_path)
    monkeypatch.setattr(chat_log_writer, "active_path", tmp_path / "chat-active.txt")
    (tmp_path / "chat-active.txt").write_text(
        "INGENIO_LLM_API_KEY=sk-1234567890abcdef\n",
        encoding="utf-8",
    )

    client = TestClient(app)
    response = client.get(
        "/api/admin/chat-logs/latest",
        headers={LOG_VIEW_TOKEN_HEADER: token},
    )

    assert response.status_code == 200
    assert "sk-1234567890abcdef" not in response.text
    assert "INGENIO_LLM_API_KEY=[REDACTED]" in response.text
