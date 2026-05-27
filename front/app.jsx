/* ============================================================
   INGENIO/64 — App
   ============================================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---------- Audio: tiny beep generator (no assets) ---------- */
let _audioCtx = null;
function beep(freq = 880, dur = 0.04, vol = 0.04, type = "square") {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur);
  } catch (e) {}
}

/* ---------- Typewriter hook: typed-out text reveal ---------- */
function useTyped(text, speed = 12, enabled = true) {
  const [out, setOut] = useState(enabled ? "" : text);
  useEffect(() => {
    if (!enabled) { setOut(text); return; }
    setOut("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed, enabled]);
  return out;
}

function envInt(name, fallback, { min = 0, max = 1000 } = {}) {
  const raw = window[name];
  const value = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function typingSpeedMs() {
  return envInt("INGENIO_RESPONSE_TYPE_SPEED_MS", 6, { min: 0, max: 250 });
}

/* ---------- Backend API client (session + CSRF) ---------- */
let _apiCsrfToken = null;

function apiBaseUrl() {
  if (window.INGENIO_API_BASE_URL) return window.INGENIO_API_BASE_URL.replace(/\/$/, "");
  const host = window.location.hostname;
  const isLocalStatic = (host === "localhost" || host === "127.0.0.1") && window.location.port === "8000";
  return isLocalStatic ? "http://127.0.0.1:8080" : "";
}

async function ensureApiSession() {
  if (_apiCsrfToken) return _apiCsrfToken;
  const res = await fetch(apiBaseUrl() + "/api/session", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("SESSION_FAILED");
  const data = await res.json();
  _apiCsrfToken = data.csrf_token;
  return _apiCsrfToken;
}

async function fetchSiteContext() {
  const res = await fetch(apiBaseUrl() + "/api/site-context", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("SITE_CONTEXT_FAILED");
  return res.json();
}

async function askBackendAgent(message) {
  const csrf = await ensureApiSession();
  const res = await fetch(apiBaseUrl() + "/api/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Ingenio-CSRF": csrf,
    },
    body: JSON.stringify({ message }),
  });
  if (res.status === 401 || res.status === 403) {
    _apiCsrfToken = null;
    throw new Error("SESSION_REJECTED");
  }
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (res.status === 413) throw new Error("MESSAGE_TOO_LONG");
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail || ""; } catch (e) {}
    if (detail === "model_empty_response") throw new Error("MODEL_EMPTY_RESPONSE");
    if (detail === "model_timeout") throw new Error("MODEL_TIMEOUT");
    if (detail === "model_unavailable") throw new Error("MODEL_UNAVAILABLE");
    throw new Error("AGENT_FAILED");
  }
  return res.json();
}

function agentErrorMessage(error) {
  const code = error?.message || "AGENT_FAILED";
  const map = {
    SESSION_FAILED: "NO PUDE INICIAR SESION CON EL BACKEND. VERIFICA QUE LA API ESTE ONLINE.",
    SESSION_REJECTED: "LA SESION FUE RECHAZADA. RECARGA LA PAGINA O INTENTA DE NUEVO.",
    RATE_LIMITED: "DEMASIADAS CONSULTAS EN POCO TIEMPO. ESPERA UN MINUTO Y PROBA DE NUEVO.",
    MESSAGE_TOO_LONG: "EL MENSAJE ES DEMASIADO LARGO. RESUMILO Y VOLVE A ENVIARLO.",
    SITE_CONTEXT_FAILED: "NO PUDE LEER EL ESTADO DEL MODELO EN EL BACKEND.",
    MODEL_EMPTY_RESPONSE: "EL MODELO RESPONDIO SIN TEXTO FINAL. PROBA REFORMULAR EL PROMPT O INTENTA DE NUEVO.",
    MODEL_TIMEOUT: "EL MODELO TARDO DEMASIADO EN RESPONDER. INTENTA DE NUEVO CON UN PROMPT MAS CORTO.",
    MODEL_UNAVAILABLE: "EL PROVEEDOR DEL MODELO NO ESTA DISPONIBLE EN ESTE MOMENTO.",
    AGENT_FAILED: "EL AGENTE NO RESPONDIO. PUEDE SER UN ERROR TEMPORAL DEL MODELO O DEL BACKEND.",
  };
  return map[code] || map.AGENT_FAILED;
}

function formatAgentResponse(question, data) {
  const model = data?.model || "UNKNOWN";
  const reply = data?.reply || "SIN RESPUESTA DEL MODELO.";
  return [
    "PROMPT:",
    "> " + question,
    "",
    "MODEL: " + model,
    "",
    "RESPUESTA:",
    reply,
  ].join("\n");
}

const AGENT_CHAT_STORAGE_KEY = "ingenio_agent_chat_v1";

function formatAgentHistoryResponse(data) {
  return data?.reply || "SIN RESPUESTA DEL MODELO.";
}

function createAgentMessage(role, text, status = "done") {
  return {
    id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
    role,
    text,
    status,
    ts: new Date().toISOString(),
  };
}

function loadAgentMessages() {
  try {
    const raw = window.sessionStorage?.getItem(AGENT_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
      .slice(-40);
  } catch (e) {
    return [];
  }
}

function saveAgentMessages(messages) {
  try {
    window.sessionStorage?.setItem(AGENT_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch (e) {}
}

/* ============================================================
   BOOT SCREEN
   ============================================================ */
function BootScreen({ onDone, theme, static: isStatic }) {
  const lines = [
    { t: "INGENIO/64 KERNEL ROM v1.0.4 — BOOT SEQUENCE", cls: "bright" },
    { t: "(C) 2025 INGENIO/64. ALL RIGHTS RESERVED.", cls: "dim" },
    { t: "" },
    { t: "[ OK ] CPU.....................6510 @ 1.023 MHZ", cls: "" },
    { t: "[ OK ] MEMORY..................64K RAM", cls: "" },
    { t: "[ OK ] STORAGE.................VECTOR DB MOUNTED", cls: "" },
    { t: "[ OK ] AGENT CORE..............LOADED", cls: "" },
    { t: "[ OK ] AUTOMATION ENGINE.......LOADED", cls: "" },
    { t: "[ OK ] KNOWLEDGE BASE..........38911 ENTRIES", cls: "" },
    { t: "[ OK ] INTERFACE LAYER.........CRT MODE", cls: "" },
    { t: "" },
    { t: "READY.", cls: "bright" },
  ];

  const [shownCount, setShownCount] = useState(isStatic ? lines.length : 0);
  const [progress, setProgress] = useState(isStatic ? 100 : 0);

  useEffect(() => {
    if (isStatic) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setShownCount(i);
      setProgress(Math.min(100, Math.round((i / lines.length) * 100)));
      if (i >= lines.length) {
        clearInterval(interval);
        setTimeout(() => onDone(), 600);
      }
    }, 180);
    return () => clearInterval(interval);
  }, [isStatic]);

  return (
    <div className={"boot" + (isStatic ? " static" : "")}>
      {!isStatic && <button className="boot-skip" onClick={onDone}>SKIP &gt;&gt;</button>}
      <div className="boot-banner">{HERO.banner}</div>
      <div className="boot-subline">{HERO.ram}</div>
      <div className="boot-progress" aria-hidden="true">
        <div className="boot-progress-fill" style={{ width: progress + "%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {lines.slice(0, shownCount).map((l, i) => (
          <div key={i} className={"boot-line " + (l.cls || "")}>
            {l.t || "\u00A0"}
          </div>
        ))}
        {!isStatic && shownCount < lines.length && <span className="boot-cursor" />}
        {isStatic && <span className="boot-cursor blink" />}
      </div>
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function SysHeader({ theme, onTheme }) {
  const themes = [
    { id: "c64", icon: (
      <svg viewBox="0 0 20 18" width="18" height="16" fill="currentColor">
        <rect x="1" y="1" width="7" height="7" rx="1" />
        <rect x="1" y="10" width="7" height="7" rx="1" />
        <rect x="12" y="1" width="7" height="16" rx="1" />
      </svg>
    ), title: "C64" },
    { id: "dark", icon: (
      <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
        <path d="M16.8 12.4A8 8 0 1 1 7.6 3.2a9 9 0 0 0 9.2 9.2z"/>
      </svg>
    ), title: "Dark" },
    { id: "amber", icon: (
      <svg viewBox="0 0 20 18" width="18" height="16" fill="currentColor">
        <path d="M2 2h16v2H2zm0 7h14v2H2zm0 7h12v2H2z"/>
      </svg>
    ), title: "Amber" },
    { id: "light", icon: (
      <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
        <circle cx="10" cy="10" r="4"/>
        <path d="M10 1v2m0 14v2M1 10h2m14 0h2m-3.5-5.5L12 6m-4 4-1.5 1.5m7 0L12 14M6 6 4.5 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    ), title: "Light" },
  ];

  return (
    <div className="sys-header">
      <div className="brand">
        <span className="brand-mark" />
        INGENIO/64
      </div>
      <div className="status-group">
      </div>
      <div className="theme-pill" aria-label="Theme selector">
        {themes.map((t) => (
          <button
            key={t.id}
            aria-pressed={theme === t.id}
            onClick={() => onTheme(t.id)}
            title={t.title}
          >{t.icon}</button>
        ))}
      </div>
    </div>
  );
}


/* ============================================================
   FEED LINES + INLINE BLOCKS
   ============================================================ */

function FeedLine({ entry, onCommand }) {
  // entries can be: {type:'user'|'sys'|'agent'|'ok'|'error'|'dim', text, typed}
  // or {type:'block', kind:'services'|'cases'|'about'|'hero'|'diag'|'contact', data}
  if (entry.type === "block") {
    return <BlockRenderer entry={entry} onCommand={onCommand} />;
  }
  const cls = "line " + entry.type;
  const text = entry.text || "";
  const typedText = entry.typed ? useTyped(text, entry.type === "agent" ? 8 : 4, true) : text;
  if (entry.type === "user") {
    return <div className={cls}><span className="prompt-mark">&gt;</span>{text}</div>;
  }
  if (entry.type === "agent") {
    return <div className={cls}><span className="role">AGENT:</span><br/>{typedText}</div>;
  }
  if (entry.type === "sys") {
    return <div className={cls}>{typedText}</div>;
  }
  return <div className={cls}>{text}</div>;
}

function BlockRenderer({ entry, onCommand }) {
  switch (entry.kind) {
    case "hero": return <HeroBlock onCommand={onCommand} />;
    case "projects": return <ProjectsBlock />;
    case "services": return <ServicesBlock onCommand={onCommand} />;
    case "cases": return <CasesBlock />;
    case "about": return <AboutBlock />;
    case "diag": return <DiagnosticBlock onCommand={onCommand} initial={entry.initial} />;
    case "contact": return <ContactBlock onCommand={onCommand} prefill={entry.prefill} />;
    default: return null;
  }
}

/* ---------- Hero (post-boot) ---------- */
function HeroBlock({ onCommand }) {
  return (
    <div className="hero-banner">
      <div className="stars">{"* ".repeat(28).trim()}</div>
      <div className="title">{HERO.title}</div>
      <div className="sub">{HERO.sub}</div>
      <div className="hero-ctas">
        <button className="hero-cta primary" onClick={() => onCommand("AGENT Como usas IA todos los dias?")}>&gt; PREGUNTAR_AL_AGENTE</button>
        <button className="hero-cta" onClick={() => onCommand("PROYECTOS")}>&gt; PROYECTOS</button>
      </div>
      <div className="stars" style={{ marginTop: 16 }}>{"* ".repeat(28).trim()}</div>
    </div>
  );
}




/* ---------- PROYECTOS ---------- */
function renderMarkdownInline(text) {
  const parts = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer">
        {m[1]}
      </a>
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownDocument({ source }) {
  const lines = (source || "").split(/\r?\n/);
  const nodes = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) nodes.push(<p key={nodes.length}>{renderMarkdownInline(text)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    nodes.push(
      <ul key={nodes.length}>
        {list.map((item, i) => <li key={i}>{renderMarkdownInline(item)}</li>)}
      </ul>
    );
    list = [];
  };

  lines.forEach((line) => {
    const raw = line.trim();
    if (!raw) { flushParagraph(); flushList(); return; }
    const heading = raw.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level === 1) nodes.push(<h2 key={nodes.length}>{text}</h2>);
      else if (level === 2) nodes.push(<h3 key={nodes.length}>{text}</h3>);
      else nodes.push(<h4 key={nodes.length}>{text}</h4>);
      return;
    }
    const bullet = raw.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      return;
    }
    flushList();
    paragraph.push(raw);
  });
  flushParagraph();
  flushList();

  return <div className="markdown-doc">{nodes}</div>;
}

function ProjectsBlock() {
  const [state, setState] = useState({ status: "loading", source: "" });

  useEffect(() => {
    let active = true;
    fetch(PROJECTS_SECTION.markdownPath, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("PROJECTS_MD_NOT_FOUND");
        return res.text();
      })
      .then((source) => { if (active) setState({ status: "ready", source }); })
      .catch(() => { if (active) setState({ status: "error", source: "" }); });
    return () => { active = false; };
  }, []);

  return (
    <div className="block projects-block">
      <div className="block-title"><span className="badge">IDX</span>PROJECTS.INDEX</div>
      {state.status === "loading" && <div className="module-body">LEYENDO /SECCIONES/PROYECTOS/PROYECTOS.MD...</div>}
      {state.status === "error" && (
        <div className="module-body" style={{ color: "var(--error-color)" }}>
          NO PUDE CARGAR EL ARCHIVO DE PROYECTOS. VERIFICAR front/secciones/proyectos/proyectos.md.
        </div>
      )}
      {state.status === "ready" && <MarkdownDocument source={state.source} />}
    </div>
  );
}

/* ---------- SERVICES ---------- */
function ServicesBlock({ onCommand }) {
  return (
    <div className="block">
      <div className="block-title"><span className="badge">LOAD</span>SERVICE_MODULES.SYS</div>
      <div style={{ color: "var(--fg-dim)", fontSize: 16, marginBottom: 8, fontFamily: "var(--font-ui)" }}>
        LOADING 5 MODULES... DONE.
      </div>
      <div className="modules">
        {SERVICES.map((s) => (
          <div key={s.id} className="module" onClick={() => onCommand("DIAGNOSE")}>
            <div className="module-header">
              <span className="module-id">[{s.id}]</span>
              <span className="module-title">{s.title}</span>
            </div>
            <div className="module-body">{s.body}</div>
            <div className="module-meta">
              {s.tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, color: "var(--fg-dim)", fontSize: 16, fontFamily: "var(--font-ui)" }}>
        ESCRIBI &gt; DIAGNOSE PARA UN DIAGNOSTICO RAPIDO. &nbsp;O &gt; CONTACT PARA HABLAR.
      </div>
    </div>
  );
}

/* ---------- CASES (expandable) ---------- */
function CasesBlock() {
  const [open, setOpen] = useState({});
  return (
    <div className="block">
      <div className="block-title"><span className="badge">DB</span>USE_CASE_DATABASE.IDX</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {CASES.map((c) => {
          const isOpen = open[c.id];
          return (
            <div key={c.id} style={{ borderBottom: "1px dashed color-mix(in srgb, var(--border) 30%, transparent)", paddingBottom: 6 }}>
              <button
                onClick={() => setOpen({ ...open, [c.id]: !isOpen })}
                style={{
                  width: "100%", textAlign: "left", background: "transparent",
                  border: "none", color: "var(--fg-bright)", fontFamily: "var(--font-mono)",
                  fontSize: 22, cursor: "pointer", padding: "4px 0",
                  display: "flex", gap: 10, alignItems: "baseline"
                }}
              >
                <span style={{ color: "var(--fg-dim)" }}>{isOpen ? "[-]" : "[+]"}</span>
                <span className="module-id">[{c.id}]</span>
                <span>{c.title}</span>
              </button>
              {isOpen && (
                <div style={{ padding: "6px 0 10px 50px", color: "var(--fg)" }}>
                  <div style={{ marginBottom: 8 }}>{c.body}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {c.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ---------- ABOUT ---------- */
function AboutBlock() {
  const [state, setState] = useState({ status: "loading", source: "" });

  useEffect(() => {
    let active = true;
    fetch(ABOUT_SECTION.markdownPath, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("ABOUT_MD_NOT_FOUND");
        return res.text();
      })
      .then((source) => { if (active) setState({ status: "ready", source }); })
      .catch(() => { if (active) setState({ status: "error", source: "" }); });
    return () => { active = false; };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Photo + meta card */}
      <div className="about-card">
        <div className="about-photo-wrap">
          <div className="about-photo-frame">
            <img
              src={ABOUT_PROFILE.photo}
              alt={ABOUT_PROFILE.name}
              className="about-photo"
              draggable="false"
            />
            <div className="about-photo-scan" aria-hidden="true" />
            <div className="about-photo-corners" aria-hidden="true">
              <span/><span/><span/><span/>
            </div>
          </div>
          <div className="about-photo-caption">
            <span style={{ color: "var(--fg-dim)" }}>FILE://</span>
            <span style={{ color: "var(--fg-bright)" }}>PROFILE.IMG</span>
            <span style={{ color: "var(--fg-dim)" }}>  240x240  RGB</span>
          </div>
        </div>

        <div className="about-meta">
          <div className="about-title">{ABOUT_PROFILE.title}</div>
          <div className="about-rows">
            {[
              ["NAME",    ABOUT_PROFILE.name],
              ["ROLE",    ABOUT_PROFILE.role],
              ["COMPANY", ABOUT_PROFILE.company],
              ["SINCE",   ABOUT_PROFILE.since],
              ["STACK",   ABOUT_PROFILE.stack],
              ["STATUS",  <><span className="status-dot"/> ONLINE — LISTO PARA CONSTRUIR</>],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <div className="about-k">{k}</div>
                <div className="about-v">{v}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Bio + footer desde .md */}
      <div className="about-bio">
        {state.status === "loading" && <div className="module-body">LEYENDO /SECCIONES/ABOUT/ABOUT.MD...</div>}
        {state.status === "error" && (
          <div className="module-body" style={{ color: "var(--error-color)" }}>
            NO PUDE CARGAR EL ARCHIVO ABOUT. VERIFICAR front/secciones/about/about.md.
          </div>
        )}
        {state.status === "ready" && <MarkdownDocument source={state.source} />}
      </div>
    </div>
  );
}

/* ---------- DIAGNOSTIC WIZARD ---------- */
function DiagnosticBlock({ onCommand }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [multiSel, setMultiSel] = useState([]); // for the multi-select step
  const [done, setDone] = useState(false);

  if (done) {
    const res = buildDiagnosis(answers);
    return (
      <div className="block">
        <div className="block-title"><span className="badge">DIAG</span>DIAGNOSTIC COMPLETE</div>
        <div style={{ marginBottom: 10 }}>
          <span style={{ color: "var(--ok-color)", fontWeight: 600 }}>DIAGNOSTICO COMPLETO.</span>
        </div>
        <div style={{ marginBottom: 6, color: "var(--fg-dim)", fontFamily: "var(--font-ui)", fontSize: 13, letterSpacing: "0.08em" }}>POSIBLE SOLUCION:</div>
        <div style={{ color: "var(--fg-bright)", fontSize: 24, marginBottom: 14 }}>&gt; {res.primary}</div>

        <div style={{ marginBottom: 6, color: "var(--fg-dim)", fontFamily: "var(--font-ui)", fontSize: 13, letterSpacing: "0.08em" }}>INTEGRACIONES SUGERIDAS:</div>
        <ul style={{ margin: "0 0 14px 0", padding: 0, listStyle: "none" }}>
          {res.integrations.map((i) => <li key={i} style={{ color: "var(--fg)" }}>- {i}</li>)}
        </ul>

        <div style={{ marginBottom: 6, color: "var(--fg-dim)", fontFamily: "var(--font-ui)", fontSize: 13, letterSpacing: "0.08em" }}>{res.timeline}</div>

        <div style={{ marginTop: 16, color: "var(--fg-bright)" }}>SIGUIENTE PASO:</div>
        <div className="hero-ctas">
          <button className="hero-cta primary" onClick={() => onCommand("CONTACT", { prefill: { que: res.primary } })}>&gt; ENVIAR_CONSULTA</button>
          <button className="hero-cta" onClick={() => onCommand("AGENDAR")}>&gt; AGENDAR_LLAMADA</button>
          <button className="hero-cta" onClick={() => onCommand("WHATSAPP")}>&gt; WHATSAPP</button>
        </div>
      </div>
    );
  }

  const step = DIAGNOSTIC.steps[stepIdx];
  const pickOpt = (key) => {
    if (step.multi) {
      setMultiSel((sel) => sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key]);
      return;
    }
    const next = [...answers, key];
    if (stepIdx + 1 >= DIAGNOSTIC.steps.length) {
      setAnswers(next);
      setDone(true);
    } else {
      setAnswers(next);
      setStepIdx(stepIdx + 1);
    }
  };
  const confirmMulti = () => {
    const next = [...answers, multiSel.slice()];
    setMultiSel([]);
    if (stepIdx + 1 >= DIAGNOSTIC.steps.length) {
      setAnswers(next); setDone(true);
    } else {
      setAnswers(next); setStepIdx(stepIdx + 1);
    }
  };

  return (
    <div className="block">
      <div className="block-title"><span className="badge">DIAG</span>DIAGNOSTICO INTERACTIVO &nbsp;{step.step}</div>
      {stepIdx === 0 && (
        <div style={{ color: "var(--fg)", marginBottom: 10 }}>
          {DIAGNOSTIC.intro.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
      <div style={{ color: "var(--fg-bright)", fontSize: 24, marginBottom: 4 }}>
        <span style={{ color: "var(--fg-dim)", fontFamily: "var(--font-ui)", fontSize: 14, marginRight: 8, letterSpacing: "0.08em" }}>{step.step} —</span>
        {step.q}
      </div>
      <div className="wizard-options">
        {step.options.map((o) => {
          const selected = step.multi && multiSel.includes(o.key);
          return (
            <button
              key={o.key}
              className="wizard-option"
              onClick={() => pickOpt(o.key)}
              style={selected ? { background: "var(--selection)", color: "var(--selection-fg)" } : {}}
            >
              <span className="key" style={selected ? { background: "var(--selection-fg)", color: "var(--selection)" } : {}}>{o.key}</span>
              <span>{o.label}</span>
              {selected && <span style={{ marginLeft: "auto" }}>[X]</span>}
            </button>
          );
        })}
      </div>
      {step.multi && (
        <div className="confirm-row">
          <button className="btn-confirm" onClick={confirmMulti} disabled={multiSel.length === 0} style={multiSel.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
            CONFIRMAR [{multiSel.length}]
          </button>
          <div style={{ color: "var(--fg-dim)", fontFamily: "var(--font-ui)", fontSize: 12, letterSpacing: "0.06em" }}>
            ELEGI TODAS LAS QUE APLIQUEN
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- CONTACT FORM ---------- */
function ContactBlock({ onCommand, prefill }) {
  const [form, setForm] = useState({
    nombre: "", email: "", empresa: "", que: prefill?.que || "", presupuesto: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [confirmStage, setConfirmStage] = useState(false);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const filled = form.nombre.trim() && form.email.trim() && form.que.trim();

  if (submitted) {
    return (
      <div className="block">
        <div className="block-title"><span className="badge">SENT</span>CONTACT_MODULE.LOG</div>
        <div style={{ color: "var(--ok-color)", fontSize: 24 }}>&gt; TRANSMISION COMPLETA.</div>
        <div style={{ marginTop: 8 }}>RECIBIMOS TU CONSULTA. RESPONDEMOS EN MENOS DE 24HS HABILES.</div>
        <div style={{ marginTop: 8, color: "var(--fg-dim)" }}>
          ID DE TICKET: <span style={{ color: "var(--fg-bright)" }}>#{Math.random().toString(36).slice(2, 8).toUpperCase()}</span>
        </div>
        <div className="hero-ctas">
          <button className="hero-cta" onClick={() => onCommand("AGENDAR")}>&gt; AGENDAR_LLAMADA</button>
          <button className="hero-cta" onClick={() => onCommand("WHATSAPP")}>&gt; WHATSAPP</button>
          <button className="hero-cta" onClick={() => onCommand("CLEAR")}>&gt; CLEAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div className="block-title"><span className="badge">FORM</span>CONTACT_MODULE</div>
      <div className="console-form">
        {[
          ["nombre", "NOMBRE", "JUAN PEREZ"],
          ["email", "EMAIL", "JUAN@EMPRESA.COM"],
          ["empresa", "EMPRESA", "ACME S.A. (OPCIONAL)"],
        ].map(([k, label, ph]) => (
          <div className="field" key={k}>
            <div className="field-label">{label}:</div>
            <input
              value={form[k]}
              onChange={(e) => setF(k, e.target.value)}
              placeholder={ph}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        ))}
        <div className="field">
          <div className="field-label">QUE NECESITAS?:</div>
          <textarea
            value={form.que}
            onChange={(e) => setF("que", e.target.value)}
            placeholder="CONTAME BREVEMENTE..."
            rows={2}
          />
        </div>
        <div className="field">
          <div className="field-label">PRESUPUESTO?:</div>
          <input
            value={form.presupuesto}
            onChange={(e) => setF("presupuesto", e.target.value)}
            placeholder="OPCIONAL — USD"
          />
        </div>
      </div>

      {!confirmStage ? (
        <div className="confirm-row">
          <button
            className="btn-confirm"
            disabled={!filled}
            style={!filled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            onClick={() => setConfirmStage(true)}
          >REVISAR Y ENVIAR</button>
          <div style={{ color: "var(--fg-dim)", fontFamily: "var(--font-ui)", fontSize: 12 }}>
            CAMPOS REQUERIDOS: NOMBRE, EMAIL, QUE NECESITAS
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: "var(--fg-bright)" }}>ENVIAR? [Y/N]</div>
          <div className="confirm-row">
            <button className="btn-confirm" onClick={() => setSubmitted(true)}>[Y] CONFIRMAR</button>
            <button className="btn-confirm ghost" onClick={() => setConfirmStage(false)}>[N] EDITAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMMAND BAR (input + quick buttons + autocomplete)
   ============================================================ */
function CommandBar({ onSubmit, value, setValue, history, setHistory, disabled = false }) {
  const [hIdx, setHIdx] = useState(-1);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);

  // Focus input on click anywhere in screen (but not on form fields)
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "button") return;
      inputRef.current?.focus();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const suggestions = useMemo(() => {
    if (!value) return [];
    const v = value.toUpperCase().trim();
    return COMMANDS_META.filter((c) => c.cmd.startsWith(v) && c.cmd !== v).slice(0, 6);
  }, [value]);

  const submit = (cmd) => {
    const c = (cmd || value).trim();
    if (!c || disabled) return;
    onSubmit(c);
    setValue("");
    setHistory((h) => [c, ...h].slice(0, 50));
    setHIdx(-1);
    setActive(-1);
  };

  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && suggestions[active]) {
        submit(suggestions[active].cmd);
      } else {
        submit();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length) {
        setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
      } else if (history.length) {
        const ni = Math.min(hIdx + 1, history.length - 1);
        setHIdx(ni); setValue(history[ni] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length) {
        setActive((a) => (a >= suggestions.length - 1 ? 0 : a + 1));
      } else if (hIdx > 0) {
        const ni = hIdx - 1; setHIdx(ni); setValue(history[ni] || "");
      } else {
        setHIdx(-1); setValue("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length) {
        setValue(suggestions[0].cmd);
        setActive(-1);
      }
    } else if (e.key === "Escape") {
      setValue("");
      setActive(-1);
    }
  };

  const quickButtons = ["HOME", "PROYECTOS", "AGENT", "ABOUT", "CONTACT"];

  return (
    <div className="command-bar">
      <div className="quick-row" role="toolbar" aria-label="Quick commands">
        {quickButtons.map((q) => (
          <button key={q} className="quick-btn" onClick={() => submit(q)} disabled={disabled}>
            <span className="k">&gt;</span>{q}
          </button>
        ))}
      </div>
      <div className="input-row" style={{ position: "relative" }}>
        {suggestions.length > 0 && (
          <div className="suggest">
            {suggestions.map((s, i) => (
              <div
                key={s.cmd}
                className={"suggest-item " + (i === active ? "active" : "")}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); submit(s.cmd); }}
              >
                <span style={{ fontWeight: 600 }}>&gt; {s.cmd}</span>
                <span className="desc">{s.desc}</span>
              </div>
            ))}
          </div>
        )}
        <span className="prompt-glyph">&gt;</span>
        <input
          ref={inputRef}
          className="cmd"
          value={value}
          onChange={(e) => { setValue(e.target.value); setHIdx(-1); setActive(-1); }}
          onKeyDown={onKey}
          disabled={disabled}
          placeholder={disabled ? "ESPERANDO RESPUESTA DEL MODELO..." : "ESCRIBI TU PROMPT O UN COMANDO... (TAB AUTOCOMPLETA)"}
          autoComplete="off"
          spellCheck="false"
          autoFocus
        />
        {!value && <span className="fake-cursor" />}
        <span className="submit-hint">{disabled ? "[WAIT]" : "[ENTER]"}</span>
      </div>
    </div>
  );
}

/* ============================================================
   VIEW SHELL — chrome around each module
   ============================================================ */
function ViewShell({ tag, title, path, onClose, children, onReset, onResetLabel }) {
  return (
    <div className="view">
      <div className="view-bar">
        <div className="view-tag">[{tag}]</div>
        <div className="view-title">{title}</div>
        {path && <div className="view-path">{path}</div>}
        <div className="view-actions">
          {onReset && (
            <button className="view-reset" onClick={onReset} title={onResetLabel || "RESET CTX"}>
              <span className="x">!</span>
              <span>{onResetLabel || "RESET CTX"}</span>
            </button>
          )}
          <button className="view-close" onClick={onClose} title="Volver al inicio (ESC)">
            <span className="x">X</span>
            <span>CLOSE / ESC</span>
          </button>
        </div>
      </div>
      <div className="view-body">
        <div className="view-content">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   HOME VIEW
   ============================================================ */
function HomeView({ onCommand }) {
  return (
    <div className="home">
      <div className="home-body">
        <div className="home-content">
          <div style={{ color: "var(--sys-color)" }}>{HERO.banner}</div>
          <div style={{ color: "var(--sys-color)" }}>{HERO.ram}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 18 }}>
            {HERO.modules.map(([name, st]) => (
              <div key={name} style={{ color: "var(--fg-dim)", fontFamily: "var(--font-ui)" }}>
                <span style={{ color: "var(--ok-color)" }}>[ {st} ]</span>{" "}{name}
              </div>
            ))}
          </div>
          <div style={{ color: "var(--ok-color)", marginTop: 4, fontWeight: 600 }}>READY.</div>
          <HeroBlock onCommand={onCommand} />
          <div className="view-intro" style={{ marginTop: 10 }}>
            <span className="role">AGENT:</span>
            HOLA. SOY EL AGENTE DEL SISTEMA.
            <br/>PODES ESCRIBIR UN COMANDO O HACER UNA PREGUNTA EN LENGUAJE NATURAL.
            <br/>PROBA CON <span style={{ color: "var(--fg-bright)" }}>&gt; PROYECTOS</span>, <span style={{ color: "var(--fg-bright)" }}>&gt; ABOUT</span> O ESCRIBI UNA PREGUNTA LIBRE.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   GENERIC AGENT-RESPONSE VIEW (for non-module commands)
   ============================================================ */
function ResponseView({ title, body, ctas = [], busy = false, typewriter = false, onCommand, onClose }) {
  const renderedBody = useTyped(body || "", typingSpeedMs(), typewriter && !busy);
  const done = renderedBody.length >= (body || "").length;

  return (
    <ViewShell tag="MSG" title={title} onClose={onClose}>
      <div className="view-intro console-response" aria-busy={busy ? "true" : "false"}>
        <span className="role">AGENT:</span>
        <span className="console-output">{renderedBody}</span>
        {(busy || (typewriter && !done)) && <span className="console-cursor" aria-hidden="true" />}
      </div>
      {ctas.length > 0 && (!typewriter || done) && (
        <div className="hero-ctas">
          {ctas.map((c) => (
            <button key={c.cmd} className={"hero-cta " + (c.primary ? "primary" : "")} onClick={() => onCommand(c.cmd)}>
              &gt; {c.label}
            </button>
          ))}
        </div>
      )}
    </ViewShell>
  );
}

function AnimatedPending({ text }) {
  const base = text.replace(/\.+$/, "").replace(/\s+$/, "");
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 400);
    return () => clearInterval(t);
  }, []);
  return <>{base}{".".repeat(dots)}</>;
}

function AgentMessage({ message, typing, onTypedDone }) {
  const rendered = useTyped(message.text || "", typingSpeedMs(), typing);
  const done = rendered.length >= (message.text || "").length;

  useEffect(() => {
    if (typing && done) onTypedDone?.(message.id);
  }, [typing, done, message.id, onTypedDone]);

  return (
    <div className={"agent-message " + message.role + " " + (message.status || "done")}>
      <div className={"agent-message-role" + (message.status === "pending" ? " pending" : "")}>{message.role === "user" ? "PROMPT" : "AGENT"}</div>
      <div className="agent-message-body">
        <span className="console-output">{message.status === "pending" ? <AnimatedPending text={message.text} /> : rendered}</span>
        {(message.status === "pending" || (typing && !done)) && <span className="console-cursor" aria-hidden="true" />}
      </div>
    </div>
  );
}

function AgentSessionView({ messages, typingMessageId, onTypedDone }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typingMessageId]);

  return (
    <div className="agent-session">
      {messages.length === 0 ? (
        <div className="agent-empty">
          <div className="agent-empty-title">AGENT SESSION READY.</div>
          <div>ESCRIBI TU PROMPT ABAJO. LA CONVERSACION SE CONSERVA EN ESTA SESION DEL NAVEGADOR MIENTRAS NAVEGAS EL SITIO.</div>
        </div>
      ) : (
        messages.map((message) => (
          <AgentMessage
            key={message.id}
            message={message}
            typing={message.id === typingMessageId}
            onTypedDone={onTypedDone}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */

function App() {
  const [theme, setTheme] = useState("c64");
  const [bootDone, setBootDone] = useState(false);
  const [sound, setSound] = useState(false);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const programmatic = (cmd, opts) => {};

  const renderView = () => {
    switch (view.kind) {
      case "home":
        return <HomeView onCommand={programmatic} />;
      case "agent": {
        const usageStr = agentUsage ? ("CTX: " + (agentUsage.total_tokens || "?") + " TOKENS") : "";
        const title = usageStr ? ("AGENT SESSION  |  " + usageStr) : "AGENT SESSION";
        const resetAgent = () => {
          setAgentMessages([]);
          setAgentUsage(null);
        };
        return <ViewShell tag="AGT" title={title} path="/AGT/SESSION" onClose={closeView} onReset={resetAgent} onResetLabel="RESET CTX">
          <AgentSessionView
            messages={agentMessages}
            typingMessageId={typingMessageId}
            onTypedDone={(id) => setTypingMessageId((current) => current === id ? null : current)}
          />
        </ViewShell>;
      }
      case "projects":
        return <ViewShell tag="IDX" title="PROYECTOS" path="/USR/PROYECTOS.MD" onClose={closeView}>
          <div className="view-intro"><span className="role">AGENT:</span>LEYENDO PROYECTOS PERSONALES DESDE MARKDOWN.</div>
          <ProjectsBlock />
        </ViewShell>;
      case "services":
        return <ViewShell tag="LOAD" title="SERVICE MODULES" path="/SYS/SERVICES.SYS" onClose={closeView}>
          <div className="view-intro"><span className="role">AGENT:</span>CARGANDO MODULOS DE SERVICIO... DONE.</div>
          <ServicesBlock onCommand={programmatic} />
        </ViewShell>;
      case "cases":
        return <ViewShell tag="DB" title="USE CASE DATABASE" path="/DB/CASES.IDX" onClose={closeView}>
          <div className="view-intro"><span className="role">AGENT:</span>ABRIENDO BASE DE CASOS. TOCA CADA UNO PARA EXPANDIR.</div>
          <CasesBlock />
        </ViewShell>;
      case "about":
        return <ViewShell tag="FILE" title="ABOUT_OPERATOR.TXT" path="/USR/ABOUT.TXT" onClose={closeView}>
          <AboutBlock />
        </ViewShell>;
      case "diag":
        return <ViewShell tag="DIAG" title="DIAGNOSTICO INTERACTIVO" path="/AGT/DIAGNOSE" onClose={closeView}>
          <div className="view-intro"><span className="role">AGENT:</span>{DIAGNOSTIC.intro.join("\n")}</div>
          <DiagnosticBlock onCommand={programmatic} />
        </ViewShell>;
      case "contact":
        return <ViewShell tag="FORM" title="CONTACT MODULE" path="/IO/CONTACT" onClose={closeView}>
          <div className="view-intro"><span className="role">AGENT:</span>COMPLETA EL FORMULARIO. CAMPOS REQUERIDOS: NOMBRE, EMAIL Y BREVE DESCRIPCION.</div>
          <ContactBlock onCommand={programmatic} prefill={view.prefill} />
        </ViewShell>;
      case "response":
        return <ResponseView
          title={view.title}
          body={view.body}
          ctas={view.ctas}
          busy={view.busy}
          typewriter={view.typewriter}
          onCommand={programmatic}
          onClose={closeView}
        />;
      default:
        return <HomeView onCommand={programmatic} />;
    }
  };

  return (
    <div className="bezel">
      <div className="crt-screen">
        <SysHeader theme={theme} onTheme={setTheme} />
        <BootScreen onDone={() => setBootDone(true)} theme={theme} static={bootDone} />
        <div className="crt-noise" aria-hidden="true" />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
