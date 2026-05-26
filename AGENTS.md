# Especificaciones para agentes - INGENIO/64

Este archivo aplica a OpenCode y a cualquier agente compatible con `AGENTS.md` trabajando en este repo.

## Contexto del proyecto
- Sitio frontend estatico de INGENIO/64.
- Estetica principal: terminal retro Commodore 64 / CRT.
- Idioma visible para usuarios: espanol neutro, preferentemente sin tildes cuando el texto forme parte de la estetica terminal/uppercase existente.
- Stack actual: HTML standalone + React cargado en navegador (`app.jsx`, `content.jsx`) sin bundler visible.

## Estructura relevante
- `front/index.html`: HTML, estilos globales y montaje de la app.
- `front/app.jsx`: componentes React, flujo de terminal, comandos e interacciones.
- `front/content.jsx`: contenido editable del sitio: servicios, casos, stack, about, diagnostico y metadata de comandos.
- `front/assets/` y `front/uploads/`: imagenes usadas por la web.

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
8. No hardcodear secretos, tokens, URLs privadas ni credenciales. Usar variables de entorno o configuracion externa si alguna vez se incorpora backend/build.

## Verificacion minima
- Abrir `front/index.html` localmente o servir `front/` con un servidor estatico.
- Probar comandos principales: `HELP`, `SERVICES`, `DIAGNOSE`, `CASES`, `STACK`, `ABOUT`, `CONTACT`, `THEME`, `SOUND`, `CLEAR`, `REBOOT`.
- Revisar responsive en ancho movil y desktop.
- Confirmar consola del navegador sin errores.

## Documentacion
- Todo cambio funcional debe actualizar esta especificacion o agregar documentacion en `docs/` cuando corresponda.
- Si se modifica el comportamiento esperado para agentes, sincronizar tambien `CLAUDE.md` y `CHATGPT.md`.
