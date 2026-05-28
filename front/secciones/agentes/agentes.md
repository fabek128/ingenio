# Servicios de agentes IA, automatización y sistemas agenticos

> Documento informal para explicar qué hago, qué puedo construir y cómo trabajo.  
> No es un pitch mágico. Es más bien una foto honesta de capacidades, enfoque y criterio técnico.

---

## La idea corta

Trabajo en programación e IA, con foco en **agentes reales**, no demos lindas que viven diez minutos en un video.

Puedo diseñar, crear, mantener y mejorar sistemas basados en agentes que interactúan con modelos, herramientas, APIs, archivos, navegadores, terminales, servicios cloud y entornos locales.

La base principal de trabajo puede ser **OpenClaw**, **Hermes**, modelos agenticos modernos y runtimes locales o cloud, según lo que tenga sentido para cada caso.

Mi objetivo no es vender “IA que hace todo sola”.  
Mi objetivo es construir sistemas que:

- hagan trabajo concreto;
- tengan permisos claros;
- sean mantenibles;
- se puedan auditar;
- reduzcan trabajo repetitivo;
- permitan usar modelos cloud o locales según costo, privacidad y performance;
- no se rompan al primer cambio de contexto.

---

## Qué entiendo por “agente”

Para mí, un agente no es simplemente un chatbot con una personalidad simpática.

Un agente útil es un sistema que puede:

1. **Recibir una intención**  
   Por ejemplo: “revisá estos reportes”, “armá un resumen diario”, “buscá errores en este repo”, “actualizá este documento”, “controlá este flujo”.

2. **Razonar un plan de acción**  
   No necesariamente perfecto, pero sí estructurado: qué mirar, qué herramienta usar, qué validar, qué pedir, qué no tocar.

3. **Usar herramientas**  
   APIs, terminal, navegador, base de datos, GitHub, email, documentos, calendarios, CRMs, sistemas internos, scripts propios, etc.

4. **Ejecutar pasos**  
   Leer, escribir, consultar, transformar, revisar, disparar procesos, generar archivos, crear tickets, abrir PRs, mandar reportes.

5. **Mantener contexto**  
   Saber qué se hizo antes, qué reglas existen, qué estilo usar, qué datos no tocar, qué permisos tiene.

6. **Pedir revisión cuando corresponde**  
   Hay acciones que pueden ser automáticas. Otras necesitan aprobación humana. Esa frontera es parte importante del diseño.

7. **Ser observable**  
   Logs, trazas, decisiones, errores, costo, uso de modelos, resultados. Si algo sale mal, hay que poder entender qué pasó.

Un agente bien hecho no es “autonomía total”.  
Es **automatización con criterio**.

---

## Qué tipo de servicios puedo ofrecer

### 1. Creación de agentes desde cero

Puedo armar agentes para tareas específicas o sistemas más amplios con varios componentes.

Ejemplos:

- agente personal o de equipo;
- asistente técnico para programación;
- agente para revisar repositorios;
- agente para investigar temas y generar reportes;
- agente para interactuar con APIs internas;
- agente para manejar documentos;
- agente para revisar tickets, issues o pull requests;
- agente para soporte interno;
- agente para automatizar tareas repetitivas;
- agente conectado a Telegram, Discord, Slack, WhatsApp, CLI o web;
- agente con herramientas propias;
- agente con memoria, skills y rutinas programadas.

La idea no es meter un LLM en cualquier lado porque sí.  
Primero se entiende el flujo. Después se decide si hace falta un agente, un script, una integración clásica o una mezcla.

---

### 2. Mantenimiento de agentes existentes

Muchos agentes funcionan bien en la demo y después empiezan a acumular deuda técnica:

- prompts viejos;
- herramientas mal definidas;
- permisos demasiado amplios;
- costos altos;
- modelos que cambiaron comportamiento;
- errores silenciosos;
- falta de logs;
- flujos frágiles;
- integraciones que se rompen;
- memoria contaminada;
- automatizaciones que nadie entiende;
- dependencias que nadie actualiza.

Puedo entrar a ordenar eso.

El mantenimiento puede incluir:

- revisión de arquitectura;
- limpieza de prompts y system instructions;
- separación entre herramientas peligrosas y herramientas seguras;
- mejora de tool calling;
- testing de flujos;
- manejo de errores;
- control de costos;
- actualización de modelos;
- migración parcial o total;
- documentación;
- monitoreo;
- hardening de seguridad;
- definición de reglas de aprobación humana.

A veces el trabajo más valioso no es crear otro agente.  
Es hacer que el que ya existe deje de ser una caja negra.

---

### 3. Integración con modelos cloud y locales

Puedo trabajar con modelos en cloud y también con modelos locales.

No siempre conviene lo mismo.

#### Modelos cloud

Suelen servir cuando hace falta:

- mejor razonamiento;
- menor setup inicial;
- modelos frontier;
- buena calidad de tool calling;
- velocidad para prototipar;
- escalabilidad sin mantener infraestructura propia.

#### Modelos locales

Suelen servir cuando importa:

- privacidad;
- costo recurrente bajo;
- control de datos;
- experimentación;
- independencia de proveedores;
- uso offline o semi-offline;
- pipelines internos;
- despliegues on-premise.

#### Enfoque híbrido

Muchas veces lo mejor es combinar.

Ejemplo simple:

- modelo barato/local para tareas repetitivas;
- modelo más fuerte para planificación o revisión;
- reglas determinísticas para validaciones;
- scripts para acciones que no necesitan LLM;
- agente como orquestador, no como martillo universal.

La clave está en no usar el modelo más caro para todo, ni forzar lo local cuando no da la calidad necesaria.

---

### 4. Agentes basados en OpenClaw

OpenClaw me interesa como base para asistentes persistentes y flujos donde el agente vive cerca del usuario o del equipo.

Casos posibles:

- agente accesible desde mensajería;
- tareas personales o de equipo;
- automatizaciones recurrentes;
- interacción con calendario, email, archivos o herramientas;
- flujos tipo “hacé esto por mí y avisame”;
- coordinación entre comandos humanos y acciones automáticas;
- ejecución en entorno controlado;
- integración con herramientas del sistema.

La ventaja de este tipo de enfoque es que el agente no queda encerrado en un chat aislado.  
Puede estar conectado a herramientas reales.

El riesgo es obvio: si tiene manos, hay que ponerle límites.  
Por eso el diseño de permisos, confirmaciones, logs y sandboxing no es opcional.

---

### 5. Agentes basados en Hermes

Hermes me interesa especialmente para agentes persistentes, trabajo con skills, memoria, automatizaciones y uso flexible de modelos.

Casos posibles:

- agentes que aprenden procedimientos;
- agentes que generan y reutilizan skills;
- automatizaciones programadas;
- asistentes técnicos por CLI o mensajería;
- agentes que trabajan en servidor o VPS;
- flujos con modelos locales;
- tareas de investigación recurrente;
- pipelines de programación o análisis;
- integración con endpoints compatibles tipo OpenAI;
- agentes que combinan memoria, herramientas y ejecución.

Hermes encaja bien cuando el agente tiene que ir acumulando conocimiento operativo, no solo responder una pregunta aislada.

De nuevo: no es magia.  
La memoria y las skills sirven si están bien gobernadas. Si no, se convierten en ruido persistente.

---

## Tipos concretos de agentes que puedo construir

### Agentes para programación

- revisión de código;
- análisis de bugs;
- generación de tests;
- refactors controlados;
- documentación técnica;
- revisión de PRs;
- búsqueda en repositorios;
- generación de scripts;
- automatización de tareas repetitivas;
- integración con GitHub;
- asistentes para DevOps o DevEx;
- agentes conectados a entornos locales, Docker, SSH o cloud.

Un buen agente de programación no debería simplemente “tocar código”.  
Tiene que entender contexto, correr pruebas, mostrar diffs y respetar el flujo del equipo.

---

### Agentes de investigación

- buscar información;
- comparar fuentes;
- resumir documentación;
- monitorear cambios;
- generar reportes;
- seguir releases;
- leer papers o documentación técnica;
- extraer conclusiones accionables;
- mantener una base de conocimiento.

Acá el punto no es que el agente “googlee”.  
El punto es diseñar un proceso repetible: buscar, filtrar, citar, guardar, comparar y avisar.

---

### Agentes de operación interna

- reportes diarios o semanales;
- control de tareas;
- seguimiento de tickets;
- clasificación de mensajes;
- generación de resúmenes;
- actualización de documentos;
- preparación de reuniones;
- extracción de datos de sistemas internos;
- automatización de tareas administrativas.

Estos agentes suelen ser menos vistosos, pero muy útiles.  
Si una persona hace la misma operación todos los días, probablemente haya algo para automatizar.

---

### Agentes personales o ejecutivos

- agenda;
- recordatorios;
- resúmenes;
- email;
- preparación de contexto;
- búsqueda de información;
- seguimiento de proyectos;
- comunicación por mensajería;
- tareas delegables con aprobación.

Este tipo de agente requiere cuidado extra, porque toca información sensible.  
No alcanza con que “funcione”. Tiene que funcionar con límites claros.

---

### Agentes multi-modelo

No todo tiene que pasar por un único modelo.

Puedo diseñar flujos donde distintos modelos cumplan distintos roles:

- uno planifica;
- otro ejecuta;
- otro verifica;
- otro resume;
- otro clasifica;
- otro trabaja localmente con datos privados;
- otro se usa solo cuando hace falta más potencia.

Esto permite optimizar calidad, costo y privacidad.

---

### Agentes con herramientas propias

Muchas veces lo importante no es el prompt, sino la herramienta.

Puedo crear tools específicas para que el agente haga cosas de forma confiable:

- consultar una API interna;
- leer datos estructurados;
- ejecutar scripts;
- crear archivos;
- validar formularios;
- consultar una base de datos;
- abrir tickets;
- generar reportes;
- correr tests;
- interactuar con servicios externos;
- transformar documentos;
- llamar workflows existentes.

Mientras más determinística sea una herramienta, menos se le pide al modelo que “adivine”.

---

## Cómo trabajo

### 1. Entender el flujo real

Antes de construir, intento entender:

- qué tarea se quiere resolver;
- quién la hace hoy;
- cuánto tarda;
- qué datos usa;
- qué errores son comunes;
- qué decisiones son críticas;
- qué se puede automatizar;
- qué requiere aprobación;
- qué sistemas están involucrados.

A veces la respuesta es “hagamos un agente”.  
A veces la respuesta es “hagamos un script y listo”.  
Y eso también está bien.

---

### 2. Diseñar la arquitectura

Defino cosas como:

- dónde vive el agente;
- qué modelo usa;
- qué herramientas puede llamar;
- qué memoria necesita;
- qué logs se guardan;
- qué acciones requieren confirmación;
- qué permisos tiene;
- cómo se recupera de errores;
- cómo se actualiza;
- cómo se apaga si algo va mal.

El agente no debería ser una masa amorfa de prompt + API key + esperanza.

---

### 3. Prototipo funcional

Armo una primera versión que haga el flujo principal.

No hace falta que sea perfecta, pero sí tiene que demostrar:

- entrada clara;
- salida útil;
- herramientas conectadas;
- comportamiento entendible;
- manejo básico de errores;
- límites razonables.

La demo tiene que parecerse al uso real, no a un caso feliz preparado para vender.

---

### 4. Hardening

Después viene la parte que separa juguete de herramienta:

- permisos mínimos;
- logs;
- validaciones;
- pruebas;
- retries;
- timeouts;
- control de costos;
- mensajes de error útiles;
- documentación;
- reglas de escalamiento;
- aprobación humana para acciones sensibles;
- protección de secretos;
- aislamiento del entorno de ejecución.

Esta etapa importa muchísimo.  
Los agentes fallan de formas creativas. Hay que diseñar para eso.

---

### 5. Mantenimiento y mejora

Un agente no se termina cuando “anda”.

Hay que mirar:

- si sigue haciendo bien su trabajo;
- si el modelo cambió comportamiento;
- si subieron los costos;
- si una API cambió;
- si hay nuevas herramientas mejores;
- si la memoria se ensució;
- si hay prompts que ya no sirven;
- si los usuarios encontraron casos raros;
- si conviene mover algo de cloud a local, o al revés.

El mantenimiento no es opcional si el agente toca procesos reales.

---

## Seguridad y control

Este punto para mí es central.

Un agente con herramientas puede hacer daño aunque no tenga mala intención.

Por eso suelo trabajar con principios como:

- **mínimo privilegio**: que tenga solo los permisos necesarios;
- **separación de entornos**: dev, test, prod;
- **aprobación humana** para acciones sensibles;
- **logs y trazabilidad**;
- **sandboxing** cuando ejecuta código;
- **control de secretos**;
- **herramientas determinísticas** para operaciones críticas;
- **validaciones antes de actuar**;
- **listas de acciones permitidas y prohibidas**;
- **rollback o plan de recuperación** cuando aplique.

Un agente no debería tener acceso total “porque es cómodo”.  
Eso envejece mal.

---

## Qué entregables puedo dejar

Según el proyecto, puedo entregar:

- agente funcionando;
- documentación de instalación;
- documentación de uso;
- arquitectura del sistema;
- prompts y reglas principales;
- definición de tools;
- scripts auxiliares;
- archivos de configuración;
- skills reutilizables;
- integración con servicios;
- checklist de seguridad;
- guía de mantenimiento;
- pruebas básicas;
- ejemplos de uso;
- plan de evolución.

Me interesa que el sistema no dependa solamente de que yo “me acuerde cómo estaba armado”.  
Tiene que quedar claro para poder mantenerlo.

---

## Qué NO vendo

No vendo esto como:

- “un empleado virtual que reemplaza todo”;
- “automatización 100% autónoma sin supervisión”;
- “un agente que nunca se equivoca”;
- “IA mágica que entiende cualquier negocio sin contexto”;
- “ponemos un chatbot y ya está”;
- “hacemos todo con prompts”;
- “usamos el modelo más caro para cualquier cosa”.

La IA agentica es potente, pero hay que bajarla a tierra.

Un sistema bueno combina:

- programación;
- arquitectura;
- prompts;
- herramientas;
- modelos;
- permisos;
- seguridad;
- documentación;
- mantenimiento;
- criterio.

El criterio es la parte menos marketinera, pero probablemente la más importante.

---

## Posibles formatos de trabajo

### Diagnóstico

Revisión de un flujo o sistema existente para detectar oportunidades, riesgos y arquitectura posible.

Ideal cuando todavía no está claro si conviene un agente, una automatización tradicional o una mezcla.

---

### MVP / prototipo

Construcción de una primera versión funcional.

Sirve para validar:

- si el flujo tiene sentido;
- qué modelo conviene;
- qué herramientas hacen falta;
- cuánto cuesta;
- qué tan confiable puede ser;
- qué partes requieren supervisión.

---

### Implementación completa

Diseño, construcción, integración, documentación y puesta en marcha de un agente o sistema de agentes.

Incluye más foco en seguridad, mantenibilidad y uso real.

---

### Mantenimiento mensual

Para agentes que ya están en uso.

Puede incluir:

- ajustes;
- monitoreo;
- mejoras;
- actualización de modelos;
- control de costos;
- resolución de errores;
- nuevas herramientas;
- limpieza de memoria o skills;
- documentación incremental.

---

### Consultoría técnica

Para equipos que quieren construir internamente pero necesitan criterio externo.

Puedo ayudar con:

- arquitectura;
- elección de stack;
- revisión de seguridad;
- diseño de tools;
- estrategia cloud/local;
- patrones agenticos;
- prompts;
- evaluación de modelos;
- debugging de comportamiento.

---

## Ejemplos de proyectos posibles

- Agente para revisar PRs y sugerir cambios con contexto del repo.
- Agente que resume tickets, agrupa problemas y propone prioridades.
- Asistente conectado a Telegram para disparar tareas en servidor.
- Agente local que trabaja con documentos privados sin mandar todo a cloud.
- Sistema híbrido donde un modelo local clasifica y uno cloud razona casos difíciles.
- Agente que genera reportes diarios desde APIs internas.
- Asistente para investigar releases, papers o documentación técnica.
- Agente que crea y mantiene skills reutilizables.
- Automatización para revisar logs, detectar anomalías y preparar un resumen.
- Agente para operar workflows con aprobación humana antes de tocar producción.
- Sistema de herramientas para que el modelo deje de improvisar y ejecute pasos controlados.
- Migración de un chatbot simple a un agente con memoria, tools y mantenimiento real.

---

## Mi enfoque resumido

No me interesa vender una fantasía.

Me interesa construir sistemas agenticos que sirvan, que se puedan explicar, que tengan límites y que mejoren procesos reales.

La IA hoy permite hacer cosas muy interesantes, pero la diferencia entre una demo y una herramienta útil está en los detalles:

- cómo se conectan las herramientas;
- cómo se manejan permisos;
- cómo se conserva contexto;
- cómo se audita;
- cómo se limita el riesgo;
- cómo se mantiene;
- cómo se decide qué parte hace el modelo y qué parte hace código tradicional.

Ahí es donde puedo aportar.

---

## Frase corta para presentar el servicio

Creo, mantengo e integro agentes de IA basados en OpenClaw, Hermes y modelos cloud/locales, con foco en automatización real, seguridad, herramientas propias, memoria, workflows y sistemas mantenibles.

Sin vender humo.  
Sin prometer magia.  
Con código, criterio y agentes que hacen cosas concretas.
