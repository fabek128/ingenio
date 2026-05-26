# ChatGPT Codex - INGENIO/64

Instrucciones locales para ChatGPT Codex en este repo. Mantener sincronizadas con `AGENTS.md` y `CLAUDE.md`.

## Objetivo
Mantener y evolucionar un sitio frontend estatico llamado INGENIO/64, con UI de terminal retro inspirada en Commodore 64, orientado a servicios de IA, agentes, automatizacion y software a medida.

## Mapa rapido
- `front/index.html`: estructura HTML, estilos CSS, root y carga de React/scripts.
- `front/app.jsx`: aplicacion React, boot screen, header, comandos, bloques e interacciones.
- `front/content.jsx`: fuente principal de contenido editable.
- `front/assets/` y `front/uploads/`: recursos graficos.

## Forma de trabajo
1. Inspeccionar primero el estado local (`git status`, archivos relevantes y diffs existentes).
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
- No exponer secretos ni informacion sensible.
- Evitar HTML dinamico inseguro; no introducir `dangerouslySetInnerHTML` sin sanitizacion.
- Revisar enlaces externos, formularios y cualquier futura integracion para evitar fuga de datos o inyeccion.
- Pedir confirmacion antes de deploys, borrados, rotacion de secretos, cambios de permisos o acciones contra produccion.

## Sincronizacion multiagente
Si se agrega una nueva regla, feature esperada o comportamiento requerido para agentes, actualizar en el mismo cambio:
- `AGENTS.md` para OpenCode/agentes compatibles.
- `CLAUDE.md` para Claude Code.
- `CHATGPT.md` para ChatGPT Codex.
