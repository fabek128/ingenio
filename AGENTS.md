# Especificaciones para agentes - INGENIO/64

Este archivo aplica a OpenCode y a cualquier agente compatible con `AGENTS.md` trabajando en este repo.

## Contexto del proyecto
- Sitio frontend estatico de INGENIO/64 + backend FastAPI + modelo cloud via OpenCode Zen.
- Vision objetivo documentada en `docs/ingenio-agentic-site-spec.md`: sitio personal tipo consola agentica para compartir experiencias diarias con IA, con backend basico y modelo via API cloud (OpenCode Zen).
- Estetica principal: terminal retro Commodore 64 / CRT.
- Idioma visible para usuarios: espanol neutro, preferentemente sin tildes cuando el texto forme parte de la estetica terminal/uppercase existente.
- Stack actual:
  - Frontend: HTML standalone + React via CDN (`app.jsx`, `content.jsx`) sin bundler.
  - Backend: Python 3.11+ / FastAPI / Uvicorn / httpx / pydantic-settings.
  - Runtime LLM: OpenCode Zen API (`deepseek-v4-flash-free` por defecto, gratuito).
  - Desarrollo local: Docker Compose (backend solo, modelo cloud).
  - Produccion: systemd + reverse proxy TLS (Linux).

## Estructura relevante
- `front/index.html`: HTML, estilos globales y montaje de la app.
- `front/app.jsx`: componentes React, flujo de terminal, comandos e interacciones.
- `front/content.jsx`: contenido editable del sitio: servicios, casos, stack, about, diagnostico y metadata de comandos.
- `front/secciones/`: Markdown publico de secciones renderizadas en runtime (`about`, `proyectos`, `agentes`).
- `front/assets/` y `front/uploads/`: imagenes usadas por la web.
- `backend/`: backend FastAPI (Python).
  - `backend/app/main.py`: API, sesiones, CSRF, rate limit, cliente OpenAI-compatible (OpenCode Zen).
  - `backend/app/chat_logs.py`: logging seguro de interacciones del agente con rotacion y compresion.
  - `backend/Dockerfile`: imagen para desarrollo local.
- `backend/knowledge/public/`: base de conocimiento publica, curada y versionada que el modelo puede usar.
- `backend/knowledge/policies/`: politicas versionadas de alcance y rechazos.
- `logs/chat/`: salida runtime de conversaciones del agente; ignorada por Git y nunca debe versionarse.
- `docker-compose.yml`: servicio backend para desarrollo local (modelo cloud, sin Ollama).
- `.env`: configuracion local y secreto de sesion (ignorado por Git).
- `.env.example`: plantilla con valores no sensibles (versionado).

## Consulta de documentacion
- Antes de implementar, modificar arquitectura o responder sobre el funcionamiento del proyecto, revisar la documentacion relevante en `docs/`.
- Priorizar `docs/ingenio-agentic-site-spec.md`, `docs/backend-specification.md`, `docs/backend-tutorial.md` y `docs/agent-specifications.md` segun la tarea.
- Si una decision tecnica contradice `docs/`, actualizar la documentacion en el mismo cambio o explicar explicitamente la desviacion.

## Reglas de implementacion
1. Mantener cambios pequenos y alineados al patron existente.
2. No agregar bundlers, frameworks, dependencias npm ni servicios externos sin aprobacion explicita.
3. Priorizar HTML/CSS/JS simple y compatible con carga directa en navegador.
4. Conservar la estetica retro: monoespaciado, bloques tipo terminal, comandos en uppercase y feedback breve.
5. Si se agrega contenido comercial, ubicarlo primero en `front/content.jsx` salvo que requiera logica/interaccion.
6. Si se agrega interaccion o comando nuevo:
   - Implementar el handler en `front/app.jsx`.
   - Registrar ayuda/metadata en `COMMANDS_META` dentro de `front/content.jsx`.
   - Verificar que funcione por click y por comando escrito cuando aplique.
7. Mantener accesibilidad basica: labels, `aria-*` en controles custom, foco visible y contraste razonable en todos los temas.
8. No hardcodear secretos, tokens, URLs privadas, passwords ni credenciales. Usar variables de entorno o configuracion externa si alguna vez se incorpora backend/build.

## Secretos y credenciales
- Jamas exponer keys, tokens, passwords, credenciales, URLs privadas ni datos sensibles en archivos versionados, prompts, logs, commits, PRs o respuestas.
- Usar `.env` solo para configuracion local/desarrollo y mantenerlo ignorado por Git.
- Versionar solamente nombres de variables y valores no sensibles en `.env.example`.
- No copiar valores de `logs/chat/` a documentacion, issues, commits o respuestas. Si se inspeccionan logs, resumir sin reproducir secretos ni datos sensibles.
- El endpoint de lectura de logs `/api/admin/chat-logs/latest` debe requerir `INGENIO_CHAT_LOG_VIEW_TOKEN`; no exponer ese token ni guardarlo en frontend.
- El modelo solo debe recibir contexto desde la allowlist `backend/knowledge/public/` y `backend/knowledge/policies/`; no cargar `docs/`, `front/`, `logs/` ni todo el repo como conocimiento.
- Si se detecta un secreto en texto plano, no reproducirlo: indicar archivo/riesgo y recomendar rotacion.
- Para secretos sensibles o productivos, preferir secret manager o `/Users/fabian/.agent-secrets/with-secrets.sh` segun `/Users/fabian/docs/agent-secret-management.md`.

## Flujo de desarrollo local

```bash
# 1. Asegurar que INGENIO_LLM_API_KEY este en .env
# 2. Levantar backend
docker compose up -d

# 3. Servir frontend (otra terminal)
cd front && python3 -m http.server 8000

# 4. Abrir http://localhost:8000
```

Sin Docker: ver `backend/README.md`.

## Verificacion minima
- Abrir `http://localhost:8000` con frontend servido.
- Probar comandos principales: `HELP`, `DIAGNOSE`, `STACK`, `ABOUT`, `CONTACT`, `THEME`, `SOUND`, `CLEAR`, `REBOOT`.
- Verificar `/health` del backend: `curl http://127.0.0.1:8080/health`.
- Revisar responsive en ancho movil y desktop.
- Confirmar consola del navegador sin errores.

## Documentacion
- Todo cambio funcional debe actualizar esta especificacion o agregar documentacion en `docs/` cuando corresponda.
- Si se modifica el comportamiento esperado para agentes, sincronizar tambien `CLAUDE.md`, `CODEX.md` y, si se conserva como alias, `CHATGPT.md`.
