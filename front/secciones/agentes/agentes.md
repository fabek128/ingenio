# Servicios de agentes IA, automatización y sistemas agenticos

## La idea corta

Trabajo en programación e IA, con foco en agentes reales.

Diseño, creo, mantengo y mejoro sistemas basados en agentes que interactúan con modelos, herramientas, APIs, archivos, navegadores, terminales, servicios cloud y entornos locales.

Mi objetivo es construir sistemas que:

- hagan trabajo concreto
- tengan permisos claros
- sean mantenibles
- se puedan auditar
- reduzcan trabajo repetitivo
- permitan usar modelos cloud o locales según costo, privacidad y performance
- no se rompan al primer cambio de contexto

---

## Qué entiendo por agente

Un agente útil es un sistema que puede:

1. **Recibir una intención** — revisar reportes, armar resúmenes, buscar errores, actualizar docs, controlar flujos.
2. **Razonar un plan** — qué mirar, qué herramienta usar, qué validar, qué no tocar.
3. **Usar herramientas** — APIs, terminal, navegador, base de datos, GitHub, email, docs, calendarios, CRMs, scripts.
4. **Ejecutar pasos** — leer, escribir, consultar, transformar, revisar, disparar procesos, generar archivos, abrir PRs.
5. **Mantener contexto** — saber qué se hizo antes, qué reglas existen, qué datos no tocar, qué permisos tiene.
6. **Pedir revisión** — acciones automáticas y otras que requieren aprobación humana.
7. **Ser observable** — logs, trazas, decisiones, errores, costos. Si algo sale mal, hay que poder entender qué pasó.

---

## Creación de agentes

Armo agentes para tareas específicas o sistemas completos:

- agente personal o de equipo
- asistente técnico para programación
- agente para revisar repositorios y PRs
- agente para investigar y generar reportes
- agente para interactuar con APIs internas
- agente para manejar documentos y tickets
- agente para soporte interno y automatizaciones
- agente conectado a Telegram, Discord, Slack, WhatsApp
- agente con herramientas propias, memoria y skills

Primero entiendo el flujo. Después decido si hace falta un agente, un script, una integración o una mezcla.

---

## Mantenimiento de agentes existentes

Muchos agentes acumulan deuda técnica: prompts viejos, permisos amplios, costos altos, modelos que cambiaron, errores silenciosos, falta de logs, memoria contaminada.

Puedo ordenar eso:

- revisión de arquitectura y prompts
- separación de herramientas peligrosas y seguras
- mejora de tool calling y manejo de errores
- testing de flujos y control de costos
- actualización de modelos y migraciones
- documentación, monitoreo y hardening de seguridad
- definición de reglas de aprobación humana

---

## Modelos cloud y locales

Trabajo con ambos. No siempre conviene lo mismo.

**Cloud**: mejor razonamiento, setup inicial rápido, modelos frontier, buen tool calling, escalable.

**Local**: privacidad, costo recurrente bajo, control de datos, independencia de proveedores, offline.

**Híbrido**: modelo barato/local para tareas repetitivas, modelo fuerte para planificación, reglas determinísticas para validaciones, scripts para acciones sin LLM.

---

## Agentes para programación

- revisión de código y análisis de bugs
- generación de tests y refactors controlados
- documentación técnica y revisión de PRs
- búsqueda en repositorios y generación de scripts
- automatización de tareas DevOps
- agentes conectados a entornos locales, Docker, SSH o cloud

---

## Agentes de investigación

- buscar información y comparar fuentes
- resumir documentación y monitorear cambios
- generar reportes y seguir releases
- leer papers y extraer conclusiones
- mantener una base de conocimiento

---

## Agentes de operación interna

- reportes diarios y control de tareas
- seguimiento de tickets y clasificación de mensajes
- generación de resúmenes y actualización de docs
- preparación de reuniones y extracción de datos
- automatización de tareas administrativas

---

## Seguridad y control

Un agente con herramientas puede hacer daño aunque no tenga mala intención.

Principios de trabajo:

- mínimo privilegio: solo los permisos necesarios
- separación de entornos: dev, test, prod
- aprobación humana para acciones sensibles
- logs y trazabilidad
- sandboxing cuando ejecuta código
- control de secretos
- herramientas determinísticas para operaciones críticas
- listas de acciones permitidas y prohibidas

---

## Entregables

- agente funcionando con documentación
- arquitectura del sistema y reglas
- prompts, tools, skills reutilizables
- scripts auxiliares y configuración
- checklist de seguridad
- pruebas básicas y ejemplos de uso
- plan de evolución

---

## Formatos de trabajo

**Diagnóstico**: revisión de flujo existente para detectar oportunidades, riesgos y arquitectura posible.

**MVP / prototipo**: primera versión funcional para validar flujo, modelo, herramientas, costo y confiabilidad.

**Implementación completa**: diseño, construcción, integración, documentación y puesta en marcha.

**Mantenimiento mensual**: ajustes, monitoreo, mejoras, actualización de modelos, control de costos.

**Consultoría técnica**: arquitectura, stack, seguridad, diseño de tools, estrategia cloud/local, debugging.

---

## Qué no vendo

No vendo humo. No vendo magia.

- un empleado virtual que reemplaza todo
- automatización 100% autónoma sin supervisión
- un agente que nunca se equivoca
- IA mágica que entiende tu negocio sin contexto
- hacer todo con prompts
- usar el modelo más caro para cualquier cosa

Un sistema bueno combina: programación, arquitectura, prompts, herramientas, modelos, permisos, seguridad, documentación, mantenimiento y criterio.
