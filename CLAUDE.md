# Claude - INGENIO/64

Instrucciones para Claude Code trabajando en este repo. Mantener sincronizado con `AGENTS.md` y `CHATGPT.md`.

## Proyecto
Frontend estatico con estetica Commodore 64 / terminal CRT para presentar servicios de IA, agentes, automatizacion y software a medida.

## Archivos clave
- `front/index.html`: documento principal, CSS y carga de scripts.
- `front/app.jsx`: componentes React, comandos, estado de UI y bloques interactivos.
- `front/content.jsx`: textos, servicios, casos, stack, diagnostico y comandos mostrados al usuario.
- `front/assets/`, `front/uploads/`: imagenes.

## Convenciones
- Responder y escribir documentacion en espanol neutro.
- Preservar el tono visual retro: uppercase, mensajes cortos, monoespaciado y comandos tipo terminal.
- Evitar tildes en textos visibles cuando el bloque use estilo terminal/uppercase ya existente.
- No introducir dependencias, build system, backend ni integraciones externas sin pedir confirmacion.
- Preferir editar contenido en `front/content.jsx` antes que mezclar textos dentro de componentes.
- Mantener componentes simples, sin abstracciones innecesarias.

## Seguridad
- No commitear secretos, tokens, claves API, URLs internas ni datos personales sensibles.
- Validar toda entrada de usuario antes de reutilizarla en enlaces, HTML o integraciones futuras.
- No usar `dangerouslySetInnerHTML` salvo necesidad justificada y sanitizacion explicita.
- Para acciones destructivas, deploys o cambios de infraestructura, pedir confirmacion previa.

## Checklist antes de finalizar
1. `git diff` revisado.
2. Cambios funcionales documentados.
3. `front/index.html` probado localmente o mediante servidor estatico.
4. Comandos afectados probados manualmente.
5. Consola del navegador sin errores nuevos.
6. Si cambian reglas para agentes, actualizar tambien `AGENTS.md` y `CHATGPT.md`.
