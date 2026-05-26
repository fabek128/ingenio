/* ============================================================
   INGENIO/64 — content (services, cases, diagnostic, etc.)
   All strings in Spanish, monospaced/uppercase tone.
   ============================================================ */

const SERVICES = [
  {
    id: "01",
    code: "AI_AGENTS",
    title: "AI AGENTS",
    body: "Agentes inteligentes para atencion, soporte, ventas y procesos internos. Razonan, consultan datos y ejecutan acciones.",
    tags: ["LLM", "TOOL-USE", "MEMORIA"],
  },
  {
    id: "02",
    code: "AUTOMATION_SYSTEMS",
    title: "AUTOMATION SYSTEMS",
    body: "Automatizacion de tareas repetitivas, flujos de trabajo e integraciones entre las herramientas que ya usas.",
    tags: ["WEBHOOKS", "CRON", "API"],
  },
  {
    id: "03",
    code: "CHATBOTS",
    title: "CHATBOTS",
    body: "Chatbots para web, WhatsApp, soporte, ecommerce y generacion de leads. Con handoff a humanos.",
    tags: ["WEB", "WHATSAPP", "LEADS"],
  },
  {
    id: "04",
    code: "CUSTOM_SOFTWARE",
    title: "CUSTOM SOFTWARE",
    body: "Sistemas a medida conectados con IA, APIs y bases de datos. Desde MVPs hasta plataformas internas.",
    tags: ["REACT", "NODE", "POSTGRES"],
  },
  {
    id: "05",
    code: "DATA_DASHBOARDS",
    title: "DATA & DASHBOARDS",
    body: "Paneles, reportes automaticos y analisis para decidir con datos en vez de intuicion.",
    tags: ["SQL", "BI", "VECTORES"],
  },
];

const CASES = [
  {
    id: "01",
    code: "ASISTENTE_ATENCION",
    title: "ASISTENTE DE ATENCION AL CLIENTE",
    body: "Agente que responde 24/7 sobre productos, envios y devoluciones. Consulta el CRM y deriva a un humano cuando hace falta. Reduce hasta 70% el tiempo de respuesta.",
    tags: ["AGENTE", "CRM", "RAG"],
  },
  {
    id: "02",
    code: "BOT_WHATSAPP_LEADS",
    title: "BOT DE WHATSAPP QUE CALIFICA LEADS",
    body: "Conversa con interesados, recolecta datos, agenda llamadas en el calendario del equipo comercial y deja todo cargado en el CRM.",
    tags: ["WHATSAPP", "CALENDARIO", "CRM"],
  },
  {
    id: "03",
    code: "REPORTES_AUTOMATICOS",
    title: "AUTOMATIZACION DE REPORTES INTERNOS",
    body: "Cada lunes a las 8:00 el sistema extrae datos de Sheets, Stripe y la base interna, arma un PDF y lo envia por mail al equipo directivo.",
    tags: ["ETL", "SCHEDULER", "PDF"],
  },
  {
    id: "04",
    code: "AGENTE_BASES_DATOS",
    title: "AGENTE QUE CONSULTA BASES DE DATOS",
    body: "Un agente en lenguaje natural: 'cuanto facturamos este mes en sucursal norte?'. Traduce a SQL, valida, ejecuta y devuelve la respuesta con grafico.",
    tags: ["SQL", "AGENT", "NL2SQL"],
  },
  {
    id: "05",
    code: "RAG_DOCUMENTACION",
    title: "RESPUESTAS CON DOCUMENTACION PRIVADA",
    body: "Subis manuales, contratos o procedimientos. El sistema arma una base vectorial y responde con citas a la fuente original.",
    tags: ["RAG", "VECTOR-DB", "CITAS"],
  },
];

const STACK = [
  ["FRONTEND", "HTML estatico / React UMD / consola retro"],
  ["BACKEND", "Python / FastAPI / Docker"],
  ["IA / LLM", "OpenCode Zen API / modelos OpenAI-compatible / Ollama experimental"],
  ["AGENTES", "ChatGPT Codex / Claude Code / OpenCode"],
  ["SEGURIDAD", "CSRF / cookies HttpOnly / rate limit / secretos fuera del repo"],
  ["INFRA", "Dokploy / Docker / NPM / VPN / localServer"],
  ["CONTENIDO", "Experiencias personales / herramientas / bitacora IA"],
];

const ABOUT_PROFILE = {
  photo: "assets/fabian-profile.jpg",
  name: "FABIAN FIGUEREDO",
  role: "SENIOR PROGRAMMER / TECH LEAD",
  company: "ASAP CONSULTING S.A.  //  INGENIO UNO",
  since: "COMMODORE 64 BASIC V2",
  stack: ".NET → JAVA → NODE.JS → PYTHON → AI",
  title: "ACERCA DE MI.",
};

const ABOUT_SECTION = {
  markdownPath: "secciones/about/about.md",
};


const EXPERIENCES = [
  {
    id: "01",
    code: "DAILY_AI_WORKFLOW",
    title: "MI FLUJO DIARIO CON IA",
    body: "Uso agentes como copilotos reales: para leer codigo, escribir documentacion, revisar seguridad, automatizar tareas y acelerar decisiones tecnicas sin delegar criterio.",
    tags: ["CODEX", "CLAUDE", "OPENCODE"],
  },
  {
    id: "02",
    code: "LOCAL_AND_CLOUD_MODELS",
    title: "MODELOS LOCALES Y CLOUD",
    body: "Experimento con modelos chicos, APIs compatibles con OpenAI y runtimes locales para entender costos, latencia, privacidad y calidad real en espanol.",
    tags: ["LLM", "OLLAMA", "ZEN"],
  },
  {
    id: "03",
    code: "AGENTIC_CONSOLE",
    title: "ESTA CONSOLA AGENTICA",
    body: "INGENIO/64 es mi laboratorio publico: una web tipo terminal donde comparto pruebas, errores, decisiones y aprendizajes sobre IA aplicada al trabajo diario.",
    tags: ["INGENIO64", "FASTAPI", "DOKPLOY"],
  },
  {
    id: "04",
    code: "SECURITY_FIRST",
    title: "SEGURIDAD ANTES QUE MAGIA",
    body: "Cada integracion con IA debe cuidar secretos, permisos, datos sensibles, logs y superficie publica. La IA acelera; no reemplaza criterio de seguridad.",
    tags: ["SECRETS", "DEVOPS", "REVIEW"],
  },
];

const PROJECTS_SECTION = {
  markdownPath: "secciones/proyectos/proyectos.md",
  fallbackTitle: "PROYECTOS PERSONALES",
};

const DIAGNOSTIC = {
  intro: [
    "OK. VOY A HACERTE 4 PREGUNTAS RAPIDAS.",
    "PODES RESPONDER CON LA LETRA O HACER CLIC EN LA OPCION.",
  ],
  steps: [
    {
      step: "1/4",
      q: "QUE AREA QUERES MEJORAR?",
      options: [
        { key: "A", label: "ATENCION AL CLIENTE" },
        { key: "B", label: "VENTAS" },
        { key: "C", label: "PROCESOS INTERNOS" },
        { key: "D", label: "ANALISIS DE DATOS" },
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
      q: "QUE NIVEL DE AUTOMATIZACION BUSCAS?",
      options: [
        { key: "A", label: "ALGO SIMPLE Y RAPIDO (1-2 SEMANAS)" },
        { key: "B", label: "UNA SOLUCION A MEDIDA (1-2 MESES)" },
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
    A: "ASISTENTE DE ATENCION 24/7 CON HANDOFF A HUMANO",
    B: "AGENTE COMERCIAL + CALIFICACION AUTOMATICA DE LEADS",
    C: "AUTOMATIZACION DE FLUJOS Y REPORTES INTERNOS",
    D: "AGENTE DE CONSULTA SOBRE TUS DATOS (NL2SQL + DASHBOARDS)",
    E: "AUDITORIA + ROADMAP DE OPORTUNIDADES IA",
  };
  const intMap = {
    A: "WHATSAPP CLOUD API",
    B: "INTEGRACION CON SHEETS / EXCEL",
    C: "INTEGRACION CON TU CRM",
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
  { cmd: "HELP", desc: "MUESTRA LOS COMANDOS DISPONIBLES" },
  { cmd: "EXPERIENCIAS", desc: "BITACORA DE USO REAL DE IA" },
  { cmd: "PROYECTOS", desc: "PROYECTOS PERSONALES EN CURSO" },
  { cmd: "AGENT", desc: "HABLA CON EL AGENTE DEL SITIO" },
  { cmd: "MODEL", desc: "MUESTRA EL MODELO ACTIVO" },
  { cmd: "SERVICES", desc: "SERVICIOS Y SOLUCIONES QUE PUEDO CONSTRUIR" },
  { cmd: "DIAGNOSE", desc: "INICIA UN DIAGNOSTICO GUIADO" },
  { cmd: "CASES", desc: "ABRE LA BASE DE CASOS DE USO" },
  { cmd: "STACK", desc: "MUESTRA EL STACK TECNOLOGICO" },
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
  sub: "MI SITIO PERSONAL PARA COMPARTIR COMO USO IA TODOS LOS DIAS: AGENTES, AUTOMATIZACIONES, CODIGO, DEVOPS, ERRORES, APRENDIZAJES Y EXPERIMENTOS REALES.",
};

const MODELS = [
  { id: "deepseek-v4-flash-free", label: "DEEPSEEK V4 FLASH", vendor: "OPENCODE ZEN", desc: "MODELO ACTIVO DEL BACKEND" },
  { id: "local-ollama", label: "LOCAL (OLLAMA)", vendor: "LOCAL", desc: "LAB / FUTURO ON-PREM" },
];

Object.assign(window, {
  SERVICES, CASES, STACK, EXPERIENCES, PROJECTS_SECTION, ABOUT_SECTION,
  ABOUT_PROFILE, DIAGNOSTIC, COMMANDS_META, HERO, MODELS, buildDiagnosis,
});
