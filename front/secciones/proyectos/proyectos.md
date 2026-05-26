# Proyectos personales

Esta seccion es para compartir proyectos personales en los que estoy trabajando, especialmente herramientas vinculadas con IA, agentes, busqueda semantica, automatizacion y experimentos de producto.

## INGENIO/64

- Repositorio: [fabek128/ingenio](https://github.com/fabek128/ingenio)
- Estado: sitio actual / laboratorio publico
- Stack: frontend tipo consola retro, backend FastAPI, deploy con Docker + Dokploy, modelo via API compatible OpenAI.

INGENIO/64 es mi sitio personal para documentar como uso IA en el dia a dia. La idea es mostrar experiencias reales: decisiones tecnicas, automatizaciones, agentes, errores, aprendizajes, seguridad, DevOps y modelos.

Tambien funciona como una consola agentica: el frontend conversa con un backend propio, mantiene controles basicos de seguridad y permite experimentar con una interfaz distinta a la web tradicional.

## semantic-index

- Repositorio: [fabek128/semantic-index](https://github.com/fabek128/semantic-index)
- Estado: beta
- Lenguaje principal: Python
- Enfoque: CLI-first, local, sin base de datos ni servicios externos obligatorios.

semantic-index es una herramienta para convertir notas Markdown locales en contexto recuperable para agentes de IA. Lee documentos, los divide en chunks utiles, genera embeddings locales y permite buscar con modos semantico, lexical o hibrido.

El objetivo es tener retrieval local y simple para agentes: generar un indice persistido en archivos (`manifest.json`, `docs.jsonl`, `index.npz`) y consultarlo desde la CLI sin levantar una API, una base vectorial o infraestructura adicional.

Me interesa porque encaja con una forma de trabajo agentica pero controlada: documentacion local, contexto versionable, menos dependencias operativas y posibilidad de darle a un agente contexto relevante sin exponer todo el repositorio o toda una carpeta de notas.
