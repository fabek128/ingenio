# Especificaciones multiagente

Este proyecto mantiene instrucciones equivalentes para tres entornos de agentes:

- `AGENTS.md`: OpenCode y agentes compatibles con el formato AGENTS.
- `CLAUDE.md`: Claude Code.
- `CODEX.md`: ChatGPT Codex.
- `CHATGPT.md`: alias/documento historico para ChatGPT si existe.

## Regla de mantenimiento
Cuando una instruccion afecte como deben trabajar los agentes en este repo, debe agregarse o actualizarse en los tres archivos. Esto evita comportamientos distintos entre herramientas.

## Alcance actual
Las especificaciones cubren:
- Contexto y estructura del frontend estatico INGENIO/64.
- Convenciones de estilo y contenido.
- Reglas para agregar comandos/interacciones.
- Seguridad basica: secretos, HTML dinamico, integraciones y acciones destructivas.
- Verificacion minima antes de finalizar cambios.
