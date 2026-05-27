/* ============================================================
   INGENIO/64 — content (diagnostic, profile, metadata, etc.)
   All strings in Spanish, monospaced/uppercase tone.
   ============================================================ */

const ABOUT_PROFILE = {
  photo: "assets/fabian-profile.jpg",
  name: "FABIAN FIGUEREDO",
  role: "SENIOR PROGRAMMER / TECH LEAD",
  company: "ASAP CONSULTING S.A.  //  INGENIO UNO",
  since: "COMMODORE 64 BASIC V2",
  stack: ".NET → JAVA → NODE.JS → PYTHON → AI",
  title: "DATOS:",
};

const ABOUT_SECTION = {
  markdownPath: "secciones/about/about.md",
};


const PROJECTS_SECTION = {
  markdownPath: "secciones/proyectos/proyectos.md",
  fallbackTitle: "PROYECTOS PERSONALES",
};

const AGENTES_DATA = {
  title: "SERVICIOS DE AGENTES IA / AUTOMATIZACION / SISTEMAS AGENTICOS",
  sections: [
    {
      title: "LA IDEA CORTA",
      lines: [
        "Trabajo en programacion e IA, con foco en agentes reales.",
        "Diseno, creo, mantengo y mejoro sistemas basados en agentes",
        "que interactuan con modelos, herramientas, APIs, archivos,",
        "navegadores, terminales, servicios cloud y entornos locales.",
        "",
        "Mi objetivo es construir sistemas que:",
        "> hagan trabajo concreto",
        "> tengan permisos claros",
        "> sean mantenibles",
        "> se puedan auditar",
        "> reduzcan trabajo repetitivo",
        "> permitan usar modelos cloud o locales segun costo,",
        "  privacidad y performance",
        "> no se rompan al primer cambio de contexto",
      ],
    },
    {
      title: "QUE ENTIENDO POR AGENTE",
      lines: [
        "Un agente util es un sistema que puede:",
        "",
        "1. RECIBIR UNA INTENCION: revisar reportes, armar resumen,",
        "   buscar errores, actualizar docs, controlar flujos.",
        "",
        "2. RAZONAR UN PLAN: que mirar, que herramienta usar,",
        "   que validar, que pedir, que no tocar.",
        "",
        "3. USAR HERRAMIENTAS: APIs, terminal, navegador, base de",
        "   datos, GitHub, email, docs, calendarios, CRMs, scripts.",
        "",
        "4. EJECUTAR PASOS: leer, escribir, consultar, transformar,",
        "   revisar, generar archivos, crear tickets, abrir PRs.",
        "",
        "5. MANTENER CONTEXTO: saber que se hizo antes, que reglas",
        "   existen, que datos no tocar, que permisos tiene.",
        "",
        "6. PEDIR REVISION: hay acciones automaticas y otras que",
        "   necesitan aprobacion humana. Esa frontera es clave.",
        "",
        "7. SER OBSERVABLE: logs, trazas, decisiones, errores, costos.",
        "   Si algo sale mal, hay que poder entender que paso.",
      ],
    },
    {
      title: "CREACION DE AGENTES",
      lines: [
        "Armo agentes para tareas especificas o sistemas completos:",
        "",
        "- agente personal o de equipo",
        "- asistente tecnico para programacion",
        "- agente para revisar repositorios y PRs",
        "- agente para investigar y generar reportes",
        "- agente para interactuar con APIs internas",
        "- agente para manejar documentos y tickets",
        "- agente para soporte interno y automatizaciones",
        "- agente conectado a Telegram, Discord, Slack, WhatsApp",
        "- agente con herramientas propias, memoria y skills",
        "",
        "Primero entiendo el flujo. Despues decido si hace falta",
        "un agente, un script, una integracion o una mezcla.",
      ],
    },
    {
      title: "MANTENIMIENTO DE AGENTES EXISTENTES",
      lines: [
        "Muchos agentes acumulan deuda tecnica: prompts viejos,",
        "permisos amplios, costos altos, modelos que cambiaron,",
        "errores silenciosos, falta de logs, memoria contaminada.",
        "",
        "Puedo ordenar eso:",
        "",
        "- revision de arquitectura y prompts",
        "- separacion de herramientas peligrosas y seguras",
        "- mejora de tool calling y manejo de errores",
        "- testing de flujos y control de costos",
        "- actualizacion de modelos y migraciones",
        "- documentacion, monitoreo y hardening de seguridad",
        "- definicion de reglas de aprobacion humana",
      ],
    },
    {
      title: "MODELOS CLOUD Y LOCALES",
      lines: [
        "Trabajo con ambos. No siempre conviene lo mismo.",
        "",
        "CLOUD: mejor razonamiento, setup inicial rapido,",
        "  modelos frontier, buen tool calling, escalable.",
        "",
        "LOCAL: privacidad, costo recurrente bajo, control de",
        "  datos, independencia de proveedores, offline.",
        "",
        "HIBRIDO: modelo barato/local para tareas repetitivas,",
        "  modelo fuerte para planificacion, reglas deterministicas",
        "  para validaciones, scripts para acciones sin LLM.",
      ],
    },
    {
      title: "AGENTES PARA PROGRAMACION",
      lines: [
        "- revision de codigo y analisis de bugs",
        "- generacion de tests y refactors controlados",
        "- documentacion tecnica y revision de PRs",
        "- busqueda en repositorios y generacion de scripts",
        "- automatizacion de tareas DevOps y DevEx",
        "- agentes conectados a Docker, SSH o cloud",
        "",
        "No toca codigo sin contexto. Corre pruebas,",
        "muestra diffs y respeta el flujo del equipo.",
      ],
    },
    {
      title: "AGENTES DE INVESTIGACION",
      lines: [
        "- buscar informacion y comparar fuentes",
        "- resumir documentacion y monitorear cambios",
        "- generar reportes y seguir releases",
        "- leer papers y extraer conclusiones accionables",
        "- mantener una base de conocimiento",
        "",
        "El punto es disenar un proceso repetible:",
        "buscar, filtrar, citar, guardar, comparar y avisar.",
      ],
    },
    {
      title: "AGENTES DE OPERACION INTERNA",
      lines: [
        "- reportes diarios y control de tareas",
        "- seguimiento de tickets y clasificacion de mensajes",
        "- generacion de resumenes y actualizacion de docs",
        "- preparacion de reuniones y extraccion de datos",
        "- automatizacion de tareas administrativas",
        "",
        "Si una persona hace la misma operacion todos los",
        "dias, probablemente haya algo para automatizar.",
      ],
    },
    {
      title: "SEGURIDAD Y CONTROL",
      lines: [
        "Un agente con herramientas puede hacer dano",
        "aunque no tenga mala intencion.",
        "",
        "Principios de trabajo:",
        "- minimo privilegio: solo los permisos necesarios",
        "- separacion de entornos: dev, test, prod",
        "- aprobacion humana para acciones sensibles",
        "- logs y trazabilidad",
        "- sandboxing cuando ejecuta codigo",
        "- control de secretos",
        "- herramientas deterministicas para operaciones criticas",
        "- validaciones antes de actuar",
        "- listas de acciones permitidas y prohibidas",
      ],
    },
    {
      title: "ENTREGABLES",
      lines: [
        "- agente funcionando con documentacion",
        "- arquitectura del sistema y reglas",
        "- prompts, tools, skills reutilizables",
        "- scripts auxiliares y configuracion",
        "- checklist de seguridad",
        "- pruebas basicas y ejemplos de uso",
        "- plan de evolucion",
      ],
    },
    {
      title: "FORMATOS DE TRABAJO",
      lines: [
        "DIAGNOSTICO: revision de flujo existente para detectar",
        "  oportunidades, riesgos y arquitectura posible.",
        "",
        "MVP / PROTOTIPO: primera version funcional para validar",
        "  flujo, modelo, herramientas, costo y confiabilidad.",
        "",
        "IMPLEMENTACION COMPLETA: diseno, construccion, integracion,",
        "  documentacion y puesta en marcha.",
        "",
        "MANTENIMIENTO MENSUAL: ajustes, monitoreo, mejoras,",
        "  actualizacion de modelos, control de costos.",
        "",
        "CONSULTORIA TECNICA: arquitectura, stack, seguridad,",
        "  diseno de tools, estrategia cloud/local, debugging.",
      ],
    },
    {
      title: "QUE NO VENDO",
      lines: [
        "No vendo humo. No vendo magia.",
        "",
        "No vendo:",
        "- un empleado virtual que reemplaza todo",
        "- automatizacion 100% autonoma sin supervision",
        "- un agente que nunca se equivoca",
        "- IA magica que entiende tu negocio sin contexto",
        "- hacer todo con prompts",
        "- usar el modelo mas caro para cualquier cosa",
        "",
        "Un sistema bueno combina: programacion, arquitectura,",
        "prompts, herramientas, modelos, permisos, seguridad,",
        "documentacion, mantenimiento y criterio.",
      ],
    },
  ],
};

const DIAGNOSTIC = {
  intro: [
    "OK. VOY A HACERTE 4 PREGUNTAS RÁPIDAS.",
    "PODES RESPONDER CON LA LETRA O HACER CLIC EN LA OPCIÓN.",
  ],
  steps: [
    {
      step: "1/4",
      q: "QUE AREA QUERES MEJORAR?",
      options: [
        { key: "A", label: "ATENCIÓN AL CLIENTE" },
        { key: "B", label: "VENTAS" },
        { key: "C", label: "PROCESOS INTERNOS" },
        { key: "D", label: "ANÁLISIS DE DATOS" },
        { key: "E", label: "OTRO / NO ESTOY SEGURO" },
      ],
    },
    {
      step: "2/4",
      q: "QUE HERRAMIENTAS USAS HOY? (PODES ELEGIR VARIAS)",
      multi: true,
      options: [
        { key: "A", label: "WHATSAPP" },
        { key: "B", label: "GOOGLE SHEETS / EXCEL" },
        { key: "C", label: "CRM (HUBSPOT / PIPEDRIVE / OTRO)" },
        { key: "D", label: "EMAIL MARKETING" },
        { key: "E", label: "ERP / SISTEMA INTERNO" },
        { key: "F", label: "NOTION / AIRTABLE" },
        { key: "G", label: "NINGUNA / TODO MANUAL" },
      ],
    },
    {
      step: "3/4",
      q: "QUE NIVEL DE AUTOMATIZACIÓN BUSCAS?",
      options: [
        { key: "A", label: "ALGO SIMPLE Y RAPIDO (1-2 SEMANAS)" },
        { key: "B", label: "UNA SOLUCIÓN A MEDIDA (1-2 MESES)" },
        { key: "C", label: "UN AGENTE IA COMPLETO (2-4 MESES)" },
        { key: "D", label: "NO ESTOY SEGURO, NECESITO ASESORAMIENTO" },
      ],
    },
    {
      step: "4/4",
      q: "CUAL ES TU PRESUPUESTO APROXIMADO (USD)?",
      options: [
        { key: "A", label: "< 2.000" },
        { key: "B", label: "2.000 - 8.000" },
        { key: "C", label: "8.000 - 25.000" },
        { key: "D", label: "> 25.000" },
        { key: "E", label: "PREFIERO HABLARLO EN UNA LLAMADA" },
      ],
    },
  ],
};

function buildDiagnosis(answers) {
  // answers: [aKey, bKeys[], cKey, dKey]
  const [area, tools, level] = answers;
  const areaMap = {
    A: "ASISTENTE DE ATENCIÓN 24/7 CON HANDOFF A HUMANO",
    B: "AGENTE COMERCIAL + CALIFICACION AUTOMATICA DE LEADS",
    C: "AUTOMATIZACIÓN DE FLUJOS Y REPORTES INTERNOS",
    D: "AGENTE DE CONSULTA SOBRE TUS DATOS (NL2SQL + DASHBOARDS)",
    E: "AUDITORIA + ROADMAP DE OPORTUNIDADES IA",
  };
  const intMap = {
    A: "WHATSAPP CLOUD API",
    B: "INTEGRACIÓN CON SHEETS / EXCEL",
    C: "INTEGRACIÓN CON TU CRM",
    D: "PLATAFORMA DE EMAIL",
    E: "TU ERP / SISTEMA INTERNO",
    F: "NOTION / AIRTABLE",
  };
  const integrations = (tools || []).filter((k) => intMap[k]).map((k) => intMap[k]);
  const timeline = {
    A: "ESTIMADO: 1-2 SEMANAS",
    B: "ESTIMADO: 4-6 SEMANAS",
    C: "ESTIMADO: 8-12 SEMANAS",
    D: "ESTIMADO: SE DEFINE EN LA LLAMADA",
  }[level] || "ESTIMADO: SE DEFINE EN LA LLAMADA";

  return {
    primary: areaMap[area] || areaMap.E,
    integrations: integrations.length ? integrations : ["A DEFINIR EN EL KICKOFF"],
    timeline,
  };
}

const COMMANDS_META = [
  { cmd: "HOME", desc: "VUELVE A LA PANTALLA PRINCIPAL" },
  { cmd: "PROYECTOS", desc: "PROYECTOS PERSONALES EN CURSO" },
  { cmd: "AGENTES", desc: "SERVICIOS DE AGENTES IA Y AUTOMATIZACIÓN" },
  { cmd: "AGENT", desc: "HABLA CON EL AGENTE DEL SITIO" },
  { cmd: "MODEL", desc: "MUESTRA EL MODELO ACTIVO" },
  { cmd: "DIAGNOSE", desc: "INICIA UN DIAGNÓSTICO GUIADO" },
  { cmd: "ABOUT", desc: "QUIEN ESTA DEL OTRO LADO" },
  { cmd: "CONTACT", desc: "ABRE EL MODULO DE CONTACTO" },
  { cmd: "WHATSAPP", desc: "ABRE WHATSAPP" },
  { cmd: "AGENDAR", desc: "AGENDAR UNA LLAMADA DE 30 MIN" },
  { cmd: "THEME", desc: "CAMBIA EL TEMA: C64 / DARK / AMBER / LIGHT" },
  { cmd: "SOUND", desc: "ACTIVA O DESACTIVA EL BEEP" },
  { cmd: "CLEAR", desc: "LIMPIA LA PANTALLA" },
  { cmd: "REBOOT", desc: "REINICIA EL SISTEMA" },
];

const HERO = {
  banner: "**** INGENIO/64 — PERSONAL AI CONSOLE v2.0 ****",
  ram: "64K RAM SYSTEM   AGENT LINK READY   ZEN MODEL ONLINE",
  modules: [
    ["PERSONAL LOG", "OK"],
    ["AGENT CORE", "OK"],
    ["PROJECTS INDEX", "OK"],
    ["BACKEND LINK", "OK"],
  ],
  title: "FABIAN + IA / DIARIO DE CAMPO",
  sub: "MI SITIO PERSONAL PARA COMPARTIR COMO USO IA TODOS LOS DIAS: AGENTES, AUTOMATIZACIONES, CÓDIGO, DEVOPS, ERRORES, APRENDIZAJES Y EXPERIMENTOS REALES.",
};

const MODELS = [
  { id: "deepseek-v4-flash-free", label: "DEEPSEEK V4 FLASH", vendor: "OPENCODE ZEN", desc: "MODELO ACTIVO DEL BACKEND" },
  { id: "local-ollama", label: "LOCAL (OLLAMA)", vendor: "LOCAL", desc: "LAB / FUTURO ON-PREM" },
];

Object.assign(window, {
  AGENTES_DATA, PROJECTS_SECTION, ABOUT_SECTION,
  ABOUT_PROFILE, DIAGNOSTIC, COMMANDS_META, HERO, MODELS, buildDiagnosis,
});
