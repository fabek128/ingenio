# INGENIO/64 — Backend

Backend FastAPI que conecta el frontend con el modelo DeepSeek V4 Flash Free via OpenCode Zen API (cloud).

## Desarrollo local (sin Docker)

```bash
# 1. Configurar .env (desde la raiz del repo)
cp .env.example .env
# Editar .env y completar INGENIO_LLM_API_KEY e INGENIO_SESSION_SECRET

# 2. Crear venv e instalar
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Servir frontend (otra terminal)
cd front
python3 -m http.server 8000

# 4. Levantar backend
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

## Desarrollo local (Docker Compose)

```bash
docker compose up -d
```

Levanta el backend. El frontend se sirve aparte:

```bash
cd front && python3 -m http.server 8000
```

**Nota**: el modelo se ejecuta en la nube via OpenCode Zen. No requiere Ollama local.

## Produccion (systemd)

Ver `docs/backend-specification.md` y `docs/backend-tutorial.md`.

## Endpoints

| Metodo | Ruta               | Descripcion                |
|--------|--------------------|----------------------------|
| GET    | /health            | Health check               |
| GET    | /api/session       | Iniciar sesion (cookie)    |
| GET    | /api/site-context  | Metadata publica           |
| POST   | /api/chat          | Enviar mensaje al modelo   |

## Tests

```bash
cd backend
PYTHONPATH="$PWD" pytest
```
