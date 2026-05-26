# INGENIO/64 - Portal frontend agentico

Fecha: 2026-05-26

## Objetivo

Redisenar el frontend existente para que INGENIO/64 sea un sitio personal tipo consola agentica, no solo una landing comercial.

## Cambios funcionales

- Home reorientado a diario personal de IA.
- Nuevos comandos:
  - `EXPERIENCIAS`: bitacora de uso real de IA.
  - `PROYECTOS`: proyectos personales en curso, cargados desde Markdown.
  - `AGENT`: envia una pregunta libre al backend.
  - `MODEL`: consulta metadata publica del backend.
- Preguntas no reconocidas dejan de terminar en `?SYNTAX ERROR` y pasan a `/api/chat`.
- El frontend inicializa sesion con `/api/session`, guarda CSRF en memoria y llama `/api/chat` con cookie HttpOnly + `X-Ingenio-CSRF`.
- En desarrollo local, si el frontend se sirve en `localhost:8000`, la API se busca en `http://127.0.0.1:8080`.
- En produccion, la API se llama por mismo origen usando `/api/*`.
- La seccion `PROYECTOS` lee `front/secciones/proyectos/proyectos.md` en runtime con `fetch`, para editar contenido sin tocar componentes React.

## Integracion prompt -> backend -> web

La entrada inferior funciona como prompt y como consola de comandos:

1. El usuario escribe texto en la barra inferior.
2. Si el primer token coincide con un comando local (`HELP`, `PROYECTOS`, `MODEL`, etc.), se abre la vista local.
3. Si el texto no coincide con un comando, el frontend lo trata como prompt libre.
4. El frontend llama `GET /api/session` si todavia no tiene CSRF en memoria.
5. El frontend llama `POST /api/chat` con:

```http
Content-Type: application/json
X-Ingenio-CSRF: <token-en-memoria>
Cookie: ingenio_session=<cookie-httponly>
```

Body:

```json
{"message":"<prompt del usuario>"}
```

6. Mientras espera respuesta, la entrada inferior queda bloqueada y la vista muestra `STATUS: CONECTANDO CON BACKEND`.
7. Cuando responde el backend, la web renderiza:

```text
PROMPT:
> <texto del usuario>

MODEL: <modelo reportado por backend>

RESPUESTA:
<respuesta del modelo>
```

El comando explícito `AGENT <pregunta>` usa el mismo flujo. `AGENT` sin argumentos usa una pregunta por defecto.

## Seguridad

- El frontend no contiene API keys ni secretos.
- El token CSRF se mantiene en memoria, no en localStorage.
- La cookie de sesion la maneja el backend como HttpOnly.
- Las respuestas del modelo se renderizan como texto React, sin `dangerouslySetInnerHTML`.
- Errores del backend se normalizan a mensajes de consola sin filtrar detalles internos.

## Requisitos de backend

El backend debe exponer:

```text
GET  /api/session
GET  /api/site-context
POST /api/chat
GET  /health
```

Y debe aceptar CORS desde `INGENIO_ALLOWED_ORIGIN` durante desarrollo.

## Validacion manual

1. Levantar backend:

```bash
cd backend
PYTHONPATH="$PWD" uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

2. Servir frontend:

```bash
cd front
python3 -m http.server 8000
```

3. Abrir:

```text
http://localhost:8000
```

4. Probar comandos:

```text
HELP
EXPERIENCIAS
PROYECTOS
MODEL
AGENT Como usas IA todos los dias?
```

5. Probar pregunta libre:

```text
Que estas construyendo con INGENIO/64?
```

## Docker / deploy

El frontend ahora incluye:

```text
front/Dockerfile
front/nginx.conf
front/.dockerignore
```

`front/nginx.conf` sirve los archivos estaticos y proxya internamente:

```text
/       -> frontend estatico
/api/*  -> http://ingenio-api:8080/api/*
/health -> http://ingenio-api:8080/health
```

## Nota de deploy

La app existente en Dokploy se detecto como frontend estatico `ingenio-uno-site`. Para produccion hay dos caminos:

1. Crear un Compose nuevo usando `docker-compose.dokploy.yml` y publicar el dominio sobre `ingenio-front:80`.
2. Mantener app frontend separada y agregar `ingenio-api`, configurando routing equivalente.

El camino recomendado para el portal completo es `docker-compose.dokploy.yml`.


## Error esperado si el modelo no emite texto

Si el backend recibe una respuesta valida del proveedor pero sin texto final, devuelve `502 model_empty_response`.
El frontend lo muestra como error del agente para no confundir una falla del proveedor con una respuesta real del modelo.
