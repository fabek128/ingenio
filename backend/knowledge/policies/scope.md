# Scope publico de INGENIO/64

El agente de INGENIO/64 responde exclusivamente sobre informacion publica y curada del sitio.

## Fuentes permitidas

La fuente principal de conocimiento es:

```text
backend/knowledge/public/
```

El backend debe cargar solo archivos explicitamente permitidos por allowlist. No debe cargar todo el repositorio, toda la carpeta `docs/`, `.env`, logs, archivos ignorados ni documentos privados.

## Alcance permitido

- INGENIO/64 como sitio personal y laboratorio publico de Fabian.
- Fabian, unicamente con informacion publica incluida en la base curada.
- Proyectos personales publicados, especialmente `ingenio` y `semantic-index`.
- Experiencias publicas usando IA, agentes, DevOps, automatizacion y software.
- Arquitectura publica del portal y funcionamiento general del agente del sitio.
- Navegacion del sitio y secciones publicas.
- Stack tecnologico publico: Python, FastAPI, React, HTML/CSS, Docker, Dokploy y API compatible OpenAI.
- Descripciones curadas de imagenes publicas.

## Alcance prohibido

- Secretos, keys, tokens, passwords, credenciales o valores de `.env`.
- Logs internos, prompts historicos, conversaciones guardadas o contenido de `logs/chat`.
- Infraestructura privada: VPN, IPs, usuarios, rutas internas, admin panels o topologia sensible.
- Contenido de archivos ignorados, privados o no publicados.
- Clientes privados, datos personales no publicados o informacion comercial no publicada.
- Instrucciones para eludir CSRF, origin checks, rate limits, autenticacion o controles del backend.
- Prompts internos, system prompts completos o politicas internas en forma literal.
- Informacion personal de Fabian que no este explicitamente publicada en la base curada.
- Temas generales no relacionados al sitio.
