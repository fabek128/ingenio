# INGENIO/64 - Deploy con GitHub Actions y Dokploy

Fecha: 2026-05-26

## Objetivo

Automatizar el deploy de INGENIO/64 desde GitHub Actions sin guardar secretos en el repo.

El workflow versionado esta en:

```text
.github/workflows/deploy.yml
```

## Flujo

```text
push a main / workflow_dispatch
  -> checkout
  -> instalar dependencias backend
  -> correr tests
  -> llamar API de Dokploy
  -> disparar deploy de la aplicacion
  -> smoke test opcional
```


## Configuracion productiva aplicada

El deploy productivo queda configurado con un recurso Compose en Dokploy:

```text
Project: ingenio_uno_web
Environment: production
Compose: ingenio-portal
Source: https://github.com/fabek128/ingenio
Compose file: docker-compose.dokploy.yml
Public service: ingenio-front:80
```

La app vieja `ingenio-uno-site` queda conservada en Dokploy, pero el dominio principal se mueve al Compose `ingenio-portal`.

No guardar IDs reales ni tokens en docs o commits. Los IDs viven como GitHub Actions secrets.

## Precondicion importante

El Compose que reciba `DOKPLOY_COMPOSE_ID` debe apuntar a este repo y a `docker-compose.dokploy.yml`.

Si en el futuro se vuelve a usar una Application individual, confirmar que esa app este conectada al mismo codigo que dispara GitHub Actions o a una imagen Docker construida desde este repo. Si no, `application.deploy` solo redeploya lo que Dokploy ya tenga configurado.

## Secrets requeridos en GitHub

Configurar en:

```text
GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Secrets obligatorios:

```text
DOKPLOY_API_URL
DOKPLOY_API_TOKEN
DOKPLOY_COMPOSE_ID
```

Fallback opcional si se abandona Compose y se vuelve a una Application individual:

```text
DOKPLOY_APPLICATION_ID
```

Secrets opcionales:

```text
DOMAIN_INGENIO
SMOKE_TEST_URL
```

`SMOKE_TEST_URL` tiene prioridad sobre `DOMAIN_INGENIO`. Si no se define ninguno, el workflow saltea el smoke test.

## Como obtener `DOKPLOY_APPLICATION_ID` o `DOKPLOY_COMPOSE_ID`

Usar la API de Dokploy o la UI.

- Si usas Application individual, buscar `ingenio-uno-site` o `ingenio-api` y guardar el ID en `DOKPLOY_APPLICATION_ID`.
- Si usas Compose, crear el stack basado en `docker-compose.dokploy.yml` y guardar el ID en `DOKPLOY_COMPOSE_ID`.

No escribir IDs reales en docs ni commits.

## Seguridad

- No usar `DOKPLOY_PASSWORD` en GitHub Actions.
- No usar `LOCAL_PASSWORD` en GitHub Actions.
- No guardar `INGENIO_LLM_API_KEY` en GitHub salvo que el build lo requiera. Para runtime debe vivir en Dokploy.
- El workflow usa `x-api-key` contra Dokploy y no imprime el token.
- Los valores de test (`INGENIO_LLM_API_KEY`, `INGENIO_SESSION_SECRET`) son dummy y solo sirven para importar la app durante tests.

## Endpoint usado

El workflow llama uno de estos endpoints:

```text
POST /api/compose.deploy       # si existe DOKPLOY_COMPOSE_ID
POST /api/application.deploy   # fallback si existe DOKPLOY_APPLICATION_ID
```

Bodies:

```json
{"composeId":"<secret>"}
```

```json
{
  "applicationId": "<secret>",
  "title": "GitHub Actions deploy",
  "description": "Commit <sha>"
}
```

## Fuentes

- Dokploy Application API: https://docs.dokploy.com/docs/api/reference-application
- Dokploy Compose API: https://docs.dokploy.com/docs/api/generated/reference-compose
- Dokploy Auto Deploy: https://docs.dokploy.com/docs/core/auto-deploy
