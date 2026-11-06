import {richComposer,mountRichEditors,disposeRichEditors,collectRichComment,renderComment,captureCommentDraft,restoreCommentDraft,clearRichComment} from './rich-editor.bundle.js';
import {installReactionInteractions} from './reaction-interactions.js';
import {generatorDefaults,generatorInput,estimateNutrition,generateNutrition} from './nutrition-generator.js';
import {nutritionStudio} from './nutrition-view.js';
import { nutritionDays, mealNames, nutritionGoals, nutritionDiets, nutritionPlan, dayNutrition, shoppingList, menuText, sampleNutritionPlan } from './nutrition.js';
import { exerciseData, parseImport, importExample } from "./import.js";
import { ratingValue, ratingSummary, reviewScore, reactions, reactionLabels, commentPhoto } from "./social.js";
import { blankPerformance, performanceData } from "./performance.js";
import { matchesExercise, filterExercises } from "./catalog.js";
import { exerciseKey, previousResults, repeatProgram, rescheduleSession, monthDays, calendarEvents, progressSeries, exportData, exportCsv } from "./training-data.js";
import { draftKey, saveDraft, loadDraft, removeDraft } from "./drafts.js";
import { undoLastSet, editCompletedSession, filterHistory } from "./history.js";
import { parseBackup, backupEntries } from "./backup.js";
import { expiredTimers, createTimerSound } from "./notifications.js";
import { activityMillis, createActivityTracker } from "./activity.js";
import { shareableProgram, shareToken, programShareURL } from "./sharing.js";
import { connect } from "./firebase.js";
import { trainingStreak, personalRecords, previousWorkingSet, memberDays } from "./fitness.js";
import { avatarSource, prepareAvatar, prepareBanner, prepareProfileBackground, bannerSource, contactURL } from "./people.js";
import { appearanceDefaults,profileAppearance,appearanceStyle,applyProfilePageAppearance } from './profile-appearance.js';
import { loginIpHistory } from "./login-metadata.js";
import { profileVisibility, profileSnapshots, recordSharingKeys, commentThreads } from "./profile-data.js";
import { appBase, profileNumber, profileURL } from "./routes.js";
import { tagData, tagStyle, tagTemplates } from "./user-tags.js";
import { saveSetDraft, loadSetDraft, clearSetDraft } from './workout-recovery.js';
import { invitePlan } from './training-invites.js';
import { drawProfileCrop } from './profile-image-editor.js';
import { reportReasons } from './community-safety.js';
import { workoutSummary } from './workout-summary.js';
import { measurementData, measurementFields, measurementSeries } from './body-measurements.js';
import { manualSetData, progressSessions } from './manual-sets.js';
import { adminStats } from './admin-stats.js';
import {
  days,
  dayCodes,
  dayLabel,
  nextSequenceDay,
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
  workingSetCount,
  advance,
  validMetrics,
  setPlan,
  pastSession,
  plannedSession,
  startPlannedSession,
  hasWorkoutContent,
  completeTextSession,
  finishEarly,
} from "./model.js";
const root = document.querySelector("#app"),
  modal = document.querySelector("#modal");
const requestedCalendar = new URLSearchParams(location.search).get('date') || '';
const initialCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedCalendar) && Number.isFinite(Date.parse(requestedCalendar))
  && localDate(new Date(`${requestedCalendar}T12:00:00`)) === requestedCalendar ? requestedCalendar : localDate();
const S = {
  isOwner: false,
  homeAccess: false,
  customizationAccess:false,
  adminAccess: {},
  user: null,
  profile: null,
  programs: [],
  sessions: [],
  measurements: [],
  measurementsError: '',
  manualSets: [],
  manualSetsError: '',
  measurementMetric: 'weight',
  measurementPeriod: '90',
  summaryId: new URLSearchParams(location.search).get('summary') || '',
  exercises: [],
  exercisePreferences: {},
  favoritesOnly: false,
  adminUsers: [],
  adminStatsAt: 0,
  templates: [],
  nutritionPlans: [], nutritionAccess: false, nutritionError: "", nutritionId: "", nutritionDay: 0,
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
  communityLoading: false,
  publicProfileReady: false,
  calendarMonth: initialCalendarDate.slice(0, 7),
  calendarDate: initialCalendarDate,
  progressMetric: "weight",
  progressExercise: "",
  progressPeriod: "90",
  historyFilters: { query: "", from: "", to: "", exercise: "" },
  timerSound: true,
  timerVibration: false,
  syncError: "",
  people: null,
  selfPublic: null,
  notices: [],
  noticeError: '',
  settingsSection: 'user',
  blocked: [],
  blockedProfiles: {},
  reports: [],
  invites: [],
  reportProfiles: {},
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
let incomingShare = null;
let stopNotices = null, replyingTo = null;
let imageEdit = null;
const activity = createActivityTracker({
  send: (uid) => db?.markActive?.(uid) ?? false,
  userId: () => S.loaded && S.user?.emailVerified ? S.user.uid : "",
  online: () => navigator.onLine,
  visible: () => document.visibilityState === "visible",
});
const requestedShare = () => shareToken(new URLSearchParams(location.search).get("share"));
const requestedProfileNumber = () => profileNumber(location.pathname) || (/^[1-9][0-9]{0,11}$/.test(new URLSearchParams(location.search).get('number') || '') ? new URLSearchParams(location.search).get('number') : '');
const shareQuery = () => {
  const query = new URLSearchParams();
  if (requestedShare()) query.set('share', requestedShare());
  if (requestedProfileNumber()) query.set('number', requestedProfileNumber());
  return query.size ? `?${query}` : '';
};
const timerSound = createTimerSound(), notifiedTimers = new Set();
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const paths = {
  nutrition: `<path d="M5 3v7m3-7v7M3 3v5a4 4 0 0 0 8 0V3M7 12v9M20 3c-4 0-5 5-5 9h5m0-9v18" />`,
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
  settings: `
    <path d="m9.5 2-.6 2.4a8 8 0 0 0-1.8 1L4.7 4.7l-2.5 4.4L4 10.8a8 8 0 0 0 0 2.4l-1.8 1.7 2.5 4.4 2.4-.7a8 8 0 0 0 1.8 1l.6 2.4h5l.6-2.4a8 8 0 0 0 1.8-1l2.4.7 2.5-4.4-1.8-1.7a8 8 0 0 0 0-2.4l1.8-1.7-2.5-4.4-2.4.7a8 8 0 0 0-1.8-1L14.5 2Z" />
    <circle cx="12" cy="12" r="3" />
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
const canUseHome = () => owner() || S.homeAccess;
function requireHomeAccess(program) {
  if (program?.scope === "home" && !canUseHome()) throw Error("Доступ до домашніх комплексів надає адміністратор.");
}
const active = () => S.programs.find((p) => p.id === S.profile?.activeProgramId && p.scope !== "home") || S.programs.find((p) => p.scope !== "home");
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
    "resource-exhausted": "Вичерпано квоту бази даних. Доступ відновиться після поновлення квоти або зміни тарифу адміністратором.",
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
  nutrition: "nutrition.html",
  exercises: "exercises.html",
  profile: "profile.html",
  settings: "settings.html",
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

  window.location.assign(new URL(pageFiles[page] + query, appBase).href);
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
  if (editor && !id) {
    editor.builderMode = "simple";
    if (q.get("home") === "1") {
      editor.scope = "home"; editor.name = "Домашнє тренування"; editor.type = "Власна програма";
      editor.days = [{ weekday: 0, name: "Домашнє тренування", groups: "", items: [] }];
      editorOpenDay = 0;
    }
  }
  if (editorHistory) {
    editor = { name: "Минуле тренування", type: "Власна програма", days: [{ weekday: 0, name: "Тренування", groups: "", items: [] }] };
  }
  if (editorPlanned) {
    const session = id ? S.sessions.find((s) => s.id === id && s.status === "planned") : null;
    plannedDate = session?.date || (q.get("date") >= localDate() ? q.get("date") : localDate());
    editor = id && !session ? null : { ...(session ? { id: session.id } : {}),
      name: session?.name || "Окреме тренування", type: "Власна програма",
      days: [{ weekday: 0, name: "Тренування", groups: "", description: session?.description || "", warmup: session?.warmup || "", items: copy(session?.items || []) }] };
    if (q.get("repeat")) {
      const source = S.sessions.find((s) => s.id === q.get("repeat"));
      editor = source?.status === "completed" ? repeatProgram(source) : null;
    }
  }
  if (!editor) {
    S.route = editorPlanned ? "home" : editorTemplate ? "admin" : "program";
    toast(editorPlanned ? "Заплановане тренування не знайдено." : "Програму не знайдено.");
  }
  if (editor?.scope === "home" && !canUseHome()) {
    editor = null; S.route = "program"; toast("Доступ до домашніх комплексів надає адміністратор.");
  }
  if (editor?.scope === "home") editorOpenDay = 0;
  editorDraftKey = draftKey(S.user.uid, editorTemplate ? "template" : editorHistory ? "history" : editorPlanned ? "planned" : editor?.scope === "home" ? "home" : "program", id || q.get("repeat") || "new");
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
  const u = avatarSource(S.profile?.photo || S.user?.photoURL);
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
    ["nutrition", "Харчування"],
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
  disposeRichEditors(root);
  closeReactionPicker();
  root.innerHTML = `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <button type="button" class="brand" data-action="route" data-id="home">Nexus GymB</button>
        <nav class="topnav" aria-label="Основна навігація">${nav()}</nav>
        <div class="header-account"><button class="notice-bell" type="button" data-action="open-notices" aria-label="Сповіщення"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span id="notice-count" class="notice-count" hidden></span></button><button type="button" class="header-settings ${S.route === 'settings' ? 'active' : ''}" data-action="route" data-id="settings" aria-label="Налаштування" title="Налаштування" ${S.route === 'settings' ? 'aria-current="page"' : ''}>${icon('settings')}</button><button
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
        </button></div>
      </div>
    </header>
    <main class="main">
      <div id="offline">${syncNotice()}</div>
      ${resumeReminder()}
      ${content}
    </main>
  `;
  previousScrollY = Math.max(0, window.scrollY || 0);
  applyProfilePageAppearance(S.loaded && S.route === 'profile' && !S.people?.error && !S.people?.person?.restricted ? S.people?.person?.appearance : null);
  updateNoticeBadge();
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
      navigate("login", shareQuery());
      return;
    }
    login();
    return;
  }
  if (!S.user.emailVerified) {
    if (!authPages.includes(currentPage)) {
      navigate("login", shareQuery());
      return;
    }
    login();
    return;
  }
  if (authPages.includes(currentPage)) {
    navigate(requestedProfileNumber() ? 'profile' : requestedShare() ? "program" : "home", shareQuery());
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
        ? `?${new URLSearchParams({ ...(editor?.id ? { id: editor.id } : {}), ...(editorTemplate ? { template: "1" } : {}), ...(editorHistory ? { history: "1" } : {}), ...(editorPlanned ? { planned: "1" } : {}), ...(editor?.scope === "home" ? { home: "1" } : {}) })}`
        : "";
    navigate(S.route, query);
    return;
  }
  const screens = {
    home,
    program: programs,
    nutrition,
    exercises: catalog,
    profile,
    settings,
    admin,
    editor: programEditor,
    session: sessionView,
  };
  shell((screens[S.route] || home)());
  mountRichEditors(root);
  restoreSetInputs();
  const nutritionForm=document.getElementById("nutrition-generator-form");if(nutritionForm)updateNutritionPreview(nutritionForm.elements.age);
}

async function loadNutrition() {
  S.nutritionError = ''; S.nutritionPlans = [];
  try {
    const access = await db.getLive(`userAccess/${S.user.uid}`);
    S.nutritionAccess = access?.nutrition === true;
    if (!owner() && !S.nutritionAccess) { S.nutritionResult=null; S.nutritionHydrated=false; return; }
    if (S.route === 'nutrition') {
      if (!S.nutritionHydrated) {
        const saved = await db.getLive(privatePath('nutrition/generator'));
        if (saved) { S.nutritionInput=generatorInput(saved.input); S.nutritionResult=generateNutrition(saved.input,saved.seed);loadNutritionChecks(); }
        S.nutritionHydrated=true;
      }
    } else {
      const {plans, selection} = await db.nutritionData();
      S.nutritionPlans = plans.map(plan => ({...nutritionPlan(plan),id:plan.id})).sort((a,b) => a.name.localeCompare(b.name,'uk'));
      if (!S.nutritionPlans.some(plan => plan.id === S.nutritionId)) S.nutritionId = S.nutritionPlans.find(plan => plan.id === selection?.planId)?.id || S.nutritionPlans[0]?.id || '';
    }
  } catch (error) {
    if (error.code === 'permission-denied') { S.nutritionAccess = false; S.nutritionResult=null; S.nutritionHydrated=false; }
    S.nutritionError = err(error); S.nutritionPlans=[];
  }
}
function selectedNutrition() { return S.nutritionPlans.find(plan => plan.id === S.nutritionId); }
function nutritionTotals(day) {
  const totals = dayNutrition(day);
  return totals.kcal !== null || totals.protein !== null || totals.fat !== null || totals.carbs !== null ? `<div class="nutrition-totals">${[['kcal','ккал'],['protein','г білків'],['fat','г жирів'],['carbs','г вуглеводів']].map(([key,label]) => totals[key] === null ? '' : `<span><strong>${totals[key]}</strong> ${label}</span>`).join('')}</div>` : '';
}
function nutrition() {
  return nutritionStudio({input:S.nutritionInput||generatorDefaults,result:S.nutritionResult,day:S.nutritionDay,shopping:S.nutritionShopping,checked:S.nutritionChecked||[],editing:S.nutritionEditing,allowed:owner()||S.nutritionAccess,error:S.nutritionError});
}
function nutritionFormInput(form) {
  const values=Object.fromEntries(new FormData(form));
  values.needsCare=form.elements.needsCare.checked;
  if(values.goal==='maintain')values.adjustment=0;
  return values;
}
function updateNutritionPreview(target) {
  const form=target.closest('#nutrition-generator-form');if(!form)return;
  if(target.dataset.nutritionRange)form.elements[target.dataset.nutritionRange].value=target.value;
  if(target.name==='goal') {
    const adjustment=form.elements.adjustment;
    adjustment.value=target.value==='lose'?15:target.value==='gain'?8:0;
    adjustment.max=target.value==='gain'?15:20;
    const range=form.querySelector('[data-nutrition-range="adjustment"]');range.max=adjustment.max;range.value=adjustment.value;
  }
  for(const range of form.querySelectorAll('[data-nutrition-range]')) {
    const field=form.elements[range.dataset.nutritionRange];range.value=field.value;
    if(range.dataset.nutritionRange==='adjustment'){const disabled=form.elements.goal.value==='maintain';range.disabled=disabled;field.disabled=disabled;}
    range.style.setProperty('--range-progress',`${(Number(range.value)-Number(range.min))/(Number(range.max)-Number(range.min))*100}%`);
  }
  S.nutritionInput=nutritionFormInput(form);
  let targets;try{targets=estimateNutrition(S.nutritionInput);}catch{}
  for(const key of ['kcal','protein','fat','carbs']) {const output=document.getElementById(`nutrition-live-${key}`);if(output)output.textContent=targets?targets[key].toLocaleString('uk-UA'):'—';}
}
async function createPersonalNutrition(input,seed=0) {
  if(!navigator.onLine)throw Error('Підключи інтернет, щоб перевірити доступ і зберегти раціон.');
  const access=await db.getLive(`userAccess/${S.user.uid}`);
  if(!owner()&&access?.nutrition!==true){S.nutritionAccess=false;S.nutritionResult=null;render();throw Error('Доступ до харчування вимкнено.');}
  const result=generateNutrition(input,seed);
  await db.saveNutritionGenerator({version:1,input:result.input,seed,updatedAt:Date.now()});
  S.nutritionResult=result;S.nutritionInput=result.input;S.nutritionHydrated=true;S.nutritionDay=0;S.nutritionShopping=false;S.nutritionChecked=[];S.nutritionEditing=false;
  saveNutritionChecks();
  render();document.getElementById('nutrition-results')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function nutritionChecksKey() {
  return `nexus:groceries:${S.user.uid}`;
}
function nutritionChecksSignature() {
  return JSON.stringify([S.nutritionResult?.input,S.nutritionResult?.seed,S.nutritionResult?.groceries]);
}
function loadNutritionChecks() {
  S.nutritionChecked=[];
  try{const saved=JSON.parse(localStorage.getItem(nutritionChecksKey()));if(saved?.signature===nutritionChecksSignature()&&Array.isArray(saved.checked))S.nutritionChecked=saved.checked.filter(id=>S.nutritionResult.groceries.some(item=>item.id===id));}catch{}
}
function saveNutritionChecks() {
  try{localStorage.setItem(nutritionChecksKey(),JSON.stringify({signature:nutritionChecksSignature(),checked:S.nutritionChecked}));}catch{toast('Не вдалося зберегти відмітки на пристрої.');}
}
document.addEventListener('toggle',event=>{
  if(event.target.id!=='nutrition-shopping-inline')return;
  S.nutritionShopping=event.target.open;
  const button=document.querySelector('[data-action="nutrition-shopping"]');
  if(button){button.setAttribute('aria-expanded',String(S.nutritionShopping));button.setAttribute('aria-label',S.nutritionShopping?'Сховати покупки':'Список покупок');button.textContent=S.nutritionShopping?'Сховати покупки ↗':'Список покупок ↗';}
},true);
function adminNutritionPanel() {
  return `<section class="card" id="admin-nutrition"><div class="sectionhead"><div><span class="eyebrow">Харчування</span><h2>Меню на тиждень</h2></div>${btn('＋ Новий план харчування','new-nutrition','','secondary')}</div><p class="muted">Створюй готові меню на 7 днів. Доступ учасників вмикається окремо в картці користувача.</p>${S.nutritionError ? `<p role="alert">${esc(S.nutritionError)}</p>${btn('Оновити меню','nutrition-reload','','ghost')}` : ''}${S.nutritionPlans.map(plan => `<div class="exercise-row template-row"><div class="grow"><h3>${esc(plan.name)}</h3><p class="small muted">${esc(plan.goal)} · ${esc(plan.diet)}</p></div>${btn('Редагувати','edit-nutrition',`data-id="${esc(plan.id)}"`,'secondary')}${btn('Видалити','delete-nutrition',`data-id="${esc(plan.id)}"`,'ghost danger')}</div>`).join('') || '<p class="muted">Планів ще немає. Новий план міститиме приклад меню, який можна змінити.</p>'}</section>`;
}
function nutritionEditor(plan = sampleNutritionPlan()) {
  if (!owner()) throw Error('Немає доступу');
  openModal(`<div class="sectionhead"><h2 id="nutrition-editor-title">${plan.id ? 'Редагувати меню' : 'Новий план харчування'}</h2>${btn('Закрити','close','','ghost')}</div><form id="nutrition-plan-form" data-id="${esc(plan.id || '')}"><div class="formgrid">${field('Назва плану','name',plan.name,'text','required maxlength="100"')}<label>Ціль<select name="goal">${options(nutritionGoals,plan.goal)}</select></label><label>Тип раціону<select name="diet">${options(nutritionDiets,plan.diet)}</select></label></div><label>Опис<textarea name="description" maxlength="1000" rows="2">${esc(plan.description)}</textarea></label><p class="small muted">Перевір приклад перед збереженням. Для кожної страви вкажи продукти з кількостями, кожен з нового рядка. Калорії та БЖВ можна залишити порожніми.</p>${plan.days.map((day,d) => `<details class="nutrition-editor-day" ${d === 0 ? 'open' : ''}><summary>${nutritionDays[d]}</summary>${day.meals.map((meal,m) => `<fieldset class="nutrition-editor-meal"><legend>${mealNames[m]}</legend>${field('Страва',`meal-${d}-${m}-name`,meal.name,'text','required maxlength="100"')}<label>Продукти та кількості<textarea name="meal-${d}-${m}-ingredients" rows="4" required maxlength="5000" placeholder="Наприклад: рис — 70 г (сухий)">${esc(meal.ingredients.join('\n'))}</textarea></label><div class="formgrid">${[['kcal','Калорії, ккал'],['protein','Білки, г'],['fat','Жири, г'],['carbs','Вуглеводи, г']].map(([key,label]) => field(label,`meal-${d}-${m}-${key}`,meal[key] ?? '', 'number',`min="0" max="${key === 'kcal' ? 5000 : 1000}" step="0.1"`)).join('')}</div></fieldset>`).join('')}</details>`).join('')}<button class="btn" type="submit">Зберегти меню</button><div class="form-error" role="alert"></div></form>`,'nutrition-editor-title','nutrition-editor');
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
  return (day?.scheduledTime || day?.invitationNote ? `<div class="notice"><strong>Спільне тренування${day.scheduledTime ? ` · ${esc(day.scheduledTime)}` : ''}</strong>${day.invitationNote ? `<p>${esc(day.invitationNote)}</p>` : ''}</div>` : '') +
    (day?.warmup ? `<div class="notice workout-description"><strong>Розминка${day.warmupSkipped ? " · пропущено" : day.warmupDone ? " · виконано" : ""}</strong><p>${esc(day.warmup)}</p></div>` : "") +
    (day?.description ? `<div class="notice workout-description">${esc(day.description)}</div>` : "");
}
function home() {
  const p = active(),
    sequential = p?.scheduleMode === "sequence",
    today = schedule(p),
    d = chosenDay !== null ? schedule(p, chosenDay) : sequential ? nextSequenceDay(p, S.sessions) : today || nextDay(p),
    session = ongoing(),
    completed = S.sessions.filter((s) => s.status === "completed");
  return (
    heading(`Привіт, ${esc(S.user.displayName?.split(" ")[0] || "спортсмене")} 👋`, "", owner() ? btn("Перейти до адмінки", "route", 'data-id="admin"', "ghost") : "") + streakCard() +
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
              ${session ? "Тренування триває" : sequential ? "Тренуйся у своєму темпі" : today ? "Сьогодні за планом" : "Сьогодні"}
            </span>
            <h2>${session ? esc(session.name) : sequential && d ? esc(dayLabel(p, d)) + " · " + esc(d.name) : today ? esc(today.name) : "День відпочинку"}</h2>
            <p>
              ${
                session
                  ? "Повернися до підходу, на якому зупинився."
                  : sequential
                    ? "Обирай день програми та починай, коли тобі зручно."
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
                      sequential || today ? "Почати тренування" : "Відкрити наступне тренування",
                      "start",
                      `data-day="${d.weekday}"`,
                    )
                  : btn("Створити програму", "new-program")
            }
            <span class="badge">${esc(p?.name || "Твій новий початок")}</span>
          </section>
          <section class="card">
            <div class="sectionhead">
              <h2>${sequential ? "Дні програми" : "Твій тиждень"}</h2>
              <span class="muted small">${p?.days.length || 0} тренувальні дні</span>
            </div>
            <div class="week ${sequential ? "sequence-days" : ""}">
              ${sequential ? p.days.map((day) => `<button class="day ${d === day ? "today" : ""}" data-action="day" data-day="${day.weekday}"><span>${esc(dayLabel(p, day))}</span><b>${esc(day.name)}</b></button>`).join("") : days
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
              <span class="small muted">${d ? esc(dayLabel(p, d, true)) : ""}</span>
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
          ${canUseHome() ? `<section class="card">
            <div class="sectionhead"><h2>Домашні комплекси</h2>${btn("＋ Створити", "new-home", "", "secondary")}</div>
            <p class="muted small">Для шиї, пресу чи інших вправ. Запускай у будь-який день поза основною програмою.</p>
            ${S.programs.filter((p) => p.scope === "home").map((p) => `<div class="exercise-row"><div class="grow"><h3>${esc(p.name)}</h3><span class="small muted">${p.days[0].items.length} вправ</span></div><div class="actions">${btn("Почати", "start", `data-program="${esc(p.id)}" data-day="${p.days[0].weekday}"`, "secondary")}${btn("Редагувати", "edit-program", `data-id="${esc(p.id)}"`, "ghost")}</div></div>`).join("") || '<p class="small muted">Створи свій перший домашній комплекс.</p>'}
          </section>` : ""}
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
              ${btn('Підсумок','show-workout-summary',`data-id="${esc(s.id)}"`,'ghost')}
            </div>
          `,
        )
        .join("")
    : `
        <p class="small muted">Завершені тренування з’являться тут.</p>
      `;
}
function programs() {
  const visible = S.programs.filter((p) => p.scope !== "home" || canUseHome())
    .sort((a, b) => Number(b.id === active()?.id) - Number(a.id === active()?.id));
  const templates = S.templates.filter((t) => !t.archived);
  return (
    heading("Твоя програма", "Дні тренувань та вправи.", btn("＋ Нова програма", "new-program") + (canUseHome() ? btn("＋ Домашній комплекс", "new-home", "", "secondary") : "") + btn("Записати минуле тренування", "new-history", "", "secondary")) +
    `
      <div class="stack">
        ${
          visible.length
            ? visible
                .map(
                  (p) => `
                  <section class="card">
                    <div class="sectionhead">
                      <div>
                        <span class="badge">
                          ${p.scope === "home" ? "Домашній комплекс" : esc(p.type)}${p.id === active()?.id ? " · Активна" : ""}
                        </span>
                        <h2 style="margin:15px 0 8px">${esc(p.name)}</h2>
                        <p class="small muted">
                          ${p.scope === "home" ? "Запускай у будь-який день · поза основним розкладом" : p.days.map((d) => dayLabel(p, d)).join(" · ")}
                        </p>
                      </div>
                      <div class="actions">
                        ${btn("Почати тренування", "choose-program-day", `data-id="${esc(p.id)}"`)}${btn("Редагувати", "edit-program", `data-id="${p.id}"`, "secondary")}${btn("Поділитися", "share-program", `data-id="${p.id}"`, "ghost")}${btn(
                          "Копіювати",
                          "copy-program",
                          `data-id="${p.id}"`,
                          "ghost",
                        )}${
                          p.scope !== "home" && p.id !== active()?.id
                            ? btn("Зробити активною", "activate", `data-id="${p.id}"`, "ghost")
                            : ""
                        }${btn("Видалити", "delete-program", `data-id="${p.id}"`, "ghost")}
                      </div>
                    </div>
                    ${p.days
                      .map(
                        (d) => `
                          <details class="program-day" name="program-days">
                            <summary><span class="number">${p.scope === "home" ? "⌂" : esc(dayLabel(p, d))}</span><span class="grow"><strong>${esc(d.name)}</strong><span class="small muted">${esc(d.groups)} · ${d.items.length} вправ</span></span><span class="day-chevron" aria-hidden="true">⌄</span></summary>
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
          ${
            templates.length
              ? templates
                  .map(
                    (t) => `
                    <div class="exercise-row template-row">
                      <div class="grow">
                        <h3>${esc(t.name)}</h3>
                        <p>${esc(t.type)} · ${t.days.length} дні</p>
                      </div>
                      ${btn("Оцінки та коментарі", "template-community", `data-id="${esc(t.id)}"`, "ghost")}
                      ${btn("Використати", "use-template", `data-id="${t.id}"`, "secondary")}
                    </div>
                  `,
                  )
                  .join("")
              : `
                <p class="muted">Шаблонів немає.</p>
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

const builderFeatures = [["sets", "Підходи"], ["reps", "Повторення"], ["seconds", "Час"], ["weight", "Вага"], ["rest", "Відпочинок"], ["note", "Примітка"], ["plans", "Кожен підхід"], ["metrics", "Власні параметри"]];
function itemFeatures(item) {
  return item.builderFeatures || builderFeatures.map(([key]) => key).filter((key) =>
    key === "plans" ? item.setPlans : key === "metrics" ? item.metrics?.length :
    key === "sets" ? item.sets !== 1 : !!item[key]);
}
function programEditor() {
  persistEditorDraft();
  const mode = editor.builderMode || "advanced", home = editor.scope === "home";
  return (
    heading(
      home ? "Домашній комплекс" : editorPlanned ? "Планування окремого тренування" : editorHistory ? "Запис минулого тренування" : editorTemplate ? "Шаблон програми" : "Редактор програми",
      "Дні, вправи та навантаження — під твої цілі.",
    ) +
    `
      <form id="program-form" class="card program-builder" data-mode="${mode}">
        <label>Конструктор<select id="builder-mode"><option value="simple" ${mode === "simple" ? "selected" : ""}>Простий</option><option value="cross" ${mode === "cross" ? "selected" : ""}>Мішаний</option><option value="advanced" ${mode === "advanced" ? "selected" : ""}>Розширений</option></select></label>
        <p class="small muted">${mode === "simple" ? "Список вправ по черзі. Нові вправи мають один підхід без таймера. Налаштування раніше доданих вправ зберігаються." : mode === "cross" ? "Список вправ із параметрами, які ти додаєш по одному для кожної вправи." : "Усі параметри вправ і налаштування кожного підходу."}</p>
        ${home ? '<p class="notice">Збережи комплекс для шиї, пресу чи інших вправ удома та запускай у будь-який день. Основна програма й розклад залишаються окремими.</p>' : ""}
        <div class="row wrap"><p id="draft-status" class="small muted" role="status">${draftMessage()}</p>${btn("Скинути чернетку", "reset-draft", 'type="button"', "ghost")}</div>
        <div class="builder-intro"><span class="eyebrow">Твій план</span><h2>${home ? "Твій домашній комплекс" : editorPlanned ? "Заплануй тренування" : editorHistory ? "Запиши результат" : "Побудуй свою програму"}</h2><p class="muted">${editorPlanned ? "Обери дату й назву. Опиши тренування своїми словами або додай вправи з потрібним навантаженням." : "Назви програму, обери дні та опиши тренування або додай вправи з потрібним навантаженням."}</p></div>
        ${!home && !editorHistory && !editorPlanned ? `<label>Порядок тренувань<select id="schedule-mode"><option value="week" ${editor.scheduleMode !== "sequence" ? "selected" : ""}>Дні тижня</option><option value="sequence" ${editor.scheduleMode === "sequence" ? "selected" : ""}>День 1, День 2…</option></select></label>` : ""}
        <div class="editor-overview"><span><b>${editor.days.length}</b> днів</span><span><b>${editor.days.reduce((sum, d) => sum + d.items.length, 0)}</b> вправ</span></div>
        ${editorHistory ? `<p class="muted">Обери дату, додай вправи та вкажи фактичні повторення й вагу. Для різних підходів натисни «Налаштувати кожен підхід».</p><div class="formgrid">${field("Дата тренування", "history-date", historyDate, "date", 'required max="' + localDate() + '"')}${field("Тривалість, хв", "history-minutes", historyMinutes, "number", 'required min="0" max="1440"')}</div>` : ""}
        ${editorPlanned ? field("Дата тренування", "planned-date", plannedDate, "date", 'required min="' + localDate() + '"') : ""}
        <div class="formgrid">
          ${field("Назва", "name", editor.name, "text", 'required maxlength="100"')}
          <label ${editorPlanned || home ? "hidden" : ""}>
            Тип програми
            <select name="type">
              ${options(types, editor.type)}
            </select>
          </label>
        </div>
        <nav class="builder-days" aria-label="Дні програми" ${editorPlanned || home ? "hidden" : ""}>${editor.days.map((d, n) => `<button type="button" data-action="open-editor-day" data-n="${n}">${esc(dayLabel(editor, d) || "День")} · ${esc(d.name || `День ${n + 1}`)}</button>`).join("")}</nav>
        <div id="days-editor">
          ${editor.days
            .map(
              (d, n) => `
                <details class="day-editor" name="editor-days" id="builder-day-${n}" data-editor-day="${n}" ${editorOpenDay === n ? "open" : ""}>
                  <summary><span class="number">${home ? "⌂" : editorPlanned ? "1" : esc(dayLabel(editor, d) || "День")}</span><span class="grow"><strong>${esc(editorPlanned || home ? editor.name : d.name || `День ${n + 1}`)}</strong><span class="small muted">${editorPlanned ? "Тренування" : `День ${n + 1}`} · ${d.items.length} вправ</span></span><span class="day-chevron" aria-hidden="true">⌄</span></summary>
                  <div class="editor-day-content">
                  <div class="sectionhead">
                    <div><span class="eyebrow">${d.items.length} вправ</span><h2>${editorPlanned || home ? "Вправи тренування" : `День ${n + 1}`}</h2></div>
                    <button type="button" class="mini-btn" data-action="remove-day" data-n="${n}" ${editorPlanned || home ? "hidden" : ""} ${editorHistory || editorPlanned || home ? "disabled" : ""}>
                      Прибрати день
                    </button>
                  </div>
                  <div class="formgrid" ${editorPlanned || home ? "hidden" : ""}>
                    <label ${editorPlanned || home || editor.scheduleMode === "sequence" ? "hidden" : ""}>
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
                  <label>Розминка перед тренуванням <span class="small muted">Необов’язково. Залиш порожнім, якщо не хочеш її записувати.</span>
                    <textarea name="warmup-${n}" rows="3" maxlength="2000" placeholder="Наприклад: 5 хв ходьби, оберти плечима, легкі присідання">${esc(d.warmup || "")}</textarea>
                  </label>
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
                        <div class="item-editor" data-features="${esc(itemFeatures(i).join(" "))}">
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
                          ${mode === "cross" ? '<div class="actions feature-picker">' + builderFeatures.map(([key, label]) => btn((itemFeatures(i).includes(key) ? "✓ " : "＋ ") + label, "toggle-feature", 'type="button" data-n="' + n + '" data-j="' + j + '" data-feature="' + key + '" aria-pressed="' + itemFeatures(i).includes(key) + '"', "ghost")).join("") + '</div>' : ""}
                          <div class="item-parameters"><div class="formgrid four">
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
                          <details class="builder-extra" ${i.metrics?.length ? "open" : ""}><summary>Додаткові параметри вправи</summary>${metricEditor(i, n, j)}</details></div>
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
            ${editorPlanned || home ? "hidden" : ""}
            ${editorHistory || editorPlanned || editor.days.length >= (editor.scheduleMode === "sequence" ? 30 : 7) ? "disabled" : ""}
          >
            ＋ Додати день
          </button>
          <button class="btn" type="submit">${home ? "Зберегти комплекс" : editorPlanned ? "Зберегти тренування" : editorHistory ? "Зберегти в історію" : "Зберегти програму"}</button>
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
    if (editor.scheduleMode !== "sequence") d.weekday = +v.get(`day-${n}`);
    d.name = editor.scope === "home" ? editor.name : v.get(`dayname-${n}`);
    d.groups = v.get(`groups-${n}`);
    d.description = String(v.get(`description-${n}`) || "");
    d.warmup = String(v.get(`warmup-${n}`) || "").trim();
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
      if (!editor.builderMode || editor.builderMode === "advanced") delete i.builderFeatures;
    });
  });
  persistEditorDraft();
}
function setLogLabel(logs, position) {
  const log = logs[position];
  const number = logs.slice(0, position + 1).filter((l) => l.index === log.index && !!l.warmup === !!log.warmup).length;
  return `${log.warmup ? "Розминочний підхід" : "Робочий підхід"} ${number}`;
}
function previousWorkout(item, session) {
  const previous = previousResults(S.sessions, item, session.id);
  return `<details class="previous-workout" ${previous ? "open" : ""}><summary>Попередні результати${previous ? ` · ${esc(previous.session.date)}` : ""}</summary>${previous ? `<p class="small muted">${esc(previous.session.name)}</p>${previous.logs.map((l, k, logs) => `<p class="small">${setLogLabel(logs, k)}: ${l.reps} повторень · ${l.weight} кг${l.seconds ? ` · ${l.seconds} сек` : ""}</p>${metricSummary(l.metrics)}`).join("")}` : '<p class="small muted">Для цієї вправи ще немає виконаних підходів у завершених тренуваннях.</p>'}</details>`;
}
function progressView() {
  const analytics = progressSessions(S.sessions, S.manualSets);
  const items = new Map();
  analytics.filter((s) => s.status === "completed").forEach((s) => s.items.forEach((i, index) => {
    if (s.logs.some((l) => l.index === index)) items.set(exerciseKey(i), i.name);
  }));
  if (!items.has(S.progressExercise)) S.progressExercise = items.keys().next().value || "";
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - +S.progressPeriod);
  const points = progressSeries(S.progressMetric === 'frequency' ? S.sessions : analytics, { metric: S.progressMetric, key: S.progressExercise,
    since: S.progressPeriod === "all" ? "" : localDate(sinceDate) });
  const units = { weight: "кг", volume: "кг × повторення", frequency: "тренувань" };
  return `<section class="card progress-section"><h2>Прогрес ${privateProfileBadge()}</h2>
    ${manualSetsPanel(items)}
    <div class="formgrid"><label>Показник<select id="progress-metric">${[["weight", "Найбільша виконана вага"], ["volume", "Обсяг вправи"], ["frequency", "Тренування за місяць"]].map(([v, label]) => `<option value="${v}" ${S.progressMetric === v ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <label>Період<select id="progress-period">${[["30", "30 днів"], ["90", "90 днів"], ["365", "Рік"], ["all", "Увесь час"]].map(([v, label]) => `<option value="${v}" ${S.progressPeriod === v ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    ${S.progressMetric !== "frequency" ? `<label>Вправа<select id="progress-exercise">${items.size ? [...items].sort((a, b) => a[1].localeCompare(b[1], "uk")).map(([key, name]) => `<option value="${esc(key)}" ${S.progressExercise === key ? "selected" : ""}>${esc(name)}</option>`).join("") : '<option value="">Ще немає результатів</option>'}</select></label>` : ""}</div>
    <p class="small muted">${S.progressMetric === "volume" ? "Сума ваги × повторень у виконаних підходах за день." : S.progressMetric === "frequency" ? "Кількість завершених тренувань за місяць у вибраному періоді." : "Найбільша вага у виконаному підході за день."}</p>
    ${points.length ? progressChart(points, units[S.progressMetric]) : '<p class="muted">Немає результатів за вибраний період.</p>'}
  </section>`;
}
function manualSetsPanel(items = new Map()) {
  const known = new Map(items);
  for (const exercise of S.exercises) if (exercise?.name) known.set(exerciseKey(exercise), exercise.name);
  const options = [...new Set([...known.values()])].sort((a,b)=>a.localeCompare(b,'uk'));
  const recent = [...S.manualSets].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || Number(b.createdAt||0)-Number(a.createdAt||0)).slice(0,12);
  return `<div class="manual-sets"><div class="manual-set-entry"><div><span class="private-label">Бачиш тільки ти</span><h3>Записати підхід</h3><p class="small muted">Для підходу поза запущеним тренуванням.</p></div><form id="manual-set-form">
    <label>Вправа<input name="exercise" list="manual-exercises" maxlength="100" required autocomplete="off" placeholder="Наприклад, тяга" /></label><datalist id="manual-exercises">${options.map(name=>`<option value="${esc(name)}"></option>`).join('')}</datalist>
    <div class="formgrid"><label>Вага, кг<input name="weight" type="number" min="0" max="1000" step="0.25" inputmode="decimal" required /></label><label>Повторення<input name="reps" type="number" min="1" max="1000" step="1" inputmode="numeric" required /></label><label>Дата<input name="date" type="date" max="${localDate()}" value="${localDate()}" required /></label></div>
    <button class="btn" type="submit">Зберегти підхід</button><div class="form-error" role="alert"></div></form></div>
    <div class="manual-set-history"><div class="sectionhead"><div><h3>Останні підходи</h3><p class="small muted">Ручні записи враховуються у графіку та рекордах, але не в серії тренувань.</p></div></div>${S.manualSetsError?'<p class="error" role="alert">Не вдалося завантажити ручні підходи.</p>':''}${recent.length?recent.map(entry=>`<div class="manual-set-row"><div><strong>${esc(entry.exercise)}</strong><small>${esc(entry.date)}</small></div><span>${Number(entry.weight).toLocaleString('uk-UA')} кг × ${entry.reps}</span>${btn('Видалити','delete-manual-set',`data-id="${esc(entry.id)}" data-name="${esc(entry.exercise)}"`,'ghost')}</div>`).join(''):'<p class="muted">Тут з’являться підходи, які ти запишеш вручну.</p>'}</div></div>`;
}
function manualExerciseKey(name) {
  const normalized=String(name).trim().toLocaleLowerCase('uk');
  const sessionItem=S.sessions.flatMap(session=>session.items||[]).find(item=>String(item.name||'').trim().toLocaleLowerCase('uk')===normalized);
  if(sessionItem)return exerciseKey(sessionItem);
  const catalogItem=S.exercises.find(item=>String(item.name||'').trim().toLocaleLowerCase('uk')===normalized);
  return catalogItem?.id||exerciseKey({name});
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
    ${s.logs.map((l, k) => `<fieldset class="performance-entry"><legend>${esc(s.items[l.index].name)} · ${setLogLabel(s.logs, k)}</legend><div class="formgrid">${field("Повторення", `log-reps-${k}`, l.reps, "number", 'required min="0" max="1000"')}${field("Вага, кг", `log-weight-${k}`, l.weight, "number", 'required min="0" max="1000" step="0.5"')}${field("Час, сек", `log-seconds-${k}`, l.seconds || 0, "number", 'required min="0" max="7200"')}${(l.metrics || []).map((m, j) => field(`${m.name} ${m.unit}`, `log-metric-${k}-${j}`, m.value, "text", 'required maxlength="80"')).join("")}</div></fieldset>`).join("")}
    <div class="actions"><button type="submit" class="btn">Зберегти виправлення</button>${btn("Скасувати", "close", 'type="button"', "ghost")}</div><div class="form-error" role="alert"></div></form>`);
}
function restorePreview() {
  const { entries, skipped } = backupEntries(restoreDraft, S, S.user.uid);
  openModal(`<h2>Відновити резервну копію</h2><p>Програм: ${restoreDraft.programs.length}, тренувань: ${restoreDraft.sessions.length}, особистих вправ: ${restoreDraft.exercises.length}, записів замірів: ${restoreDraft.measurements?.length || 0}, ручних підходів: ${restoreDraft.manualSets?.length || 0}.</p><p>Буде додано записів: ${entries.length}. Пропущено наявних записів або активних тренувань: ${skipped.length}.</p><p class="muted">Поточні дані залишаються. Записи з однаковими ID пропускаються.</p><div class="actions">${btn("Відновити", "confirm-restore", entries.length ? "" : "disabled")}${btn("Скасувати", "close", "", "ghost")}</div>`);
}
function streakCard() {
  const streak = trainingStreak(S.sessions);
  return `<section class="streak-card" aria-label="Серія тренувань"><span class="streak-flame" aria-hidden="true">🔥</span><div><strong>${streak.current} тиж. поспіль</strong></div></section>`;
}
function recordsCard(records = personalRecords(progressSessions(S.sessions,S.manualSets))) {
  const own=S.route==='profile'&&S.people?.uid===S.user.uid;
  const enabled=profileVisibility(S.people?.person).records;
  const selected=new Set(recordSharingKeys(records,S.recordVisibility??null,enabled));
  const unavailable=S.people?.warnings?.includes('видимість рекордів');
  return `<section class="card personal-records" ${own?'id="personal-records"':''}><h2>🏆 Особисті рекорди ${privateProfileBadge('records')}</h2><p class="small muted">Найкраща робоча вага та повторення з нею у завершених тренуваннях.${own?' Обери, які рекорди показувати іншим. Вибір зберігається для вправи, навіть коли її рекорд оновиться.':''}</p>${own&&!enabled?'<p class="small muted">Зараз розділ приховано. «Показати іншим» увімкне показ вибраних рекордів.</p>':''}${unavailable?'<p class="small error" role="alert">Не вдалося завантажити видимість рекордів. Онови профіль, перш ніж змінювати її.</p>':''}${records.length?records.map(record=>{
    const shared=enabled&&selected.has(record.key);
    return `<div class="record-row" data-record-key="${esc(record.key)}"><div class="record-name"><strong>${esc(record.name)}</strong>${own?`<span class="${shared?'record-public-label':'private-label'}">${shared?'Показано іншим':'Бачиш тільки ти'}</span>`:''}</div><span class="record-result">${record.weight} кг × ${record.reps}<small>${esc(record.date)}</small></span>${own?btn(shared?'Сховати':'Показати іншим','toggle-record-visibility',`data-key="${esc(record.key)}" data-visible="${!shared}" aria-pressed="${shared}" ${unavailable?'disabled':''}`,shared?'ghost':'secondary'):''}</div>`;
  }).join(''):'<p class="muted">Збережи перше тренування з робочими підходами — тут з’являться твої рекорди.</p>'}</section>`;
}
const profileUid = () => {
  if (requestedProfileNumber()) return S.people?.uid || null;
  const uid = new URLSearchParams(location.search).get('uid');
  return uid && /^[A-Za-z0-9_-]{1,128}$/.test(uid) ? uid : S.user?.uid;
};
function personAvatar(person) {
  const photo = avatarSource(person?.photo);
  return photo ? `<img class="avatar" src="${esc(photo)}" alt="Аватар" loading="lazy" />` : `<span class="avatar">${esc(person?.name?.[0] || 'G')}</span>`;
}
async function loadPeople({ ensure = true, isCurrent, onIdentity } = {}) {
  let uid = profileUid();
  const userId = S.user.uid;
  isCurrent ||= () => S.user?.uid === userId;
  const warnings = [];
  const optional = async (section, load, fallback) => {
    try { return await load(); }
    catch (error) {
      console.warn(`Профіль · ${section}:`, error.code || error.message);
      warnings.push(section);
      return fallback;
    }
  };
  try {
    if (!navigator.onLine) throw Error('Профілі Gym Bro та коментарі доступні з інтернетом.');
    if (ensure) await optional('синхронізація профілю', () => db.ensurePublicProfile(S.profile), null);
    if (requestedProfileNumber()) {
      const number = await db.getLive(`userNumbers/${requestedProfileNumber()}`);
      if (!number) throw Error('Користувача з таким ID не знайдено.');
      uid = number.uid;
    }
    const person=await db.getLive(`publicProfiles/${uid}`);
    if (!isCurrent()) return;
    if (S.route === 'settings' && uid === userId) {
      S.selfPublic = person;
      S.people = { uid, person, profiles: {}, relations: [], comments: [], stats: {}, publicFriends: [], recent: [], tags: [], warnings: [], error: '' };
      return;
    }
    onIdentity?.({ uid, person });
    const recordVisibility = uid===userId ? await optional('видимість рекордів',()=>db.getLive(privatePath('recordSettings/visibility')),null) : null;
    const [relations,comments,labels,block]=await Promise.all([
      optional('Gym Bro',()=>db.gymBros(),[]),
      person?.restricted?Promise.resolve([]):optional('коментарі',()=>db.profileComments(uid),[]),
      optional('теги',()=>db.getLive(`userLabels/${uid}`),null),db.blockStatus(uid),
    ]);
    const publicFriends = person?.restricted?[]:uid === userId ? relations.filter((r)=>r.status === 'accepted')
      : profileVisibility(person).gymBros ? await optional('список друзів', () => db.publicGymBros(uid), []) : [];
    const publicPeers = publicFriends.map((r)=>r.from === uid ? r.to : r.from);
    const peers = [...new Set([...publicPeers, ...relations.map((r) => r.from === userId ? r.to : r.from), ...comments.map((c) => c.authorId)])];
    const profiles = Object.fromEntries(await Promise.all(peers.map(async (id) => [id, await optional('автори й друзі', () => db.publicIdentity(id), null)])));
    const stats = uid===userId?{...profileSnapshots(S.sessions,null,S.manualSets),lastActive:{at:S.profile?.lastActiveAt||Date.now()}}:{};
    if (uid !== userId && person && !person.restricted) await Promise.all(Object.entries(profileVisibility(person)).map(async ([key, visible]) => {
      if (visible && !['gymBros','activity','workouts'].includes(key)) try { stats[key] = await db.getLive(`publicProfiles/${uid}/stats/${key}`); }
      catch (error) { if (error.code !== 'permission-denied') throw error; }
    }));
    const visibility = profileVisibility(person);
    const recent = !person?.restricted && (uid === userId || visibility.activity) ? await optional('стрічка активності', () => db.recentActivity(uid), []) : [];
    const workouts = !person?.restricted && (uid === userId || (visibility.activity && visibility.workouts)) ? await optional('активність тренувань', () => db.recentActivity(uid, true), []) : [];
    if (!isCurrent()) return;
    if (uid === userId) S.recordVisibility = recordVisibility;
    S.people = { recent: [...recent, ...workouts].sort((a,b) => activityMillis(b.createdAt)-activityMillis(a.createdAt)).slice(0,30), uid, person, relations, comments: comments.filter((c)=>!S.blocked.some((b)=>b.id === c.authorId)), profiles, stats, publicFriends, block, tags: labels?.tags || [], warnings: [...new Set(warnings)], error: '' };
    if (uid === userId) S.selfPublic = person;
  } catch (error) {
    console.warn('Не вдалося відкрити профіль:', { uid, code: error.code, message: error.message });
    if (isCurrent()) S.people = { uid, error: err(error) };
  }
}
function friendButtons(uid) {
  if (S.people?.warnings?.includes('Gym Bro')) return '<span class="small muted">Статус дружби тимчасово недоступний</span>';
  if (uid === S.people?.uid && S.people.block?.iBlocked) return btn('Розблокувати','unblock-person',`data-id="${esc(uid)}"`,'secondary');
  if (uid === S.people?.uid && S.people.block?.blockedMe) return '<span class="small muted">Взаємодія недоступна</span>';
  const relation = S.people?.relations?.find((r) => r.members.includes(uid));
  if (!relation) return btn('＋ Додати в Gym Bro', 'friend-request', `data-id="${esc(uid)}"`);
  if (relation.status === 'accepted') return '';
  if (relation.to === S.user.uid) return `${btn('Прийняти Gym Bro', 'friend-accept', `data-id="${esc(relation.id)}"`)}${btn('Відхилити', 'friend-remove', `data-id="${esc(relation.id)}"`, 'ghost')}`;
  return `<span class="small muted">Заявку надіслано</span>${btn('Скасувати заявку', 'friend-remove', `data-id="${esc(relation.id)}"`, 'ghost')}`;
}
function commentMarkup(comment, reply = false) {
  if (comment.deleted) return '<p class="small muted">Коментар видалено</p>';
  const person = S.people.profiles[comment.authorId] || { name: comment.authorName };
  const canDelete = S.people.uid === S.user.uid || owner() || comment.authorId === S.user.uid;
  const canInteract = !S.people.block?.iBlocked && !S.people.block?.blockedMe && !S.blocked.some((b)=>b.id === comment.authorId);
  return `<article class="comment-card ${reply ? 'is-reply' : ''}" id="comment-${esc(comment.id)}"><button class="comment-avatar" data-action="view-person" data-id="${esc(comment.authorId)}" aria-label="Відкрити профіль ${esc(person.name)}">${personAvatar(person)}</button><div class="comment-body"><div class="comment-meta"><button class="person-link" data-action="view-person" data-id="${esc(comment.authorId)}">${esc(person.name || comment.authorName)}</button><time>${displayDate(comment.createdAt)}</time></div>${renderComment(comment)}${comment.photo && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(comment.photo) ? `<img class="comment-photo" src="${esc(comment.photo)}" alt="Фото до коментаря" loading="lazy" />` : ''}<div class="comment-actions">${canInteract ? `${reactionButtons(`publicProfiles/${S.people.uid}/comments/${comment.id}`, comment.reactions)}${btn('Відповісти', 'reply-profile-comment', `data-id="${esc(comment.id)}"`, 'ghost')}` : ''}${canDelete ? btn('Видалити', 'delete-profile-comment', `data-id="${esc(comment.id)}"`, 'ghost') : ''}${comment.authorId !== S.user.uid ? btn('Поскаржитися','report-comment',`data-id="${esc(comment.id)}"`,'ghost') : ''}</div></div></article>`;
}
const likeOutline='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M8 10 12 3c2 0 3 1 2 5h5a2 2 0 0 1 2 2l-2 9a2 2 0 0 1-2 2H8M3 10h5v11H3z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function reactionButtons(path,summary={}) {
  const entries=summary.entries||[],total=Object.values(summary.counts||{}).reduce((sum,n)=>sum+n,0);
  const kinds=Object.keys(summary.counts||{}).filter(key=>summary.counts[key]).sort((a,b)=>summary.counts[b]-summary.counts[a]).slice(0,4);
  const names=entries.slice(0,2).map(entry=>entry.authorName||'Спортсмен').join(', ');
  return `<div class="reaction-control" data-reaction-path="${esc(path)}"><button type="button" class="reaction-like ${summary.mine?'is-selected':''}" data-action="quick-react" data-path="${esc(path)}" data-current="${esc(summary.mine||'')}" aria-label="${summary.mine?reactionLabels[summary.mine]:'Вподобайка'}" aria-pressed="${!!summary.mine}" aria-haspopup="dialog" aria-expanded="false" title="Натисни — вподобайка. Утримуй або натисни ↓ — вибір реакції.">${summary.mine?`<span aria-hidden="true">${reactions[summary.mine]}</span>`:likeOutline}<span>${summary.mine?reactionLabels[summary.mine]:'Вподобайка'}</span></button>${total?`<button type="button" class="reaction-summary" data-action="reaction-details" data-path="${esc(path)}" aria-label="Хто відреагував: ${total}"><span class="reaction-summary-icons" aria-hidden="true">${kinds.map(kind=>`<span>${reactions[kind]}</span>`).join('')}</span><span class="reaction-summary-names">${esc(names||'Переглянути реакції')}${total>2?` та ще ${total-2}`:''}</span><span class="reaction-summary-count">${total}</span></button>`:''}</div>`;
}
let reactionPopover=null,reactionTrigger=null;
function closeReactionPicker(focus=false) {
  const wasOpen=!!reactionPopover;
  reactionPopover?.remove();reactionPopover=null;
  reactionTrigger?.setAttribute('aria-expanded','false');
  if(focus&&reactionTrigger?.isConnected)reactionTrigger.focus();
  reactionTrigger=null;return wasOpen;
}
function openReactionPicker(button,focus=false) {
  closeReactionPicker();reactionTrigger=button;
  const popup=document.createElement('div');popup.className='reaction-popover';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Вибір реакції');
  popup.innerHTML=`<span class="reaction-popover-hint">Обери реакцію</span><div class="reaction-choices">${Object.entries(reactions).map(([kind,emoji])=>`<button type="button" data-action="react-comment" data-path="${esc(button.dataset.path)}" data-kind="${kind}" aria-label="${reactionLabels[kind]}" aria-pressed="${button.dataset.current===kind}" title="${reactionLabels[kind]}">${emoji}</button>`).join('')}</div>`;
  (button.closest('dialog')||document.body).append(popup);reactionPopover=popup;button.setAttribute('aria-expanded','true');
  const rect=button.getBoundingClientRect(),width=popup.getBoundingClientRect().width,height=popup.getBoundingClientRect().height;
  popup.style.left=`${Math.max(10,Math.min(innerWidth-width-10,rect.left))}px`;
  popup.style.top=`${rect.top-height-10>10?rect.top-height-10:Math.min(innerHeight-height-10,rect.bottom+10)}px`;
  if(focus)popup.querySelector('button').focus();
}
installReactionInteractions({openPicker:openReactionPicker,closePicker:closeReactionPicker});
async function applyCommentReaction(path,kind) {
  const restoreFocus=reactionPopover?.contains(document.activeElement);
  closeReactionPicker();await db.reactToComment(path,kind);
  const summary=await db.commentReactions(path);
  const comment=S.people?.comments?.find(c=>path===`publicProfiles/${S.people.uid}/comments/${c.id}`);
  if(comment)comment.reactions=summary;
  document.querySelectorAll('.reaction-control').forEach(control=>{if(control.dataset.reactionPath===path)control.outerHTML=reactionButtons(path,summary);});
  if(restoreFocus)[...document.querySelectorAll('.reaction-control')].find(control=>control.dataset.reactionPath===path)?.querySelector('.reaction-like')?.focus();
}
async function reactionDetails(path) {
  closeReactionPicker();document.querySelector('.reaction-details-dialog')?.remove();
  const dialog=document.createElement('dialog');dialog.className='reaction-details-dialog';
  dialog.setAttribute('aria-labelledby','reaction-details-title');
  dialog.innerHTML=`<div class="sectionhead"><h2 id="reaction-details-title">Реакції на коментар</h2><button type="button" class="btn ghost" data-action="close-reaction-details" aria-label="Закрити реакції">Закрити</button></div><div class="reaction-details-content" role="status">Завантажуємо реакції…</div>`;
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
  try {
    const summary=await db.commentReactions(path);if(!dialog.isConnected)return;
    dialog.querySelector('.reaction-details-content').innerHTML=(summary.entries||[]).map(entry=>`<article class="reaction-person"><button type="button" class="comment-avatar" data-action="view-person" data-id="${esc(entry.id)}" aria-label="Профіль ${esc(entry.authorName)}">${personAvatar({name:entry.authorName,photo:entry.authorPhoto})}</button><div><button type="button" class="person-link" data-action="view-person" data-id="${esc(entry.id)}">${esc(entry.authorName||'Спортсмен')}</button><time>${entry.createdAt?displayDate(entry.createdAt):'Час недоступний'}</time></div><span class="reaction-person-kind" aria-label="${reactionLabels[entry.kind]}" title="${reactionLabels[entry.kind]}">${reactions[entry.kind]}</span></article>`).join('')||'<p class="muted">Реакцій ще немає.</p>';
  } catch(error){if(dialog.isConnected)dialog.querySelector('.reaction-details-content').textContent=err(error);}
}
function recentActivityPanel() {
  const own = S.people.uid === S.user.uid, visibility = profileVisibility(S.people.person);
  if (!own && !visibility.activity) return '';
  const entries=S.people.recent||[];
  return `<section class="card recent-activity"><h2>Остання активність ${privateProfileBadge("activity")}</h2>${activityEntries(entries.slice(0,5))}${entries.length>5?btn('Показати всі','show-all-activity','aria-haspopup="dialog"','secondary wide'):''}</section>`;
}
function activityEntries(entries) {
  const visibility=profileVisibility(S.people.person);
  const labels = { workout: 'Завершено тренування', comment: 'Залишено коментар', reply: 'Відповідь на коментар', rating: 'Поставлено оцінку', reaction: 'Реакція на коментар' };
  return entries.map(entry => {
    const parts = entry.target.split('/');
    const link = parts[0] === 'publicProfiles' ? btn('Переглянути','activity-profile',`data-id="${esc(parts[1])}" data-comment="${esc(parts[3] || '')}"`,'ghost') : ['exercises','programTemplates'].includes(parts[0]) ? btn('Переглянути',parts[0] === 'exercises' ? 'detail' : 'template-community',`data-id="${esc(parts[1])}"`,'ghost') : '';
    return `<article class="activity-entry"><div><strong>${esc(labels[entry.type] || 'Активність')}</strong>${entry.type==='workout'&&visibility.activity?privateProfileBadge('workouts'):''}${entry.detail ? `<span> · ${esc(reactions[entry.detail] || entry.detail)}</span>` : ''}<p class="small muted">${displayDate(entry.createdAt)}</p></div>${link}</article>`;
  }).join('') || '<p class="muted">Активності ще немає.</p>';
}
function showAllComments() {
  const view=S.people;if(!view?.person||view.person.restricted)return;
  const threads=commentThreads(view.comments).map(comment=>`<div class="comment-thread">${commentMarkup(comment)}${comment.replies.length?`<div class="comment-replies">${comment.replies.map(reply=>commentMarkup(reply,true)).join('')}</div>`:''}</div>`).join('').replaceAll('id="comment-','id="dialog-comment-');
  openModal(`<div class="sectionhead"><h2 id="all-comments-title">Усі коментарі <span class="badge">${view.comments.length}</span></h2>${btn('Закрити','close','','ghost')}</div><div class="profile-comment-list">${threads||'<p class="muted">Коментарів ще немає.</p>'}</div>`,'all-comments-title','all-comments-dialog');
}
function commentsPanel() {
  const view = S.people;
  if (!view?.person || view.error) return '';
  if (view.warnings?.includes('коментарі')) return `<section class="card profile-comments"><h2>Коментарі</h2><p role="alert">Не вдалося завантажити коментарі. Спробуй оновити сторінку.</p>${btn('Оновити', 'reload', '', 'secondary')}</section>`;
  const target = replyingTo && view.comments.find((c)=>c.id === replyingTo);
  return `<section class="card profile-comments"><div class="sectionhead"><h2>Коментарі</h2></div>${view.block?.iBlocked || view.block?.blockedMe ? '<p class="muted">Коментування недоступне.</p>' : `<form id="profile-comment-form">${personAvatar(S.selfPublic || S.profile)}<div class="comment-compose">${target ? `<div class="reply-target"><span>Відповідь для ${esc(target.authorName)}</span>${btn('Скасувати відповідь','cancel-comment-reply','type="button"','ghost')}</div>` : ''}${richComposer({photos:true,placeholder:target?'Написати відповідь…':'Написати коментар…'})}<button class="btn" type="submit">${target ? 'Надіслати відповідь' : 'Надіслати'}</button><div class="form-error" role="alert"></div></div></form>`}<div class="profile-comment-list">${view.comments.slice(0,8).map(comment=>commentMarkup(comment,!!comment.parentId)).join('') || '<p class="muted">Коментарів ще немає — будьте першим!</p>'}</div>${view.comments.length>8?btn('Показати всі коментарі','show-all-comments','aria-haspopup="dialog"','secondary wide'):''}</section>`;
}
function resumeReminder() {
  const session = S.loaded && ongoing();
  if (!session || ['session','home','editor'].includes(S.route)) return '';
  return `<section class="resume-reminder"><div><strong>Незавершене тренування: ${esc(session.name)}</strong><p class="small muted">${session.logs.length} записаних підходів · ${esc(session.date)}</p></div>${btn('Продовжити тренування','resume','','secondary')}</section>`;
}
function captureSetInputs() {
  const form = document.querySelector('#set-form'), session = ongoing();
  if (!form || !session || !S.user) return;
  try { saveSetDraft(localStorage, S.user.uid, session, Object.fromEntries(new FormData(form))); }
  catch { toast('Не вдалося зберегти введені значення на цьому пристрої.'); }
}
function restoreSetInputs() {
  const form = document.querySelector('#set-form'), session = ongoing();
  if (!form || !session) return;
  const fields = loadSetDraft(localStorage, S.user.uid, session);
  if (fields) for (const [key,value] of Object.entries(fields)) if (form.elements[key]) form.elements[key].value = value;
}
async function loadSafety(isCurrent = () => true) {
  const blocked = await db.blockedUsers();
  const profiles = Object.fromEntries(await Promise.all(blocked.map(async (b)=>[b.id, await db.publicIdentity(b.id)])));
  if (!isCurrent()) return;
  S.blocked = blocked;
  S.blockedProfiles = profiles;
}
function blockedPanel() {
  return `<section class="card"><h2>Заблоковані користувачі</h2><p class="small muted">Вони не можуть коментувати твій профіль, відповідати тобі чи надсилати заявки й запрошення. Блокування прибирає дружбу.</p>${S.blocked.map((b)=>`<div class="gym-bro-row">${personAvatar(S.blockedProfiles[b.id])}<strong class="grow">${esc(S.blockedProfiles[b.id]?.name || 'Спортсмен')}</strong>${btn('Розблокувати','unblock-person',`data-id="${esc(b.id)}"`,'secondary')}</div>`).join('') || '<p class="muted">Немає заблокованих користувачів.</p>'}</section>`;
}
function personActions(uid) {
  const blocked=S.blocked.some(b=>b.id===uid);
  const relation=S.people?.relations?.find(r=>r.status==='accepted'&&r.members.includes(uid));
  return `<details class="person-actions-menu"><summary aria-label="Дії з користувачем" title="Дії з користувачем">⋯</summary><div class="person-actions-list" role="group" aria-label="Дії з користувачем">${relation?btn('Прибрати з друзів','friend-remove',`data-id="${esc(relation.id)}"`,'ghost'):''}${blocked?btn('Розблокувати','unblock-person',`data-id="${esc(uid)}"`,'ghost'):btn('Заблокувати','block-person',`data-id="${esc(uid)}"`,'ghost')}${btn('Поскаржитися','report-person',`data-id="${esc(uid)}"`,'ghost')}</div></details>`;
}
function privateProfileBadge(key) {
  if(S.people?.uid!==S.user?.uid)return '';
  return !key||!profileVisibility(S.people.person)[key]?'<span class="private-label">Бачиш тільки ти</span>':'';
}
function reportDialog(targetId, commentId = '') {
  openModal(`<div class="sectionhead"><h2 id="report-title">Поскаржитися</h2>${btn('Закрити','close','','ghost')}</div><form id="report-form" data-target="${esc(targetId)}" data-comment="${esc(commentId)}" data-profile="${esc(S.people?.uid || targetId)}"><label>Причина<select name="reason">${Object.entries(reportReasons).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><label>Подробиці<textarea name="detail" rows="4" maxlength="1000" placeholder="Що сталося?"></textarea></label><p class="small muted">Скаргу бачить лише власник застосунку.</p><button type="submit" class="btn">Надіслати скаргу</button><div class="form-error" role="alert"></div></form>`,'report-title');
}
function reportsPanel() {
  return `<section class="card"><div class="sectionhead"><h2>Скарги користувачів</h2>${btn('Завантажити скарги','load-reports','','secondary')}</div><div id="admin-reports">${S.reports.map((r)=>`<article class="moderation-report"><div class="row wrap"><strong>${esc(S.reportProfiles[r.reporterId]?.name || r.reporterId)} → ${esc(S.reportProfiles[r.targetId]?.name || r.targetId)}</strong><span class="badge">${r.status === 'open' ? 'Нова' : r.status === 'reviewed' ? 'Розглянуто' : 'Відхилено'}</span></div><p class="small muted">${esc(reportReasons[r.reason])} · ${displayDate(r.createdAt)}</p>${r.commentText ? `<blockquote>${renderComment({text:r.commentText,richText:r.commentRichText})}</blockquote>` : ''}${r.detail ? `<p>${esc(r.detail)}</p>` : ''}<div class="actions">${btn('Профіль','view-person',`data-id="${esc(r.targetId)}"`,'ghost')}${r.commentId ? btn('Коментар','open-report-comment',`data-id="${esc(r.id)}"`,'ghost') : ''}${r.status === 'open' ? btn('Розглянуто','review-report',`data-id="${esc(r.id)}" data-status="reviewed"`,'secondary')+btn('Відхилити','review-report',`data-id="${esc(r.id)}" data-status="dismissed"`,'ghost') : ''}</div></article>`).join('') || '<p class="muted">Натисни «Завантажити скарги», щоб перевірити звернення.</p>'}</div></section>`;
}
function focusCommentComposer() {
  if(modal.classList.contains('all-comments-dialog'))modal.close();
  const draft=captureCommentDraft(document.querySelector('#profile-comment-form'));
  render();restoreCommentDraft(document.querySelector('#profile-comment-form'),draft,true);
  document.querySelector('#profile-comment-form')?.scrollIntoView({block:'center'});
}
function peoplePanel() {
  const view = S.people;
  if (!view) return '<section class="card"><p>Завантажуємо профіль…</p></section>';
  if (view.error) return `<section class="card"><h2>Профіль</h2><p class="error">${esc(view.error)}</p>${btn('Оновити','refresh-people','','secondary')}</section>`;
  if (!view.person) return '<section class="card"><p>Профіль ще не доступний.</p></section>';
  if (view.warnings?.some((name) => ['Gym Bro', 'список друзів'].includes(name))) return '<section class="card"><h2>Gym Bro</h2><p class="muted">Не вдалося завантажити список друзів.</p></section>';
  if (view.uid !== S.user.uid && !profileVisibility(view.person).gymBros) return '';
  const friends = view.publicFriends || [];
  return `<section class="card gym-bro-card"><button class="gym-bro-heading" data-action="open-gym-bros"><h2>Gym Bro <span>${friends.length}</span> ${privateProfileBadge("gymBros")}</h2><span aria-hidden="true">›</span></button><div class="gym-bro-strip">${friends.slice(0,4).map((r)=>{
    const uid = r.from === view.uid ? r.to : r.from, person = view.profiles[uid];
    return `<button class="gym-bro-tile" data-action="view-person" data-id="${esc(uid)}" aria-label="Профіль ${esc(person?.name || 'спортсмена')}">${personAvatar(person)}<span>${esc(person?.name || 'Спортсмен')}</span></button>`;
  }).join('') || '<p class="muted small">Ще немає Gym Bro</p>'}</div></section>`;
}
function gymBroDirectory() {
  const view = S.people, own = view.uid === S.user.uid;
  const pending = own ? view.relations.filter((r)=>r.status === 'pending') : [];
  const list = (relations, requests = false) => relations.map((r)=>{
    const uid = r.from === view.uid ? r.to : r.from, person = view.profiles[uid];
    return `<div class="gym-bro-row"><button class="comment-avatar" data-action="view-person" data-id="${esc(uid)}" aria-label="Профіль ${esc(person?.name || 'спортсмена')}">${personAvatar(person)}</button><div class="grow"><button class="person-link" data-action="view-person" data-id="${esc(uid)}">${esc(person?.name || 'Спортсмен')}</button>${requests ? `<p class="small muted">${r.to === S.user.uid ? 'Вхідна заявка' : 'Заявку надіслано'}</p>` : ''}</div>${own ? `<div class="actions">${friendButtons(uid)}${r.status === 'accepted' ? btn('Запросити на тренування','invite-workout',`data-id="${esc(uid)}"`,'secondary')+personActions(uid) : ''}</div>` : ''}</div>`;
  }).join('');
  openModal(`<div class="sectionhead"><h2 id="gym-bro-title">Gym Bro · ${view.publicFriends.length}</h2>${btn('Закрити','close','','ghost')}</div>${own ? `<form id="find-person-form"><label>Знайти за ID<input name="number" inputmode="numeric" pattern="[0-9]+" required maxlength="12" placeholder="ID користувача" /></label><button class="btn secondary" type="submit">Відкрити профіль</button><div class="form-error" role="alert"></div></form>` : ''}${pending.length ? `<h3 class="people-subtitle">Заявки</h3>${list(pending,true)}` : ''}<div class="gym-bro-directory">${list(view.publicFriends) || '<p class="muted">Ще немає Gym Bro</p>'}</div>${own && S.invites.length ? `<h3 class="people-subtitle">Спільні тренування</h3>${S.invites.map((invite)=>`<div class="gym-bro-row"><div class="grow"><strong>${esc(invite.program.name)}</strong><p class="small muted">${esc(invite.date)}${invite.time ? ` · ${esc(invite.time)}` : ''} · ${{pending:'Очікує відповіді',accepted:'Прийнято',declined:'Відхилено',cancelled:'Скасовано'}[invite.status]}</p></div>${btn('Переглянути','view-training-invite',`data-id="${esc(invite.id)}"`,'secondary')}</div>`).join('')}` : ''}`, 'gym-bro-title');
}
function contactLinks(person) {
  return `<div class="contact-links">${['instagram', 'telegram'].map((network) => {
    try {
      const url = contactURL(network, person?.contacts?.[network]);
      return url ? `<a class="contact-link ${network}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${network === 'instagram' ? 'Instagram' : 'Telegram'} <span>↗</span></a>` : '';
    } catch { return ''; }
  }).join('')}</div>`;
}
function contactsEditor() {
  if (!S.people?.person || S.people.error) return '';
  const contacts = S.people.person.contacts || {};
  return `<section class="card"><h2>Зв’язатися зі мною</h2><p class="muted small">Ці посилання бачитимуть інші користувачі у твоєму профілі. Поля необов’язкові.</p>${contactLinks(S.people.person)}
    <form id="contacts-form"><div class="formgrid"><label>Instagram<input name="instagram" maxlength="200" placeholder="@username або посилання" value="${esc(contacts.instagram || '')}" /></label><label>Telegram<input name="telegram" maxlength="200" placeholder="@username або посилання" value="${esc(contacts.telegram || '')}" /></label></div><p class="small muted">Очисть поле й збережи, щоб прибрати контакт.</p><button class="btn secondary" type="submit">Зберегти контакти</button><div class="form-error" role="alert"></div></form></section>`;
}
function profileTagMarkup(tags) {
  return `<div class="profile-tags">${(tags || []).map((tag)=>{
    try { const value = tagData([tag])[0]; return `<span class="user-tag" data-effect="${value.effect}" data-shadow="${value.shadow}" style="${tagStyle(value)}">${esc(value.text)}</span>`; } catch { return ''; }
  }).join('')}</div>`;
}
function profileHero(person, own) {
  const banner = bannerSource(person.banner);
  const lastActive=S.people?.stats?.lastActive?.at;
  const streak = own ? trainingStreak(S.sessions).current : visibleProfileStreak(S.people?.stats?.streak);
  return `<section class="profile-hero"><div class="profile-cover">${banner ? `<img class="profile-banner" src="${esc(banner)}" alt="Банер профілю" />` : ''}</div><div class="profile-identity"><div class="profile-portrait">${personAvatar(person)}</div><div class="profile-title">${profileTagMarkup(S.people?.tags)}<div class="profile-identity-meta"><span class="profile-location">${person.location ? `${esc(person.location)} · ` : ''}#${esc(person.customId || '…')}</span>${streak !== null ? `<span class="profile-streak" aria-label="Серія тренувань">🔥 ${streak} тиж. поспіль ${privateProfileBadge("streak")}</span>` : ''}${lastActive ? `<span class="profile-last-active"><i class="activity-dot"></i><span>Був(-ла) у мережі <time>${displayDate(lastActive)}</time></span>${privateProfileBadge('lastActive')}</span>` : ''}</div><h1>${esc(person.name || S.user.displayName)}</h1>${person.joinedAt||person.createdAt?`<p class="profile-membership"><span aria-hidden="true">◷</span> З нами ${memberDays(person.joinedAt||person.createdAt)} дн.</p>`:''}${person.isPrivate?'<span class="badge profile-closed-badge">Закритий профіль</span>':''}${person.bio ? `<div class="profile-bio">${renderComment({text:person.bio,richText:person.bioRich})}</div>` : ''}${contactLinks(person)}</div><div class="profile-identity-actions">${own ? btn('Копіювати посилання','copy-profile-link','','secondary') : friendButtons(S.people.uid)+personActions(S.people.uid)}</div></div></section>`;
}
function visibleProfileStreak(streak) {
  if (!streak) return null;
  const day = streak.lastWorkoutDate;
  const weeksOld = day ? Math.floor((Date.parse(localDate()+'T00:00:00Z') - Date.parse(day+'T00:00:00Z') + ((new Date(day+'T00:00:00Z').getUTCDay()+6)%7)*86400000) / (7*86400000)) : 99;
  return weeksOld <= 1 ? streak.current : 0;
}
function sharedStats() {
  const stats=S.people?.stats||{};
  return `${stats.progress?`<section class="card profile-progress-summary"><h2>Прогрес спортсмена ${privateProfileBadge('progress')}</h2><div class="profile-metrics"><div><strong>${stats.progress.workouts}</strong><span>Тренувань</span></div><div><strong>${stats.progress.sets}</strong><span>Підходів</span></div><div><strong>${Math.round(stats.progress.volume)}</strong><span>кг загалом</span></div></div></section>`:''}${S.people.uid!==S.user.uid&&stats.records?recordsCard(stats.records.items||[]):''}`;
}
function profile() {
  if (S.communityLoading && !S.people?.person) return heading('Профіль спортсмена') + '<section class="card" role="status">Завантажуємо профіль…</section>';
  if (S.people?.loading) return `<div ${profileAppearanceAttributes(S.people.person)}><section class="card">${personAvatar(S.people.person)}<h1>${esc(S.people.person.name || 'Спортсмен')}</h1><p role="status">Завантажуємо розділи профілю…</p></section></div>`;
  if(!S.people?.person||S.people.error)return heading('Профіль спортсмена')+peoplePanel();
  const own=S.people.uid===S.user.uid,person=S.people.person;
  if(person.restricted)return `<div class="athlete-profile">${profileHero(person,false)}<section class="card closed-profile"><h2>Цей профіль закрито</h2><p class="muted">Інформацію профілю та коментарі бачать лише друзі. Надішли заявку, щоб отримати доступ.</p></section></div>`;
  const showFriends=own||profileVisibility(person).gymBros;
  const activity=recentActivityPanel(),showSidebar=showFriends||!!activity;
return `<div ${profileAppearanceAttributes(person)}>${profileHero(person,own)}${S.people.warnings?.length?`<section class="card" role="alert"><p>Не вдалося завантажити: ${esc(S.people.warnings.join(', '))}. Решта профілю доступна.</p>${btn('Оновити','reload','','secondary')}</section>`:''}<div class="profile-columns ${showSidebar?'':'no-sidebar'}"><div class="profile-feed">${sharedStats()}${commentsPanel()}${own?`<div id="measurements-view">${measurementsPanel()}</div>${recordsCard()}<div id="progress-view">${progressView()}</div><section class="card"><h2>Історія тренувань ${privateProfileBadge()}</h2>${historyTools()}<div id="history-results">${filteredHistory()}</div></section>`:''}</div>${showSidebar?`<aside class="profile-sidebar">${showFriends?peoplePanel():''}${activity}</aside>`:''}</div></div>`;
}
function profileAppearanceAttributes(person) {
  if(!person?.appearance)return 'class="athlete-profile"';
  try{const a=profileAppearance(person.appearance);return `class="athlete-profile profile-custom" data-background="${a.mode}" style="${appearanceStyle(a)}"`;}catch{return 'class="athlete-profile"';}
}
function settings() {
  if (S.communityLoading) return heading('Налаштування') + '<section class="card" role="status">Завантажуємо налаштування профілю…</section>';
  if (!S.selfPublic || S.people?.error) return heading('Налаштування') + `<section class="card"><p class="error">${esc(S.people?.error || 'Не вдалося завантажити налаштування профілю.')}</p>${btn('Спробувати знову','reload')}</section>`;
  const person = S.selfPublic || {}, visibility = profileVisibility(person);
  return heading('Налаштування', 'Профіль, приватність і твій застосунок.', btn('До профілю', 'route', 'data-id="profile"', 'secondary')) + `<div class="settings-layout"><nav class="settings-sections" aria-label="Розділи налаштувань">${[['user','Користувач'],['privacy','Конфіденційність'],['security','Безпека']].map(([key,label])=>btn(label,'settings-section',`data-section="${key}" aria-pressed="${S.settingsSection === key}"`,'ghost')).join('')}</nav><div data-settings-section="user" ${S.settingsSection === 'user' ? '' : 'hidden'}><section class="card"><div class="sectionhead"><h2>Твій профіль</h2>${personAvatar(person)}</div><form id="location-form"><label>Місцеположення<input name="location" value="${esc(person.location || '')}" maxlength="100" placeholder="" /></label><p class="small muted">Відображається у профілі. Залиш порожнім, щоб не вказувати.</p><button class="btn secondary" type="submit">Зберегти місцеположення</button><div class="form-error" role="alert"></div></form><form id="bio-form"><h3>Про себе</h3>${richComposer({name:'bio',maxLength:400,htmlLimit:8000,draft:{text:person.bio||'',html:person.bioRich||''},placeholder:'Кілька слів про тебе й твою мету'})}<button class="btn secondary" type="submit">Зберегти опис</button><div class="form-error" role="alert"></div></form><form id="avatar-form"><label>Аватар<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required /></label><p class="small muted">JPG, PNG або WebP до 10 МБ. Прозорий фон PNG/WebP зберігається. Фото буде обрізано до квадрата.</p><button type="submit" class="btn secondary">Завантажити аватар</button><div class="form-error" role="alert"></div></form><form id="banner-form"><h3>Банер профілю</h3>${bannerSource(person.banner) ? `<img class="banner-preview" src="${esc(person.banner)}" alt="Твій банер" />` : ''}<label>Зображення банера<input name="banner" type="file" accept="image/jpeg,image/png,image/webp" required /></label><p class="small muted">JPG, PNG або WebP до 10 МБ. Прозорий фон PNG/WebP зберігається. Широкий формат 1200 × 320.</p><div class="actions"><button type="submit" class="btn secondary">Завантажити банер</button>${person.banner ? btn('Прибрати банер','remove-banner','type="button"','ghost') : ''}</div><div class="form-error" role="alert"></div></form></section>${contactsEditor()}${profileAppearanceEditor()}        <section class="card"><h2>Вигляд</h2><label>Тема<select id="theme-select">${options(["Світла", "Темна", "Системна"], themePreference)}</select></label></section>
        <section class="card"><h2>Сповіщення таймера</h2>${soundControls()}</section>
</div><div data-settings-section="privacy" ${S.settingsSection === 'privacy' ? '' : 'hidden'}><section class="card profile-privacy-control"><h2>Доступ до профілю</h2><form id="profile-privacy-form"><label class="visibility-row"><div><strong>Закритий профіль</strong><span>Лише друзі бачать інформацію, активність і коментарі. Ім’я, аватар та ID залишаються видимими.</span></div><input type="checkbox" name="isPrivate" ${person.isPrivate?'checked':''}/></label><button type="submit" class="btn">Зберегти доступ до профілю</button><div class="form-error" role="alert"></div></form></section><section class="card"><h2>Що бачать інші</h2><p class="muted small">Обирай, чим ділитися у профілі. Приховані дані доступні тобі в особистому просторі.</p><form id="visibility-form">${[['activity','Стрічка активності','Коментарі, відповіді, оцінки та реакції'],['workouts','Тренування в активності','Показувати завершені тренування у відкритій стрічці'],['lastActive','Був(-ла) у застосунку','Коли ти востаннє користувався застосунком'],['progress','Прогрес','Кількість тренувань, підходів і загальна вага'],['records','Особисті рекорди','Показувати розділ; окремі рекорди обираються у профілі'],['streak','Серія тренувань','Кількість тижнів поспіль'],['gymBros','Gym Bro','Показувати список твоїх друзів у профілі']].map(([key,title,description])=>`<label class="visibility-row"><div><strong>${title}</strong><span>${description}</span></div><input type="checkbox" name="${key}" ${visibility[key] ? 'checked' : ''} /></label>`).join('')}<button class="btn" type="submit">Зберегти видимість</button><div class="form-error" role="alert"></div></form></section>${blockedPanel()}
</div><div data-settings-section="security" ${S.settingsSection === 'security' ? '' : 'hidden'}><section class="card"><h2>Безпека акаунта</h2><p class="muted">${esc(S.user.email)}</p><dl class="user-facts"><div><dt>Останній вхід</dt><dd>${displayDate(S.profile?.lastLoginTime)}</dd></div></dl><p class="small muted">Для зміни пароля надішлемо лист на твою пошту.</p>${btn('Змінити пароль','account-password-reset','','secondary')}</section>        <section class="card"><h2>Експорт даних</h2><p class="muted small">JSON містить програми, тренування, особисті вправи, налаштування та приватні заміри тіла. CSV містить плани програм, заплановані тренування й виконані підходи.</p><div class="actions">${btn("Завантажити JSON", "export-json", "", "secondary")}${btn("Завантажити CSV", "export-csv", "", "secondary")}</div></section>
        <section class="card"><h2>Відновлення з JSON</h2><p class="muted small">Обери резервну копію, яку завантажив із профілю. Перед збереженням буде показано кількість записів.</p><form id="restore-form"><label>Резервна копія JSON<input type="file" id="restore-file" accept=".json,application/json" required /></label><button class="btn secondary" type="submit">Перевірити копію</button><div class="form-error" role="alert"></div></form></section>
<section class="card"><h2>Акаунт</h2><p class="muted">${esc(S.user.email)}</p>${btn('Вийти', 'logout', '', 'ghost')}</section></div></div>`;
}
function profileAppearanceEditor() {
  if(!owner()&&!S.customizationAccess)return '';
  let a;try{a=profileAppearance(S.selfPublic?.appearance||{});}catch{a={...appearanceDefaults};}
  return `<section class="card appearance-settings"><h2>Оформлення профілю</h2><form id="profile-appearance-form"><label>Фон<select name="mode">${[['solid','Статичний колір'],['gradient','Градієнт'],['dynamic','Динамічний градієнт'],['image','Зображення']].map(([key,title])=>`<option value="${key}" ${a.mode===key?'selected':''}>${title}</option>`).join('')}</select></label><div class="formgrid">${[['background','Колір фону'],['backgroundEnd','Другий колір'],['blocks','Колір блоків'],['text','Колір тексту']].map(([key,title])=>`<label>${title}<input type="color" name="${key}" value="${a[key]}"/></label>`).join('')}<label>Кут градієнта<input name="angle" type="number" min="0" max="360" step="1" value="${a.angle}" required/></label></div><label>Фонове зображення<input name="backgroundImage" type="file" accept="image/jpeg,image/png,image/webp"/></label><label class="photo-toggle"><input name="removeImage" type="checkbox"/> Прибрати збережене зображення</label><div class="appearance-preview profile-custom" data-appearance-preview data-background="${a.mode}" style="${appearanceStyle(a)}"><div class="card"><strong>Твій профіль</strong><p class="muted">Так виглядатимуть блоки та текст</p></div></div><p class="small muted">Зміни видно одразу в попередньому перегляді. Збережене оформлення бачать відвідувачі твого профілю.</p><div class="actions"><button type="submit" class="btn">Зберегти оформлення</button>${btn('Стандартний вигляд','reset-profile-appearance','type="button"','ghost')}</div><div class="form-error" role="alert"></div></form></section>`;
}
document.addEventListener('input',event=>{
  const form=event.target.closest('#profile-appearance-form');if(!form)return;
  try{const a=profileAppearance({...Object.fromEntries(new FormData(form)),angle:Number(form.elements.angle.value),image:form.elements.removeImage.checked?'':S.selfPublic?.appearance?.image||''});const preview=form.querySelector('[data-appearance-preview]');preview.style.cssText=appearanceStyle(a);preview.dataset.background=a.mode;}catch{}
});
function inviteWorkoutDialog(uid) {
  const programs = S.programs.filter((p)=>p.scope !== 'home' && !p.archived && p.days.some(hasWorkoutContent));
  if (!programs.length) { openModal(`<h2>Запрошення на тренування</h2><p>Спочатку створи основну програму з тренувальним днем.</p>${btn('До програм','route','data-id="program"','secondary')}`); return; }
  const person = S.people?.profiles?.[uid];
  openModal(`<div class="sectionhead"><h2 id="invite-title">Тренування з ${esc(person?.name || 'Gym Bro')}</h2>${btn('Закрити','close','','ghost')}</div><form id="training-invite-form" data-to="${esc(uid)}"><label>Програма<select name="program" id="invite-program">${programs.map((p)=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>День програми<select name="day" id="invite-day"></select></label><div class="formgrid"><label>Дата<input name="date" type="date" min="${localDate()}" value="${localDate()}" required /></label><label>Час · необов’язково<input name="time" type="time" /></label></div><label>Примітка<textarea name="note" rows="2" maxlength="300" placeholder="Де зустрічаємося?"></textarea></label><p class="small muted">Тренування з’явиться у твоєму календарі одразу, у Gym Bro — після прийняття.</p><button type="submit" class="btn">Надіслати запрошення</button><div class="form-error" role="alert"></div></form>`,'invite-title');
  updateInviteDays();
}
function updateInviteDays() {
  const form = modal.querySelector('#training-invite-form'); if (!form) return;
  const program = S.programs.find((p)=>p.id === form.elements.program.value);
  form.elements.day.innerHTML = (program?.days || []).filter(hasWorkoutContent).map((d)=>`<option value="${d.weekday}">${esc(d.name)}</option>`).join('');
}
async function openTrainingInvite(id) {
  const invite = await db.getLive(`trainingInvites/${id}`);
  if (!invite) throw Error('Запрошення недоступне.');
  const sender = await db.getLive(`publicProfiles/${invite.from}`);
  const status = { pending:'Очікує відповіді',accepted:'Прийнято',declined:'Відхилено',cancelled:'Скасовано' }[invite.status];
  const block = await db.blockStatus(invite.from === S.user.uid ? invite.to : invite.from);
  openModal(`<div class="sectionhead"><h2 id="training-invite-title">Запрошення на тренування</h2>${btn('Закрити','close','','ghost')}</div><p class="small muted">${esc(sender?.name || 'Gym Bro')} · ${status}</p><h3>${esc(invite.program.name)}</h3><p>${esc(invite.date)}${invite.time ? ` · ${esc(invite.time)}` : ''}</p>${invite.note ? `<div class="notice">${esc(invite.note)}</div>` : ''}${invite.program.days.map((d)=>`<section><h3>${esc(d.name)}</h3>${workoutDescription(d)}${exerciseRows(d.items)}</section>`).join('')}<div class="actions">${invite.status === 'pending' && invite.to === S.user.uid && !block.iBlocked && !block.blockedMe && invite.date >= localDate() ? btn('Прийняти й запланувати','respond-training-invite',`data-id="${esc(id)}" data-status="accepted"`) : ''}${invite.status === 'pending' && invite.to === S.user.uid ? btn('Відхилити','respond-training-invite',`data-id="${esc(id)}" data-status="declined"`,'ghost') : ''}${invite.status === 'pending' && invite.from === S.user.uid ? btn('Скасувати запрошення','respond-training-invite',`data-id="${esc(id)}" data-status="cancelled"`,'ghost') : ''}${invite.status === 'accepted' || invite.from === S.user.uid ? btn('Відкрити календар','invite-calendar',`data-date="${esc(invite.date)}"`,'secondary') : ''}</div>${invite.date < localDate() && invite.status === 'pending' ? '<p class="muted">Дата запрошення вже минула.</p>' : ''}`,'training-invite-title');
}
function disposeImageEdit() { imageEdit?.bitmap.close(); imageEdit = null; }
async function openImageCropper(file, kind) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10000000) throw Error('Обери JPG, PNG або WebP до 10 МБ.');
  disposeImageEdit();
  const bitmap = await createImageBitmap(file).catch(()=>{ throw Error('Не вдалося прочитати зображення.'); });
  imageEdit = { file, bitmap, kind, crop: { x:0.5,y:0.5,zoom:1 } };
  openModal(`<div class="sectionhead"><h2 id="image-edit-title">${kind === 'avatar' ? 'Аватар' : 'Банер'} · попередній перегляд</h2>${btn('Закрити','close','','ghost')}</div><div class="image-crop-preview ${kind}"><canvas id="profile-image-canvas" aria-label="Область зображення, яка буде збережена"></canvas></div><p class="small muted">Перетягни зображення або скористайся повзунками. Прозорий фон зберігається.</p><div class="crop-controls"><label>Масштаб<input data-crop="zoom" type="range" min="1" max="3" step="0.01" value="1" /></label><label>По горизонталі<input data-crop="x" type="range" min="0" max="1" step="0.01" value="0.5" /></label><label>По вертикалі<input data-crop="y" type="range" min="0" max="1" step="0.01" value="0.5" /></label></div>${btn(kind === 'avatar' ? 'Зберегти аватар' : 'Зберегти банер','save-profile-image','','wide')}<div class="form-error" role="alert"></div>`,'image-edit-title','image-edit-dialog');
  const canvas = modal.querySelector('canvas');
  let drag;
  canvas.addEventListener('pointerdown',(event)=>{
    const rect = drawProfileCrop(canvas, bitmap, kind, imageEdit.crop);
    drag = { pointer:event.pointerId,x:event.clientX,y:event.clientY,crop:{...imageEdit.crop},rect };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',(event)=>{
    if (!drag || !imageEdit || drag.pointer !== event.pointerId) return;
    const bounds=canvas.getBoundingClientRect(), clamp=(v)=>Math.max(0,Math.min(1,v));
    const dx=bitmap.width-drag.rect.width, dy=bitmap.height-drag.rect.height;
    imageEdit.crop.x=dx > 0 ? clamp(drag.crop.x-(event.clientX-drag.x)/bounds.width*drag.rect.width/dx) : 0.5;
    imageEdit.crop.y=dy > 0 ? clamp(drag.crop.y-(event.clientY-drag.y)/bounds.height*drag.rect.height/dy) : 0.5;
    for (const key of ['x','y']) modal.querySelector(`[data-crop="${key}"]`).value=imageEdit.crop[key];
    updateImageCrop();
  });
  canvas.addEventListener('pointerup',()=>{drag=null;}); canvas.addEventListener('pointercancel',()=>{drag=null;});
  updateImageCrop();
}
function updateImageCrop() {
  if (!imageEdit) return;
  const canvas=modal.querySelector('#profile-image-canvas'); if (!canvas) return;
  drawProfileCrop(canvas,imageEdit.bitmap,imageEdit.kind,imageEdit.crop);
}
async function openPerson(uid, commentId = '') {
  const person = uid === S.user.uid ? S.selfPublic || S.profile : S.people?.profiles?.[uid] || await db.publicIdentity(uid);
  if (!person?.customId) throw Error('Профіль ще не доступний.');
  location.assign(profileURL(person.customId) + (commentId ? `#comment-${encodeURIComponent(commentId)}` : ''));
}
function updateNoticeBadge() {
  const badge = document.querySelector('#notice-count');
  const count = S.notices.filter((n) => !n.read).length;
  if (badge) { badge.hidden = count === 0; badge.textContent = count > 99 ? '99+' : count; }
  document.querySelector('.notice-bell')?.setAttribute('aria-label', count ? `Сповіщення: ${count} непрочитаних` : 'Сповіщення');
}
function noticeInbox() {
  const labels = { comment: 'залишив(-ла) коментар у твоєму профілі', reply: 'відповів(-ла) на твій коментар', friend_request: 'хоче стати твоїм Gym Bro', friend_accepted: 'прийняв(-ла) твою заявку Gym Bro', training_invite:'запрошує на спільне тренування',training_accepted:'прийняв(-ла) запрошення на тренування' };
  openModal(`<div class="sectionhead"><h2 id="notice-title">СПОВІЩЕННЯ</h2>${btn('Закрити', 'close', '', 'ghost')}</div>${S.notices.some((n)=>!n.read) ? btn('Позначити всі прочитаними', 'read-all-notices', '', 'secondary') : ''}${S.noticeError ? `<p class="error">${esc(S.noticeError)}</p>` : ''}<div class="notice-list">${S.notices.map((n)=>`<button class="notice-item ${n.read ? '' : 'unread'}" data-action="open-notice" data-id="${esc(n.id)}">${personAvatar(n.actor)}<span class="grow"><strong>${esc(n.actor?.name || 'Спортсмен')}</strong><span>${labels[n.type] || 'Нове сповіщення'}</span><time>${displayDate(n.createdAt)}</time></span>${n.read ? '' : '<i aria-label="Непрочитане"></i>'}</button>`).join('') || '<p class="notice-empty muted">Скринька пуста.</p>'}</div>`, 'notice-title', 'notifications-dialog');
}
function startNoticeWatch() {
  const uid = S.user.uid;
  let revision = 0;
  stopNotices?.();
  stopNotices = db.watchNotifications(async (notices) => {
    const currentRevision = ++revision;
    const actors = Object.fromEntries(await Promise.all([...new Set(notices.map((n)=>n.actorId))].map(async (id)=>[id, await db.publicIdentity(id).catch(()=>null)])));
    if (S.user?.uid !== uid || currentRevision !== revision) return;
    S.notices = notices.filter((n)=>!S.blocked.some((b)=>b.id === n.actorId)).map((n)=>({ ...n, actor: actors[n.actorId] })); S.noticeError = '';
    updateNoticeBadge();
    if (modal.open && modal.classList.contains('notifications-dialog')) noticeInbox();
  }, (error) => { if (S.user?.uid === uid) { S.noticeError = err(error); updateNoticeBadge(); } });
}
function summaryScreen(session) {
  const stats=workoutSummary(session,S.sessions);
  return `<div class="workout-summary">${heading('Тренування завершено',`${esc(session.name)} · ${esc(session.date)}`)}<section class="card summary-hero"><span class="summary-check" aria-hidden="true">✓</span><h2>${session.endedEarly ? 'Збережено все, що ти виконав' : 'Ще одне тренування позаду'}</h2>${session.endedEarly ? '<span class="badge">Завершено достроково</span>' : ''}<div class="summary-metrics">${[[stats.minutes,'Хвилин'],[stats.sets,'Робочих підходів'],[Math.round(stats.volume*100)/100,'кг × повторення'],[stats.exercises,'Вправ виконано']].map(([value,label])=>`<div><strong>${Number(value).toLocaleString('uk-UA')}</strong><span>${label}</span></div>`).join('')}</div><p class="small muted">${stats.reps} повторень · ${stats.warmupSets} розминочних підходів${stats.plannedSets ? ` · ${stats.sets} із ${stats.plannedSets} запланованих робочих підходів` : ''}</p></section><section class="card"><h2>🏆 Нові рекорди</h2>${stats.records.length ? stats.records.map((r)=>`<div class="record-row"><div><strong>${esc(r.name)}</strong><p class="small muted">${r.first ? 'Перший результат для цієї вправи' : 'Перевершено попередній результат'}</p></div><span>${r.weight} кг × ${r.reps}</span></div>`).join('') : '<p class="muted">Цього разу без нових рекордів. Кожне тренування додає досвіду.</p>'}</section>${session.description || session.warmup ? `<section class="card"><h2>План тренування</h2>${workoutDescription(session)}</section>` : ''}<div class="actions">${btn('На головну','route','data-id="home"')}${btn('Історія та прогрес','route','data-id="profile"','secondary')}${btn('Деталі тренування','history',`data-id="${esc(session.id)}"`,'ghost')}</div></div>`;
}
function editMeasurement(id = '') {
  const record=S.measurements.find((m)=>m.id===id);
  openModal(`<div class="sectionhead"><h2 id="measurement-title">${record ? 'Редагувати заміри' : 'Додати заміри'}</h2>${btn('Закрити','close','','ghost')}</div><p class="small muted">Ці дані доступні лише тобі. Заповнюй тільки потрібні поля.</p><form id="measurement-form"><label>Дата<input id="measurement-date" name="date" type="date" required min="1900-01-01" max="${localDate()}" value="${record?.date || localDate()}" ${record ? 'readonly' : ''} /></label><div class="formgrid">${Object.entries(measurementFields).map(([key,config])=>field(`${config.label}, ${config.unit}`,key,record?.[key]??'','number',`min="${config.min}" max="${config.max}" step="0.01"`)).join('')}</div><label>Примітка<textarea name="note" maxlength="500" rows="2">${esc(record?.note || '')}</textarea></label><p class="small muted">Один запис на дату. Збереження на ту саму дату оновить його.</p><button class="btn" type="submit">Зберегти заміри</button><div class="form-error" role="alert"></div></form>`,'measurement-title');
}
function measurementsPanel() {
  const records=[...S.measurements].sort((a,b)=>b.date.localeCompare(a.date));
  const config=measurementFields[S.measurementMetric] || measurementFields.weight;
  const start=new Date();start.setDate(start.getDate()-Number(S.measurementPeriod));
  const points=measurementSeries(records,S.measurementMetric,S.measurementPeriod==='all'?'':localDate(start));
  const first=points[0],last=points.at(-1),delta=last&&first?Math.round((last.value-first.value)*100)/100:0;
  return `<section class="card body-measurements"><div class="sectionhead"><div><span class="private-label">Бачиш тільки ти</span><h2>Заміри тіла</h2></div>${btn('Додати заміри','new-measurement','','secondary')}</div><p class="small muted">Вага тіла й обхвати. Ці записи не публікуються в профілі та недоступні іншим користувачам.</p>${S.measurementsError ? '<p class="error">Не вдалося завантажити заміри. Спробуй оновити сторінку.</p>' : ''}<div class="formgrid"><label>Показник<select id="measurement-metric">${Object.entries(measurementFields).map(([key,value])=>`<option value="${key}" ${S.measurementMetric===key?'selected':''}>${value.label}, ${value.unit}</option>`).join('')}</select></label><label>Період<select id="measurement-period">${[['30','30 днів'],['90','90 днів'],['365','Рік'],['all','Увесь час']].map(([key,label])=>`<option value="${key}" ${S.measurementPeriod===key?'selected':''}>${label}</option>`).join('')}</select></label></div>${points.length ? `<div class="measurement-overview"><strong>${last.value} ${config.unit}</strong><span class="small muted">${last.date}${points.length>1?` · Зміна за період: ${delta>0?'+':''}${delta} ${config.unit}`:''}</span></div>${measurementChart(points,config.unit)}` : '<p class="muted">Додай заміри, щоб побачити історію змін.</p>'}${records.length ? `<details class="measurement-history"><summary>Історія замірів · ${records.length}</summary><div class="measurement-table"><table><thead><tr><th>Дата</th>${Object.values(measurementFields).map((f)=>`<th>${f.label}, ${f.unit}</th>`).join('')}<th>Примітка</th><th>Дії</th></tr></thead><tbody>${records.map((record)=>`<tr><td>${record.date}</td>${Object.keys(measurementFields).map((key)=>`<td>${record[key]??'—'}</td>`).join('')}<td class="measurement-note">${esc(record.note)}</td><td><div class="actions">${btn('Змінити','edit-measurement',`data-id="${esc(record.id)}"`,'ghost')}${btn('Видалити','delete-measurement',`data-id="${esc(record.id)}"`,'ghost')}</div></td></tr>`).join('')}</tbody></table></div></details>` : ''}</section>`;
}
function measurementChart(points,unit) {
  const values=points.map((p)=>p.value),low=Math.min(...values),high=Math.max(...values),pad=Math.max((high-low)*0.15,0.5),min=low-pad,max=high+pad;
  const x=(index)=>points.length===1?330:60+index*540/(points.length-1),y=(value)=>190-(value-min)/(max-min)*150;
  return `<svg class="progress-chart" viewBox="0 0 660 240" role="img" aria-label="Графік замірів, ${unit}">${[0,0.5,1].map((fraction)=>{const value=min+(max-min)*fraction;return `<line class="chart-grid" x1="60" x2="600" y1="${y(value)}" y2="${y(value)}"/><text x="52" y="${y(value)+4}" text-anchor="end">${Math.round(value*10)/10}</text>`;}).join('')}<polyline class="chart-line" points="${points.map((p,index)=>`${x(index)},${y(p.value)}`).join(' ')}"/>${points.map((p,index)=>`<circle class="chart-point" cx="${x(index)}" cy="${y(p.value)}" r="4"><title>${p.date}: ${p.value} ${unit}</title></circle>`).join('')}<text x="60" y="220">${points[0].date}</text>${points.length>1?`<text x="600" y="220" text-anchor="end">${lastDate(points)}</text>`:''}</svg>`;
}
function lastDate(points) { return points.at(-1).date; }
function sessionView() {
  const summary = S.sessions.find((session)=>session.id === S.summaryId && session.status === 'completed');
  if (summary) return summaryScreen(summary);
  const s = ongoing();
  if (!s)
    return heading(
      "Тренування завершено",
      "Результат уже в історії.",
      btn("На головну", "route", 'data-id="home"'),
    );
  if (s.warmup?.trim() && !s.warmupDone) return `<div class="session">${heading(s.name, 'Перед тренуванням', btn('Згорнути', 'route', 'data-id="home"', 'ghost'))}<section class="card warmup-card"><span class="eyebrow">Розминка</span><h2>Підготуйся до тренування</h2><p class="workout-description">${esc(s.warmup)}</p><div class="actions">${btn('✓ Розминку виконано', 'warmup-done')}${btn('Пропустити розминку', 'warmup-skip', '', 'ghost')}</div></section></div>`;
  if (!s.items.length) return `<div class="session">${heading(s.name, "Тренування словами", btn("Згорнути", "route", 'data-id="home"', "ghost"))}<section class="card">${workoutDescription(s)}<p class="small muted">Після виконання збережи тренування в історію.</p>${btn("✓ Завершити тренування", "finish-text", "", "wide")}</section></div>`;
  const i = s.items[s.index],
    count = workingSetCount(s),
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
          ${i.sets} робочих підходів ·
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
        ${s.logs.some((l) => l.index === s.index) ? `<div class="notice"><strong>Виконані підходи</strong>${s.logs.map((l, k) => l.index === s.index ? `<p class="small">${setLogLabel(s.logs, k)}: ${l.reps} повторень · ${l.weight} кг</p>` : "").join("")}</div>` : ""}
        ${previousWorkout(i, s)}
        ${(() => { const record = personalRecords(S.sessions).find((r) => r.key === exerciseKey(i)); return record ? `<p class="record-badge">🏆 Твій рекорд: ${record.weight} кг × ${record.reps}</p>` : ''; })()}
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
        <p class="small muted">Робочий підхід ${Math.min(count + 1, i.sets)} · відпочинок ${plan.rest} сек</p>
        <p class="small muted">Розминочних виконано: ${s.logs.filter((l) => l.index === s.index && l.warmup).length}. Вони записуються додатково до робочих.</p>
        <form id="set-form" style="margin-top:22px">
          ${count < i.sets && previousWorkingSet(S.sessions, i, s.id, count) ? btn('↶ Як минулого разу', 'use-previous-set', 'type="button"', 'secondary') : ''}
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
          <button class="btn secondary wide" type="submit" data-warmup="1" ${s.logs.filter((l) => l.index === s.index && l.warmup).length >= 20 ? "disabled" : ""}>＋ Записати розминочний підхід</button>
          <p class="small muted">Для розминки введи її повторення та вагу у полях вище.</p>
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
        ${btn('Завершити достроково', 'finish-early', '', 'ghost')}
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
  const date = new Date(activityMillis(value) || NaN);
  return Number.isNaN(date.getTime()) ? "Немає даних" : date.toLocaleString("uk-UA");
}
function homeAccessControl(id) {
  return `<div class="admin-access-controls">${[['homeWorkouts','Домашні комплекси','toggle-home-access'],['nutrition','Харчування','toggle-nutrition-access'],['profileCustomization','Розширена кастомізація профілю','toggle-customization-access']].map(([key,title,action]) => {
    const enabled = S.adminAccess[id]?.[key] === true;
    return `<div class="admin-access-control"><div><strong>${title}</strong><p class="small muted">${enabled ? 'Доступ надано' : 'Доступ вимкнено'}</p></div>${btn(enabled ? 'Вимкнути доступ' : 'Надати доступ', action, `data-id="${esc(id)}" aria-pressed="${enabled}"`, enabled ? 'secondary' : '')}</div>`;
  }).join('')}</div>`;
}
function adminUsersList(query = "") {
  const search = query.trim().toLocaleLowerCase("uk");
  const list = S.adminUsers.filter((u) => `${u.name || ""} ${u.email || ""} ${u.customId || ""} ${u.id}`.toLocaleLowerCase("uk").includes(search));
  return `<p class="small muted">Знайдено: ${list.length}</p><div class="admin-member-list">` + list.map((u) => `<article class="admin-member-card">
    ${personAvatar(u)}<div class="grow"><h3>${esc(u.name || 'Без імені')} <span class="badge">#${esc(u.customId || '—')}</span></h3><p class="small muted">${esc(u.email || 'Email не вказано')}</p><span class="small muted">Активність: ${displayDate(u.lastActiveAt)}</span></div>
    <div class="admin-member-actions"><span class="access-pill ${S.adminAccess[u.id]?.homeWorkouts ? 'enabled' : ''}">${S.adminAccess[u.id]?.homeWorkouts ? 'Домашні · увімкнено' : 'Домашні · вимкнено'}</span><span class="access-pill ${S.adminAccess[u.id]?.nutrition ? 'enabled' : ''}">Харчування · ${S.adminAccess[u.id]?.nutrition ? 'увімкнено' : 'вимкнено'}</span>${btn('Керувати', 'admin-user', `data-id="${esc(u.id)}"`, 'secondary')}</div></article>`).join('') + '</div>';
}
function adminItemDetails(item) {
  return `<div class="admin-plan-item"><h4>${esc(item.name)}</h4>
    <p>${item.sets} підходів · ${esc(item.reps)} повторень · ${item.weight || 0} кг${item.seconds ? ` · ${item.seconds} сек` : ""} · відпочинок ${item.rest || 0} сек</p>
    ${item.setPlans ? item.setPlans.map((s, k) => `<p class="small">Підхід ${k + 1}: ${esc(s.reps)} повторень · ${s.weight} кг · ${s.seconds} сек · відпочинок ${s.rest} сек</p>`).join("") : ""}
    ${item.note ? `<p class="small">${esc(item.note)}</p>` : ""}${metricSummary(item.metrics)}</div>`;
}
function adminTagForm(uid, tag = { text: '', color: '#fff59d', textColor: '#1d1d1f' }, index = -1) {
  const t=tagData([{...tag,text:tag.text||'Новий тег'}])[0];
  const select=(name,label,choices,value)=>`<label>${label}<select name="${name}">${choices.map(([key,title])=>`<option value="${key}" ${String(value)===key?'selected':''}>${title}</option>`).join('')}</select></label>`;
  return `<form class="admin-tag-form" data-user="${esc(uid)}" data-index="${index}">${select('template','Готовий шаблон',[['','Власне оформлення'],...Object.entries(tagTemplates).map(([key,value])=>[key,value.label])],'')}<div class="admin-tag-fields"><label>Текст<input name="text" value="${esc(tag.text)}" required maxlength="40" placeholder="Активний гравець" /></label><label>Фон<input type="color" name="color" value="${t.color}" /></label><label>Текст<input type="color" name="textColor" value="${t.textColor}" /></label></div><div class="formgrid"><label class="photo-toggle"><input type="checkbox" name="gradient" ${t.gradient?'checked':''}/> Градієнтний фон</label><label>Другий колір<input type="color" name="colorEnd" value="${t.colorEnd}" /></label><label>Кут градієнта<input type="number" name="angle" min="0" max="360" step="1" value="${t.angle}" /></label>${select('effect','Анімація',[['none','Без анімації'],['shine','Періодичний блиск'],['flow','Рух градієнта'],['pulse','М’яка пульсація']],t.effect)}${select('shadow','Тінь',[['none','Без тіні'],['soft','М’яка тінь'],['glow','Кольорове сяйво']],t.shadow)}</div><div class="admin-tag-footer"><span class="user-tag" data-tag-preview data-effect="${t.effect}" data-shadow="${t.shadow}" style="${tagStyle(t)}">${esc(t.text)}</span><div class="actions"><button class="btn secondary" type="submit">${index < 0 ? 'Видати тег' : 'Зберегти тег'}</button>${index >= 0 ? btn('Прибрати','remove-user-tag',`type="button" data-id="${esc(uid)}" data-index="${index}"`,'ghost') : ''}</div></div><div class="form-error" role="alert"></div></form>`;
}
function tagFromForm(form) {
  const values=Object.fromEntries(new FormData(form));
  return tagData([{...values,text:values.text||'Новий тег',gradient:form.elements.gradient.checked,angle:Number(values.angle)}])[0];
}
function updateTagPreview(form) {
  try {const tag=tagFromForm(form),preview=form.querySelector('[data-tag-preview]');preview.textContent=tag.text;preview.style.cssText=tagStyle(tag);preview.dataset.effect=tag.effect;preview.dataset.shadow=tag.shadow;}catch{}
}
document.addEventListener('change',event=>{
  const form=event.target.closest('.admin-tag-form');if(!form)return;
  if(event.target.name==='template'){
    const template=tagTemplates[event.target.value];
    if(template)for(const [key,value]of Object.entries(template)){const control=form.elements.namedItem(key);if(control){if(control.type==='checkbox')control.checked=value;else control.value=value;}}
  }else form.elements.template.value='';
  updateTagPreview(form);
});
function adminTagEditor(uid, tags) {
  return `<section class="admin-tag-editor"><h3>Теги користувача</h3><p class="small muted">До 5 тегів. Видно над місцеположенням у профілі. Керувати може лише власник.</p>${tags.map((tag,index)=>adminTagForm(uid,tag,index)).join('')}${tags.length < 5 ? adminTagForm(uid) : '<p class="small muted">Видано максимальну кількість тегів.</p>'}</section>`;
}
async function adminUser(id) {
  if (!owner()) throw Error("Немає доступу");
  let user = S.adminUsers.find((u) => u.id === id);
  if (!user) throw Error("Користувача не знайдено.");
  const [programs, sessions, freshUser, labels] = await Promise.all([db.list(`users/${id}/programs`), db.list(`users/${id}/sessions`), db.getLive(`users/${id}`), db.getLive(`userLabels/${id}`)]);
  if (freshUser) { user = { ...freshUser, id }; S.adminUsers = S.adminUsers.map((u) => u.id === id ? user : u); }
  const ips = loginIpHistory(user);
  const completed = sessions.filter((s) => s.status === "completed");
  const latest = sessions.filter((s) => s.status !== "planned").sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  openModal(`<header class="admin-member-header"><div class="row">${personAvatar(user)}<div><span class="eyebrow">Керування користувачем · #${esc(user.customId || '—')}</span><h2 id="admin-member-title">${esc(user.name || 'Без імені')}</h2><p class="small muted">${esc(user.email || '—')}</p></div></div>${btn('Закрити', 'close', '', 'ghost')}</header>
    <div class="admin-member-stats"><div><strong>${programs.length}</strong><span>Програм</span></div><div><strong>${completed.length}</strong><span>Завершених тренувань</span></div><div><strong>${memberDays(user.createdAt)}</strong><span>Днів з нами</span></div></div>
    <div class="admin-member-nav" aria-label="Розділи керування користувачем">${[['overview','Огляд і доступ'],['training','Тренування'],['logins','Історія входів']].map(([key,title]) => btn(title,'admin-member-panel',`data-panel="${key}" aria-pressed="${key === 'overview'}"`,'ghost')).join('')}</div>
    <section data-member-panel="overview"><dl class="user-facts"><div><dt>Реєстрація</dt><dd>${displayDate(user.registeredAt || user.createdAt)}</dd></div><div><dt>Остання активність</dt><dd>${displayDate(user.lastActiveAt)}</dd></div><div><dt>Останнє тренування</dt><dd>${esc(latest?.date || 'Ще немає')}</dd></div><div><dt>Останній вхід</dt><dd>${displayDate(user.lastLoginTime)}</dd></div></dl>
    ${homeAccessControl(id)}${adminTagEditor(id, labels?.tags || [])}<div class="actions">${btn('Відкрити профіль', 'view-person', `data-id="${esc(id)}"`, 'secondary')}</div></section>
    <section data-member-panel="logins" hidden><h3>Останні 5 входів з IP</h3><p class="small muted">Найновіші зверху. Повторні входи з тієї самої адреси показуються окремо.</p>
    <div class="login-ip-list">${ips.map((entry, index) => `<div class="login-ip-row"><span class="login-ip-number">${index + 1}</span><div><code>${esc(entry.ip)}</code><p class="small muted">${displayDate(entry.time)}</p></div>${index === 0 ? '<span class="badge">Останній</span>' : ''}</div>`).join('') || '<p class="muted">IP ще не записані. Історія з’явиться після наступних входів.</p>'}</div><p class="small muted">IP передає застосунок під час входу. Якщо визначити адресу не вдалося, запис не додається.</p></section>
    <section data-member-panel="training" hidden>
    <h3>Програми користувача</h3>
    ${programs.length ? programs.map((p) => `<details class="user-program" open><summary>${esc(p.name)} ${p.id === user.activeProgramId ? '· Активна' : ''}</summary>
      <p class="small muted">${esc(p.type)}</p>${(p.days || []).map((d) => `<section class="admin-plan-day"><h3>${esc(dayLabel(p, d, true))} · ${esc(d.name)}</h3><p>${esc(d.groups)}</p>${workoutDescription(d)}${d.items.map(adminItemDetails).join("") || (d.description ? "" : '<p class="muted">Плану ще немає.</p>')}</section>`).join("")}</details>`).join("") : '<p class="muted">Програм ще немає.</p>'}
    <h3>Заплановані, поточні та завершені тренування</h3>
    ${sessions.length ? [...sessions].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((s) => `<details class="user-program"><summary>${esc(s.date)} · ${esc(s.name)} · ${s.status === "planned" ? "Заплановано" : s.status === "completed" ? "Завершено" : "Триває"}</summary>
      <p class="small muted">${s.logs?.length || 0} підходів${s.endedAt ? ` · ${Math.max(0, Math.round((s.endedAt - s.startedAt) / 60000))} хв` : ""}</p>
      ${workoutDescription(s)}
      ${(s.items || []).map((item, index) => `${adminItemDetails(item)}<div class="admin-set-logs">${s.skipped?.includes(index) ? '<p>Вправу пропущено</p>' : ''}${(s.logs || []).filter((l) => l.index === index).map((l, k, logs) => `<p>${setLogLabel(logs, k)}: ${l.reps} повторень · ${l.weight} кг${l.seconds ? ` · ${l.seconds} сек` : ""}</p>${metricSummary(l.metrics)}`).join("")}</div>`).join("")}</details>`).join("") : '<p class="muted">Тренувань ще немає.</p>'}</section>`, "admin-member-title", "admin-user-dialog");
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
const adminExpanded = new Set();
function adminOverview() {
  const stats=adminStats(S.adminUsers,S.adminAccess);
  return [[stats.total,'Усього учасників','♙'],[stats.online.length,'Активні зараз · 5 хв','◉'],[stats.today,'Активні сьогодні','◷']].map(([value,label,icon])=>`<div><span aria-hidden="true">${icon}</span><strong>${S.adminStatsAt?value:'—'}</strong><small>${label}</small></div>`).join('');
}
function updateAdminStatistics() {
  const overview=document.querySelector('.admin-overview'),panel=document.querySelector('#admin-statistics');
  if(overview)overview.innerHTML=adminOverview();if(panel)panel.innerHTML=adminStatisticsPanel();
}
function adminStatisticsPanel() {
  const stats=adminStats(S.adminUsers,S.adminAccess),max=Math.max(1,...stats.registrations.map(item=>item.count));
  return `<section class="card"><div class="sectionhead"><div><h2>Пульс спільноти</h2><p class="small muted">${S.adminStatsAt?`Оновлено: ${displayDate(S.adminStatsAt)}`:'Завантаж дані, щоб побачити статистику.'}</p></div>${btn('Оновити статистику','load-admin-statistics','','secondary')}</div>${S.adminStatsAt?`<div class="admin-stat-grid">${[[stats.week,'Активні за 7 днів'],[stats.newToday,'Реєстрації сьогодні'],[stats.newWeek,'Нові за 7 днів'],[stats.home,'Доступ до домашніх'],[stats.nutrition,'Доступ до харчування'],[stats.total?Math.round(stats.today/stats.total*100)+'%':'0%','Активність сьогодні']].map(([value,label])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><div class="admin-stat-columns"><section><h3>Нові учасники за тиждень</h3><div class="admin-registration-chart" role="img" aria-label="Реєстрації за останні сім днів">${stats.registrations.map(item=>`<div title="${item.date}: ${item.count}"><strong>${item.count}</strong><div><i style="height:${Math.max(2,item.count/max*100)}%"></i></div><small>${item.date.slice(5).split('-').reverse().join('.')}</small></div>`).join('')}</div></section><section><h3>Зараз активні <span class="badge">${stats.online.length}</span></h3><div class="admin-online-list">${stats.online.sort((a,b)=>activityMillis(b.lastActiveAt)-activityMillis(a.lastActiveAt)).slice(0,12).map(user=>`<div class="row">${personAvatar(user)}<div class="grow"><strong>${esc(user.name||'Без імені')}</strong><small class="muted">#${esc(user.customId||'—')}</small></div>${btn('Керувати','admin-user',`data-id="${esc(user.id)}"`,'ghost')}</div>`).join('')||'<p class="muted">Немає активних користувачів за останні 5 хвилин.</p>'}</div></section></div><p class="small muted">«Зараз» — активність за останні 5 хвилин. «Сьогодні» — унікальні користувачі з останньою активністю сьогодні за київським часом. Дані оновлюються кнопкою вище.</p>`:'<p class="muted">Учасники онлайн, активність, реєстрації та надані доступи — в одному місці.</p>'}</section>`;
}
function adminSection(key,title,description,icon,count,content) {
  return `<details class="admin-section" data-admin-section="${key}" ${adminExpanded.has(key)?'open':''}><summary><span class="admin-section-icon" aria-hidden="true">${icon}</span><span class="admin-section-label"><strong>${title}</strong><span>${description}</span></span><span class="admin-section-count">${count}</span><span class="admin-section-chevron" aria-hidden="true">⌄</span></summary><div class="admin-section-body">${content}</div></details>`;
}
document.addEventListener('toggle',event=>{
  const section=event.target;
  if(!section.matches?.('.admin-section'))return;
  if(section.open)adminExpanded.add(section.dataset.adminSection);else adminExpanded.delete(section.dataset.adminSection);
},true);
function admin() {
  if (!owner()) return empty("Немає доступу", "Цей розділ доступний лише власнику.");
  const users=`<section class="card" id="admin-users">
          <div class="sectionhead"><div><span class="eyebrow">Учасники</span><h2>Користувачі</h2></div>${btn("Завантажити / оновити", "load-users", "", "secondary")}</div>
          <p class="muted">Профілі, програми за днями та результати тренувань.</p>
          <label>Пошук користувача<input id="admin-user-search" type="search" placeholder="Ім’я, email або ID" /></label>
          <div id="admin-users-list">${S.adminUsers.length ? adminUsersList() : '<p class="muted">Завантаж список, щоб переглянути користувачів.</p>'}</div>
        </section>`;
  const catalog=`<section class="card">
          <h2>Наповнення каталогу</h2>${btn("Імпорт JSON", "open-import", "", "secondary")}
          <p class="muted">Додавай власні вправи вручну або імпортуй їх у форматі JSON.</p>
          <div class="actions">
            ${btn("＋ Додати вправу", "new-exercise")}
          </div>
          ${adminCatalogControls()}
          <div id="admin-catalog-results">${adminCatalogResults()}</div>
        </section>`;
  const templates=`<section class="card">
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
            .join("") || '<p class="muted">Шаблонів ще немає. Створи першу програму для учасників.</p>'}
        </section>`;
  const settings=`<form id="settings-form" class="card">
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
        </form>`;
return `<div class="admin-studio"><div class="admin-ambient" aria-hidden="true"><i></i><i></i><i></i></div><header class="admin-hero"><div><h1>Усе під контролем<span>.</span></h1><p>Люди, контент та ідеї.<br/>Один простір для керування твоєю спільнотою.</p></div><div class="admin-hero-art" aria-hidden="true"><div class="admin-orbit"></div><span>N</span><i></i><i></i></div></header><div class="admin-overview" aria-label="Огляд наповнення">${adminOverview()}</div><div class="admin-workspace-heading"><div><span class="eyebrow">Твій робочий простір</span><h2>З чого почнемо?</h2></div><span class="small muted">Розгорни потрібний розділ</span></div><div class="admin-sections">
    ${adminSection('statistics','Статистика спільноти','Онлайн, активність, нові учасники та доступи','◷','Огляд','<div id="admin-statistics">'+adminStatisticsPanel()+'</div>')}
    ${adminSection('users','Учасники та доступ','Профілі, дозволи, теги та результати','♙',S.adminUsers.length||'Доступ',users)}
    ${adminSection('catalog','Каталог вправ','Створення, імпорт, редагування та архів','◈',S.exercises.length,catalog)}
    ${adminSection('templates','Програми тренувань','Готові шаблони для твоєї спільноти','▤',S.templates.length,templates)}
    ${adminSection('nutrition','Харчування','Тижневі меню та плани харчування','◉',S.nutritionPlans.length,adminNutritionPanel())}
    ${adminSection('reports','Модерація','Звернення учасників та розгляд скарг','⚑',S.reports.filter(report=>report.status==='open').length||'Скарги',reportsPanel())}
    ${adminSection('settings','Налаштування сайту','Опис, оголошення та важливі оновлення','⚙','Сайт',settings)}
  </div></div>`;
}
function sharingDialog(token) {
  const link = programShareURL(token, location.href);
  openModal(`<div class="sectionhead"><h2 id="sharing-title">Поділитися програмою</h2>${btn("Закрити", "close", "", "ghost")}</div>
    <p>Надішли посилання. Одержувач зможе переглянути програму та зберегти власну копію після входу в акаунт.</p>
    <label>Посилання<input id="program-share-link" type="url" value="${esc(link)}" readonly /></label>
    <div class="actions">${btn("Копіювати посилання", "copy-share-link", "", "secondary")}${btn("Відкликати посилання", "revoke-share", `data-id="${esc(token)}"`, "ghost danger")}</div>`, "sharing-title");
}
async function openIncomingShare(token = requestedShare()) {
  if (!shareToken(token)) return;
  incomingShare = null;
  try {
    const shared = await db.getLive(`sharedPrograms/${token}`);
    if (!shared) throw Error("Посилання відкликане або програма недоступна.");
    const program = shareableProgram(shared.program);
    requireHomeAccess(program);
    incomingShare = { token, program };
    openModal(`<div class="sectionhead"><h2 id="incoming-share-title">${esc(program.name)}</h2>${btn("Закрити", "close", "", "ghost")}</div>
      <p class="muted">Збережи власну копію, щоб редагувати й тренуватися за цією програмою.</p>
      ${program.days.map((day) => `<details class="program-day"><summary>${esc(dayLabel(program, day))} · ${esc(day.name)}</summary><div class="program-day-content">${workoutDescription(day)}${exerciseRows(day.items)}</div></details>`).join("")}
      ${btn("Зберегти собі копію", "accept-shared-program", "", "wide")}`, "incoming-share-title");
  } catch (error) {
    openModal(`<h2 id="incoming-share-title">Програма недоступна</h2><p>${esc(error.code === "permission-denied" ? "Посилання недоступне або потрібен дозвіл адміністратора." : error.message)}</p>${btn("Закрити", "close", "", "secondary")}`, "incoming-share-title");
  }
}
function openModal(html, labelledBy = "", className = "") {
  disposeRichEditors(modal);
  modal.className = className;
  modal.innerHTML = html;
  mountRichEditors(modal);
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
function communityScope(value = 'exercises') {
  if (!['exercises', 'programTemplates'].includes(value)) throw Error('Невідомий розділ.');
  return value;
}
function starInput(score, required = false) {
  return `<fieldset class="star-rating"><legend>Оцінка${required ? ' (обов’язкова)' : ''}</legend>${[1,2,3,4,5].map(n => `<label><input type="radio" name="score" value="${n}" ${score === n ? 'checked' : ''} ${required ? 'required' : ''} /><span aria-hidden="true">★</span><span class="visually-hidden">${n} з 5</span></label>`).join('')}</fieldset>`;
}
async function loadCommunity(id) {
  const box = document.querySelector('#exercise-community');
  if (!box || box.dataset.id !== id) return;
  const scope = communityScope(box.dataset.scope), token = Symbol();
  box.loadToken = token;
  try {
    const [ratings, comments] = await Promise.all([db.list(`${scope}/${id}/ratings`), db.list(`${scope}/${id}/comments`)]);
    const authors = Object.fromEntries(await Promise.all([...new Set(comments.map(c => c.authorId))].map(async uid => [uid, await db.publicIdentity(uid)])));
    const summaries = Object.fromEntries(await Promise.all(comments.map(async c => [c.id, await db.commentReactions(`${scope}/${id}/comments/${c.id}`)])));
    if (!box.isConnected || box.loadToken !== token) return;
    const draft=captureCommentDraft(box.querySelector('#comment-form'));
    const draftScore = box.querySelector('#comment-form [name="score"]:checked')?.value;
    const summary = ratingSummary(ratings), mine = ratings.find(r => r.id === S.user.uid);
    disposeRichEditors(box);
    box.innerHTML = `<h3>Загальний рейтинг</h3><p class="public-rating-summary">${summary.count ? `★ ${summary.average.toFixed(1)} / 5 · оцінок: ${summary.count}` : 'Оцінок ще немає'}</p>
      <form id="public-rating-form" data-id="${esc(id)}" data-scope="${scope}">${starInput(mine?.score, true)}<button type="submit" class="btn secondary">Зберегти публічну оцінку</button>${mine ? btn('Прибрати оцінку','remove-public-rating',`type="button" data-id="${esc(id)}" data-scope="${scope}"`,'ghost') : ''}<div class="form-error" role="alert"></div></form>
      <h3>Коментарі (${comments.length})</h3><form id="comment-form" data-id="${esc(id)}" data-scope="${scope}">${starInput(draftScore ? Number(draftScore) : mine?.score, true)}${richComposer({draft:draft||'',placeholder:'Твій коментар'})}<p class="small muted">Для публікації коментаря обери оцінку. Фото доступні в коментарях у профілі.</p><button type="submit" class="btn">Опублікувати</button><div class="form-error" role="alert"></div></form>
      <div class="exercise-comments">${comments.sort((a,b) => activityMillis(b.createdAt)-activityMillis(a.createdAt)).map(c => {
        const person = authors[c.authorId] || { name: c.authorName };
        return `<article class="comment-card"><button class="comment-avatar" data-action="view-person" data-id="${esc(c.authorId)}" aria-label="Відкрити профіль">${personAvatar(person)}</button><div class="comment-body"><div class="comment-meta"><button class="person-link" data-action="view-person" data-id="${esc(c.authorId)}">${esc(person.name || c.authorName)}</button><time>${displayDate(c.createdAt)}</time></div>${Number.isInteger(c.score) ? `<span class="review-stars" aria-label="${c.score} з 5">${'★'.repeat(c.score)}${'☆'.repeat(5-c.score)}</span>` : ''}${renderComment(c)}<div class="comment-actions">${reactionButtons(`${scope}/${id}/comments/${c.id}`, summaries[c.id])}${c.authorId === S.user.uid || owner() ? btn('Видалити','delete-comment',`data-id="${esc(id)}" data-scope="${scope}" data-comment="${esc(c.id)}"`,'ghost danger') : ''}</div></div></article>`;
      }).join('') || '<p class="muted">Будь першим, хто поділиться досвідом.</p>'}</div>`;
    mountRichEditors(box);
  } catch (e) {
    if (box.isConnected && box.loadToken === token) {
      let error = box.querySelector('.community-error');
      if (!error) { error = document.createElement('div'); error.className = 'community-error error'; box.prepend(error); }
      error.innerHTML = `${esc(err(e))} ${btn('Повторити завантаження','reload-community',`data-id="${esc(id)}"`,'secondary')}`;
      box.querySelector('.community-loading')?.remove();
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
async function refresh({ isCurrent = () => true } = {}) {
  S.measurementsError = '';
  S.manualSetsError = '';
  const [programs, sessions, exercises, templates, settings, personalExercises, preferences, access, measurements, manualSets] = await Promise.all([
    db.list(privatePath("programs")),
    db.list(privatePath("sessions")),
    db.list("exercises"),
    db.list("programTemplates"),
    db.get("settings/site"),
    db.list(privatePath("exercises")),
    db.list(privatePath("exercisePreferences")),
    db.get(`userAccess/${S.user.uid}`).catch((error) => {
      if (error.code === "permission-denied" || !navigator.onLine) return null;
      throw error;
    }),
    db.list(privatePath('measurements')).catch((error)=>{S.measurementsError=err(error);return []; }),
    db.list(privatePath('manualSets')).catch((error)=>{S.manualSetsError=err(error);return []; }),
  ]);
  if (!isCurrent()) return;
  if (owner() && S.route === "admin") {
    const retired = [
      ...exercises.filter((e) => demoExerciseIds.has(e.id)).map((e) => `exercises/${e.id}`),
      ...templates.filter((t) => demoTemplateIds.has(t.id)).map((t) => `programTemplates/${t.id}`),
    ];
    if (retired.length) await db.removeMany(retired);
  }
  if (!isCurrent()) return;
  Object.assign(S, {
    homeAccess: access?.homeWorkouts === true,
    customizationAccess:access?.profileCustomization===true,
    nutritionAccess: access?.nutrition === true,
    programs,
    exercisePreferences: Object.fromEntries(preferences.map(({ id, ...data }) => [id, data])),
    sessions,
    measurements,
    manualSets,
    exercises: [...exercises.filter((e) => !demoExerciseIds.has(e.id)), ...personalExercises.map((e) => ({ ...e, id: "personal:" + e.id, personal: true }))],
    templates: templates.filter((t) => !demoTemplateIds.has(t.id)),
    settings: settings || S.settings,
    loaded: true,
  });
  if (S.route === 'nutrition' || (owner() && S.route === 'admin')) await loadNutrition();
  if (navigator.onLine && S.publicProfileReady) db.publishProfileStats(sessions,manualSets).catch((error) => console.warn('Статистика профілю:', error.code));
}
async function saveSession(s) {
  const wasActive = S.sessions.some((session)=>session.id === s.id && session.status === 'active');
  s.updatedAt = Date.now();
  await db.save(privatePath(`sessions/${s.id}`), stripId(s));
  const i = S.sessions.findIndex((x) => x.id === s.id);
  if (i < 0) S.sessions.push(s);
  else S.sessions[i] = s;
  if (wasActive && s.status === 'completed' && S.route === 'session') {
    S.summaryId=s.id;
    if (currentPage === 'session') window.history.replaceState(null,'',new URL(`workout.html?summary=${encodeURIComponent(s.id)}`,appBase));
  }
  if (s.status === 'completed') try { clearSetDraft(localStorage,S.user.uid,s.id); } catch {}
  if (navigator.onLine && s.status === 'completed') db.publishProfileStats(S.sessions,S.manualSets).catch((error) => console.warn('Не вдалося оновити статистику профілю:', error.code));
  if (s.status === "completed" && s.programId === active()?.id && active()?.scheduleMode === "sequence") chosenDay = null;
  render();
}
async function action(a, b) {
  const id = b.dataset.id,
    n = +b.dataset.n,
    j = +b.dataset.j;
  switch (a) {
    case 'show-workout-summary': modal.close(); navigate('session',`?summary=${encodeURIComponent(id)}`); break;
    case 'new-measurement': editMeasurement(); break;
    case 'edit-measurement': editMeasurement(id); break;
    case 'delete-measurement':
      if(confirm(`Видалити заміри за ${id}?`)) {
        await db.remove(privatePath(`measurements/${id}`)); S.measurements=S.measurements.filter((m)=>m.id!==id); render(); toast('Заміри видалено');
      }
      break;
    case 'delete-manual-set':
      if(confirm(`Видалити підхід «${b.dataset.name || 'Вправа'}»?`)) {
        await db.remove(privatePath(`manualSets/${id}`));
        S.manualSets=S.manualSets.filter(entry=>entry.id!==id);
        if(navigator.onLine)await db.publishProfileStats(S.sessions,S.manualSets);
        render();toast('Підхід видалено');
      }
      break;
    case 'save-profile-image': {
      if (!imageEdit) throw Error('Спочатку обери зображення.');
      const {file,kind,crop}=imageEdit;
      if (kind === 'avatar') {
        const photo=await prepareAvatar(file,crop); await db.ensurePublicProfile(S.profile); await db.changeAvatar(photo);
        S.profile.photo=photo; S.selfPublic.photo=photo; if(S.people?.uid===S.user.uid)S.people.person.photo=photo;
      } else {
        const banner=await prepareBanner(file,crop); await db.patch(`publicProfiles/${S.user.uid}`,{banner});
        S.selfPublic.banner=banner; if(S.people?.uid===S.user.uid)S.people.person.banner=banner;
      }
      modal.close(); disposeImageEdit(); render(); toast('Зображення збережено');
      break;
    }
    case 'person-actions': break;
    case 'report-person': reportDialog(id); break;
    case 'report-comment': {
      const comment=S.people.comments.find((c)=>c.id===id);
      if(comment) reportDialog(comment.authorId,id);
      break;
    }
    case 'block-person':
      if(confirm('Заблокувати користувача? Дружбу та заявки буде прибрано. Він не зможе писати тобі чи надсилати нові запрошення.')) {
        await db.blockUser(id); await loadSafety(); await loadPeople();
        S.notices=S.notices.filter((n)=>n.actorId!==id); modal.close(); render(); toast('Користувача заблоковано');
      }
      break;
    case 'unblock-person':
      await db.unblockUser(id); await loadSafety(); await loadPeople(); modal.close(); render(); toast('Користувача розблоковано');
      break;
    case 'load-reports':
      if(!owner())throw Error('Немає доступу.');
      S.reports=await db.reports();
      S.reportProfiles=Object.fromEntries(await Promise.all([...new Set(S.reports.flatMap((r)=>[r.reporterId,r.targetId]))].map(async(uid)=>[uid,await db.getLive(`publicProfiles/${uid}`)])));
      render(); break;
    case 'review-report':
      if(!owner())throw Error('Немає доступу.');
      await db.reviewReport(id,b.dataset.status); S.reports=await db.reports(); render(); break;
    case 'open-report-comment': {
      const report=S.reports.find((r)=>r.id===id); if(report)await openPerson(report.profileId,report.commentId);
      break;
    }
    case 'invite-workout': inviteWorkoutDialog(id); break;
    case 'respond-training-invite':
      await db.respondTrainingInvite(id,b.dataset.status); await refresh(); render(); await openTrainingInvite(id);
      toast(b.dataset.status==='accepted' ? 'Тренування додано до календаря' : 'Відповідь збережено'); break;
    case 'invite-calendar': navigate('home',`?date=${encodeURIComponent(b.dataset.date)}`); break;
    case 'settings-section':
      if (!['user','privacy','security'].includes(b.dataset.section)) break;
      S.settingsSection = b.dataset.section; render();
      break;
    case 'account-password-reset':
      await db.resetPassword(S.user.email); toast('Лист для зміни пароля надіслано на твою пошту.');
      break;
    case 'remove-user-tag': {
      if (!owner()) throw Error('Немає доступу.');
      const labels = await db.getLive(`userLabels/${id}`);
      const tags = (labels?.tags || []).filter((_,index)=>index !== +b.dataset.index);
      await db.save(`userLabels/${id}`, { tags: tagData(tags) });
      await adminUser(id); toast('Тег прибрано');
      break;
    }
    case 'open-notices': noticeInbox(); break;
    case 'read-all-notices':
      await db.readNotifications(S.notices.filter((n)=>!n.read).map((n)=>n.id));
      S.notices.forEach((n)=>{ n.read = true; }); updateNoticeBadge(); noticeInbox();
      break;
    case 'open-notice': {
      const notice = S.notices.find((n)=>n.id === id);
      if (!notice) break;
      if (!notice.read) await db.readNotifications([id]);
      if (notice.type.startsWith('training_')) await openTrainingInvite(notice.targetId);
      else await openPerson(notice.profileId, ['comment', 'reply'].includes(notice.type) ? notice.targetId : '');
      break;
    }
    case 'copy-profile-link':
      await navigator.clipboard.writeText(profileURL(S.profile.customId)); toast('Посилання скопійовано');
      break;
    case 'open-gym-bros': S.invites=await db.trainingInvites(); gymBroDirectory(); break;
    case 'view-training-invite': await openTrainingInvite(id); break;
    case 'cancel-comment-reply': replyingTo = null; focusCommentComposer(); break;
    case 'reply-profile-comment': {
      const comment = S.people.comments.find((c)=>c.id === id);
      replyingTo = comment?.parentId || id;
      focusCommentComposer();
      break;
    }
    case 'remove-banner':
      await db.patch(`publicProfiles/${S.user.uid}`, { banner: '' });
      S.selfPublic.banner = ''; S.people.person.banner = ''; render(); toast('Банер прибрано');
      break;
    case 'reset-profile-appearance': {
      if(!owner()&&!S.customizationAccess)throw Error('Доступ до кастомізації вимкнено.');
      await db.patch(`publicProfiles/${S.user.uid}`,{appearance:null});
      S.selfPublic.appearance=null;if(S.people?.uid===S.user.uid)S.people.person.appearance=null;render();toast('Стандартний вигляд відновлено');break;
    }
    case 'like-profile-comment': {
      const comment = S.people.comments.find((c)=>c.id === id);
      if (!comment) break;
      await db.toggleCommentLike(S.people.uid, id, !!comment.liked);
      const draft=captureCommentDraft(document.querySelector('#profile-comment-form'));
      await loadPeople(); render();
      restoreCommentDraft(document.querySelector('#profile-comment-form'),draft);
      break;
    }
    case 'warmup-done':
    case 'warmup-skip': {
      const session = ongoing();
      if (!session) throw Error('Немає активного тренування.');
      await saveSession({ ...copy(session), warmupDone: true, warmupSkipped: a === 'warmup-skip' });
      break;
    }
    case 'use-previous-set': {
      const session = ongoing(), item = session?.items[session.index];
      const previous = item && previousWorkingSet(S.sessions, item, session.id, workingSetCount(session));
      if (!previous) throw Error('Попереднього робочого підходу немає.');
      const form = document.querySelector('#set-form');
      form.elements.reps.value = previous.reps;
      form.elements.weight.value = previous.weight;
      (item.metrics || []).forEach((metric, index) => {
        const value = previous.metrics?.find((m) => m.name === metric.name && m.unit === metric.unit);
        if (value) form.elements[`actual-metric-${index}`].value = value.value;
      });
      captureSetInputs();
      toast('Повторення й вагу підставлено. Перевір перед збереженням.');
      break;
    }
    case 'finish-early':
      if (confirm('Завершити тренування зараз? Виконані підходи залишаться в історії, незавершені вправи будуть позначені.')) {
        await saveSession(finishEarly(ongoing()));
        toast('Тренування завершено. Виконані підходи збережено.');
      }
      break;
    case 'view-person':
      await openPerson(id);
      break;
    case 'refresh-people':
      await loadPeople(); render();
      break;
    case 'friend-request': {
      if (id === S.user.uid || id !== S.people?.uid || !S.people.person) throw Error('Обери профіль іншого спортсмена.');
      if (S.people.relations.some((r) => r.members.includes(id))) throw Error('Заявка або дружба вже існує. Онови профіль.');
      await db.requestGymBro(id);
      await loadPeople(); render(); toast('Заявку Gym Bro надіслано');
      break;
    }
    case 'friend-accept':
      await db.acceptGymBro(id);
      await loadPeople(); render(); if (modal.open && modal.querySelector('#gym-bro-title')) gymBroDirectory(); toast('Тепер ви Gym Bro 🤝');
      break;
    case 'toggle-record-visibility': {
      if(S.people?.uid!==S.user.uid||S.route!=='profile')throw Error('Можна змінювати лише свої рекорди.');
      const result=await db.setRecordVisibility(b.dataset.key,b.dataset.visible==='true',S.sessions,S.manualSets);
      S.recordVisibility=result.preference;S.selfPublic.visibility=result.visibility;S.people.person.visibility=result.visibility;
      document.getElementById('personal-records').outerHTML=recordsCard();
      toast(b.dataset.visible==='true'?'Рекорд показано іншим':'Рекорд приховано');break;
    }
    case 'friend-remove':
      if (confirm('Прибрати цю дружбу або заявку Gym Bro?')) {
        await db.removeGymBro(id); await loadPeople(); render(); if (modal.open && modal.querySelector('#gym-bro-title')) gymBroDirectory();
      }
      break;
    case 'delete-profile-comment':
      if (confirm('Видалити коментар?')) {
        await db.remove(`publicProfiles/${profileUid()}/comments/${id}`); await loadPeople(); render();
        if(modal.open&&modal.classList.contains('all-comments-dialog'))showAllComments();
      }
      break;
    case "share-program": {
      if (!navigator.onLine) throw Error("Для створення посилання потрібен інтернет.");
      const program = S.programs.find((p) => p.id === id);
      requireHomeAccess(program);
      const snapshot = shareableProgram(program);
      const mappingPath = privatePath(`programShares/${id}`);
      const mapping = await db.get(mappingPath);
      const previous = shareToken(mapping?.token);
      const token = previous && await db.getLive(`sharedPrograms/${previous}`) ? previous : crypto.randomUUID();
      await db.saveMany([[`sharedPrograms/${token}`, { senderId: S.user.uid, program: snapshot }], [mappingPath, { token }]]);
      sharingDialog(token);
      break;
    }
    case "copy-share-link": {
      const input = document.querySelector("#program-share-link");
      try {
        await navigator.clipboard.writeText(input.value);
        toast("Посилання скопійовано");
      } catch {
        input.focus(); input.select(); toast("Посилання виділено — скопіюй його.");
      }
      break;
    }
    case "revoke-share":
      if (!shareToken(id)) throw Error("Некоректне посилання.");
      await db.remove(`sharedPrograms/${id}`);
      modal.close(); toast("Посилання відкликано. Збережені одержувачами копії залишаються у них.");
      break;
    case "accept-shared-program": {
      if (!incomingShare) throw Error("Спочатку відкрий посилання на програму.");
      // Re-read the link so revocation also applies to an already open preview.
      const shared = await db.getLive(`sharedPrograms/${incomingShare.token}`);
      if (!shared) throw Error("Посилання вже відкликано.");
      const program = shareableProgram(shared.program);
      requireHomeAccess(program);
      await db.save(privatePath(`programs/${crypto.randomUUID()}`), { ...program, archived: false, updatedAt: Date.now() });
      incomingShare = null;
      await refresh(); modal.close();
      window.history.replaceState(null, "", new URL("program.html", location.href));
      S.route = "program"; render(); toast("Копію програми збережено");
      break;
    }
    case 'nutrition-reload': await loadNutrition(); render(); break;
    case 'new-nutrition': nutritionEditor(); break;
    case 'edit-nutrition': {
      const plan = S.nutritionPlans.find(plan => plan.id === id);
      if (!plan) throw Error('Меню вже недоступне.');
      nutritionEditor(plan); break;
    }
    case 'delete-nutrition':
      if (!owner()) throw Error('Немає доступу');
      if (!confirm('Видалити цей план харчування?')) break;
      await db.remove(`nutritionPlans/${id}`); await loadNutrition(); render(); break;
    case 'nutrition-edit':
      S.nutritionEditing=true;render();document.getElementById('nutrition-questionnaire')?.scrollIntoView({behavior:'smooth'});break;
    case 'nutrition-cancel-edit': S.nutritionEditing=false;render();break;
    case 'nutrition-regenerate':
      if(S.nutritionResult)await createPersonalNutrition(S.nutritionResult.input,(S.nutritionResult.seed+1)%7);break;
    case 'nutrition-day':
      if (!Number.isInteger(Number(id)) || Number(id)<0 || Number(id)>6) break;
      S.nutritionDay=Number(id);render();break;
    case 'nutrition-shopping':
      S.nutritionShopping=!S.nutritionShopping;render();
      if(S.nutritionShopping)document.getElementById('nutrition-shopping-inline')?.scrollIntoView({behavior:'smooth',block:'start'});break;
    case 'nutrition-copy-shopping': {
      const text='Список покупок на тиждень\n'+S.nutritionResult.groceries.map(item=>`${S.nutritionChecked.includes(item.id)?'☑':'☐'} ${item.name} (${item.state}) — ${item.grams} г`).join('\n');
      await navigator.clipboard.writeText(text);toast('Список покупок скопійовано');break;
    }
    case 'nutrition-reset-shopping':
      S.nutritionChecked=[];saveNutritionChecks();render();break;
    case 'nutrition-copy':
      if(S.nutritionResult){await navigator.clipboard.writeText(menuText(S.nutritionResult.plan));toast('Меню скопійовано');}break;
    case 'load-users': {
      if (!owner()) throw Error('Немає доступу');
      const [users, access] = await Promise.all([db.list('users'),db.list('userAccess')]);
      S.adminUsers=users;S.adminAccess=Object.fromEntries(access.map(({id,...data})=>[id,data]));
      S.adminStatsAt=Date.now();
      document.querySelector('#admin-users-list').innerHTML=adminUsersList(document.querySelector('#admin-user-search').value);
      updateAdminStatistics();
      break;
    }
    case 'load-admin-statistics': {
      if(!owner())throw Error('Немає доступу');
      const [users,access]=await Promise.all([db.list('users'),db.list('userAccess')]);
      S.adminUsers=users;S.adminAccess=Object.fromEntries(access.map(({id,...data})=>[id,data]));S.adminStatsAt=Date.now();
      updateAdminStatistics();document.querySelector('#admin-users-list').innerHTML=adminUsersList(document.querySelector('#admin-user-search').value);toast('Статистику оновлено');break;
    }
    case 'toggle-customization-access':
    case 'toggle-nutrition-access':
    case 'toggle-home-access': {
      if (!owner() || !S.adminUsers.some(u => u.id === id)) throw Error('Немає доступу');
      const key = a === 'toggle-home-access' ? 'homeWorkouts' : a==='toggle-customization-access'?'profileCustomization':'nutrition';
      const data = await db.toggleAccess(id,key);
      S.adminAccess[id] = data;
      if (id === S.user.uid) { S.homeAccess = data.homeWorkouts; S.nutritionAccess = data.nutrition;S.customizationAccess=data.profileCustomization; }
      document.querySelector('#admin-users-list').innerHTML = adminUsersList(document.querySelector('#admin-user-search').value);
      const control = modal.querySelector('.admin-access-controls');
      if (control) control.outerHTML = homeAccessControl(id);
      toast(data[key] ? 'Доступ надано' : 'Доступ відкликано');
      break;
    }
    case 'admin-member-panel':
      modal.querySelectorAll('[data-member-panel]').forEach((panel) => { panel.hidden = panel.dataset.memberPanel !== b.dataset.panel; });
      modal.querySelectorAll('[data-action="admin-member-panel"]').forEach((button) => button.setAttribute('aria-pressed', String(button === b)));
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
      if (id === 'profile' && currentPage === 'profile' && profileUid() !== S.user.uid) { navigate('profile'); break; }
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
      restoreDraft.programs.forEach(requireHomeAccess);
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
        <p class="muted">${s.date} · ${Math.round((s.endedAt - s.startedAt) / 60000)} хв${s.endedEarly ? ' · Завершено достроково' : ''}</p>
        ${btn("Виправити тренування", "edit-history", `data-id="${esc(s.id)}"`, "secondary")}${btn('Підсумок','show-workout-summary',`data-id="${esc(s.id)}"`,'ghost')}
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
                      <span class="badge">${s.logs.some((l) => l.index === k) ? 'Виконано частково' : 'Пропущено'}</span>
                    `
                    : ""
                }
              </h3>
              ${s.logs
                .filter((l) => l.index === k)
                .map(
                  (l, n, logs) => `
                    <p class="small">
                      ${setLogLabel(logs, n)} · ${l.reps} повторень · ${l.weight}
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
    case 'show-all-comments': showAllComments();break;
    case 'show-all-activity':
      if(S.people?.uid!==S.user.uid&&!profileVisibility(S.people?.person).activity)break;
      openModal(`<div class="sectionhead"><h2 id="all-activity-title">Остання активність</h2>${btn('Закрити','close','','ghost')}</div><div class="all-activity-list">${activityEntries(S.people.recent||[])}</div>`,'all-activity-title','all-activity-dialog');break;
    case 'activity-profile': modal.close();await openPerson(id, b.dataset.comment); break;
    case 'template-community': {
      const template = S.templates.find(t => t.id === id);
      if (!template) throw Error('Шаблон недоступний.');
      openModal(`<div class="sectionhead"><h2 id="template-review-title">${esc(template.name)}</h2>${btn('Закрити','close','','ghost')}</div><section id="exercise-community" data-id="${esc(id)}" data-scope="programTemplates"><p class="community-loading">Завантаження…</p></section>`, 'template-review-title');
      await loadCommunity(id); break;
    }
    case 'remove-public-rating':
      await db.remove(`${communityScope(b.dataset.scope)}/${id}/ratings/${S.user.uid}`);
      await loadCommunity(id); break;
    case 'quick-react': await applyCommentReaction(b.dataset.path,b.dataset.current||'like');break;
    case 'react-comment': await applyCommentReaction(b.dataset.path,b.dataset.kind);break;
    case 'reaction-details': await reactionDetails(b.dataset.path);break;
    case 'close-reaction-details': b.closest('dialog').close();break;
    case "reload-community":
      await loadCommunity(id);
      break;
    case "delete-comment":
      if (!confirm("Видалити цей коментар?")) break;
      await db.remove(`${communityScope(b.dataset.scope)}/${id}/comments/${b.dataset.comment}`);
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
    case "new-home":
      requireHomeAccess({ scope: "home" });
      navigate("editor", "?home=1");
      break;
    case "toggle-feature": {
      collectEditor();
      const item = editor.days[n].items[j], key = b.dataset.feature;
      if (!builderFeatures.some(([value]) => value === key)) break;
      const selected = itemFeatures(item);
      item.builderFeatures = selected.includes(key) ? selected.filter((value) => value !== key) : [...selected, key];
      if (selected.includes(key)) {
        if (key === "plans") delete item.setPlans;
        else if (key === "metrics") item.metrics = [];
        else if (key === "sets") { item.sets = 1; delete item.setPlans; }
        else item[key] = ["reps", "note"].includes(key) ? "" : 0;
      }
      render();
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
            builderMode: "simple",
            name: "Моя програма",
            type: types[0],
            days: [{ weekday: 0, name: "Верх тіла", groups: "Груди · Спина · Плечі", items: [] }],
            archived: false,
          };
      requireHomeAccess(editor);
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
      if (editorHistory || editorPlanned || editor.scope === "home" || editor.days.length >= (editor.scheduleMode === "sequence" ? 30 : 7)) break;
      collectEditor();
      editor.days.push({
        weekday: Array.from({ length: editor.scheduleMode === "sequence" ? 30 : 7 }, (_, k) => k).find((x) => !editor.days.some((d) => d.weekday === x)),
        name: "Тренування",
        groups: "",
        items: [],
      });
      editorOpenDay = editor.days.length - 1;
      render();
      break;
    case "remove-day":
      if (editorHistory || editorPlanned || editor.scope === "home") break;
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
      const simple = editor.builderMode && editor.builderMode !== "advanced";
      editor.days[n].items.push({ custom: true, name, sets: simple ? 1 : 3,
        reps: simple ? "" : editorHistory ? "10" : "10–12", seconds: 0, weight: 0, rest: simple ? 0 : 60, note: "", metrics: [] });
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
      const simple = editor.builderMode && editor.builderMode !== "advanced";
      const timed = !simple && ["Кардіо", "Розминка"].includes(e.primary);
      editor.days[n].items.push({
        exerciseId: e.id,
        name: e.name,
        primary: e.primary,
        sets: simple || timed ? 1 : 3,
        reps: simple || timed ? "" : editorHistory ? "10" : "10–12",
        seconds: timed ? 300 : 0,
        weight: 0,
        rest: simple || timed ? 0 : 60,
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
      requireHomeAccess(p);
      delete p.id;
      p.archived = false;
      p.name += " — копія";
      p.updatedAt = Date.now();
      const key = crypto.randomUUID();
      await db.save(privatePath(`programs/${key}`), p);
      if (p.scope !== "home") {
        await db.patch(`users/${S.user.uid}`, { activeProgramId: key });
        S.profile.activeProgramId = key;
      }
      await refresh();
      S.route = "program";
      render();
      toast("Програму скопійовано");
      break;
    }
    case "activate":
      if (!S.programs.some((p) => p.id === id && p.scope !== "home")) break;
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
    case "choose-program-day": {
      const program = S.programs.find((p) => p.id === id);
      if (!program) throw Error("Програму не знайдено.");
      requireHomeAccess(program);
      openModal(`<h2>${esc(program.name)}</h2><p>Обери день програми, який хочеш виконати зараз. Можна тренуватися незалежно від дня тижня.</p>${program.days.map((d) => `<section class="exercise-row"><div class="grow"><h3>${esc(d.name)}</h3><p class="small muted">${esc(dayLabel(program, d, true))} · ${esc(d.groups)}</p></div>${btn("Почати зараз", "start", `data-program="${esc(program.id)}" data-day="${d.weekday}"`, "secondary")}</section>`).join("")}${btn("Закрити", "close", "", "ghost")}`);
      break;
    }
    case "start": {
      if (ongoing()) {
        modal.close();
        toast("Спочатку заверши поточне тренування. Відкрито його продовження.");
        S.route = "session";
        render();
        break;
      }
      const p = S.programs.find((x) => x.id === b.dataset.program) || active(),
        d = schedule(p, +b.dataset.day);
      requireHomeAccess(p);
      if (!hasWorkoutContent(d)) throw Error("Опиши тренування або додай вправи до цього дня у редакторі програми.");
      const s = newSession(p, d);
      s.id = crypto.randomUUID();
      await saveSession(s);
      modal.close();
      S.route = "session";
      render();
      break;
    }
    case "resume":
      S.summaryId='';
      if(currentPage==='session')window.history.replaceState(null,'',new URL('workout.html',appBase));
      S.route = "session";
      render();
      break;
    case "finish-text":
      await saveSession(completeTextSession(ongoing()));
      toast("Тренування збережено в історію");
      break;
    case "timer": {
      const s = copy(ongoing());
      s.timerEnd = Date.now() + setPlan(s.items[s.index], Math.min(workingSetCount(s), s.items[s.index].sets - 1)).seconds * 1000;
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
        workingSetCount(current) <
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
document.addEventListener('click',event=>{
  const summary=event.target.closest('.person-actions-menu>summary');
  if(summary&&event.detail>0&&matchMedia('(hover:hover)').matches){event.preventDefault();summary.parentElement.open=true;}
},true);
document.addEventListener('pointerover',event=>{
  const menu=event.target.closest('.person-actions-menu');
  if(menu&&matchMedia('(hover:hover)').matches&&!menu.contains(event.relatedTarget))menu.open=true;
});
document.addEventListener('pointerout',event=>{
  const menu=event.target.closest('.person-actions-menu');
  if(menu&&matchMedia('(hover:hover)').matches&&!menu.contains(event.relatedTarget)&&!menu.contains(document.activeElement))menu.open=false;
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.person-actions-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});});
document.addEventListener("click", async (event) => {
  activity.pulse();
  document.querySelectorAll('.person-actions-menu[open]').forEach(menu=>{if(!menu.contains(event.target)||event.target.closest('[data-action]'))menu.open=false;});
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
document.addEventListener('input', (event) => {
  if(event.target.closest('#set-form'))captureSetInputs();
  if(event.target.dataset.crop && imageEdit) { imageEdit.crop[event.target.dataset.crop]=Number(event.target.value); updateImageCrop(); }
  const form = event.target.closest('.admin-tag-form');
  if (!form) return;
  updateTagPreview(form);
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
    button = event.submitter || f.querySelector("[type=submit]");
  busy = true;
  button.disabled = true;
  try {
    if(f.id==='manual-set-form') {
      const name=String(v.get('exercise')||'');
      const data=manualSetData({exercise:name,exerciseKey:manualExerciseKey(name),weight:v.get('weight'),reps:Number(v.get('reps')),date:v.get('date')});
      const id=crypto.randomUUID(),now=Date.now(),record={...data,createdAt:now,updatedAt:now};
      await db.save(privatePath(`manualSets/${id}`),record);
      S.manualSets.push({...record,id});
      if(navigator.onLine)await db.publishProfileStats(S.sessions,S.manualSets);
      render();toast('Підхід збережено');
    }
    if(f.id==='measurement-form') {
      const data=measurementData(Object.fromEntries(v));
      const record={...data,updatedAt:Date.now()};
      await db.save(privatePath(`measurements/${data.date}`),record);
      S.measurements=[...S.measurements.filter((m)=>m.id!==data.date),{...record,id:data.date}];
      modal.close(); render(); toast('Приватні заміри збережено');
    }
    if(f.id==='report-form') {
      const added=await db.submitReport(f.dataset.target,f.dataset.profile,f.dataset.comment,String(v.get('reason')),String(v.get('detail')||''));
      modal.close(); toast(added ? 'Скаргу надіслано власнику.' : 'Ти вже надіслав скаргу на цей профіль або коментар.');
    }
    if(f.id==='training-invite-form') {
      const program=S.programs.find((p)=>p.id===v.get('program'));
      const plan=invitePlan(program,v.get('day'),String(v.get('date')),String(v.get('time')||''),String(v.get('note')||''));
      await db.sendTrainingInvite(f.dataset.to,plan); await refresh(); modal.close(); render(); toast('Запрошення надіслано Gym Bro');
    }
    if (f.matches('.admin-tag-form')) {
      if (!owner()) throw Error('Немає доступу.');
      const uid = f.dataset.user, index = +f.dataset.index;
      const labels = await db.getLive(`userLabels/${uid}`);
      const tags = [...(labels?.tags || [])];
      const tag = tagFromForm(f);
      if (index < 0) tags.push(tag);
      else if (tags[index]) tags[index] = tag;
      else throw Error('Тег уже змінено. Відкрий користувача знову.');
      await db.save(`userLabels/${uid}`, { tags: tagData(tags) });
      await adminUser(uid); toast('Тег збережено');
    }
    if (f.id === 'location-form') {
      const location = String(v.get('location') || '').trim();
      await db.patch(`publicProfiles/${S.user.uid}`, { location });
      S.selfPublic.location = location; S.people.person.location = location;
      render(); toast('Місцеположення збережено');
    }
    if (f.id === 'banner-form') await openImageCropper(f.elements.banner.files[0], 'banner');
    if(f.id==='profile-appearance-form') {
      const access=await db.getLive(`userAccess/${S.user.uid}`);
      if(!owner()&&!access?.profileCustomization)throw Error('Доступ до кастомізації вимкнено.');
      let image=f.elements.removeImage.checked?'':S.selfPublic?.appearance?.image||'';
      if(f.elements.backgroundImage.files[0])image=await prepareProfileBackground(f.elements.backgroundImage.files[0]);
      const appearance=profileAppearance({...Object.fromEntries(v),angle:Number(v.get('angle')),image});
      if(appearance.mode==='image'&&!appearance.image)throw Error('Обери фонове зображення.');
      await db.patch(`publicProfiles/${S.user.uid}`,{appearance});S.selfPublic.appearance=appearance;if(S.people?.uid===S.user.uid)S.people.person.appearance=appearance;render();toast('Оформлення профілю збережено');
    }
    if (f.id === 'bio-form') {
      const content=collectRichComment(f,{allowEmpty:true}),bio=content.text,bioRich=content.richText||'';
      await db.patch(`publicProfiles/${S.user.uid}`, { bio,bioRich });
      Object.assign(S.selfPublic,{bio,bioRich});Object.assign(S.people.person,{bio,bioRich});
      render(); toast('Опис збережено');
    }
    if(f.id==='nutrition-generator-form') {
      const input=nutritionFormInput(f);S.nutritionInput=input;
      f.classList.add('is-generating');f.setAttribute('aria-busy','true');
      button.querySelector('span').textContent='Підбираємо твій тиждень…';
      try { await new Promise(requestAnimationFrame);await createPersonalNutrition(input); }
      finally {f.classList.remove('is-generating');f.removeAttribute('aria-busy');const label=button.querySelector('span');if(label)label.textContent='Створити мій раціон';}
    }
    if (f.id === 'nutrition-plan-form') {
      if (!owner()) throw Error('Немає доступу');
      const plan = nutritionPlan({name:v.get('name'),description:v.get('description'),goal:v.get('goal'),diet:v.get('diet'),days:nutritionDays.map((_,d) => ({meals:mealNames.map((_,m) => Object.fromEntries(['name','ingredients','kcal','protein','fat','carbs'].map(key => [key,v.get(`meal-${d}-${m}-${key}`)])))}))});
      await db.save(`nutritionPlans/${f.dataset.id || crypto.randomUUID()}`,plan);
      modal.close(); await loadNutrition(); render(); toast('Меню збережено');
    }
    if(f.id==='profile-privacy-form') {
      await db.patch(`publicProfiles/${S.user.uid}`,{isPrivate:v.has('isPrivate')});
      await loadPeople();render();toast(v.has('isPrivate')?'Профіль закрито':'Профіль відкрито');
    }
    if (f.id === 'visibility-form') {
      const visibility = Object.fromEntries(Object.keys(profileVisibility({})).map((key)=>[key, v.has(key)]));
      await db.publishProfileStats(S.sessions,S.manualSets);
      await db.patch(`publicProfiles/${S.user.uid}`, { visibility });
      S.selfPublic.visibility = visibility; S.people.person.visibility = visibility;
      render(); toast('Видимість профілю збережено');
    }
    if (f.id === 'contacts-form') {
      const contacts = { instagram: contactURL('instagram', v.get('instagram')), telegram: contactURL('telegram', v.get('telegram')) };
      await db.patch(`publicProfiles/${S.user.uid}`, { contacts });
      S.people.person.contacts = contacts;
      render(); toast('Контакти збережено');
    }
    if (f.id === 'avatar-form') await openImageCropper(f.elements.avatar.files[0], 'avatar');
    if (f.id === 'find-person-form') {
      const number = String(v.get('number')).trim();
      if (!/^[1-9][0-9]{0,11}$/.test(number)) throw Error('Вкажи числовий ID користувача без #.');
      const record = await db.getLive(`userNumbers/${number}`);
      if (!record) throw Error('Користувача з таким ID не знайдено.');
      location.assign(profileURL(number));
    }
    if (f.id === 'profile-comment-form') {
      const comment=collectRichComment(f);
      const photo = await commentPhoto(v.get('photo'));
      await db.addProfileComment(profileUid(), comment.text, replyingTo || '', photo, comment.richText||'');
      replyingTo = null;
      await loadPeople(); render(); toast('Коментар додано');
    }
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
      requireHomeAccess(editor);
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
      if (!editorTemplate && editor.scope !== "home") {
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
      const warmup = event.submitter?.dataset.warmup === "1";
      const record = personalRecords(S.sessions.map((s) => s.id === current.id ? { ...s, status: 'completed' } : s)).find((r) => r.key === exerciseKey(item));
      const newRecord = !warmup && +v.get('reps') > 0 && (!record || +v.get('weight') > record.weight || +v.get('weight') === record.weight && +v.get('reps') > record.reps);
      const s = completeSet(current, +v.get("reps"), +v.get("weight"), metrics, warmup);
      await saveSession(s);
      toast(warmup ? "Розминочний підхід збережено" : newRecord ? '🏆 Новий найкращий результат! Заверши тренування, щоб зберегти рекорд.' : "Підхід збережено");
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
    if (f.id === 'public-rating-form') {
      const id = f.dataset.id, scope = communityScope(f.dataset.scope), score = reviewScore(v.get('score'));
      await db.save(`${scope}/${id}/ratings/${S.user.uid}`, { score, updatedAt: db.timestamp() });
      await db.recordActivity('rating', `${scope}/${id}`, `${score}/5`);
      await loadCommunity(id); toast('Публічну оцінку збережено');
    }
    if (f.id === 'comment-form') {
      const id = f.dataset.id, scope = communityScope(f.dataset.scope), score = reviewScore(v.get('score'));
      const comment=collectRichComment(f),commentId=crypto.randomUUID();
      await db.ensurePublicProfile(S.profile);
      const author = await db.getLive(`publicProfiles/${S.user.uid}`);
      await db.saveMany([
        [`${scope}/${id}/ratings/${S.user.uid}`, { score, updatedAt: db.timestamp() }],
        [`${scope}/${id}/comments/${commentId}`, { ...comment, score, authorId: S.user.uid, authorName: author.name, createdAt: db.timestamp() }],
      ]);
      await db.recordActivity('comment', `${scope}/${id}/comments/${commentId}`);
      clearRichComment(f);
      await loadCommunity(id); toast('Коментар опубліковано');
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
  if(event.target.closest("#nutrition-generator-form"))updateNutritionPreview(event.target);
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
  if(target.dataset.nutritionProduct){S.nutritionChecked=target.checked?[...new Set([...(S.nutritionChecked||[]),target.dataset.nutritionProduct])]:(S.nutritionChecked||[]).filter(id=>id!==target.dataset.nutritionProduct);saveNutritionChecks();const count=document.querySelector('[data-shopping-count]');if(count)count.textContent=`Куплено ${S.nutritionChecked.length} із ${S.nutritionResult.groceries.length}`;return;}
  if(target.closest('#nutrition-generator-form')){updateNutritionPreview(target);return;}
  if(target.id==='measurement-metric' || target.id==='measurement-period') {
    if(target.id==='measurement-metric')S.measurementMetric=target.value;else S.measurementPeriod=target.value;
    const panel=document.querySelector('#measurements-view');if(panel)panel.innerHTML=measurementsPanel();return;
  }
  if(target.id==='measurement-date' && !target.readOnly) {
    const record=S.measurements.find((m)=>m.date===target.value),form=target.form;
    for(const key of [...Object.keys(measurementFields),'note'])form.elements[key].value=record?.[key]??'';
    return;
  }
  if (target.id === "schedule-mode") {
    collectEditor();
    if (target.value === "week" && editor.days.length > 7) {
      target.value = "sequence"; toast("Для тижневого розкладу залиш до 7 днів."); return;
    }
    editor.scheduleMode = target.value;
    editor.days.forEach((d, n) => { d.weekday = n; });
    render(); return;
  }
  if (target.id === "builder-mode") {
    collectEditor(); editor.builderMode = target.value; render(); return;
  }
  if (target.id === "theme-select") {
    applyTheme(target.value); return;
  }
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
window.addEventListener("pagehide", () => { captureSetInputs(); persistEditorDraft(true); });
modal.addEventListener('close',disposeImageEdit);
document.addEventListener('change',(event)=>{if(event.target.id==='invite-program')updateInviteDays();});

window.addEventListener("nexus-sync", (event) => { S.syncError = event.detail.error || ""; updateSyncNotice(); });
window.addEventListener("offline", updateSyncNotice);
window.addEventListener("online", async () => {
  if (!S.user?.emailVerified || !db?.sync) return;
  try {
    await db.sync(); S.syncError = ""; await refresh();
    await db.publishProfileStats(S.sessions,S.manualSets).catch(()=>{});
    activity.pulse();
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
setInterval(() => activity.pulse(), 60000);
document.addEventListener("visibilitychange", () => activity.pulse());
document.addEventListener("input", () => activity.pulse());
let userLoadRevision = 0;
async function handleUser(user) {
  const revision = ++userLoadRevision;
  const isCurrent = () => revision === userLoadRevision && db.auth.currentUser?.uid === user?.uid;
  stopNotices?.(); stopNotices = null;
  S.notices = []; S.noticeError = ''; S.selfPublic = null; replyingTo = null;
  S.blocked=[]; S.blockedProfiles={}; S.reports=[]; S.reportProfiles={}; S.invites=[];
  editorDraftKey = "";
  editor = null;
  S.user = user;
  S.isOwner = false;
  S.nutritionInput={...generatorDefaults};S.nutritionResult=null;S.nutritionHydrated=false;S.nutritionShopping=false;S.nutritionEditing=false;S.nutritionChecked=[];
  S.nutritionPlans=[]; S.nutritionAccess=false; S.nutritionError=""; S.nutritionId=""; S.nutritionDay=0;
  S.homeAccess = false;
  S.customizationAccess=false;
  S.adminAccess = {};
  S.loaded = false;
  S.communityLoading = ['profile', 'settings'].includes(currentPage);
  S.publicProfileReady = false;
  S.route = currentPage;
  S.profile = null;
  S.people = null;
  S.programs = [];
  S.sessions = [];
  S.measurements=[];S.measurementsError='';
  S.manualSets=[];S.manualSetsError='';
  S.exercises = [];
  S.exercisePreferences = {};
  S.recordVisibility=null;
  S.adminUsers = [];
  S.adminStatsAt=0;
  S.templates = [];
  restoreDraft = null; S.syncError = ""; notifiedTimers.clear();
  incomingShare = null;
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
    const isOwner = await db.isOwner();
    if (!isCurrent()) return;
    S.isOwner = isOwner;
    const [profile] = await Promise.all([db.profile(user), refresh({ isCurrent })]);
    if (!isCurrent()) return;
    S.profile = profile;
    activity.pulse();
    if (currentPage === "editor") prepareEditor();
    expiredTimers(ongoing(), notifiedTimers);
    render();
    // Offline reads already include queued edits. Sending them must not hold up the page.
    const synced = db.sync().then(() => true).catch((error) => {
      if (isCurrent()) { S.syncError = err(error); updateSyncNotice(); }
      return false;
    });
    loadCommunityInBackground(isCurrent, synced).catch((error) => console.warn('Додаткові дані:', error.code || error.message));
    if (requestedShare()) await openIncomingShare();
  } catch (e) {
    if (!isCurrent()) return;
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
async function loadCommunityInBackground(isCurrent, synced) {
  const safety = navigator.onLine ? loadSafety(isCurrent).catch((error) => console.warn('Блокування:', error.code)) : Promise.resolve();
  safety.then(() => { if (isCurrent()) startNoticeWatch(); }).catch((error) => console.warn('Сповіщення:', error.code));
  if (navigator.onLine) {
    const ready = await db.ensurePublicProfile(S.profile).then(() => true).catch((error) => { console.warn('Профіль спільноти:', error.code); return false; });
    if (!isCurrent()) return;
    synced.then((success) => {
      if (!success || !isCurrent()) return;
      S.publicProfileReady = ready;
      if (ready) return db.publishProfileStats(S.sessions,S.manualSets);
    }).catch((error) => console.warn('Статистика профілю:', error.code));
  }
  if (!S.communityLoading || !isCurrent()) return;
  await safety;
  await loadPeople({ ensure: false, isCurrent, onIdentity: ({ uid, person }) => {
    if (!isCurrent() || !person) return;
    S.people = { uid, person, loading: true };
    render();
  } });
  if (!isCurrent()) return;
  S.communityLoading = false;
  render();
  if (currentPage === 'profile' && S.people?.person?.customId && (requestedProfileNumber() || new URLSearchParams(location.search).has('uid'))) {
    window.history.replaceState(null, '', profileURL(S.people.person.customId) + location.hash);
  }
  if (location.hash.startsWith('#comment-')) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'center' });
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
