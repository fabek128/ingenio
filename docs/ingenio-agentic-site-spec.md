# INGENIO/64 - Analisis del proyecto y especificacion del sitio agentico

Fecha de analisis: 2026-05-26  
Estado: borrador tecnico / producto


## Documentos derivados

- `docs/backend-specification.md`: especificacion tecnica del backend, dependencias, API, seguridad y operacion como servicio.
- `docs/backend-tutorial.md`: tutorial paso a paso para implementar el backend pequeno con FastAPI y Ollama.
- `docs/github-actions-deploy.md`: pipeline de deploy con GitHub Actions y Dokploy.
- `docs/frontend-agentic-portal.md`: adaptacion del frontend al nuevo portal agentico.


## Nota de implementacion actual

El proyecto evoluciono desde la idea inicial de Ollama/Gemma local hacia un backend FastAPI que usa OpenCode Zen API (`deepseek-v4-flash-free`) via variable `INGENIO_LLM_API_KEY`. Las secciones historicas sobre Ollama quedan como alternativa futura/laboratorio local, pero el camino activo de deploy es:

```text
frontend Nginx -> backend FastAPI -> OpenCode Zen API
```

Para deploy actual, priorizar `docker-compose.dokploy.yml`, `docs/frontend-agentic-portal.md` y `docs/github-actions-deploy.md`.

## 1. Vision del proyecto

INGENIO/64 es un sitio personal de Fabian para compartir experiencias reales con inteligencia artificial: como usa IA todos los dias, que herramientas prueba, que aprendizajes obtiene, que automatizaciones construye y que criterios tecnicos aplica.

La interfaz debe sentirse como una consola agentica retro: una terminal estilo Commodore 64 / CRT donde el visitante pueda escribir comandos, hacer preguntas y navegar contenido como si estuviera conversando con un agente local del sitio.

No debe sentirse como un landing generico de servicios. El foco principal pasa a ser:

- Experiencias personales con IA.
- Uso diario de agentes, modelos y herramientas.
- Aprendizajes tecnicos explicados de forma practica.
- Proyectos, experimentos y casos reales.
- Una consola interactiva que ayude a explorar ese contenido.

## 2. Estado actual del repo

El repo contiene principalmente un frontend estatico dentro de `front/` y documentacion multiagente en la raiz/docs.

### 2.1 Estructura actual

```text
.
├── AGENTS.md
├── CLAUDE.md
├── CODEX.md
├── CHATGPT.md
├── docs/
│   ├── agent-specifications.md
│   └── ingenio-agentic-site-spec.md
└── front/
    ├── index.html
    ├── app.jsx
    ├── content.jsx
    ├── assets/
    │   └── fabian-profile.jpg
    └── uploads/
        ├── Tggroups_editor.png
        ├── c64-asm-assemble.png
        ├── c64-asm-prg1.png
        ├── c64screen.jpg
        ├── fabian-profile.jpg
        └── g06.png
```

### 2.2 Frontend actual

#### `front/index.html`

- HTML standalone.
- CSS completo embebido.
- Carga fuentes desde Google Fonts.
- Carga React, ReactDOM y Babel desde CDN (`unpkg`).
- Carga `content.jsx` y `app.jsx` como `text/babel`.
- No hay bundler, `package.json`, Vite, Next.js ni build step.

Implicacion: el proyecto hoy es muy simple de servir como estatico, pero usa React development build + Babel en navegador. Para MVP esta bien; para produccion conviene reemplazar por build precompilado o al menos React production build.

#### `front/content.jsx`

Es la fuente principal de datos editables:

- `STACK`: stack tecnico mostrado.
- `ABOUT_PROFILE`: perfil personal.
- `ABOUT_LINES`: bloque tipo archivo terminal.
- `DIAGNOSTIC`: wizard guiado de diagnostico.
- `COMMANDS_META`: comandos disponibles.
- `HERO`: textos principales.
- `MODELS`: selector decorativo de modelos.

Implicacion: para contenido nuevo conviene seguir centralizando aca antes de tocar componentes.

#### `front/app.jsx`

Implementa la aplicacion React:

- Boot screen retro.
- Header con estado, selector de modelo y selector de tema.
- Command bar con historial, autocompletado y botones rapidos.
- Heuristica simple de intenciones en lenguaje natural.
- Vistas: home, help, stack, about, diagnostico, contact y respuestas genericas.
- Formulario de contacto simulado: no envia datos reales.
- Selector de modelo solo cambia estado local; no esta conectado a backend.
- Comandos `WHATSAPP` y `AGENDAR` muestran placeholders, no abren enlaces reales.

Implicacion: la UX de consola ya existe. Falta convertir el input en una conversacion real con backend/LLM y convertir placeholders en integraciones reales.

### 2.3 Recursos graficos

- Perfil de Fabian en `front/assets/fabian-profile.jpg` y duplicado en `front/uploads/fabian-profile.jpg`.
- Imagenes retro/proyectos en `front/uploads/`.

Riesgo menor: hay duplicacion de imagen de perfil. No es critico, pero conviene limpiar cuando se ordene contenido.

## 3. Brecha entre estado actual y objetivo

| Area | Estado actual | Objetivo |
|---|---|---|
| UI consola | Implementada | Mantener y ampliar |
| Comandos | Estan hardcodeados | Agregar comandos de experiencias y chat real |
| LLM | No existe | Backend llama a modelo local pequeno |
| Selector modelo | Decorativo | Debe reflejar modelo real/configuracion |
| Contacto | Simulado | Backend o proveedor externo con validacion |
| Contenido personal IA | Parcial/comercial | Convertirlo en bitacora personal de IA |
| Persistencia | No hay | Inicialmente no requerida; luego posts/RAG |
| Deploy | No definido | Front estatico + API + runtime LLM como servicio |
| Seguridad | Sin backend, bajo riesgo actual | Endurecer al exponer API publica |

## 4. Arquitectura objetivo

### 4.1 Diagrama logico

```text
[Browser]
   |
   | HTTPS
   v
[Frontend estatico INGENIO/64]
   |
   | /api/chat, /api/health, /api/contact
   v
[Backend basico]
   |
   | HTTP local, no publico
   v
[Ollama daemon]
   |
   v
[Modelo local Gemma / pesos en disco]
```

Regla importante: el navegador nunca debe hablar directo con Ollama. Ollama debe quedar escuchando en `127.0.0.1` o red privada. El backend es la unica capa publica de aplicacion.

### 4.2 Backend recomendado

Recomendacion para MVP: **Python + FastAPI + Uvicorn**, con Ollama como runtime local.

Motivos:

- Fabian usa Python y DevOps con frecuencia.
- FastAPI permite construir una API pequena, tipada y facil de testear.
- El backend puede mantener prompts, validaciones, rate limiting y CORS sin exponer el runtime LLM.
- Ollama ya expone API HTTP local y maneja descarga/carga de modelos.
- Separar backend y runtime permite cambiar de modelo sin tocar el frontend.

Alternativa viable: Node.js/Express o Fastify + Ollama. No la recomiendo como primera opcion porque el proyecto de IA/modelos suele integrarse mas rapido con Python.

### 4.3 Responsabilidades del backend

El backend no debe ser solo un proxy transparente. Debe controlar:

- Validacion de entrada.
- Limite de longitud de prompt.
- Prompt de sistema/persona de INGENIO.
- Contexto permitido sobre Fabian y el proyecto.
- Timeouts hacia Ollama.
- Streaming opcional hacia el frontend.
- Rate limiting por IP/sesion.
- Logs sin datos sensibles completos.
- CORS restringido al dominio del sitio.
- Normalizacion de errores para no filtrar detalles internos.

### 4.4 Endpoints iniciales

```text
GET  /health
POST /api/chat
GET  /api/site-context
POST /api/contact        # opcional, cuando haya destino real
```

#### `GET /health`

Debe devolver estado minimo:

```json
{
  "status": "ok",
  "model_runtime": "ollama",
  "model": "gemma2:2b",
  "ollama": "reachable"
}
```

No debe exponer rutas internas, versiones sensibles ni variables de entorno.

#### `POST /api/chat`

Request sugerido:

```json
{
  "message": "Como usas IA todos los dias?",
  "session_id": "browser-generated-id",
  "mode": "site_agent"
}
```

Response no streaming:

```json
{
  "reply": "...",
  "model": "gemma2:2b",
  "sources": [],
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

Para experiencia de consola, conviene implementar streaming despues del primer MVP:

```text
GET/POST /api/chat/stream -> text/event-stream
```

#### `GET /api/site-context`

Devuelve metadata publica del sitio, comandos, modelo configurado y capacidades habilitadas. Sirve para no hardcodear todo en el frontend a futuro.

#### `POST /api/contact`

Solo cuando haya destino real. Debe validar email, longitud de campos, captcha/rate limit y no loguear datos personales completos.

## 5. Modelo LLM y runtime

### 5.1 Correccion importante sobre "Gemma 3 2B"

Al 2026-05-26, la documentacion oficial consultada no muestra una variante **Gemma 3 2B**.

- Google documenta Gemma 3 en tamanos 270M, 1B, 4B, 12B y 27B.
- Ollama lista `gemma3` con tags 270M, 1B, 4B, 12B y 27B.
- La variante 2B existe claramente en **Gemma 2** (`gemma2:2b`).
- La familia actual de Google incluye **Gemma 4 E2B**, que es una variante de 2B efectivos, pero no es Gemma 3 y requiere mas memoria que `gemma2:2b` en Ollama.

Decision recomendada:

- Si el requisito prioritario es "modelo muy pequeno ~2B": usar `gemma2:2b`.
- Si el requisito prioritario es "Gemma 3": usar `gemma3:1b` para ultra liviano o `gemma3:4b` para mejor calidad.
- Si el requisito prioritario es "2B actual de Google y mejor capacidad": evaluar `gemma4:e2b`, siempre que el hardware soporte su memoria.

No hardcodear el modelo. Usar variable de entorno:

```text
INGENIO_LLM_MODEL=gemma2:2b
```

Y permitir cambiar a:

```text
INGENIO_LLM_MODEL=gemma3:1b
INGENIO_LLM_MODEL=gemma3:4b
INGENIO_LLM_MODEL=gemma4:e2b
```

### 5.2 Runtime recomendado: Ollama

Recomendacion: **Ollama como runtime local del modelo**.

Motivos:

- API local simple (`http://localhost:11434/api`).
- Soporte directo para Gemma/Gemma 3/Gemma 2 en su libreria.
- Maneja descarga y ejecucion de modelos.
- Puede correr como servicio de sistema en Linux con `systemd`.
- Tiene opcion Docker si el despliegue necesita contenedores.
- Reduce codigo propio de inferencia y riesgos de mantener bindings nativos.

No recomiendo para el MVP:

- vLLM: excelente para throughput, pero excesivo para un sitio personal con modelo pequeno.
- llama.cpp directo: potente y eficiente, pero requiere mas decisiones operativas, binarios/modelos GGUF y mantenimiento manual.
- Transformers directo en backend: flexible, pero aumenta memoria, dependencias y complejidad.

### 5.3 Modelo inicial sugerido

Para arrancar simple:

```text
Runtime: Ollama
Modelo: gemma2:2b
Backend: FastAPI
Servicio: systemd en Linux
```

Razon: cumple el requisito de modelo pequeno 2B y bajo consumo. Cuando la consola este integrada, medir calidad en espanol y decidir si subir a `gemma3:4b` o `gemma4:e2b`.

### 5.4 Pruebas manuales de modelo

En la maquina donde corra Ollama:

```bash
ollama pull gemma2:2b
ollama run gemma2:2b
```

Prueba via API local:

```bash
curl http://localhost:11434/api/chat \
  -d '{
    "model": "gemma2:2b",
    "messages": [
      {"role": "user", "content": "Responde en espanol: que es Ingenio/64?"}
    ],
    "stream": false
  }'
```

Si se decide Gemma 3:

```bash
ollama pull gemma3:1b
# o
ollama pull gemma3:4b
```

## 6. Servicio en background / always-on

### 6.1 Produccion Linux: systemd

Para produccion recomiendo Linux + `systemd`.

Debe haber dos servicios:

1. `ollama.service`: runtime del modelo.
2. `ingenio-api.service`: backend HTTP.

Ollama puede instalarse con su servicio recomendado. Debe configurarse para escuchar solo localmente:

```text
OLLAMA_HOST=127.0.0.1:11434
```

Ejemplo conceptual de override:

```ini
# /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
```

Luego:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

Ejemplo conceptual para backend:

```ini
# /etc/systemd/system/ingenio-api.service
[Unit]
Description=Ingenio API
After=network-online.target ollama.service
Wants=network-online.target

[Service]
User=ingenio
Group=ingenio
WorkingDirectory=/opt/ingenio/backend
Environment="INGENIO_LLM_MODEL=gemma2:2b"
Environment="OLLAMA_BASE_URL=http://127.0.0.1:11434"
Environment="INGENIO_ALLOWED_ORIGIN=https://TU_DOMINIO"
ExecStart=/opt/ingenio/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8080
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Notas:

- `--host 127.0.0.1`: el backend queda detras de Nginx/Caddy/Traefik, no expuesto directo.
- `Restart=always`: vuelve a levantar ante fallos.
- `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem`, `ProtectHome`: hardening basico.
- No pegar secretos en el unit. Usar `EnvironmentFile` o secret manager si aparece un token real.

### 6.2 macOS desarrollo: app Ollama o launchd

En macOS, Ollama funciona como app/servicio local. Para desarrollo alcanza con tener Ollama instalado y corriendo. Si se quiere always-on local con `launchd`, documentarlo aparte cuando se confirme que el host final sera macOS.

### 6.3 Docker como alternativa

Docker sirve si el despliegue ya esta containerizado. Para un sitio personal simple, systemd directo es mas facil de operar y debuggear. Si se usa Docker, no publicar `11434` a internet; como maximo red interna entre contenedores.

## 7. Integracion frontend-backend

### 7.1 Comportamiento deseado del input

El input actual debe mantener dos caminos:

1. Comandos locales conocidos: `HELP`, `ABOUT`, `CONTACT`, etc.
2. Preguntas o frases no reconocidas: enviar a `/api/chat`.

Flujo recomendado:

```text
Usuario escribe texto
  -> si matchea comando local: ejecutar vista local
  -> si no matchea: mostrar respuesta de agente desde backend
```

### 7.2 Nuevos comandos sugeridos

Para alinear el sitio con el objetivo personal:

```text
EXPERIENCIAS   Lista experiencias/posts sobre IA
DIARIO         Ultimas notas de uso diario de IA
PROYECTOS      Proyectos personales en curso desde Markdown
PROMPTS        Prompts/patrones utiles
AGENT          Conversar con el agente del sitio
MODEL          Ver modelo local activo
```

### 7.3 Respuesta visual

La respuesta del backend debe renderizarse como salida de terminal:

```text
> COMO USAS IA TODOS LOS DIAS?
AGENT:
...
```

Para respuestas del modelo, mostrar texto incremental caracter por caracter con cursor, manteniendo la estetica actual. La velocidad debe ser configurable con `INGENIO_RESPONSE_TYPE_SPEED_MS` en milisegundos por caracter.

### 7.4 Selector de modelo

El selector actual contiene modelos grandes externos y `LOCAL (OLLAMA)`. Para esta vision, conviene cambiarlo a estado real:

- Mostrar modelo configurado por backend.
- Evitar prometer modelos que no estan disponibles.
- Si hay selector, que solo muestre modelos habilitados en backend.

Ejemplo:

```text
MODEL: GEMMA2:2B LOCAL
RUNTIME: OLLAMA
STATUS: ONLINE
```

## 8. Contenido del sitio

### 8.1 Cambio de enfoque editorial

El contenido actual esta orientado a servicios comerciales. Para un sitio personal de experiencias con IA, conviene reordenar:

- Home: presentacion personal + proposito del laboratorio.
- Experiencias: posts cortos sobre usos diarios.
- Proyectos: experimentos concretos y repos personales, mantenidos en Markdown.
- Herramientas: pueden aparecer dentro de experiencias o proyectos, pero ya no son una seccion principal del MVP.
- Servicios/contacto: puede quedar, pero no como eje principal.

### 8.2 Posible estructura de contenido futura

```text
content/
├── experiences/
│   ├── 2026-05-uso-codex.md
│   └── 2026-05-ollama-local.md
└── projects/
    └── ingenio64.md
```

Para el MVP, las secciones `PROYECTOS` y `AGENTES` se cargan desde Markdown en runtime:

```text
front/secciones/proyectos/proyectos.md
front/secciones/agentes/agentes.md
```

Cuando haya mas contenido, conviene aplicar el mismo patron a experiencias o pasar a un build simple que indexe Markdown/JSON.

## 9. Seguridad y privacidad

### 9.1 Riesgos principales al agregar backend

- Exponer Ollama publicamente.
- Abuso de `/api/chat` por bots.
- Prompts demasiado largos que consuman CPU/RAM.
- Prompt injection intentando extraer instrucciones internas.
- Loguear datos personales del usuario.
- CORS abierto a cualquier origen.
- Contact form usado para spam.
- Errores internos expuestos al navegador.

### 9.2 Controles minimos

- Ollama solo en `127.0.0.1` o red privada.
- Backend con CORS restringido.
- Limite de longitud de `message`, por ejemplo 2.000-4.000 caracteres iniciales.
- Timeout hacia Ollama, por ejemplo 30-60 segundos.
- Rate limit por IP/sesion.
- Sanitizar/escapar todo texto renderizado en frontend.
- No usar `dangerouslySetInnerHTML`.
- No loguear prompts completos en produccion, o redaccion parcial.
- Mensajes de error genericos al cliente.
- `.env` debe quedar solo local e ignorado por Git; versionar unicamente `.env.example` sin secretos.
- Si se agrega contacto real: validacion, antispam y politica de retencion de datos.

### 9.3 Prompt de sistema inicial

El prompt de sistema debe limitar el alcance:

```text
Sos el agente de INGENIO/64, el sitio personal de Fabian.
Respondes en espanol neutro, directo y tecnico.
Tu objetivo es ayudar a explorar experiencias, herramientas y aprendizajes sobre IA publicados por Fabian.
Si no sabes algo del sitio, decilo y sugeri revisar una seccion relacionada.
No inventes datos personales, clientes, credenciales ni informacion privada.
No ejecutes acciones externas.
```

## 10. Plan de implementacion sugerido

### Fase 0 - Orden base

- Crear `.gitignore` para `.DS_Store`, caches y entornos virtuales.
- Crear `README.md` con como servir `front/`.
- Decidir hosting final: VPS Linux, Mac mini, container, etc.

### Fase 1 - Backend MVP

- Crear `backend/` con FastAPI.
- Configurar variables:
  - `INGENIO_LLM_MODEL`
  - `OLLAMA_BASE_URL`
  - `INGENIO_ALLOWED_ORIGIN`
- Implementar:
  - `GET /health`
  - `POST /api/chat`
- Agregar cliente HTTP hacia Ollama.
- Agregar validacion de request y timeout.
- Tests basicos del backend.

### Fase 2 - Servicio always-on

- Instalar Ollama en host.
- Descargar modelo elegido.
- Configurar `ollama.service`.
- Configurar `ingenio-api.service`.
- Configurar reverse proxy TLS.
- Verificar reinicio automatico.

### Fase 3 - Integracion frontend

- En `app.jsx`, enviar frases no reconocidas a `/api/chat`.
- Agregar estado `loading` y errores de red.
- Mostrar respuesta en formato consola.
- Actualizar `COMMANDS_META` con `AGENT`, `MODEL`, `EXPERIENCIAS`.
- Agregar documentacion de comandos.

### Fase 4 - Contenido personal IA

- Reescribir `HERO` y `ABOUT_PROFILE` para foco personal.
- Agregar experiencias iniciales.
- Agregar vista `EXPERIENCIAS`.
- Evaluar Markdown/JSON para crecer sin tocar componentes.

### Fase 5 - RAG liviano opcional

Cuando haya suficientes posts/docs:

- Indexar contenido publico del sitio.
- Recuperar fragmentos relevantes antes de llamar al LLM.
- Devolver citas/secciones usadas.
- Mantenerlo local y simple; no agregar vector DB hasta que haga falta.

## 11. Criterios de aceptacion del MVP agentico

- El frontend sigue funcionando como consola retro.
- `HELP` lista comandos locales y comandos agenticos.
- Una pregunta libre no reconocida llama al backend.
- El backend responde usando modelo via API cloud/OpenCode Zen.
- La API key del modelo no esta expuesta publicamente.
- El backend corre como servicio y reinicia solo.
- Hay `GET /health` para monitoreo.
- Los errores se muestran con estetica terminal sin filtrar stack traces.
- El modelo se configura por variable de entorno.
- Documentacion de instalacion y operacion actualizada.

## 12. Decisiones abiertas

1. Host final: VPS Linux, servidor propio, Mac mini u otro.
2. Modelo inicial exacto: `gemma2:2b`, `gemma3:1b`, `gemma3:4b` o `gemma4:e2b`.
3. Si el sitio sera solo personal/contenido o tambien comercial.
4. Si contacto sera email, formulario propio, WhatsApp o calendario.
5. Si se requiere streaming desde el primer release.
6. Si el contenido va a seguir en `content.jsx` o migrar a Markdown.

## 13. Fuentes tecnicas consultadas

- Google AI for Developers - Gemma core overview: https://ai.google.dev/gemma/docs/core
- Google AI for Developers - Gemma 3 model card: https://ai.google.dev/gemma/docs/core/model_card_3
- Ollama documentation: https://docs.ollama.com/
- Ollama API introduction: https://docs.ollama.com/api/introduction
- Ollama Linux service docs: https://docs.ollama.com/linux
- Ollama Docker docs: https://docs.ollama.com/docker
- Ollama library - Gemma 3: https://ollama.com/library/gemma3
- Ollama library - Gemma 2: https://ollama.com/library/gemma2
- Ollama library - Gemma 4: https://ollama.com/library/gemma4
- FastAPI documentation: https://fastapi.tiangolo.com/
