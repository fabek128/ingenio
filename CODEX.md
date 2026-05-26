# ChatGPT Codex - INGENIO/64

Instrucciones locales para ChatGPT Codex en este repo. Este archivo complementa `AGENTS.md` y debe mantenerse sincronizado con `CLAUDE.md` y las instrucciones de OpenCode.

## Objetivo
Mantener y evolucionar un sitio frontend estatico llamado INGENIO/64, con UI de terminal retro inspirada en Commodore 64, orientado a servicios de IA, agentes, automatizacion y software a medida.

## Mapa rapido
- `front/index.html`: estructura HTML, estilos CSS, root y carga de React/scripts.
- `front/app.jsx`: aplicacion React, boot screen, header, comandos, estado de UI y bloques interactivos.
- `front/content.jsx`: fuente principal de contenido editable: servicios, casos, stack, about, diagnostico y metadata de comandos.
- `front/assets/` y `front/uploads/`: recursos graficos.
- `docs/`: documentacion del proyecto y notas operativas.

## Forma de trabajo para Codex
1. Inspeccionar primero contexto local: `git status`, archivos relevantes, README/docs e instrucciones de agentes.
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
- No exponer secretos, tokens, claves API, URLs privadas ni datos personales sensibles.
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
