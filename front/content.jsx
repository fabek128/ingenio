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
  ["FRONTEND", "React / Next.js / TypeScript"],
  ["BACKEND", "Node.js / Python / FastAPI"],
  ["IA / LLM", "OpenAI / Anthropic / Open-weights"],
  ["AGENTES", "Tool-use / RAG / Memoria"],
  ["AUTOMATIZACION", "n8n / Make / APIs / Webhooks"],
  ["DATOS", "PostgreSQL / Vector DB / Sheets"],
  ["INFRA", "Vercel / Railway / Docker"],
  ["MENSAJERIA", "WhatsApp Cloud / Telegram / Email"],
];

const ABOUT_PROFILE = {
  photo: "assets/fabian-profile.jpg",
  name: "FABIAN",
  role: "SENIOR PROGRAMMER / TECH LEAD",
  company: "ASAP CONSULTING S.A.  //  INGENIO UNO",
  since: "COMMODORE 64 BASIC",
  stack: ".NET → JAVA → NODE.JS → PYTHON → AI",
  title: "ACERCA DE MI.",
  bio: [
    "SOY FABIAN, PROGRAMADOR SENIOR, Y HACE MUCHOS ANOS QUE VENGO CONSTRUYENDO SOFTWARE, RESOLVIENDO PROBLEMAS REALES Y METIENDOME EN DISTINTOS FRENTES DE LA INDUSTRIA. EMPECE A PROGRAMAR CON UNA COMMODORE 64, DONDE APRENDI BASIC, Y LA VERDAD ES QUE DESDE AHI NO PARE MAS.",
    "MI RECORRIDO FUE CAMBIANDO JUNTO CON LA TECNOLOGIA: ARRANQUE PROGRAMANDO EN .NET, DESPUES PASE POR JAVA, MAS ADELANTE POR NODE.JS Y LUEGO POR PYTHON. EN EL CAMINO TAMBIEN TRABAJE EN DEVOPS, INTEGRACIONES, ARQUITECTURA Y LIDERAZGO TECNICO. ESO ME DIO UNA MIRADA BASTANTE AMPLIA, PERO SOBRE TODO MUY PRACTICA, DE COMO HACER QUE LA TECNOLOGIA SIRVA DE VERDAD.",
    "HOY TRABAJO EN ASAP CONSULTING S.A. COMO LIDER TECNICO, Y EN INGENIO UNO VUELCO TODA ESA EXPERIENCIA EN SOLUCIONES DE INTELIGENCIA ARTIFICIAL, AUTOMATIZACION Y SISTEMAS DE AGENTES. EN ESTA ETAPA ESTOY ENFOCANDOME FUERTE EN IA, EN COMO APLICARLA A PROBLEMAS CONCRETOS Y EN COMO CONVERTIRLA EN UNA HERRAMIENTA UTIL PARA PERSONAS Y EMPRESAS.",
  ],
};

const ABOUT_LINES = [
  "ABOUT_OPERATOR.TXT  -----------------------------------------",
  "",
  "OPERADOR:    INGENIO/64",
  "ROL:         CONSTRUCTORES DE SISTEMAS INTELIGENTES",
  "DESDE:       2019",
  "PROYECTOS:   +40 SISTEMAS EN PRODUCCION",
  "SECTORES:    ECOMMERCE / SERVICIOS / SAAS / EDUCACION",
  "",
  "ENFOQUE:",
  "  > NO VENDEMOS 'IA'. RESOLVEMOS PROBLEMAS CONCRETOS.",
  "  > EMPEZAMOS POR EL FLUJO MAS DOLOROSO, NO POR EL MAS",
  "    LUCIDOR.",
  "  > MEDIMOS IMPACTO EN HORAS AHORRADAS, NO EN TOKENS.",
  "",
  "FORMA DE TRABAJO:",
  "  1. DIAGNOSTICO (GRATIS, 30 MIN)",
  "  2. PROPUESTA Y PROTOTIPO (5-7 DIAS)",
  "  3. IMPLEMENTACION (2-6 SEMANAS)",
  "  4. SOPORTE Y OPTIMIZACION CONTINUA",
  "",
  "-------------------------------------------------------------",
];

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
  { cmd: "HOME",       desc: "VUELVE A LA PANTALLA PRINCIPAL" },
  { cmd: "HELP",       desc: "MUESTRA LOS COMANDOS DISPONIBLES" },
  { cmd: "SERVICES",   desc: "CARGA LOS MODULOS DE SERVICIO" },
  { cmd: "DIAGNOSE",   desc: "INICIA UN DIAGNOSTICO GUIADO" },
  { cmd: "CASES",      desc: "ABRE LA BASE DE CASOS DE USO" },
  { cmd: "STACK",      desc: "MUESTRA EL STACK TECNOLOGICO" },
  { cmd: "ABOUT",      desc: "QUIEN ESTA DEL OTRO LADO" },
  { cmd: "CONTACT",    desc: "ABRE EL MODULO DE CONTACTO" },
  { cmd: "WHATSAPP",   desc: "ABRE WHATSAPP" },
  { cmd: "AGENDAR",    desc: "AGENDAR UNA LLAMADA DE 30 MIN" },
  { cmd: "THEME",      desc: "CAMBIA EL TEMA: C64 / DARK / AMBER / LIGHT" },
  { cmd: "SOUND",      desc: "ACTIVA O DESACTIVA EL BEEP" },
  { cmd: "CLEAR",      desc: "LIMPIA LA PANTALLA" },
  { cmd: "REBOOT",     desc: "REINICIA EL SISTEMA" },
];

const HERO = {
  banner: "**** INGENIO/64 — AI SERVICE SYSTEM v1.0 ****",
  ram: "64K RAM SYSTEM   38911 BASIC BYTES FREE",
  modules: [
    ["AGENT CORE", "OK"],
    ["AUTOMATION ENGINE", "OK"],
    ["KNOWLEDGE BASE", "OK"],
    ["INTERFACE LAYER", "OK"],
  ],
  title: "HUMAN + AI SYSTEMS",
  sub: "DESARROLLO DE AGENTES IA, AUTOMATIZACIONES Y SISTEMAS INTELIGENTES A MEDIDA. PARA EQUIPOS QUE QUIEREN DEJAR DE HACER LO REPETITIVO.",
};

const MODELS = [
  { id: "gpt-5",             label: "GPT-5",              vendor: "OPENAI",    desc: "GENERAL-PURPOSE / LARGE CONTEXT" },
  { id: "claude-sonnet-4-5", label: "CLAUDE SONNET 4.5",  vendor: "ANTHROPIC", desc: "BALANCEADO / RAZONAMIENTO" },
  { id: "claude-haiku-4-5",  label: "CLAUDE HAIKU 4.5",   vendor: "ANTHROPIC", desc: "RAPIDO Y ECONOMICO" },
  { id: "gemini-2-5-pro",    label: "GEMINI 2.5 PRO",     vendor: "GOOGLE",    desc: "MULTIMODAL / CONTEXTO LARGO" },
  { id: "llama-3-3-70b",     label: "LLAMA 3.3 70B",      vendor: "META",      desc: "OPEN-WEIGHTS / DEPLOY PROPIO" },
  { id: "local-ollama",      label: "LOCAL (OLLAMA)",     vendor: "LOCAL",     desc: "ON-PREM / PRIVADO" },
];

Object.assign(window, {
  SERVICES, CASES, STACK, ABOUT_LINES, ABOUT_PROFILE, DIAGNOSTIC,
  COMMANDS_META, HERO, buildDiagnosis, MODELS,
});
