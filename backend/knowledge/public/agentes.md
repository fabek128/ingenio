# Servicios de agentes IA

Fabian trabaja en programacion e IA con foco en agentes reales: sistemas que interactuan con modelos, herramientas, APIs, archivos, navegadores, terminales, servicios cloud y entornos locales.

El objetivo no es vender una IA que hace todo sola, sino construir sistemas que hagan trabajo concreto, tengan permisos claros, sean mantenibles, se puedan auditar, reduzcan trabajo repetitivo y combinen modelos cloud o locales segun costo, privacidad y performance.

## Que entiende por agente

Un agente util puede:

1. recibir una intencion;
2. razonar un plan de accion;
3. usar herramientas como APIs, terminal, navegador, bases de datos, GitHub, email, documentos, calendarios, CRMs o scripts;
4. ejecutar pasos concretos;
5. mantener contexto;
6. pedir revision humana cuando corresponde;
7. ser observable mediante logs, trazas, decisiones, errores, costos y resultados.

Un agente bien hecho no es autonomia total: es automatizacion con criterio.

## Servicios publicos

Fabian puede trabajar en:

- creacion de agentes desde cero;
- mantenimiento y mejora de agentes existentes;
- integracion con modelos cloud y locales;
- agentes basados en runtimes como OpenClaw o Hermes cuando tenga sentido;
- agentes para programacion;
- agentes de investigacion;
- agentes de operacion interna;
- agentes personales o ejecutivos con cuidado extra sobre datos sensibles;
- flujos multi-modelo;
- herramientas propias para que el modelo ejecute pasos controlados.

## Como trabaja

El enfoque publico es:

1. entender el flujo real;
2. disenar arquitectura, permisos, modelos, herramientas, memoria y logs;
3. construir un prototipo funcional;
4. hacer hardening con permisos minimos, validaciones, pruebas, retries, timeouts, control de costos y documentacion;
5. mantener y mejorar el sistema cuando cambia el modelo, las APIs, los costos o el uso real.

## Seguridad y control

La seguridad es central porque un agente con herramientas puede hacer dano aunque no tenga mala intencion.

Principios publicos:

- minimo privilegio;
- separacion de entornos;
- aprobacion humana para acciones sensibles;
- logs y trazabilidad;
- sandboxing cuando ejecuta codigo;
- control de secretos;
- herramientas deterministicas para operaciones criticas;
- validaciones antes de actuar;
- listas de acciones permitidas y prohibidas;
- rollback o plan de recuperacion cuando aplique.

## Entregables posibles

Segun el proyecto, puede entregar agente funcionando, documentacion de instalacion y uso, arquitectura, prompts, tools, scripts, configuracion, skills reutilizables, integraciones, checklist de seguridad, guia de mantenimiento, pruebas basicas, ejemplos y plan de evolucion.

## Que no vende

No vende empleados virtuales magicos, autonomia total sin supervision, agentes infalibles, chatbots sin contexto ni sistemas basados solo en prompts.

El criterio tecnico es parte central del trabajo: decidir que hace el modelo, que hace codigo tradicional, que requiere supervision humana y que debe quedar bloqueado por seguridad.
