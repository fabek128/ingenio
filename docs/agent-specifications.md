# Especificaciones multiagente

Este proyecto mantiene instrucciones equivalentes para tres entornos de agentes:

- `AGENTS.md`: OpenCode y agentes compatibles con el formato AGENTS.
- `CLAUDE.md`: Claude Code.
- `CODEX.md`: ChatGPT Codex.
- `CHATGPT.md`: alias/documento historico para ChatGPT si existe.

## Regla de mantenimiento
Cuando una instruccion afecte como deben trabajar los agentes en este repo, debe agregarse o actualizarse en los tres archivos. Esto evita comportamientos distintos entre herramientas.

## Documentos relacionados
- `docs/ingenio-agentic-site-spec.md`: analisis del proyecto, vision de producto, arquitectura objetivo y plan de backend local con Ollama.
- `docs/backend-tutorial.md`: guia paso a paso para construir y operar el backend pequeno.
- `docs/backend-specification.md`: requisitos, arquitectura y seguridad del backend agentico.

## Politica de secretos
- `.env` es local y esta ignorado por Git.
- `.env.example` puede versionarse solo con nombres de variables y valores no sensibles.
- Ningun agente debe escribir, imprimir ni commitear keys, tokens, passwords, credenciales o URLs privadas.
- Para secretos sensibles o productivos, aplicar `/Users/fabian/docs/agent-secret-management.md` y preferir secret manager o `/Users/fabian/.agent-secrets/with-secrets.sh`.

## Alcance actual
Las especificaciones cubren:
- Contexto y estructura del frontend estatico INGENIO/64.
- Convenciones de estilo y contenido.
- Reglas para agregar comandos/interacciones.
- Seguridad basica: secretos, HTML dinamico, integraciones y acciones destructivas.
- Verificacion minima antes de finalizar cambios.
