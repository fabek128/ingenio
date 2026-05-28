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

const AGENTES_SECTION = {
  markdownPath: "secciones/agentes/agentes.md",
  fallbackTitle: "SERVICIOS DE AGENTES IA",
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
  AGENTES_SECTION, PROJECTS_SECTION, ABOUT_SECTION,
  ABOUT_PROFILE, DIAGNOSTIC, COMMANDS_META, HERO, MODELS, buildDiagnosis,
});
