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
  templates: [],
  settings: { name: "Nexus GymB", description: "", announcement: "" },
  route: document.body.dataset.page || "home",
  filter: "Усі",
  query: "",
  loaded: false,
};
let db,
  editor,
  editorTemplate = false,
  chosenDay = null,
  busy = false,
  bootError = "",
  authMode = { register: "register", reset: "reset" }[document.body.dataset.page] || "login",
  authNotice = "",
  unsubscribeAuth;
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
  const register = authMode === "register",
    reset = authMode === "reset";
  return `
    <section class="auth-panel">
      <div class="auth-tabs">
        ${btn("Вхід", "auth-mode", 'data-id="login"', authMode === "login" ? "" : "ghost")}${btn(
          "Реєстрація",
          "auth-mode",
          'data-id="register"',
          register ? "" : "ghost",
        )}
      </div>
      <h1>${reset ? "Відновити пароль" : register ? "Створи акаунт" : "Вхід"}</h1>
      ${
        reset
          ? `
            <p class="muted small">Вкажи email, щоб отримати посилання для зміни пароля.</p>
          `
          : ""
      }${
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
                <input name="name" autocomplete="name" maxlength="100" required />
              </label>
            `
            : ""
        }
        <label>
          Email
          <input type="email" name="email" autocomplete="email" maxlength="320" required />
        </label>
        ${
          reset
            ? ""
            : `
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
            `
        }${
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
          ${reset ? "Надіслати посилання" : register ? "Зареєструватися" : "Увійти"}
        </button>
        <div class="form-error" role="alert"></div>
      </form>
      ${
        !reset
          ? btn("Забув пароль?", "auth-mode", 'data-id="reset"', "auth-link")
          : btn("Повернутися до входу", "auth-mode", 'data-id="login"', "auth-link")
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
  register: "register.html",
  reset: "reset.html",
  verify: "verify.html",
};
const currentPage = document.body.dataset.page || "login";
const authPages = ["login", "register", "reset", "verify"];
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
function prepareEditor() {
  const q = new URLSearchParams(location.search);
  editorTemplate = q.get("template") === "1";
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
  if (!editor) {
    S.route = editorTemplate ? "admin" : "program";
    toast("Програму не знайдено.");
  }
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
    ...(owner() ? [["admin", "Керування"]] : []),
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
      <div id="offline">
        ${
          !navigator.onLine
            ? `
              <div class="error">
                Немає мережі. Збереження буде доступне після відновлення з’єднання.
              </div>
            `
            : ""
        }
      </div>
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
    if (!authPages.includes(currentPage) || currentPage === "verify") {
      navigate("login");
      return;
    }
    login();
    return;
  }
  if (!S.user.emailVerified) {
    if (currentPage !== "verify") {
      navigate("verify");
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
        ? `?${new URLSearchParams({ ...(editor?.id ? { id: editor.id } : {}), ...(editorTemplate ? { template: "1" } : {}) })}`
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
function exerciseRows(items) {
  return items
    .map(
      (i, n) => `
        <div class="exercise-row">
          <span class="number">${String(n + 1).padStart(2, "0")}</span>
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
          </div>
          <button
            class="info"
            data-action="detail"
            data-id="${esc(i.exerciseId)}"
            aria-label="Як виконувати ${esc(i.name)}"
          >
            i
          </button>
        </div>
      `,
    )
    .join("");
}
function home() {
  const p = active(),
    today = schedule(p),
    d = chosenDay !== null ? schedule(p, chosenDay) : today || nextDay(p),
    session = ongoing(),
    completed = S.sessions.filter((s) => s.status === "completed");
  return (
    heading(`Привіт, ${esc(S.user.displayName?.split(" ")[0] || "спортсмене")} 👋`, "") +
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
                      ${schedule(p, n) ? "<i></i>" : ""}
                    </button>
                  `;
                })
                .join("")}
            </div>
          </section>
          <section class="card">
            <div class="sectionhead">
              <h2>${d ? esc(d.name) : "Вправи за планом"}</h2>
              <span class="small muted">${d ? days[d.weekday] : ""}</span>
            </div>
            ${
              d
                ? exerciseRows(d.items) +
                  (d.items.length && chosenDay !== null
                    ? btn("Почати цей день", "start", `data-day="${d.weekday}"`, "secondary")
                    : d.items.length
                      ? ""
                      : empty("Додай вправи", "Відкрий програму та вибери вправи з каталогу."))
                : `
                  <p class="muted small">Додай програму, щоб побачити свій план.</p>
                `
            }
          </section>
        </div>
        <div class="stack" style="align-content:start">
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
            <h2>Останні тренування</h2>
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
    heading("Твоя програма", "Дні тренувань та вправи.", btn("＋ Нова програма", "new-program")) +
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
                          <div class="exercise-row">
                            <span class="number">${dayCodes[d.weekday]}</span>
                            <div class="grow">
                              <h3>${esc(d.name)}</h3>
                              <p>${esc(d.groups)} · ${d.items.length} вправ</p>
                            </div>
                            ${btn(
                              "Почати",
                              "start",
                              `data-program="${p.id}" data-day="${d.weekday}"`,
                              "secondary",
                            )}
                          </div>
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
  return (
    heading("Бібліотека руху", "Інструкції до вправ і тренажерів.") +
    `
      <input
        id="search"
        type="search"
        aria-label="Пошук вправ"
        placeholder="Пошук вправи або тренажера…"
        value="${esc(S.query)}"
      />
      <div class="filters">
        ${["Усі", ...groups]
          .map(
            (g) => `
              <button
                class="chip ${S.filter === g ? "active" : ""}"
                data-action="filter"
                data-id="${g}"
              >
                ${g}
              </button>
            `,
          )
          .join("")}
      </div>
      <div id="catalog-results">${catalogResults()}</div>
    `
  );
}
function catalogResults() {
  const list = S.exercises.filter(
    (e) =>
      !e.archived &&
      (S.filter === "Усі" || e.primary === S.filter) &&
      `${e.name} ${e.equipment}`.toLowerCase().includes(S.query.toLowerCase()),
  );
  return list.length
    ? `
        <div class="catalog">
          ${list
            .map(
              (e) => `
                <button class="card exercise-card" data-action="detail" data-id="${e.id}">
                  <span class="number">${icon("exercises")}</span>
                  <h3>${esc(e.name)}</h3>
                  <p>${esc(e.primary)} · ${esc(e.equipment)}</p>
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
              ? "Зміни пошуковий запит або м’язову групу."
              : "Власник має додати вправи до спільного каталогу.",
          )}
        </section>
      `;
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
function programEditor() {
  return (
    heading(
      editorTemplate ? "Шаблон програми" : "Редактор програми",
      "Дні, вправи та навантаження — під твої цілі.",
    ) +
    `
      <form id="program-form" class="card">
        <div class="formgrid">
          ${field("Назва", "name", editor.name, "text", 'required maxlength="100"')}
          <label>
            Тип програми
            <select name="type">
              ${options(types, editor.type)}
            </select>
          </label>
        </div>
        <div id="days-editor">
          ${editor.days
            .map(
              (d, n) => `
                <section class="day-editor">
                  <div class="sectionhead">
                    <h2>День ${n + 1}</h2>
                    <button type="button" class="mini-btn" data-action="remove-day" data-n="${n}">
                      Прибрати день
                    </button>
                  </div>
                  <div class="formgrid">
                    <label>
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
                            <b>${j + 1}. ${esc(i.name)}</b>
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
                          ${metricEditor(i, n, j)}
                        </div>
                      `,
                    )
                    .join("")}
                  <div class="row wrap">
                    <label style="flex:1;margin:10px 0">
                      Додати з каталогу
                      <select id="add-${n}">
                        <option value="">Оберіть вправу</option>
                        ${S.exercises
                          .filter((e) => !e.archived)
                          .map(
                            (e) => `
                              <option value="${e.id}">${esc(e.name)}</option>
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
                </section>
              `,
            )
            .join("")}
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn ghost"
            data-action="add-day"
            ${editor.days.length >= 7 ? "disabled" : ""}
          >
            ＋ Додати день
          </button>
          <button class="btn" type="submit">Зберегти програму</button>
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
  editor.name = v.get("name");
  editor.type = v.get("type");
  editor.days.forEach((d, n) => {
    d.weekday = +v.get(`day-${n}`);
    d.name = v.get(`dayname-${n}`);
    d.groups = v.get(`groups-${n}`);
    d.items.forEach((i, j) => {
      for (const k of ["sets", "reps", "seconds", "weight", "rest", "note"])
        i[k] = ["reps", "note"].includes(k) ? v.get(`${k}-${n}-${j}`) : +v.get(`${k}-${n}-${j}`);
      i.metrics = (i.metrics || []).map((m, k) => ({
        name: String(v.get(`metric-name-${n}-${j}-${k}`) || "").trim(),
        value: String(v.get(`metric-value-${n}-${j}-${k}`) || "").trim(),
        unit: String(v.get(`metric-unit-${n}-${j}-${k}`) || "").trim(),
      }));
    });
  });
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
        <section class="card">
          <h2>Історія тренувань</h2>
          ${history(
            S.sessions
              .filter((s) => s.status === "completed")
              .sort((a, b) => b.startedAt - a.startedAt),
          )}
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
  const i = s.items[s.index],
    count = s.logs.filter((l) => l.index === s.index).length;
  return `
    <div class="session">
      ${heading(
        s.name,
        `Вправа ${s.index + 1} із ${s.items.length}`,
        btn("Згорнути", "route", 'data-id="home"', "ghost"),
      )}
      <div class="progress"><div style="width:${(s.index / s.items.length) * 100}%"></div></div>
      <section class="card">
        <span class="badge">${esc(i.primary || "Тренування")}</span>
        <h2 class="workout-title" style="margin-top:20px">${esc(i.name)}</h2>
        ${
          safeURL(i.snapshot?.image)
            ? `
              <img
                class="workout-image"
                src="${esc(safeURL(i.snapshot.image))}"
                alt="${esc(i.name)}"
              />
            `
            : ""
        }
        <p class="muted">
          ${i.sets} підходи ·
          ${i.seconds ? `${i.seconds} сек` : esc(i.reps) + " повторень"}${
            i.weight ? ` · ${i.weight} кг` : ""
          }
        </p>
        ${
          i.note
            ? `
              <div class="notice">${esc(i.note)}</div>
            `
            : ""
        }${btn(
          "Як виконувати",
          "detail",
          `data-id="${esc(i.exerciseId)}" data-session="1"`,
          "secondary",
        )}
        <div class="setdots">
          ${Array.from(
            { length: i.sets },
            (_, n) => `
              <span class="setdot ${n < count ? "done" : ""}">${n < count ? "✓" : n + 1}</span>
            `,
          ).join("")}
        </div>
        ${
          i.seconds
            ? `
              <div class="timer" data-end="${s.timerEnd}" data-default="${i.seconds}">
                ${clock(s.timerEnd ? remaining(s.timerEnd) : i.seconds)}
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
        <form id="set-form" style="margin-top:22px">
          ${actualMetrics(i, s)}
          <div class="formgrid">
            ${field(
              "Фактичні повторення",
              "reps",
              i.seconds ? 0 : parseInt(i.reps) || 0,
              "number",
              'min="0" max="1000" required',
            )}${field(
              "Вага, кг",
              "weight",
              i.weight,
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
      </div>
    </div>
  `;
}
function admin() {
  if (!owner()) return empty("Немає доступу", "Цей розділ доступний лише власнику.");
  return (
    heading("Керування", "Каталог, шаблони та налаштування сайту.") +
    `
      <div class="stack">
        <section class="card">
          <h2>Наповнення каталогу</h2>
          <p class="muted">
            Можна додати початкові демонстраційні вправи та шаблони один раз. Наявні записи не
            перезаписуються.
          </p>
          <div class="actions">
            ${btn("＋ Додати вправу", "new-exercise")}${btn(
              "Додати приклади",
              "seed",
              "",
              "secondary",
            )}
          </div>
          ${S.exercises
            .map(
              (e) => `
                <div class="exercise-row">
                  <div class="grow">
                    <h3>${esc(e.name)}</h3>
                    <p>${esc(e.primary)}${e.archived ? " · В архіві" : ""}</p>
                  </div>
                  <div class="actions">
                    ${btn("Змінити", "edit-exercise", `data-id="${e.id}"`, "ghost")}${btn(
                      e.archived ? "Відновити" : "Архівувати",
                      "archive-exercise",
                      `data-id="${e.id}"`,
                      "ghost",
                    )}
                  </div>
                </div>
              `,
            )
            .join("")}
        </section>
        <section class="card">
          <div class="sectionhead">
            <h2>Шаблони</h2>
            ${btn("＋ Новий шаблон", "new-template")}
          </div>
          ${S.templates
            .map(
              (t) => `
                <div class="exercise-row">
                  <div class="grow">
                    <h3>${esc(t.name)}</h3>
                    <span class="muted small">${t.archived ? "В архіві" : t.type}</span>
                  </div>
                  ${btn("Редагувати", "edit-template", `data-id="${t.id}"`, "ghost")}${btn(
                    t.archived ? "Відновити" : "Архівувати",
                    "archive-template",
                    `data-id="${t.id}"`,
                    "ghost",
                  )}
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
function openModal(html) {
  modal.innerHTML = html;
  if (!modal.open) modal.showModal();
}
function detail(id, fromSession = false) {
  let e = S.exercises.find((x) => x.id === id);
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
    <div class="sectionhead">
      <h2>${esc(e.name)}</h2>
      <button class="mini-btn" data-action="close">Закрити</button>
    </div>
    <span class="badge">${esc(e.primary)}</span>
    ${
      safeURL(e.image)
        ? `
          <p><img src="${esc(safeURL(e.image))}" alt="${esc(e.name)}" /></p>
        `
        : ""
    }${[
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
              <h3>${title}</h3>
              <p>${esc(text)}</p>
            `
          : "",
      )
      .join("")}
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
  `);
}
function exerciseForm(e = {}) {
  openModal(`
    <div class="sectionhead">
      <h2>${e.id ? "Редагувати" : "Нова"} вправа</h2>
      <button class="mini-btn" data-action="close">Закрити</button>
    </div>
    <form id="exercise-form" data-id="${esc(e.id || "")}">
      ${field("Назва", "name", e.name, "text", 'required maxlength="100"')}${field(
        "Обладнання",
        "equipment",
        e.equipment,
        "text",
        'required maxlength="100"',
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
              <textarea name="${k}" maxlength="4000" ${k === "technique" ? "required" : ""}>
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
  const [programs, sessions, exercises, templates, settings] = await Promise.all([
    db.list(privatePath("programs")),
    db.list(privatePath("sessions")),
    db.list("exercises"),
    db.list("programTemplates"),
    db.get("settings/site"),
  ]);
  Object.assign(S, {
    programs,
    sessions,
    exercises,
    templates,
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
    case "auth-mode":
      await navigate(id);
      break;
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
      await db.logout();
      break;

    case "route":
      if (S.route === "editor" && !confirm("Вийти з редактора без збереження?")) return;
      S.route = id;
      chosenDay = null;
      render();
      window.scrollTo(0, 0);
      break;
    case "day":
      chosenDay = +b.dataset.day;
      render();
      break;
    case "filter":
      S.filter = id;
      render();
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
        ${s.items
          .map(
            (i, k) => `
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
                      кг${i.seconds ? ` · план ${i.seconds} сек` : ""}
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
    case "new-program":
    case "new-template":
    case "edit-program":
    case "edit-template":
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
      if (confirm("Скасувати незбережені зміни?")) {
        S.route = editorTemplate ? "admin" : "program";
        render();
      }
      break;
    case "add-day":
      collectEditor();
      editor.days.push({
        weekday: [0, 1, 2, 3, 4, 5, 6].find((x) => !editor.days.some((d) => d.weekday === x)),
        name: "Тренування",
        groups: "",
        items: [],
      });
      render();
      break;
    case "remove-day":
      collectEditor();
      editor.days.splice(n, 1);
      render();
      break;
    case "add-item": {
      const e = S.exercises.find((x) => x.id === document.querySelector(`#add-${n}`).value);
      if (!e) throw Error("Спочатку оберіть вправу.");
      collectEditor();
      const timed = ["Кардіо", "Розминка"].includes(e.primary);
      editor.days[n].items.push({
        exerciseId: e.id,
        name: e.name,
        primary: e.primary,
        sets: timed ? 1 : 3,
        reps: timed ? "" : "10–12",
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
      if (!d?.items.length) throw Error("Додай вправи до цього дня у редакторі програми.");
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
    case "timer": {
      const s = copy(ongoing());
      s.timerEnd = Date.now() + s.items[s.index].seconds * 1000;
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
    case "seed": {
      if (
        !owner() ||
        !confirm("Додати демонстраційні вправи та шаблони без зміни наявних записів?")
      )
        return;
      const { seedEntries } = await import("./seed.js");
      await db.seed(seedEntries);
      await refresh();
      render();
      toast("Приклади додано");
      break;
    }
  }
}
document.addEventListener("click", async (event) => {
  const b = event.target.closest("[data-action]");
  if (!b || b.disabled || busy) return;
  busy = true;
  b.disabled = true;
  try {
    await action(b.dataset.action, b);
  } catch (e) {
    if (b.dataset.action === "login")
      document.querySelector("#login-error").innerHTML = `
        <div class="error">${esc(err(e))}</div>
      `;
    else toast(err(e));
  } finally {
    busy = false;
    if (b.isConnected) b.disabled = false;
  }
});
document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const f = event.target,
    v = new FormData(f),
    button = f.querySelector("[type=submit]");
  busy = true;
  button.disabled = true;
  try {
    if (f.id === "auth-form") {
      if (!db) throw Error("Зачекай на підключення Firebase.");
      const email = String(v.get("email") || "").trim(),
        password = String(v.get("password") || "");
      if (authMode === "reset") {
        await db.resetPassword(email);
        authNotice = "Якщо ця пошта зареєстрована, на неї надійде лист для відновлення пароля.";
        login();
      } else if (authMode === "register") {
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
      if (!validProgram(editor))
        throw Error("Перевір назву, дні без повторень і допустимі параметри вправ.");
      const id = editor.id || crypto.randomUUID(),
        data = { ...stripId(editor), updatedAt: Date.now(), archived: editor.archived || false };
      if (editorTemplate && !owner()) throw Error("Немає доступу");
      await db.save(
        editorTemplate ? `programTemplates/${id}` : privatePath(`programs/${id}`),
        data,
      );
      if (!editorTemplate) {
        await db.patch(`users/${S.user.uid}`, { activeProgramId: id });
        S.profile.activeProgramId = id;
      }
      await refresh();
      S.route = editorTemplate ? "admin" : "program";
      render();
      toast("Програму збережено");
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
    if (f.id === "exercise-form") {
      if (!owner()) throw Error("Немає доступу");
      const data = Object.fromEntries(v),
        old = S.exercises.find((e) => e.id === f.dataset.id);
      for (const k of ["image", "video"])
        if (data[k] && !safeURL(data[k])) throw Error("Посилання повинне починатися з https://");
      data.archived = old?.archived || false;
      data.updatedAt = Date.now();
      await db.save(`exercises/${f.dataset.id || crypto.randomUUID()}`, data);
      await refresh();
      modal.close();
      render();
      toast("Вправу збережено");
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
document.addEventListener("input", (event) => {
  if (event.target.id === "search") {
    S.query = event.target.value;
    document.querySelector("#catalog-results").innerHTML = catalogResults();
  }
});

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  const card = document.querySelector(".auth-card");
  card?.getAnimations().forEach((animation) => animation.cancel());
});

window.addEventListener("offline", () => {
  const e = document.querySelector("#offline");
  if (e)
    e.innerHTML = `
      <div class="error">Немає мережі. Не закривай сторінку до збереження змін.</div>
    `;
});
window.addEventListener("online", () => {
  const e = document.querySelector("#offline");
  if (e) e.innerHTML = "";
  toast("З’єднання відновлено. Можна зберігати зміни.");
});
setInterval(
  () =>
    document.querySelectorAll("[data-end]").forEach((e) => {
      const end = +e.dataset.end;
      e.textContent = clock(end ? remaining(end) : +e.dataset.default || 0);
    }),
  1000,
);
async function handleUser(user) {
  S.user = user;
  S.isOwner = false;
  S.loaded = false;
  S.route = currentPage;
  S.profile = null;
  S.programs = [];
  S.sessions = [];
  S.exercises = [];
  S.templates = [];
  modal.close();
  if (!user || !user.emailVerified || authPages.includes(currentPage)) {
    render();
    return;
  }
  render();
  try {
    S.isOwner = await db.isOwner();
    S.profile = await db.profile(user);
    await refresh();
    if (db.auth.currentUser?.uid !== user.uid) return;
    if (currentPage === "editor") prepareEditor();
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
boot();
