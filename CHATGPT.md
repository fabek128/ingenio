# ChatGPT Codex - INGENIO/64

Alias historico para ChatGPT Codex. La especificacion principal de Codex es `CODEX.md`; mantener este archivo sincronizado con `AGENTS.md`, `CLAUDE.md` y `CODEX.md` mientras exista.

## Objetivo
Mantener y evolucionar INGENIO/64, un sitio personal con UI de terminal retro inspirada en Commodore 64. La vision objetivo esta en `docs/ingenio-agentic-site-spec.md`: consola agentica para compartir experiencias diarias con IA, conectada a un backend FastAPI con modelo via OpenCode Zen API.

## Mapa rapido
- `front/index.html`: estructura HTML, estilos CSS, root y carga de React/scripts.
- `front/app.jsx`: aplicacion React, boot screen, header, comandos, bloques e interacciones.
- `front/content.jsx`: fuente principal de contenido editable.
- `front/assets/` y `front/uploads/`: recursos graficos.
- `backend/app/main.py`: API, sesiones, CSRF, rate limit y llamada al modelo.
- `backend/app/chat_logs.py`: logging seguro de interacciones del agente con rotacion y compresion.
- `logs/chat/`: salida runtime de conversaciones del agente; ignorada por Git y nunca debe versionarse.

## Consulta de documentacion
- Antes de implementar, modificar arquitectura o responder sobre el funcionamiento del proyecto, revisar la documentacion relevante en `docs/`.
- Priorizar `docs/ingenio-agentic-site-spec.md`, `docs/backend-specification.md`, `docs/backend-tutorial.md` y `docs/agent-specifications.md` segun la tarea.
- Si una decision tecnica contradice `docs/`, actualizar la documentacion en el mismo cambio o explicar explicitamente la desviacion.

## Forma de trabajo
1. Inspeccionar primero el estado local (`git status`, archivos relevantes, `docs/` y diffs existentes).
2. Respetar cambios no commiteados del usuario.
3. Implementar cambios concretos con diffs pequenos.
4. Documentar todo cambio funcional.
5. Ejecutar verificaciones razonables disponibles; si no hay tests automatizados, indicar prueba manual sugerida/realizada.

## Criterios tecnicos
- No agregar dependencias ni tooling nuevo sin justificacion y aprobacion.
- Mantener compatibilidad con frontend estatico sin build step.
- Centralizar contenido en `front/content.jsx` cuando sea posible.
- Registrar comandos nuevos en `COMMANDS_META` y probar su ejecucion.
- Mantener la experiencia accesible: teclado, foco, contraste y atributos ARIA en controles custom.

## Seguridad
- Jamas exponer keys, tokens, passwords, credenciales, URLs privadas ni informacion sensible en el repo, prompts, logs, commits, PRs o respuestas.
- Usar `.env` solo para configuracion local/desarrollo y mantenerlo ignorado por Git.
- Versionar solamente nombres de variables y valores no sensibles en `.env.example`.
- No copiar valores de `logs/chat/` a documentacion, issues, commits o respuestas. Si se inspeccionan logs, resumir sin reproducir secretos ni datos sensibles.
- El endpoint de lectura de logs `/api/admin/chat-logs/latest` debe requerir `INGENIO_CHAT_LOG_VIEW_TOKEN`; no exponer ese token ni guardarlo en frontend.
- Si se detecta un secreto en texto plano, no reproducirlo: indicar archivo/riesgo y recomendar rotacion.
- Para secretos sensibles o productivos, preferir secret manager o `/Users/fabian/.agent-secrets/with-secrets.sh` segun `/Users/fabian/docs/agent-secret-management.md`.
- Evitar HTML dinamico inseguro; no introducir `dangerouslySetInnerHTML` sin sanitizacion.
- Revisar enlaces externos, formularios y cualquier futura integracion para evitar fuga de datos o inyeccion.
- Pedir confirmacion antes de deploys, borrados, rotacion de secretos, cambios de permisos o acciones contra produccion.

## Sincronizacion multiagente
Si se agrega una nueva regla, feature esperada o comportamiento requerido para agentes, actualizar en el mismo cambio:
- `AGENTS.md` para OpenCode/agentes compatibles.
- `CLAUDE.md` para Claude Code.
- `CODEX.md` para ChatGPT Codex.
- `CHATGPT.md` como alias historico si se conserva.
