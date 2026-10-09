import { exerciseData, parseImport, importExample } from "./import.js";
import { ratingValue, ratingSummary, commentText } from "./social.js";
import { blankPerformance, performanceData } from "./performance.js";
import { matchesExercise, filterExercises } from "./catalog.js";
import { exerciseKey, previousResults, repeatProgram, rescheduleSession, monthDays, calendarEvents, progressSeries, exportData, exportCsv } from "./training-data.js";
import { draftKey, saveDraft, loadDraft, removeDraft } from "./drafts.js";
import { undoLastSet, editCompletedSession, filterHistory } from "./history.js";
import { parseBackup, backupEntries } from "./backup.js";
import { expiredTimers, createTimerSound } from "./notifications.js";
import { connect } from "./firebase.js";
import {
  days,
  dayCodes,
  groups,
  types,
  copy,
  localDate,
  weekday,
  remaining,
  clock,
  schedule,
  nextDay,
  newSession,
  validProgram,
  completeSet,
  advance,
  validMetrics,
  setPlan,
  pastSession,
  plannedSession,
  startPlannedSession,
  hasWorkoutContent,
  completeTextSession,
} from "./model.js";
const root = document.querySelector("#app"),
  modal = document.querySelector("#modal");
const S = {
  isOwner: false,
  user: null,
  profile: null,
  programs: [],
  sessions: [],
  exercises: [],
  exercisePreferences: {},
  favoritesOnly: false,
  adminUsers: [],
  templates: [],
  settings: { name: "Nexus GymB", description: "", announcement: "" },
  route: document.body.dataset.page || "home",
  filter: "Усі",
  query: "",
  equipment: "",
  catalogSort: "name",
  withPhoto: false,
  catalogScope: "all",
  adminCatalog: { filter: "Усі", query: "", equipment: "", catalogSort: "name", withPhoto: false, favoritesOnly: false, catalogScope: "shared", archive: "all" },
  loaded: false,
  calendarMonth: localDate().slice(0, 7),
  calendarDate: localDate(),
  progressMetric: "weight",
  progressExercise: "",
  progressPeriod: "90",
  historyFilters: { query: "", from: "", to: "", exercise: "" },
  timerSound: true,
  timerVibration: false,
  syncError: "",
};
let db,
  editor,
  editorTemplate = false,
  editorHistory = false,
  editorPlanned = false,
  plannedDate = localDate(),
  editorOpenDay = null,
  historyDate = localDate(),
  historyMinutes = 0,
  importDraft = null,
  chosenDay = null,
  busy = false,
  bootError = "",
  authMode = "login",
  authDraft = { email: "", name: "" },
  authNotice = "",
  unsubscribeAuth;
let editorDraftKey = "", draftRestored = false, draftStored = false;
let restoreDraft = null;
const timerSound = createTimerSound(), notifiedTimers = new Set();
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const paths = {
  home: `
    <path d="m3 10 9-7 9 7v10H3z" />
    <path d="M9 20v-7h6v7" />
  `,
  program: `
    <rect x="4" y="5" width="16" height="16" rx="3" />
    <path d="M8 3v4m8-4v4M4 11h16m-12 4h2m4 0h2" />
  `,
  exercises: `
    <path d="M7 7v10m10-10v10M4 9v6m16-6v6M7 12h10" />
  `,
  profile: `
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
  `,
  sun: `
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
  `,
  check: `
    <path d="m5 12 4 4L19 6" />
  `,
  admin: `
    <path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z" />
    <path d="m8 12 3 3 5-6" />
  `,
};
const icon = (n) => `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[n] || paths.exercises}</svg>
`;
const btn = (text, action, extra = "", cls = "") => `
  <button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>
`;
const owner = () => S.isOwner;
const active = () => S.programs.find((p) => p.id === S.profile?.activeProgramId) || S.programs[0];
const ongoing = () => S.sessions.find((s) => s.status === "active");
const privatePath = (part) => `users/${S.user.uid}/${part}`;
// IDs from the retired starter catalog; user-created records use generated IDs.
const demoExerciseIds = new Set(["demo-cardio", "demo-warmup", "demo-chest", "demo-row", "demo-leg", "demo-curl", "demo-shoulder", "demo-core"]);
const demoTemplateIds = new Set(["demo-upper-lower", "demo-full", "demo-split"]);
const stripId = (x) => {
  const y = copy(x);
  delete y.id;
  return y;
};
function toast(message) {
  const e = document.querySelector("#toast");
  e.textContent = message;
  e.style.display = "block";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (e.style.display = "none"), 5000);
}
function err(e) {
  const codes = {
    "auth/invalid-email": "Перевір правильність email.",
    "auth/invalid-credential": "Неправильний email або пароль.",
    "auth/wrong-password": "Неправильний email або пароль.",
    "auth/user-not-found": "Неправильний email або пароль.",
    "auth/email-already-in-use": "Ця пошта вже зареєстрована. Увійди або віднови пароль.",
    "auth/weak-password":
      "Пароль не відповідає вимогам Firebase. Використай довший пароль із великими й малими літерами, цифрою та символом.",
    "auth/password-does-not-meet-requirements":
      "Пароль не відповідає вимогам Firebase. Додай великі й малі літери, цифри та символи.",
    "auth/too-many-requests": "Забагато спроб. Зачекай трохи та повтори.",
    "auth/user-disabled": "Цей обліковий запис вимкнений.",
    "auth/unauthorized-continue-uri":
      "Додай домен сайту до Authorized domains у Firebase Authentication.",
    "auth/operation-not-allowed": "У Firebase потрібно увімкнути Email/Password.",
    "permission-denied": "Немає доступу до бази. Підтвердь пошту та перевір правила Firestore.",
    "auth/network-request-failed": "Не вдалося підключитися до Firebase. Перевір мережу.",
  };
  return codes[e.code] || e.message || "Не вдалося виконати дію. Спробуй ще раз.";
}
function authPanel() {
  if (S.user && !S.user.emailVerified)
    return `
      <section class="auth-panel">
        <h1>Підтвердь пошту</h1>
        <p class="muted">
          Відкрий лист на
          <b>${esc(S.user.email || "своїй пошті")}</b>
          та натисни посилання. Потім повернися сюди.
        </p>
        ${
          authNotice
            ? `
              <div class="notice">${esc(authNotice)}</div>
            `
            : ""
        }
        <div class="stack">
          ${btn("Я підтвердив пошту", "check-email")}${btn(
            "Надіслати лист повторно",
            "resend-email",
            "",
            "secondary",
          )}${btn("Вийти", "logout", "", "ghost")}
        </div>
        <p class="small muted">Якщо листа немає, перевір «Спам».</p>
      </section>
    `;
  const register = authMode === "register";
  return `
    <section class="auth-panel">
      <div class="auth-tabs">
        ${btn("Вхід", "auth-mode", `type="button" data-id="login" aria-pressed="${!register}"`, !register ? "" : "ghost")}${btn(
          "Реєстрація",
          "auth-mode",
          `type="button" data-id="register" aria-pressed="${register}"`,
          register ? "" : "ghost",
        )}
      </div>
      <h1 tabindex="-1">${register ? "Створи акаунт" : "Вхід"}</h1>
      ${
        authNotice
          ? `
            <div class="notice">${esc(authNotice)}</div>
          `
          : ""
      }
      <form id="auth-form">
        ${
          register
            ? `
              <label>
                Ім’я
                <input name="name" autocomplete="name" value="${esc(authDraft.name)}" maxlength="100" required />
              </label>
            `
            : ""
        }
        <label>
          Email
          <input type="email" name="email" autocomplete="email" value="${esc(authDraft.email)}" maxlength="320" required />
        </label>
        <label>
          Пароль
          <input
            type="password"
            name="password"
            autocomplete="${register ? "new-password" : "current-password"}"
            ${register ? 'minlength="8"' : ""}
            maxlength="4096"
            required
          />
        </label>
        ${
          register
            ? `
              <label>
                Повтори пароль
                <input
                  type="password"
                  name="confirm"
                  autocomplete="new-password"
                  minlength="8"
                  maxlength="4096"
                  required
                />
              </label>
              <p class="small muted">Щонайменше 8 символів. Після реєстрації підтвердь пошту.</p>
            `
            : ""
        }
        <button type="submit" class="btn wide" ${!db ? "disabled" : ""}>
          ${register ? "Зареєструватися" : "Увійти"}
        </button>
        <div class="form-error" role="alert"></div>
      </form>
      ${
        !register
          ? btn("Забули пароль?", "reset-password", `type="button" ${!db ? "disabled" : ""}`, "auth-link")
          : ""
      }
    </section>
  `;
}

const pageFiles = {
  home: "home.html",
  program: "program.html",
  exercises: "exercises.html",
  profile: "profile.html",
  admin: "admin.html",
  editor: "editor.html",
  session: "workout.html",
  login: "index.html",
};
const currentPage = document.body.dataset.page || "login";
const authPages = ["login"];
async function navigate(page, query = "") {
  const card = document.querySelector(".auth-card");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (card && authPages.includes(page) && !reducedMotion && typeof card.animate === "function") {
    card.getAnimations().forEach((animation) => animation.cancel());
    const animation = card.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-8px)" },
      ],
      { duration: 160, easing: "ease-in", fill: "forwards" },
    );
    await animation.finished.catch(() => {});
  }

  window.location.assign(pageFiles[page] + query);
}
function prepareEditor(restore = true) {
  const q = new URLSearchParams(location.search);
  editorTemplate = q.get("template") === "1";
  editorHistory = !editorTemplate && q.get("history") === "1";
  editorPlanned = !editorTemplate && !editorHistory && q.get("planned") === "1";
  editorOpenDay = editorHistory || editorPlanned ? 0 : null;
  if (editorTemplate && !owner()) {
    S.route = "home";
    return;
  }
  const id = q.get("id");
  editor = id
    ? copy((editorTemplate ? S.templates : S.programs).find((p) => p.id === id) || null)
    : {
        name: "Моя програма",
        type: types[0],
        days: [{ weekday: 0, name: "Верх тіла", groups: "Груди · Спина · Плечі", items: [] }],
        archived: false,
      };
  if (editorHistory) {
    editor = { name: "Минуле тренування", type: "Власна програма", days: [{ weekday: 0, name: "Тренування", groups: "", items: [] }] };
  }
  if (editorPlanned) {
    const session = id ? S.sessions.find((s) => s.id === id && s.status === "planned") : null;
    plannedDate = session?.date || (q.get("date") >= localDate() ? q.get("date") : localDate());
    editor = id && !session ? null : { ...(session ? { id: session.id } : {}),
      name: session?.name || "Окреме тренування", type: "Власна програма",
      days: [{ weekday: 0, name: "Тренування", groups: "", description: session?.description || "", items: copy(session?.items || []) }] };
    if (q.get("repeat")) {
      const source = S.sessions.find((s) => s.id === q.get("repeat"));
      editor = source?.status === "completed" ? repeatProgram(source) : null;
    }
  }
  if (!editor) {
    S.route = editorPlanned ? "home" : editorTemplate ? "admin" : "program";
    toast(editorPlanned ? "Заплановане тренування не знайдено." : "Програму не знайдено.");
  }
  editorDraftKey = draftKey(S.user.uid, editorTemplate ? "template" : editorHistory ? "history" : editorPlanned ? "planned" : "program", id || q.get("repeat") || "new");
  draftRestored = false;
  if (editor && restore) {
    let draft;
    try { draft = loadDraft(localStorage, editorDraftKey); } catch {}
    if (draft && (draft.editor.id || "") === (editor.id || "")) {
      editor = draft.editor;
      plannedDate = draft.plannedDate || plannedDate;
      historyDate = draft.historyDate || historyDate;
      historyMinutes = draft.historyMinutes ?? historyMinutes;
      editorOpenDay = draft.editorOpenDay ?? editorOpenDay;
      draftRestored = true;
    }
  }
  if (editorPlanned && q.get("date") >= localDate()) plannedDate = q.get("date");
}
function persistEditorDraft(collect = false) {
  if (!editor || !editorDraftKey || S.route !== "editor") return;
  if (collect) { collectEditor(); return; }
  try { draftStored = saveDraft(localStorage, editorDraftKey, { editor, plannedDate, historyDate, historyMinutes, editorOpenDay }); }
  catch { draftStored = false; }
  const status = document.querySelector("#draft-status");
  if (status) status.textContent = draftMessage();
}
function draftMessage() {
  return draftStored ? `${draftRestored ? "Чернетку відновлено. " : ""}Чернетка збережена на цьому пристрої.` : "Не вдалося зберегти чернетку на цьому пристрої.";
}
function clearEditorDraft() {
  try { removeDraft(localStorage, editorDraftKey); } catch {}
  editorDraftKey = "";
  draftRestored = false;
}
function safeURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
function avatar() {
  const u = safeURL(S.user?.photoURL);
  return u
    ? `
        <img class="avatar" src="${esc(u)}" alt="" />
      `
    : `
        <span class="avatar">${esc(S.user?.displayName?.[0] || "N")}</span>
      `;
}
function login() {
  const form = document.querySelector("#auth-form");
  if (form) {
    authDraft.email = form.elements.email.value;
    if (form.elements.name) authDraft.name = form.elements.name.value;
  }
  document.title = `${S.user && !S.user.emailVerified ? "Підтвердження пошти" : authMode === "register" ? "Реєстрація" : "Вхід"} — Nexus GymB`;
  const firstRender = !document.querySelector(".auth-card");
  root.innerHTML = `
    <main class="login">
      <section class="auth-card ${firstRender ? "is-entering" : ""}" aria-label="Авторизація">
        <a class="brand" href="index.html">Nexus GymB</a>
        ${authPanel()}
        <div id="login-error">
          ${
            bootError
              ? `
                <div class="error">
                  ${esc(bootError)} ${btn("Спробувати знову", "retry", "", "secondary")}
                </div>
              `
              : ""
          }
        </div>
      </section>
    </main>
  `;
}
function nav() {
  return [
    ["home", "Головна"],
    ["program", "Програма"],
    ["exercises", "Вправи"],
  ]
    .map(
      ([k, t]) => `
        <button
          type="button"
          class="navbtn ${S.route === k ? "active" : ""}"
          data-action="route"
          data-id="${k}"
          ${S.route === k ? 'aria-current="page"' : ""}
        >
          ${icon(k)}
          <span>${t}</span>
        </button>
      `,
    )
    .join("");
}
function shell(content) {
  root.innerHTML = `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <button type="button" class="brand" data-action="route" data-id="home">Nexus GymB</button>
        <nav class="topnav" aria-label="Основна навігація">${nav()}</nav>
        <button
          type="button"
          class="userchip ${S.route === "profile" ? "active" : ""}"
          data-action="route"
          data-id="profile"
          aria-label="Відкрити профіль"
          ${S.route === "profile" ? 'aria-current="page"' : ""}
        >
          ${avatar()}
          <span class="userchip-details">
            <span class="userchip-name">${esc(S.user.displayName || "Спортсмен")}</span>
            <span class="userchip-id">ID ${esc(S.profile?.customId || "…")}</span>
          </span>
        </button>
      </div>
    </header>
    <main class="main">
      <div id="offline">${syncNotice()}</div>
      ${content}
    </main>
  `;
  previousScrollY = Math.max(0, window.scrollY || 0);
}

let previousScrollY = Math.max(0, window.scrollY || 0);
let headerScrollScheduled = false;

function updateHeaderVisibility() {
  headerScrollScheduled = false;
  const header = document.querySelector("#site-header");
  const scrollY = Math.max(0, window.scrollY || 0);

  if (!header) {
    previousScrollY = scrollY;
    return;
  }

  if (scrollY <= 24 || header.matches(":focus-within")) {
    header.classList.remove("is-hidden");
    previousScrollY = scrollY;
    return;
  }

  const distance = scrollY - previousScrollY;
  if (Math.abs(distance) < 12) return;

  header.classList.toggle("is-hidden", distance > 0 && scrollY > header.offsetHeight);
  previousScrollY = scrollY;
}

window.addEventListener(
  "scroll",
  () => {
    if (headerScrollScheduled) return;
    headerScrollScheduled = true;
    window.requestAnimationFrame(updateHeaderVisibility);
  },
  { passive: true },
);

function render() {
  if (!S.user) {
    if (!authPages.includes(currentPage)) {
      navigate("login");
      return;
    }
    login();
    return;
  }
  if (!S.user.emailVerified) {
    if (!authPages.includes(currentPage)) {
      navigate("login");
      return;
    }
    login();
    return;
  }
  if (authPages.includes(currentPage)) {
    navigate("home");
    return;
  }
  if (!S.loaded) {
    shell(`
      <div class="loading">Завантажуємо твої програми…</div>
    `);
    return;
  }
  if (S.route !== currentPage) {
    const query =
      S.route === "editor"
        ? `?${new URLSearchParams({ ...(editor?.id ? { id: editor.id } : {}), ...(editorTemplate ? { template: "1" } : {}), ...(editorHistory ? { history: "1" } : {}), ...(editorPlanned ? { planned: "1" } : {}) })}`
        : "";
    navigate(S.route, query);
    return;
  }
  const screens = {
    home,
    program: programs,
    exercises: catalog,
    profile,
    admin,
    editor: programEditor,
    session: sessionView,
  };
  shell((screens[S.route] || home)());
}

function heading(title, desc = "", actions = "") {
  return `
    <div class="pagehead">
      <div class="row">
        <div>
          <h1>${title}</h1>
          ${
            desc
              ? `
                <p class="muted">${desc}</p>
              `
              : ""
          }
        </div>
        ${actions}
      </div>
    </div>
  `;
}
function empty(title, desc, button = "") {
  return `
    <div class="empty">
      <h3>${title}</h3>
      <p>${desc}</p>
      ${button}
    </div>
  `;
}
function exercisePhoto(item, size = "thumb") {
  const current = S.exercises.find((e) => e.id === item.exerciseId);
  const url = safeURL(item.image) || safeURL(item.snapshot?.image) || safeURL(current?.image);
  return `<span class="exercise-photo photo-${size}">
    <span class="photo-placeholder" aria-hidden="true">${icon("exercises")}<span>Фото відсутнє</span></span>
    ${url ? `<img data-exercise-photo src="${esc(url)}" alt="${esc(item.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ""}
  </span>`;
}
function exerciseRows(items) {
  return items
    .map(
      (i, n) => `
        <div class="exercise-row">
          <span class="number">${String(n + 1).padStart(2, "0")}</span>
          ${i.custom ? "" : exercisePhoto(i)}
          <div class="grow">
            <h3>${esc(i.name)}</h3>
            <p>
              ${
                i.seconds
                  ? `${Math.round((i.seconds / 60) * 10) / 10} хв`
                  : `${i.sets} підходи · ${esc(i.reps)} повторень`
              }${i.weight ? ` · ${i.weight} кг` : ""}
            </p>
            ${metricSummary(i.metrics)}
            ${i.setPlans ? `<details><summary class="small">Параметри підходів</summary>${i.setPlans.map((p, k) => `<p class="small">${k + 1}: ${esc(p.reps)} повторень · ${p.weight} кг${p.seconds ? ` · ${p.seconds} сек` : ""} · відпочинок ${p.rest} сек</p>`).join("")}</details>` : ""}
          </div>
          ${i.exerciseId ? `<button
            class="info"
            data-action="detail"
            data-id="${esc(i.exerciseId)}"
            aria-label="Як виконувати ${esc(i.name)}"
          >
            i
          </button>` : ""}
        </div>
      `,
    )
    .join("");
}
function workoutDescription(day) {
  return day?.description ? `<div class="notice workout-description">${esc(day.description)}</div>` : "";
}
function home() {
  const p = active(),
    today = schedule(p),
    d = chosenDay !== null ? schedule(p, chosenDay) : today || nextDay(p),
    session = ongoing(),
    completed = S.sessions.filter((s) => s.status === "completed");
  return (
    heading(`Привіт, ${esc(S.user.displayName?.split(" ")[0] || "спортсмене")} 👋`, "", owner() ? btn("Перейти до адмінки", "route", 'data-id="admin"', "ghost") : "") +
    (S.settings.announcement
      ? `
          <div class="notice">${esc(S.settings.announcement)}</div>
        `
      : "") +
    `
      <div class="grid">
        <div class="stack">
          <section class="card hero">
            <span class="eyebrow">
              ${session ? "Тренування триває" : today ? "Сьогодні за планом" : "Сьогодні"}
            </span>
            <h2>${session ? esc(session.name) : today ? esc(today.name) : "День відпочинку"}</h2>
            <p>
              ${
                session
                  ? "Повернися до підходу, на якому зупинився."
                  : today
                    ? esc(today.groups)
                    : "Віднови сили. Наступне тренування вже у твоєму розкладі."
              }
            </p>
            ${
              session
                ? btn("Продовжити тренування", "resume")
                : p && d
                  ? btn(
                      today ? "Почати тренування" : "Відкрити наступне тренування",
                      "start",
                      `data-day="${d.weekday}"`,
                    )
                  : btn("Створити програму", "new-program")
            }
            <span class="badge">${esc(p?.name || "Твій новий початок")}</span>
          </section>
          <section class="card">
            <div class="sectionhead">
              <h2>Твій тиждень</h2>
              <span class="muted small">${p?.days.length || 0} тренувальні дні</span>
            </div>
            <div class="week">
              ${days
                .map((name, n) => {
                  const date = new Date();
                  date.setDate(date.getDate() - weekday() + n);
                  return `
                    <button
                      class="day ${n === weekday() ? "today" : ""} ${
                        completed.some((s) => s.date === localDate(date)) ? "done" : ""
                      }"
                      data-action="day"
                      data-day="${n}"
                      aria-label="${name}"
                    >
                      <span>${dayCodes[n]}</span>
                      <b>${date.getDate()}</b>
                      ${schedule(p, n) || S.sessions.some((s) => s.status === "planned" && s.date === localDate(date)) ? "<i></i>" : ""}
                    </button>
                  `;
                })
                .join("")}
            </div>
          </section>
          ${monthCalendar()}
          <section class="card">
            <div class="sectionhead">
              <h2>${d ? esc(d.name) : "Вправи за планом"}</h2>
              <span class="small muted">${d ? days[d.weekday] : ""}</span>
            </div>
            ${
              d
                ? workoutDescription(d) + exerciseRows(d.items) +
                  (hasWorkoutContent(d) && chosenDay !== null
                    ? btn("Почати цей день", "start", `data-day="${d.weekday}"`, "secondary")
                    : hasWorkoutContent(d)
                      ? ""
                      : empty("Додай план", "Опиши тренування своїми словами або додай вправи в редакторі."))
                : `
                  <p class="muted small">Додай програму, щоб побачити свій план.</p>
                `
            }
          </section>
        </div>
        <div class="stack" style="align-content:start">
          <section class="card">
            <div class="sectionhead"><h2>Окремі тренування</h2>${btn("＋ Запланувати", "new-planned", "", "secondary")}</div>
            <p class="muted small">Обери дату, опиши тренування своїми словами або додай вправи.</p>
            ${plannedWorkouts()}
          </section>
          <section class="card">
            <span class="eyebrow">Твоя послідовність</span>
            <div class="stat" style="margin:20px 0 5px">
              ${completed.length}
              <span style="font-size:17px;color:var(--muted);font-weight:400;letter-spacing:0">
                тренувань
              </span>
            </div>
            <p class="muted small">завершено та збережено</p>
            <div class="row" style="border-top:1px solid var(--line);padding-top:18px">
              <span class="small muted">Виконані підходи</span>
              <b>${completed.reduce((a, s) => a + s.logs.length, 0)}</b>
            </div>
          </section>
          <section class="card">
            <div class="sectionhead"><h2>Останні тренування</h2>${btn("＋ Записати минуле", "new-history", "", "secondary")}</div>
            ${history(
              completed
                .slice()
                .sort((a, b) => b.startedAt - a.startedAt)
                .slice(0, 3),
            )}
          </section>
        </div>
      </div>
    `
  );
}
function plannedWorkouts() {
  const list = S.sessions.filter((s) => s.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
  return list.length ? list.map((s) => `<div class="history-row">
    <h3>${esc(s.name)}</h3><p class="small muted">${esc(s.date)} · ${s.items.length ? `${s.items.length} вправ` : "Тренування словами"}${s.date < localDate() ? " · Дата минула" : ""}</p>
    ${workoutDescription(s)}
    <div class="actions">${btn("Почати", "start-planned", `data-id="${esc(s.id)}"`)}${btn("Редагувати", "edit-planned", `data-id="${esc(s.id)}"`, "secondary")}${btn("Перенести", "reschedule", `data-id="${esc(s.id)}"`, "secondary")}${btn("Скасувати", "delete-planned", `data-id="${esc(s.id)}"`, "ghost")}</div>
    </div>`).join("") : '<p class="muted small">Окремих тренувань ще не заплановано.</p>';
}
function monthCalendar() {
  const { offset, dates } = monthDays(S.calendarMonth);
  const title = new Date(`${S.calendarMonth}-01T12:00:00`).toLocaleDateString("uk", { month: "long", year: "numeric" });
  const selected = calendarEvents(active(), S.sessions, S.calendarDate);
  const labels = { program: "Програма", planned: "Заплановано", active: "Триває", completed: "Завершено" };
  return `<section class="card month-calendar">
    <div class="sectionhead"><h2>Календар</h2><div class="actions">${btn("‹", "calendar-month", 'data-step="-1" aria-label="Попередній місяць"', "ghost")}${btn("Сьогодні", "calendar-today", "", "ghost")}${btn("›", "calendar-month", 'data-step="1" aria-label="Наступний місяць"', "ghost")}</div></div>
    <p class="calendar-title">${esc(title)}</p>
    <div class="month-grid">${dayCodes.map((d) => `<span class="small muted">${d}</span>`).join("")}${Array.from({ length: offset }, () => '<span></span>').join("")}${dates.map((date) => {
      const events = calendarEvents(active(), S.sessions, date);
      return `<button class="month-day ${date === localDate() ? "today" : ""} ${date === S.calendarDate ? "selected" : ""}" data-action="calendar-date" data-id="${date}" aria-pressed="${date === S.calendarDate}" aria-label="${date}${events.length ? `, ${events.map((e) => labels[e.kind]).join(", ")}` : ", немає тренувань"}"><b>${+date.slice(-2)}</b><span class="calendar-dots">${[...new Set(events.map((e) => e.kind))].map((kind) => `<i class="event-${kind}"></i>`).join("")}</span></button>`;
    }).join("")}</div>
    <p class="small muted">● Програма · <span class="calendar-planned">● Заплановано</span> · <span class="calendar-completed">● Завершено</span></p>
    <h3>${esc(S.calendarDate)}</h3>
    ${selected.length ? selected.map((e) => `<div class="calendar-entry"><b>${esc(e.name)}</b><span class="small muted">${labels[e.kind]}</span><div class="actions">${e.kind === "planned" ? btn("Редагувати", "edit-planned", `data-id="${esc(e.id)}"`, "secondary") + btn("Перенести", "reschedule", `data-id="${esc(e.id)}"`, "ghost") : e.kind === "completed" ? btn("Деталі", "history", `data-id="${esc(e.id)}"`, "ghost") : e.kind === "active" ? btn("Продовжити", "resume", "", "secondary") : btn("Почати день програми", "start", `data-program="${esc(e.programId)}" data-day="${e.weekday}"`, "ghost")}</div></div>`).join("") : '<p class="muted small">На цю дату тренувань немає.</p>'}
    ${S.calendarDate >= localDate() ? btn("＋ Запланувати на цю дату", "new-planned", `data-date="${S.calendarDate}"`, "secondary") : ""}
    <p class="small muted">Календар показує тижневий розклад активної програми. Початок тренування записує сьогоднішню дату.</p>
  </section>`;
}
function history(list) {
  return list.length
    ? list
        .map(
          (s) => `
            <div class="history-row">
              <div class="row">
                <div>
                  <h3>${esc(s.name)}</h3>
                  <p class="small muted">
                    ${esc(s.date)} · ${Math.round((s.endedAt - s.startedAt) / 60000)} хв ·
                    ${s.logs.length} підходів
                  </p>
                </div>
                <button class="mini-btn" data-action="history" data-id="${s.id}">Деталі</button>
              </div>
              ${btn("Повторити тренування", "repeat-history", `data-id="${esc(s.id)}"`, "ghost")}
              ${btn("Виправити", "edit-history", `data-id="${esc(s.id)}"`, "ghost")}
            </div>
          `,
        )
        .join("")
    : `
        <p class="small muted">Завершені тренування з’являться тут.</p>
      `;
}
function programs() {
  return (
    heading("Твоя програма", "Дні тренувань та вправи.", btn("＋ Нова програма", "new-program") + btn("Записати минуле тренування", "new-history", "", "secondary")) +
    `
      <div class="stack">
        ${
          S.programs.length
            ? S.programs
                .map(
                  (p) => `
                  <section class="card">
                    <div class="sectionhead">
                      <div>
                        <span class="badge">
                          ${esc(p.type)}${p.id === active()?.id ? " · Активна" : ""}
                        </span>
                        <h2 style="margin:15px 0 8px">${esc(p.name)}</h2>
                        <p class="small muted">
                          ${p.days.map((d) => dayCodes[d.weekday]).join(" · ")}
                        </p>
                      </div>
                      <div class="actions">
                        ${btn("Редагувати", "edit-program", `data-id="${p.id}"`, "secondary")}${btn(
                          "Копіювати",
                          "copy-program",
                          `data-id="${p.id}"`,
                          "ghost",
                        )}${
                          p.id !== active()?.id
                            ? btn("Зробити активною", "activate", `data-id="${p.id}"`, "ghost")
                            : ""
                        }${btn("Видалити", "delete-program", `data-id="${p.id}"`, "ghost")}
                      </div>
                    </div>
                    ${p.days
                      .map(
                        (d) => `
                          <details class="program-day" name="program-days">
                            <summary><span class="number">${dayCodes[d.weekday]}</span><span class="grow"><strong>${esc(d.name)}</strong><span class="small muted">${esc(d.groups)} · ${d.items.length} вправ</span></span><span class="day-chevron" aria-hidden="true">⌄</span></summary>
                            <div class="program-day-content">${workoutDescription(d)}${exerciseRows(d.items) || (d.description ? "" : '<p class="muted">Плану ще немає.</p>')}
                            ${btn(
                              "Почати",
                              "start",
                              `data-program="${p.id}" data-day="${d.weekday}"`,
                              "secondary",
                            )}
                            </div>
                          </details>
                        `,
                      )
                      .join("")}
                  </section>
                `,
                )
                .join("")
            : `
              <section class="card">
                ${empty(
                  "Створи свій перший план",
                  "Верх / Низ, Спліт, Все тіло або повністю власна програма.",
                  btn("Обрати дні та вправи", "new-program"),
                )}
              </section>
            `
        }
        <section class="card">
          <h2>Готові шаблони</h2>
          <p class="muted small">
            Скопіюй шаблон та адаптуй його під себе. Приклади не є індивідуальною рекомендацією.
          </p>
          ${
            S.templates.length
              ? S.templates
                  .filter((t) => !t.archived)
                  .map(
                    (t) => `
                    <div class="exercise-row">
                      <div class="grow">
                        <h3>${esc(t.name)}</h3>
                        <p>${esc(t.type)} · ${t.days.length} дні</p>
                      </div>
                      ${btn("Використати", "use-template", `data-id="${t.id}"`, "secondary")}
                    </div>
                  `,
                  )
                  .join("")
              : `
                <p class="muted">Власник ще не додав шаблони. Можна створити власну програму.</p>
              `
          }
        </section>
      </div>
    `
  );
}
function catalog() {
  const equipment = [...new Set(S.exercises.filter((e) => !e.archived).map((e) => e.equipment).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "uk"));
  return (
    heading("Бібліотека руху", "Global та особисті вправи за категоріями.", btn("＋ Моя вправа", "new-personal-exercise")) +
    `
      <input
        id="search"
        type="search"
        aria-label="Пошук вправ"
        placeholder="Пошук вправи або тренажера…"
        value="${esc(S.query)}"
      />
      <div class="filters" role="group" aria-label="М’язові групи">
        ${["Усі", ...groups]
          .map(
            (g) => `
              <button
                class="chip ${S.filter === g ? "active" : ""}"
                data-action="filter"
                data-id="${g}"
                aria-pressed="${S.filter === g}"
              >
                ${g}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="catalog-tools">
        <label>Бібліотека<select id="catalog-scope">
          <option value="all" ${S.catalogScope === "all" ? "selected" : ""}>Усі вправи</option>
          <option value="personal" ${S.catalogScope === "personal" ? "selected" : ""}>Мої особисті</option>
          <option value="shared" ${S.catalogScope === "shared" ? "selected" : ""}>Global</option>
        </select></label>
        <label>Обладнання
          <select id="catalog-equipment">
            <option value="">Усе обладнання</option>
            ${equipment.map((name) => `<option value="${esc(name)}" ${S.equipment === name ? "selected" : ""}>${esc(name)}</option>`).join("")}
          </select>
        </label>
        <label>Сортування
          <select id="catalog-sort">
            <option value="name" ${S.catalogSort === "name" ? "selected" : ""}>За назвою · А–Я</option>
            <option value="group" ${S.catalogSort === "group" ? "selected" : ""}>За м’язовою групою</option>
          </select>
        </label>
        <label class="photo-toggle"><input id="catalog-photo" type="checkbox" ${S.withPhoto ? "checked" : ""} /> Лише з фото</label>
        <label class="photo-toggle"><input id="catalog-favorites" type="checkbox" ${S.favoritesOnly ? "checked" : ""} /> ♥ Улюблені</label>
        ${btn("Скинути фільтри", "reset-catalog", "", "ghost")}
      </div>
      <div id="catalog-results">${catalogResults()}</div>
    `
  );
}
function catalogResults() {
  const list = filterExercises(S.exercises, S, S.exercisePreferences, (e) => !!safeURL(e.image));
  return `<p class="small muted" role="status" aria-live="polite" aria-atomic="true">Знайдено вправ: ${list.length}</p>` + (list.length
    ? `
        <div class="catalog">
          ${list
            .map(
              (e) => `
                <button class="card exercise-card" data-action="detail" data-id="${esc(e.id)}">
                  ${exercisePhoto(e, "card")}
                  <h3>${esc(e.name)}</h3>
                  ${S.exercisePreferences[e.id]?.favorite ? '<span class="badge">♥ Улюблена</span>' : ""}
                  ${S.exercisePreferences[e.id]?.rating != null ? `<p>Моя оцінка: ${S.exercisePreferences[e.id].rating}/5</p>` : ""}
                  <p>${esc(e.primary)} · ${esc(e.equipment)}${e.personal ? " · Особиста" : ""}</p>
                </button>
              `,
            )
            .join("")}
        </div>
      `
    : `
        <section class="card">
          ${empty(
            "Вправ поки не знайдено",
            S.exercises.length
              ? "Спробуй іншу назву, обладнання або м’язову групу."
              : "Власник має додати вправи до каталогу Global.",
            S.exercises.some((e) => !e.archived) ? btn("Показати всі вправи", "reset-catalog", "", "secondary") : "",
          )}
        </section>
      `);
}
function field(label, name, value = "", type = "text", extra = "") {
  return `
    <label>
      ${label}
      <input name="${name}" type="${type}" value="${esc(value)}" ${extra} />
    </label>
  `;
}
function metricSummary(metrics) {
  return metrics?.length
    ? `
        <p class="metric-summary">
          ${metrics
            .map((m) => `${esc(m.name)}: ${esc(m.value)}${m.unit ? " " + esc(m.unit) : ""}`)
            .join(" · ")}
        </p>
      `
    : "";
}
function metricEditor(item, n, j) {
  return `
    <div class="custom-metrics">
      <div class="sectionhead">
        <h3>Власні параметри</h3>
        <button
          type="button"
          class="mini-btn"
          data-action="add-metric"
          data-n="${n}"
          data-j="${j}"
          ${(item.metrics?.length || 0) >= 8 ? "disabled" : ""}
        >
          ＋ Параметр
        </button>
      </div>
      ${(item.metrics || [])
        .map(
          (m, k) => `
            <div class="metric-fields">
              ${field(
                "Назва",
                `metric-name-${n}-${j}-${k}`,
                m.name,
                "text",
                'required maxlength="40" placeholder="Швидкість"',
              )}${field(
                "Значення",
                `metric-value-${n}-${j}-${k}`,
                m.value,
                "text",
                'required maxlength="80" placeholder="6"',
              )}${field(
                "Одиниця",
                `metric-unit-${n}-${j}-${k}`,
                m.unit,
                "text",
                'maxlength="20" placeholder="км/год"',
              )}
              <button
                type="button"
                class="mini-btn"
                data-action="remove-metric"
                data-n="${n}"
                data-j="${j}"
                data-k="${k}"
                aria-label="Прибрати параметр ${esc(m.name)}"
              >
                ×
              </button>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}
function actualMetrics(item, session) {
  const last = session.logs.filter((l) => l.index === session.index).at(-1);
  return item.metrics?.length
    ? `
        <div class="formgrid">
          ${item.metrics
            .map((m, k) =>
              field(
                `${esc(m.name)}${m.unit ? " (" + esc(m.unit) + ")" : ""}`,
                `actual-metric-${k}`,
                last?.metrics?.[k]?.value ?? m.value,
                "text",
                'required maxlength="80"',
              ),
            )
            .join("")}
        </div>
      `
    : "";
}
function options(list, value) {
  return list
    .map(
      (x, i) => `
        <option value="${esc(x)}" ${x === value ? "selected" : ""}>${esc(x)}</option>
      `,
    )
    .join("");
}

function setPlanEditor(item, n, j) {
  return `<div class="set-plan-editor"><div class="actions">${btn(item.setPlans ? "Оновити кількість підходів" : "Налаштувати кожен підхід", "configure-sets", `type="button" data-n="${n}" data-j="${j}"`, "secondary")}${item.setPlans ? btn("Однакові підходи", "uniform-sets", `type="button" data-n="${n}" data-j="${j}"`, "ghost") : ""}</div>
    ${item.setPlans ? `<p class="small muted">Ці значення застосовуються замість спільних параметрів вправи. Після зміни кількості підходів натисни «Оновити кількість підходів».</p>` + item.setPlans.map((p, k) => `<fieldset><legend>Підхід ${k + 1}</legend><div class="formgrid four">
      ${field("Повторення", `plan-reps-${n}-${j}-${k}`, p.reps, editorHistory ? "number" : "text", editorHistory ? 'required min="0" max="1000"' : 'maxlength="20"')}
      ${field("Вага, кг", `plan-weight-${n}-${j}-${k}`, p.weight, "number", 'required min="0" max="1000" step="0.5"')}
      ${field("Час, сек", `plan-seconds-${n}-${j}-${k}`, p.seconds, "number", 'required min="0" max="7200"')}
      ${field("Відпочинок, сек", `plan-rest-${n}-${j}-${k}`, p.rest, "number", 'required min="0" max="600"')}
    </div></fieldset>`).join("") : ""}</div>`;
}
function openImport() {
  openModal(`<div class="sectionhead"><h2>Імпорт JSON</h2>${btn("Закрити", "close", "", "ghost")}</div>
    <p class="muted">Встав JSON за наведеним прикладом. Можна імпортувати вправи, шаблони програм або обидва типи записів. Імпорт створює нові записи.</p>
    <details><summary>Приклад формату JSON</summary><pre class="json-preview">${esc(JSON.stringify(importExample, null, 2))}</pre></details>
    <form id="import-form"><label>JSON<textarea name="json" rows="16" required maxlength="700000" spellcheck="false">${esc(importDraft ? JSON.stringify(importDraft, null, 2) : "")}</textarea></label>
    <button class="btn" type="submit">Перевірити та переглянути</button><div class="form-error" role="alert"></div></form>`);
}

function programEditor() {
  persistEditorDraft();
  return (
    heading(
      editorPlanned ? "Планування окремого тренування" : editorHistory ? "Запис минулого тренування" : editorTemplate ? "Шаблон програми" : "Редактор програми",
      "Дні, вправи та навантаження — під твої цілі.",
    ) +
    `
      <form id="program-form" class="card program-builder">
        <div class="row wrap"><p id="draft-status" class="small muted" role="status">${draftMessage()}</p>${btn("Скинути чернетку", "reset-draft", 'type="button"', "ghost")}</div>
        <div class="builder-intro"><span class="eyebrow">Твій план</span><h2>${editorPlanned ? "Заплануй тренування" : editorHistory ? "Запиши результат" : "Побудуй свій тиждень"}</h2><p class="muted">${editorPlanned ? "Обери дату й назву. Опиши тренування своїми словами або додай вправи з потрібним навантаженням." : "Назви програму, обери дні та опиши тренування або додай вправи з потрібним навантаженням."}</p></div>
        <div class="editor-overview"><span><b>${editor.days.length}</b> днів</span><span><b>${editor.days.reduce((sum, d) => sum + d.items.length, 0)}</b> вправ</span></div>
        ${editorHistory ? `<p class="muted">Обери дату, додай вправи та вкажи фактичні повторення й вагу. Для різних підходів натисни «Налаштувати кожен підхід».</p><div class="formgrid">${field("Дата тренування", "history-date", historyDate, "date", 'required max="' + localDate() + '"')}${field("Тривалість, хв", "history-minutes", historyMinutes, "number", 'required min="0" max="1440"')}</div>` : ""}
        ${editorPlanned ? field("Дата тренування", "planned-date", plannedDate, "date", 'required min="' + localDate() + '"') : ""}
        <div class="formgrid">
          ${field("Назва", "name", editor.name, "text", 'required maxlength="100"')}
          <label ${editorPlanned ? "hidden" : ""}>
            Тип програми
            <select name="type">
              ${options(types, editor.type)}
            </select>
          </label>
        </div>
        <nav class="builder-days" aria-label="Дні програми" ${editorPlanned ? "hidden" : ""}>${editor.days.map((d, n) => `<button type="button" data-action="open-editor-day" data-n="${n}">${esc(dayCodes[d.weekday] || "День")} · ${esc(d.name || `День ${n + 1}`)}</button>`).join("")}</nav>
        <div id="days-editor">
          ${editor.days
            .map(
              (d, n) => `
                <details class="day-editor" name="editor-days" id="builder-day-${n}" data-editor-day="${n}" ${editorOpenDay === n ? "open" : ""}>
                  <summary><span class="number">${editorPlanned ? "1" : esc(dayCodes[d.weekday] || "День")}</span><span class="grow"><strong>${esc(editorPlanned ? editor.name : d.name || `День ${n + 1}`)}</strong><span class="small muted">${editorPlanned ? "Тренування" : `День ${n + 1}`} · ${d.items.length} вправ</span></span><span class="day-chevron" aria-hidden="true">⌄</span></summary>
                  <div class="editor-day-content">
                  <div class="sectionhead">
                    <div><span class="eyebrow">${d.items.length} вправ</span><h2>${editorPlanned ? "Вправи тренування" : `День ${n + 1}`}</h2></div>
                    <button type="button" class="mini-btn" data-action="remove-day" data-n="${n}" ${editorPlanned ? "hidden" : ""} ${editorHistory || editorPlanned ? "disabled" : ""}>
                      Прибрати день
                    </button>
                  </div>
                  <div class="formgrid" ${editorPlanned ? "hidden" : ""}>
                    <label ${editorPlanned ? "hidden" : ""}>
                      День тижня
                      <select name="day-${n}">
                        ${days
                          .map(
                            (x, i) => `
                              <option value="${i}" ${d.weekday === i ? "selected" : ""}>
                                ${x}
                              </option>
                            `,
                          )
                          .join("")}
                      </select>
                    </label>
                    ${field(
                      "Назва тренування",
                      `dayname-${n}`,
                      d.name,
                      "text",
                      'required maxlength="100"',
                    )}
                  </div>
                  <label>Тренування своїми словами <span class="small muted">Необов’язково вибирати вправи з каталогу. Можна залишити лише опис.</span>
                    <textarea name="description-${n}" rows="4" maxlength="4000" placeholder="Наприклад: 30 хв прогулянки, розтяжка та легка розминка">${esc(d.description || "")}</textarea>
                  </label>
                  ${field(
                    "М’язові групи",
                    `groups-${n}`,
                    d.groups,
                    "text",
                    'maxlength="200"',
                  )}${d.items
                    .map(
                      (i, j) => `
                        <div class="item-editor">
                          <div class="row wrap">
                            <div class="exercise-heading">${i.custom ? "" : exercisePhoto(i)}<b>${j + 1}. ${esc(i.name)}</b>${i.custom ? '<span class="badge">Своїми словами</span>' : ""}</div>
                            <div class="actions">
                              <button
                                type="button"
                                class="mini-btn"
                                data-action="move"
                                data-n="${n}"
                                data-j="${j}"
                                data-dir="-1"
                                aria-label="Перемістити вище"
                                ${j === 0 ? "disabled" : ""}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                class="mini-btn"
                                data-action="move"
                                data-n="${n}"
                                data-j="${j}"
                                data-dir="1"
                                aria-label="Перемістити нижче"
                                ${j === d.items.length - 1 ? "disabled" : ""}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                class="mini-btn"
                                data-action="remove-item"
                                data-n="${n}"
                                data-j="${j}"
                              >
                                Прибрати
                              </button>
                            </div>
                          </div>
                          ${i.custom ? field("Назва вправи своїми словами", `customname-${n}-${j}`, i.name, "text", 'required maxlength="100"') : ""}
                          <div class="formgrid four">
                            ${field(
                              "Підходи",
                              `sets-${n}-${j}`,
                              i.sets,
                              "number",
                              'min="1" max="20" required',
                            )}${field(
                              "Повторення",
                              `reps-${n}-${j}`,
                              i.reps,
                              "text",
                              'maxlength="20"',
                            )}${field(
                              "Час, сек",
                              `seconds-${n}-${j}`,
                              i.seconds,
                              "number",
                              'min="0" max="7200" required',
                            )}${field(
                              "Вага, кг",
                              `weight-${n}-${j}`,
                              i.weight,
                              "number",
                              'min="0" max="1000" step="0.5" required',
                            )}
                          </div>
                          <div class="formgrid">
                            ${field(
                              "Відпочинок, сек",
                              `rest-${n}-${j}`,
                              i.rest,
                              "number",
                              'min="0" max="600" required',
                            )}${field(
                              "Примітка",
                              `note-${n}-${j}`,
                              i.note,
                              "text",
                              'maxlength="500"',
                            )}
                          </div>
                          ${setPlanEditor(i, n, j)}
                          <details class="builder-extra" ${i.metrics?.length ? "open" : ""}><summary>Додаткові параметри вправи</summary>${metricEditor(i, n, j)}</details>
                        </div>
                      `,
                    )
                    .join("")}
                  <div class="builder-picker"><h3>＋ Додати вправу</h3>
                  <label>Вправа своїми словами
                    <input type="text" id="custom-exercise-${n}" maxlength="100" data-custom-exercise="${n}" placeholder="Наприклад: присідання з рюкзаком" />
                  </label>
                  ${btn("＋ Додати свою вправу", "add-custom-item", `type="button" data-n="${n}"`, "secondary")}
                  <p class="small muted">Впиши назву, потім налаштуй підходи та навантаження. Або обери вправу з каталогу нижче.</p>
                  <div class="formgrid picker-tools">
                    <label>Знайти вправу
                      <input type="search" id="picker-search-${n}" data-picker-search="${n}" placeholder="Назва, тренажер або м’язи…" />
                    </label>
                    <label>М’язова група
                      <select id="picker-group-${n}" data-picker-group="${n}">
                        <option value="">Усі групи</option>
                        ${groups.map((group) => `<option value="${esc(group)}">${esc(group)}</option>`).join("")}
                      </select>
                    </label>
                  </div>
                  <div class="row wrap">
                    <label style="flex:1;margin:10px 0">
                      Додати з каталогу
                      <select id="add-${n}">
                        <option value="">Оберіть вправу</option>
                        ${S.exercises
                          .filter((e) => !e.archived && (!editorTemplate || !e.personal))
                          .map(
                            (e) => `
                              <option value="${esc(e.id)}">${esc(e.name)} · ${esc(e.equipment)}</option>
                            `,
                          )
                          .join("")}
                      </select>
                    </label>
                    <button
                      type="button"
                      class="btn secondary"
                      data-action="add-item"
                      data-n="${n}"
                    >
                      Додати
                    </button>
                  </div>
                  </div>
                  </div>
                </details>
              `,
            )
            .join("")}
        </div>
        <div class="actions builder-footer">
          <button
            type="button"
            class="btn ghost"
            data-action="add-day"
            ${editorPlanned ? "hidden" : ""}
            ${editorHistory || editorPlanned || editor.days.length >= 7 ? "disabled" : ""}
          >
            ＋ Додати день
          </button>
          <button class="btn" type="submit">${editorPlanned ? "Зберегти тренування" : editorHistory ? "Зберегти в історію" : "Зберегти програму"}</button>
          <button type="button" class="btn ghost" data-action="cancel-editor">Скасувати</button>
        </div>
        <div class="form-error" role="alert"></div>
      </form>
    `
  );
}
function collectEditor() {
  const f = document.querySelector("#program-form");
  if (!f) return;
  const v = new FormData(f);
  if (editorHistory) { historyDate = v.get("history-date"); historyMinutes = +v.get("history-minutes"); }
  if (editorPlanned) plannedDate = v.get("planned-date");
  editor.name = v.get("name");
  editor.type = v.get("type");
  editor.days.forEach((d, n) => {
    d.weekday = +v.get(`day-${n}`);
    d.name = v.get(`dayname-${n}`);
    d.groups = v.get(`groups-${n}`);
    d.description = String(v.get(`description-${n}`) || "");
    d.items.forEach((i, j) => {
      if (i.custom) i.name = String(v.get(`customname-${n}-${j}`) || "").trim();
      for (const k of ["sets", "reps", "seconds", "weight", "rest", "note"])
        i[k] = ["reps", "note"].includes(k) ? v.get(`${k}-${n}-${j}`) : +v.get(`${k}-${n}-${j}`);
      if (i.setPlans) {
        const count = Number.isInteger(i.sets) && i.sets >= 1 && i.sets <= 20 ? i.sets : i.setPlans.length;
        i.setPlans = Array.from({ length: count }, (_, k) => {
          const plan = { ...setPlan(i, k) };
          for (const key of ["reps", "weight", "seconds", "rest"]) {
            const value = v.get(`plan-${key}-${n}-${j}-${k}`);
            if (value !== null) plan[key] = key === "reps" ? value : +value;
          }
          return plan;
        });
      }
      i.metrics = (i.metrics || []).map((m, k) => ({
        name: String(v.get(`metric-name-${n}-${j}-${k}`) || "").trim(),
        value: String(v.get(`metric-value-${n}-${j}-${k}`) || "").trim(),
        unit: String(v.get(`metric-unit-${n}-${j}-${k}`) || "").trim(),
      }));
    });
  });
  persistEditorDraft();
}
function previousWorkout(item, session) {
  const previous = previousResults(S.sessions, item, session.id);
  return `<details class="previous-workout" ${previous ? "open" : ""}><summary>Попередні результати${previous ? ` · ${esc(previous.session.date)}` : ""}</summary>${previous ? `<p class="small muted">${esc(previous.session.name)}</p>${previous.logs.map((l, k) => `<p class="small">Підхід ${k + 1}: ${l.reps} повторень · ${l.weight} кг${l.seconds ? ` · ${l.seconds} сек` : ""}</p>${metricSummary(l.metrics)}`).join("")}` : '<p class="small muted">Для цієї вправи ще немає виконаних підходів у завершених тренуваннях.</p>'}</details>`;
}
function progressView() {
  const items = new Map();
  S.sessions.filter((s) => s.status === "completed").forEach((s) => s.items.forEach((i, index) => {
    if (s.logs.some((l) => l.index === index)) items.set(exerciseKey(i), i.name);
  }));
  if (!items.has(S.progressExercise)) S.progressExercise = items.keys().next().value || "";
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - +S.progressPeriod);
  const points = progressSeries(S.sessions, { metric: S.progressMetric, key: S.progressExercise,
    since: S.progressPeriod === "all" ? "" : localDate(sinceDate) });
  const units = { weight: "кг", volume: "кг × повторення", frequency: "тренувань" };
  return `<section class="card progress-section"><h2>Прогрес</h2>
    <div class="formgrid"><label>Показник<select id="progress-metric">${[["weight", "Найбільша виконана вага"], ["volume", "Обсяг вправи"], ["frequency", "Тренування за місяць"]].map(([v, label]) => `<option value="${v}" ${S.progressMetric === v ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <label>Період<select id="progress-period">${[["30", "30 днів"], ["90", "90 днів"], ["365", "Рік"], ["all", "Увесь час"]].map(([v, label]) => `<option value="${v}" ${S.progressPeriod === v ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    ${S.progressMetric !== "frequency" ? `<label>Вправа<select id="progress-exercise">${items.size ? [...items].sort((a, b) => a[1].localeCompare(b[1], "uk")).map(([key, name]) => `<option value="${esc(key)}" ${S.progressExercise === key ? "selected" : ""}>${esc(name)}</option>`).join("") : '<option value="">Ще немає результатів</option>'}</select></label>` : ""}</div>
    <p class="small muted">${S.progressMetric === "volume" ? "Сума ваги × повторень у виконаних підходах за день." : S.progressMetric === "frequency" ? "Кількість завершених тренувань за місяць у вибраному періоді." : "Найбільша вага у виконаному підході за день."}</p>
    ${points.length ? progressChart(points, units[S.progressMetric]) : '<p class="muted">Немає результатів за вибраний період.</p>'}
  </section>`;
}
function progressChart(points, unit) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const x = (k) => points.length === 1 ? 330 : 60 + k * 540 / (points.length - 1);
  const y = (value) => 190 - value / max * 150;
  return `<svg class="progress-chart" viewBox="0 0 660 240" role="img" aria-label="Графік прогресу, ${esc(unit)}">
    ${[0, 0.5, 1].map((fraction) => `<line x1="60" x2="600" y1="${y(max * fraction)}" y2="${y(max * fraction)}" class="chart-grid"/><text x="52" y="${y(max * fraction) + 4}" text-anchor="end">${Math.round(max * fraction * 10) / 10}</text>`).join("")}
    <polyline class="chart-line" points="${points.map((p, k) => `${x(k)},${y(p.value)}`).join(" ")}"/>
    ${points.map((p, k) => `<circle cx="${x(k)}" cy="${y(p.value)}" r="4" class="chart-point"><title>${esc(p.date)}: ${p.value} ${esc(unit)}</title></circle>`).join("")}
    <text x="60" y="220">${esc(points[0].date)}</text>${points.length > 1 ? `<text x="600" y="220" text-anchor="end">${esc(points.at(-1).date)}</text>` : ""}
    </svg><details><summary>Дані графіка · ${esc(unit)}</summary><div class="chart-data"><table><thead><tr><th>Дата</th><th>Значення</th></tr></thead><tbody>${points.map((p) => `<tr><td>${esc(p.date)}</td><td>${Math.round(p.value * 100) / 100}</td></tr>`).join("")}</tbody></table></div></details>`;
}
function downloadExport(format) {
  const blob = new Blob([format === "csv" ? exportCsv(S) : JSON.stringify(exportData(S), null, 2)],
    { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url;
  link.download = `nexus-gymb-${localDate()}.${format}`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function syncNotice() {
  const pending = db?.pending?.() || 0;
  return (!navigator.onLine || pending || S.syncError) ? `<div class="notice" role="status">${S.syncError ? esc(S.syncError) : !navigator.onLine ? "Немає мережі. Особисті зміни зберігаються на пристрої." : "Синхронізація…"}${pending ? ` Очікують відправлення: ${pending}.` : ""}${navigator.onLine && pending ? btn("Синхронізувати", "sync-now", "", "ghost") : ""}</div>` : "";
}
function updateSyncNotice() { const box = document.querySelector("#offline"); if (box) box.innerHTML = syncNotice(); }
function soundControls() {
  return `<div class="timer-settings"><label class="photo-toggle"><input type="checkbox" id="timer-sound" ${S.timerSound ? "checked" : ""} /> Звук завершення таймера</label><label class="photo-toggle"><input type="checkbox" id="timer-vibration" ${S.timerVibration ? "checked" : ""} /> Вібрація</label></div>`;
}
function checkTimerNotifications() {
  const ended = expiredTimers(ongoing(), notifiedTimers);
  if (!ended.length) return;
  toast(ended.includes("restEnd") ? "Відпочинок завершено" : "Час вправи завершено");
  if (S.timerSound) timerSound.play();
  if (S.timerVibration) navigator.vibrate?.([150, 80, 150]);
}
function historyTools() {
  const f = S.historyFilters, items = new Map();
  S.sessions.filter((s) => s.status === "completed").forEach((s) => s.items.forEach((i) => items.set(i.exerciseId || `name:${i.name.toLocaleLowerCase("uk").replace(/[’'ʼ]/g, '').trim()}`, i.name)));
  return `<div class="formgrid history-tools"><label>Пошук<input id="history-search" type="search" value="${esc(f.query)}" placeholder="Назва тренування або вправи" /></label><label>Вправа<select data-history-filter="exercise"><option value="">Усі вправи</option>${[...items].map(([id, name]) => `<option value="${esc(id)}" ${id === f.exercise ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label><label>Від<input type="date" data-history-filter="from" value="${esc(f.from)}" /></label><label>До<input type="date" data-history-filter="to" value="${esc(f.to)}" /></label></div>${btn("Скинути фільтри", "reset-history-filters", "", "ghost")}`;
}
function filteredHistory() {
  const list = filterHistory(S.sessions, S.historyFilters);
  return `<p class="small muted" role="status">Знайдено тренувань: ${list.length}</p>${list.length ? history(list) : '<p class="muted">Немає тренувань за вибраними умовами.</p>'}`;
}
function historyEditForm(s) {
  if (s?.status !== "completed") throw Error("Завершене тренування не знайдено.");
  openModal(`<h2>Виправити тренування</h2><form id="history-edit-form" data-id="${esc(s.id)}">
    ${field("Назва", "name", s.name, "text", 'required maxlength="100"')}
    <div class="formgrid">${field("Дата", "date", s.date, "date", `required max="${localDate()}"`)}${field("Тривалість, хв", "minutes", Math.round((s.endedAt - s.startedAt) / 60000), "number", 'required min="0" max="1440"')}</div>
    <label>Опис<textarea name="description" rows="3" maxlength="4000">${esc(s.description || "")}</textarea></label>
    ${s.logs.map((l, k) => `<fieldset class="performance-entry"><legend>${esc(s.items[l.index].name)} · підхід ${s.logs.slice(0, k + 1).filter((v) => v.index === l.index).length}</legend><div class="formgrid">${field("Повторення", `log-reps-${k}`, l.reps, "number", 'required min="0" max="1000"')}${field("Вага, кг", `log-weight-${k}`, l.weight, "number", 'required min="0" max="1000" step="0.5"')}${field("Час, сек", `log-seconds-${k}`, l.seconds || 0, "number", 'required min="0" max="7200"')}${(l.metrics || []).map((m, j) => field(`${m.name} ${m.unit}`, `log-metric-${k}-${j}`, m.value, "text", 'required maxlength="80"')).join("")}</div></fieldset>`).join("")}
    <div class="actions"><button type="submit" class="btn">Зберегти виправлення</button>${btn("Скасувати", "close", 'type="button"', "ghost")}</div><div class="form-error" role="alert"></div></form>`);
}
function restorePreview() {
  const { entries, skipped } = backupEntries(restoreDraft, S, S.user.uid);
  openModal(`<h2>Відновити резервну копію</h2><p>Програм: ${restoreDraft.programs.length}, тренувань: ${restoreDraft.sessions.length}, особистих вправ: ${restoreDraft.exercises.length}.</p><p>Буде додано записів: ${entries.length}. Пропущено наявних записів або активних тренувань: ${skipped.length}.</p><p class="muted">Поточні дані залишаються. Записи з однаковими ID пропускаються.</p><div class="actions">${btn("Відновити", "confirm-restore", entries.length ? "" : "disabled")}${btn("Скасувати", "close", "", "ghost")}</div>`);
}
function profile() {
  return (
    heading("Твій профіль", "Особистий простір і збережений прогрес.") +
    `
      <div class="profile">
        <section class="card">
          <div class="row wrap">
            <div class="row">
              ${avatar()}
              <div>
                <h2 style="margin:0 0 7px">${esc(S.user.displayName)}</h2>
                <span class="muted">${esc(S.user.email || "")}</span>
              </div>
            </div>
            ${btn("Вийти", "logout", "", "ghost")}
          </div>
          <div class="member-id">
            <span>Твій ID</span>
            <strong>#${esc(S.profile?.customId || "…")}</strong>
          </div>
        </section>
        <div id="progress-view">${progressView()}</div>
        <section class="card"><h2>Сповіщення таймера</h2>${soundControls()}<p class="small muted">Налаштування зберігаються на цьому пристрої. Сповіщення працюють, поки сайт відкритий; вібрація залежить від браузера.</p></section>
        <section class="card"><h2>Експорт даних</h2><p class="muted small">JSON містить програми, всі тренування, особисті вправи та їхні налаштування. CSV містить плани програм, заплановані тренування й виконані підходи.</p><div class="actions">${btn("Завантажити JSON", "export-json", "", "secondary")}${btn("Завантажити CSV", "export-csv", "", "secondary")}</div></section>
        <section class="card"><h2>Відновлення з JSON</h2><p class="muted small">Обери резервну копію, яку завантажив із профілю. Перед збереженням буде показано кількість записів.</p><form id="restore-form"><label>Резервна копія JSON<input type="file" id="restore-file" accept=".json,application/json" required /></label><button class="btn secondary" type="submit">Перевірити копію</button><div class="form-error" role="alert"></div></form></section>
        <section class="card">
          <h2>Історія тренувань</h2>
          ${historyTools()}<div id="history-results">${filteredHistory()}</div>
        </section>
      </div>
    `
  );
}
function sessionView() {
  const s = ongoing();
  if (!s)
    return heading(
      "Тренування завершено",
      "Результат уже в історії.",
      btn("На головну", "route", 'data-id="home"'),
    );
  if (!s.items.length) return `<div class="session">${heading(s.name, "Тренування словами", btn("Згорнути", "route", 'data-id="home"', "ghost"))}<section class="card">${workoutDescription(s)}<p class="small muted">Після виконання збережи тренування в історію.</p>${btn("✓ Завершити тренування", "finish-text", "", "wide")}</section></div>`;
  const i = s.items[s.index],
    count = s.logs.filter((l) => l.index === s.index).length,
    plan = setPlan(i, Math.min(count, i.sets - 1));
  return `
    <div class="session">
      ${heading(
        s.name,
        `Вправа ${s.index + 1} із ${s.items.length}`,
        btn("Згорнути", "route", 'data-id="home"', "ghost"),
      )}
      <div class="progress"><div style="width:${(s.index / s.items.length) * 100}%"></div></div>
      ${soundControls()}
      ${workoutDescription(s)}
      <section class="card">
        <span class="badge">${esc(i.primary || "Тренування")}</span>
        <h2 class="workout-title" style="margin-top:20px">${esc(i.name)}</h2>
        ${i.custom ? '<span class="badge">Вправа своїми словами</span>' : exercisePhoto(i, "large")}
        <p class="muted">
          ${i.sets} підходи ·
          ${plan.seconds ? `${plan.seconds} сек` : esc(plan.reps) + " повторень"}${
            plan.weight ? ` · ${plan.weight} кг` : ""
          }
        </p>
        ${
          i.note
            ? `
              <div class="notice">${esc(i.note)}</div>
            `
            : ""
        }${i.exerciseId ? btn(
          "Як виконувати",
          "detail",
          `data-id="${esc(i.exerciseId)}" data-session="1"`,
          "secondary",
        ) : ""}
        <div class="setdots">
          ${Array.from(
            { length: i.sets },
            (_, n) => `
              <span class="setdot ${n < count ? "done" : ""}">${n < count ? "✓" : n + 1}</span>
            `,
          ).join("")}
        </div>
        ${previousWorkout(i, s)}
        ${
          plan.seconds
            ? `
              <div class="timer" data-end="${s.timerEnd}" data-default="${plan.seconds}">
                ${clock(s.timerEnd ? remaining(s.timerEnd) : plan.seconds)}
              </div>
              ${btn(
                s.timerEnd ? "Перезапустити таймер" : "Почати таймер",
                "timer",
                "",
                "secondary",
              )}
            `
            : ""
        }
        <p class="small muted">Підхід ${Math.min(count + 1, i.sets)} · відпочинок ${plan.rest} сек</p>
        <form id="set-form" style="margin-top:22px">
          ${actualMetrics(i, s)}
          <div class="formgrid">
            ${field(
              "Фактичні повторення",
              "reps",
              plan.seconds ? 0 : parseInt(plan.reps) || 0,
              "number",
              'min="0" max="1000" required',
            )}${field(
              "Вага, кг",
              "weight",
              plan.weight,
              "number",
              'min="0" max="1000" step="0.5" required',
            )}
          </div>
          <button class="btn wide" type="submit" ${count >= i.sets ? "disabled" : ""}>
            ${count >= i.sets ? "Усі підходи виконано" : "✓ Завершити підхід"}
          </button>
          <div class="form-error" role="alert"></div>
        </form>
      </section>
      ${
        s.restEnd
          ? `
            <section class="card">
              <div class="row wrap">
                <div>
                  <span class="eyebrow">Відпочинок</span>
                  <div class="timer" data-end="${s.restEnd}">${clock(remaining(s.restEnd))}</div>
                </div>
                <div class="actions">
                  ${btn("＋ 30 сек", "rest-add", "", "secondary")}${btn(
                    "Пропустити",
                    "rest-skip",
                    "",
                    "ghost",
                  )}
                </div>
              </div>
            </section>
          `
          : ""
      }
      <div class="actions">
        ${btn(
          s.index === s.items.length - 1 ? "Завершити тренування" : "Наступна вправа",
          "next",
          count < i.sets ? "disabled" : "",
        )}${btn("Пропустити вправу", "skip", "", "ghost")}
        ${s.logs.length ? btn("Скасувати останній підхід", "undo-set", "", "secondary") : ""}
      </div>
    </div>
  `;
}
function adminRecordActions(record, kind) {
  const buttons = btn("Змінити", `edit-${kind}`, `data-id="${esc(record.id)}"`, "ghost") +
    btn(record.archived ? "Відновити" : "Архівувати", `archive-${kind}`, `data-id="${esc(record.id)}"`, "ghost") +
    btn("Видалити", `delete-${kind}`, `data-id="${esc(record.id)}"`, "ghost danger");
  return `<div class="actions admin-desktop-actions">${buttons}</div>
    <details class="admin-row-menu">
      <summary aria-label="Дії для ${esc(record.name)}">⋯</summary>
      <div class="admin-action-popover">${buttons}</div>
    </details>`;
}
function displayDate(value) {
  if (!value) return "Немає даних";
  const date = new Date(value?.toMillis?.() ?? value);
  return Number.isNaN(date.getTime()) ? "Немає даних" : date.toLocaleString("uk-UA");
}
function adminUsersList(query = "") {
  const search = query.trim().toLocaleLowerCase("uk");
  const list = S.adminUsers.filter((u) => `${u.name || ""} ${u.email || ""} ${u.customId || ""} ${u.id}`.toLocaleLowerCase("uk").includes(search));
  return `<p class="small muted">Знайдено: ${list.length}</p>` + list.map((u) => `<article class="admin-user-row">
    <div><h3>${esc(u.name || "Без імені")} <span class="badge">ID ${esc(u.customId || "—")}</span></h3>
    <p>${esc(u.email || "Email не вказано")}</p><p class="small muted">Реєстрація: ${displayDate(u.registeredAt || u.createdAt)}<br>Останній вхід: ${displayDate(u.lastLoginTime || u.lastLogin)}</p></div>
    ${btn("Програми й тренування", "admin-user", `data-id="${esc(u.id)}"`, "secondary")}</article>`).join("");
}
function adminItemDetails(item) {
  return `<div class="admin-plan-item"><h4>${esc(item.name)}</h4>
    <p>${item.sets} підходів · ${esc(item.reps)} повторень · ${item.weight || 0} кг${item.seconds ? ` · ${item.seconds} сек` : ""} · відпочинок ${item.rest || 0} сек</p>
    ${item.setPlans ? item.setPlans.map((s, k) => `<p class="small">Підхід ${k + 1}: ${esc(s.reps)} повторень · ${s.weight} кг · ${s.seconds} сек · відпочинок ${s.rest} сек</p>`).join("") : ""}
    ${item.note ? `<p class="small">${esc(item.note)}</p>` : ""}${metricSummary(item.metrics)}</div>`;
}
async function adminUser(id) {
  if (!owner()) throw Error("Немає доступу");
  const user = S.adminUsers.find((u) => u.id === id);
  if (!user) throw Error("Користувача не знайдено.");
  const [programs, sessions] = await Promise.all([db.list(`users/${id}/programs`), db.list(`users/${id}/sessions`)]);
  const completed = sessions.filter((s) => s.status === "completed");
  const latest = sessions.filter((s) => s.status !== "planned").sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  openModal(`<div class="sectionhead"><div><span class="eyebrow">Користувач · ID ${esc(user.customId || "—")}</span><h2>${esc(user.name || "Без імені")}</h2></div>${btn("Закрити", "close", "", "ghost")}</div>
    <dl class="user-facts"><div><dt>Email</dt><dd>${esc(user.email || "—")}</dd></div><div><dt>Реєстрація</dt><dd>${displayDate(user.registeredAt || user.createdAt)}</dd></div>
    <div><dt>Останній вхід</dt><dd>${displayDate(user.lastLoginTime || user.lastLogin)}</dd></div><div><dt>Останнє тренування</dt><dd>${esc(latest?.date || "Ще немає")}</dd></div></dl>
    <div class="editor-overview"><span><b>${programs.length}</b> програм</span><span><b>${completed.length}</b> завершених тренувань</span><span><b>${sessions.filter((s) => s.status === "active").length}</b> активних</span></div>
    <h3>Програми користувача</h3>
    ${programs.length ? programs.map((p) => `<details class="user-program" open><summary>${esc(p.name)} ${p.id === user.activeProgramId ? '· Активна' : ''}</summary>
      <p class="small muted">${esc(p.type)}</p>${(p.days || []).map((d) => `<section class="admin-plan-day"><h3>${esc(days[d.weekday])} · ${esc(d.name)}</h3><p>${esc(d.groups)}</p>${workoutDescription(d)}${d.items.map(adminItemDetails).join("") || (d.description ? "" : '<p class="muted">Плану ще немає.</p>')}</section>`).join("")}</details>`).join("") : '<p class="muted">Програм ще немає.</p>'}
    <h3>Заплановані, поточні та завершені тренування</h3>
    ${sessions.length ? [...sessions].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((s) => `<details class="user-program"><summary>${esc(s.date)} · ${esc(s.name)} · ${s.status === "planned" ? "Заплановано" : s.status === "completed" ? "Завершено" : "Триває"}</summary>
      <p class="small muted">${s.logs?.length || 0} підходів${s.endedAt ? ` · ${Math.max(0, Math.round((s.endedAt - s.startedAt) / 60000))} хв` : ""}</p>
      ${workoutDescription(s)}
      ${(s.items || []).map((item, index) => `${adminItemDetails(item)}<div class="admin-set-logs">${s.skipped?.includes(index) ? '<p>Вправу пропущено</p>' : ''}${(s.logs || []).filter((l) => l.index === index).map((l, k) => `<p>Виконано ${k + 1}: ${l.reps} повторень · ${l.weight} кг${l.seconds ? ` · ${l.seconds} сек` : ""}</p>${metricSummary(l.metrics)}`).join("")}</div>`).join("")}</details>`).join("") : '<p class="muted">Тренувань ще немає.</p>'}`, "", "admin-user-dialog");
}
function adminCatalogControls() {
  const f = S.adminCatalog;
  const equipment = [...new Set(S.exercises.filter((e) => !e.personal).map((e) => e.equipment).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uk"));
  return `<input id="admin-catalog-search" type="search" aria-label="Пошук у наповненні каталогу" placeholder="Пошук вправи або тренажера…" value="${esc(f.query)}" />
    <div class="filters" role="group" aria-label="М’язові групи">${["Усі", ...groups].map((g) => `<button type="button" class="chip ${f.filter === g ? "active" : ""}" data-action="admin-catalog-filter" data-id="${esc(g)}" aria-pressed="${f.filter === g}">${esc(g)}</button>`).join("")}</div>
    <div class="catalog-tools">
      <label>Обладнання<select data-admin-catalog="equipment"><option value="">Усе обладнання</option>${equipment.map((e) => `<option value="${esc(e)}" ${f.equipment === e ? "selected" : ""}>${esc(e)}</option>`).join("")}</select></label>
      <label>Сортування<select data-admin-catalog="catalogSort"><option value="name" ${f.catalogSort === "name" ? "selected" : ""}>За назвою · А–Я</option><option value="group" ${f.catalogSort === "group" ? "selected" : ""}>За м’язовою групою</option></select></label>
      <label>Статус<select data-admin-catalog="archive"><option value="all" ${f.archive === "all" ? "selected" : ""}>Усі записи</option><option value="active" ${f.archive === "active" ? "selected" : ""}>Активні</option><option value="archived" ${f.archive === "archived" ? "selected" : ""}>В архіві</option></select></label>
      <label class="photo-toggle"><input type="checkbox" data-admin-catalog="withPhoto" ${f.withPhoto ? "checked" : ""} /> Лише з фото</label>
      <label class="photo-toggle"><input type="checkbox" data-admin-catalog="favoritesOnly" ${f.favoritesOnly ? "checked" : ""} /> ♥ Улюблені</label>
      ${btn("Скинути фільтри", "reset-admin-catalog", "", "ghost")}
    </div>`;
}
function adminCatalogResults() {
  const list = filterExercises(S.exercises, S.adminCatalog, S.exercisePreferences, (e) => !!safeURL(e.image));
  return `<p class="small muted" role="status" aria-live="polite" aria-atomic="true">Знайдено вправ: ${list.length}</p>` +
    (list.length ? list.map((e) => `<div class="exercise-row admin-record-row">
      ${exercisePhoto(e)}<div class="grow"><h3>${esc(e.name)}</h3><p>${esc(e.primary)} · ${esc(e.equipment)}${e.archived ? " · В архіві" : ""}</p></div>
      ${adminRecordActions(e, "exercise")}</div>`).join("") : '<p class="muted">Вправ не знайдено. Спробуй змінити або скинути фільтри.</p>');
}
function admin() {
  if (!owner()) return empty("Немає доступу", "Цей розділ доступний лише власнику.");
  return (
    heading("Керування", "Каталог, шаблони та налаштування сайту.") +
    `
      <div class="stack">
        <section class="card" id="admin-users">
          <div class="sectionhead"><div><span class="eyebrow">Учасники</span><h2>Користувачі</h2></div>${btn("Завантажити / оновити", "load-users", "", "secondary")}</div>
          <p class="muted">Профілі, програми за днями та результати тренувань.</p>
          <label>Пошук користувача<input id="admin-user-search" type="search" placeholder="Ім’я, email або ID" /></label>
          <div id="admin-users-list">${S.adminUsers.length ? adminUsersList() : '<p class="muted">Завантаж список, щоб переглянути користувачів.</p>'}</div>
        </section>
        <section class="card">
          <h2>Наповнення каталогу</h2>${btn("Імпорт JSON", "open-import", "", "secondary")}
          <p class="muted">Додавай власні вправи вручну або імпортуй їх у форматі JSON.</p>
          <div class="actions">
            ${btn("＋ Додати вправу", "new-exercise")}
          </div>
          ${adminCatalogControls()}
          <div id="admin-catalog-results">${adminCatalogResults()}</div>
        </section>
        <section class="card">
          <div class="sectionhead">
            <h2>Шаблони</h2>
            ${btn("＋ Новий шаблон", "new-template")}
          </div>
          ${S.templates
            .map(
              (t) => `
                <div class="exercise-row admin-record-row">
                  <div class="grow">
                    <h3>${esc(t.name)}</h3>
                    <span class="muted small">${t.archived ? "В архіві" : t.type}</span>
                  </div>
                  ${adminRecordActions(t, "template")}
                </div>
              `,
            )
            .join("")}
        </section>
        <form id="settings-form" class="card">
          <h2>Налаштування сайту</h2>
          <input type="hidden" name="name" value="Nexus GymB" />
          ${field("Опис", "description", S.settings.description, "text", 'maxlength="300"')}
          <label>
            Оголошення
            <textarea name="announcement" maxlength="1000">
${esc(S.settings.announcement)}</textarea
            >
          </label>
          <button class="btn" type="submit">Зберегти</button>
          <div class="form-error" role="alert"></div>
        </form>
      </div>
    `
  );
}
function openModal(html, labelledBy = "", className = "") {
  modal.className = className;
  modal.innerHTML = html;
  if (labelledBy) modal.setAttribute("aria-labelledby", labelledBy);
  else modal.removeAttribute("aria-labelledby");
  if (!modal.open) modal.showModal();
}
function ratingOptions(score) {
  return `<option value="" ${score == null ? "selected" : ""}>Без оцінки</option>` +
    [0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${score === n ? "selected" : ""}>${n} / 5</option>`).join("");
}
function privateExerciseControls(id) {
  const preference = S.exercisePreferences[id] || {};
  return `<section class="exercise-social">
    ${btn(preference.favorite ? "♥ В улюблених" : "♡ Додати до улюблених", "favorite-exercise", `data-id="${esc(id)}" aria-pressed="${!!preference.favorite}"`, "secondary")}
    <form id="private-rating-form" data-id="${esc(id)}">
      <label>Особиста оцінка — бачиш лише ти<select name="score">${ratingOptions(preference.rating)}</select></label>
      <button type="submit" class="btn secondary">Зберегти особисту оцінку</button>
      <div class="form-error" role="alert"></div>
    </form>
    <div id="exercise-records-editor">${performanceForm(id, preference.performance || blankPerformance())}</div>
  </section>`;
}
function performanceForm(id, data) {
  return `<form id="exercise-records-form" data-id="${esc(id)}">
    <h3>Мої показники</h3><p class="muted">Робоче навантаження, рекорди й будь-які інші результати. Наприклад: 30 кг робоча вага, 40 кг × 5, 50 кг × 1. Ці записи бачиш лише ти.</p>
    <div class="performance-entries">${data.entries.map((entry, k) => `<fieldset class="performance-entry" data-record="${k}">
      <legend>Показник ${k + 1}</legend><div class="formgrid">
      ${field("Назва показника", `record-label-${k}`, entry.label, "text", 'maxlength="80" placeholder="Робоча вага, рекорд, кардіо…"')}
      ${field("Значення", `record-value-${k}`, entry.value, "text", 'maxlength="80" placeholder="30"')}
      ${field("Одиниця", `record-unit-${k}`, entry.unit, "text", 'maxlength="20" placeholder="кг, км, хв…"')}
      ${field("Повторення / діапазон", `record-reps-${k}`, entry.reps, "text", 'maxlength="30" placeholder="5 або 8–12"')}
      ${field("Дата результату (необов’язково)", `record-date-${k}`, entry.date, "date")}
      ${field("Примітка", `record-note-${k}`, entry.note, "text", 'maxlength="500" placeholder="Техніка, самопочуття, налаштування…"')}
      </div>${btn("Прибрати показник", "remove-performance", `type="button" data-k="${k}"`, "ghost danger")}</fieldset>`).join("")}</div>
    ${btn("＋ Додати показник", "add-performance", `type="button" ${data.entries.length >= 30 ? "disabled" : ""}`, "secondary")}
    <label class="performance-notes">Розширений запис<textarea name="performance-notes" rows="5" maxlength="4000" placeholder="Будь-які подробиці про цю вправу, результати та цілі…">${esc(data.notes)}</textarea></label>
    <button type="submit" class="btn">Зберегти показники</button><div class="form-error" role="alert"></div>
  </form>`;
}
function collectPerformance() {
  const form = document.querySelector("#exercise-records-form"), values = new FormData(form);
  return { notes: String(values.get("performance-notes") || ""), entries: [...form.querySelectorAll("[data-record]")].map((row) =>
    Object.fromEntries(["label", "value", "unit", "reps", "date", "note"].map((key) => [key, String(values.get(`record-${key}-${row.dataset.record}`) || "")]))),
  };
}
function refreshCatalogResults() {
  const results = document.querySelector("#catalog-results");
  if (results) results.innerHTML = catalogResults();
}
async function savePreference(id, changes) {
  if (!S.exercises.some((e) => e.id === id)) throw Error("Вправу не знайдено.");
  const data = { favorite: false, rating: null, ...S.exercisePreferences[id], ...changes };
  await db.save(privatePath(`exercisePreferences/${id}`), data);
  S.exercisePreferences[id] = data;
  refreshCatalogResults();
}
function globalExercise(id) {
  if (!S.exercises.some((e) => e.id === id && !e.personal)) throw Error("Вправу Global не знайдено.");
}
async function loadCommunity(id) {
  const box = document.querySelector("#exercise-community");
  if (!box || box.dataset.id !== id) return;
  const token = Symbol();
  box.loadToken = token;
  try {
    const [ratings, comments] = await Promise.all([
      db.list(`exercises/${id}/ratings`), db.list(`exercises/${id}/comments`),
    ]);
    if (!box.isConnected || box.loadToken !== token) return;
    const draft = box.querySelector('[name="comment"]')?.value || "";
    const summary = ratingSummary(ratings), mine = ratings.find((r) => r.id === S.user.uid);
    box.innerHTML = `<h3>Загальний рейтинг</h3>
      <p class="public-rating-summary">${summary.count ? `${summary.average.toFixed(1)} / 5 · оцінок: ${summary.count}` : "Оцінок ще немає"}</p>
      <form id="public-rating-form" data-id="${esc(id)}">
        <label>Мій голос у загальному рейтингу<select name="score">${ratingOptions(mine?.score)}</select></label>
        <p class="small muted">Один голос від користувача. Його можна змінити або прибрати, вибравши «Без оцінки».</p>
        <button type="submit" class="btn secondary">Зберегти публічну оцінку</button>
        <div class="form-error" role="alert"></div>
      </form>
      <h3>Коментарі (${comments.length})</h3>
      <form id="comment-form" data-id="${esc(id)}">
        <label>Твій коментар<textarea name="comment" required maxlength="2000" rows="3">${esc(draft)}</textarea></label>
        <p class="small muted">Коментар та твоє ім’я бачитимуть інші користувачі.</p>
        <button type="submit" class="btn">Опублікувати</button>
        <div class="form-error" role="alert"></div>
      </form>
      <div class="exercise-comments">${comments.length ? comments.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).map((c) => `
        <article class="exercise-comment"><div class="row wrap"><b>${esc(c.authorName)}</b>
        ${c.authorId === S.user.uid || owner() ? btn("Видалити", "delete-comment", `data-id="${esc(id)}" data-comment="${esc(c.id)}"`, "ghost danger") : ""}</div>
        <p>${esc(c.text)}</p></article>`).join("") : '<p class="muted">Будь першим, хто поділиться досвідом.</p>'}</div>`;
  } catch (e) {
    if (box.isConnected && box.loadToken === token) {
      // Preserve a composed comment when a refresh fails after a write.
      let error = box.querySelector(".community-error");
      if (!error) { error = document.createElement("div"); error.className = "community-error error"; box.prepend(error); }
      error.innerHTML = `${esc(err(e))} ${btn("Повторити завантаження", "reload-community", `data-id="${esc(id)}"`, "secondary")}`;
      box.querySelector(".community-loading")?.remove();
    }
  }
}
function detail(id, fromSession = false) {
  const catalogExercise = S.exercises.find((x) => x.id === id);
  let e = catalogExercise;
  if (fromSession || !e) {
    const i = ongoing()?.items.find((x) => x.exerciseId === id);
    e = i?.snapshot || e;
  }
  if (!e) {
    toast("Інструкція поки не додана.");
    return;
  }
  let video = safeURL(e.video),
    embed = "";
  if (video) {
    const u = new URL(video);
    let id;
    if (["www.youtube.com", "youtube.com", "m.youtube.com"].includes(u.hostname))
      id = u.searchParams.get("v");
    else if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    if (id && /^[\w-]{11}$/.test(id))
      embed = `
        <iframe
          title="Відео: ${esc(e.name)}"
          src="https://www.youtube-nocookie.com/embed/${id}"
          allowfullscreen
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      `;
  }
  openModal(`
    <div class="sectionhead detail-header">
      <div><span class="eyebrow">${e.personal ? "Особиста бібліотека" : "Global"}</span><h2 id="exercise-detail-title">${esc(e.name)}</h2></div>
      <button class="mini-btn" data-action="close">Закрити</button>
    </div>
    <div class="detail-top-actions">
    <span class="badge">${esc(e.primary)}${e.personal ? " · Особиста" : " · Global"}</span>
    ${catalogExercise?.personal ? btn("Редагувати", "edit-personal-exercise", `data-id="${esc(id)}"`, "secondary") + btn("Видалити", "delete-personal-exercise", `data-id="${esc(id)}"`, "ghost") : catalogExercise && !catalogExercise.archived ? btn("Створити й редагувати мою копію", "copy-global-exercise", `data-id="${esc(id)}"`, "secondary") : ""}
    </div>
    <div class="detail-tabs" role="tablist" aria-label="Розділи вправи">
      ${[["overview", "Огляд"], ...(catalogExercise ? [["private", "Для мене"]] : []), ...(catalogExercise && !catalogExercise.personal ? [["community", "Спільнота"]] : [])].map(([tab, title], index) => `<button type="button" role="tab" id="tab-${tab}" aria-controls="panel-${tab}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-action="detail-tab" data-panel="panel-${tab}">${title}</button>`).join("")}
    </div>
    <section role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
    ${exercisePhoto({ ...e, exerciseId: id }, "large")}<div class="detail-instructions">${[
      ["Обладнання", e.equipment],
      ["М’язи", `${e.primary}${e.secondary ? " · " + e.secondary : ""}`],
      ["Для чого", e.purpose],
      ["Налаштування", e.setup],
      ["Початкове положення", e.position],
      ["Техніка", e.technique],
      ["Дихання", e.breathing],
      ["Типові помилки", e.mistakes],
      ["Застереження", e.caution],
    ]
      .map(([title, text]) =>
        text
          ? `
              <section class="instruction-block"><h3>${title}</h3>
              <p>${esc(text)}</p>
              </section>
            `
          : "",
      )
      .join("")}</div>
    <p class="muted small">
      Налаштування залежать від моделі тренажера. Орієнтуйся на його інструкцію.
    </p>
    ${
      video
        ? `
          <h3>Відео</h3>
          ${embed}
          <p>
            <a href="${esc(video)}" target="_blank" rel="noopener noreferrer">Відкрити відео</a>
          </p>
        `
        : ""
    }
    </section>
    ${catalogExercise ? `<section role="tabpanel" id="panel-private" aria-labelledby="tab-private" hidden><h3>Твої показники та вподобання</h3><p class="muted">Записуй свої результати, збережи вправу в улюблених і постав особисту оцінку.</p>${privateExerciseControls(id)}</section>` : ""}
    ${catalogExercise && !catalogExercise.personal ? `<section role="tabpanel" id="panel-community" aria-labelledby="tab-community" hidden><section class="exercise-social" id="exercise-community" data-id="${esc(id)}"><p class="community-loading muted">Завантаження рейтингу й коментарів…</p></section></section>` : ""}
  `, "exercise-detail-title", "exercise-detail-dialog");
  if (catalogExercise && !catalogExercise.personal) void loadCommunity(id);
}
function exerciseForm(e = {}, personal = !!e.personal) {
  openModal(`
    <div class="sectionhead">
      <h2>${e.id ? "Редагувати" : "Нова"} вправа</h2>
      <button class="mini-btn" data-action="close">Закрити</button>
    </div>
    <p class="muted small">${personal ? "Особиста вправа — доступна лише тобі." : "Вправа каталогу Global."}</p>
    <form id="exercise-form" data-personal="${personal}" data-id="${esc(e.id || "")}">
      ${field("Назва", "name", e.name, "text", 'required maxlength="100"')}${field(
        "Обладнання",
        "equipment",
        e.equipment,
        "text",
        'maxlength="100"',
      )}
      <label>
        Основна група
        <select name="primary">
          ${options(groups, e.primary)}
        </select>
      </label>
      ${field("Допоміжні м’язи", "secondary", e.secondary, "text", 'maxlength="200"')}${[
        ["purpose", "Для чого"],
        ["setup", "Налаштування"],
        ["position", "Початкове положення"],
        ["technique", "Техніка"],
        ["breathing", "Дихання"],
        ["mistakes", "Типові помилки"],
        ["caution", "Застереження"],
      ]
        .map(
          ([k, l]) => `
            <label>
              ${l}
              <textarea name="${k}" maxlength="4000">
${esc(e[k] || "")}</textarea
              >
            </label>
          `,
        )
        .join("")}${field("Зображення — HTTPS URL", "image", e.image, "url")}${field(
        "Відео — HTTPS URL",
        "video",
        e.video,
        "url",
      )}
      <button class="btn" type="submit">Зберегти вправу</button>
      <div class="form-error" role="alert"></div>
    </form>
  `);
}
async function refresh() {
  const [programs, sessions, exercises, templates, settings, personalExercises, preferences] = await Promise.all([
    db.list(privatePath("programs")),
    db.list(privatePath("sessions")),
    db.list("exercises"),
    db.list("programTemplates"),
    db.get("settings/site"),
    db.list(privatePath("exercises")),
    db.list(privatePath("exercisePreferences")),
  ]);
  if (owner() && S.route === "admin") {
    const retired = [
      ...exercises.filter((e) => demoExerciseIds.has(e.id)).map((e) => `exercises/${e.id}`),
      ...templates.filter((t) => demoTemplateIds.has(t.id)).map((t) => `programTemplates/${t.id}`),
    ];
    if (retired.length) await db.removeMany(retired);
  }
  Object.assign(S, {
    programs,
    exercisePreferences: Object.fromEntries(preferences.map(({ id, ...data }) => [id, data])),
    sessions,
    exercises: [...exercises.filter((e) => !demoExerciseIds.has(e.id)), ...personalExercises.map((e) => ({ ...e, id: "personal:" + e.id, personal: true }))],
    templates: templates.filter((t) => !demoTemplateIds.has(t.id)),
    settings: settings || S.settings,
    loaded: true,
  });
}
async function saveSession(s) {
  s.updatedAt = Date.now();
  await db.save(privatePath(`sessions/${s.id}`), stripId(s));
  const i = S.sessions.findIndex((x) => x.id === s.id);
  if (i < 0) S.sessions.push(s);
  else S.sessions[i] = s;
  render();
}
async function action(a, b) {
  const id = b.dataset.id,
    n = +b.dataset.n,
    j = +b.dataset.j;
  switch (a) {
    case "load-users":
      if (!owner()) throw Error("Немає доступу");
      S.adminUsers = await db.list("users");
      document.querySelector("#admin-users-list").innerHTML = adminUsersList(document.querySelector("#admin-user-search").value);
      break;
    case "admin-user":
      await adminUser(id);
      break;
    case "detail-tab": {
      modal.querySelectorAll('[role="tab"]').forEach((tab) => {
        const selected = tab === b;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      modal.querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel.id !== b.dataset.panel; });
      break;
    }
    case "auth-mode":
      if (!["login", "register"].includes(id) || authMode === id) break;
      authMode = id;
      authNotice = "";
      login();
      document.querySelector(".auth-panel h1")?.focus();
      break;
    case "reset-password": {
      const form = document.querySelector("#auth-form");
      const email = form.elements.email;
      email.value = email.value.trim();
      if (!email.reportValidity()) {
        email.focus();
        return;
      }
      if (!db) throw Error("Зачекай на підключення Firebase.");
      const address = email.value;
      form.querySelector(".form-error").textContent = "";
      await db.resetPassword(address);
      openModal(`
        <h2 id="reset-email-title">Перевір пошту</h2>
        <p>Якщо для <b>${esc(address)}</b> є обліковий запис, інструкцію для відновлення пароля надіслано на цю адресу.</p>
        <p class="muted small">Лист може надійти за кілька хвилин. Перевір також папку «Спам».</p>
        ${btn("Зрозуміло", "close", 'type="button" autofocus')}
      `, "reset-email-title");
      break;
    }
    case "resend-email":
      await db.sendVerification();
      authNotice = "Лист надіслано. Перевір пошту та папку «Спам».";
      login();
      break;
    case "check-email": {
      const user = await db.checkVerification();
      if (!user?.emailVerified) throw Error("Пошта ще не підтверджена. Відкрий посилання з листа.");
      await handleUser(user);
      break;
    }
    case "retry":
      await boot();
      break;
    case "logout":
      authMode = "login";
      authNotice = "";
      authDraft = { email: "", name: "" };
      await db.logout();
      break;

    case "route":
      if (S.route === "editor") {
        persistEditorDraft(true);
        if (!confirm(draftStored ? "Вийти з редактора? Чернетка залишиться на цьому пристрої." : "Вийти з редактора без збереження?")) return;
      }
      S.route = id;
      chosenDay = null;
      render();
      window.scrollTo(0, 0);
      break;
    case "day":
      chosenDay = +b.dataset.day;
      render();
      break;
    case "calendar-month": {
      const date = new Date(`${S.calendarMonth}-01T12:00:00`);
      date.setMonth(date.getMonth() + +b.dataset.step);
      S.calendarMonth = localDate(date).slice(0, 7);
      S.calendarDate = `${S.calendarMonth}-01`;
      render();
      break;
    }
    case "calendar-today":
      S.calendarMonth = localDate().slice(0, 7); S.calendarDate = localDate(); render();
      break;
    case "calendar-date":
      S.calendarDate = id; render();
      break;
    case "export-json": downloadExport("json"); break;
    case "export-csv": downloadExport("csv"); break;
    case "edit-history":
      historyEditForm(S.sessions.find((s) => s.id === id));
      break;
    case "undo-set":
      await saveSession(undoLastSet(ongoing()));
      toast("Останній підхід скасовано");
      break;
    case "reset-history-filters":
      Object.assign(S.historyFilters, { query: "", from: "", to: "", exercise: "" }); render();
      break;
    case "sync-now":
      await db.sync(); S.syncError = ""; updateSyncNotice();
      break;
    case "confirm-restore": {
      if (!restoreDraft) throw Error("Обери резервну копію.");
      const { entries } = backupEntries(restoreDraft, S, S.user.uid);
      try {
        for (let k = 0; k < entries.length; k += 100) await db.saveMany(entries.slice(k, k + 100));
      } catch (error) { await refresh().catch(() => {}); throw error; }
      await refresh(); restoreDraft = null; modal.close(); render(); toast("Резервну копію відновлено");
      break;
    }
    case "reset-draft":
      if (confirm("Скинути незбережені зміни та відкрити початкові дані?")) {
        clearEditorDraft(); prepareEditor(false); render();
      }
      break;
    case "filter":
      S.filter = id;
      document.querySelectorAll('[data-action="filter"]').forEach((chip) => {
        const selected = chip.dataset.id === id;
        chip.classList.toggle("active", selected);
        chip.setAttribute("aria-pressed", String(selected));
      });
      document.querySelector("#catalog-results").innerHTML = catalogResults();
      break;
    case "admin-catalog-filter":
      S.adminCatalog.filter = id;
      document.querySelectorAll('[data-action="admin-catalog-filter"]').forEach((chip) => {
        const selected = chip.dataset.id === id;
        chip.classList.toggle("active", selected);
        chip.setAttribute("aria-pressed", String(selected));
      });
      document.querySelector("#admin-catalog-results").innerHTML = adminCatalogResults();
      break;
    case "reset-admin-catalog":
      Object.assign(S.adminCatalog, { filter: "Усі", query: "", equipment: "", catalogSort: "name", withPhoto: false, favoritesOnly: false, archive: "all" });
      render();
      document.querySelector("#admin-catalog-search")?.focus();
      break;
    case "reset-catalog":
      S.favoritesOnly = false;
      S.catalogScope = "all";
      S.filter = "Усі";
      S.query = "";
      S.equipment = "";
      S.catalogSort = "name";
      S.withPhoto = false;
      render();
      document.querySelector("#search")?.focus();
      break;
    case "close":
      modal.close();
      break;
    case "detail":
      detail(id, !!b.dataset.session);
      break;
    case "history": {
      const s = S.sessions.find((x) => x.id === id);
      openModal(`
        <div class="sectionhead">
          <h2>${esc(s.name)}</h2>
          <button class="mini-btn" data-action="close">Закрити</button>
        </div>
        <p class="muted">${s.date} · ${Math.round((s.endedAt - s.startedAt) / 60000)} хв</p>
        ${btn("Виправити тренування", "edit-history", `data-id="${esc(s.id)}"`, "secondary")}
        ${workoutDescription(s)}
        ${s.items
          .map(
            (i, k) => `
              ${exercisePhoto(i)}
              <h3>
                ${esc(i.name)}
                ${
                  s.skipped.includes(k)
                    ? `
                      <span class="badge">Пропущено</span>
                    `
                    : ""
                }
              </h3>
              ${s.logs
                .filter((l) => l.index === k)
                .map(
                  (l, n) => `
                    <p class="small">
                      Підхід ${n + 1} · ${l.reps} повторень · ${l.weight}
                      кг${l.seconds ? ` · ${l.seconds} сек` : i.seconds ? ` · план ${i.seconds} сек` : ""}
                    </p>
                    ${metricSummary(l.metrics)}
                  `,
                )
                .join("")}
            `,
          )
          .join("")}
      `);
      break;
    }
    case "new-history":
      editorPlanned = false;
      editorHistory = true;
      editorTemplate = false;
      editor = null;
      navigate("editor", "?history=1");
      break;
    case "new-planned":
      navigate("editor", `?planned=1${b.dataset.date ? `&date=${encodeURIComponent(b.dataset.date)}` : ""}`);
      break;
    case "repeat-history":
      modal.close();
      navigate("editor", `?planned=1&repeat=${encodeURIComponent(id)}`);
      break;
    case "reschedule": {
      const s = S.sessions.find((s) => s.id === id && s.status === "planned");
      if (!s) throw Error("Заплановане тренування не знайдено.");
      openModal(`<h2>Перенести тренування</h2><p>${esc(s.name)}</p><form id="reschedule-form" data-id="${esc(id)}">${field("Нова дата", "date", s.date >= localDate() ? s.date : localDate(), "date", `required min="${localDate()}"`)}<div class="actions"><button type="submit" class="btn">Зберегти дату</button>${btn("Скасувати", "close", 'type="button"', "ghost")}</div><div class="form-error" role="alert"></div></form>`);
      break;
    }
    case "edit-planned":
      navigate("editor", `?planned=1&id=${encodeURIComponent(id)}`);
      break;
    case "delete-planned": {
      if (!S.sessions.some((s) => s.id === id && s.status === "planned")) throw Error("Тренування не знайдено.");
      if (!confirm("Скасувати заплановане тренування?")) break;
      await db.remove(privatePath(`sessions/${id}`));
      S.sessions = S.sessions.filter((s) => s.id !== id);
      render();
      toast("Заплановане тренування скасовано");
      break;
    }
    case "start-planned": {
      if (!ongoing()) await saveSession(startPlannedSession(S.sessions.find((s) => s.id === id)));
      else toast("Спочатку заверши поточне тренування.");
      S.route = "session";
      render();
      break;
    }
    case "configure-sets": {
      collectEditor();
      const item = editor.days[n].items[j];
      if (!Number.isInteger(item.sets) || item.sets < 1 || item.sets > 20) throw Error("Вкажи від 1 до 20 підходів.");
      item.setPlans = Array.from({ length: item.sets }, (_, k) => ({ ...setPlan(item, k) }));
      render();
      break;
    }
    case "uniform-sets":
      collectEditor();
      delete editor.days[n].items[j].setPlans;
      render();
      break;
    case "new-personal-exercise":
      exerciseForm({}, true);
      break;
    case "favorite-exercise": {
      const favorite = !S.exercisePreferences[id]?.favorite;
      await savePreference(id, { favorite });
      b.setAttribute("aria-pressed", String(favorite));
      b.textContent = favorite ? "♥ В улюблених" : "♡ Додати до улюблених";
      break;
    }
    case "add-performance":
    case "remove-performance": {
      const form = document.querySelector("#exercise-records-form"), data = collectPerformance();
      if (a === "add-performance") {
        if (data.entries.length >= 30) throw Error("До 30 показників на вправу.");
        data.entries.push({ label: "", value: "", unit: "кг", reps: "", date: "", note: "" });
      } else data.entries.splice(+b.dataset.k, 1);
      document.querySelector("#exercise-records-editor").innerHTML = performanceForm(form.dataset.id, data);
      if (a === "add-performance") document.querySelector(".performance-entry:last-child input").focus();
      break;
    }
    case "reload-community":
      await loadCommunity(id);
      break;
    case "delete-comment":
      globalExercise(id);
      if (!confirm("Видалити цей коментар?")) break;
      await db.remove(`exercises/${id}/comments/${b.dataset.comment}`);
      await loadCommunity(id);
      break;
    case "copy-global-exercise": {
      const source = S.exercises.find((e) => e.id === id && !e.personal && !e.archived);
      if (!source) throw Error("Вправу Global не знайдено.");
      const copyId = crypto.randomUUID();
      const data = { ...exerciseData(source), archived: false, updatedAt: Date.now() };
      await db.save(privatePath(`exercises/${copyId}`), data);
      const personal = { ...data, id: `personal:${copyId}`, personal: true };
      S.exercises.push(personal);
      if (S.route === "exercises") render();
      exerciseForm(personal, true);
      toast("Копію додано до особистих вправ. Можеш її редагувати.");
      break;
    }
    case "edit-personal-exercise": {
      const e = S.exercises.find((e) => e.id === id && e.personal);
      if (!e) throw Error("Особисту вправу не знайдено.");
      exerciseForm(e, true);
      break;
    }
    case "delete-personal-exercise": {
      const e = S.exercises.find((e) => e.id === id && e.personal);
      if (!e || !confirm("Видалити особисту вправу? Збережені тренування залишаться в історії.")) break;
      await db.remove(privatePath("exercises/" + id.slice(9)));
      await refresh(); modal.close(); render();
      break;
    }
    case "open-import":
      if (owner()) openImport();
      break;
    case "save-import": {
      if (!owner() || !importDraft) throw Error("Спочатку перевір JSON.");
      const now = Date.now(), exerciseEntries = importDraft.exercises.map((e) => {
        const id = crypto.randomUUID();
        return [`exercises/${id}`, { ...e, archived: false, updatedAt: now }];
      });
      const entries = [...exerciseEntries, ...importDraft.programTemplates.map((p) => {
        const data = copy(p);
        for (const day of data.days) for (const item of day.items) {
          const match = exerciseEntries.find(([, e]) => e.name === item.name) ||
            S.exercises.filter((e) => !e.personal && !e.archived).map((e) => ["exercises/" + e.id, e]).find(([, e]) => e.name === item.name);
          if (match) { item.exerciseId = match[0].slice(10); item.snapshot = stripId(match[1]); }
        }
        return [`programTemplates/${crypto.randomUUID()}`, { ...data, updatedAt: now }];
      })];
      await db.saveMany(entries);
      importDraft = null; await refresh(); modal.close(); render(); toast("Імпорт збережено");
      break;
    }
    case "new-program":
    case "new-template":
    case "edit-program":
    case "edit-template":
      editorHistory = false;
      editorPlanned = false;
      editorTemplate = a.includes("template");
      if (editorTemplate && !owner()) throw Error("Немає доступу");
      editor = id
        ? copy((editorTemplate ? S.templates : S.programs).find((p) => p.id === id))
        : {
            name: "Моя програма",
            type: types[0],
            days: [{ weekday: 0, name: "Верх тіла", groups: "Груди · Спина · Плечі", items: [] }],
            archived: false,
          };
      S.route = "editor";
      render();
      break;
    case "cancel-editor":
      if (confirm("Скасувати незбережені зміни та видалити чернетку?")) {
        clearEditorDraft();
        S.route = editorPlanned ? "home" : editorTemplate ? "admin" : "program";
        render();
      }
      break;
    case "add-day":
      if (editorHistory || editorPlanned || editor.days.length >= 7) break;
      collectEditor();
      editor.days.push({
        weekday: [0, 1, 2, 3, 4, 5, 6].find((x) => !editor.days.some((d) => d.weekday === x)),
        name: "Тренування",
        groups: "",
        items: [],
      });
      editorOpenDay = editor.days.length - 1;
      render();
      break;
    case "remove-day":
      if (editorHistory || editorPlanned) break;
      collectEditor();
      editor.days.splice(n, 1);
      editorOpenDay = null;
      render();
      break;
    case "open-editor-day": {
      const day = document.querySelector(`#builder-day-${n}`);
      if (day) { day.open = true; editorOpenDay = n; day.scrollIntoView({ block: "start" }); }
      break;
    }
    case "add-custom-item": {
      const input = document.querySelector(`#custom-exercise-${n}`);
      const name = input.value.trim();
      if (!name || name.length > 100) {
        input.focus();
        throw Error("Впиши назву вправи своїми словами — до 100 символів.");
      }
      collectEditor();
      if (editor.days[n].items.length >= 30) throw Error("До 30 вправ у тренуванні.");
      editor.days[n].items.push({ custom: true, name, sets: 3,
        reps: editorHistory ? "10" : "10–12", seconds: 0, weight: 0, rest: 60, note: "", metrics: [] });
      editorOpenDay = n;
      render();
      const j = editor.days[n].items.length - 1;
      document.querySelector(`[name="customname-${n}-${j}"]`)?.focus();
      break;
    }
    case "add-item": {
      const e = S.exercises.find((x) => x.id === document.querySelector(`#add-${n}`).value);
      if (!e || e.archived || editorTemplate && e.personal) throw Error("Спочатку оберіть вправу.");
      collectEditor();
      if (editor.days[n].items.length >= 30) throw Error("До 30 вправ у тренуванні.");
      const timed = ["Кардіо", "Розминка"].includes(e.primary);
      editor.days[n].items.push({
        exerciseId: e.id,
        name: e.name,
        primary: e.primary,
        sets: timed ? 1 : 3,
        reps: timed ? "" : editorHistory ? "10" : "10–12",
        seconds: timed ? 300 : 0,
        weight: 0,
        rest: timed ? 0 : 60,
        note: "",
        snapshot: stripId(e),
        metrics: [],
      });
      render();
      break;
    }
    case "add-metric":
      collectEditor();
      {
        const item = editor.days[n].items[j];
        item.metrics ??= [];
        if (item.metrics.length >= 8) throw Error("До 8 власних параметрів на вправу.");
        item.metrics.push({ name: "", value: "", unit: "" });
        render();
      }
      break;
    case "remove-metric":
      collectEditor();
      editor.days[n].items[j].metrics.splice(+b.dataset.k, 1);
      render();
      break;
    case "remove-item":
      collectEditor();
      editor.days[n].items.splice(j, 1);
      render();
      break;
    case "move": {
      collectEditor();
      const list = editor.days[n].items,
        k = j + +b.dataset.dir;
      if (k >= 0 && k < list.length) [list[j], list[k]] = [list[k], list[j]];
      render();
      break;
    }
    case "copy-program":
    case "use-template": {
      const p = copy((a === "use-template" ? S.templates : S.programs).find((x) => x.id === id));
      delete p.id;
      p.archived = false;
      p.name += " — копія";
      p.updatedAt = Date.now();
      const key = crypto.randomUUID();
      await db.save(privatePath(`programs/${key}`), p);
      await db.patch(`users/${S.user.uid}`, { activeProgramId: key });
      S.profile.activeProgramId = key;
      await refresh();
      S.route = "program";
      render();
      toast("Програму скопійовано");
      break;
    }
    case "activate":
      await db.patch(`users/${S.user.uid}`, { activeProgramId: id });
      S.profile.activeProgramId = id;
      render();
      break;
    case "delete-program":
      if (confirm("Видалити програму? Історія тренувань залишиться.")) {
        await db.remove(privatePath(`programs/${id}`));
        await refresh();
        render();
      }
      break;
    case "start": {
      if (ongoing()) {
        S.route = "session";
        render();
        break;
      }
      const p = S.programs.find((x) => x.id === b.dataset.program) || active(),
        d = schedule(p, +b.dataset.day);
      if (!hasWorkoutContent(d)) throw Error("Опиши тренування або додай вправи до цього дня у редакторі програми.");
      const s = newSession(p, d);
      s.id = crypto.randomUUID();
      await saveSession(s);
      S.route = "session";
      render();
      break;
    }
    case "resume":
      S.route = "session";
      render();
      break;
    case "finish-text":
      await saveSession(completeTextSession(ongoing()));
      toast("Тренування збережено в історію");
      break;
    case "timer": {
      const s = copy(ongoing());
      s.timerEnd = Date.now() + setPlan(s.items[s.index], s.logs.filter((l) => l.index === s.index).length).seconds * 1000;
      await saveSession(s);
      break;
    }
    case "rest-add": {
      const s = copy(ongoing());
      s.restEnd = Math.max(Date.now(), s.restEnd) + 30000;
      await saveSession(s);
      break;
    }
    case "rest-skip": {
      const s = copy(ongoing());
      s.restEnd = 0;
      await saveSession(s);
      break;
    }
    case "next":
    case "skip": {
      const current = ongoing();
      if (a === "skip" && !confirm("Пропустити цю вправу?")) return;
      if (
        a === "next" &&
        current.logs.filter((l) => l.index === current.index).length <
          current.items[current.index].sets
      )
        throw Error("Спочатку заверши підходи або пропусти вправу.");
      const s = advance(current, a === "skip");
      await saveSession(s);
      if (s.status === "completed") toast("Тренування збережено. Хороша робота!");
      break;
    }
    case "new-exercise":
      if (owner()) exerciseForm();
      break;
    case "edit-exercise":
      if (owner()) exerciseForm(S.exercises.find((e) => e.id === id));
      break;
    case "archive-exercise":
    case "archive-template": {
      if (!owner()) return;
      const list = a === "archive-exercise" ? S.exercises : S.templates,
        e = list.find((x) => x.id === id);
      if (
        !confirm(
          e.archived ? "Відновити запис?" : "Архівувати запис? Збережені програми не зміняться.",
        )
      )
        return;
      await db.patch(`${a === "archive-exercise" ? "exercises" : "programTemplates"}/${id}`, {
        archived: !e.archived,
        updatedAt: Date.now(),
      });
      await refresh();
      render();
      break;
    }
    case "delete-exercise":
    case "delete-template": {
      if (!owner()) throw Error("Немає доступу");
      const exercise = a === "delete-exercise";
      const record = (exercise ? S.exercises.filter((e) => !e.personal) : S.templates).find((e) => e.id === id);
      if (!record) throw Error("Запис не знайдено.");
      if (!confirm(`Видалити «${record.name}» назавжди? Збережені особисті програми й історія тренувань залишаться.`)) return;
      await db.remove(`${exercise ? "exercises" : "programTemplates"}/${id}`);
      await refresh();
      render();
      toast(exercise ? "Вправу видалено" : "Шаблон видалено");
      break;
    }
  }
}
document.addEventListener("click", async (event) => {
  if (S.timerSound) timerSound.unlock();
  document.querySelectorAll(".admin-row-menu[open]").forEach((menu) => {
    if (!menu.contains(event.target) || event.target.closest("[data-action]")) menu.open = false;
  });
  const b = event.target.closest("[data-action]");
  if (!b || b.disabled || busy) return;
  busy = true;
  b.disabled = true;
  try {
    await action(b.dataset.action, b);
  } catch (e) {
    if (b.dataset.action === "reset-password") {
      const box = document.querySelector("#auth-form .form-error");
      if (box) {
        box.className = "form-error error";
        box.textContent = err(e);
      } else toast(err(e));
    } else toast(err(e));
  } finally {
    busy = false;
    if (b.isConnected) b.disabled = false;
  }
});
document.addEventListener("toggle", (event) => {
  const day = event.target;
  if (day.isConnected && day.matches?.(".program-day, .day-editor")) {
    if (day.open) {
      const selector = day.matches(".program-day") ? ".program-day[open]" : ".day-editor[open]";
      document.querySelectorAll(selector).forEach((other) => { if (other !== day) other.open = false; });
      if (day.dataset.editorDay !== undefined) editorOpenDay = +day.dataset.editorDay;
    } else if (day.dataset.editorDay !== undefined && editorOpenDay === +day.dataset.editorDay) editorOpenDay = null;
    if (day.dataset.editorDay !== undefined) persistEditorDraft();
  }
  if (!event.target.matches?.(".admin-row-menu[open]")) return;
  document.querySelectorAll(".admin-row-menu[open]").forEach((menu) => {
    if (menu !== event.target) menu.open = false;
  });
}, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.dataset.customExercise !== undefined) {
    event.preventDefault();
    const n = event.target.dataset.customExercise;
    document.querySelector(`[data-action="add-custom-item"][data-n="${n}"]`)?.click();
    return;
  }
  if (event.target.matches?.('.detail-tabs [role="tab"]') && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const tabs = [...modal.querySelectorAll('[role="tab"]')], index = tabs.indexOf(event.target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); tabs[next].click();
    return;
  }
  if (event.key !== "Escape") return;
  document.querySelectorAll(".admin-row-menu[open]").forEach((menu) => {
    menu.open = false;
    menu.querySelector("summary").focus();
  });
});
document.addEventListener("invalid", (event) => {
  if (!event.target.closest("#program-form")) return;
  let container = event.target.parentElement;
  while (container) {
    if (container.tagName === "DETAILS") container.open = true;
    container = container.parentElement;
  }
}, true);
document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (S.timerSound) timerSound.unlock();
  if (busy) return;
  const f = event.target,
    v = new FormData(f),
    button = f.querySelector("[type=submit]");
  busy = true;
  button.disabled = true;
  try {
    if (f.id === "history-edit-form") {
      const session = S.sessions.find((s) => s.id === f.dataset.id);
      const logs = session.logs.map((l, k) => ({ ...l, reps: +v.get(`log-reps-${k}`), weight: +v.get(`log-weight-${k}`), seconds: +v.get(`log-seconds-${k}`),
        metrics: (l.metrics || []).map((m, j) => ({ ...m, value: String(v.get(`log-metric-${k}-${j}`) || "").trim() })) }));
      await saveSession(editCompletedSession(session, { name: String(v.get("name")), date: v.get("date"), description: String(v.get("description") || ""), minutes: +v.get("minutes"), logs }));
      modal.close(); toast("Результати виправлено");
    }
    if (f.id === "restore-form") {
      const file = document.querySelector("#restore-file").files[0];
      if (!file || file.size > 15000000) throw Error("Обери JSON розміром до 15 МБ.");
      restoreDraft = parseBackup(await file.text()); restorePreview();
    }
    if (f.id === "auth-form") {
      if (!db) throw Error("Зачекай на підключення Firebase.");
      const email = String(v.get("email") || "").trim(),
        password = String(v.get("password") || "");
      if (authMode === "register") {
        const name = String(v.get("name") || "").trim();
        if (!name) throw Error("Вкажи своє ім’я.");
        if (password !== v.get("confirm")) throw Error("Паролі не збігаються.");
        await db.register(name, email, password);
        authNotice = "Акаунт створено. Лист підтвердження надіслано.";
        render();
      } else {
        authNotice = "";
        await db.login(email, password);
      }
    }
    if (f.id === "program-form") {
      collectEditor();
      if (editorPlanned) {
        if (editor.id && !S.sessions.some((s) => s.id === editor.id && s.status === "planned"))
          throw Error("Заплановане тренування не знайдено. Онови сторінку.");
        const session = plannedSession(editor, plannedDate);
        session.id = editor.id || crypto.randomUUID();
        await saveSession(session);
        clearEditorDraft();
        navigate("home");
        toast("Окреме тренування заплановано");
        return;
      }
      if (editorHistory) {
        const session = pastSession(editor, historyDate, historyMinutes);
        session.id = crypto.randomUUID();
        await saveSession(session);
        clearEditorDraft();
        navigate("profile");
        toast("Тренування записано в історію");
        return;
      }
      if (!validProgram(editor))
        throw Error("Перевір назву, дні без повторень і допустимі параметри вправ.");
      const id = editor.id || crypto.randomUUID(),
        data = { ...stripId(editor), updatedAt: Date.now(), archived: editor.archived || false };
      if (editorTemplate && !owner()) throw Error("Немає доступу");
      await db.save(
        editorTemplate ? `programTemplates/${id}` : privatePath(`programs/${id}`),
        data,
      );
      clearEditorDraft();
      if (!editorTemplate) {
        await db.patch(`users/${S.user.uid}`, { activeProgramId: id });
        S.profile.activeProgramId = id;
      }
      await refresh();
      S.route = editorTemplate ? "admin" : "program";
      render();
      toast("Програму збережено");
    }
    if (f.id === "reschedule-form") {
      const session = S.sessions.find((s) => s.id === f.dataset.id);
      const updated = rescheduleSession(session, v.get("date"));
      await saveSession(updated);
      modal.close();
      toast("Дату тренування змінено");
    }
    if (f.id === "set-form") {
      const current = ongoing(),
        item = current.items[current.index],
        metrics = (item.metrics || []).map((m, k) => ({
          ...m,
          value: String(v.get(`actual-metric-${k}`) || "").trim(),
        }));
      if (!validMetrics(metrics)) throw Error("Перевір власні параметри вправи.");
      const s = completeSet(current, +v.get("reps"), +v.get("weight"), metrics);
      await saveSession(s);
      toast("Підхід збережено");
    }
    if (f.id === "private-rating-form") {
      await savePreference(f.dataset.id, { rating: ratingValue(v.get("score")) });
      toast("Особисту оцінку збережено");
    }
    if (f.id === "exercise-records-form") {
      const performance = performanceData(collectPerformance());
      await savePreference(f.dataset.id, { performance });
      toast("Показники вправи збережено");
    }
    if (f.id === "public-rating-form") {
      const id = f.dataset.id, score = ratingValue(v.get("score"));
      globalExercise(id);
      const path = `exercises/${id}/ratings/${S.user.uid}`;
      if (score === null) await db.remove(path);
      else await db.save(path, { score, updatedAt: db.timestamp() });
      await loadCommunity(id);
      toast("Публічну оцінку збережено");
    }
    if (f.id === "comment-form") {
      const id = f.dataset.id;
      globalExercise(id);
      const text = commentText(v.get("comment"));
      await db.save(`exercises/${id}/comments/${crypto.randomUUID()}`, {
        text, authorId: S.user.uid, authorName: (S.user.displayName || "Спортсмен").slice(0, 100),
        createdAt: db.timestamp(),
      });
      f.elements.comment.value = "";
      await loadCommunity(id);
      toast("Коментар опубліковано");
    }
    if (f.id === "exercise-form") {
      const personal = f.dataset.personal === "true";
      if (!personal && !owner()) throw Error("Немає доступу");
      const data = exerciseData(Object.fromEntries(v)),
        old = S.exercises.find((e) => e.id === f.dataset.id);
      data.archived = old?.archived || false;
      data.updatedAt = Date.now();
      if (f.dataset.id && (!old || !!old.personal !== personal)) throw Error("Вправу не знайдено.");
      await db.save(personal ? privatePath(`exercises/${f.dataset.id ? f.dataset.id.slice(9) : crypto.randomUUID()}`) : `exercises/${f.dataset.id || crypto.randomUUID()}`, data);
      await refresh();
      modal.close();
      render();
      toast("Вправу збережено");
    }
    if (f.id === "import-form") {
      if (!owner()) throw Error("Немає доступу");
      importDraft = parseImport(String(v.get("json") || ""));
      openModal(`<h2>Перевір імпорт</h2><p>Буде додано ${importDraft.exercises.length} вправ і ${importDraft.programTemplates.length} шаблонів.</p>
        <ul>${importDraft.exercises.map((e) => `<li>Вправа: ${esc(e.name)} · ${esc(e.primary)}</li>`).join("")}${importDraft.programTemplates.map((p) => `<li>Шаблон: ${esc(p.name)} · ${p.days.length} днів</li>`).join("")}</ul>
        <details><summary>Усі дані</summary><pre class="json-preview">${esc(JSON.stringify(importDraft, null, 2))}</pre></details>
        <div class="actions">${btn("Додати все", "save-import")}${btn("Назад до JSON", "open-import", "", "secondary")}${btn("Скасувати", "close", "", "ghost")}</div>`);
    }
    if (f.id === "settings-form") {
      if (!owner()) throw Error("Немає доступу");
      const data = { ...Object.fromEntries(v), updatedAt: Date.now() };
      await db.save("settings/site", data);
      S.settings = data;
      render();
      toast("Налаштування збережено");
    }
  } catch (e) {
    const box = f.querySelector(".form-error");
    if (box && f.isConnected) {
      box.className = "form-error error";
      box.textContent = err(e);
    } else toast(err(e));
  } finally {
    busy = false;
    if (button.isConnected) button.disabled = false;
  }
});
function filterPicker(day) {
  const query = document.querySelector(`#picker-search-${day}`).value;
  const group = document.querySelector(`#picker-group-${day}`).value;
  const select = document.querySelector(`#add-${day}`);
  const selected = select.value;
  const list = S.exercises.filter((e) => !e.archived && (!editorTemplate || !e.personal) && (!group || e.primary === group) && matchesExercise(e, query));
  select.innerHTML = `<option value="">${list.length ? `Оберіть вправу · знайдено ${list.length}` : "Нічого не знайдено — зміни пошук"}</option>` + list.map((e) => `<option value="${esc(e.id)}">${esc(e.name)} · ${esc(e.equipment)}</option>`).join("");
  select.value = list.some((e) => e.id === selected) ? selected : "";
}
document.addEventListener("input", (event) => {
  if (event.target.id === "history-search") {
    S.historyFilters.query = event.target.value;
    document.querySelector("#history-results").innerHTML = filteredHistory();
  }
  if (event.target.closest("#program-form")) persistEditorDraft(true);
  if (event.target.id === "admin-catalog-search") {
    S.adminCatalog.query = event.target.value;
    document.querySelector("#admin-catalog-results").innerHTML = adminCatalogResults();
  }
  if (event.target.id === "admin-user-search") document.querySelector("#admin-users-list").innerHTML = adminUsersList(event.target.value);
  if (event.target.dataset.pickerSearch !== undefined) filterPicker(event.target.dataset.pickerSearch);
  if (event.target.id === "search") {
    S.query = event.target.value;
    document.querySelector("#catalog-results").innerHTML = catalogResults();
  }
});
document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.historyFilter) {
    S.historyFilters[target.dataset.historyFilter] = target.value;
    document.querySelector("#history-results").innerHTML = filteredHistory(); return;
  }
  if (target.id === "timer-sound" || target.id === "timer-vibration") {
    if (target.id === "timer-sound") S.timerSound = target.checked;
    else S.timerVibration = target.checked;
    if (S.timerSound) timerSound.unlock();
    try { localStorage.setItem(`nexus:timers:${S.user.uid}`, JSON.stringify({ sound: S.timerSound, vibration: S.timerVibration })); }
    catch { toast("Не вдалося зберегти налаштування на пристрої."); }
    return;
  }
  if (target.closest("#program-form")) persistEditorDraft(true);
  if (["progress-metric", "progress-period", "progress-exercise"].includes(target.id)) {
    if (target.id === "progress-metric") S.progressMetric = target.value;
    else if (target.id === "progress-period") S.progressPeriod = target.value;
    else S.progressExercise = target.value;
    document.querySelector("#progress-view").innerHTML = progressView();
    return;
  }
  if (target.dataset.adminCatalog) {
    S.adminCatalog[target.dataset.adminCatalog] = target.type === "checkbox" ? target.checked : target.value;
    document.querySelector("#admin-catalog-results").innerHTML = adminCatalogResults();
    return;
  }
  if (target.dataset.pickerGroup !== undefined) {
    filterPicker(target.dataset.pickerGroup);
    return;
  }
  if (target.id === "catalog-scope") S.catalogScope = target.value;
  else if (target.id === "catalog-equipment") S.equipment = target.value;
  else if (target.id === "catalog-sort") S.catalogSort = target.value;
  else if (target.id === "catalog-photo") S.withPhoto = target.checked;
  else if (target.id === "catalog-favorites") S.favoritesOnly = target.checked;
  else return;
  document.querySelector("#catalog-results").innerHTML = catalogResults();
});
document.addEventListener("error", (event) => {
  if (event.target.matches?.("img[data-exercise-photo]")) event.target.remove();
}, true);

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  const card = document.querySelector(".auth-card");
  card?.getAnimations().forEach((animation) => animation.cancel());
});
window.addEventListener("pagehide", () => persistEditorDraft(true));

window.addEventListener("nexus-sync", (event) => { S.syncError = event.detail.error || ""; updateSyncNotice(); });
window.addEventListener("offline", updateSyncNotice);
window.addEventListener("online", async () => {
  if (!S.user?.emailVerified || !db?.sync) return;
  try {
    await db.sync(); S.syncError = ""; await refresh();
    if (S.route !== "editor" && !modal.open && !busy) render(); else updateSyncNotice();
    toast("З’єднання відновлено. Дані синхронізовано.");
  } catch (error) { S.syncError = err(error); updateSyncNotice(); }
});
setInterval(
  () => {
    document.querySelectorAll("[data-end]").forEach((e) => {
      const end = +e.dataset.end;
      e.textContent = clock(end ? remaining(end) : +e.dataset.default || 0);
    });
    checkTimerNotifications();
  },
  1000,
);
setInterval(() => {
  if (navigator.onLine && S.user?.emailVerified && db?.pending?.() && !busy)
    db.sync().catch((error) => { S.syncError = err(error); updateSyncNotice(); });
}, 15000);
async function handleUser(user) {
  editorDraftKey = "";
  editor = null;
  S.user = user;
  S.isOwner = false;
  S.loaded = false;
  S.route = currentPage;
  S.profile = null;
  S.programs = [];
  S.sessions = [];
  S.exercises = [];
  S.exercisePreferences = {};
  S.adminUsers = [];
  S.templates = [];
  restoreDraft = null; S.syncError = ""; notifiedTimers.clear();
  S.timerSound = true; S.timerVibration = false;
  if (user) try {
    const preferences = JSON.parse(localStorage.getItem(`nexus:timers:${user.uid}`));
    S.timerSound = preferences?.sound !== false; S.timerVibration = preferences?.vibration === true;
  } catch {}
  modal.close();
  if (!user || !user.emailVerified || authPages.includes(currentPage)) {
    render();
    return;
  }
  render();
  try {
    S.isOwner = await db.isOwner();
    S.profile = await db.profile(user);
    await db.sync().catch((error) => { S.syncError = err(error); });
    await refresh();
    if (db.auth.currentUser?.uid !== user.uid) return;
    if (currentPage === "editor") prepareEditor();
    expiredTimers(ongoing(), notifiedTimers);
    render();
  } catch (e) {
    shell(`
      <section class="card">
        ${heading("Не вдалося завантажити дані")}
        <div class="error">${esc(err(e))}</div>
        <p class="small muted">
          UID:
          <code>${esc(user.uid)}</code>
        </p>
        <div class="actions">
          ${btn("Спробувати знову", "reload")}${btn("Вийти", "logout", "", "ghost")}
        </div>
      </section>
    `);
  }
}
async function boot() {
  bootError = "";
  if (authPages.includes(currentPage)) login();
  else
    root.innerHTML = `
      <main class="loading">Завантаження Nexus GymB…</main>
    `;
  try {
    db = await connect();
    if (authPages.includes(currentPage)) login();
    unsubscribeAuth?.();
    unsubscribeAuth = db.watch(handleUser);
  } catch (e) {
    bootError = "Не вдалося завантажити Firebase. Перевір інтернет і спробуй ще раз.";
    login();
  }
}
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="reload"]')) location.reload();
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
boot();
