// ---------- content ----------
const LOGO = String.raw`
 █████  ██████
██   ██ ██   ██
███████ ██████
██   ██ ██   ██
██   ██ ██████`.slice(1);

const SECTIONS = [
  {
    id: "about",
    ask: "who are you?",
    cmd: "fastfetch",
    fetch: [
      ["study", "CS (Honors) @ University of Alberta"],
      ["based", "Toronto, ON"],
      ["focus", "systems · devops · performance"],
      ["langs", "c++ · go · python"],
    ],
    items: [
      { k: "github", title: "artur-bertash", link: "https://github.com/artur-bertash" },
      { k: "linkedin", title: "artur-bertash", link: "https://www.linkedin.com/in/artur-bertash/" },
      { k: "mail", title: "arturbertash88@gmail.com", link: "mailto:arturbertash88@gmail.com" },
    ],
  },
  {
    id: "work",
    ask: "what have you worked on?",
    cmd: "ls ~/work",
    items: [
      { title: "CIBC", role: "SWE Intern (DevOps) · Spark Award nominee", date: "Sep 2026 — now", desc: ["Standardizing shared CI/CD for 9 payment services: 13 reusable actions, ~70% (estimate) less YAML/shell per service.", "Traced CI thrashing to Linux cgroups v2 memory pressure; fixed it with ephemeral OpenShift runners."] },
      { title: "ARVP", role: "Robotics Dev", date: "Sep 2025 — Aug 2026", desc: "Ported a 6-axis underwater robot's PID controller from Python to C++: 213.8 µs → 1.97 µs (~109× speedup).", link: "https://github.com/artur-bertash/pid_progress_repo" },
      { title: "Monke", role: "Software Dev", date: "2024", desc: "Telegram crypto game MVP, 10K+ subscribers (1.6K now); async Python backend (aiogram, FastAPI, MySQL).", link: "https://t.me/monke_ton" },
    ],
  },
  {
    id: "projects",
    ask: "show me your projects",
    cmd: "ls ~/projects",
    items: [
      { title: "reverse_proxy_max", role: "Go · Linux epoll · AWS · Prometheus · Grafana · Ansible · Docker · GitHub Actions", desc: ["Raised a Go reverse proxy on a $12/mo AWS EC2 box (1 vCPU / 2 GB) from 32K to 72.5K concurrent virtual users (~2.3×, 2.5× stock Caddy).", "Custom epoll server cut memory per connection ~33 KB → ~2.8 KB; pooling a hot 32 KB buffer cut GC CPU 15.9% → 3.4%."], links: ["https://github.com/artur-bertash/reverse_proxy_max", { url: "https://web--grafana--8lskh6xd7t2n.code.run/d/proxy-capacity/proxy-capacity?from=2026-11-09T22:13:54.354Z&to=2026-11-09T23:02:48.850Z&timezone=browser", label: "grafana dashboard (load test)" }] },
      { title: "risc-v → wasm", role: "RISC-V assembly · WebAssembly", date: "2025 — 2026", desc: ["RISC-V → WASM translator written entirely in assembly (no C/libc); emits valid .wasm modules.", "Maps unstructured branches onto WASM's structured control flow with a two-pass scan."], links: ["https://github.com/artur-bertash/risc-v_to_wasm", { url: "https://artur-bertash.github.io/risc-v_to_wasm/", label: "live demo (in-browser)" }] },
    ],
  },
  {
    id: "awards",
    ask: "any hackathons/awards?",
    cmd: "ls ~/hackathons ~/awards",
    items: [
      { title: "NatIgnite", role: "2nd place · $3K funding · Parmi (3-person team)", date: "2025", desc: "Most patients quit → Parmi's on-device AI tracks them at home.", links: ["https://parmi-nat.vercel.app/", "https://devpost.com/software/parmi-des27q"] },
      { title: "WhiteBit", role: "video award · $1.5K", date: "2024", desc: "Explained Bitcoin's block-reward halving (6.25 → 3.125 BTC)." },
    ],
  },
];

const THEMES = ["rose-pine", "claude", "ghostty", "tokyo-night", "catppuccin", "gruvbox", "everforest", "nord", "kanagawa",
  "matte-black", "hackerman", "osaka-jade", "ristretto", "catppuccin-latte"];

// ---------- state ----------
const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const input = $("input");

const initSec = Math.max(0, SECTIONS.findIndex((s) => s.id === location.hash.slice(1)));
let sec = 0;
let sel = 0;
let pending = "";              // vim count / g prefix
let vim = store.get("vim") === "1";
let trustLinks = false;        // "Yes, and don't ask again"
let perm = null;               // open permission prompt: { link, choice }
const MODES = [null, "⏵⏵ hire mode on", "⏸ plan mode on"];
let modeIdx = 0;

// ---------- render ----------
const toLink = (l) => (typeof l === "string" ? { url: l, label: null } : l);
const ITEMS = SECTIONS.flatMap((s, si) => s.items.map((it) => {
  const links = (it.links || (it.link ? [it.link] : [])).map(toLink);
  return { ...it, links, link: links[0]?.url, sec: si };
}));
const STARTS = SECTIONS.map((_, si) => ITEMS.findIndex((it) => it.sec === si));
const shortUrl = (link) => link.replace(/^(https?:\/\/(www\.)?|mailto:)/, "").replace(/\/$/, "");

function rowHTML(it, i) {
  if (it.k) {
    return `<div class="row kv contact" data-i="${i}"><span class="marker">❯</span>
      <a class="contact-link" href="${esc(it.link)}" target="_blank" rel="noopener" aria-label="${esc(it.k)}">${esc(shortUrl(it.link))}</a></div>`;
  }
  const link = it.links.length ? `<div>${it.links.map((l) => `<a class="row-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || shortUrl(l.url))}</a>`).join('<span class="row-desc"> · </span>')}</div>` : "";
  return `<div class="row" data-i="${i}"><span class="marker">❯</span><div>
    <div class="row-head"><span class="row-title">${esc(it.title)}</span>
      ${it.role ? `<span class="row-role">${esc(it.role)}</span>` : ""}
      ${it.date ? `<span class="row-date">${esc(it.date)}</span>` : ""}</div>
    ${[].concat(it.desc || []).map((d) => `<div class="row-desc">${esc(d)}</div>`).join("")}
    ${link}</div></div>`;
}

function render() {
  let html = "";
  SECTIONS.forEach((s, si) => {
    const rows = ITEMS.map((it, i) => (it.sec === si ? rowHTML(it, i) : "")).join("");
    html += `<section id="s-${s.id}"><div class="ask">${esc(s.ask)}</div><div class="tool"><b>⏺</b> Bash(<span>${esc(s.cmd)}</span>)</div>`;
    if (s.fetch) {
      // logo | info | links column on the right
      html += `<div class="fetch"><img class="fetch-photo" src="imgs/me.jpg" alt="Artur Bertash" width="190" height="190"><div class="fetch-info">
        <div class="who">artur@bertash</div><div class="rule">─────────────</div>
        ${s.fetch.map(([k, v]) => `<div><span class="k">${k}</span>${esc(v)}</div>`).join("")}
        <div class="swatches">${["--brand", "--text", "--text-2", "--muted", "--line-strong", "--surface"].map((v) => `<span style="background:var(${v})"></span>`).join("")}</div>
      </div><div class="fetch-links"><div class="who">contact</div><div class="rule">───────</div>${rows}</div></div></section>`;
      return;
    }
    html += rows + `</section>`;
  });
  $("buffer").innerHTML = html;
}

function select(i, scrollSection) {
  sel = Math.max(0, Math.min(ITEMS.length - 1, i));
  sec = ITEMS[sel].sec;
  document.querySelectorAll(".row").forEach((r) => r.classList.toggle("sel", +r.dataset.i === sel));
  if (scrollSection) document.getElementById(`s-${SECTIONS[sec].id}`).scrollIntoView({ block: "start" });
  else document.querySelector(".row.sel")?.scrollIntoView({ block: "nearest" });
  $("path").textContent = SECTIONS[sec].id;
  history.replaceState(null, "", sec ? `#${SECTIONS[sec].id}` : location.pathname);
}
function go(i) { select(STARTS[Math.max(0, Math.min(SECTIONS.length - 1, i))], true); }

// ---------- footer / modes ----------
function drawFooter() {
  const insert = document.activeElement === input;
  $("mode").textContent = vim ? (insert ? "-- INSERT --" : "-- NORMAL --") : "";
  $("mode").classList.toggle("cmd", vim && insert);
  $("perm-mode").textContent = MODES[modeIdx] ? `${MODES[modeIdx]} (shift+tab to cycle)` : "";
  $("keys").textContent = vim ? "j/k move · {/} section · i type ·" : "↑/↓ move · ⏎ open ·";
  $("vim-flag").textContent = vim ? "vim: on" : "";
  $("vim-btn").innerHTML = `<span class="vim-dot"></span>vim`;
  $("vim-btn").classList.toggle("on", vim);
  $("vim-btn").setAttribute("aria-pressed", vim);
  input.placeholder = vim && !insert ? "-- NORMAL -- press i to type" : CHAT_API ? 'Ask me anything about Artur, or try "projects", "/cost"' : 'Try "projects", "/cost" or "/vim"';
  $("inputbox").classList.toggle("active", insert);
}
function setVim(on) {
  vim = on;
  store.set("vim", on ? "1" : "0");
  if (vim) input.blur(); else focusInput();
  drawFooter();
}
function focusInput() {
  // don't pop the on-screen keyboard on phones
  if (matchMedia("(pointer: fine)").matches) input.focus();
}

// ---------- theme ----------
function setTheme(name) {
  if (!THEMES.includes(name)) return false;
  document.documentElement.dataset.theme = name;
  $("theme-btn").innerHTML = `◐ <span class="name">${name}</span>`;
  store.set("theme", name);
  return true;
}
function cycleTheme(d) {
  const i = THEMES.indexOf(document.documentElement.dataset.theme);
  setTheme(THEMES[(i + d + THEMES.length) % THEMES.length]);
  msg(`theme: ${document.documentElement.dataset.theme}`);
}

// ---------- output + spinner ----------
const VERBS = ["Clauding", "Thinking", "Ultrathinking", "Hallucinating responsibly", "Reading CLAUDE.md", "Spending tokens",
  "Compacting context", "Asking for permission", "Being absolutely right", "Reticulating splines", "Consulting the weights", "Vibe coding"];
const GLYPHS = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
const RIGHT = [
  "You're absolutely right! I should have shown you that earlier. Try \"work\", \"projects\" or /help.",
  "You're absolutely right! Unfortunately I'm a static site, not Claude. Try /help.",
  "Great question! I've updated 0 files. Try \"projects\".",
  "I apologize for the confusion. I only know about Artur. Try \"awards\".",
  "That's a great idea! Let me… not do that. Try /cost.",
];
let msgTimer, spinTimer, spinDone, tokens = 0;

function msg(text, err) {
  clearTimeout(msgTimer);
  $("msgline").innerHTML = err ? `<span class="err">${esc(text)}</span>` : esc(text);
  msgTimer = setTimeout(() => { $("msgline").textContent = ""; }, 6000 + text.length * 60);
}
function startSpin() {
  stopThinking();
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  const t0 = Date.now();
  let g = 0;
  const el = $("spinner");
  el.hidden = false;
  const draw = () => {
    tokens += Math.floor(Math.random() * 40);
    el.innerHTML = `${GLYPHS[g++ % GLYPHS.length]} ${verb}… <span class="dim">(${((Date.now() - t0) / 1000).toFixed(0)}s · ↓ ${tokens} tokens · esc to interrupt)</span>`;
  };
  draw();
  spinTimer = setInterval(draw, 110);
}
function think(cb) {
  startSpin();
  spinDone = setTimeout(() => { stopThinking(); cb(); }, 700 + Math.random() * 700);
}
function stopThinking() {
  clearInterval(spinTimer);
  clearTimeout(spinDone);
  const was = !$("spinner").hidden;
  $("spinner").hidden = true;
  return was;
}

// ---------- permission prompt ----------
const PERM_OPTS = ["Yes", "Yes, and don't ask again this session", "No, and tell Artur what to do differently (esc)"];
function askOpen(link) {
  if (!link) return msg("Nothing to open here. (no link — Artur is working on it)");
  if (trustLinks) return openLink(link);
  perm = { link, choice: 0 };
  drawPerm();
}
function drawPerm() {
  $("perm").hidden = !perm;
  $("inputbox").hidden = !!perm;
  if (!perm) return;
  $("perm").innerHTML = `<div class="perm-title">Open link</div>
    <div class="perm-target">${esc(shortUrl(perm.link))}</div>
    <div>Do you want to proceed?</div>
    ${PERM_OPTS.map((o, i) => `<div class="perm-opt${i === perm.choice ? " on" : ""}" data-i="${i}">${i === perm.choice ? "❯" : " "} ${i + 1}. ${esc(o)}</div>`).join("")}`;
}
function answerPerm(i) {
  const link = perm.link;
  perm = null;
  drawPerm();
  if (i === 0) openLink(link);
  else if (i === 1) { trustLinks = true; openLink(link); }
  else msg("Interrupted by user · what should Artur do instead? (he's open to job offers)", true);
  if (!vim) focusInput();
}
function openLink(link) {
  if (link.startsWith("mailto:")) location.href = link;
  else window.open(link, "_blank", "noopener");
}

// ---------- commands + chat ----------
// AI chat via the Cloudflare Pages Function in functions/api/chat.js.
// Same address on Cloudflare/local; GitHub Pages calls the Cloudflare deployment.
const CF_CHAT_API = "https://artur-bertash.pages.dev/api/chat";
const SAME_ORIGIN = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.hostname.endsWith(".pages.dev");
const CHAT_API = SAME_ORIGIN ? "/api/chat" : CF_CHAT_API;
const chatHistory = [];
let spent = 0;
let lastModel = "";
let askId = 0;

function submit(raw) {
  const text = raw.trim();
  if (!text) return askOpen(ITEMS[sel].link);
  if (/^[/:]/.test(text)) return think(() => runCmd(text.slice(1), text[0]));
  // short inputs ("projects", "hire") navigate; real questions go to Claude
  const short = text.split(/\s+/).length <= 2;
  if (short || !CHAT_API) return think(() => chat(text) || fallback());
  if (!chat(text, true)) askClaude(text);
}

async function askClaude(text) {
  const id = ++askId;
  chatHistory.push({ role: "user", content: text });
  startSpin();
  try {
    const res = await fetch(CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory.slice(-8) }),
    });
    const data = await res.json().catch(() => ({}));
    if (id !== askId || $("spinner").hidden) return; // interrupted with esc
    stopThinking();
    if (!res.ok) { chatHistory.pop(); return msg(data.error || `Error ${res.status}`, true); }
    chatHistory.push({ role: "assistant", content: data.reply });
    if (data.cost) spent += data.cost;
    if (data.model) lastModel = data.model;
    if (data.tokens) tokens += data.tokens;
    msg(data.reply);
  } catch {
    if (id !== askId) return;
    stopThinking();
    chatHistory.pop();
    msg("API Error: Connection error. (Claude is offline, but Artur isn't — try \"hire\")", true);
  }
}

// keyword navigation; quiet=true only matches obvious nav intents inside longer sentences
function chat(text, quiet) {
  const t = text.toLowerCase();
  const find = (k) => ITEMS.findIndex((it) => it.k === k);
  if (quiet) {
    if (/^(show|open|go to|take me to)\b.*\b(work|projects?|awards?|github|linkedin)\b/.test(t)) return chat(t.split(/\s+/).pop());
    return false;
  }
  if (/hire|job|intern|offer|contact|email|mail/.test(t)) { select(find("mail")); msg("You're absolutely right! Artur is a great hire. Press ⏎ to email him."); return true; }
  if (/github|code|repo/.test(t)) { select(find("github")); msg("Found it. Press ⏎ to open GitHub."); return true; }
  if (/linkedin/.test(t)) { select(find("linkedin")); msg("Press ⏎ to open LinkedIn."); return true; }
  if (/work|experience|cibc|arvp|monke/.test(t)) { go(1); msg("Here's the work history."); return true; }
  if (/project|wasm|risc|proxy|epoll/.test(t)) { go(2); msg("Here are the projects."); return true; }
  if (/award|prize|win|hackathon/.test(t)) { go(3); msg("Here are the awards."); return true; }
  if (/^(who|about|artur|me)\b/.test(t)) { go(0); msg("That's me. Well, him."); return true; }
  if (/^(hi|hey|hello|yo)\b/.test(t)) { msg(`Hi! I'm Artur's portfolio. Try "projects", /help${CHAT_API ? ", or ask me anything" : ""}.`); return true; }
  return false;
}
function fallback() {
  msg(RIGHT[Math.floor(Math.random() * RIGHT.length)]);
}

function runCmd(raw, prefix) {
  const [c, ...args] = raw.trim().split(/\s+/);
  const arg = args.join(" ");
  if (!c) return;
  const idx = SECTIONS.findIndex((s) => s.id === c || s.id.startsWith(c));
  if (/^\d+$/.test(c)) return select(+c - 1);
  if (c === "vim") { setVim(!vim); return msg(vim ? "Vim mode enabled. j/k to move, i to type, esc for NORMAL." : "Vim mode disabled. Welcome back to civilian life."); }
  if (["q", "q!", "wq", "x", "qa"].includes(c)) return msg(vim ? "you can check out any time you like, but you can never leave" : "E37: Not a vim user. Try /vim first.");
  if (c === "exit" || c === "quit") return msg("Goodbye! (you're still here though)");
  if (c === "help") return toggleHelp(true);
  if (c === "themes") return msg(THEMES.join("  "));
  if (c === "theme" || c === "colorscheme" || c === "colo") {
    if (!arg) return msg(document.documentElement.dataset.theme);
    return setTheme(arg) ? msg(`theme: ${arg}`) : msg(`Unknown theme '${arg}'. Try /themes.`, true);
  }
  if (c === "cost") return msg(`Total cost: $${spent.toFixed(5)} · Tokens: ${tokens}\nTotal duration: worth it. To increase spend, hire Artur.`);
  if (c === "model") return msg(CHAT_API ? `artur-opus-1.0 (secretly ${lastModel || "a free OpenRouter model"} in a Claude Code costume) · cost: $0` : "artur-opus-1.0 (the only model) · context window: 1 cup of coffee");
  if (c === "init") return msg("Analyzed codebase. Wrote CLAUDE.md:\n  # Rules\n  - hire artur");
  if (c === "compact") return msg("Compacted conversation. Summary: Artur is cool. 4 sections → 1 sentence.");
  if (c === "clear") { chatHistory.length = 0; select(0); $("buffer").scrollTop = 0; return msg("Context cleared. (you still remember him though)"); }
  if (c === "doctor") return msg("✓ coffee  ✓ c++  ✓ go  ✓ kubernetes  ✗ sleep");
  if (c === "config" || c === "permissions") return msg("Allow: hiring artur · Deny: nothing · Ask: everything else");
  if (c === "bug") return msg("Thanks! Report sent to github.com/artur-bertash (it's a feature)");
  if (c === "login") return msg("Already logged in as recruiter@yourcompany.com (probably)");
  if (c === "review") return msg("LGTM 🚀 (10/10, would merge)");
  if (c === "ultrathink") return think(() => msg("After deep consideration: hire Artur."));
  if (c === "resume") return go(1);
  if (c === "open" || c === "e") {
    const j = SECTIONS.findIndex((s) => s.id.startsWith(arg));
    if (arg && j >= 0) return go(j);
  }
  if (idx >= 0) return go(idx);
  msg(prefix === ":" ? `E492: Not an editor command: ${raw}` : `Unknown slash command: /${raw}. Try /help.`, true);
}

function yank() {
  const link = ITEMS[sel].link;
  if (!link) return msg("Nothing to yank.");
  const text = link.replace(/^mailto:/, "");
  navigator.clipboard?.writeText(text).then(() => msg(`yanked ${text}`), () => msg("clipboard blocked", true));
}
function toggleHelp(force) {
  const h = $("help");
  h.hidden = force === undefined ? !h.hidden : !force;
}

// ---------- keys ----------
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;

  if (perm) {
    e.preventDefault();
    if (k === "ArrowDown" || k === "j" || k === "Tab") { perm.choice = (perm.choice + 1) % 3; drawPerm(); }
    else if (k === "ArrowUp" || k === "k") { perm.choice = (perm.choice + 2) % 3; drawPerm(); }
    else if (k === "Enter") answerPerm(perm.choice);
    else if (/^[123]$/.test(k)) answerPerm(+k - 1);
    else if (k === "Escape") answerPerm(2);
    return;
  }

  if (k === "Tab" && e.shiftKey) {
    e.preventDefault();
    modeIdx = (modeIdx + 1) % MODES.length;
    if (MODES[modeIdx]?.includes("plan")) msg("Plan: 1) read portfolio 2) hire Artur 3) profit");
    return drawFooter();
  }

  if (k === "Escape") {
    if (stopThinking()) msg("Interrupted by user", true);
    toggleHelp(false);
    if (document.activeElement === input) {
      if (input.value) input.value = "";
      else if (vim) input.blur();
    }
    e.preventDefault();
    return drawFooter();
  }

  // typing in the prompt box
  if (document.activeElement === input) {
    if (k === "Enter") { e.preventDefault(); const v = input.value; input.value = ""; submit(v); }
    else if (!input.value && (k === "ArrowDown" || k === "ArrowUp")) { e.preventDefault(); select(sel + (k === "ArrowDown" ? 1 : -1)); }
    else if (!input.value && k === "?") { e.preventDefault(); toggleHelp(); }
    return;
  }

  // nothing focused
  if (k === "ArrowDown") { e.preventDefault(); return select(sel + 1); }
  if (k === "ArrowUp") { e.preventDefault(); return select(sel - 1); }
  if (k === "Enter") { e.preventDefault(); return askOpen(ITEMS[sel].link); }
  if (k === "?") { e.preventDefault(); return toggleHelp(); }

  if (!vim) {
    // any printable key starts typing in the prompt
    if (k.length === 1) input.focus();
    return;
  }

  // ---- vim NORMAL mode ----
  const count = parseInt(pending, 10) || 1;
  const handled = () => { e.preventDefault(); pending = ""; };

  if (/^[0-9]$/.test(k) && (pending || k !== "0")) {
    pending += k;
    e.preventDefault();
    clearTimeout(window._digitTimer);
    window._digitTimer = setTimeout(() => {
      if (/^[1-9]$/.test(pending) && +pending <= SECTIONS.length) go(+pending - 1);
      pending = "";
    }, 350);
    return;
  }
  clearTimeout(window._digitTimer);

  switch (k) {
    case "j": select(sel + count); return handled();
    case "k": select(sel - count); return handled();
    case "}": case "l": go(sec + count); return handled();
    case "{": case "h": go(sec - count); return handled();
    case "G": select(Infinity); $("buffer").scrollTop = 1e9; return handled();
    case "g":
      e.preventDefault();
      if (pending === "g") { select(0); $("buffer").scrollTop = 0; pending = ""; } else pending = "g";
      return;
    case "o": askOpen(ITEMS[sel].link); return handled();
    case "y": yank(); return handled();
    case "t": cycleTheme(1); return handled();
    case "T": cycleTheme(-1); return handled();
    case "i": case "a": handled(); input.focus(); return;
    case ":": case "/": handled(); input.focus(); input.value = k; return;
  }
  pending = "";
});

input.addEventListener("focus", drawFooter);
input.addEventListener("blur", drawFooter);

// ---------- mouse ----------
$("buffer").addEventListener("click", (e) => {
  const r = e.target.closest(".row");
  if (r) select(+r.dataset.i);
});
$("perm").addEventListener("click", (e) => {
  const o = e.target.closest(".perm-opt");
  if (o) answerPerm(+o.dataset.i);
});
$("theme-btn").addEventListener("click", () => cycleTheme(1));
$("vim-btn").addEventListener("click", (e) => {
  setVim(!vim);
  e.currentTarget.blur();
  msg(vim ? "Vim mode enabled. j/k to move, i to type, esc for NORMAL." : "Vim mode disabled. Welcome back to civilian life.");
});

// ---------- clock ----------
function tickClock() {
  $("clock").textContent = new Date().toLocaleString("en-CA", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}
setInterval(tickClock, 10000);
tickClock();

setTheme(store.get("theme") || "rose-pine");
render();
initSec ? go(initSec) : select(0);
if (!vim) focusInput();
drawFooter();
