# Claude - INGENIO/64

Instrucciones para Claude Code trabajando en este repo. Mantener sincronizado con `AGENTS.md`, `CODEX.md` y, si se conserva como alias, `CHATGPT.md`.

## Proyecto
Frontend estatico con estetica Commodore 64 / terminal CRT. La vision objetivo esta en `docs/ingenio-agentic-site-spec.md`: sitio personal tipo consola agentica para compartir experiencias diarias con IA, conectado a un backend FastAPI con modelo via OpenCode Zen API.

## Archivos clave
- `front/index.html`: documento principal, CSS y carga de scripts.
- `front/app.jsx`: componentes React, comandos, estado de UI y bloques interactivos.
- `front/content.jsx`: textos, servicios, casos, stack, diagnostico y comandos mostrados al usuario.
- `front/assets/`, `front/uploads/`: imagenes.
- `backend/app/main.py`: API, sesiones, CSRF, rate limit y llamada al modelo.
- `backend/app/chat_logs.py`: logging seguro de interacciones del agente con rotacion y compresion.
- `logs/chat/`: salida runtime de conversaciones del agente; ignorada por Git y nunca debe versionarse.

## Consulta de documentacion
- Antes de implementar, modificar arquitectura o responder sobre el funcionamiento del proyecto, revisar la documentacion relevante en `docs/`.
- Priorizar `docs/ingenio-agentic-site-spec.md`, `docs/backend-specification.md`, `docs/backend-tutorial.md` y `docs/agent-specifications.md` segun la tarea.
- Si una decision tecnica contradice `docs/`, actualizar la documentacion en el mismo cambio o explicar explicitamente la desviacion.

## Convenciones
- Responder y escribir documentacion en espanol neutro.
- Preservar el tono visual retro: uppercase, mensajes cortos, monoespaciado y comandos tipo terminal.
- Evitar tildes en textos visibles cuando el bloque use estilo terminal/uppercase ya existente.
- No introducir dependencias, build system, backend ni integraciones externas sin pedir confirmacion.
- Preferir editar contenido en `front/content.jsx` antes que mezclar textos dentro de componentes.
- Mantener componentes simples, sin abstracciones innecesarias.

## Seguridad
- Jamas commitear ni exponer keys, tokens, passwords, credenciales, URLs internas ni datos personales sensibles.
- Usar `.env` solo para configuracion local/desarrollo y mantenerlo ignorado por Git.
- Versionar solamente nombres de variables y valores no sensibles en `.env.example`.
- No copiar valores de `logs/chat/` a documentacion, issues, commits o respuestas. Si se inspeccionan logs, resumir sin reproducir secretos ni datos sensibles.
- El endpoint de lectura de logs `/api/admin/chat-logs/latest` debe requerir `INGENIO_CHAT_LOG_VIEW_TOKEN`; no exponer ese token ni guardarlo en frontend.
- Si se detecta un secreto en texto plano, no reproducirlo: indicar archivo/riesgo y recomendar rotacion.
- Para secretos sensibles o productivos, preferir secret manager o `/Users/fabian/.agent-secrets/with-secrets.sh` segun `/Users/fabian/docs/agent-secret-management.md`.
- Validar toda entrada de usuario antes de reutilizarla en enlaces, HTML o integraciones futuras.
- No usar `dangerouslySetInnerHTML` salvo necesidad justificada y sanitizacion explicita.
- Para acciones destructivas, deploys o cambios de infraestructura, pedir confirmacion previa.

## Checklist antes de finalizar
1. `git diff` revisado.
2. Cambios funcionales documentados.
3. `front/index.html` probado localmente o mediante servidor estatico.
4. Comandos afectados probados manualmente.
5. Consola del navegador sin errores nuevos.
6. Si cambian reglas para agentes, actualizar tambien `AGENTS.md`, `CODEX.md` y, si se conserva como alias, `CHATGPT.md`.
