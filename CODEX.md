# ChatGPT Codex - INGENIO/64

Instrucciones locales para ChatGPT Codex en este repo. Este archivo complementa `AGENTS.md` y debe mantenerse sincronizado con `CLAUDE.md` y las instrucciones de OpenCode.

## Objetivo
Mantener y evolucionar INGENIO/64, un sitio personal con UI de terminal retro inspirada en Commodore 64. La vision objetivo esta en `docs/ingenio-agentic-site-spec.md`: consola agentica para compartir experiencias diarias con IA, conectada a un backend FastAPI con modelo via OpenCode Zen API.

## Mapa rapido
- `front/index.html`: estructura HTML, estilos CSS, root y carga de React/scripts.
- `front/app.jsx`: aplicacion React, boot screen, header, comandos, estado de UI y bloques interactivos.
- `front/content.jsx`: fuente principal de contenido editable: servicios, casos, stack, about, diagnostico y metadata de comandos.
- `front/secciones/`: Markdown publico de secciones renderizadas en runtime (`about`, `proyectos`, `agentes`).
- `front/assets/` y `front/uploads/`: recursos graficos.
- `backend/app/main.py`: API, sesiones, CSRF, rate limit y llamada al modelo.
- `backend/app/chat_logs.py`: logging seguro de interacciones del agente emitido como JSON a stdout.
- `backend/knowledge/public/`: base de conocimiento publica, curada y versionada que el modelo puede usar.
- `backend/knowledge/policies/`: politicas versionadas de alcance y rechazos.

- `docs/private/`: documentacion privada; excluida del repo y del contexto de agentes.
- `docs/`: documentacion del proyecto y notas operativas.

## Consulta de documentacion
- Antes de implementar, modificar arquitectura o responder sobre el funcionamiento del proyecto, revisar la documentacion relevante en `docs/`.
- Priorizar `docs/ingenio-agentic-site-spec.md`, `docs/backend-specification.md`, `docs/backend-tutorial.md` y `docs/agent-specifications.md` segun la tarea.
- Si una decision tecnica contradice `docs/`, actualizar la documentacion en el mismo cambio o explicar explicitamente la desviacion.

## Forma de trabajo para Codex
1. Inspeccionar primero contexto local: `git status`, archivos relevantes, `docs/`, README e instrucciones de agentes.
2. Respetar cambios no commiteados del usuario; no sobrescribirlos sin confirmacion.
3. Implementar cambios concretos con diffs pequenos y revisables.
4. Documentar todo cambio funcional en `docs/` o en las instrucciones locales si afecta a agentes.
5. Ejecutar verificaciones razonables disponibles; si no hay tests automatizados, indicar prueba manual realizada o sugerida.
6. Al finalizar, resumir archivos tocados y verificacion ejecutada.

## Criterios tecnicos
- No agregar dependencias, bundlers, frameworks, backend ni servicios externos sin justificacion y aprobacion.
- Mantener compatibilidad con frontend estatico sin build step.
- Centralizar textos y contenido comercial en `front/content.jsx` siempre que sea posible.
- Para comandos nuevos:
  - implementar logica en `front/app.jsx`;
  - registrar ayuda en `COMMANDS_META` dentro de `front/content.jsx`;
  - probar ejecucion por comando escrito y por click cuando aplique.
- Mantener la experiencia accesible: teclado, foco visible, contraste y atributos ARIA en controles custom.
- Preservar estetica retro: monoespaciado, bloques tipo terminal, comandos en uppercase y feedback breve.

## Seguridad
- Jamas exponer keys, tokens, passwords, credenciales, URLs privadas ni datos personales sensibles en el repo, prompts, logs, commits, PRs o respuestas.
- Usar `.env` solo para configuracion local/desarrollo y mantenerlo ignorado por Git.
- Versionar solamente nombres de variables y valores no sensibles en `.env.example`.
- No copiar valores de logs de interacciones a documentacion, issues, commits o respuestas. Si se inspeccionan logs, resumir sin reproducir secretos ni datos sensibles.
- El modelo solo debe recibir contexto desde la allowlist `backend/knowledge/public/` y `backend/knowledge/policies/`; no cargar `docs/`, `front/`, `logs/` ni todo el repo como conocimiento.
- Si se detecta un secreto en texto plano, no reproducirlo: indicar archivo/riesgo y recomendar rotacion.
- Para secretos sensibles o productivos, preferir secret manager o `/Users/fabian/.agent-secrets/with-secrets.sh` segun `/Users/fabian/docs/agent-secret-management.md`.
- Evitar HTML dinamico inseguro; no introducir `dangerouslySetInnerHTML` sin sanitizacion explicita.
- Validar cualquier entrada de usuario antes de reutilizarla en enlaces, HTML o integraciones futuras.
- Revisar enlaces externos, formularios y cualquier futura integracion para evitar fuga de datos o inyeccion.
- Pedir confirmacion antes de deploys, borrados, rotacion de secretos, cambios de permisos, cambios de infraestructura o acciones contra produccion.

## Sincronizacion multiagente
Si se agrega una nueva regla, feature esperada o comportamiento requerido para agentes, actualizar en el mismo cambio:
- `AGENTS.md` para OpenCode/agentes compatibles.
- `CLAUDE.md` para Claude Code.
- `CODEX.md` para ChatGPT Codex.

`CHATGPT.md` queda como alias/documento historico si existe, pero `CODEX.md` es la especificacion explicita para ChatGPT Codex.
