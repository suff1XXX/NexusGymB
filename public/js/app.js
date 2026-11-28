import {createActionUndo,undoSignature} from './action-undo.js';
import {warmupTemplateData,applyWarmupTemplate} from './warmup-templates.js';
import {captureWorkoutPlan} from './plan-actual.js';
import {undoActionCard,planActualCard,warmupLibrary} from './workout-tools-view.js';
import {exerciseDone,pendingExercises,nextExerciseChoices,deferExercise,resumeExercise,skipExercise,skipReasons} from './workout-queue.js';
import {deferPicker,deferredPanel,skipPicker,skipDetail,gymBroTurnsPanel,nextExerciseLabel} from './workout-flow-view.js';
import {workoutSetToken} from './gymbro-turns.js';
import {gymPanels,gymPreferences,readGymPreferences,saveGymPreferences,gymTimerSession,mountGymMode,createGymWakeLock} from './gym-mode.js';
import {gymControls,gymSettings} from './gym-mode-view.js';
import {profileMusicData} from './profile-music.js';
import {profileMusicCard,profileMusicEditor,playlistPlayer} from './profile-music-view.js';
import {supportInbox,supportComposer,supportConversation,supportMessages,supportStatus} from './support-view.js';
import {fitWorkoutToTime} from './workout-planning.js';
import {monthlySummary,monthlySnapshot} from './monthly-summary.js';
import {monthlySummaryCard,monthLabel} from './monthly-summary-view.js';
import {deviceTimeZone,formatInstant,formatScheduledTime,scheduledInstant} from './time.js';
import {sessionsForProfile,manualSetsForProfile,privateRecordsForProfile,profileRecordId} from './training-profile-data.js';
import {ui,uiText,uiLocale,getLanguage,setLanguage,languageFooter,localizedDayLabel} from './i18n.js';
import { weightBasisLabels, weightDetails, totalWeight, sameWeightDetails } from './weight-details.js';
import { defaultPlates, plateInventory, calculatePlates } from './plate-calculator.js';
import { calendarSharing, calendarScopeLabels } from './calendar-privacy.js';
import { defaultTrainingProfile, defaultProfileId, trainingProfileLimit, trainingProfiles, profileName, profileContext, contextProfileId, availableProfiles, profileLabel, profileForContext, assertProfileAvailable, withProfileLoad, initialProfileLoads, completedProfileLoads, applyTrainingProfile, normalizeProfileContexts } from './training-profiles.js';
import { authText, authError, authFailure, mountAuthPage, languageFlag } from './auth-page.js';
import { isWorkingSet, nextWeightSuggestion, supersetPartner, configureSuperset, appendDropSet } from './training-methods.js';
import { parseReps, repsLabel, machineName, sameMachine } from './repetitions.js';
import {exerciseNoteId,exerciseNoteData} from './exercise-notes.js';
import { exportCatalog, catalogImportPlan, catalogJsonLimit } from './catalog-json.js';
import { parseWeight, weightLabel, simpleDone, resetExercise, removeWorkoutLog, saveQuickResult, finishChecklist, alternatives } from './workout-modes.js';
import {richComposer,mountRichEditors,disposeRichEditors,collectRichComment,renderComment,captureCommentDraft,restoreCommentDraft,clearRichComment} from './rich-editor.bundle.js';
import {installReactionInteractions} from './reaction-interactions.js';
import {generatorDefaults,generatorInput,estimateNutrition,generateNutrition} from './nutrition-generator.js';
import {nutritionStudio} from './nutrition-view.js';
import { nutritionDays, mealNames, nutritionGoals, nutritionDiets, nutritionPlan, dayNutrition, shoppingList, menuText, sampleNutritionPlan } from './nutrition.js';
import { exerciseData, parseImport, importExample } from "./import.js";
import { commentRatings, ratingSummary, reviewScore, reactions, reactionLabels, commentPhoto } from "./social.js";
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
import { appearanceDefaults,appearanceChoices,appearancePresets,profileAppearance,appearanceStyle,appearanceData,readableText,profileHeaderAppearance,applyProfilePageAppearance } from './profile-appearance.js';
import { loginIpHistory } from "./login-metadata.js";
import { profileVisibility, profileSnapshots, recordSharingKeys, commentThreads } from "./profile-data.js";
import { appBase, profileNumber, profileURL } from "./routes.js";
import { tagData, tagStyle, tagTemplates } from "./user-tags.js";
import { saveSetDraft, loadSetDraft, clearSetDraft, rememberExecutionMode, preferredExecutionMode } from './workout-recovery.js';
import { invitePlan } from './training-invites.js';
import { drawProfileCrop } from './profile-image-editor.js';
import { reportReasons } from './community-safety.js';
import { workoutSummary } from './workout-summary.js';
import {weekStart,shiftDate,profileLayout,profileBlocks,defaultBlockOrder} from './training-experience.js';
import {weeklyGoalCard,comparisonCard,reflectionCard,challengesCard,achievementHistory,layoutEditor} from './training-experience-view.js';
import {repetitionRecords,sessionScope,replaceForToday,restoreForToday,replacementReasons,activityRegistrationDay} from './workout-additions.js';
import {repetitionRecordsCard,activityCalendar,sharedActivityCalendar,replacementBanner,meetingPollsCard} from './workout-additions-view.js';
import { measurementData, measurementFields, measurementSeries } from './body-measurements.js';
import { manualSetData, progressSessions } from './manual-sets.js';
import { adminStats } from './admin-stats.js';
import { achievementCatalog,achievementSelection } from './achievement-catalog.js';
import { achievementsScreen,achievementShowcase,medalIcon } from './achievement-view.js';
import {renderAvatar} from './avatars.js';
import {exerciseResults} from './exercise-results.js';
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
let gymWakeStatus='off';
function updateGymWakeStatus() {
  const text={active:'Екран залишається увімкненим',unsupported:'Браузер не підтримує утримання екрана',unavailable:'Утримання екрана недоступне',released:'Екран може згаснути',off:''}[gymWakeStatus]||'';
  document.querySelectorAll('[data-gym-awake]').forEach(node=>{node.textContent=uiText(text);});
}
const gymWakeLock=createGymWakeLock(globalThis,status=>{gymWakeStatus=status;updateGymWakeStatus();});
const actionUndo=createActionUndo(sessionStorage);
let warmupTarget='library',warmupDay=0;
function availableUndo(){
  if(!S.user||!S.loaded||['achievements','admin'].includes(S.route))return null;
  const entry=actionUndo.read(S.user.uid);if(!entry)return null;
  const records=entry.type==='warmup'?S.warmupTemplates:S.sessions,current=records.find(record=>record.id===entry.id)||null;
  if(!actionUndo.matches(entry,current)){actionUndo.clear(S.user.uid);return null;}return entry;
}
function openWarmupLibrary(target='library',day=0,editing=null){
  if(S.warmupTemplatesError){openModal(`<h2>Шаблони розминки</h2><p class="error">${esc(S.warmupTemplatesError)}</p>${btn('Спробувати знову','reload')}`);return;}
  warmupTarget=['builder','session'].includes(target)?target:'library';warmupDay=Number(day)||0;
  const draft=warmupTarget==='builder'?editor?.days[warmupDay]?.warmup||'':ongoing()?.warmup||'';
  openModal(warmupLibrary(S.warmupTemplates,{target:warmupTarget,day:warmupDay,draft,editing,undo:availableUndo()}),'warmup-library-title','warmup-library-dialog');
}
async function undoLastAction(){
  const entry=availableUndo();if(!entry)throw Error('Немає дії для скасування.');
  const collection=entry.type==='warmup'?'warmupTemplates':'sessions';
  if(navigator.onLine){const saved=await db.getLive(privatePath(`${collection}/${entry.id}`));if(!actionUndo.matches(entry,saved?{...saved,id:entry.id}:null)){actionUndo.clear(S.user.uid);render();throw Error('Дані вже змінено. Попередню дію не можна скасувати.');}}
  let restored=entry.before?copy(entry.before):null;
  if(entry.type==='session'&&restored?.status==='active'&&S.sessions.some(session=>session.status==='active'&&session.id!==entry.id))throw Error('Спочатку заверши інше активне тренування.');
  if(restored){restored.updatedAt=Date.now();if(entry.type==='session'){restored.restEnd=0;restored.timerEnd=0;}await db.save(privatePath(`${collection}/${entry.id}`),stripId(restored));}
  else await db.remove(privatePath(`${collection}/${entry.id}`));
  if(entry.type==='warmup')S.warmupTemplates=[...S.warmupTemplates.filter(item=>item.id!==entry.id),...(restored?[restored]:[])];
  else {
    S.sessions=[...S.sessions.filter(item=>item.id!==entry.id),...(restored?[restored]:[])];
    for(const change of entry.profiles||[]){const current=S.trainingProfiles.find(profile=>profile.id===change.before.id);if(current&&undoSignature(current.loads)===undoSignature(change.after.loads)){const profile={...current,loads:change.before.loads,updatedAt:Date.now()};await db.save(privatePath(`trainingProfiles/${profile.id}`),stripId(profile));S.trainingProfiles=S.trainingProfiles.map(value=>value.id===profile.id?profile:value);}}
    if(restored?.status==='active'){S.summaryId='';S.workoutDiscarded=false;if(availableProfiles(S.trainingProfiles,S.trainingProfileLimit).some(profile=>profile.id===restored.trainingProfileId))S.activeTrainingProfileId=restored.trainingProfileId;if(currentPage==='session')window.history.replaceState(null,'',new URL('workout.html',appBase));}
    try{clearSetDraft(localStorage,S.user.uid,entry.id);}catch{}
  }
  actionUndo.clear(S.user.uid);render();
  if(entry.type==='warmup'&&modal.open)openWarmupLibrary(warmupTarget,warmupDay);
  if(entry.type==='session'&&navigator.onLine){db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions()).catch(()=>{});db.refreshAchievements().catch(()=>{});}
  toast('Останню дію скасовано');
}
function ownStreakSessions(){return S.sharedStreak?S.sessions:profileSessions();}
const gymPrefs=()=>readGymPreferences(localStorage,S.user?.uid||'guest');
let turnWatch=null,turnKey='',turnValue=null,turnLoading=false,turnError='';
function stopTurnWatch(){turnWatch?.();turnWatch=null;turnKey='';turnValue=null;turnError='';turnLoading=false;}
function turnPanel(session){return `<div data-gymbro-turns>${gymBroTurnsPanel(session,S.user.uid,turnValue,{loading:turnLoading,error:turnError,online:navigator.onLine})}</div>`;}
function updateTurnPanel(){const session=ongoing(),box=document.querySelector('[data-gymbro-turns]');if(box&&session)box.innerHTML=gymBroTurnsPanel(session,S.user.uid,turnValue,{loading:turnLoading,error:turnError,online:navigator.onLine});}
window.addEventListener('online',()=>updateTurnPanel());
window.addEventListener('offline',()=>updateTurnPanel());
function syncTurnWatch(){
  const session=S.user&&S.loaded&&S.route==='session'&&document.querySelector('.workout-studio')?ongoing():null;
  const key=session?.invitationId&&session.gymBroId?`${S.user.uid}:${session.invitationId}`:'';
  if(key===turnKey)return;
  stopTurnWatch();if(!key)return;turnKey=key;turnLoading=true;updateTurnPanel();
  turnWatch=db.watchWorkoutTurns(session.invitationId,value=>{if(turnKey!==key)return;turnValue=value;turnLoading=false;turnError='';updateTurnPanel();},()=>{if(turnKey!==key)return;turnLoading=false;turnError='Не вдалося оновити чергу. Перевір з’єднання.';updateTurnPanel();});
}

const experienceStyles=document.createElement('link');experienceStyles.rel='stylesheet';experienceStyles.href=new URL('../training-experience.css',import.meta.url).href;document.head.append(experienceStyles);
const root = document.querySelector("#app"),
  modal = document.querySelector("#modal");
const requestedCalendar = new URLSearchParams(location.search).get('date') || '';
const initialCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedCalendar) && Number.isFinite(Date.parse(requestedCalendar))
  && localDate(new Date(`${requestedCalendar}T12:00:00`)) === requestedCalendar ? requestedCalendar : localDate();
function achievementMotionPaused() { try { return localStorage.getItem('nexus:achievements-motion')==='paused'; } catch { return false; } }
const S = {
  monthSummaryMonth:localDate().slice(0,7),
  achievements:{progress:null,display:{selectedIds:[],rankingEnabled:false},leaders:[],motionPaused:achievementMotionPaused(),onlyEarned:false,dirty:false,loading:false,error:'',leaderError:''},
  isOwner: false,
  trainingProfiles:[defaultTrainingProfile()],trainingProfilesStoredIds:[],activeTrainingProfileId:defaultProfileId,trainingProfileLimit:3,trainingProfilesError:'',
  homeAccess: false,
  customizationAccess:false,
  adminAccess: {},
  user: null,authReady:false,
  profile: null,
  programs: [],
  sessions: [],
  publicActivityYear:Number(localDate().slice(0,4)),recordReps:5,activityYear:Number(initialCalendarDate.slice(0,4)),activityFilter:'all',meetingPolls:[],weeklyGoals:[],reflections:[],challenges:[],achievementEvents:[],trainingExtrasError:'',comparisonIds:{},
  measurements: [],
  measurementsError: '',
  manualSets: [],
  manualSetsError: '',
  measurementMetric: 'weight',
  measurementPeriod: '90',
  summaryId: new URLSearchParams(location.search).get('summary') || '',
  workoutDiscarded: false,
  exercises: [],
  exercisePreferences: {},
  exerciseNotes: {},
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
  progressSource: "all",
  progressMachine: "*",
  historyFilters: { query: "", from: "", to: "", exercise: "" },
  timerSound: true,
  timerVibration: false,
  syncError: "",
  people: null,
  selfPublic: null,sharedStreak:false,warmupTemplates:[],warmupTemplatesError:'',
  notices: [],
  noticeHasMore:false,noticeOlder:[],noticeOldestId:"",
  noticeError: '',
  settingsSection: new URLSearchParams(location.search).get('focus')==='music'?'user':(['user','appearance','privacy','security'].includes(new URLSearchParams(location.search).get('section'))?new URLSearchParams(location.search).get('section'):'user'),
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
  catalogJsonDraft = null,
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
let supportStops=[],supportRevision=0;
let stopAchievementWatch = null,stopMedalEvents=null;
let imageEdit = null;
let plateCalculation=null,plateCalculationTarget=null;
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
  achievements:'<path d="m7 3 5 8 5-8M5 3h14l-4 9H9z"/><circle cx="12" cy="16" r="5"/><path d="m12 13 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 15.3l2-.3z"/>',
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
const profileSessions=()=>sessionsForProfile(S.sessions,S.activeTrainingProfileId,S.trainingProfiles);
const profileCalendarSessions=()=>profileSessions().map(session=>{
  if(session.status!=='planned'||!session.scheduledTime)return session;
  const instant=scheduledInstant(session.plannedDate||session.date,session.scheduledTime,session.scheduledTimeZone||'Europe/Kyiv');
  return instant===null?session:{...session,date:localDate(new Date(instant))};
});
const profileManualSets=()=>manualSetsForProfile(S.manualSets,S.activeTrainingProfileId,S.trainingProfiles);
const profileMeasurements=()=>privateRecordsForProfile(S.measurements,S.activeTrainingProfileId);
const profileGoals=()=>privateRecordsForProfile(S.weeklyGoals,S.activeTrainingProfileId);
const currentProfile=()=>S.trainingProfiles.find(profile=>profile.id===S.activeTrainingProfileId)||defaultTrainingProfile();
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
  if (currentPage === "login") return authError(e);
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
    "permission-denied": "Правила Firestore відхилили запит. Перевір підтвердження пошти та актуальність опублікованих правил. Платний тариф не усуває цю помилку.",
    "resource-exhausted": "Вичерпано безкоштовну квоту Firestore. Дочекайся її поновлення; незбережені зміни залишаються на пристрої, якщо показано очікування синхронізації.",
    "failed-precondition": "Запит потребує індексу Firestore. Якщо його щойно опубліковано, зачекай завершення побудови та повтори дію.",
    "auth/network-request-failed": "Не вдалося підключитися до Firebase. Перевір мережу.",
  };
  return codes[e.code] || e.message || "Не вдалося виконати дію. Спробуй ще раз.";
}

const pageFiles = {
  achievements:'achievements.html',
  home: "home.html",
  statistics: "statistics.html",
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
function avatar() { return renderAvatar({...S.profile,uid:S.user?.uid,name:S.profile?.name||S.user?.displayName,photo:S.profile?.photo??S.user?.photoURL}); }
function brandMark() {
  return `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M10 16h12M8 9v14M4 12v8M24 9v14M28 12v8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span><span class="brand-wordmark"><small>NEXUS</small><strong>GymB<span>.</span></strong></span>`;
}
function login({animate=false}={}) {
  if(!document.querySelector('link[data-auth-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../auth.css',import.meta.url).href;link.dataset.authStyle='';document.head.append(link);}
  mountAuthPage(root,{mode:authMode,draft:authDraft,notice:authNotice,user:S.user,connected:!!db,bootError},{brand:brandMark(),animate,onLanguage:()=>login({animate:true})});
}

function nav() {
  return [
    ["home", uiText("Головна")],
    ["program", uiText("Програма")],
    ["exercises", uiText("Вправи")],
  ]
    .map(
      ([k, t]) => ui`
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
function applyInterfaceLanguage() {
  document.documentElement.lang=getLanguage();
  const titles={home:'Головна',program:'Програми',statistics:'Моя статистика',settings:'Налаштування'};
  if(titles[currentPage]) document.title=uiText(titles[currentPage])+' — Nexus GymB';
}
function shell(content) {
  applyInterfaceLanguage();
  if(!document.querySelector('link[data-header-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../header.css',import.meta.url).href;link.dataset.headerStyle='';document.head.append(link);}
  disposeRichEditors(root);
  closeReactionPicker();
  root.innerHTML = ui`
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <button type="button" class="brand" data-action="route" data-id="home" aria-label="Nexus GymB — головна">${brandMark()}</button>
        <nav class="topnav" aria-label="Основна навігація">${nav()}</nav>
        <div class="header-account"><details class="header-more"><summary aria-label="Додаткові розділи" title="Розділи"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect class="header-more-tile" x="14" y="14" width="6" height="6" rx="1.5"/></svg><span class="header-more-label">Розділи</span><svg class="header-more-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></summary><nav aria-label="Додаткові розділи">${[['statistics',uiText('Моя статистика')],['nutrition',uiText('Харчування')],['achievements','GymB ACHIEVEMENT']].map(([key,label])=>ui`<button data-action="route" data-id="${key}" ${S.route===key?'aria-current="page"':''}>${icon(key)}<span>${label}</span></button>`).join('')}${btn(uiText('Профілі та ваги'),'training-profiles','','ghost')}${btn(uiText('Калькулятор дисків'),'plate-calculator','','ghost')}</nav></details><button class="notice-bell" type="button" data-action="open-notices" aria-label="Сповіщення"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span id="notice-count" class="notice-count" hidden></span></button><button type="button" class="header-settings ${S.route === 'settings' ? 'active' : ''}" data-action="route" data-id="settings" aria-label="Налаштування" title="Налаштування" ${S.route === 'settings' ? 'aria-current="page"' : ''}>${icon('settings')}</button><button
          type="button"
          class="userchip ${S.route === "profile" ? "active" : ""}"
          data-action="route"
          data-id="profile"
          aria-label="Відкрити профіль"
          ${S.route === "profile" ? 'aria-current="page"' : ""}
        >
          ${avatar()}
          <span class="userchip-details">
            <span class="userchip-name">${esc(S.profile?.name || S.user.displayName || uiText("Спортсмен"))}</span>
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
    ${languageFooter()}
  `;
  previousScrollY = Math.max(0, window.scrollY || 0);
  applyProfilePageAppearance(S.loaded && S.route === 'profile' && !S.people?.error && !S.people?.person?.restricted ? S.people?.person?.appearance : null);
  updateNoticeBadge();
}

let previousScrollY = Math.max(0, window.scrollY || 0);
let headerScrollScheduled = false;
document.addEventListener('click',event=>{document.querySelectorAll('.header-more[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.header-more[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});});

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

function renderAuthPending() {
  root.innerHTML=bootError
    ?ui`<main class="main"><section class="card"><h1>Не вдалося відновити вхід</h1><p class="muted">${esc(bootError)}</p><button type="button" class="btn" data-action="reload">Спробувати знову</button></section></main>`
    :ui`<main class="loading" role="status">Відновлюємо вхід…</main>`;
}
function render() {
  // A null user before the first SDK callback means "unknown", not "signed out".
  if(!S.authReady){
    renderAuthPending();
    return;
  }
  if (!S.user) {
    gymWakeLock.sync(false);stopTurnWatch();
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
    shell(ui`
      <div class="loading">Завантажуємо твої програми…</div>
    `);
    return;
  }
  if (S.route !== currentPage) {
    const query =
      S.route === "editor"
        ? ui`?${new URLSearchParams({ ...(editor?.id ? { id: editor.id } : {}), ...(editorTemplate ? { template: "1" } : {}), ...(editorHistory ? { history: "1" } : {}), ...(editorPlanned ? { planned: "1" } : {}), ...(editor?.scope === "home" ? { home: "1" } : {}) })}`
        : "";
    navigate(S.route, query);
    return;
  }
  const screens = {
    achievements:()=>achievementsScreen(S.achievements,S.user.uid)+achievementHistory(S.achievementEvents,S.achievements.progress?.earnedIds||[]),
    home,
    statistics,
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
  const undo=availableUndo();if(undo)root.querySelector('main')?.insertAdjacentHTML('afterbegin',undoActionCard(undo));
  mountRichEditors(root);
  if(S.route==='settings'){translateRichEditorControls();if((new URLSearchParams(location.search).get('focus')==='music'||new URLSearchParams(location.search).get('section')==='music')){requestAnimationFrame(()=>document.getElementById('profile-music-settings')?.scrollIntoView({block:'start'}));}}
  restoreSetInputs();
  const gym=gymPrefs();
  mountGymMode(root,gym,uiText);
  gymWakeLock.sync(!!root.querySelector('.workout-studio') && !!ongoing() && gym.enabled && gym.keepAwake);
  updateGymWakeStatus();
  syncTurnWatch();
  requestAnimationFrame(()=>{const day=document.querySelector('.activity-heatmap button[tabindex="0"]'),scroll=day?.closest('.activity-heatmap-scroll');if(scroll&&day)scroll.scrollLeft=Math.max(0,day.offsetLeft-scroll.clientWidth/2);});
  const nutritionForm=document.getElementById("nutrition-generator-form");if(nutritionForm)updateNutritionPreview(nutritionForm.elements.age);
}

async function loadAchievements({isCurrent,force=false}={}) {
  const uid=S.user.uid;
  const state=S.achievements;
  const current=isCurrent||(()=>S.route==='achievements'&&S.user?.uid===uid),revision=(state.revision||0)+1;
  state.revision=revision;isCurrent=()=>current()&&state.revision===revision;
  const draft=state.dirty?structuredClone(state.display):null;
  state.loading=true;state.error='';state.leaderError='';
  stopAchievementWatch?.();stopAchievementWatch=null;
  render();
  try {
    const results=await Promise.allSettled([
      db.getLive(`users/${uid}/achievements/progress`),db.getLive(`users/${uid}/achievementSettings/display`),db.achievementLeaderboard(force),
    ]);
    if(!isCurrent())return;
    if(results[0].status==='fulfilled')state.progress=results[0].value;
    else state.error='Не вдалося завантажити досягнення. Спробуй оновити сторінку.';
    if(results[1].status==='fulfilled')state.display=draft||results[1].value||{selectedIds:[],rankingEnabled:false};
    else state.error='Не вдалося завантажити налаштування вітрини.';
    if(results[2].status==='fulfilled')state.leaders=results[2].value;
    else state.leaderError='Не вдалося завантажити рейтинг. Спробуй ще раз.';
    {
      try {
        await db.refreshAchievements();
        if(!isCurrent())return;
        state.progress=await db.getLive(`users/${uid}/achievements/progress`);
      } catch(error) { state.error=err(error); }
    }
    if(!isCurrent())return;
    state.dirty=!!draft;
    stopAchievementWatch=db.watchAchievements(progress=>{
      if(!isCurrent())return;
      state.progress=progress;
      if(progress)state.display.selectedIds=(state.display.selectedIds||[]).filter(id=>progress.earnedIds.includes(id));
      render();
    },()=>{if(isCurrent()){state.error='Не вдалося отримати оновлення медалей.';render();}});
  } finally { if(isCurrent()){state.loading=false;render();} }
}
document.addEventListener('change',event=>{
  if(event.target.id==='achievement-ranking'){S.achievements.display.rankingEnabled=event.target.checked;S.achievements.dirty=true;render();}
  if(event.target.id==='achievement-earned-only'){S.achievements.onlyEarned=event.target.checked;render();}
});

async function loadNutrition({ accessLoaded = false } = {}) {
  S.nutritionError = ''; S.nutritionPlans = [];
  try {
    if (!accessLoaded) {
      const access = await db.getLive(`userAccess/${S.user.uid}`);
      S.nutritionAccess = access?.nutrition === true;
    }
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
  for(const key of ['kcal','protein','fat','carbs']) {const output=document.getElementById(`nutrition-live-${key}`);if(output)output.textContent=targets?targets[key].toLocaleString(uiLocale()):'—';}
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
  return ui`<span class="exercise-photo photo-${size}">
    <span class="photo-placeholder" aria-hidden="true">${icon("exercises")}<span>Фото відсутнє</span></span>
    ${url ? ui`<img data-exercise-photo src="${esc(url)}" alt="${esc(item.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ""}
  </span>`;
}
function trainingProfileItems(items) {
  const profile=S.trainingProfiles.find(profile=>profile.id === S.activeTrainingProfileId);
  return profile?applyTrainingProfile({status:'active',items,logs:[],simpleCompleted:[]},profile).items:items;
}
function exerciseRows(items) {
  return items
    .map(
      (i, n) => ui`
        <div class="exercise-row">
          <span class="number">${String(n + 1).padStart(2, "0")}</span>
          ${i.custom ? "" : exercisePhoto(i)}
          <div class="grow">
            <h3>${esc(i.name)}</h3>
            <p>
              ${
                i.seconds
                  ? ui`${Math.round((i.seconds / 60) * 10) / 10} хв`
                  : ui`${i.sets} підходи · ${esc(i.reps)} повторень`
              }${i.weight ? ui` · ${esc(uiText(weightLabel(i)))}` : ""}
            </p>
            ${i.alternativeExercise ? ui`<p class="exercise-choice-hint">На вибір: ${esc(i.name)} або ${esc(i.alternativeExercise.name)}</p>` : ''}${metricSummary(i.metrics)}
            ${i.setPlans ? ui`<details><summary class="small">Параметри підходів</summary>${i.setPlans.map((p, k) => ui`<p class="small">${k + 1}: ${esc(p.reps)} повторень · ${p.weight} кг${p.seconds ? ui` · ${p.seconds} сек` : ""} · відпочинок ${p.rest} сек</p>`).join("")}</details>` : ""}
          </div>
          ${i.exerciseId ? ui`<button
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
  return (day?.scheduledTime || day?.invitationNote ? ui`<div class="notice"><strong>Спільне тренування${day.scheduledTime ? ui` · ${esc(formatScheduledTime(day.plannedDate||day.date,day.scheduledTime,uiLocale()))}` : ''}</strong>${day.invitationNote ? ui`<p>${esc(day.invitationNote)}</p>` : ''}</div>` : '') +
    (day?.warmup ? ui`<div class="notice workout-description"><strong>Розминка${day.warmupSkipped ? uiText(" · пропущено") : day.warmupDone ? uiText(" · виконано") : ""}</strong><p>${esc(day.warmup)}</p></div>` : "") +
    (day?.description ? ui`<div class="notice workout-description">${esc(day.description)}</div>` : "");
}
function homeOverview(completed) {
  const start=weekStart(localDate()),thisWeek=completed.filter(s=>s.date>=start&&s.date<=localDate());
  const last=[...completed].sort((a,b)=>b.date.localeCompare(a.date))[0];
  return ui`<section class="home-overview" aria-label="Коротко про твій прогрес"><div><span>Цього тижня</span><strong>${thisWeek.length}<small> тренувань</small></strong></div><div><span>Робота за тиждень</span><strong>${thisWeek.reduce((sum,s)=>sum+s.logs.filter(isWorkingSet).length,0)}<small> підходів</small></strong></div><div><span>Останнє тренування</span><strong class="home-last-workout">${last?esc(last.name):uiText('Усе попереду')}</strong><small>${last?esc(last.date):uiText('Почни з першого тренування')}</small></div></section>`;
}
function trainingProfileControl() {
  const profiles=availableProfiles(S.trainingProfiles,S.trainingProfileLimit);
  return ui`<div class="training-profile-control"><div class="context-label"><span class="context-mark" aria-hidden="true">${icon('exercises')}</span><label for="active-training-profile">Профіль тренувань</label><select id="active-training-profile" data-training-profile-select ${S.trainingProfilesError?'disabled':''}>${profiles.map(profile=>`<option value="${profile.id}" ${profile.id===S.activeTrainingProfileId?'selected':''}>${esc(profile.name)}</option>`).join('')}</select></div><div class="context-actions"><span>Окрема історія · ваги · прогрес</span>${btn(uiText('Керувати профілями'),'training-profiles','','ghost')}</div>${S.trainingProfilesError?'<p class="error" role="alert">'+esc(S.trainingProfilesError)+'</p>':''}</div>`;
}
function translateRichEditorControls() {
  for(const toolbar of root.querySelectorAll('.rich-toolbar')) {
    for(const element of [toolbar,...toolbar.querySelectorAll('*')])for(const attribute of ['aria-label','title']) {
      if(element.hasAttribute(attribute))element.setAttribute(attribute,uiText(element.getAttribute(attribute)));
    }
    const walker=document.createTreeWalker(toolbar,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))node.nodeValue=uiText(node.nodeValue);
  }
}
function themeOptions() {
  return ['Світла','Темна','Системна'].map(value=>`<option value="${value}" ${value===themePreference?'selected':''}>${uiText(value)}</option>`).join('');
}
function interfaceLanguageSettings() {
  return ui`<section class="card device-preferences"><div class="sectionhead"><div><span class="private-label">На цьому пристрої</span><h2>Мова та час</h2></div>${icon('settings')}</div><p class="muted">Вибір мови зберігається у браузері на цьому пристрої.</p><div class="settings-language-options" role="group" aria-label="Мова інтерфейсу">${[['uk','Українська'],['en','English']].map(([language,title])=>`<button type="button" data-interface-language="${language}" aria-pressed="${getLanguage()===language}" lang="${language}"><span class="settings-language-flag">${languageFlag(language)}</span><strong>${title}</strong><i aria-hidden="true">${getLanguage()===language?'✓':''}</i></button>`).join('')}</div><div class="device-time-info"><span class="device-clock" aria-hidden="true">◷</span><div><strong>Час твого пристрою</strong><p>${esc(deviceTimeZone())} · <time data-local-clock datetime="${new Date().toISOString()}">${esc(formatInstant(Date.now(),uiLocale()))}</time></p><small>Час подій автоматично перераховується у твій часовий пояс.</small></div></div></section>`;
}
function timeBudgetButtons(program,day) {
  if(!program||!day?.items?.length||ongoing())return '';
  return ui`<div class="time-budget-buttons" role="group" aria-label="Скільки часу маєш на тренування">${[30,60].map(minutes=>ui`<button type="button" data-action="preview-time-workout" data-program="${esc(program.id)}" data-day="${day.weekday}" data-minutes="${minutes}"><span aria-hidden="true">◷</span> ${uiText('Маю')} ${minutes} ${uiText('хвилин')}</button>`).join('')}</div>`;
}
function timeBudgetPlan(programId,dayId,minutes) {
  const program=S.programs.find(entry=>entry.id===programId)||active();requireHomeAccess(program);
  const day=schedule(program,dayId);if(!day?.items?.length)throw Error(uiText('Обери день із вправами.'));
  return {program,plan:fitWorkoutToTime({...day,items:trainingProfileItems(day.items)},minutes)};
}
function previewTimeWorkout(programId,dayId,minutes) {
  const {program,plan}=timeBudgetPlan(programId,dayId,minutes);
  openModal(ui`<div class="sectionhead"><div><span class="private-label">Твій час — твій план</span><h2 id="time-budget-title">${uiText('Маю')} ${minutes} ${uiText('хвилин')}</h2></div>${btn(uiText('Закрити'),'close','','ghost')}</div><p>${esc(plan.day.name)} · ${esc(currentProfile().name)}</p><div class="time-budget-overview"><div><strong>≈ ${plan.estimatedMinutes}</strong><span>Хвилин</span></div><div><strong>${plan.day.items.length} / ${plan.originalExercises}</strong><span>Вправ</span></div><div><strong>${plan.sets}</strong><span>Підходів</span></div></div><p class="notice">${plan.reduced?uiText('Скорочено кількість підходів і, за потреби, останні вправи. Суперсети залишаються разом.'):uiText('Повний план уже вкладається в цей час.')}</p>${exerciseRows(plan.day.items)}<p class="small muted">Оцінка враховує виконання, паузи й переходи. Реальний час залежить від твого темпу. Цей варіант діє лише сьогодні.</p>${btn(uiText('Почати цей план'),'start-time-workout',`data-program="${esc(program.id)}" data-day="${dayId}" data-minutes="${minutes}"`,'wide')}<div class="form-error" role="alert"></div>`,'time-budget-title','time-budget-dialog');
}
function monthlySummaryPanel() {
  const summary=monthlySummary(profileSessions(),profileManualSets(),S.monthSummaryMonth,currentProfile());
  const featured=S.people?.uid===S.user.uid?S.people.monthlySummary:null;
  const selected=featured?.month===summary.month&&featured?.profileId===summary.profileId;
  const unavailable=S.communityLoading||S.people?.uid!==S.user.uid||!S.people?.person||S.people?.warnings?.includes('підсумок місяця');
  const controls=ui`<div class="monthly-publication"><div><strong>${selected?uiText('Цей місяць уже у твоєму профілі'):uiText('Поділися своїм місяцем')}</strong><p>${featured?`${esc(monthLabel(featured.month))} · ${esc(featured.profileName)}`:uiText('Підсумок залишається приватним, доки ти не додаси його у профіль.')}</p><small>У профілі буде лише картка з підсумковими числами. Її можна прибрати будь-коли.</small></div><div class="actions">${btn(uiText(selected?'Оновити підсумок у профілі':featured?'Замінити підсумок у профілі':'Додати у профіль'),'publish-monthly-summary',`data-month="${summary.month}" data-profile="${summary.profileId}" ${unavailable||!summary.hasActivity?'disabled':''}`,'secondary')}${featured?btn(uiText('Прибрати з профілю'),'unpublish-monthly-summary',unavailable?'disabled':'','ghost'):''}</div></div>`;
  return ui`<section class="monthly-summary-section" id="monthly-summary"><div class="sectionhead"><div><span class="statistics-eyebrow">ТВІЙ РИТМ ЗА МІСЯЦЬ</span><h2>Місяць, яким можна пишатися</h2></div><label>Обери місяць<input type="month" id="monthly-summary-month" value="${summary.month}" max="${localDate().slice(0,7)}" required/></label></div>${S.people?.warnings?.includes('підсумок місяця')?ui`<p class="notice error">Не вдалося завантажити опублікований підсумок. Онови сторінку.</p>`:''}${monthlySummaryCard(summary,{controls})}${!summary.hasActivity?ui`<p class="small muted">За цей місяць ще немає результатів у вибраному профілі.</p>`:''}</section>`;
}
function statistics() {
  const sessions=profileSessions(),completed=sessions.filter(session=>session.status==='completed'),manual=profileManualSets();
  const logs=completed.flatMap(session=>session.logs.filter(isWorkingSet)),streak=trainingStreak(ownStreakSessions());
  const volume=logs.reduce((sum,log)=>sum+(log.weightUnknown?0:totalWeight(log)*log.reps),0);
  const since=new Date();since.setDate(since.getDate()-30);
  const recent=completed.filter(session=>session.date>=localDate(since));
  const metrics=[[completed.length,'Тренувань','Завершено у цьому профілі'],[logs.length,'Робочих підходів','Збережені робочі підходи'],[Math.round(volume),'кг × повторення','Твій сумарний обсяг'],[streak.current,'Тижнів поспіль','Тижні з тренуваннями']];
  return ui`<div class="statistics-dashboard statistics-studio">${trainingProfileControl()}<section class="statistics-hero"><div class="statistics-hero-copy"><span class="statistics-eyebrow">NEXUS INSIGHTS</span><h1>Твоя робота.<br><em>Твій прогрес.</em></h1><p>Кожне тренування — частина більшої історії. Тут видно, як ти рухаєшся вперед.</p><div class="statistics-profile-label"><span class="profile-color-dot" aria-hidden="true"></span>${esc(currentProfile().name)}<small>Окремі результати профілю</small></div></div><div class="statistics-hero-aside"><div class="statistics-orbit" aria-hidden="true"><span>${recent.length}</span><i></i></div><strong>Тренувань за 30 днів</strong><p>Твій темп. Твій шлях.</p>${btn(uiText('На головну'),'route','data-id="home"','ghost')}</div></section>
    <div class="statistics-kpis">${metrics.map(([value,title,description],index)=>ui`<article class="statistics-kpi" data-accent="${index}"><span>${uiText(title)}</span><strong>${Number(value).toLocaleString(uiLocale())}</strong><small>${uiText(description)}</small></article>`).join('')}</div>
    ${monthlySummaryPanel()}<nav class="statistics-nav" aria-label="Розділи статистики"><a href="#monthly-summary">Підсумок місяця</a><a href="#progress-view">Прогрес</a><a href="#statistics-records">Рекорди</a><a href="#measurements-view">Заміри</a><a href="#statistics-history">Історія</a><a href="#statistics-wellbeing">Самопочуття</a><span>${icon('settings')} Бачиш тільки ти</span></nav>
    ${S.trainingExtrasError?`<p class="notice error" role="alert">${esc(S.trainingExtrasError)}</p>`:''}
    <div id="progress-view">${progressView()}</div><div id="statistics-records" class="statistics-grid">${recordsCard()}${repetitionRecordsCard(progressSessions(sessions,manual),S.recordReps,localDate())}</div>
    <div class="statistics-lower-grid"><div id="measurements-view">${measurementsPanel()}</div><div>${weeklyGoalCard(sessions,profileGoals(),localDate())}<section class="card statistics-wellbeing" id="statistics-wellbeing"><span class="private-label">Бачиш тільки ти</span><h2>Самопочуття</h2>${S.reflections.filter(record=>completed.some(session=>session.id===record.id)).sort((a,b)=>{const date=id=>completed.find(session=>session.id===id)?.date||'';return date(b.id).localeCompare(date(a.id));}).slice(0,5).map(record=>{const session=completed.find(session=>session.id===record.id);return ui`<div class="reflection-history"><strong>${esc(session.name)} · ${esc(session.date)}</strong><span>Складність ${record.difficulty}/10 · Енергія ${record.energy}/5</span>${btn(uiText('Редагувати'),'workout-reflection',`data-id="${esc(record.id)}"`,'ghost')}</div>`;}).join('')||ui`<p class="muted">Відмічай самопочуття після тренування, щоб краще бачити свій ритм.</p>`}</section></div></div>
    <section class="card" id="statistics-history"><div class="sectionhead"><div><span class="statistics-eyebrow">ТВІЙ ЩОДЕННИК</span><h2>Історія тренувань</h2></div>${btn(uiText('Записати минуле тренування'),'new-history','','secondary')}</div>${historyTools()}<div id="history-results">${filteredHistory()}</div></section></div>`;
}
function alternativeExerciseField(item,n,j) {
  const list=S.exercises.filter(e=>!e.archived&&e.id!==item.exerciseId).sort((a,b)=>Number(b.primary===item.primary)-Number(a.primary===item.primary)||a.name.localeCompare(b.name,'uk'));
  const selected=item.alternativeExercise;
  return `<details class="planned-choice-editor" ${selected?'open':''}><summary>Вправа на вибір${selected?' · 2 варіанти':''}</summary><label>Альтернатива для цього місця у плані<select name="alternative-${n}-${j}"><option value="">Без альтернативи</option>${selected&&!list.some(e=>e.id===selected.id)?`<option value="${esc(selected.id)}" selected>${esc(selected.name)} · недоступна в каталозі</option>`:''}${list.map(e=>`<option value="${esc(e.id)}" ${e.id===selected?.id?'selected':''}>${esc(e.name)} · ${esc(e.primary||'Вправа')}</option>`).join('')}</select></label><p class="small muted">Наприклад, третя вправа: ця або обрана альтернатива. Вибирай під час тренування до першого результату. Кількість підходів і повторень спільна; робоча вага береться з профілю обраної вправи.</p></details>`;
}
function plannedExerciseChoices(session,index) {
  const item=session.items[index],original=session.replacements?.[index]?.original||item,alternative=original.alternativeExercise;
  if(!alternative) return '';
  const locked=session.logs.some(log=>log.index===index)||session.simpleCompleted?.includes(index);
  const replaced=!!session.replacements?.[index],isAlternative=item.exerciseId===alternative.id;
  return `<aside class="planned-exercise-choices"><strong>Що робиш сьогодні?</strong><p class="small muted">${locked?'Вибір збережено разом із результатами.':'Обери одну вправу. План залишиться з двома варіантами.'}</p><div class="actions">${btn(esc(original.name),'choose-planned-exercise',`data-index="${index}" data-choice="original" aria-pressed="${!replaced}" ${locked||!replaced?'disabled':''}`,!replaced?'secondary':'ghost')}${btn(esc(alternative.name),'choose-planned-exercise',`data-index="${index}" data-choice="alternative" aria-pressed="${isAlternative}" ${locked||isAlternative?'disabled':''}`,isAlternative?'secondary':'ghost')}</div></aside>`;
}
function home() {
  const sessions=profileSessions();
  const p = active(),
    sequential = p?.scheduleMode === "sequence",
    today = schedule(p),
    d = chosenDay !== null ? schedule(p, chosenDay) : sequential ? nextSequenceDay(p, sessions) : today || nextDay(p),
    session = ongoing(),
    completed = sessions.filter((s) => s.status === "completed");
  const optionalBlock = (content, hasItems, title) => hasItems ? content : ui`<details class="home-disclosure"><summary>${title}<span>Відкрити</span></summary>${content}</details>`;
  return (
    '<div class="home-dashboard">' + heading(ui`Привіт, ${esc((S.profile?.name||S.user.displayName)?.split(" ")[0] || uiText("спортсмене"))} 👋`, new Intl.DateTimeFormat(uiLocale(), {weekday:'long', day:'numeric', month:'long'}).format(new Date()), '<div class="home-heading-actions">'+btn(uiText("Моя статистика"), "route", 'data-id="statistics"', "secondary") + (owner() ? btn(uiText("Адмінка"), "route", 'data-id="admin"', "ghost") : "")+'</div>' ) + streakCard() + (S.trainingExtrasError?ui`<div class="notice error" role="alert">${esc(S.trainingExtrasError)} ${btn(uiText('Оновити'),'reload','','secondary')}</div>`:'') +
    trainingProfileControl() + homeOverview(completed) + (S.settings.announcement
      ? ui`
          <aside class="home-announcement" aria-labelledby="home-news-title"><span class="news-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 9 12-4v14L4 15V9ZM16 9h2a3 3 0 0 1 0 6h-2M7 16l1 5h3l-1-4"/></svg></span><div><span class="news-eyebrow">NEXUS GYMB</span><h2 id="home-news-title">Новина від команди</h2><p>${esc(S.settings.announcement)}</p></div></aside>
        `
      : "") +
    ui`
      <div class="grid home-grid">
        <div class="stack home-main-column">
          <section class="card hero">
            <div class="home-hero-art" aria-hidden="true"><svg viewBox="0 0 160 160" fill="none"><path d="M48 112 112 48M31 95l34 34M25 101l34 34M95 31l34 34M101 25l34 34" stroke="currentColor" stroke-width="12" stroke-linecap="round"/></svg></div>
            <span class="eyebrow">
              ${session ? uiText("Тренування триває") : chosenDay !== null ? uiText("Обраний день") : sequential ? uiText("Програма за чергою") : today ? uiText("Сьогодні за планом") : uiText("Наступне тренування")}
            </span>
            <h2>${session ? esc(session.name) : d ? esc(d.name) : uiText("Твій новий початок")}</h2>
            <p>
              ${
                session
                  ? uiText("Повернися до підходу, на якому зупинився.")
                  : d
                    ? esc(d.groups || uiText("Твій план на тренування"))
                    : uiText("На сьогодні тренування не заплановано.")
              }
            </p>
            ${
              session
                ? btn(uiText("Продовжити тренування"), "resume")
                : p && d
                  ? btn(
                      sequential || today ? uiText("Почати тренування") : uiText("Відкрити наступне тренування"),
                      "start",
                      ui`data-day="${d.weekday}"`,
                    )
                  : btn(uiText("Створити програму"), "new-program")
            }
            ${!session?timeBudgetButtons(p,d):''}
            ${(session||d)?.items?.length ? ui`<div class="home-hero-meta"><span>${(session||d).items.length} вправ</span><span>${(session||d).items.reduce((sum,item)=>sum+item.sets,0)} підходів</span>${(session||d).items.some(item=>item.alternativeExercise)?uiText('<span>Є вправи на вибір</span>'):''}</div>`:''}
            <span class="badge">${esc(p?.name || uiText("Твій новий початок"))}</span>
          </section>
          <section class="card">
            <div class="sectionhead">
              <h2>${sequential ? uiText("Дні програми") : uiText("Твій тиждень")}</h2>
              <span class="muted small">${p?.days.length || 0} тренувальні дні</span>
            </div>
            <div class="week ${sequential ? "sequence-days" : ""}">
              ${sequential ? p.days.map((day) => ui`<button class="day ${d === day ? "today" : ""}" data-action="day" data-day="${day.weekday}"><span>${esc(localizedDayLabel(p, day))}</span><b>${esc(day.name)}</b></button>`).join("") : days
                .map((name, n) => {
                  const date = new Date();
                  date.setDate(date.getDate() - weekday() + n);
                  return ui`
                    <button
                      class="day ${n === weekday() ? "today" : ""} ${
                        completed.some((s) => s.date === localDate(date)) ? "done" : ""
                      }"
                      data-action="day"
                      data-day="${n}"
                      aria-label="${uiText(name)}"
                    >
                      <span>${uiText(dayCodes[n])}</span>
                      <b>${date.getDate()}</b>
                      ${schedule(p, n) || sessions.some((s) => s.status === "planned" && s.date === localDate(date)) ? "<i></i>" : ""}
                    </button>
                  `;
                })
                .join("")}
            </div>
          </section>
          <section class="card">
            <div class="sectionhead">
              <h2>${d ? esc(d.name) : uiText("Вправи за планом")}</h2>
              <span class="small muted">${d ? esc(localizedDayLabel(p, d, true)) : ""}</span>
            </div>
            ${
              d
                ? workoutDescription(d) + exerciseRows(trainingProfileItems(d.items)) +
                  (hasWorkoutContent(d) && chosenDay !== null
                    ? btn(uiText("Почати цей день"), "start", ui`data-day="${d.weekday}"`, "secondary")
                    : hasWorkoutContent(d)
                      ? ""
                      : empty(uiText("Додай план"), uiText("Опиши тренування своїми словами або додай вправи в редакторі.")))
                : ui`
                  <p class="muted small">Додай програму, щоб побачити свій план.</p>
                `
            }
          </section>
        </div>
        <div class="stack home-side-column" style="align-content:start">

          ${canUseHome() ? ui`<section class="card">
            <div class="sectionhead"><h2>Домашні комплекси</h2>${btn(uiText("＋ Створити"), "new-home", "", "secondary")}</div>
            <p class="muted small">Для шиї, пресу чи інших вправ. Запускай у будь-який день поза основною програмою.</p>
            ${S.programs.filter((p) => p.scope === "home").map((p) => ui`<div class="exercise-row"><div class="grow"><h3>${esc(p.name)}</h3><span class="small muted">${p.days[0].items.length} вправ</span></div><div class="actions">${btn(uiText("Почати"), "start", ui`data-program="${esc(p.id)}" data-day="${p.days[0].weekday}"`, "secondary")}${btn(uiText("Редагувати"), "edit-program", ui`data-id="${esc(p.id)}"`, "ghost")}</div></div>`).join("") || uiText('<p class="small muted">Створи свій перший домашній комплекс.</p>')}
          </section>` : ""}
          <section class="card">
            <div class="sectionhead"><h2>Окремі тренування</h2>${btn(uiText("＋ Запланувати"), "new-planned", "", "secondary")}</div>
            <p class="muted small">Обери дату, опиши тренування своїми словами або додай вправи.</p>
            ${plannedWorkouts()}
          </section>
          <section class="card home-totals">
            <div class="sectionhead"><h2>Твій підсумок</h2>${btn(uiText("Детальніше"),"route",'data-id="statistics"',"ghost")}</div>
            <div class="home-metrics">
              <div><strong>${completed.length}</strong><span>Завершені тренування</span></div>
              <div><strong>${completed.reduce((a, s) => a + s.logs.filter(isWorkingSet).length, 0)}</strong><span>Робочі підходи</span></div>
            </div>
          </section>
          <section class="card">
            <div class="sectionhead"><h2>Останні тренування</h2>${btn(uiText("＋ Записати минуле"), "new-history", "", "secondary")}</div>
            ${history(
              completed
                .slice()
                .sort((a, b) => b.startedAt - a.startedAt)
                .slice(0, 3),
            )}
          </section>
        </div>
      </div>
    `+unifiedActivityCalendar()+ui`<div class="home-extras">${weeklyGoalCard(sessions,profileGoals(),localDate())}${optionalBlock(challengesCard(S.challenges,S.user.uid,localDate()), S.challenges?.length, uiText('Челенджі з друзями'))}</div>`+optionalBlock(meetingPollsCard(S.meetingPolls,S.user.uid), S.meetingPolls?.length, uiText('Спільні тренування та опитування'))+'</div>'
  );
}
function plannedWorkouts() {
  const list = profileSessions().filter((s) => s.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
  return list.length ? list.map((s) => ui`<div class="history-row">
    <h3>${esc(s.name)}</h3><p class="small muted">${esc(formatScheduledTime(s.plannedDate||s.date,s.scheduledTime,uiLocale(),s.scheduledTimeZone||'Europe/Kyiv'))} · ${s.items.length ? ui`${s.items.length} вправ` : uiText("Тренування словами")}${s.date < localDate() ? uiText(" · Дата минула") : ""}</p>
    ${workoutDescription(s)}
    <div class="actions">${btn(uiText("Почати"), "start-planned", ui`data-id="${esc(s.id)}"`)}${btn(uiText("Редагувати"), "edit-planned", ui`data-id="${esc(s.id)}"`, "secondary")}${btn(uiText("Перенести"), "reschedule", ui`data-id="${esc(s.id)}"`, "secondary")}${btn(uiText("Скасувати"), "delete-planned", ui`data-id="${esc(s.id)}"`, "ghost")}</div>
    </div>`).join("") : uiText('<p class="muted small">Окремих тренувань ще не заплановано.</p>');
}
function calendarDayPanel(sessions=profileCalendarSessions()) {
  const date=S.calendarDate,today=localDate();
  const events=calendarEvents(active(),sessions,date).map(event=>({...event,scope:event.kind==='program'?'main':sessionScope(sessions.find(session=>session.id===event.id)||{},S.programs)})).filter(event=>S.activityFilter==='all'||event.scope===S.activityFilter);
  const labels={program:'План програми',planned:'Заплановано',active:'Триває',completed:'Завершено'};
  const title=new Intl.DateTimeFormat(uiLocale(),{weekday:'long',day:'numeric',month:'long'}).format(new Date(`${date}T12:00:00`));
  return ui`<section class="calendar-day-panel" id="calendar-day-details" aria-labelledby="calendar-day-title"><div class="calendar-day-heading"><div><span class="calendar-day-kicker">${date===today?uiText('Сьогодні'):date>today?uiText('Майбутній день'):uiText('Твоя історія')}</span><h3 id="calendar-day-title">${esc(title)}</h3></div><label class="calendar-day-selector">Обрати дату<input id="calendar-agenda-date" type="date" value="${date}" min="${activityRegistrationDay(S.profile?.createdAt||S.selfPublic?.joinedAt||Date.now(),today)}" max="${Number(today.slice(0,4))+1}-12-31"/></label></div>
    <div class="calendar-day-events">${events.length?events.map(event=>ui`<article class="calendar-agenda-item" data-kind="${event.kind}"><span class="calendar-agenda-icon" aria-hidden="true">${event.kind==='completed'?'✓':event.kind==='active'?'◷':event.kind==='planned'?'◈':'▤'}</span><div><strong>${esc(event.name)}</strong><p>${uiText(labels[event.kind])} · ${uiText(event.scope==='home'?'Домашній комплекс':event.scope==='main'?'Основна програма':'Тип не збережено')}</p></div><div class="actions">${event.kind==='planned'?btn(uiText('Редагувати'),'edit-planned',`data-id="${esc(event.id)}"`,'secondary')+btn(uiText('Перенести'),'reschedule',`data-id="${esc(event.id)}"`,'ghost'):event.kind==='completed'?btn(uiText('Деталі'),'history',`data-id="${esc(event.id)}"`,'ghost'):event.kind==='active'?btn(uiText('Продовжити'),'resume','','secondary'):btn(uiText('Почати сьогодні'),'start',`data-program="${esc(event.programId)}" data-day="${event.weekday}"`,'ghost')}</div></article>`).join(''):ui`<div class="calendar-day-empty"><span aria-hidden="true">◷</span><p>На цю дату тренувань немає.</p></div>`}</div>
    ${date>=today?`<div class="calendar-day-footer">${btn(uiText('＋ Запланувати на цю дату'),'new-planned',`data-date="${date}"`,'secondary')}<span>${uiText('Додай окреме тренування на вибраний день.')}</span></div>`:''}
    ${events.some(event=>event.kind==='program')?ui`<p class="small muted calendar-program-note">План програми показує розклад. Кнопка «Почати сьогодні» запускає тренування з поточною датою.</p>`:''}</section>`;
}
function unifiedActivityCalendar() {
  const today=localDate(),sessions=profileCalendarSessions(),from=activityRegistrationDay(S.profile?.createdAt||S.profile?.registeredAt||S.selfPublic?.joinedAt||Date.now(),today);
  const firstYear=Number(from.slice(0,4)),lastYear=Number(today.slice(0,4))+1;
  if(!Number.isInteger(S.activityYear)||S.activityYear<firstYear||S.activityYear>lastYear)S.activityYear=lastYear;
  const first=from>`${S.activityYear}-01-01`?from:`${S.activityYear}-01-01`,last=`${S.activityYear}-12-31`;
  if(!S.calendarDate.startsWith(`${S.activityYear}-`)||S.calendarDate<first||S.calendarDate>last)S.calendarDate=today>=first&&today<=last?today:first;
  S.calendarMonth=S.calendarDate.slice(0,7);
  const planned=sessions.filter(session=>session.status==='planned'&&session.date>=from&&session.date<=last&&session.date.startsWith(`${S.activityYear}-`)&&(S.activityFilter==='all'||sessionScope(session,S.programs)===S.activityFilter)).map(session=>session.date);
  const years=Array.from({length:lastYear-firstYear+1},(_,index)=>lastYear-index);
  return activityCalendar(profileSessions(),S.programs,S.activityYear,S.activityFilter,today,S.calendarDate,{unified:true,from,through:last,plannedDates:planned,years,dayPanel:calendarDayPanel(sessions)});
}
function updateUnifiedCalendar() {
  const previous=document.getElementById('home-activity-calendar');
  if(!previous){render();return;}
  const scroll=previous.querySelector('.activity-heatmap-scroll')?.scrollLeft||0;
  previous.outerHTML=unifiedActivityCalendar();
  const next=document.getElementById('home-activity-calendar');
  if(next?.querySelector('.activity-heatmap-scroll'))next.querySelector('.activity-heatmap-scroll').scrollLeft=scroll;
  next?.querySelector('.activity-heatmap button[aria-pressed="true"]')?.focus({preventScroll:true});
}
function history(list) {
  return list.length
    ? list
        .map(
          (s) => ui`
            <div class="history-row">
              <div class="row">
                <div>
                  <h3>${esc(s.name)}</h3>
                  <p class="small muted">
                    ${esc(s.date)} · ${Math.round((s.endedAt - s.startedAt) / 60000)} хв ·
                    ${s.logs.filter(isWorkingSet).length} основних підходів${s.logs.some(log=>log.dropOf !== undefined) ? ui` · ${s.logs.filter(log=>log.dropOf !== undefined).length} дропів` : ''}
                  </p>
                </div>
                <button class="mini-btn" data-action="history" data-id="${s.id}">Деталі</button>
              </div>
              ${btn(uiText("Повторити тренування"), "repeat-history", ui`data-id="${esc(s.id)}"`, "ghost")}
              ${btn(uiText("Виправити"), "edit-history", ui`data-id="${esc(s.id)}"`, "ghost")}
              ${btn(uiText('Підсумок'),'show-workout-summary',ui`data-id="${esc(s.id)}"`,'ghost')}${btn(uiText('Порівняти'),'compare-workout',ui`data-id="${esc(s.id)}"`,'ghost')}
            </div>
          `,
        )
        .join("")
    : ui`
        <p class="small muted">Завершені тренування з’являться тут.</p>
      `;
}
function programs() {
  const visible = S.programs.filter((p) => p.scope !== "home" || canUseHome())
    .sort((a, b) => Number(b.id === active()?.id) - Number(a.id === active()?.id));
  const templates = S.templates.filter((t) => !t.archived);
  return (
    heading(uiText("Твоя програма"), uiText("Дні тренувань та вправи."), btn(uiText("＋ Нова програма"), "new-program") + (canUseHome() ? btn(uiText("＋ Домашній комплекс"), "new-home", "", "secondary") : "") + btn(uiText("Записати минуле тренування"), "new-history", "", "secondary")) +
    ui`
      <div class="stack">
        ${
          visible.length
            ? visible
                .map(
                  (p) => ui`
                  <section class="card">
                    <div class="sectionhead">
                      <div>
                        <span class="badge">
                          ${p.scope === "home" ? uiText("Домашній комплекс") : esc(uiText(p.type))}${p.id === active()?.id ? uiText(" · Активна") : ""}
                        </span>
                        <h2 style="margin:15px 0 8px">${esc(p.name)}</h2>
                        <p class="small muted">
                          ${p.scope === "home" ? uiText("Запускай у будь-який день · поза основним розкладом") : p.days.map((d) => localizedDayLabel(p, d)).join(" · ")}
                        </p>
                      </div>
                      <div class="actions">
                        ${btn(uiText("Почати тренування"), "choose-program-day", ui`data-id="${esc(p.id)}"`)}${btn(uiText("Редагувати"), "edit-program", ui`data-id="${p.id}"`, "secondary")}${btn(uiText("Поділитися"), "share-program", ui`data-id="${p.id}"`, "ghost")}${btn(
                          uiText("Копіювати"),
                          "copy-program",
                          ui`data-id="${p.id}"`,
                          "ghost",
                        )}${
                          p.scope !== "home" && p.id !== active()?.id
                            ? btn(uiText("Зробити активною"), "activate", ui`data-id="${p.id}"`, "ghost")
                            : ""
                        }${btn(uiText("Видалити"), "delete-program", ui`data-id="${p.id}"`, "ghost")}
                      </div>
                    </div>
                    ${p.days
                      .map(
                        (d) => ui`
                          <details class="program-day" name="program-days">
                            <summary><span class="number">${p.scope === "home" ? "⌂" : esc(localizedDayLabel(p, d))}</span><span class="grow"><strong>${esc(d.name)}</strong><span class="small muted">${esc(d.groups)} · ${d.items.length} вправ</span></span><span class="day-chevron" aria-hidden="true">⌄</span></summary>
                            <div class="program-day-content">${workoutDescription(d)}${exerciseRows(trainingProfileItems(d.items)) || (d.description ? "" : uiText('<p class="muted">Плану ще немає.</p>'))}
                            ${btn(
                              uiText("Почати"),
                              "start",
                              ui`data-program="${p.id}" data-day="${d.weekday}"`,
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
            : ui`
              <section class="card">
                ${empty(
                  uiText("Створи свій перший план"),
                  uiText("Верх / Низ, Спліт, Все тіло або повністю власна програма."),
                  btn(uiText("Обрати дні та вправи"), "new-program"),
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
                    (t) => ui`
                    <div class="exercise-row template-row">
                      <div class="grow">
                        <h3>${esc(t.name)}</h3>
                        <p>${esc(uiText(t.type))} · ${t.days.length} дні</p>
                      </div>
                      ${btn(uiText("Оцінки та коментарі"), "template-community", ui`data-id="${esc(t.id)}"`, "ghost")}
                      ${btn(uiText("Використати"), "use-template", ui`data-id="${t.id}"`, "secondary")}
                    </div>
                  `,
                  )
                  .join("")
              : ui`
                <p class="muted">Шаблонів немає.</p>
              `
          }
        </section>
      </div>
    `
  );
}
function catalog() {
  const equipment=[...new Set(S.exercises.filter(e=>!e.archived).map(e=>e.equipment).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'uk'));
  return `<div class="exercise-catalog-shell"><header class="exercise-catalog-heading"><div><span class="catalog-eyebrow">Каталог вправ</span><h1>Вправи</h1><p>Техніка виконання, результати тренувань і відгуки.</p></div>${btn('Додати свою вправу','new-personal-exercise','','secondary')}</header><div class="exercise-search"><span aria-hidden="true">⌕</span><input id="search" type="search" aria-label="Пошук вправ" placeholder="Назва вправи або тренажера" value="${esc(S.query)}"/></div><div class="filters" role="group" aria-label="М’язові групи">${['Усі',...groups].map(g=>`<button class="chip ${S.filter===g?'active':''}" data-action="filter" data-id="${esc(g)}" aria-pressed="${S.filter===g}">${esc(g)}</button>`).join('')}</div><details class="catalog-filter-disclosure"><summary>Фільтри та сортування</summary><div class="catalog-tools"><label>Бібліотека<select id="catalog-scope">${[['all','Усі вправи'],['personal','Мої особисті'],['shared','Global']].map(([key,label])=>`<option value="${key}" ${S.catalogScope===key?'selected':''}>${label}</option>`).join('')}</select></label><label>Обладнання<select id="catalog-equipment"><option value="">Усе обладнання</option>${equipment.map(name=>`<option value="${esc(name)}" ${S.equipment===name?'selected':''}>${esc(name)}</option>`).join('')}</select></label><label>Сортування<select id="catalog-sort"><option value="name" ${S.catalogSort==='name'?'selected':''}>Назва · А–Я</option><option value="group" ${S.catalogSort==='group'?'selected':''}>М’язова група</option></select></label><label class="photo-toggle"><input id="catalog-photo" type="checkbox" ${S.withPhoto?'checked':''}/> Лише з фото</label><label class="photo-toggle"><input id="catalog-favorites" type="checkbox" ${S.favoritesOnly?'checked':''}/> Улюблені</label>${btn('Скинути фільтри','reset-catalog','','ghost')}</div></details><div id="catalog-results">${catalogResults()}</div></div>`;
}
function catalogResults() {
  const list=filterExercises(S.exercises,S,S.exercisePreferences,e=>!!safeURL(e.image));
  return `<p class="catalog-result-count" role="status" aria-live="polite">${list.length} вправ</p>${list.length?`<div class="catalog exercise-catalog-grid">${list.map(e=>`<article class="catalog-entry exercise-tile"><div class="exercise-tile-image">${exercisePhoto(e,'card')}<span class="exercise-tile-kind">${e.personal?'Особиста':'Global'}</span><button class="exercise-favorite" data-action="favorite-exercise" data-id="${esc(e.id)}" aria-pressed="${!!S.exercisePreferences[e.id]?.favorite}" aria-label="Улюблена вправа: ${esc(e.name)}">${S.exercisePreferences[e.id]?.favorite?'♥':'♡'}</button></div><button class="exercise-tile-content" data-action="detail" data-id="${esc(e.id)}"><span>${esc(e.primary)}</span><h3>${esc(e.name)}</h3><p>${esc(e.equipment||'Без обладнання')}</p></button><div class="exercise-tile-actions">${btn('＋ До тренування','catalog-add',`data-id="${esc(e.id)}"`,'secondary')}${btn('Деталі','detail',`data-id="${esc(e.id)}"`,'ghost')}</div></article>`).join('')}</div>`:`<section class="card"><h2>Вправ не знайдено</h2><p class="muted">Зміни пошук або фільтри.</p>${btn('Скинути фільтри','reset-catalog','','secondary')}</section>`}`;
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
      ${field("Повторення", `plan-reps-${n}-${j}-${k}`, p.reps, "text", 'maxlength="20" placeholder="10-12"')}
      ${weightDetailsFields({...item,...p},`plan-${n}-${j}-${k}-`)}${field("Вага, кг", `plan-weight-${n}-${j}-${k}`, p.weight, "number", 'required min="0" max="1000" step="0.5"')}
      ${field("Час, сек", `plan-seconds-${n}-${j}-${k}`, p.seconds, "number", 'required min="0" max="7200"')}
      ${field("Відпочинок, сек", `plan-rest-${n}-${j}-${k}`, p.rest, "number", 'required min="0" max="600"')}
    </div></fieldset>`).join("") : ""}</div>`;
}

function openCatalogJson(targetId = '', text = '') {
  if (!owner()) throw Error('Немає доступу.');
  const target = targetId ? S.exercises.find(e=>e.id===targetId && !e.personal) : null;
  if (targetId && !target) throw Error('Вправу не знайдено.');
  const example = target ? exportCatalog([target]) : {exercises:[{name:'Жим гантелей',primary:'Груди',equipment:'Гантелі',technique:'Опис техніки'}]};
  openModal(`<div class="sectionhead"><h2>${target ? `Оновити JSON · ${esc(target.name)}` : 'Додати / оновити вправи з JSON'}</h2>${btn('Закрити','close','','ghost')}</div><p class="muted">Обери файл або встав JSON. Наявні вправи визначаються за id, без id — за унікальною назвою. Пропущені поля зберігаються; порожній рядок очищає поле. Вправи, яких немає у файлі, залишаються в каталозі.</p><form id="catalog-json-form" data-target="${esc(targetId)}"><label>Файл JSON<input id="catalog-json-file" type="file" accept=".json,application/json" /></label><p class="small muted" id="catalog-json-file-status" role="status">До 15 МБ, до 5000 вправ.</p><label>JSON<textarea name="json" rows="12" required maxlength="15000000" spellcheck="false">${esc(text)}</textarea></label><details><summary>Приклад формату</summary><pre class="json-preview">${esc(JSON.stringify(example,null,2))}</pre></details><button class="btn" type="submit">Перевірити зміни</button><div class="form-error" role="alert"></div></form>`);
}
function previewCatalogJson(text, targetId) {
  const plan = catalogImportPlan(text,S.exercises,targetId);
  catalogJsonDraft = {text,targetId,plan:plan.map(entry=>({...entry,id:entry.id || crypto.randomUUID()})),saved:0};
  const count = kind => plan.filter(entry=>entry.action===kind).length;
  const labels = {create:'Додати',update:'Оновити',unchanged:'Без змін'};
  openModal(`<h2>Перевір зміни каталогу</h2><p>Нових: ${count('create')}. Оновлень: ${count('update')}. Без змін: ${count('unchanged')}.</p><p class="small muted">Наявні вправи збережуть свої ID та зв’язки з програмами й історією. Збережені раніше знімки інструкцій у тренуваннях залишаться як були.</p><ul>${plan.slice(0,100).map(entry=>`<li><strong>${labels[entry.action]}:</strong> ${esc(entry.data.name)}${entry.action==='update' ? ` · поля: ${esc(entry.changed.join(', '))}` : ''}</li>`).join('')}</ul>${plan.length>100?`<p>Показано перші 100 із ${plan.length} записів.</p>`:''}<p id="catalog-json-save-status" role="status"></p><div class="actions">${btn('Зберегти зміни','save-catalog-json',count('create')+count('update') ? '' : 'disabled')}${btn('Назад до JSON','back-catalog-json','','secondary')}${btn('Скасувати','close','','ghost')}</div>`);
}
function downloadCatalogJson() {
  if (!owner()) throw Error('Немає доступу.');
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportCatalog(S.exercises),null,2)],{type:'application/json;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`nexus-gymb-exercises-${localDate()}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
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
                    <textarea name="warmup-${n}" rows="3" maxlength="2000" placeholder="Наприклад: 5 хв ходьби, оберти плечима, легкі присідання">${esc(d.warmup || "")}</textarea>${btn('Шаблони розминки','warmup-templates',`type="button" data-target="builder" data-day="${n}"`,'ghost')}
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
                          ${alternativeExerciseField(i,n,j)}${i.custom ? field("Назва вправи своїми словами", `customname-${n}-${j}`, i.name, "text", 'required maxlength="100"') : ""}${trainingContextField(`machine-${n}-${j}`,i.machine || profileContext(S.activeTrainingProfileId))}${weightDetailsFields(i,`item-${n}-${j}-`)}<div class="formgrid">${field("Крок підказки ваги, кг", `weightstep-${n}-${j}`, i.weightStep ?? 2.5, "number", 'required min="0.01" max="100" step="0.01"')}${field("Група суперсету (необов’язково)", `superset-${n}-${j}`, i.superset || "", "text", 'maxlength="40" placeholder="Наприклад, A"')}</div><p class="small muted">Суперсет — дві вправи поспіль. Для пари впиши однакову групу, наприклад A, у двох вправ і задай однакову кількість підходів. Відпочинок — після обох вправ.</p>
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
      const alternativeId=String(v.get(`alternative-${n}-${j}`)||'');
      const alternative=S.exercises.find(e=>e.id===alternativeId&&!e.archived);
      if(alternative) i.alternativeExercise={id:alternative.id,name:alternative.name,primary:alternative.primary||'',equipment:alternative.equipment||''};
      else if(!alternativeId) delete i.alternativeExercise;
      i.weightStep = Number(v.get(`weightstep-${n}-${j}`));
      i.superset = String(v.get(`superset-${n}-${j}`) || '').trim();
      Object.assign(i,readWeightDetails(v,`item-${n}-${j}-`));
      i.machine = machineName(String(v.get(`machine-${n}-${j}`) || ""));
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
          Object.assign(plan,readWeightDetails(v,`plan-${n}-${j}-${k}-`));
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
  if (log.dropOf !== undefined) return `Дроп · зниження ${logs.slice(0,position+1).filter(entry=>entry.dropOf === log.dropOf).length}`;
  const number = logs.slice(0, position + 1).filter((l) => l.index === log.index && (log.warmup ? l.warmup : isWorkingSet(l))).length;
  if (log.quickResult) return "Найкращий результат за тренування";
  return `${log.warmup ? "Розминочний підхід" : "Робочий підхід"} ${number}`;
}
function previousWorkout(item, session) {
  const previous = previousResults(S.sessions, item, session.id);
  return `<details class="previous-workout" ${previous ? "open" : ""}><summary>Попередні результати${previous ? ` · ${esc(previous.session.date)}` : ""}</summary>${previous ? `<p class="small muted">${esc(previous.session.name)}</p>${previous.logs.map((l, k, logs) => `<p class="small">${setLogLabel(logs, k)}: ${repsLabel(l)} повторень · ${esc(weightLabel(l))}${l.seconds ? ` · ${l.seconds} сек` : ""}</p>${metricSummary(l.metrics)}`).join("")}` : '<p class="small muted">Для цієї вправи ще немає виконаних підходів у завершених тренуваннях.</p>'}</details>`;
}
function previousWeight(item, session, position) {
  const previous = previousResults(S.sessions, item, session.id, log => isWorkingSet(log));
  if (!previous) return '<p class="small muted previous-weight">Минулого разу: ще немає записаної ваги.</p>';
  const logs = position === undefined ? previous.logs : [previous.logs[Math.min(position, previous.logs.length - 1)]];
  return `<div class="notice previous-weight"><strong>Минулого разу${position === undefined ? '' : ` · підхід ${position + 1}`}</strong><p>${logs.map(log => `${esc(weightLabel(log))} × ${repsLabel(log)}`).join(' · ')}</p><span class="small muted">${esc(previous.session.date)}</span></div>`;
}
function trainingContextField(name,value,allowArchive=true) {
  const current=value || profileContext(defaultProfileId),profiles=availableProfiles(S.trainingProfiles,S.trainingProfileLimit);
  const archive=allowArchive && !profiles.some(profile=>profileContext(profile.id) === current);
  return `<label>Профіль тренувань<select name="${name}">${profiles.map(profile=>`<option value="${profileContext(profile.id)}" ${profileContext(profile.id) === current?'selected':''}>${esc(profile.name)}</option>`).join('')}${archive?`<option value="${esc(current)}" selected>${esc(profileLabel(current,S.trainingProfiles))}</option>`:''}</select></label>`;
}
function streakSettingsForm(){return ui`<form class="shared-streak-form"><label class="gym-setting-toggle"><span><strong>Спільна серія для всіх профілів</strong><small>Тренування з різних профілів підтримують одну серію.</small></span><input type="checkbox" name="shared" ${S.sharedStreak?'checked':''}/></label><button type="submit" class="btn secondary">Зберегти серію</button><div class="form-error" role="alert"></div></form>`;}
function trainingProfilesDialog() {
  const profiles=availableProfiles(S.trainingProfiles,S.trainingProfileLimit),palette=['#6c7fe7','#40a995','#c783af','#d0a057','#738eaf'];
  openModal(ui`<div class="profile-manager-heading"><div><span class="profile-manager-eyebrow">НАЛАШТУВАННЯ ПРОФІЛІВ</span><h2 id="training-profiles-title">Профілі тренувань</h2></div><button type="button" class="profile-manager-close" data-action="close" aria-label="Закрити">×</button></div>
    <div class="profile-manager-capacity"><div><strong>${profiles.length} / ${S.trainingProfileLimit}</strong><span>профілів створено</span></div><div class="profile-capacity-slots" aria-hidden="true">${Array.from({length:S.trainingProfileLimit},(_,index)=>`<i class="${index<profiles.length?'is-used':''}"></i>`).join('')}</div></div>
    ${S.trainingProfilesError?`<p class="notice error" role="alert">${esc(S.trainingProfilesError)}</p>`:''}
    <div class="profile-manager-list">${S.trainingProfiles.map(profile=>{
      const locked=!profiles.includes(profile),selected=profile.id===S.activeTrainingProfileId;
      const completed=sessionsForProfile(S.sessions,profile.id,S.trainingProfiles).filter(session=>session.status==='completed').length;
      const loads=Object.keys(profile.loads||{}).length,color=palette[(Number(profile.id.slice(-1))-1)%palette.length];
      return ui`<article class="profile-manager-item ${selected?'is-selected':''} ${locked?'is-locked':''}"><span class="profile-manager-monogram" style="--profile-tile-color:${color}" aria-hidden="true">${esc(Array.from(profile.name.trim())[0]?.toLocaleUpperCase(uiLocale())||'P')}</span><div class="profile-manager-details"><div><h3>${esc(profile.name)}</h3>${selected?ui`<span class="profile-selected-badge">✓ Активний</span>`:''}${locked?ui`<span class="profile-locked-badge">Недоступний</span>`:''}</div><p>${completed} ${uiText('тренувань')}<span>·</span>${loads} ${uiText('вправ із вагами')}</p></div><div class="profile-manager-actions">${btn(uiText(selected?'Вибрано':'Вибрати'),'select-training-profile',`data-id="${profile.id}" aria-pressed="${selected}" ${locked||selected||S.trainingProfilesError?'disabled':''}`,selected?'secondary':'')}${btn(uiText('Перейменувати'),'rename-training-profile',`data-id="${profile.id}" ${locked||S.trainingProfilesError?'disabled':''}`,'ghost')}</div></article>`;
    }).join('')}</div>
    ${streakSettingsForm()}<div class="profile-manager-footer"><div><strong>Історія профілів</strong><p>Перемикай профіль, щоб бачити його результати, ваги та підказки.</p></div>${btn(uiText('＋ Новий профіль'),'new-training-profile',profiles.length>=S.trainingProfileLimit||S.trainingProfilesError?'disabled':'','secondary')}</div><p class="profile-manager-limit">Стандартно доступно 3 профілі. Адміністратор може збільшити ліміт до 5.</p>`,'training-profiles-title','training-profiles-dialog');
}
function trainingProfileForm(id='') {
  const profile=id?assertProfileAvailable(S.trainingProfiles,id,S.trainingProfileLimit):null;
  if(!profile&&availableProfiles(S.trainingProfiles,S.trainingProfileLimit).length>=S.trainingProfileLimit)throw Error(uiText('Досягнуто ліміту профілів тренувань.'));
  const used=new Set(S.trainingProfiles.map(entry=>String(entry.legacyMachine||'').toLocaleLowerCase('uk')));
  const legacy=[...new Set([...S.sessions.flatMap(session=>session.logs.map(log=>log.machine)),...S.manualSets.map(entry=>entry.machine)].filter(value=>value&&!contextProfileId(value)&&!used.has(value.toLocaleLowerCase('uk'))))];
  openModal(ui`<div class="profile-manager-heading"><div><span class="profile-manager-eyebrow">ПРОФІЛЬ ТРЕНУВАНЬ</span><h2 id="training-profile-form-title">${uiText(profile?'Перейменувати профіль':'Новий профіль')}</h2><p>${uiText(profile?'Нова назва збереже всі твої результати.':'Створи окремий простір для нового формату тренувань.')}</p></div><button type="button" class="profile-manager-close" data-action="close" aria-label="Закрити">×</button></div><form id="training-profile-form" data-id="${id}">${field(uiText('Назва профілю'),'name',profile?.name||'','text','required maxlength="40" autocomplete="off"')}${!profile&&legacy.length?ui`<label>Прив’язати старі записи<select name="legacyMachine"><option value="">${uiText('Почати окрему історію')}</option>${legacy.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label>`:''}<div class="actions"><button class="btn" type="submit">${uiText(profile?'Зберегти назву':'Створити профіль')}</button>${btn(uiText('Скасувати'),'close','type="button"','ghost')}</div><div class="form-error" role="alert"></div></form>`,'training-profile-form-title','profile-name-dialog');
}
async function selectTrainingProfile(id) {
  if (S.trainingProfilesError) throw Error('Спочатку завантаж профілі тренувань.');
  assertProfileAvailable(S.trainingProfiles,id,S.trainingProfileLimit);
  const session=ongoing(),now=Date.now(),initialLoads=session?initialProfileLoads(session,S.trainingProfiles,S.trainingProfileLimit,now):[];
  const profiles=S.trainingProfiles.map(profile=>initialLoads.find(updated=>updated.id === profile.id)||profile);
  const profile=assertProfileAvailable(profiles,id,S.trainingProfileLimit),updated=session?applyTrainingProfile(session,profile):null;
  if(updated&&!updated.logs.length&&!updated.simpleCompleted?.length)updated.trainingProfileId=id;
  const entries=[[privatePath('trainingProfileSettings/selection'),{activeId:id,updatedAt:now}],...initialLoads.map(profile=>[privatePath(`trainingProfiles/${profile.id}`),stripId(profile)])];
  if (updated) entries.push([privatePath(`sessions/${updated.id}`),{...stripId(updated),updatedAt:now}]);
  await db.saveMany(entries);
  S.trainingProfiles=profiles;S.trainingProfilesStoredIds=[...new Set([...S.trainingProfilesStoredIds,...initialLoads.map(profile=>profile.id)])];
  S.activeTrainingProfileId=id;S.progressMachine=profileContext(id);S.progressExercise="";S.historyFilters={query:"",from:"",to:"",exercise:""};S.summaryId="";chosenDay=null;
  if (updated) {S.sessions=S.sessions.map(value=>value.id === updated.id?updated:value);try{clearSetDraft(localStorage,S.user.uid,updated.id);}catch{}}
  render();toast(`${uiText('Профіль')}: ${profile.name}`);
  if(navigator.onLine)db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions()).catch(error=>console.warn('Публікація профілю:',error.code));
}
function weightDetailsFields(value={},prefix='') {
  const details=weightDetails(value);
  return `<div class="formgrid weight-details" data-weight-details><label>Як записана вага<select name="${prefix}weightBasis" data-weight-basis>${Object.entries(weightBasisLabels).map(([key,title])=>`<option value="${key}" ${details.weightBasis === key?'selected':''}>${title}</option>`).join('')}</select></label><label data-weight-sides-field ${details.weightBasis === 'total'?'hidden':''}>Рук / сторін у цьому записі<select name="${prefix}weightSides"><option value="2" ${details.weightBasis === 'total'||details.weightSides === 2?'selected':''}>Дві — повторення на кожну</option><option value="1" ${details.weightBasis !== 'total'&&details.weightSides === 1?'selected':''}>Одна рука / сторона</option></select></label><p class="small muted weight-details-help" ${details.weightBasis === 'total'?'hidden':''}>Для гантелей і хамера вкажи вагу однієї руки / сторони. Повторення — на кожну вказану руку / сторону. Для роботи окремо або різної ваги ліворуч і праворуч записуй кожну руку / сторону з варіантом «Одна». Обсяг врахує вибрану кількість.</p></div>`;
}
function readWeightDetails(values,prefix='') {
  return weightDetails({weightBasis:String(values.get(`${prefix}weightBasis`) || 'total'),weightSides:Number(values.get(`${prefix}weightSides`) || 2)});
}
function updateWeightDetailsFields(form) {
  for (const group of form.querySelectorAll('[data-weight-details]')) {
    const hidden=group.querySelector('[data-weight-basis]').value === 'total';
    group.querySelector('[data-weight-sides-field]').hidden=hidden;
    const help=group.querySelector('.weight-details-help');if(help)help.hidden=hidden;
  }
}
function plateCalculatorKey() {return `nexus:plates:${S.user?.uid || 'local'}:${S.activeTrainingProfileId}`;}
function plateInventoryRow(row,index) {
  return `<div class="plate-inventory-row" data-plate-row="${index}"><label>Диск, кг<input name="plate-weight-${index}" type="number" min="0.01" max="50" step="0.01" value="${row.weight}" required /></label><label>Доступно пар<input name="plate-pairs-${index}" type="number" min="0" max="20" step="1" value="${row.pairs}" required /></label>${btn('Прибрати','remove-plate-row','type="button"','ghost')}</div>`;
}
function clearPlateCalculation() {
  plateCalculation=null;
  const result=modal.querySelector('#plate-calculator-result');if(result)result.innerHTML='';
}
function openPlateCalculator() {
  captureSetInputs();
  const form=document.querySelector('#set-form'),session=ongoing();
  const details=form?readWeightDetails(new FormData(form)):weightDetails();
  plateCalculationTarget=form && session?{sessionId:session.id,index:session.index,logs:session.logs.length,details}:null;
  plateCalculation=null;
  let config={barWeight:details.weightBasis === 'perSide'?0:20,plates:defaultPlates()};
  try {const saved=JSON.parse(localStorage.getItem(plateCalculatorKey())||'null');if(saved)config={barWeight:saved.mode === (details.weightBasis === 'perSide'?'perSide':'total')?Math.max(0,Math.min(100,Number(saved.barWeight)||0)):config.barWeight,plates:plateInventory(saved.plates)};}catch{}
  let target='';
  if(form && details.weightBasis !== 'perHand')try{const parsed=parseWeight(form.elements.weight.value);if(!parsed.weightUnknown)target=parsed.weight;}catch{}
  openModal(`<div class="sectionhead"><h2>Калькулятор дисків</h2>${btn('Закрити','close','','ghost')}</div><p class="small muted">Однакові диски на обидва боки штанги або хамера. Враховуються лише доступні пари; вага грифа / основи додається окремо.</p><form id="plate-calculator-form"><div class="formgrid">${field('Цільова вага, кг','target',target,'number','required min="0" max="1000" step="0.01"')}<label>Ціль указана як<select name="mode"><option value="total" ${details.weightBasis !== 'perSide'?'selected':''}>Загальна вага разом з основою</option><option value="perSide" ${details.weightBasis === 'perSide'?'selected':''}>Диски на одну сторону</option></select></label>${field('Гриф / основа, кг','barWeight',config.barWeight,'number','required min="0" max="100" step="0.01"')}</div><p class="small muted">Для хамера можна вказати основу 0 кг і рахувати лише додані диски. Калькулятор не оцінює силу важелів тренажера.</p><details class="plate-inventory"><summary>Доступні диски</summary><p class="small muted">Одна пара — це два однакові диски, по одному на кожен бік. Немає такого розміру — вкажи 0 пар.</p><div id="plate-inventory-rows">${config.plates.map(plateInventoryRow).join('')}</div>${btn('＋ Додати розмір','add-plate-row','type="button"','ghost')}</details><button class="btn" type="submit">Розрахувати</button><div class="form-error" role="alert"></div></form><div id="plate-calculator-result" aria-live="polite"></div>`);
}
function plateCalculatorResult(result) {
  const side=result.perSide.map(row=>`${row.weight} кг × ${row.count}`).join(' + ') || 'Без дисків';
  const plates=result.perSide.flatMap(row=>Array.from({length:row.count},()=>row.weight));
  const stack=values=>values.map(value=>`<span class="plate-disc" style="--plate-height:${Math.min(84,28+value*2)}px">${value}</span>`).join('');
  const canApply=plateCalculationTarget && plateCalculationTarget.details.weightBasis !== 'perHand';
  const value=plateCalculationTarget?.details.weightBasis === 'perSide'?result.perSideWeight:result.total;
  return `<section class="plate-result"><span class="badge">${result.exact?'Точна вага':'Найближча доступна нижча вага'}</span><h3>${result.total} кг разом</h3>${result.exact?'':`<p class="small muted">Ціль ${result.targetTotal} кг недоступна з цими дисками.${result.higherTotal !== null?` Найближча вища вага: ${result.higherTotal} кг.`:' Більшу вагу з наявних пар зібрати неможливо.'}</p>`}<div class="plate-barbell" aria-hidden="true"><div class="plate-stack">${stack([...plates].reverse())}</div><span class="plate-bar-grip"></span><div class="plate-stack">${stack(plates)}</div></div><p><strong>На кожен бік:</strong> ${side}</p><p class="small muted">Гриф / основа: ${result.barWeight} кг · Диски на сторону: ${result.perSideWeight} кг · Усього дисків: ${result.plateCount}</p>${canApply?btn(`Підставити ${value} кг у підхід`,'apply-plate-result','','secondary'):''}${plateCalculationTarget?.details.weightBasis === 'perHand'?'<p class="small muted">Для гантелей введи вагу однієї гантелі безпосередньо в підхід. Цей калькулятор збирає симетричну штангу або тренажер.</p>':''}</section>`;
}
function workoutLoadButton(item, index) {
  return `<div class="actions">${btn('Профіль і ваги підходів','workout-load',`data-index="${index}"`,'ghost')}<span class="small muted">${esc(profileLabel(item.machine,S.trainingProfiles))}</span></div>`;
}
function workoutLoadEditor(index) {
  const session = ongoing(), item = session?.items[index];
  if (!item) throw Error('Вправу не знайдено.');
  const program = S.programs.find(p=>p.id === session.programId);
  const matchingItems = program?.days.find(day=>day.weekday === session.dayId)?.items.filter(entry=>exerciseKey(entry) === exerciseKey(item)) || [];
  const partner=supersetPartner(session.items,index);
  openModal(`<h2>Профіль і ваги підходів</h2><p>${esc(item.name)}</p><p class="small muted">Ваги й підказки зберігаються окремо для вибраного профілю тренувань. Нові ваги застосуються до наступних підходів; виконані записи залишаться в історії.</p><form id="workout-load-form" data-session="${esc(session.id)}" data-index="${index}">${trainingContextField('machine',item.machine || profileContext(S.activeTrainingProfileId))}${weightDetailsFields(item)}${field('Крок підказки ваги, кг','weightStep',item.weightStep ?? 2.5,'number','required min="0.01" max="100" step="0.01"')}<label>Вправа в парі для суперсету<select name="supersetPartner"><option value="-1">Без суперсету</option>${session.items.map((entry,k)=>k === index ? '' : `<option value="${k}" ${partner === k ? 'selected' : ''}>${esc(entry.name)} · ${entry.sets} підходів</option>`).join('')}</select></label><p class="small muted">Суперсет: підхід першої вправи → підхід другої → відпочинок. У пари має бути однакова кількість підходів. Обирай пару до першого запису. Це необов’язкова функція.</p>${Array.from({length:item.sets},(_,k)=>{const plan=setPlan(item,k);return `<fieldset><legend>Підхід ${k+1}</legend><div class="formgrid">${field('Вага, кг',`weight-${k}`,plan.weight,'number','required min="0" max="1000" step="any"')}${field('Повторення',`reps-${k}`,plan.reps || 0,'text','required maxlength="12" placeholder="10-12"')}</div></fieldset>`;}).join('')}<label><input name="rememberProfile" type="checkbox" checked /> Запам’ятати ці ваги в цьому профілі</label>${matchingItems.length === 1 ? '<label><input name="remember" type="checkbox" /> Зберегти налаштування у програмі для наступних тренувань</label>' : ''}<button class="btn" type="submit">Зберегти налаштування</button><div class="form-error" role="alert"></div></form>`);
}
function progressHistory(analytics) {
  if (S.progressMetric === 'frequency') return '';
  const since = new Date();since.setDate(since.getDate() - Number(S.progressPeriod));
  const entries = analytics.filter(s=>s.status === 'completed' && (S.progressPeriod === 'all' || s.date >= localDate(since))).flatMap(session=>session.logs.flatMap(log=>!log.warmup && session.items[log.index] && exerciseKey(session.items[log.index]) === S.progressExercise && (S.progressMachine === '*' || sameMachine(log,S.progressMachine)) ? [{session,log}] : []))
    .sort((a,b)=>b.session.date.localeCompare(a.session.date) || b.session.endedAt-a.session.endedAt).slice(0,12);
  return `<details class="previous-workout"><summary>Змінити результати · ${entries.length}</summary><p class="small muted">Нове навантаження для профілю задавай у «Профіль і ваги підходів» під час тренування. Тут можна виправити вже збережені записи.</p>${entries.map(({session,log})=>`<div class="manual-set-row progress-result-row"><span>${esc(session.date)} · ${esc(weightLabel(log))} × ${repsLabel(log)} · ${esc(profileLabel(log.machine,S.trainingProfiles))}</span>${btn('Змінити',session.manualSet ? 'edit-manual-set' : 'edit-history',`data-id="${esc(session.manualSet ? session.id.slice(11) : session.id)}"`,'ghost')}</div>`).join('') || '<p class="muted">Записів ще немає.</p>'}</details>`;
}
function editManualSet(id) {
  const entry = S.manualSets.find(record=>record.id === id);
  if (!entry) throw Error('Підхід не знайдено.');
  openModal(`<h2>Змінити підхід</h2><p>${esc(entry.exercise)}</p><form id="edit-manual-set-form" data-id="${esc(id)}"><div class="formgrid">${field('Вага, кг','weight',entry.weight,'number','required min="0" max="1000" step="any"')}${field('Повторення','reps',repsLabel(entry),'text','required maxlength="12" placeholder="10-12"')}${trainingContextField('machine',entry.machine || '')}${weightDetailsFields(entry)}${field('Дата','date',entry.date,'date',`required max="${localDate()}"`)}</div><button class="btn" type="submit">Зберегти зміни</button><div class="form-error" role="alert"></div></form>`);
}
function progressView() {
  const analytics = progressSessions(S.progressSource === 'manual' ? [] : profileSessions(), S.progressSource === 'workouts' ? [] : profileManualSets());
  const items = new Map();
  analytics.filter((s) => s.status === "completed").forEach((s) => s.items.forEach((i, index) => {
    if (s.simpleCompleted?.includes(index) || s.logs.some((l) => l.index === index && !l.warmup)) items.set(exerciseKey(i), i.name);
  }));
  if (!items.has(S.progressExercise)) S.progressExercise = items.keys().next().value || "";
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - +S.progressPeriod);
  S.progressMachine=profileContext(S.activeTrainingProfileId);
  const points = progressSeries(S.progressMetric === 'frequency' ? (S.progressSource === 'manual' ? [] : profileSessions()) : analytics, { metric: S.progressMetric, key: S.progressExercise,
    machine: null, since: S.progressPeriod === "all" ? "" : localDate(sinceDate) });
  const units = { weight: uiText("кг"), volume: uiText("кг × повторення"), frequency: uiText("тренувань"), performed: uiText("виконань") };
  return ui`<section class="card progress-section"><h2>Прогрес ${privateProfileBadge()}</h2>
    <p class="small muted">Переглядай результати завершених тренувань і підходів, записаних вручну.</p>
    <div class="formgrid"><label>Джерело даних<select id="progress-source">${[['all',uiText('Усі результати')],['workouts',uiText('Із тренувань')],['manual',uiText('Ручні записи')]].map(([v,label])=>ui`<option value="${v}" ${S.progressSource === v ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Показник<select id="progress-metric">${[["weight", uiText("Найбільша виконана вага")], ["volume", uiText("Обсяг вправи")], ["performed", uiText("Виконання вправи")], ["frequency", uiText("Тренування за місяць")]].map(([v, label]) => ui`<option value="${v}" ${S.progressMetric === v ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <label>Період<select id="progress-period">${[["30", uiText("30 днів")], ["90", uiText("90 днів")], ["365", uiText("Рік")], ["all", uiText("Увесь час")]].map(([v, label]) => ui`<option value="${v}" ${S.progressPeriod === v ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    ${S.progressMetric !== "frequency" ? ui`<label>Вправа<select id="progress-exercise">${items.size ? [...items].sort((a, b) => a[1].localeCompare(b[1], "uk")).map(([key, name]) => ui`<option value="${esc(key)}" ${S.progressExercise === key ? "selected" : ""}>${esc(name)}</option>`).join("") : uiText('<option value="">Ще немає результатів</option>')}</select></label>` : ""}</div>

    <p class="small muted">Для приблизних повторень обсяг рахується за нижньою межею. Вага на руку / сторону множиться на вибрану кількість; графік ваги показує сумарне навантаження.</p>
    <p class="small muted">${S.progressMetric === "performed" ? uiText("Кількість виконань вправи за день: один раз за тренування або за ручний запис. Враховуються й позначки виконання без ваги.") : S.progressMetric === "volume" ? uiText("Сума ваги × повторень у виконаних підходах за день.") : S.progressMetric === "frequency" ? uiText("Кількість завершених тренувань за місяць у вибраному періоді. Ручні записи не враховуються.") : uiText("Найбільша вага у виконаному підході за день. Для тренувань без записаної ваги обери «Виконання вправи».")}</p>
    ${points.length ? progressChart(points, units[S.progressMetric]) : uiText('<p class="muted">Немає результатів за вибраний період.</p>')}
    ${progressHistory(analytics)}
    <details class="statistics-manual-entry"><summary>Записати підхід вручну або переглянути ручні записи</summary>${manualSetsPanel(items)}</details>
  </section>`;
}
function manualSetsPanel(items = new Map()) {
  const known = new Map(items);
  for (const exercise of S.exercises) if (exercise?.name) known.set(exerciseKey(exercise), exercise.name);
  const options = [...new Set([...known.values()])].sort((a,b)=>a.localeCompare(b,'uk'));
  const recent = [...profileManualSets()].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || Number(b.createdAt||0)-Number(a.createdAt||0)).slice(0,12);
  return ui`<div class="manual-sets"><div class="manual-set-entry"><div><span class="private-label">Бачиш тільки ти</span><h3>Записати підхід</h3><p class="small muted">Для підходу поза запущеним тренуванням.</p></div><form id="manual-set-form">
    <label>Вправа<input name="exercise" list="manual-exercises" maxlength="100" required autocomplete="off" placeholder="Наприклад, тяга" /></label><datalist id="manual-exercises">${options.map(name=>ui`<option value="${esc(name)}"></option>`).join('')}</datalist>
    <div class="formgrid"><label>Вага, кг<input name="weight" type="number" min="0" max="1000" step="0.25" inputmode="decimal" required /></label><label>Повторення<input name="reps" type="text" maxlength="12" placeholder="10 або 10-12" required /></label>${weightDetailsFields()}${trainingContextField('machine',profileContext(S.activeTrainingProfileId))}<label>Дата<input name="date" type="date" max="${localDate()}" value="${localDate()}" required /></label></div>
    <button class="btn" type="submit">Зберегти підхід</button><div class="form-error" role="alert"></div></form></div>
    <div class="manual-set-history"><div class="sectionhead"><div><h3>Останні підходи</h3><p class="small muted">Ручні записи враховуються у графіку та рекордах, але не в серії тренувань.</p></div></div>${S.manualSetsError?uiText('<p class="error" role="alert">Не вдалося завантажити ручні підходи.</p>'):''}${recent.length?recent.map(entry=>ui`<div class="manual-set-row"><div><strong>${esc(entry.exercise)}</strong><small>${esc(entry.date)} · ${esc(profileLabel(entry.machine,S.trainingProfiles))}</small></div><span>${esc(weightLabel(entry))} × ${repsLabel(entry)}</span>${btn(uiText('Змінити'),'edit-manual-set',ui`data-id="${esc(entry.id)}"`,'ghost')}${btn(uiText('Видалити'),'delete-manual-set',ui`data-id="${esc(entry.id)}" data-name="${esc(entry.exercise)}"`,'ghost')}</div>`).join(''):uiText('<p class="muted">Тут з’являться підходи, які ти запишеш вручну.</p>')}</div></div>`;
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
  return (!navigator.onLine || pending || S.syncError) ? ui`<div class="notice" role="status">${S.syncError ? esc(S.syncError) : !navigator.onLine ? uiText("Немає мережі. Особисті зміни зберігаються на пристрої.") : uiText("Синхронізація…")}${pending ? ui` Очікують відправлення: ${pending}.` : ""}${navigator.onLine && pending ? btn(uiText("Синхронізувати"), "sync-now", "", "ghost") : ""}</div>` : "";
}
function updateSyncNotice() { const box = document.querySelector("#offline"); if (box) box.innerHTML = syncNotice(); }
function soundControls() {
  return ui`<div class="timer-settings"><label class="photo-toggle"><input type="checkbox" id="timer-sound" ${S.timerSound ? "checked" : ""} /> Звук завершення таймера</label><label class="photo-toggle"><input type="checkbox" id="timer-vibration" ${S.timerVibration ? "checked" : ""} /> Вібрація</label></div>`;
}
function checkTimerNotifications() {
  const ended = expiredTimers(gymTimerSession(ongoing(),gymPrefs()), notifiedTimers);
  if (!ended.length) return;
  toast(ended.includes("restEnd") ? "Відпочинок завершено" : "Час вправи завершено");
  if (S.timerSound) timerSound.play();
  if (S.timerVibration) navigator.vibrate?.([150, 80, 150]);
}
function historyTools() {
  const f = S.historyFilters, items = new Map();
  profileSessions().filter((s) => s.status === "completed").forEach((s) => s.items.forEach((i) => items.set(i.exerciseId || `name:${i.name.toLocaleLowerCase("uk").replace(/[’'ʼ]/g, '').trim()}`, i.name)));
  return `<div class="formgrid history-tools"><label>Пошук<input id="history-search" type="search" value="${esc(f.query)}" placeholder="Назва тренування або вправи" /></label><label>Вправа<select data-history-filter="exercise"><option value="">Усі вправи</option>${[...items].map(([id, name]) => `<option value="${esc(id)}" ${id === f.exercise ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label><label>Від<input type="date" data-history-filter="from" value="${esc(f.from)}" /></label><label>До<input type="date" data-history-filter="to" value="${esc(f.to)}" /></label></div>${btn("Скинути фільтри", "reset-history-filters", "", "ghost")}`;
}
function filteredHistory() {
  const list = filterHistory(profileSessions(), S.historyFilters);
  return `<p class="small muted" role="status">Знайдено тренувань: ${list.length}</p>${list.length ? history(list) : '<p class="muted">Немає тренувань за вибраними умовами.</p>'}`;
}
function historyEditForm(s) {
  if (s?.status !== "completed") throw Error("Завершене тренування не знайдено.");
  openModal(`<h2>Виправити тренування</h2><form id="history-edit-form" data-id="${esc(s.id)}">
    ${field("Назва", "name", s.name, "text", 'required maxlength="100"')}
    <div class="formgrid">${field("Дата", "date", s.date, "date", `required max="${localDate()}"`)}${field("Тривалість, хв", "minutes", Math.round((s.endedAt - s.startedAt) / 60000), "number", 'required min="0" max="1440"')}</div>
    <label>Опис<textarea name="description" rows="3" maxlength="4000">${esc(s.description || "")}</textarea></label>
    ${s.logs.map((l, k) => `<fieldset class="performance-entry"><legend>${esc(s.items[l.index].name)} · ${setLogLabel(s.logs, k)}</legend><div class="formgrid">${field("Повторення", `log-reps-${k}`, repsLabel(l), "text", 'required maxlength="12" placeholder="10-12"')}${field("Вага: кг або плитки", `log-weight-${k}`, l.weightText || l.weight, "text", 'required maxlength="30"')}${trainingContextField(`log-machine-${k}`,l.machine || "")}${weightDetailsFields(l,`log-${k}-`)}${field("Час, сек", `log-seconds-${k}`, l.seconds || 0, "number", 'required min="0" max="7200"')}${(l.metrics || []).map((m, j) => field(`${m.name} ${m.unit}`, `log-metric-${k}-${j}`, m.value, "text", 'required maxlength="80"')).join("")}</div></fieldset>`).join("")}
    <div class="actions"><button type="submit" class="btn">Зберегти виправлення</button>${btn("Скасувати", "close", 'type="button"', "ghost")}</div><div class="form-error" role="alert"></div></form>`);
}
function restorePreview() {
  const { entries, skipped } = backupEntries(restoreDraft, S, S.user.uid);
  openModal(`<h2>Відновити резервну копію</h2><p>Програм: ${restoreDraft.programs.length}, тренувань: ${restoreDraft.sessions.length}, особистих вправ: ${restoreDraft.exercises.length}, записів замірів: ${restoreDraft.measurements?.length || 0}, ручних підходів: ${restoreDraft.manualSets?.length || 0}.</p><p>Буде додано записів: ${entries.length}. Пропущено наявних записів або активних тренувань: ${skipped.length}.</p><p class="muted">Поточні дані залишаються. Записи з однаковими ID пропускаються.</p><div class="actions">${btn("Відновити", "confirm-restore", entries.length ? "" : "disabled")}${btn("Скасувати", "close", "", "ghost")}</div>`);
}
function streakCard() {
  const streak = trainingStreak(ownStreakSessions());
  return ui`<section class="streak-card" aria-label="Серія тренувань"><span class="streak-flame" aria-hidden="true">🔥</span><div><strong>${streak.current} тиж. поспіль</strong>${S.sharedStreak?'<small>Усі профілі</small>':''}</div></section>`;
}
function recordsCard(records = personalRecords(progressSessions(profileSessions(),profileManualSets())),publicOnly=false) {
  const own=!publicOnly&&S.route==='statistics'&&S.people?.uid===S.user.uid;
  const enabled=profileVisibility(S.people?.person).records;
  const selected=new Set(recordSharingKeys(records,S.recordVisibility??null,enabled));
  const unavailable=S.communityLoading||S.people?.warnings?.includes('видимість рекордів');
  return `<section class="card personal-records" ${own?'id="personal-records"':''}><h2>🏆 Особисті рекорди ${privateProfileBadge('records')}</h2><p class="small muted">Найкраща робоча вага та повторення з нею у завершених тренуваннях.${own?' Обери, які рекорди показувати іншим. Вибір зберігається для вправи, навіть коли її рекорд оновиться.':''}</p>${own&&!enabled?'<p class="small muted">Зараз розділ приховано. «Показати іншим» увімкне показ вибраних рекордів.</p>':''}${unavailable?'<p class="small error" role="alert">Не вдалося завантажити видимість рекордів. Онови профіль, перш ніж змінювати її.</p>':''}${records.length?records.map(record=>{
    const shared=enabled&&selected.has(record.key);
    return `<div class="record-row" data-record-key="${esc(record.key)}"><div class="record-name"><strong>${esc(record.name)}</strong>${own?`<span class="${shared?'record-public-label':'private-label'}">${shared?'Показано іншим':'Бачиш тільки ти'}</span>`:''}</div><span class="record-result">${esc(weightLabel(record))} × ${repsLabel(record)}<small>${esc(record.date)}</small></span>${own?btn(shared?'Сховати':'Показати іншим','toggle-record-visibility',`data-key="${esc(record.key)}" data-visible="${!shared}" aria-pressed="${shared}" ${unavailable?'disabled':''}`,shared?'ghost':'secondary'):''}</div>`;
  }).join(''):'<p class="muted">Збережи перше тренування з робочими підходами — тут з’являться твої рекорди.</p>'}</section>`;
}
const profileUid = () => {
  if (requestedProfileNumber()) return S.people?.uid || null;
  const uid = new URLSearchParams(location.search).get('uid');
  return uid && /^[A-Za-z0-9_-]{1,128}$/.test(uid) ? uid : S.user?.uid;
};
function personAvatar(person) { return renderAvatar(person||{}); }
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
    if(person)person.uid=uid;
    if(person&&!person.restricted) {
      const music=await optional('плейлісти',async()=>{
        try{return await db.getLive(`publicProfiles/${uid}/music/playlists`);}
        catch(error){if(uid!==userId&&error.code==='permission-denied')return null;throw error;}
      },{unavailable:true});
      person.music=music?.unavailable?null:music;
      person.musicUnavailable=music?.unavailable===true;
    }
    if (!isCurrent()) return;
    if (S.route === 'settings' && uid === userId) {
      S.selfPublic = person;
      S.people = { uid, person, profiles: {}, relations: [], comments: [], stats: {}, publicFriends: [], recent: [], tags: [], warnings: [], error: '' };
      return;
    }
    onIdentity?.({ uid, person });
    const medals=person?.restricted?null:await optional('медалі',()=>db.getLive(`publicProfiles/${uid}/achievements/showcase`),null);
    const layout=person?.restricted?null:await optional('порядок блоків',()=>db.getLive(`publicProfiles/${uid}/layout/display`),null);
    const featuredMonth=person?.restricted?null:await optional('підсумок місяця',()=>db.getLive(`publicProfiles/${uid}/monthlySummaries/featured`),null);
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
    const stats = uid===userId?{...profileSnapshots(S.sessions,null,S.manualSets,person,S.programs),lastActive:{at:S.profile?.lastActiveAt||Date.now()}}:{};
    if (uid !== userId && person && !person.restricted) await Promise.all(Object.entries(profileVisibility(person)).map(async ([key, visible]) => {
      if (visible && !['gymBros','activity','workouts'].includes(key)) try { stats[key] = await db.getLive(`publicProfiles/${uid}/stats/${key}`); }
      catch (error) { if (error.code !== 'permission-denied') throw error; }
    }));
    const visibility = profileVisibility(person);
    const recent = !person?.restricted && (uid === userId || visibility.activity) ? await optional('стрічка активності', () => db.recentActivity(uid), []) : [];
    const workouts = !person?.restricted && (uid === userId || (visibility.activity && visibility.workouts)) ? await optional('активність тренувань', () => db.recentActivity(uid, true), []) : [];
    if (!isCurrent()) return;
    if (uid === userId) S.recordVisibility = recordVisibility;
    S.people = { layout,monthlySummary:featuredMonth,achievementShowcase:medals, recent: [...recent, ...workouts].sort((a,b) => activityMillis(b.createdAt)-activityMillis(a.createdAt)).slice(0,30), uid, person, relations, comments: comments.filter((c)=>!S.blocked.some((b)=>b.id === c.authorId)), profiles, stats, publicFriends, block, tags: labels?.tags || [], warnings: [...new Set(warnings)], error: '' };
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
  if (!visibility.activity) return '';
  const entries=(S.people.recent||[]).filter(entry=>entry.type!=='workout'||visibility.workouts);
  return `<section class="card recent-activity"><h2>Остання активність ${privateProfileBadge("activity")}</h2>${activityEntries(entries.slice(0,5))}${entries.length>5?btn('Показати всі','show-all-activity','aria-haspopup="dialog"','secondary wide'):''}</section>`;
}
function activityEntries(entries) {
  const visibility=profileVisibility(S.people.person);
  const labels = { workout: 'Завершено тренування', comment: 'Залишено коментар', reply: 'Відповідь на коментар', rating: 'Поставлено оцінку', reaction: 'Реакція на коментар' };
  return entries.filter(entry=>entry.type!=='workout'||visibility.workouts).map(entry => {
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
  return `<section class="card profile-comments"><div class="sectionhead"><h2>Коментарі</h2></div>${view.block?.iBlocked || view.block?.blockedMe ? '<p class="muted">Коментування недоступне.</p>' : `<form id="profile-comment-form">${personAvatar(S.selfPublic || S.profile)}<div class="comment-compose">${target ? `<div class="reply-target"><span>Відповідь для ${esc(target.authorName)}</span>${btn('Скасувати відповідь','cancel-comment-reply','type="button"','ghost')}</div>` : ''}${richComposer({photos:true,placeholder:target?'Написати відповідь…':'Написати коментар…'})}<button class="btn" type="submit">${target ? 'Надіслати відповідь' : 'Надіслати'}</button><div class="form-error" role="alert"></div></div></form>`}<div class="profile-comment-list">${view.comments.slice(0,8).map(comment=>commentMarkup(comment,!!comment.parentId)).join('') || '<p class="muted">Коментарів ще немає.</p>'}</div>${view.comments.length>8?btn('Показати всі коментарі','show-all-comments','aria-haspopup="dialog"','secondary wide'):''}</section>`;
}
function resumeReminder() {
  const session = S.loaded && ongoing();
  if (!session || ['session','home','editor'].includes(S.route)) return '';
  return ui`<section class="resume-reminder"><div><strong>Незавершене тренування: ${esc(session.name)}</strong><p class="small muted">${session.logs.filter(isWorkingSet).length} основних підходів · ${session.logs.filter(log=>log.dropOf !== undefined).length} дропів · ${esc(session.date)}</p></div>${btn(uiText('Продовжити тренування'),'resume','','secondary')}</section>`;
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
  updateWeightDetailsFields(form);
}
async function loadSafety(isCurrent = () => true) {
  const blocked = await db.blockedUsers();
  const profiles = Object.fromEntries(await Promise.all(blocked.map(async (b)=>[b.id, await db.publicIdentity(b.id)])));
  if (!isCurrent()) return;
  S.blocked = blocked;
  S.blockedProfiles = profiles;
}
function blockedPanel() {
  return ui`<section class="card"><h2>Заблоковані користувачі</h2><p class="small muted">Вони не можуть коментувати твій профіль, відповідати тобі чи надсилати заявки й запрошення. Блокування прибирає дружбу.</p>${S.blocked.map((b)=>ui`<div class="gym-bro-row">${personAvatar(S.blockedProfiles[b.id])}<strong class="grow">${esc(S.blockedProfiles[b.id]?.name || uiText('Спортсмен'))}</strong>${btn(uiText('Розблокувати'),'unblock-person',ui`data-id="${esc(b.id)}"`,'secondary')}</div>`).join('') || uiText('<p class="muted">Немає заблокованих користувачів.</p>')}</section>`;
}
function personActions(uid) {
  const blocked=S.blocked.some(b=>b.id===uid);
  const relation=S.people?.relations?.find(r=>r.status==='accepted'&&r.members.includes(uid));
  return `<details class="person-actions-menu"><summary aria-label="Дії з користувачем" title="Дії з користувачем">⋯</summary><div class="person-actions-list" role="group" aria-label="Дії з користувачем">${relation?btn('Прибрати з друзів','friend-remove',`data-id="${esc(relation.id)}"`,'ghost'):''}${blocked?btn('Розблокувати','unblock-person',`data-id="${esc(uid)}"`,'ghost'):btn('Заблокувати','block-person',`data-id="${esc(uid)}"`,'ghost')}${btn('Поскаржитися','report-person',`data-id="${esc(uid)}"`,'ghost')}</div></details>`;
}
function privateProfileBadge(key) {
  if(S.route==='statistics')return '<span class="private-label">Бачиш тільки ти</span>';
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
  if (!profileVisibility(view.person).gymBros) return '';
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
    return `<div class="gym-bro-row"><button class="comment-avatar" data-action="view-person" data-id="${esc(uid)}" aria-label="Профіль ${esc(person?.name || 'спортсмена')}">${personAvatar(person)}</button><div class="grow"><button class="person-link" data-action="view-person" data-id="${esc(uid)}">${esc(person?.name || 'Спортсмен')}</button>${requests ? `<p class="small muted">${r.to === S.user.uid ? 'Вхідна заявка' : 'Заявку надіслано'}</p>` : ''}</div>${own ? `<div class="actions">${friendButtons(uid)}${r.status === 'accepted' ? btn('Запросити на тренування','invite-workout',`data-id="${esc(uid)}"`,'secondary')+btn('Узгодити час','new-meeting-poll',`data-id="${esc(uid)}"`,'ghost')+personActions(uid) : ''}</div>` : ''}</div>`;
  }).join('');
  openModal(`<div class="sectionhead"><h2 id="gym-bro-title">Gym Bro · ${view.publicFriends.length}</h2>${btn('Закрити','close','','ghost')}</div>${own ? `<form id="find-person-form"><label>Знайти за ID<input name="number" inputmode="numeric" pattern="[0-9]+" required maxlength="12" placeholder="ID користувача" /></label><button class="btn secondary" type="submit">Відкрити профіль</button><div class="form-error" role="alert"></div></form>` : ''}${pending.length ? `<h3 class="people-subtitle">Заявки</h3>${list(pending,true)}` : ''}<div class="gym-bro-directory">${list(view.publicFriends) || '<p class="muted">Ще немає Gym Bro</p>'}</div>${own && S.invites.length ? `<h3 class="people-subtitle">Спільні тренування</h3>${S.invites.map((invite)=>`<div class="gym-bro-row"><div class="grow"><strong>${esc(invite.program.name)}</strong><p class="small muted">${esc(formatScheduledTime(invite.date,invite.time,uiLocale()))} · ${{pending:'Очікує відповіді',accepted:'Прийнято',declined:'Відхилено',cancelled:'Скасовано'}[invite.status]}</p></div>${btn('Переглянути','view-training-invite',`data-id="${esc(invite.id)}"`,'secondary')}</div>`).join('')}` : ''}`, 'gym-bro-title');
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
  return ui`<section class="card"><h2>Зв’язатися зі мною</h2><p class="muted small">Ці посилання бачитимуть інші користувачі у твоєму профілі. Поля необов’язкові.</p>${contactLinks(S.people.person)}
    <form id="contacts-form"><div class="formgrid"><label>Instagram<input name="instagram" maxlength="200" placeholder="@username або посилання" value="${esc(contacts.instagram || '')}" /></label><label>Telegram<input name="telegram" maxlength="200" placeholder="@username або посилання" value="${esc(contacts.telegram || '')}" /></label></div><p class="small muted">Очисть поле й збережи, щоб прибрати контакт.</p><button class="btn secondary" type="submit">Зберегти контакти</button><div class="form-error" role="alert"></div></form></section>`;
}
function profileTagMarkup(tags) {
  return `<div class="profile-tags">${(tags || []).map((tag)=>{
    try { const value = tagData([tag])[0]; return `<span class="user-tag" data-effect="${value.effect}" data-shadow="${value.shadow}" style="${tagStyle(value)}">${esc(value.text)}</span>`; } catch { return ''; }
  }).join('')}</div>`;
}
function profileHero(person, own) {
  const banner = bannerSource(person.banner);
  const lastActive=profileVisibility(person).lastActive?S.people?.stats?.lastActive?.at:null;
  const streak = !profileVisibility(person).streak?null:own?trainingStreak(ownStreakSessions()).current:visibleProfileStreak(S.people?.stats?.streak);
  return `<section class="profile-hero"><div class="profile-cover">${banner ? `<img class="profile-banner" src="${esc(banner)}" alt="Банер профілю" />` : ''}</div><div class="profile-identity"><div class="profile-portrait">${personAvatar(person)}</div><div class="profile-title">${profileTagMarkup(S.people?.tags)}<div class="profile-identity-meta"><span class="profile-location">${person.location ? `${esc(person.location)} · ` : ''}#${esc(person.customId || '…')}</span>${streak !== null ? `<span class="profile-streak" aria-label="Серія тренувань">🔥 ${streak} тиж. поспіль ${privateProfileBadge("streak")}</span>` : ''}${lastActive ? `<span class="profile-last-active"><i class="activity-dot"></i><span>Був(-ла) у мережі <time>${displayDate(lastActive)}</time></span>${privateProfileBadge('lastActive')}</span>` : ''}</div><h1>${esc(person.name || S.user.displayName)}</h1>${person.joinedAt||person.createdAt?`<p class="profile-membership"><span aria-hidden="true">◷</span> З нами ${memberDays(person.joinedAt||person.createdAt)} дн.</p>`:''}${person.isPrivate?'<span class="badge profile-closed-badge">Закритий профіль</span>':''}${person.bio ? `<div class="profile-bio">${renderComment({text:person.bio,richText:person.bioRich})}</div>` : ''}${contactLinks(person)}</div><div class="profile-identity-actions">${own ? btn('Редагувати профіль','route','data-id="settings"','')+btn('Копіювати посилання','copy-profile-link','','secondary') : friendButtons(S.people.uid)+personActions(S.people.uid)}</div></div></section>`;
}
function visibleProfileStreak(streak) {
  if (!streak) return null;
  const day = streak.lastWorkoutDate;
  const weeksOld = day ? Math.floor((Date.parse(localDate()+'T00:00:00Z') - Date.parse(day+'T00:00:00Z') + ((new Date(day+'T00:00:00Z').getUTCDay()+6)%7)*86400000) / (7*86400000)) : 99;
  return weeksOld <= 1 ? streak.current : 0;
}
function sharedStats(stats=S.people?.stats||{}) {
  return `${stats.progress?`<section class="card profile-progress-summary"><h2>Прогрес спортсмена ${privateProfileBadge('progress')}</h2><div class="profile-metrics"><div><strong>${stats.progress.workouts}</strong><span>Тренувань</span></div><div><strong>${stats.progress.sets}</strong><span>Підходів</span></div><div><strong>${Math.round(stats.progress.volume)}</strong><span>кг загалом</span></div></div></section>`:''}`;
}
function profile() {
  if (S.communityLoading && !S.people?.person) return heading('Профіль спортсмена') + '<section class="card" role="status">Завантажуємо профіль…</section>';
  if (S.people?.loading) return `<div ${profileAppearanceAttributes(S.people.person)}><section class="card">${personAvatar(S.people.person)}<h1>${esc(S.people.person.name || 'Спортсмен')}</h1><p role="status">Завантажуємо розділи профілю…</p></section></div>`;
  if(!S.people?.person||S.people.error)return heading('Профіль спортсмена')+peoplePanel();
  const own=S.people.uid===S.user.uid,person=S.people.person;
  if(person.restricted)return `<div class="athlete-profile">${profileHero(person,false)}<section class="card closed-profile"><h2>Цей профіль закрито</h2><p class="muted">Інформацію профілю та коментарі бачать лише друзі. Надішли заявку, щоб отримати доступ.</p></section></div>`;
  const visibility=profileVisibility(person),showFriends=visibility.gymBros;
  const activity=recentActivityPanel(),showSidebar=showFriends||!!activity;
  let layout;try{layout=profileLayout(S.people.layout);}catch{layout=profileLayout();}
  const publicSnapshots=own?profileSnapshots(profileSessions(),S.recordVisibility??null,profileManualSets(),person,S.programs,ownStreakSessions()):S.people.stats||{};
  const blockViews={
    medals:()=>achievementShowcase(S.people.achievementShowcase,{own}),
    stats:()=>visibility.progress?sharedStats(publicSnapshots):'',comments:commentsPanel,
    goals:()=>calendarSharing(person).visible?sharedActivityCalendar(publicSnapshots.calendar,S.publicActivityYear,localDate()):'',
    challenges:()=>'',records:()=>visibility.records?recordsCard(publicSnapshots.records?.items||[],true):'',
    progress:()=>'',measurements:()=>'',reflections:()=>'',history:()=>'',
  };
  return `<div ${profileAppearanceAttributes(person)}>${profileHero(person,own)}${profileMusicCard(person,{own})}${monthlySummaryCard(S.people.monthlySummary,{published:true,own})}${own?`<div class="profile-layout-toolbar">${btn('Моя статистика','route','data-id="statistics"','secondary')}${btn('Налаштувати блоки','edit-profile-blocks','','ghost')}</div>`:''}${S.people.warnings?.length?`<section class="card" role="alert"><p>Не вдалося завантажити: ${esc(S.people.warnings.join(', '))}.</p>${btn('Оновити','reload','','secondary')}</section>`:''}${own&&S.trainingExtrasError?`<p class="error">${esc(S.trainingExtrasError)}</p>`:''}<div class="profile-columns ${showSidebar?'':'no-sidebar'}"><div class="profile-feed">${layout.order.filter(key=>layout.visible.includes(key)).map(key=>blockViews[key]?.()||'').join('')}</div>${showSidebar?`<aside class="profile-sidebar">${showFriends?peoplePanel():''}${activity}</aside>`:''}</div></div>`;
}
function profileAppearanceAttributes(person) {
  if(!person?.appearance)return 'class="athlete-profile"';
  try{const a=profileAppearance(person.appearance);return `class="athlete-profile profile-custom" ${Object.entries(appearanceData(a)).map(([key,value])=>`data-${key}="${value}"`).join(' ')} style="${esc(appearanceStyle(a))}"`;}catch{return 'class="athlete-profile"';}
}
function settingsHeader(person) {
  return ui`<header class="settings-page-heading"><div><span>ПЕРСОНАЛЬНІ НАЛАШТУВАННЯ</span><h1>Налаштування</h1><p>Твій профіль, приватність та персональні вподобання.</p></div>${btn(uiText('До профілю'),'route','data-id="profile"','ghost')}</header>`;
}
function settingsNavigation(person) {
  const icons={music:'M9 18V5l12-2v13M9 9l12-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2a8 8 0 0 1 16 0v2',appearance:'m12 3 9 9-9 9-9-9 9-9Zm0 6 3 3-3 3-3-3 3-3Z',privacy:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',security:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4'};
  const sections=[['user','Користувач','Профіль та вподобання'],...(owner()||S.customizationAccess?[['appearance','Оформлення профілю','Кольори та стиль профілю']]:[]),['privacy','Приватність','Що бачать інші'],['security','Безпека','Акаунт і твої дані']];
  return ui`<aside class="settings-sidebar"><button type="button" class="settings-account-card" data-action="route" data-id="profile">${personAvatar(person)}<span><strong>${esc(person.name||S.profile?.name||uiText('Спортсмен'))}</strong><small>${esc(S.user.email||'')}</small></span><i aria-hidden="true">›</i></button><nav class="settings-sections" aria-label="Розділи налаштувань">${sections.map(([key,label,description])=>`<button type="button" class="settings-navigation-item" data-action="settings-section" data-section="${key}" aria-pressed="${S.settingsSection===key}"><span class="settings-navigation-icon" data-tone="${key}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[key]}"/></svg></span><span class="settings-navigation-copy"><strong>${uiText(label)}</strong><small>${uiText(description)}</small></span><i aria-hidden="true">›</i></button>`).join('')}</nav></aside>`;
}
function settings() {
  if (S.communityLoading) return heading(uiText('Налаштування')) + uiText('<section class="card" role="status">Завантажуємо налаштування профілю…</section>');
  if (!S.selfPublic || S.people?.error) return heading(uiText('Налаштування')) + ui`<section class="card"><p class="error">${esc(S.people?.error || uiText('Не вдалося завантажити налаштування профілю.'))}</p>${btn(uiText('Спробувати знову'),'reload')}</section>`;
  const person = S.selfPublic || {}, visibility = profileVisibility(person);
  if (S.settingsSection === 'appearance' && !owner() && !S.customizationAccess) S.settingsSection = 'user';
  return settingsHeader(person) + ui`<div class="settings-layout">${settingsNavigation(person)}<div data-settings-section="user" ${S.settingsSection === 'user' ? '' : 'hidden'}><section class="card"><div class="sectionhead"><h2>Твій профіль</h2>${personAvatar(person)}</div><form id="profile-name-form"><label>Ім’я у профілі<input name="name" value="${esc(person.name || S.profile?.name || '')}" required maxlength="100" autocomplete="nickname"/></label><p class="small muted">Це ім’я бачать інші учасники.</p><button type="submit" class="btn secondary">Зберегти ім’я</button><div class="form-error" role="alert"></div></form><form id="location-form"><label>Місцеположення<input name="location" value="${esc(person.location || '')}" maxlength="100" placeholder="" /></label><p class="small muted">Відображається у профілі. Залиш порожнім, щоб не вказувати.</p><button class="btn secondary" type="submit">Зберегти місцеположення</button><div class="form-error" role="alert"></div></form><form id="bio-form"><h3>Про себе</h3>${richComposer({name:'bio',maxLength:400,htmlLimit:8000,draft:{text:person.bio||'',html:person.bioRich||''},placeholder:uiText('Кілька слів про тебе й твою мету')})}<button class="btn secondary" type="submit">Зберегти опис</button><div class="form-error" role="alert"></div></form><form id="avatar-form"><label>Аватар<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required /></label><p class="small muted">JPG, PNG або WebP до 10 МБ. Прозорий фон PNG/WebP зберігається. Фото буде обрізано до квадрата.</p><div class="actions"><button type="submit" class="btn secondary">Завантажити аватар</button>${person.photo ? btn(uiText('Прибрати аватар'),'remove-avatar','type="button"','ghost') : ''}</div><div class="form-error" role="alert"></div></form><form id="banner-form"><h3>Банер профілю</h3>${bannerSource(person.banner) ? ui`<img class="banner-preview" src="${esc(person.banner)}" alt="Твій банер" />` : ''}<label>Зображення банера<input name="banner" type="file" accept="image/jpeg,image/png,image/webp" required /></label><p class="small muted">JPG, PNG або WebP до 10 МБ. Прозорий фон PNG/WebP зберігається. Широкий формат 1200 × 320.</p><div class="actions"><button type="submit" class="btn secondary">Завантажити банер</button>${person.banner ? btn(uiText('Прибрати банер'),'remove-banner','type="button"','ghost') : ''}</div><div class="form-error" role="alert"></div></form></section>${contactsEditor()}${profileMusicEditor(person)}<section class="card"><div class="sectionhead"><h2>Шаблони розминки</h2>${btn('Керувати шаблонами','warmup-templates','data-target="library"','secondary')}</div></section><section class="card"><h2>Серія тренувань</h2>${streakSettingsForm()}</section>        ${interfaceLanguageSettings()}<section class="card"><h2>Вигляд</h2><label>Тема<select id="theme-select">${themeOptions()}</select></label></section>
        <section class="card"><h2>Сповіщення таймера</h2>${soundControls()}</section>
</div><div data-settings-section="appearance" ${S.settingsSection === 'appearance' ? '' : 'hidden'}>${profileAppearanceEditor()}</div><div data-settings-section="privacy" ${S.settingsSection === 'privacy' ? '' : 'hidden'}><section class="card profile-privacy-control"><h2>Доступ до профілю</h2><form id="profile-privacy-form"><label class="visibility-row"><div><strong>Закритий профіль</strong><span>Лише друзі бачать інформацію, активність і коментарі. Ім’я, аватар та ID залишаються видимими.</span></div><input type="checkbox" name="isPrivate" ${person.isPrivate?'checked':''}/></label><button type="submit" class="btn">Зберегти доступ до профілю</button><div class="form-error" role="alert"></div></form></section><section class="card"><h2>Що бачать інші</h2><p class="muted small">Обирай, чим ділитися у профілі. Приховані дані доступні тобі в особистому просторі.</p><form id="visibility-form">${[['activity',uiText('Стрічка активності'),uiText('Коментарі, відповіді, оцінки та реакції')],['workouts',uiText('Тренування в активності'),uiText('Показувати завершені тренування у відкритій стрічці')],['lastActive',uiText('Був(-ла) у застосунку'),uiText('Коли ти востаннє користувався застосунком')],['progress',uiText('Прогрес'),uiText('Кількість тренувань, підходів і загальна вага')],['records',uiText('Особисті рекорди'),uiText('Показувати розділ; окремі рекорди обираються у статистиці')],['streak',uiText('Серія тренувань'),uiText('Кількість тижнів поспіль')],['gymBros','Gym Bro',uiText('Показувати список твоїх друзів у профілі')],['calendar',uiText('Календар активності'),uiText('Показувати іншим дати й кількість завершених тренувань')]].map(([key,title,description])=>ui`<label class="visibility-row"><div><strong>${title}</strong><span>${description}</span></div><input type="checkbox" name="${key}" ${visibility[key] ? 'checked' : ''} /></label>`).join('')}<fieldset class="calendar-privacy-types"><legend>Календар активності: які тренування показувати</legend><label>Типи тренувань<select name="calendarScope">${Object.entries(calendarScopeLabels).map(([value,title])=>ui`<option value="${value}" ${calendarSharing(person).scope === value?'selected':''}>${uiText(title)}</option>`).join('')}</select></label><p class="small muted">Цей вибір діє, коли календар показано іншим. Приховані типи не потраплять у спільний календар. Власний повний календар залишиться доступним.</p></fieldset><button class="btn" type="submit">Зберегти видимість</button><div class="form-error" role="alert"></div></form></section>${blockedPanel()}
</div><div data-settings-section="security" ${S.settingsSection === 'security' ? '' : 'hidden'}><section class="card"><h2>Безпека акаунта</h2><p class="muted">${esc(S.user.email)}</p><dl class="user-facts"><div><dt>Останній вхід</dt><dd>${displayDate(S.profile?.lastLoginTime)}</dd></div></dl><p class="small muted">Для зміни пароля надішлемо лист на твою пошту.</p>${btn(uiText('Змінити пароль'),'account-password-reset','','secondary')}</section>        <section class="card"><h2>Експорт даних</h2><p class="muted small">JSON містить програми, тренування, особисті вправи, налаштування та приватні заміри тіла. CSV містить плани програм, заплановані тренування й виконані підходи.</p><div class="actions">${btn(uiText("Завантажити JSON"), "export-json", "", "secondary")}${btn(uiText("Завантажити CSV"), "export-csv", "", "secondary")}</div></section>
        <section class="card"><h2>Відновлення з JSON</h2><p class="muted small">Обери резервну копію, яку завантажив із профілю. Перед збереженням буде показано кількість записів.</p><form id="restore-form"><label>Резервна копія JSON<input type="file" id="restore-file" accept=".json,application/json" required /></label><button class="btn secondary" type="submit">Перевірити копію</button><div class="form-error" role="alert"></div></form></section>
<section class="card"><h2>Акаунт</h2><p class="muted">${esc(S.user.email)}</p>${btn(uiText('Вийти'), 'logout', '', 'ghost')}</section></div></div>`;
}
function appearanceSelect(key,title,a) {
  return ui`<label>${title}<select name="${key}">${appearanceChoices[key].map(([value,label])=>ui`<option value="${value}" ${a[key]===value?'selected':''}>${uiText(label)}</option>`).join('')}</select></label>`;
}
function appearanceHeaderPreview(a) {
  const h=profileHeaderAppearance(a),rootStyle=getComputedStyle(document.documentElement),variables=h?.variables||Object.fromEntries(['--panel','--text','--muted','--line','--blue'].map(key=>[key,rootStyle.getPropertyValue(key)])),style=Object.entries(variables).map(([key,value])=>ui`${key}:${value}`).join(';');
  return ui`<div class="appearance-header-preview" data-header-preview data-header-surface="${h?.surface||'solid'}" style="${esc(style)}"><strong>${esc(h?.title||'Nexus GymB')}</strong><span>Головна · Програма · Вправи</span></div>`;
}
function appearancePreview(a) {
  const person = S.selfPublic || S.profile || {};
  return ui`<div class="appearance-preview profile-custom" data-appearance-preview ${Object.entries(appearanceData(a)).map(([key,value])=>ui`data-${key}="${value}"`).join(' ')} style="${esc(appearanceStyle(a))}">${appearanceHeaderPreview(a)}<section class="profile-hero"><div class="profile-cover"></div><div class="profile-identity"><div class="profile-portrait">${personAvatar(person)}</div><div class="profile-title"><span class="small muted">Твій профіль</span><h3>${esc(person.name || 'Gym Bro')}</h3><p class="profile-bio">${esc(person.bio || uiText('Опис профілю'))}</p></div><div class="profile-identity-actions"><button type="button" class="btn">Додати Gym Bro</button><button type="button" class="btn secondary">Повідомлення</button><button type="button" class="btn ghost">Посилання</button></div></div></section><div class="profile-columns"><div class="profile-feed"><div class="card"><h3>Мій прогрес</h3><p class="muted">Так виглядатимуть текст, блоки та кнопки.</p><div class="appearance-sample-metrics"><span><strong>12</strong> тренувань</span><span><strong>48</strong> підходів</span></div></div></div><aside class="profile-sidebar"><div class="card"><h3>Gym Bro</h3><p class="muted">Список друзів</p><a class="contact-link" role="link" aria-disabled="true">Instagram</a></div></aside></div></div>`;
}
function profileAppearanceEditor() {
  if (!owner() && !S.customizationAccess) return '';
  let a; try { a=profileAppearance(S.selfPublic?.appearance || {}); } catch { a={...appearanceDefaults}; }
  const group = (title,body,open=false)=>ui`<details class="appearance-group" ${open?'open':''}><summary>${title}</summary><div>${body}</div></details>`;
  return ui`<section class="card appearance-settings"><div class="sectionhead"><div><span class="appearance-eyebrow">Параметри оформлення</span><h2>Оформлення профілю</h2></div><span class="appearance-save-state" data-appearance-status role="status">Збережений вигляд</span></div><p class="muted">Почни з готової палітри або налаштуй кожну деталь. Зміни побачать відвідувачі твого профілю.</p><form id="profile-appearance-form"><div class="appearance-presets" role="group" aria-label="Готові палітри">${appearancePresets.map(preset=>ui`<button type="button" data-action="appearance-preset" data-id="${preset.id}" class="appearance-preset" aria-pressed="false"><span style="--preset-bg:${preset.values.background};--preset-block:${preset.values.blocks};--preset-accent:${preset.values.accent}"><i></i><i></i></span><strong>${uiText(preset.name)}</strong></button>`).join('')}</div><div class="appearance-preview-label"><strong>Попередній перегляд</strong><span>Зміни видно одразу</span></div>${appearancePreview(a)}
    ${group(uiText('Кольори та фон'),ui`${appearanceSelect('mode',uiText('Тип фону'),a)}<div class="appearance-color-grid">${[['background',uiText('Основний фон')],['backgroundEnd',uiText('Другий колір фону')],['blocks',uiText('Блоки')],['text',uiText('Текст')],['accent',uiText('Кнопки та акценти')],['buttonText',uiText('Текст на кнопках')]].map(([key,label])=>ui`<label>${label}<input type="color" name="${key}" value="${a[key]}"/></label>`).join('')}</div><div class="actions">${btn(uiText('Підібрати контрастний текст'),'appearance-readable','type="button"','ghost')}</div><label>Кут градієнта, °<input name="angle" type="range" min="0" max="360" step="1" value="${a.angle}"/><output data-appearance-angle>${a.angle}°</output></label><label>Фонове зображення<input name="backgroundImage" type="file" accept="image/jpeg,image/png,image/webp"/></label><label class="photo-toggle"><input name="removeImage" type="checkbox"/> Прибрати збережене фонове зображення</label>`,true)}
    ${group(uiText('Header для відвідувачів'),ui`<p class="small muted">Цей вигляд бачать усі, кому доступний твій профіль, тільки на твоїй сторінці. Текст і кнопки автоматично отримають контрастний колір.</p>${appearanceSelect('headerMode',uiText('Оформлення header'),a)}<label>Назва в header<input name="headerTitle" value="${esc(a.headerTitle)}" maxlength="32" required /></label><div class="formgrid">${appearanceSelect('headerSurface',uiText('Поверхня'),a)}${appearanceSelect('headerShape',uiText('Форма'),a)}</div><div class="appearance-color-grid">${[['headerBackground',uiText('Фон header')],['headerAccent',uiText('Акцент header')]].map(([key,label])=>ui`<label>${label}<input type="color" name="${key}" value="${a[key]}"/></label>`).join('')}</div><p class="small muted">Власні кольори застосовуються в режимі «Власні кольори». У режимі «Палітра профілю» використовуються кольори блоків і кнопок.</p>`,true)}
    ${group(uiText('Кнопки'),ui`<div class="formgrid">${appearanceSelect('buttonStyle',uiText('Стиль кнопок'),a)}${appearanceSelect('buttonShape',uiText('Форма кнопок'),a)}${appearanceSelect('buttonSize',uiText('Розмір кнопок'),a)}</div>`,true)}
    ${group(uiText('Блоки та текст'),ui`<div class="formgrid">${appearanceSelect('surface',uiText('Поверхня блоків'),a)}${appearanceSelect('cardShape',uiText('Форма блоків'),a)}${appearanceSelect('cardShadow',uiText('Тіні'),a)}${appearanceSelect('cardBorder',uiText('Контури блоків'),a)}${appearanceSelect('density',uiText('Відступи'),a)}${appearanceSelect('font',uiText('Шрифт'),a)}${appearanceSelect('textSize',uiText('Розмір тексту'),a)}</div>`)}
    ${group(uiText('Шапка та структура'),ui`<div class="formgrid">${appearanceSelect('avatarSize',uiText('Розмір аватара'),a)}${appearanceSelect('avatarShape',uiText('Форма аватара'),a)}${appearanceSelect('avatarRing',uiText('Обрамлення аватара'),a)}${appearanceSelect('coverStyle',uiText('Стиль банера без фото'),a)}${appearanceSelect('coverSize',uiText('Висота банера'),a)}${appearanceSelect('nameStyle',uiText('Оформлення імені'),a)}${appearanceSelect('heroAlign',uiText('Вирівнювання шапки'),a)}${appearanceSelect('layout',uiText('Розташування блоків'),a)}</div>`)}
    ${group(uiText('Фактури та ефекти'),ui`<div class="formgrid">${appearanceSelect('pattern',uiText('Візерунок фону'),a)}${appearanceSelect('imagePosition',uiText('Положення фото фону й банера'),a)}${appearanceSelect('hoverEffect',uiText('Ефект при наведенні'),a)}${appearanceSelect('motion',uiText('Анімація фону'),a)}</div><p class="small muted">Системне налаштування зменшення руху завжди має пріоритет.</p>`)}
    <div class="appearance-save-actions"><button type="submit" class="btn">Зберегти оформлення</button>${btn(uiText('Скасувати зміни'),'appearance-revert','type="button"','secondary')}${btn(uiText('Стандартний вигляд'),'reset-profile-appearance','type="button"','ghost')}</div><div class="form-error" role="alert"></div></form></section>`;
}
const appearanceImageDrafts = new WeakMap();
function appearanceFormData(form) {
  return profileAppearance({...Object.fromEntries(new FormData(form)),angle:Number(form.elements.angle.value),
    image:form.elements.removeImage.checked ? '' : appearanceImageDrafts.get(form) ?? S.selfPublic?.appearance?.image ?? ''});
}
function updateAppearancePreview(form,dirty=true) {
  const a=appearanceFormData(form), preview=form.querySelector('[data-appearance-preview]');
  preview.style.cssText=appearanceStyle(a);
  preview.querySelector('[data-header-preview]').outerHTML=appearanceHeaderPreview(a);
  for (const [key,value] of Object.entries(appearanceData(a))) preview.setAttribute(`data-${key}`,value);
  form.querySelector('[data-appearance-angle]').textContent=`${a.angle}°`;
  const status=form.closest('.appearance-settings').querySelector('[data-appearance-status]');
  status.textContent=uiText(dirty?'Незбережені зміни':'Збережений вигляд');
  status.dataset.dirty=String(dirty);
}
function fillAppearanceForm(form,value) {
  const a=profileAppearance(value);
  for (const [key,value] of Object.entries(a)) if(form.elements[key] && key!=='image')form.elements[key].value=value;
  form.elements.backgroundImage.value='';form.elements.removeImage.checked=false;
  appearanceImageDrafts.delete(form);
  form.querySelectorAll('[data-action="appearance-preset"]').forEach(button=>button.setAttribute('aria-pressed','false'));
}
document.addEventListener('input',event=>{
  const form=event.target.closest('#profile-appearance-form'); if (!form) return;
  if (event.target.name==='backgroundImage') return;
  if (event.target.name==='removeImage' && event.target.checked) {
    form.elements.backgroundImage.value='';appearanceImageDrafts.delete(form);
    if(form.elements.mode.value==='image')form.elements.mode.value='solid';
  }
  try { updateAppearancePreview(form); } catch {}
});
document.addEventListener('change',async event=>{
  const form=event.target.closest('#profile-appearance-form');if (!form || event.target.name!=='backgroundImage') return;
  const file=event.target.files[0];if(!file)return;
  const error=form.querySelector('.form-error');error.textContent='';
  try {
    const image=await prepareProfileBackground(file);
    if (!form.isConnected || form.elements.backgroundImage.files[0]!==file) return;
    appearanceImageDrafts.set(form,image);form.elements.removeImage.checked=false;form.elements.mode.value='image';
    updateAppearancePreview(form);
  } catch (e) { if(form.isConnected) {error.textContent=e.message;error.classList.add('error');} }
});

function inviteWorkoutDialog(uid,slot=null,pollId='') {
  const programs = S.programs.filter((p)=>p.scope !== 'home' && !p.archived && p.days.some(hasWorkoutContent));
  if (!programs.length) { openModal(`<h2>Запрошення на тренування</h2><p>Спочатку створи основну програму з тренувальним днем.</p>${btn('До програм','route','data-id="program"','secondary')}`); return; }
  const person = S.people?.profiles?.[uid];
  openModal(`<div class="sectionhead"><h2 id="invite-title">Тренування з ${esc(person?.name || 'Gym Bro')}</h2>${btn('Закрити','close','','ghost')}</div><form id="training-invite-form" data-to="${esc(uid)}" data-poll="${esc(pollId)}"><label>Програма<select name="program" id="invite-program">${programs.map((p)=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>День програми<select name="day" id="invite-day"></select></label><div class="formgrid"><label>Дата<input name="date" type="date" min="${localDate()}" value="${localDate()}" required /></label><label>Час · необов’язково<input name="time" type="time" /></label></div><label>Примітка<textarea name="note" rows="2" maxlength="300" placeholder="Де зустрічаємося?"></textarea></label><p class="small muted">Тренування з’явиться у твоєму календарі одразу, у Gym Bro — після прийняття.</p><button type="submit" class="btn">Надіслати запрошення</button><div class="form-error" role="alert"></div></form>`,'invite-title');
  updateInviteDays();
  if(slot){const form=modal.querySelector('#training-invite-form');form.elements.date.value=slot.date;form.elements.time.value=slot.time;form.elements.date.readOnly=true;form.elements.time.readOnly=true;}
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
  openModal(`<div class="sectionhead"><h2 id="training-invite-title">Запрошення на тренування</h2>${btn('Закрити','close','','ghost')}</div><p class="small muted">${esc(sender?.name || 'Gym Bro')} · ${status}</p><h3>${esc(invite.program.name)}</h3><p>${esc(formatScheduledTime(invite.date,invite.time,uiLocale()))}</p>${invite.note ? `<div class="notice">${esc(invite.note)}</div>` : ''}${invite.program.days.map((d)=>`<section><h3>${esc(d.name)}</h3>${workoutDescription(d)}${exerciseRows(d.items)}</section>`).join('')}<div class="actions">${invite.status === 'pending' && invite.to === S.user.uid && !block.iBlocked && !block.blockedMe && invite.date >= localDate() ? btn('Прийняти й запланувати','respond-training-invite',`data-id="${esc(id)}" data-status="accepted"`) : ''}${invite.status === 'pending' && invite.to === S.user.uid ? btn('Відхилити','respond-training-invite',`data-id="${esc(id)}" data-status="declined"`,'ghost') : ''}${invite.status === 'pending' && invite.from === S.user.uid ? btn('Скасувати запрошення','respond-training-invite',`data-id="${esc(id)}" data-status="cancelled"`,'ghost') : ''}${invite.status === 'accepted' || invite.from === S.user.uid ? btn('Відкрити календар','invite-calendar',`data-date="${esc(invite.date)}"`,'secondary') : ''}</div>${invite.date < localDate() && invite.status === 'pending' ? '<p class="muted">Дата запрошення вже минула.</p>' : ''}`,'training-invite-title');
}
function disposeImageEdit() { imageEdit?.bitmap.close(); imageEdit = null; }
async function openImageCropper(file, kind) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10000000) throw Error(uiText('Обери JPG, PNG або WebP до 10 МБ.'));
  disposeImageEdit();
  const bitmap = await createImageBitmap(file).catch(()=>{ throw Error(uiText('Не вдалося прочитати зображення.')); });
  imageEdit = { file, bitmap, kind, crop: { x:0.5,y:0.5,zoom:1 } };
  openModal(ui`<div class="sectionhead"><h2 id="image-edit-title">${kind === 'avatar' ? uiText('Аватар') : uiText('Банер')} · попередній перегляд</h2>${btn(uiText('Закрити'),'close','','ghost')}</div><div class="image-crop-preview ${kind}"><canvas id="profile-image-canvas" aria-label="Область зображення, яка буде збережена"></canvas></div><p class="small muted">Перетягни зображення або скористайся повзунками. Прозорий фон зберігається.</p><div class="crop-controls"><label>Масштаб<input data-crop="zoom" type="range" min="1" max="3" step="0.01" value="1" /></label><label>По горизонталі<input data-crop="x" type="range" min="0" max="1" step="0.01" value="0.5" /></label><label>По вертикалі<input data-crop="y" type="range" min="0" max="1" step="0.01" value="0.5" /></label></div>${btn(kind === 'avatar' ? uiText('Зберегти аватар') : uiText('Зберегти банер'),'save-profile-image','','wide')}<div class="form-error" role="alert"></div>`,'image-edit-title','image-edit-dialog');
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
    for (const key of ['x','y']) modal.querySelector(ui`[data-crop="${key}"]`).value=imageEdit.crop[key];
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
  const count = S.notices.filter((n) => !n.read).length+S.achievementEvents.filter(event=>!event.read).length;
  if (badge) { badge.hidden = count === 0; badge.textContent = count > 99 ? '99+' : count; }
  document.querySelector('.notice-bell')?.setAttribute('aria-label', count ? `Сповіщення: ${count} непрочитаних` : 'Сповіщення');
}
function noticeMillis(value) {return value?.toMillis?.()??(value?.seconds?value.seconds*1000:typeof value==='number'?value:0);}
async function noticeActors(notices) {
  const actors=Object.fromEntries(await Promise.all([...new Set(notices.map(n=>n.actorId))].map(async id=>[id,await db.publicIdentity(id).catch(()=>null)])));
  return notices.map(n=>({...n,actor:actors[n.actorId]}));
}
function systemNoticeReason(entry) {
  const reason=String(entry.reason||'');
  if(entry.source==='automatic') return uiText(reason);
  const prefix='Додано до історії. ';
  const content=reason.startsWith(prefix)?reason.slice(prefix.length):reason;
  return (reason.startsWith(prefix)?uiText(prefix):'')+(content==='Видано адміністратором'?uiText(content):content);
}
function noticeInbox() {
  const labels={comment:uiText('залишив(-ла) коментар у твоєму профілі'),reply:uiText('відповів(-ла) на твій коментар'),friend_request:uiText('хоче стати твоїм Gym Bro'),friend_accepted:uiText('прийняв(-ла) твою заявку Gym Bro'),training_invite:uiText('запрошує на спільне тренування'),training_accepted:uiText('прийняв(-ла) запрошення на тренування')};
  const entries=[...S.achievementEvents.map(e=>({...e,kind:'medal',at:noticeMillis(e.earnedAt)})),...S.notices.map(n=>({...n,kind:'social',at:noticeMillis(n.createdAt)}))].sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id));
  const unread=entries.filter(e=>!e.read).length;
  openModal(ui`<div class="sectionhead"><div><span class="private-label">Історія активності</span><h2 id="notice-title">Сповіщення</h2></div>${btn(uiText('Закрити'),'close','','ghost')}</div><p class="small muted">Прочитані сповіщення залишаються в історії.</p>${unread?btn(uiText('Позначити завантажені прочитаними'),'read-all-notices','','secondary'):''}${S.noticeError?ui`<p class="error">${esc(S.noticeError)}</p>`:''}<div class="notice-list">${entries.map(entry=>{
    const medal=entry.kind==='medal'?achievementCatalog.find(m=>m.id===entry.medalId):null;
    return ui`<button class="notice-item ${entry.read?'':'unread'}" data-action="${entry.kind==='medal'?'open-medal-notice':'open-notice'}" data-id="${esc(entry.id)}">${medal?medalIcon(medal):entry.kind==='medal'?'<span class="badge">GymB</span>':personAvatar(entry.actor)}<span class="grow"><strong>${esc(entry.kind==='medal'?(medal?.name?uiText(medal.name):uiText('Досягнення GymB')):(entry.actor?.name||uiText('Спортсмен')))}</strong><span>${esc(entry.kind==='medal'?systemNoticeReason(entry):labels[entry.type]||uiText('Сповіщення GymB'))}</span><time>${displayDate(entry.kind==='medal'?entry.earnedAt:entry.createdAt)}</time></span>${entry.read?uiText('<span class="notice-read">Прочитано</span>'):uiText('<i aria-label="Непрочитане"></i>')}</button>`;
  }).join('')||uiText('<p class="notice-empty muted">Поки немає сповіщень.</p>')}</div>${S.noticeHasMore?btn(uiText('Старіші сповіщення'),'older-notices','','secondary wide'):''}`,'notice-title','notifications-dialog');
}
function startNoticeWatch() {
  const uid = S.user.uid;
  stopMedalEvents?.();
  stopMedalEvents=db.watchAchievementEvents(events=>{
    if(S.user?.uid!==uid)return;S.achievementEvents=events;updateNoticeBadge();
    if(modal.open&&modal.classList.contains('notifications-dialog'))noticeInbox();
    if(S.route==='achievements')render();
  },error=>console.warn('Історія медалей:',error.code||error.message));
  let revision = 0;
  stopNotices?.();
  stopNotices = db.watchNotifications(async (notices) => {
    const currentRevision = ++revision;
    const rows=await noticeActors(notices);
    if (S.user?.uid !== uid || currentRevision !== revision) return;
    const combined=new Map([...S.notices,...S.noticeOlder,...rows].map(row=>[row.id,row]));
    S.notices=[...combined.values()].sort((a,b)=>noticeMillis(b.createdAt)-noticeMillis(a.createdAt)||b.id.localeCompare(a.id));
    if(!S.noticeOlder.length){S.noticeHasMore=notices.length===100;S.noticeOldestId=notices.at(-1)?.id||'';}
    S.noticeError = '';
    updateNoticeBadge();
    if (modal.open && modal.classList.contains('notifications-dialog')) noticeInbox();
  }, (error) => { if (S.user?.uid === uid) { S.noticeError = err(error); updateNoticeBadge(); } });
}
function exerciseNotePanel(item,index) {
  const key=exerciseNoteId(item),note=S.exerciseNotes[key]?.note;
  return `<aside class="exercise-personal-note"><div><span class="private-label">Особиста нотатка</span>${btn(note?'Змінити нотатку':'Додати нотатку','exercise-note',index===undefined?`data-id="${esc(item.exerciseId)}"`:`data-index="${index}"`,'ghost')}</div>${note?`<p>${esc(note)}</p>`:'<p class="small muted">Збережи хват, висоту сидіння або налаштування тренажера.</p>'}</aside>`;
}
async function editExerciseNote(button) {
  const item=button.dataset.index!==undefined?ongoing()?.items[Number(button.dataset.index)]:S.exercises.find(e=>e.id===button.dataset.id)||S.sessions.flatMap(s=>s.items).find(i=>i.exerciseId===button.dataset.id);
  if(!item)throw Error('Вправу не знайдено.');
  const source={...item,exerciseId:item.exerciseId||item.id},key=exerciseNoteId(source),uid=S.user.uid;
  const saved=await db.getLive(privatePath(`exerciseNotes/${key}`));
  if(S.user?.uid!==uid)return;
  if(saved)S.exerciseNotes[key]=saved;else delete S.exerciseNotes[key];
  openModal(`<div class="sectionhead"><div><span class="private-label">Бачиш тільки ти</span><h2 id="exercise-note-title">${esc(item.name)}</h2></div>${btn('Закрити','close','','ghost')}</div><form id="exercise-note-form" data-key="${esc(key)}" data-exercise-key="${esc(exerciseKey(source))}"><label>Особиста нотатка<textarea name="note" rows="6" maxlength="2000" placeholder="Наприклад: сидіння 4, вузький хват, спинка 2">${esc(saved?.note||'')}</textarea></label><p class="small muted">До 2000 символів. Порожнє поле видалить нотатку. Вона доступна у всіх наступних тренуваннях із цією вправою.</p><button type="submit" class="btn">Зберегти нотатку</button><div class="form-error" role="alert"></div></form>`,'exercise-note-title');
}
let resultCardPages=[];
async function openResultCard(id) {
  const session=profileSessions().find(s=>s.id===id&&s.status==='completed');if(!session)throw Error('Тренування не знайдено.');
  const {renderResultCard}=await import('./result-card.js');
  const pages=await renderResultCard(session,profileSessions(),S.trainingProfiles);resultCardPages=pages;
  openModal(`<div class="sectionhead"><h2 id="result-card-title">Картка результатів</h2>${btn('Закрити','close','','ghost')}</div><p class="small muted">${pages.length} стор. · Файли створюються на твоєму пристрої.</p><div class="actions">${btn('Завантажити PNG','download-result',`data-format="png" data-date="${esc(session.date)}"`)}${btn('Завантажити PDF','download-result',`data-format="pdf" data-date="${esc(session.date)}"`,'secondary')}</div><div class="result-card-preview" aria-label="Попередній перегляд картки"></div>`,'result-card-title','result-card-dialog');
  modal.querySelector('.result-card-preview').append(...pages);
}
function workoutDetails(session, inline=false) {
  const stats=workoutSummary(session,profileSessions());
  const date=new Date(`${session.date}T12:00:00`).toLocaleDateString(uiLocale(),{day:'numeric',month:'long',year:'numeric'});
  return `<div class="workout-details"><header class="workout-details-header"><div><span class="workout-section-label">Збережене тренування</span><h2 id="${inline?'summary-exercises-title':'workout-details-title'}">${inline?'Вправи та підходи':esc(session.name)}</h2><p>${esc(date)}${session.endedEarly?' · Завершено достроково':''}</p></div>${inline?'':btn('Закрити','close','','ghost')}</header>${inline?'':`<div class="workout-details-metrics"><div><strong>${stats.minutesKnown?stats.minutes:'—'}</strong><span>хвилин</span></div><div><strong>${stats.exercises} / ${stats.plannedExercises}</strong><span>вправ із результатом</span></div><div><strong>${stats.sets}</strong><span>робочих підходів</span></div></div><div class="actions">${btn('Виправити тренування','edit-history',`data-id="${esc(session.id)}"`,'secondary')}${btn('Повний підсумок','show-workout-summary',`data-id="${esc(session.id)}"`,'ghost')}</div>${workoutDescription(session)}`}
  <div class="workout-details-exercises">${session.items.map((item,index)=>{
    const logs=session.logs.filter(log=>log.index===index),performed=session.simpleCompleted?.includes(index)||logs.some(log=>!log.warmup);
    const partial=performed&&session.skipped?.includes(index),status=partial?'Частково':performed?'Виконано':session.skipped?.includes(index)?'Пропущено':'Без результату';
    return `<details class="workout-detail-exercise" ${session.items.length===1?'open':''}><summary><span class="detail-exercise-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="detail-exercise-name"><strong>${esc(item.name)}</strong><small>${esc(item.primary||'Вправа')} · Записів: ${logs.length}</small></span><span class="detail-status ${performed?'is-performed':''}">${status}</span></summary><div class="detail-exercise-body">${exercisePhoto(item)}<p class="small muted">План: ${item.sets} підходи · ${item.seconds?`${item.seconds} сек`: `${esc(item.reps)} повторень`}</p>${skipDetail(session,index)}${session.simpleCompleted?.includes(index)?'<p class="detail-check">✓ Виконано за списком</p>':''}${session.replacements?.[index]?`<p class="small muted">Замість: ${esc(session.replacements[index].original.name)}</p>`:''}${logs.length?`<div class="detail-table-scroll"><table class="detail-sets-table"><caption class="sr-only">Результати: ${esc(item.name)}</caption><thead><tr><th scope="col">Підхід</th><th scope="col">Вага</th><th scope="col">Повторення / час</th></tr></thead><tbody>${logs.map((log,n)=>`<tr><th scope="row">${setLogLabel(logs,n)}</th><td>${esc(weightLabel(log))}</td><td>${repsLabel(log)}${log.seconds?` · ${log.seconds} сек`:''}</td></tr>${log.metrics?.length?`<tr><td colspan="3">${metricSummary(log.metrics)}</td></tr>`:''}`).join('')}</tbody></table></div>`:'<p class="muted">Підходи не записувалися.</p>'}</div></details>`;
  }).join('')}</div></div>`;
}

function summaryScreen(session) {
  const stats=workoutSummary(session,profileSessions());
  return `<div class="workout-summary">${S.trainingExtrasError?`<div class="notice error">${esc(S.trainingExtrasError)}</div>`:''}${heading('Тренування завершено',`${esc(session.name)} · ${esc(session.date)}`,btn('Змінити дані тренування','edit-history',`data-id="${esc(session.id)}"`,'secondary'))}<section class="card summary-hero"><span class="summary-check" aria-hidden="true">✓</span><h2>${session.endedEarly ? 'Збережено все, що ти виконав' : 'Результати тренування'}</h2>${session.endedEarly ? '<span class="badge">Завершено достроково</span>' : ''}<div class="summary-metrics">${[[stats.minutes,'Хвилин'],[stats.sets,'Робочих підходів'],[Math.round(stats.volume*100)/100,'кг × повторення'],[stats.exercises,'Вправ виконано']].map(([value,label])=>`<div><strong>${Number(value).toLocaleString(uiLocale())}</strong><span>${label}</span></div>`).join('')}</div><p class="small muted">Обсяг враховує вибрану кількість рук / сторін, без дублювання найкращих результатів; для діапазонів повторень — за нижньою межею.</p><p class="small muted">${stats.quickResults ? `${stats.quickResults} найкращих результатів · ` : ''}${stats.reps} повторень · ${stats.warmupSets} розминочних підходів · ${stats.dropSets} дропів · ${stats.superSets} суперсетів${stats.plannedSets ? stats.sets>stats.plannedSets?` · ${stats.plannedSets} робочих підходів за планом · ${stats.sets-stats.plannedSets} додаткових`:` · ${stats.sets} із ${stats.plannedSets} запланованих робочих підходів` : ''}</p></section><section class="card summary-exercise-details">${workoutDetails(session,true)}</section>${planActualCard(session)}${nextWeightsSummary(session)}<section class="card result-export"><div><span class="private-label">Твій прогрес у файлі</span><h2>Картка результатів</h2><p class="small muted">Вправи, підходи, час і рекорди. Особисті нотатки та самопочуття не включаються.</p></div>${btn('Перегляд і завантаження','result-card',`data-id="${esc(session.id)}"`,'secondary')}</section>${comparisonCard(session,profileSessions(),S.comparisonIds[session.id]||'')}${reflectionCard(session,S.reflections.find(r=>r.id===session.id))}${stats.repetitionRecords.length?`<section class="card summary-repetition-records"><h2>Рекорди за повтореннями</h2>${stats.repetitionRecords.map(r=>`<div class="record-row"><strong>${esc(r.name)}</strong><span>${esc(weightLabel(r))} × ${repsLabel(r)}<small>${r.first?'Перший результат':'Новий рекорд'}</small></span></div>`).join('')}</section>`:''}<section class="card"><h2>🏆 Нові рекорди</h2>${stats.records.length ? stats.records.map((r)=>`<div class="record-row"><div><strong>${esc(r.name)}</strong><p class="small muted">${r.first ? 'Перший результат для цієї вправи' : 'Перевершено попередній результат'}</p></div><span>${esc(weightLabel(r))} × ${repsLabel(r)}</span></div>`).join('') : '<p class="muted">Нових рекордів немає.</p>'}</section>${session.description || session.warmup ? `<section class="card"><h2>План тренування</h2>${workoutDescription(session)}</section>` : ''}<div class="actions">${btn('На головну','route','data-id="home"')}${btn('Історія та прогрес','route','data-id="statistics"','secondary')}${btn('Деталі тренування','history',`data-id="${esc(session.id)}"`,'ghost')}</div></div>`;
}
function editMeasurement(id = '') {
  const record=S.measurements.find((m)=>m.id===id);
  openModal(`<div class="sectionhead"><h2 id="measurement-title">${record ? 'Редагувати заміри' : 'Додати заміри'}</h2>${btn('Закрити','close','','ghost')}</div><p class="small muted">Ці дані доступні лише тобі. Заповнюй тільки потрібні поля.</p><form id="measurement-form" data-profile="${record?.profileId||S.activeTrainingProfileId}"><label>Дата<input id="measurement-date" name="date" type="date" required min="1900-01-01" max="${localDate()}" value="${record?.date || localDate()}" ${record ? 'readonly' : ''} /></label><div class="formgrid">${Object.entries(measurementFields).map(([key,config])=>field(`${config.label}, ${config.unit}`,key,record?.[key]??'','number',`min="${config.min}" max="${config.max}" step="0.01"`)).join('')}</div><label>Примітка<textarea name="note" maxlength="500" rows="2">${esc(record?.note || '')}</textarea></label><p class="small muted">Один запис на дату. Збереження на ту саму дату оновить його.</p><button class="btn" type="submit">Зберегти заміри</button><div class="form-error" role="alert"></div></form>`,'measurement-title');
}
function measurementsPanel() {
  const records=[...profileMeasurements()].sort((a,b)=>b.date.localeCompare(a.date));
  const config=measurementFields[S.measurementMetric] || measurementFields.weight;
  const start=new Date();start.setDate(start.getDate()-Number(S.measurementPeriod));
  const points=measurementSeries(records,S.measurementMetric,S.measurementPeriod==='all'?'':localDate(start));
  const first=points[0],last=points.at(-1),delta=last&&first?Math.round((last.value-first.value)*100)/100:0;
  return ui`<section class="card body-measurements"><div class="sectionhead"><div><span class="private-label">Бачиш тільки ти</span><h2>Заміри тіла</h2></div>${btn(uiText('Додати заміри'),'new-measurement','','secondary')}</div><p class="small muted">Вага тіла й обхвати. Ці записи не публікуються в профілі та недоступні іншим користувачам.</p>${S.measurementsError ? uiText('<p class="error">Не вдалося завантажити заміри. Спробуй оновити сторінку.</p>') : ''}<div class="formgrid"><label>Показник<select id="measurement-metric">${Object.entries(measurementFields).map(([key,value])=>ui`<option value="${key}" ${S.measurementMetric===key?'selected':''}>${uiText(value.label)}, ${uiText(value.unit)}</option>`).join('')}</select></label><label>Період<select id="measurement-period">${[['30',uiText('30 днів')],['90',uiText('90 днів')],['365',uiText('Рік')],['all',uiText('Увесь час')]].map(([key,label])=>ui`<option value="${key}" ${S.measurementPeriod===key?'selected':''}>${label}</option>`).join('')}</select></label></div>${points.length ? ui`<div class="measurement-overview"><strong>${last.value} ${config.unit}</strong><span class="small muted">${last.date}${points.length>1?ui` · Зміна за період: ${delta>0?'+':''}${delta} ${config.unit}`:''}</span></div>${measurementChart(points,config.unit)}` : uiText('<p class="muted">Додай заміри, щоб побачити історію змін.</p>')}${records.length ? ui`<details class="measurement-history"><summary>Історія замірів · ${records.length}</summary><div class="measurement-table"><table><thead><tr><th>Дата</th>${Object.values(measurementFields).map((f)=>ui`<th>${f.label}, ${f.unit}</th>`).join('')}<th>Примітка</th><th>Дії</th></tr></thead><tbody>${records.map((record)=>ui`<tr><td>${record.date}</td>${Object.keys(measurementFields).map((key)=>ui`<td>${record[key]??'—'}</td>`).join('')}<td class="measurement-note">${esc(record.note)}</td><td><div class="actions">${btn(uiText('Змінити'),'edit-measurement',ui`data-id="${esc(record.id)}"`,'ghost')}${btn(uiText('Видалити'),'delete-measurement',ui`data-id="${esc(record.id)}"`,'ghost')}</div></td></tr>`).join('')}</tbody></table></div></details>` : ''}</section>`;
}
function measurementChart(points,unit) {
  const values=points.map((p)=>p.value),low=Math.min(...values),high=Math.max(...values),pad=Math.max((high-low)*0.15,0.5),min=low-pad,max=high+pad;
  const x=(index)=>points.length===1?330:60+index*540/(points.length-1),y=(value)=>190-(value-min)/(max-min)*150;
  return `<svg class="progress-chart" viewBox="0 0 660 240" role="img" aria-label="Графік замірів, ${unit}">${[0,0.5,1].map((fraction)=>{const value=min+(max-min)*fraction;return `<line class="chart-grid" x1="60" x2="600" y1="${y(value)}" y2="${y(value)}"/><text x="52" y="${y(value)+4}" text-anchor="end">${Math.round(value*10)/10}</text>`;}).join('')}<polyline class="chart-line" points="${points.map((p,index)=>`${x(index)},${y(p.value)}`).join(' ')}"/>${points.map((p,index)=>`<circle class="chart-point" cx="${x(index)}" cy="${y(p.value)}" r="4"><title>${p.date}: ${p.value} ${unit}</title></circle>`).join('')}<text x="60" y="220">${points[0].date}</text>${points.length>1?`<text x="600" y="220" text-anchor="end">${lastDate(points)}</text>`:''}</svg>`;
}
function lastDate(points) { return points.at(-1).date; }

function setTrackingControls(session) {
  const free=session.setTrackingMode==='free';
  return ui`<div class="set-tracking-controls"><div class="set-tracking-options" role="group" aria-label="Як записувати підходи">${[['planned','За планом'],['free','Вільний запис']].map(([mode,title])=>`<button type="button" data-action="set-tracking-mode" data-mode="${mode}" aria-pressed="${(free?'free':'planned')===mode}">${uiText(title)}</button>`).join('')}</div><p>${free?uiText('Записуй стільки підходів, скільки виконав. Кількість рахується з твоїх записів. Коли закінчиш вправу — перейди далі.'):uiText('Кількість у програмі — орієнтир. За потреби можна зберегти додаткові підходи.')}</p></div>`;
}
function workoutHeader(s) {
  const done = s.items.filter((item,index) => s.simpleCompleted?.includes(index) || (s.setTrackingMode==='free'?s.freeCompleted?.includes(index):s.logs.filter(log => log.index === index && isWorkingSet(log)).length >= item.sets)).length;
  const percent = s.items.length ? Math.round(done / s.items.length * 100) : 0;
  return `<header class="workout-heading"><div><span class="workout-live"><i></i> Тренування триває</span><h1>${esc(s.name)}</h1><p>${done} із ${s.items.length} вправ виконано <span>·</span> ${s.logs.filter(log => isWorkingSet(log)).length} підходів</p></div>${s.timeBudgetMinutes?ui`<span class="time-budget-session-badge">${uiText('Режим')} ${s.timeBudgetMinutes} ${uiText('хвилин')} · ≈ ${s.estimatedMinutes} ${uiText('хв')}</span>`:''}<div class="workout-header-actions">${btn('Розминка','warmup-templates','data-target="session"','ghost')}${gymControls(gymPrefs())}${btn('Згорнути','route','data-id="home"','ghost')}${btn('Завершити достроково','finish-early','','secondary')}</div><div class="workout-progress" role="progressbar" aria-label="Виконані вправи" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div></header>${turnPanel(s)}${deferredPanel(s)}`;
}
function executionControls(s) {
  return `<div class="execution-controls"><label><span>Режим виконання</span><select id="execution-mode">${[['simple','Простий'],['advanced','Розширений'],['mixed','Змішаний']].map(([key,label]) => `<option value="${key}" ${(s.executionMode || 'advanced') === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><details class="workout-settings"><summary>Налаштування</summary><div><p class="small muted">Простий — позначай вправи. Розширений — записуй підходи. Змішаний — обирай для кожної вправи. Режим зберігається для наступних тренувань.</p>${soundControls()}</div></details></div>`;
}
function workoutOutline(s) {
  return `<aside class="workout-outline card"><div class="workout-section-label">Твій план <span>${s.items.length} вправ</span></div><ol>${s.items.map((item,index)=>({item,index})).sort((a,b)=>Number(!!s.deferred?.includes(a.index))-Number(!!s.deferred?.includes(b.index))).map(({item,index}) => {
    const done = s.simpleCompleted?.includes(index) || (s.setTrackingMode==='free'?s.freeCompleted?.includes(index):s.logs.filter(log => log.index === index && isWorkingSet(log)).length >= item.sets);
    return `<li class="${done ? 'is-done' : index === s.index ? 'is-current' : ''}"><span>${done ? '✓' : index+1}</span><div><strong>${esc(item.name)}</strong><small>${item.sets} підх. · ${item.seconds ? `${item.seconds} сек` : `${esc(item.reps)} повт.`}</small></div>${index === s.index && !done ? '<i aria-label="Поточна вправа"></i>' : ''}</li>`;
  }).join('')}</ol></aside>`;
}
function workoutInput(name, title, value, step) {
  return `<div class="workout-input"><label for="set-${name}">${title}</label><div><button type="button" data-action="adjust-set" data-field="${name}" data-delta="-${step}" aria-label="Зменшити ${name === 'weight' ? 'вагу' : 'повторення'}">−</button><input id="set-${name}" name="${name}" type="text" inputmode="text" value="${esc(value)}" ${name === 'reps' ? 'maxlength="12" placeholder="10-12"' : 'maxlength="30"'} required aria-describedby="set-format"/><button type="button" data-action="adjust-set" data-field="${name}" data-delta="${step}" aria-label="Збільшити ${name === 'weight' ? 'вагу' : 'повторення'}">+</button></div></div>`;
}
function workoutSets(s,item) {
  const logs=s.logs.filter(log=>log.index === s.index && isWorkingSet(log));
  const free=s.setTrackingMode==='free';
  if(free&&!logs.length)return ui`<p class="small muted">Збережені підходи з’являться тут.</p>`;
  return `<div class="workout-sets"><div class="workout-section-label">Підходи <span>${free?`${logs.length} ${uiText('збережено')}`:`${logs.length} / ${item.sets} ${uiText('за планом')}`}</span></div><table><caption class="visually-hidden">Результати поточної вправи</caption><thead><tr><th>Підхід</th><th>Вага</th><th>Повторення</th><th>Дії</th></tr></thead><tbody>${Array.from({length:free?logs.length:Math.max(item.sets,logs.length)},(_,index)=>{
    const log=logs[index],plan=setPlan(item,Math.min(index,item.sets-1)),parent=log ? s.logs.indexOf(log) : -1;
    const drops=s.logs.filter(entry=>entry.dropOf === parent);
    return `<tr class="${log ? 'is-done' : index === logs.length ? 'is-current' : ''}"><th scope="row">${index+1}${!free&&index>=item.sets?` <span class="extra-set-label">${uiText('Додатковий')}</span>`:''}</th><td>${log ? esc(weightLabel(log)) : esc(weightLabel({...item,...plan}))}</td><td>${log ? repsLabel(log) : esc(plan.reps)}</td><td>${log ? `${btn('＋ Дроп','add-drop-set',`data-log="${parent}" ${drops.length >= 5 || log.weightUnknown || log.weight <= 0 ? 'disabled' : ''}`,'ghost')}${btn('Скасувати','remove-workout-log',`data-log="${parent}"`,'ghost')}` : index === logs.length ? 'Зараз' : '—'}</td></tr>${drops.map((drop,k)=>`<tr class="drop-set-row"><th scope="row">↳ Дроп ${k+1}</th><td>${esc(weightLabel(drop))}</td><td>${repsLabel(drop)}</td><td>Продовження ${index+1}</td></tr>`).join('')}`;
  }).join('')}</tbody></table><details class="workout-more"><summary>Що таке дропсет?</summary><p class="small muted">Після основного підходу зменшуєш вагу та продовжуєш ту саму вправу без звичайної паузи. Кожне зниження записується окремим дропом. Дропи додають обсяг, але не закривають заплановані підходи. Це необов’язковий спосіб запису.</p></details></div>`;
}
function recentDropAction(session) {
  const parent=[...session.logs].reverse().find(isWorkingSet);
  if (!parent || parent.index === session.index || parent.weightUnknown || parent.weight <= 0) return '';
  const position=session.logs.indexOf(parent),drops=session.logs.filter(log=>log.dropOf === position);
  return `<div class="notice recent-drop"><span class="small muted">Останній основний підхід: ${esc(session.items[parent.index].name)} · ${esc(weightLabel(parent))}</span>${btn('＋ Дроп до попередньої вправи','add-drop-set',`data-log="${position}" ${drops.length >= 5 ? 'disabled' : ''}`,'ghost')}</div>`;
}
function openDropSet(parentIndex) {
  const session=ongoing(),parent=session?.logs[parentIndex];
  if (!parent || !isWorkingSet(parent) || parent.weightUnknown || parent.weight <= 0) throw Error('Обери основний підхід із відомою вагою.');
  const drops=session.logs.filter(log=>log.dropOf === parentIndex),previous=drops.at(-1)||parent;
  if (drops.length >= 5) throw Error('До 5 знижень на основний підхід.');
  openModal(`<h2>Записати дроп ${drops.length+1}</h2><p>${esc(session.items[parent.index].name)} · попередня вага ${esc(weightLabel(previous))}</p><p class="small muted">Дроп — продовження основного підходу зі зменшеною вагою. Вкажи фактичну вагу, меншу за ${previous.weight} кг, і виконані повторення.</p><form id="drop-set-form" data-session="${esc(session.id)}" data-parent="${parentIndex}" data-logs="${session.logs.length}"><div class="formgrid">${field('Вага: кг або плитки','weight','','text','required maxlength="30"')}${field('Повторення','reps','','text','required maxlength="12" placeholder="8 або 8-10"')}</div><button type="submit" class="btn">Зберегти дроп</button><div class="form-error" role="alert"></div></form>`);
}
function supersetNotice(session,index) {
  const partner=supersetPartner(session.items,index);
  if (partner < 0) return '';
  if(session.setTrackingMode==='free')return ui`<div class="notice superset-notice"><strong>Суперсет</strong><p>У вільному записі ти сам обираєш, коли закінчити вправу та перейти до наступної.</p></div>`;
  return `<div class="notice superset-notice"><strong>Суперсет · ${esc(session.items[index].name)} + ${esc(session.items[partner].name)}</strong><p class="small muted">Виконуй по одному підходу кожної вправи поспіль. Під час обліку підходів після першої вправи запис перейде до другої; таймер відпочинку почнеться після обох.</p></div>`;
}
function weightSuggestionPanel(item,session,index,actionable=false) {
  const suggestion=nextWeightSuggestion(S.sessions,item,{currentId:session.id,beforeDate:session.date});
  if (!suggestion.weights.length) return `<p class="small muted weight-suggestion">Наступна вага: ${esc(suggestion.reason)}</p>`;
  const position=Math.min(workingSetCount(session,index),item.sets-1),weight=suggestion.weights[position];
  return `<details class="notice weight-suggestion" ${actionable ? 'open' : ''}><summary><strong>Підказка ваги · ${suggestion.status === 'increase' ? 'наступний крок' : 'залишити вагу'}</strong></summary><p>${suggestion.weights.map((value,k)=>`${k+1}: ${esc(weightLabel({...item,weight:value}))}`).join(' · ')}</p><p class="small muted">${esc(suggestion.reason)} Крок: ${suggestion.step} кг. За записами ${esc(suggestion.date)} у цьому профілі.</p>${actionable && workingSetCount(session,index) < item.sets ? btn(`Підставити ${weight} кг`,'apply-weight-suggestion','type="button"','secondary') : ''}<p class="small muted">Це підказка за журналом. Вагу обираєш і підтверджуєш самостійно.</p></details>`;
}
function nextWeightsSummary(session) {
  const entries=session.items.map(item=>({item,suggestion:nextWeightSuggestion(S.sessions,item,{beforeDate:session.date,beforeEnd:session.endedAt})})).filter(entry=>entry.suggestion.weights.length);
  if (!entries.length) return '';
  return `<section class="card next-weight-summary"><h2>Вага на наступне тренування</h2><p class="small muted">Для того самого профілю тренувань. Збільшення пропонується, коли верхню ціль повторень підтверджено в усіх підходах. Вага не змінюється автоматично.</p>${entries.map(({item,suggestion})=>`<div class="next-weight-entry"><strong>${esc(item.name)} · ${esc(profileLabel(item.machine,S.trainingProfiles))}</strong><p>${suggestion.weights.map((value,k)=>`${k+1}: ${esc(weightLabel({...item,weight:value}))}`).join(' · ')}</p><p class="small muted">${esc(suggestion.reason)}</p></div>`).join('')}</section>`;
}

function checklistView(s) {
  return `<div class="session workout-studio">${workoutHeader(s)}${executionControls(s)}${setTrackingControls(s)}${workoutDescription(s)}<div class="workout-list-heading"><h2>Твої вправи</h2><span>Список тренування</span></div><div class="workout-checklist">${s.items.map((item,index)=>({item,index})).sort((a,b)=>Number(!!s.deferred?.includes(a.index))-Number(!!s.deferred?.includes(b.index))).map(({item,index}) => {
    const done = s.simpleCompleted?.includes(index) || (s.setTrackingMode==='free'?s.freeCompleted?.includes(index):s.logs.filter(l => l.index === index && isWorkingSet(l)).length >= item.sets);
    const logs = s.logs.filter(l => l.index === index);
    return `<section class="card checklist-item ${done ? 'is-done' : ''} ${s.deferred?.includes(index)?'is-deferred':''}"><div class="checklist-title"><span class="exercise-number">${done ? '✓' : String(index+1).padStart(2,'0')}</span><div><span class="workout-section-label">${esc(item.primary || 'Тренування')}</span><h2>${esc(item.name)}</h2><p class="small muted">${item.sets} підходи · ${item.seconds ? `${item.seconds} сек` : `${esc(item.reps)} повторень`}${item.weight ? ` · ${item.weight} кг` : ''}</p></div></div>${item.note ? `<p class="small muted">${esc(item.note)}</p>` : ''}${plannedExerciseChoices(s,index)}${workoutLoadButton(item,index)}${supersetNotice(s,index)}${s.setTrackingMode==='free'?'':weightSuggestionPanel(item,s,index)}${replacementBanner(s,index)}${skipDetail(s,index)}${exerciseNotePanel(item,index)}${previousWeight(item,s)}${logs.length ? `<div class="checklist-results">${logs.map(l=>`<span>${l.dropOf !== undefined ? 'Дроп' : l.quickResult ? 'Найкращий' : l.warmup ? 'Розминка' : 'Підхід'}: <strong>${esc(weightLabel(l))} × ${repsLabel(l)}</strong>${btn('Скасувати','remove-workout-log',`data-log="${s.logs.indexOf(l)}" aria-label="Скасувати запис: ${esc(item.name)}"`,'ghost')}</span>`).join('')}</div>` : ''}<div class="checklist-actions">${!done&&!s.skipped.includes(index)?btn('Відкласти','defer-exercise',`data-index="${index}"`,'ghost')+btn('Пропустити','skip-exercise',`data-index="${index}"`,'ghost'):''}${s.skipped.includes(index)?btn('Повернути вправу','resume-exercise',`data-index="${index}"`,'ghost'):''}${!logs.length && !done ? btn('Замінити вправу','workout-alternatives',`data-index="${index}"`,'secondary') : ''}${btn(done ? 'Скасувати виконання' : 'Позначити виконаною',done ? 'reset-exercise' : 'simple-done',`data-index="${index}" aria-pressed="${!!done}"`,done ? 'secondary' : '')}${s.executionMode === 'mixed' ? btn('Вага кожного підходу','workout-detail',`data-index="${index}"`,'secondary') : btn('Записати результат','quick-result',`data-index="${index}"`,'secondary')}</div><details class="workout-more"><summary>Про вправу та результат</summary><div class="actions">${s.executionMode === 'mixed' ? btn('Записати результат','quick-result',`data-index="${index}"`,'ghost') : ''}${item.exerciseId ? btn('Як виконувати','detail',`data-id="${esc(item.exerciseId)}" data-session="1"`,'ghost') : ''}</div></details></section>`;
  }).join('')}</div><div class="workout-finish">${btn('✓ Завершити тренування','finish-checklist','','wide')}<p>Усе виконане залишиться в історії</p></div></div>`;
}

function alternativePanel(source, index) {
  source = {...source, equipment:source.equipment || source.snapshot?.equipment || S.exercises.find(e=>e.id===source.exerciseId)?.equipment};
  const list = alternatives(S.exercises, source);
  const equipment = [...new Set(list.map(e=>e.equipment).filter(Boolean))];
  return `<details class="exercise-alternatives" ${index !== undefined ? 'open' : ''}><summary>Альтернативні вправи · ${list.length}</summary><p class="small muted">Та сама основна м’язова група. Спочатку — вправи з таким самим обладнанням. Перевір техніку й налаштуй навантаження для заміни.</p><label>Доступне обладнання<select data-alternative-equipment><option value="">Усе</option>${equipment.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}</select></label>${list.map(e=>`<div class="alternative-row" data-equipment="${esc(e.equipment || '')}"><span><strong>${esc(e.name)}</strong><small>${esc(e.equipment)}</small></span>${btn(index === undefined ? 'Переглянути' : 'Обрати',index === undefined ? 'detail' : 'replace-exercise',`data-id="${esc(e.id)}" ${index === undefined ? '' : `data-index="${index}"`}`,'ghost')}</div>`).join('') || '<p class="muted">У каталозі ще немає альтернатив для цієї групи.</p>'}</details>`;
}
function workoutReplacementPicker(source, index) {
  const recommended = new Set(alternatives(S.exercises, source).map(e => e.id));
  const list = S.exercises.filter(e => !e.archived && e.id !== source.exerciseId)
    .sort((a,b) => Number(recommended.has(b.id)) - Number(recommended.has(a.id)) || a.name.localeCompare(b.name, 'uk'));
  const equipment = [...new Set(list.map(e => e.equipment).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'uk'));
  return `<div class="workout-replacements"><label>Причина заміни<select id="replacement-reason">${Object.entries(replacementReasons).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><p class="small muted">Лише для поточного тренування. Основна програма не зміниться. Обери будь-яку вправу із загального каталогу або особистої бібліотеки. Рекомендовані альтернативи — на початку списку. Після заміни налаштуй вагу для нової вправи.</p><label>Пошук вправи<input type="search" data-replacement-filter="query" placeholder="Назва вправи" /></label><div class="formgrid"><label>Показати<select data-replacement-filter="scope"><option value="all">Усі вправи</option><option value="alternatives">Лише альтернативні</option></select></label><label>Обладнання<select data-replacement-filter="equipment"><option value="">Усе</option>${equipment.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}</select></label></div>${list.map(e=>`<div class="alternative-row" data-name="${esc(e.name.toLocaleLowerCase('uk'))}" data-equipment="${esc(e.equipment || '')}" data-recommended="${recommended.has(e.id)}"><span><strong>${esc(e.name)}</strong><small>${esc(e.primary)} · ${esc(e.equipment || 'Без обладнання')}${recommended.has(e.id) ? ' · Альтернатива' : ''}</small></span>${btn('Обрати','replace-exercise',`data-id="${esc(e.id)}" data-index="${index}"`,'ghost')}</div>`).join('')}<p class="muted replacement-empty" ${list.length ? 'hidden' : ''}>За цими фільтрами вправ немає.</p></div>`;
}
function filterWorkoutReplacements(target) {
  const panel = target.closest('.workout-replacements');
  if (!panel) return;
  const query = panel.querySelector('[data-replacement-filter="query"]').value.trim().toLocaleLowerCase('uk');
  const scope = panel.querySelector('[data-replacement-filter="scope"]').value;
  const equipment = panel.querySelector('[data-replacement-filter="equipment"]').value;
  let visible = 0;
  panel.querySelectorAll('.alternative-row').forEach(row => {
    row.hidden = !query.split(/\s+/).every(word=>row.dataset.name.includes(word)) || scope === 'alternatives' && row.dataset.recommended !== 'true' || !!equipment && row.dataset.equipment !== equipment;
    if (!row.hidden) visible++;
  });
  panel.querySelector('.replacement-empty').hidden = visible > 0;
}
document.addEventListener('input', event => {
  if (event.target.matches('[data-replacement-filter]')) filterWorkoutReplacements(event.target);
});
function addExercisePicker(id) {
  const e = S.exercises.find(e=>e.id===id && !e.archived);
  if (!e) throw Error('Вправу не знайдено.');
  const programs = S.programs.filter(p=>!p.archived && (p.scope !== 'home' || S.homeAccess || owner()));
  const targets = programs.flatMap(p=>p.days.map((d,index)=>`<option value="program|${esc(p.id)}|${index}">${esc(p.name)} · ${esc(d.name)}</option>`));
  if (ongoing()) targets.unshift('<option value="active">Поточне активне тренування</option>');
  openModal(`<h2>Додати · ${esc(e.name)}</h2>${targets.length ? `<form id="catalog-add-form" data-exercise="${esc(id)}"><label>Куди додати<select name="target" required>${targets.join('')}</select></label><p class="small muted">Параметри за замовчуванням: 3 підходи по 10–12 повторень. Їх можна змінити в редакторі програми.</p><button class="btn" type="submit">Додати вправу</button><div class="form-error" role="alert"></div></form>` : `<p>Спочатку створи програму з днем тренування.</p>${btn('Створити програму','route','data-id="editor"','secondary')}`}`);
}
function exerciseProgress(id) {
  const e = S.exercises.find(e=>e.id===id);
  if (!e) throw Error('Вправу не знайдено.');
  const item = {exerciseId:id,name:e.name}, analytics=progressSessions(profileSessions(),profileManualSets());
  const matches = analytics.filter(s=>s.status==='completed').flatMap(s=>s.logs.filter(l=>!l.warmup && sameMachine(l,profileContext(S.activeTrainingProfileId)) && s.items[l.index] && exerciseKey(s.items[l.index])===exerciseKey(item)).map(log=>({date:s.date,at:log.at || s.endedAt || 0,log}))).sort((a,b)=>b.date.localeCompare(a.date)||b.at-a.at);
  const record=personalRecords(analytics,profileContext(S.activeTrainingProfileId)).find(r=>r.key===id), points=progressSeries(analytics,{key:id,machine:profileContext(S.activeTrainingProfileId)});
  openModal(`<p class="small muted">Профіль: ${esc(profileLabel(profileContext(S.activeTrainingProfileId),S.trainingProfiles))}</p><h2>Мій прогрес · ${esc(e.name)}</h2><span class="private-label">Бачиш тільки ти</span>${matches.length ? `<p>Останній результат: <strong>${esc(weightLabel(matches[0].log))} × ${repsLabel(matches[0].log)}</strong> · ${esc(matches[0].date)}</p>` : '<p class="muted">Ще немає записаних результатів для цієї вправи.</p>'}${record ? `<p class="record-badge">🏆 Рекорд: ${esc(weightLabel(record))} × ${repsLabel(record)}</p>` : ''}${points.length ? progressChart(points,'кг') : ''}<p class="small muted">Графік показує найбільшу сумарну відому вагу за день, з урахуванням кількості рук / сторін. Записи з невідомою вагою залишаються в історії нижче.</p>${matches.slice(0,20).map(({date,log})=>`<p>${esc(date)} · ${esc(weightLabel(log))} × ${repsLabel(log)}</p>`).join('')}`);
}

function sessionView() {
  const summary = profileSessions().find(session=>session.id === S.summaryId && session.status === 'completed');
  if (summary) return summaryScreen(summary);
  const s = ongoing();
  if (!s) return `<div class="session workout-empty card"><span class="workout-empty-icon">✓</span>${heading(S.workoutDiscarded ? 'Тренування завершено' : 'Тренування',S.workoutDiscarded ? 'Без збереження в історії та профілі. ' : 'Обери тренування у своїй програмі.',btn('До моєї програми','route','data-id="program"'))}</div>`;
  if (s.warmup?.trim() && !s.warmupDone) return `<div class="session workout-studio">${workoutHeader(s)}<section class="card warmup-card"><span class="workout-section-label">Перед стартом</span><h2>Час розігрітися</h2><p class="workout-description">${esc(s.warmup)}</p><div class="actions">${btn('✓ Розминку виконано','warmup-done')}${btn('Пропустити розминку','warmup-skip','','ghost')}</div></section></div>`;
  if (!s.items.length) return `<div class="session workout-studio">${workoutHeader(s)}<section class="card warmup-card">${workoutDescription(s)}${btn('✓ Завершити тренування','finish-text','','wide')}</section></div>`;
  if (s.executionMode === 'simple' || s.executionMode === 'mixed' && !s.detailedIndex?.includes(s.index)) return checklistView(s);
  const item = s.items[s.index], count = workingSetCount(s), plan = setPlan(item,Math.min(count,item.sets-1));
  const working = s.logs.filter(log=>log.index === s.index && isWorkingSet(log));
  const last = !item.setPlans?.[count] && working.at(-1);
  const warmups = s.logs.filter(log=>log.index === s.index && log.warmup);
  return `<div class="session workout-studio">${workoutHeader(s)}${executionControls(s)}
    ${s.executionMode === 'mixed' ? btn('До списку вправ','workout-list','','ghost workout-back') : ''}
    <div class="workout-layout"><div class="workout-main"><section class="card workout-active">
      <div class="workout-exercise-heading"><div><span class="workout-section-label">Вправа ${s.index+1} / ${s.items.length} <span>${esc(item.primary || 'Тренування')}</span></span><h2 class="workout-title">${esc(item.name)}</h2><p>${s.setTrackingMode==='free'?`${uiText('Вільний запис')} · ${count} ${uiText('збережено')}`:`${item.sets} підходи <span>·</span> ${plan.seconds ? `${plan.seconds} сек` : `${esc(plan.reps)} повторень`} <span>·</span> відпочинок ${plan.rest} с`}</p></div><span class="workout-exercise-icon" aria-hidden="true">${String(s.index+1).padStart(2,'0')}</span></div>
      ${item.note ? `<p class="workout-note">${esc(item.note)}</p>` : ''}
      ${s.restEnd ? `<div class="workout-rest" role="status"><div><span class="workout-section-label">Відпочинок</span><strong data-end="${s.restEnd}">${clock(remaining(s.restEnd))}</strong></div><div class="actions">${btn('+30 с','rest-add','','secondary')}${btn('Пропустити','rest-skip','','ghost')}</div></div>` : ''}
      ${plannedExerciseChoices(s,s.index)}${workoutLoadButton(item,s.index)}${supersetNotice(s,s.index)}${s.setTrackingMode==='free'?'':weightSuggestionPanel(item,s,s.index,true)}${exerciseNotePanel(item,s.index)}${replacementBanner(s,s.index)}<form id="set-form" class="workout-recorder">${setTrackingControls(s)}<div class="workout-record-heading"><h3>${uiText(s.setTrackingMode!=='free'&&count >= item.sets ? 'Додатковий підхід' : 'Записати підхід')} ${count+1}</h3><span>${s.setTrackingMode==='free'?`${count} ${uiText('збережено')}`:`${count} / ${item.sets} ${uiText('за планом')}`}</span></div>
        ${previousWeight(item,s,count)}
        ${weightDetailsFields(last || plan)}<div class="workout-values">${workoutInput('weight','Вага, кг',last ? last.weightText || last.weight : plan.weight,2.5)}${workoutInput('reps','Повторення',plan.seconds ? 0 : last ? repsLabel(last) : plan.reps || 0,1)}</div>
        <div class="actions">${btn('Калькулятор дисків','plate-calculator','type="button"','ghost')}</div><div class="workout-reuse">${previousWorkingSet(S.sessions,item,s.id,count) ? btn('↶ Як минулого разу','use-previous-set','type="button"','ghost') : ''}<details><summary>Кг або плитки</summary><p id="set-format">Введи вагу у кг або кількість плиток: 60, 6x10 чи 6x?. Повторення можна ввести приблизно: 10-12. Обсяг рахується за нижньою межею. Кнопки змінюють вагу на 2,5 кг, а плитки — на одну.</p></details></div>
        ${actualMetrics(item,s)}
        ${plan.seconds ? `<div class="workout-exercise-timer"><div class="timer" data-end="${s.timerEnd}" data-default="${plan.seconds}">${clock(s.timerEnd ? remaining(s.timerEnd) : plan.seconds)}</div>${btn(s.timerEnd ? 'Перезапустити таймер' : 'Почати таймер','timer','type="button"','secondary')}</div>` : ''}
        <button class="btn wide workout-save" type="submit">${uiText(count>0&&(s.setTrackingMode==='free'||count>=item.sets)?'＋ Зберегти ще підхід':'✓ Зберегти підхід')}</button>${s.setTrackingMode!=='free'&&count >= item.sets ? `<p class="small muted workout-extra-help">${uiText('План виконано. Можеш записати ще підходи або перейти далі. Усі результати збережуться в історії та статистиці.')}</p>` : ''}
        <details class="workout-more workout-warmup"><summary>Розминочний підхід${warmups.length ? ` · ${warmups.length} записано` : ''}</summary><p class="small muted">Введи вагу й повторення розминки у поля вище.</p><button type="submit" class="btn secondary wide" data-warmup="1">＋ Записати розминочний підхід</button>${warmups.map(log=>`<p class="small muted">${esc(weightLabel(log))} × ${repsLabel(log)}</p>`).join('')}</details><div class="form-error" role="alert"></div>
      </form>
      ${recentDropAction(s)}${workoutSets(s,item)}
      <div class="workout-next">${btn(nextExerciseLabel(s),'next',s.setTrackingMode!=='free'&&count < item.sets ? 'disabled' : '','wide secondary')}</div>
    </section>
    <details class="card workout-exercise-info"><summary>Техніка та попередні результати</summary><div>${item.custom ? '' : exercisePhoto(item,'large')}${item.exerciseId ? btn('Як виконувати','detail',`data-id="${esc(item.exerciseId)}" data-session="1"`,'secondary') : ''}${previousWorkout(item,s)}${workoutDescription(s)}</div></details>
    <div class="workout-secondary-actions">${!exerciseDone(s,s.index)?btn('Відкласти вправу','defer-exercise',`data-index="${s.index}"`,'secondary'):''}${s.logs.length ? btn('Скасувати останній підхід','undo-set','','ghost') : ''}${!s.logs.some(log=>log.index===s.index) && !s.simpleCompleted?.includes(s.index) ? btn('Замінити на сьогодні','workout-alternatives',`data-index="${s.index}"`,'ghost') : ''}${btn('Пропустити вправу','skip','','ghost')}</div>
    </div>${workoutOutline(s)}</div></div>`;
}

function adminRecordActions(record, kind) {
  const buttons = btn("Змінити", `edit-${kind}`, `data-id="${esc(record.id)}"`, "ghost") +
    (kind === 'exercise' ? btn('Оновити JSON','open-catalog-json',`data-id="${esc(record.id)}"`,'ghost') : '') +
    btn(record.archived ? "Відновити" : "Архівувати", `archive-${kind}`, `data-id="${esc(record.id)}"`, "ghost") +
    btn("Видалити", `delete-${kind}`, `data-id="${esc(record.id)}"`, "ghost danger");
  return `<div class="actions admin-desktop-actions">${buttons}</div>
    <details class="admin-row-menu">
      <summary aria-label="Дії для ${esc(record.name)}">⋯</summary>
      <div class="admin-action-popover">${buttons}</div>
    </details>`;
}
function displayDate(value) {
  if (!value) return uiText("Немає даних");
  const date = new Date(activityMillis(value) || NaN);
  return Number.isNaN(date.getTime()) ? uiText("Немає даних") : formatInstant(date,uiLocale());
}
function homeAccessControl(id) {
  return `<div class="admin-access-controls">${[['homeWorkouts','Домашні комплекси','toggle-home-access'],['nutrition','Харчування','toggle-nutrition-access'],['profileCustomization','Розширена кастомізація профілю','toggle-customization-access'],['extraTrainingProfiles','До 5 профілів тренувань','toggle-training-profiles-access']].map(([key,title,action]) => {
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
    ${item.superset ? `<p class="small">Суперсет: ${esc(item.superset)}</p>` : ''}<p>${item.sets} підходів · ${esc(item.reps)} повторень · ${esc(weightLabel({...item,weight:item.weight || 0}))}${item.seconds ? ` · ${item.seconds} сек` : ""} · відпочинок ${item.rest || 0} сек</p>
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
async function loadAdminAwards(uid,value) {
  if(!owner())throw Error('Немає доступу.');
  const box=modal.querySelector('[data-admin-awards]');if(!box||box.dataset.uid!==uid)return;
  if(!value)box.innerHTML='<p role="status" class="muted">Завантаження досягнень…</p>';
  try {
    const data=value||await db.adminAchievementAwards(uid);
    if(!box.isConnected||box.dataset.uid!==uid)return;
    box.innerHTML=`<div class="sectionhead"><h3>GymB ACHIEVEMENT</h3><span class="badge">${data.score} балів · ${data.earnedIds.length} медалей</span></div><form id="admin-award-form" data-uid="${esc(uid)}"><label>Досягнення<select name="medalId">${achievementCatalog.map(medal=>`<option value="${medal.id}">${esc(medal.name)} · ${medal.points} балів${data.earnedIds.includes(medal.id)?' · Отримано':''}</option>`).join('')}</select></label><label>Причина видачі (бачить користувач)<input name="note" maxlength="200" placeholder="Необов’язково"/></label><button class="btn" type="submit">Видати досягнення</button><div class="form-error" role="alert"></div></form><h3>Видано адміністратором</h3><div class="admin-awards-list">${(data.manualIds||[]).map(id=>{const medal=achievementCatalog.find(medal=>medal.id===id);return medal?`<div><span><strong>${esc(medal.name)}</strong><small>${medal.points} балів</small></span>${btn('Відкликати','admin-revoke-achievement',`data-id="${medal.id}" data-uid="${esc(uid)}"`,'ghost danger')}</div>`:'';}).join('')||'<p class="muted">Виданих медалей немає.</p>'}</div><p class="small muted">Повторна видача не додає балів. Відкликання ручної видачі не забирає медаль, яку користувач уже отримав автоматично.</p>`;
  } catch(error) {if(box.isConnected)box.innerHTML=`<p class="error" role="alert">${esc(err(error))}</p>${btn('Повторити','admin-load-awards',`data-uid="${esc(uid)}"`,'secondary')}`;}
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
    <div class="admin-member-nav" aria-label="Розділи керування користувачем">${[['overview','Огляд і доступ'],['training','Тренування'],['awards','Досягнення'],['logins','Історія входів']].map(([key,title]) => btn(title,'admin-member-panel',`data-panel="${key}" aria-pressed="${key === 'overview'}"`,'ghost')).join('')}</div>
    <section data-member-panel="overview"><dl class="user-facts"><div><dt>Реєстрація</dt><dd>${displayDate(user.registeredAt || user.createdAt)}</dd></div><div><dt>Остання активність</dt><dd>${displayDate(user.lastActiveAt)}</dd></div><div><dt>Останнє тренування</dt><dd>${esc(latest?.date || 'Ще немає')}</dd></div><div><dt>Останній вхід</dt><dd>${displayDate(user.lastLoginTime)}</dd></div></dl>
    ${homeAccessControl(id)}${adminTagEditor(id, labels?.tags || [])}<div class="actions">${btn('Відкрити профіль', 'view-person', `data-id="${esc(id)}"`, 'secondary')}</div></section>
    <section data-member-panel="awards" hidden><div data-admin-awards data-uid="${esc(id)}"></div></section><section data-member-panel="logins" hidden><h3>Останні 5 входів з IP</h3><p class="small muted">Найновіші зверху. Повторні входи з тієї самої адреси показуються окремо.</p>
    <div class="login-ip-list">${ips.map((entry, index) => `<div class="login-ip-row"><span class="login-ip-number">${index + 1}</span><div><code>${esc(entry.ip)}</code><p class="small muted">${displayDate(entry.time)}</p></div>${index === 0 ? '<span class="badge">Останній</span>' : ''}</div>`).join('') || '<p class="muted">IP ще не записані. Історія з’явиться після наступних входів.</p>'}</div><p class="small muted">IP передає застосунок під час входу. Якщо визначити адресу не вдалося, запис не додається.</p></section>
    <section data-member-panel="training" hidden>
    <h3>Програми користувача</h3>
    ${programs.length ? programs.map((p) => `<details class="user-program" open><summary>${esc(p.name)} ${p.id === user.activeProgramId ? '· Активна' : ''}</summary>
      <p class="small muted">${esc(uiText(p.type))}</p>${(p.days || []).map((d) => `<section class="admin-plan-day"><h3>${esc(localizedDayLabel(p, d, true))} · ${esc(d.name)}</h3><p>${esc(d.groups)}</p>${workoutDescription(d)}${d.items.map(adminItemDetails).join("") || (d.description ? "" : '<p class="muted">Плану ще немає.</p>')}</section>`).join("")}</details>`).join("") : '<p class="muted">Програм ще немає.</p>'}
    <h3>Заплановані, поточні та завершені тренування</h3>
    ${sessions.length ? [...sessions].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((s) => `<details class="user-program"><summary>${esc(s.date)} · ${esc(s.name)} · ${s.status === "planned" ? "Заплановано" : s.status === "completed" ? "Завершено" : "Триває"}</summary>
      <p class="small muted">${s.logs?.length || 0} підходів${s.endedAt ? ` · ${Math.max(0, Math.round((s.endedAt - s.startedAt) / 60000))} хв` : ""}</p>
      ${workoutDescription(s)}
      ${(s.items || []).map((item, index) => `${adminItemDetails(item)}<div class="admin-set-logs">${s.skipped?.includes(index) ? '<p>Вправу пропущено</p>' : ''}${(s.logs || []).filter((l) => l.index === index).map((l, k, logs) => `<p>${setLogLabel(logs, k)}: ${repsLabel(l)} повторень · ${esc(weightLabel(l))}${l.seconds ? ` · ${l.seconds} сек` : ""}</p>${metricSummary(l.metrics)}`).join("")}</div>`).join("")}</details>`).join("") : '<p class="muted">Тренувань ще немає.</p>'}</section>`, "admin-member-title", "admin-user-dialog");
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
  return `<section class="card"><div class="sectionhead"><div><h2>Статистика спільноти</h2><p class="small muted">${S.adminStatsAt?`Оновлено: ${displayDate(S.adminStatsAt)}`:'Завантаж дані, щоб побачити статистику.'}</p></div>${btn('Оновити статистику','load-admin-statistics','','secondary')}</div>${S.adminStatsAt?`<div class="admin-stat-grid">${[[stats.week,'Активні за 7 днів'],[stats.newToday,'Реєстрації сьогодні'],[stats.newWeek,'Нові за 7 днів'],[stats.home,'Доступ до домашніх'],[stats.nutrition,'Доступ до харчування'],[stats.total?Math.round(stats.today/stats.total*100)+'%':'0%','Активність сьогодні']].map(([value,label])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><div class="admin-stat-columns"><section><h3>Нові учасники за тиждень</h3><div class="admin-registration-chart" role="img" aria-label="Реєстрації за останні сім днів">${stats.registrations.map(item=>`<div title="${item.date}: ${item.count}"><strong>${item.count}</strong><div><i style="height:${Math.max(2,item.count/max*100)}%"></i></div><small>${item.date.slice(5).split('-').reverse().join('.')}</small></div>`).join('')}</div></section><section><h3>Зараз активні <span class="badge">${stats.online.length}</span></h3><div class="admin-online-list">${stats.online.sort((a,b)=>activityMillis(b.lastActiveAt)-activityMillis(a.lastActiveAt)).slice(0,12).map(user=>`<div class="row">${personAvatar(user)}<div class="grow"><strong>${esc(user.name||'Без імені')}</strong><small class="muted">#${esc(user.customId||'—')}</small></div>${btn('Керувати','admin-user',`data-id="${esc(user.id)}"`,'ghost')}</div>`).join('')||'<p class="muted">Немає активних користувачів за останні 5 хвилин.</p>'}</div></section></div><p class="small muted">«Зараз» — активність за останні 5 хвилин. «Сьогодні» — унікальні користувачі з останньою активністю сьогодні за київським часом. Дані оновлюються кнопкою вище.</p>`:'<p class="muted">Учасники онлайн, активність, реєстрації та надані доступи — в одному місці.</p>'}</section>`;
}
function adminSection(key,title,description,icon,count,content) {
  return `<details class="admin-section" data-admin-section="${key}" ${adminExpanded.has(key)?'open':''}><summary><span class="admin-section-icon" aria-hidden="true">${icon}</span><span class="admin-section-label"><strong>${title}</strong><span>${description}</span></span><span class="admin-section-count">${count}</span><span class="admin-section-chevron" aria-hidden="true">⌄</span></summary><div class="admin-section-body">${content}</div></details>`;
}
document.addEventListener('toggle',event=>{
  const section=event.target;
  if(!section.isConnected||!section.matches?.('.admin-section'))return;
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
          <h2>Наповнення каталогу</h2><div class="actions">${btn("Експорт усіх вправ JSON", "export-catalog-json", "", "secondary")}${btn("Додати / оновити з JSON", "open-catalog-json", "", "secondary")}${btn("Імпорт вправ і шаблонів", "open-import", "", "ghost")}</div>
          <p class="muted">Експорт містить усі вправи Global, включно з архівом, незалежно від фільтрів. JSON дозволяє додати нові або оновити наявні вправи.</p>
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
    ${adminSection('support','Листування з командою','Приватні запитання, підтримка та пропозиції учасників','✉','Вхідні','<p class="muted">Тут доступні звернення з контактною поштою користувача та приватні відповіді.</p>'+btn('Відкрити вхідні звернення','support-inbox','','secondary'))}
    ${adminSection('reports','Модерація','Звернення учасників та розгляд скарг','⚑',S.reports.filter(report=>report.status==='open').length||'Скарги',reportsPanel())}
    ${adminSection('settings','Налаштування сайту','Опис, оголошення та важливі оновлення','⚙','Сайт',settings)}
  </div></div>`;
}
function sharingDialog(token) {
  const link = programShareURL(token, location.href);
  openModal(ui`<div class="sectionhead"><h2 id="sharing-title">Поділитися програмою</h2>${btn(uiText("Закрити"), "close", "", "ghost")}</div>
    <p>Надішли посилання. Одержувач зможе переглянути програму та зберегти власну копію після входу в акаунт.</p>
    <label>Посилання<input id="program-share-link" type="url" value="${esc(link)}" readonly /></label>
    <div class="actions">${btn(uiText("Копіювати посилання"), "copy-share-link", "", "secondary")}${btn(uiText("Відкликати посилання"), "revoke-share", ui`data-id="${esc(token)}"`, "ghost danger")}</div>`, "sharing-title");
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
function stopSupportView() {for(const stop of supportStops)stop();supportStops=[];}
function openSupportComposer(category='technical') {
  supportRevision++;
  openModal(supportComposer(S.user?.email||'',['technical','cooperation','other'].includes(category)?category:'technical'),'support-title','support-dialog');
}
async function openSupportInbox() {
  const revision=++supportRevision,userId=S.user.uid;
  openModal(ui`<h2 id="support-title">Листування з командою</h2><p role="status">Завантаження…</p>`,'support-title','support-dialog');
  const rows=await db.supportThreads();
  if(revision!==supportRevision||S.user?.uid!==userId||!modal.open||!modal.classList.contains('support-dialog'))return;
  openModal(supportInbox(rows,owner()),'support-title','support-dialog');
}
async function openSupportThread(id) {
  const revision=++supportRevision,userId=S.user.uid;
  openModal(ui`<h2 id="support-title">Листування з командою</h2><p role="status">Завантаження…</p>`,'support-title','support-dialog');
  const thread=await db.supportThread(id);
  const current=()=>revision===supportRevision&&S.user?.uid===userId&&modal.open&&modal.classList.contains('support-dialog');
  if(!current())return;
  openModal(supportConversation(thread,owner()),'support-title','support-dialog');
  const onError=error=>{if(current()){const box=modal.querySelector('#support-thread-error');if(box)box.textContent=err(error);}};
  let first=true;
  supportStops.push(db.watchSupportMessages(id,rows=>{
    if(!current())return;
    const container=modal.querySelector('#support-messages');if(!container)return;
    const atBottom=first||container.scrollHeight-container.scrollTop-container.clientHeight<80;
    container.innerHTML=supportMessages(rows,userId);if(atBottom)container.scrollTop=container.scrollHeight;first=false;
  },onError));
  supportStops.push(db.watchSupportThread(id,value=>{
    if(!current())return;
    const status=modal.querySelector('#support-thread-status');if(status){status.textContent=supportStatus(value.status);status.dataset.status=value.status;}
    const button=modal.querySelector('#support-status-button');if(button){button.dataset.status=value.status==='resolved'?'open':'resolved';button.textContent=uiText(value.status==='resolved'?'Відкрити знову':'Позначити вирішеним');}
  },onError));
}
function openModal(html, labelledBy = "", className = "") {
  stopSupportView();
  disposeRichEditors(modal);
  modal.className = className;
  modal.innerHTML = html;
  mountRichEditors(modal);
  if (labelledBy) modal.setAttribute("aria-labelledby", labelledBy);
  else modal.removeAttribute("aria-labelledby");
  if (!modal.open) modal.showModal();
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
  box.dataset.loadState='loading';
  try {
    const comments=await db.list(`${scope}/${id}/comments`),ratings=commentRatings(comments);
    const authors = Object.fromEntries(await Promise.all([...new Set(comments.map(c => c.authorId))].map(async uid => [uid, await db.publicIdentity(uid)])));
    const summaries = Object.fromEntries(await Promise.all(comments.map(async c => [c.id, await db.commentReactions(`${scope}/${id}/comments/${c.id}`)])));
    if (!box.isConnected || box.loadToken !== token) return;
    box.dataset.loadState='loaded';
    const draft=captureCommentDraft(box.querySelector('#comment-form'));
    const draftScore = box.querySelector('#comment-form [name="score"]:checked')?.value;
    const summary = ratingSummary(ratings), mine = ratings.find(r => r.id === S.user.uid);
    disposeRichEditors(box);
    box.innerHTML = `<h3>Загальний рейтинг</h3><p class="public-rating-summary">${summary.count ? `★ ${summary.average.toFixed(1)} / 5 · оцінок: ${summary.count}` : 'Оцінок ще немає'}</p>
      <h3>Коментарі (${comments.length})</h3><form id="comment-form" data-id="${esc(id)}" data-scope="${scope}">${starInput(draftScore ? Number(draftScore) : mine?.score, true)}${richComposer({draft:draft||'',placeholder:'Твій коментар'})}<p class="small muted">Для публікації коментаря обери оцінку. Фото доступні в коментарях у профілі.</p><button type="submit" class="btn">Опублікувати</button><div class="form-error" role="alert"></div></form>
      <div class="exercise-comments">${comments.sort((a,b) => activityMillis(b.createdAt)-activityMillis(a.createdAt)).map(c => {
        const person = authors[c.authorId] || { name: c.authorName };
        return `<article class="comment-card"><button class="comment-avatar" data-action="view-person" data-id="${esc(c.authorId)}" aria-label="Відкрити профіль">${personAvatar(person)}</button><div class="comment-body"><div class="comment-meta"><button class="person-link" data-action="view-person" data-id="${esc(c.authorId)}">${esc(person.name || c.authorName)}</button><time>${displayDate(c.createdAt)}</time></div>${Number.isInteger(c.score) ? `<span class="review-stars" aria-label="${c.score} з 5">${'★'.repeat(c.score)}${'☆'.repeat(5-c.score)}</span>` : ''}${renderComment(c)}<div class="comment-actions">${reactionButtons(`${scope}/${id}/comments/${c.id}`, summaries[c.id])}${c.authorId === S.user.uid || owner() ? btn('Видалити','delete-comment',`data-id="${esc(id)}" data-scope="${scope}" data-comment="${esc(c.id)}"`,'ghost danger') : ''}</div></div></article>`;
      }).join('') || '<p class="muted">Коментарів ще немає.</p>'}</div>`;
    mountRichEditors(box);
  } catch (e) {
    if (box.isConnected && box.loadToken === token) {
      box.dataset.loadState='error';
      let error = box.querySelector('.community-error');
      if (!error) { error = document.createElement('div'); error.className = 'community-error error'; box.prepend(error); }
      error.innerHTML = `${esc(err(e))} ${btn('Повторити завантаження','reload-community',`data-id="${esc(id)}"`,'secondary')}`;
      box.querySelector('.community-loading')?.remove();
    }
  }
}
function exerciseResultsPanel(id) {
  const exercise=S.exercises.find(e=>e.id===id);if(!exercise)return '';
  const results=exerciseResults(S.sessions,{exerciseId:id,name:exercise.name},profileContext(S.activeTrainingProfileId));
  const format=entry=>entry?`${esc(weightLabel(entry.log))} × ${repsLabel(entry.log)}`:'—';
  return `<section class="exercise-results-panel"><div class="sectionhead"><div><span class="catalog-eyebrow">Особисті дані</span><h3>Результати тренувань</h3><p class="small muted">Профіль: ${esc(profileLabel(profileContext(S.activeTrainingProfileId),S.trainingProfiles))}</p></div><span class="badge">Бачиш тільки ти</span></div><div class="exercise-result-metrics"><div><span>Останній підхід</span><strong>${format(results.latest)}</strong><small>${esc(results.latest?.date||'Ще немає записів')}</small></div><div><span>Найкраща вага</span><strong>${format(results.best)}</strong><small>${esc(results.best?.date||'—')}</small></div><div><span>Тренувань із вправою</span><strong>${results.workouts}</strong></div></div><p class="small muted">Дані беруться із завершених тренувань. Виправлення підходу оновлює історію, графіки та рекорди.</p>${results.entries.length?`<div class="exercise-results-table"><table><thead><tr><th>Дата</th><th>Вага</th><th>Повторення</th><th>Дії</th></tr></thead><tbody>${results.entries.slice(0,10).map(entry=>`<tr><td>${esc(entry.date)}</td><td>${esc(weightLabel(entry.log))}${entry.log.machine ? `<small>${esc(profileLabel(entry.log.machine,S.trainingProfiles))}</small>` : ''}${entry.log.dropOf !== undefined ? '<small>Дроп</small>' : entry.log.quickResult?'<small>Найкращий результат</small>':''}</td><td>${repsLabel(entry.log)}${entry.log.seconds?` · ${entry.log.seconds} с`:''}</td><td>${btn('Виправити','edit-exercise-result',`data-id="${esc(id)}" data-session="${esc(entry.sessionId)}" data-log="${entry.logIndex}"`,'ghost')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Записаних підходів для цієї вправи ще немає.</p>'}</section>`;
}
function editExerciseResult(exerciseId,sessionId,logIndex) {
  const session=S.sessions.find(s=>s.id===sessionId&&s.status==='completed'),log=session?.logs[logIndex];
  if(!log||!S.exercises.some(e=>e.id===exerciseId)||exerciseKey(session.items[log.index])!==exerciseId)throw Error('Результат не знайдено.');
  openModal(`<div class="sectionhead"><h2 id="edit-exercise-result-title">Виправити підхід</h2>${btn('Скасувати','detail',`data-id="${esc(exerciseId)}"`,'ghost')}</div><p class="muted">${esc(session.items[log.index].name)} · ${esc(session.date)}</p><form id="exercise-result-form" data-exercise="${esc(exerciseId)}" data-session="${esc(sessionId)}" data-log="${logIndex}"><div class="formgrid">${field('Вага: кг або плитки','weight',log.weightText||log.weight,'text','required maxlength="30"')}${field('Повторення','reps',repsLabel(log),'text','required maxlength="12" placeholder="10-12"')}${trainingContextField('machine',log.machine || '')}${weightDetailsFields(log)}${field('Час, сек','seconds',log.seconds||0,'number','required min="0" max="7200"')}</div><button type="submit" class="btn">Зберегти підхід</button><div class="form-error" role="alert"></div></form>`,'edit-exercise-result-title');
}
function detail(id,fromSession=false) {
  const catalogExercise=S.exercises.find(x=>x.id===id),sessionItem=ongoing()?.items.find(item=>item.exerciseId===id);
  const e=(fromSession?sessionItem?.snapshot:null)||catalogExercise||sessionItem?.snapshot;
  if(!e){toast('Інструкція не додана.');return;}
  const video=safeURL(e.video);let embed='';
  if(video) {
    const url=new URL(video),videoId=['www.youtube.com','youtube.com','m.youtube.com'].includes(url.hostname)?url.searchParams.get('v'):url.hostname==='youtu.be'?url.pathname.slice(1):'';
    if(/^[\w-]{11}$/.test(videoId||''))embed=`<iframe title="Відео: ${esc(e.name)}" src="https://www.youtube-nocookie.com/embed/${videoId}" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  const favorite=!!S.exercisePreferences[id]?.favorite;
  openModal(`<header class="exercise-detail-heading"><div><span class="catalog-eyebrow">${e.personal?'Особиста вправа':'Каталог Global'}</span><h2 id="exercise-detail-title">${esc(e.name)}</h2><div class="exercise-detail-tags"><span>${esc(e.primary||'Тренування')}</span>${e.equipment?`<span>${esc(e.equipment)}</span>`:''}</div></div><button class="exercise-close" data-action="close" aria-label="Закрити деталі вправи">×</button></header><div class="exercise-detail-actions">${catalogExercise&&!e.archived?btn('＋ До тренування','catalog-add',`data-id="${esc(id)}"`,''):''}${catalogExercise?btn(favorite?'♥ В улюблених':'♡ До улюблених','favorite-exercise',`data-id="${esc(id)}" aria-pressed="${favorite}"`,'secondary'):''}</div><div class="detail-tabs" role="tablist" aria-label="Розділи вправи">${[['overview','Вправа'],...(catalogExercise&&!catalogExercise.personal?[['community','Спільнота']]:[])].map(([key,title],index)=>`<button type="button" role="tab" id="tab-${key}" aria-controls="panel-${key}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-action="detail-tab" data-panel="panel-${key}">${title}</button>`).join('')}</div><section role="tabpanel" id="panel-overview" aria-labelledby="tab-overview"><div class="exercise-detail-layout"><div class="exercise-detail-media">${exercisePhoto({...e,exerciseId:id},'large')}${video?`<details class="exercise-video"><summary>Відео виконання</summary>${embed}<a href="${esc(video)}" target="_blank" rel="noopener noreferrer">Відкрити відео</a></details>`:''}</div><div class="exercise-guide">${e.purpose?`<p class="exercise-purpose">${esc(e.purpose)}</p>`:''}${[['Налаштування',e.setup],['Початкове положення',e.position],['Техніка виконання',e.technique],['Дихання',e.breathing],['Типові помилки',e.mistakes],['Застереження',e.caution]].filter(([,text])=>text).map(([title,text],index)=>`<details class="exercise-guide-step" ${index<3?'open':''}><summary>${title}</summary><p>${esc(text)}</p></details>`).join('')||'<p class="muted">Опис техніки ще не доданий.</p>'}${e.secondary?`<p class="small muted">Допоміжні м’язи: ${esc(e.secondary)}</p>`:''}</div></div>${exerciseNotePanel({...e,exerciseId:id})}${exerciseResultsPanel(id)}${alternativePanel({...e,exerciseId:id})}${catalogExercise?`<details class="exercise-management"><summary>Керування вправою</summary><div class="actions">${catalogExercise.personal?btn('Редагувати','edit-personal-exercise',`data-id="${esc(id)}"`,'secondary')+btn('Видалити','delete-personal-exercise',`data-id="${esc(id)}"`,'ghost danger'):!catalogExercise.archived?btn('Створити мою копію','copy-global-exercise',`data-id="${esc(id)}"`,'secondary'):''}</div></details>`:''}</section>${catalogExercise&&!catalogExercise.personal?`<section role="tabpanel" id="panel-community" aria-labelledby="tab-community" hidden><section id="exercise-community" data-id="${esc(id)}" data-scope="exercises"><p class="community-loading muted">Завантаження відгуків…</p></section></section>`:''}`,'exercise-detail-title','exercise-detail-dialog');
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
  if (S.route === 'achievements') {
    const [settings,access]=await Promise.all([db.get('settings/site'),db.get(`userAccess/${S.user.uid}`).catch(()=>null)]);
    if(isCurrent())Object.assign(S,{settings:settings||S.settings,loaded:true,homeAccess:access?.homeWorkouts===true,customizationAccess:access?.profileCustomization===true});
    return;
  }
  // Nutrition does not consume training history, catalogs, or body measurements.
  if (S.route === 'nutrition') {
    const [access, settings] = await Promise.all([
      (navigator.onLine ? db.getLive(`userAccess/${S.user.uid}`) : db.get(`userAccess/${S.user.uid}`)).catch(error => {
        if (error.code === 'permission-denied' || !navigator.onLine) return null;
        throw error;
      }),
      db.get('settings/site'),
    ]);
    if (!isCurrent()) return;
    Object.assign(S, { homeAccess: access?.homeWorkouts === true, customizationAccess: access?.profileCustomization === true,
      nutritionAccess: access?.nutrition === true, settings: settings || S.settings, loaded: true });
    await loadNutrition({ accessLoaded: true });
    return;
  }
  S.measurementsError = '';
  S.manualSetsError = '';
  S.trainingExtrasError='';S.trainingProfilesError='';S.warmupTemplatesError='';
  const [programs, sessions, exercises, templates, settings, personalExercises, preferences, access, measurements, manualSets, exerciseNotes, profileRecords, profileSelection,streakSettings,warmupTemplates] = await Promise.all([
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
    db.list(privatePath('exerciseNotes')).catch(()=>[]),
    db.list(privatePath('trainingProfiles')).catch(error=>{S.trainingProfilesError=err(error);return null;}),
    db.get(privatePath('trainingProfileSettings/selection')).catch(()=>null),
    db.get(privatePath('trainingProfileSettings/streak')).catch(()=>null),
    db.list(privatePath('warmupTemplates')).catch(error=>{S.warmupTemplatesError=err(error);return [];}),
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
    trainingProfiles:profileRecords === null ? S.trainingProfiles : trainingProfiles(profileRecords),
    sharedStreak:streakSettings?.shared===true,warmupTemplates,
    trainingProfilesStoredIds:profileRecords?.map(profile=>profile.id) || [],
    trainingProfileLimit:trainingProfileLimit(access),
    homeAccess: access?.homeWorkouts === true,
    customizationAccess:access?.profileCustomization===true,
    nutritionAccess: access?.nutrition === true,
    programs,
    exercisePreferences: Object.fromEntries(preferences.map(({ id, ...data }) => [id, data])),
    sessions,
    measurements,
    manualSets,
    exerciseNotes:Object.fromEntries(exerciseNotes.map(note=>[note.id,note])),
    exercises: [...exercises.filter((e) => !demoExerciseIds.has(e.id)), ...personalExercises.map((e) => ({ ...e, id: "personal:" + e.id, personal: true }))],
    templates: templates.filter((t) => !demoTemplateIds.has(t.id)),
    settings: settings || S.settings,
    loaded: true,
  });
  S.activeTrainingProfileId=availableProfiles(S.trainingProfiles,S.trainingProfileLimit).some(profile=>profile.id === profileSelection?.activeId) ? profileSelection.activeId : defaultProfileId;
  Object.assign(S,normalizeProfileContexts(S.sessions,S.manualSets,S.trainingProfiles));
  if(['home','profile','session','statistics'].includes(S.route)) {
    try {
      const [goals,reflections,challenges,polls]=await Promise.all([db.weeklyGoals(),db.list(privatePath('workoutReflections')),db.syncChallenges(sessions),['home','profile'].includes(S.route)?db.meetingPolls():Promise.resolve([])]);
      if(isCurrent()) {S.weeklyGoals=goals;S.reflections=reflections;S.challenges=challenges;S.meetingPolls=polls;}
    } catch(error) {if(isCurrent())S.trainingExtrasError='Не вдалося завантажити цілі, самопочуття, виклики або опитування. Спробуй оновити сторінку.';}
  }
  if (S.route === 'nutrition' || (owner() && S.route === 'admin')) await loadNutrition();
  if (navigator.onLine && S.publicProfileReady) db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions()).catch((error) => console.warn('Статистика профілю:', error.code));
}
async function saveSession(s,{undoLabel=''}={}) {
  const beforeSession=S.sessions.find(session=>session.id===s.id),joinedTurns=s.invitationId&&turnValue?.joined?.includes(S.user.uid);
  const newWorking=beforeSession&&s.logs.length>beforeSession.logs.length?s.logs.slice(beforeSession.logs.length).filter(isWorkingSet).at(-1):null;
  const handoffToken=newWorking?workoutSetToken(s,newWorking):'';
  if(s.status==='active')s=gymTimerSession(s,gymPrefs());
  if(!S.sessions.some(value=>value.id===s.id)) {
    s.trainingProfileId=S.activeTrainingProfileId;
    if(s.status!=='active') {
      s.items=s.items.map(item=>({...item,machine:profileContext(S.activeTrainingProfileId)}));
      s.logs=s.logs.map(log=>({...log,machine:profileContext(S.activeTrainingProfileId)}));
    }
  }
  const wasActive = S.sessions.some((session)=>session.id === s.id && session.status === 'active');
  if (s.status === 'active' && !wasActive && !s.logs.length) {
    s=applyTrainingProfile(s,assertProfileAvailable(S.trainingProfiles,S.activeTrainingProfileId,S.trainingProfileLimit));
    s.executionMode = preferredExecutionMode(localStorage, S.user.uid, S.sessions) || s.executionMode;
  }
  if(s.status==='active')s=captureWorkoutPlan(s);
  s.updatedAt = Date.now();
  const completedLoads=wasActive && s.status === 'completed'?completedProfileLoads(s,S.trainingProfiles,S.trainingProfileLimit):[];
  const profileChanges=completedLoads.map(after=>({before:copy(S.trainingProfiles.find(profile=>profile.id===after.id)),after:copy(after)}));
  if (completedLoads.length) {
    await db.saveMany([[privatePath(`sessions/${s.id}`),stripId(s)],...completedLoads.map(profile=>[privatePath(`trainingProfiles/${profile.id}`),stripId(profile)])]);
    S.trainingProfiles=S.trainingProfiles.map(profile=>completedLoads.find(updated=>updated.id === profile.id)||profile);
    S.trainingProfilesStoredIds=[...new Set([...S.trainingProfilesStoredIds,...completedLoads.map(profile=>profile.id)])];
  } else await db.save(privatePath(`sessions/${s.id}`), stripId(s));
  if(undoLabel&&beforeSession)actionUndo.remember(S.user.uid,{before:beforeSession,after:s,label:undoLabel,profiles:profileChanges});else actionUndo.clear(S.user.uid);
  const i = S.sessions.findIndex((x) => x.id === s.id);
  if (i < 0) S.sessions.push(s);
  else S.sessions[i] = s;
  if (wasActive && s.status === 'completed' && S.route === 'session') {
    S.summaryId=s.id;
    if (currentPage === 'session') window.history.replaceState(null,'',new URL(`workout.html?summary=${encodeURIComponent(s.id)}`,appBase));
  }
  if (s.status === 'completed') try { clearSetDraft(localStorage,S.user.uid,s.id); } catch {}
  if (navigator.onLine && s.status === 'completed') db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions()).catch((error) => console.warn('Не вдалося оновити статистику профілю:', error.code));
  if (s.status === "completed" && s.programId === active()?.id && active()?.scheduleMode === "sequence") chosenDay = null;
  render();
  if(joinedTurns&&handoffToken)try{await db.updateWorkoutTurns(s.invitationId,'set',handoffToken);}catch{toast('Підхід збережено. Не вдалося передати чергу — перевір з’єднання.');}
  if(joinedTurns&&s.status==='completed')try{await db.updateWorkoutTurns(s.invitationId,'leave');}catch{}
}
async function editWeeklyGoal() {
  const week=weekStart(localDate()),goal=await db.getLive(privatePath(`weeklyGoals/${profileRecordId(S.activeTrainingProfileId,week)}`));
  openModal(ui`<div class="sectionhead"><h2 id="weekly-goal-title">Ціль на тиждень</h2>${btn(uiText('Закрити'),'close','','ghost')}</div><p class="muted">${week} — ${shiftDate(week,6)} · бачиш тільки ти</p><form id="weekly-goal-form" data-profile="${S.activeTrainingProfileId}"><label>Кількість тренувань<input name="target" type="number" min="1" max="14" step="1" required value="${goal?.target||3}"/></label><button class="btn" type="submit">Зберегти ціль</button><div class="form-error" role="alert"></div></form>`,'weekly-goal-title');
}
async function editWorkoutReflection(id) {
  const session=S.sessions.find(s=>s.id===id&&s.status==='completed');if(!session)throw Error('Обери завершене тренування.');
  const value=await db.getLive(privatePath(`workoutReflections/${id}`));
  openModal(`<div class="sectionhead"><h2 id="reflection-title">Самопочуття</h2>${btn('Закрити','close','','ghost')}</div><p class="muted">${esc(session.name)} · ${session.date} · бачиш тільки ти</p><form id="workout-reflection-form" data-id="${esc(id)}"><div class="formgrid"><label>Складність · 1–10<input type="number" name="difficulty" min="1" max="10" step="1" value="${value?.difficulty||5}" required/></label><label>Енергія · 1–5<input type="number" name="energy" min="1" max="5" step="1" value="${value?.energy||3}" required/></label></div><label>Нотатка<textarea name="note" rows="4" maxlength="1000" placeholder="Що було легко або складно?">${esc(value?.note||'')}</textarea></label><button class="btn" type="submit">Зберегти самопочуття</button>${value?btn('Видалити запис','delete-reflection',`data-id="${esc(id)}"`,'ghost danger'):''}<div class="form-error" role="alert"></div></form>`,'reflection-title');
}
async function newChallenge() {
  const relations=(await db.gymBros()).filter(r=>r.status==='accepted'),ids=[...new Set(relations.map(r=>r.members.find(id=>id!==S.user.uid)))];
  const friends=await Promise.all(ids.map(async id=>({id,person:await db.publicIdentity(id)})));
  if(!friends.length){openModal(`<h2>Спільний виклик</h2><p>Спочатку додай GymBro. Виклик можна створити після прийняття заявки в друзі.</p>${btn('Закрити','close')}`);return;}
  openModal(`<div class="sectionhead"><h2 id="challenge-title">Спільний виклик GymBro</h2>${btn('Закрити','close','','ghost')}</div><p class="muted">Кожен виконує свою ціль. GymBro має прийняти запрошення. Видно лише кількість тренувань.</p><form id="gym-challenge-form"><label>Назва<input name="title" maxlength="80" required value="Місяць тренувань разом"/></label><label>GymBro<select name="partnerId" required>${friends.map(f=>`<option value="${esc(f.id)}">${esc(f.person?.name||'GymBro')}</option>`).join('')}</select></label><label>Тренувань на кожного<input name="target" type="number" min="1" max="30" step="1" value="4" required/></label><div class="formgrid"><label>Початок<input name="startDate" type="date" min="${localDate()}" value="${localDate()}" required/></label><label>Завершення<input name="endDate" type="date" min="${localDate()}" value="${shiftDate(localDate(),30)}" required/></label></div><button class="btn" type="submit">Запросити GymBro</button><div class="form-error" role="alert"></div></form>`,'challenge-title');
}
async function refreshChallengeList() {S.challenges=await db.syncChallenges(S.sessions);await db.refreshAchievements();}
async function newMeetingPoll(partnerId='') {
  const relations=(await db.gymBros()).filter(relation=>relation.status==='accepted'),ids=[...new Set(relations.map(relation=>relation.members.find(id=>id!==S.user.uid)))];
  const friends=await Promise.all(ids.map(async id=>({id,person:await db.publicIdentity(id)})));
  if(!friends.length){openModal(`<h2>Опитування GymBro</h2><p>Спочатку додай GymBro та дочекайся прийняття заявки.</p>${btn('Закрити','close')}`);return;}
  openModal(`<div class="sectionhead"><h2 id="meeting-poll-title">Узгодити час із GymBro</h2>${btn('Закрити','close','','ghost')}</div><p class="muted">Час за Києвом. Вкажи 2–6 варіантів: твоєю початковою відповіддю будуть усі запропоновані години.</p><form id="meeting-poll-form"><label>Назва<input name="title" value="Коли тренуємося?" maxlength="100" required/></label><label>GymBro<select name="partnerId">${friends.map(friend=>`<option value="${esc(friend.id)}" ${friend.id===partnerId?'selected':''}>${esc(friend.person?.name||'GymBro')}</option>`).join('')}</select></label><div id="meeting-poll-slots">${[1,2].map(day=>pollSlotRow(shiftDate(localDate(),day)+'T18:00')).join('')}</div>${btn('Додати варіант','add-poll-slot','type="button"','ghost')}<p class="small muted">Після відповідей обох можна обрати остаточний час і надіслати запрошення на тренування.</p><button type="submit" class="btn">Створити опитування</button><div class="form-error" role="alert"></div></form>`,'meeting-poll-title');
}
function pollSlotRow(value='') {
  return `<div class="poll-slot-row"><label>Дата й час<input name="slot" type="datetime-local" value="${esc(value)}" required/></label>${btn('Прибрати','remove-poll-slot','type="button"','ghost')}</div>`;
}
async function refreshMeetingPolls() {S.meetingPolls=await db.meetingPolls();}
async function action(a, b) {
  const id = b.dataset.id,
    n = +b.dataset.n,
    j = +b.dataset.j;
  switch (a) {
    case 'undo-last-action':await undoLastAction();break;
    case 'warmup-templates':captureSetInputs();if(b.dataset.target==='builder')collectEditor();openWarmupLibrary(b.dataset.target,Number(b.dataset.day));break;
    case 'edit-warmup-template':{const template=S.warmupTemplates.find(item=>item.id===id);if(!template)throw Error('Шаблон не знайдено.');openWarmupLibrary(b.dataset.target,Number(b.dataset.day),template);break;}
    case 'delete-warmup-template': {
      const template=S.warmupTemplates.find(item=>item.id===id);if(!template)throw Error('Шаблон не знайдено.');
      if(!confirm('Видалити цей шаблон розминки?'))break;
      await db.remove(privatePath(`warmupTemplates/${id}`));S.warmupTemplates=S.warmupTemplates.filter(item=>item.id!==id);
      actionUndo.remember(S.user.uid,{before:template,type:'warmup',label:'Видалення шаблону розминки'});
      render();openWarmupLibrary(b.dataset.target,Number(b.dataset.day));break;
    }
    case 'apply-warmup-template': {
      const template=S.warmupTemplates.find(item=>item.id===id);if(!template)throw Error('Шаблон не знайдено.');
      if(b.dataset.target==='builder'){const day=Number(b.dataset.day);if(!editor?.days[day])throw Error('День програми недоступний.');editor.days[day].warmup=template.text;persistEditorDraft();render();}
      else if(b.dataset.target==='session')await saveSession(applyWarmupTemplate(ongoing(),template),{undoLabel:'Застосування розминки'});
      else throw Error('Обери тренування для розминки.');
      modal.close();toast('Розминку додано');break;
    }
    case 'defer-exercise':captureSetInputs();openModal(deferPicker(ongoing(),Number(b.dataset.index)),'defer-title');break;
    case 'confirm-defer':{const session=deferExercise(ongoing(),Number(b.dataset.index),Number(b.dataset.next));await saveSession(session,{undoLabel:'Відкладання вправи'});modal.close();toast(`Наступна вправа: ${session.items[session.index].name}`);break;}
    case 'resume-exercise':captureSetInputs();await saveSession(resumeExercise(ongoing(),Number(b.dataset.index)),{undoLabel:'Повернення вправи'});break;
    case 'skip-exercise':captureSetInputs();openModal(skipPicker(ongoing(),Number(b.dataset.index)),'skip-title');break;
    case 'gymbro-join':case 'gymbro-pass':case 'gymbro-leave': {
      const session=ongoing();if(!session?.invitationId)throw Error('Потрібне спільне тренування за запрошенням.');
      turnValue=await db.updateWorkoutTurns(session.invitationId,{'gymbro-join':'join','gymbro-pass':'pass','gymbro-leave':'leave'}[a]);updateTurnPanel();break;
    }
    case 'gymbro-retry':stopTurnWatch();syncTurnWatch();break;
    case 'gym-settings':captureSetInputs();openModal(gymSettings(gymPrefs(),!!navigator.wakeLock?.request),'gym-settings-title','gym-settings-dialog');break;
    case 'gym-toggle': {
      captureSetInputs();
      const prefs=saveGymPreferences(localStorage,S.user.uid,{...gymPrefs(),enabled:!gymPrefs().enabled});
      if(ongoing())await saveSession(gymTimerSession(ongoing(),prefs));else render();
      break;
    }
    case 'gym-reset': {
      saveGymPreferences(localStorage,S.user.uid,gymPreferences({enabled:gymPrefs().enabled,keepAwake:gymPrefs().keepAwake}));
      render();openModal(gymSettings(gymPrefs(),!!navigator.wakeLock?.request),'gym-settings-title','gym-settings-dialog');break;
    }
    case 'edit-profile-music':navigate('settings','?section=user&focus=music');break;
    case 'clear-playlist':{const form=b.closest('form'),index=Number(b.dataset.index);form.elements[`playlist-title-${index}`].value='';form.elements[`playlist-url-${index}`].value='';break;}
    case 'profile-music-player': {
      const card=b.closest('.profile-playlist'),slot=card?.querySelector('.playlist-player-slot');
      if(!slot)break;
      const expanded=b.getAttribute('aria-expanded')==='true';
      slot.innerHTML=expanded?'':playlistPlayer(card.dataset.service,card.dataset.url);
      b.setAttribute('aria-expanded',String(!expanded));b.textContent=uiText(expanded?'Слухати тут':'Сховати плеєр');break;
    }
    case 'support-new':openSupportComposer(b.dataset.category);break;
    case 'support-inbox':await openSupportInbox();break;
    case 'support-thread':await openSupportThread(id);break;
    case 'support-status':await db.setSupportStatus(id,b.dataset.status);toast(uiText('Статус звернення оновлено'));break;
    case 'about-gymb':openModal(ui`<div class="sectionhead"><h2>Nexus GymB</h2>${btn(uiText('Закрити'),'close','','ghost')}</div><p>Твій простір для програм, щоденника тренувань і особистого прогресу.</p><p>Є питання чи ідея? Напиши команді через приватне листування.</p>${btn(uiText('Написати команді'),'support-new','','secondary')}`);break;
    case 'preview-time-workout':previewTimeWorkout(b.dataset.program,Number(b.dataset.day),Number(b.dataset.minutes));break;
    case 'start-time-workout': {
      if(ongoing())throw Error(uiText('Спочатку заверши поточне тренування.'));
      const {program,plan}=timeBudgetPlan(b.dataset.program,Number(b.dataset.day),Number(b.dataset.minutes));
      const session=newSession(program,plan.day);session.id=crypto.randomUUID();
      session.timeBudgetMinutes=plan.minutes;session.estimatedMinutes=plan.estimatedMinutes;session.originalExerciseCount=plan.originalExercises;
      await saveSession(session);modal.close();S.route='session';render();break;
    }
    case 'set-tracking-mode': {
      const current=ongoing();if(!current||!['planned','free'].includes(b.dataset.mode))throw Error(uiText('Тренування не знайдено.'));
      captureSetInputs();const session=copy(current);session.setTrackingMode=b.dataset.mode;
      if(session.setTrackingMode==='free'&&session.executionMode==='simple')session.executionMode='advanced';
      if(session.setTrackingMode==='free'&&session.executionMode==='mixed')session.detailedIndex=[session.index];
      await saveSession(session);break;
    }
    case 'publish-monthly-summary': {
      if(!navigator.onLine)throw Error(uiText('Для публікації підсумку потрібен інтернет.'));
      if(b.dataset.profile!==S.activeTrainingProfileId||S.people?.uid!==S.user.uid)throw Error(uiText('Онови підсумок для поточного профілю.'));
      const summary=monthlySummary(profileSessions(),profileManualSets(),b.dataset.month,currentProfile());
      if(!summary.hasActivity)throw Error(uiText('За цей місяць ще немає результатів.'));
      const path=`publicProfiles/${S.user.uid}/monthlySummaries/featured`;
      await db.save(path,monthlySnapshot(summary));const stored=await db.getLive(path);
      if(!stored)throw Error(uiText('Не вдалося зберегти підсумок. Спробуй ще раз.'));
      S.people.monthlySummary=stored;render();toast(uiText('Підсумок місяця додано у профіль'));break;
    }
    case 'unpublish-monthly-summary': {
      if(!navigator.onLine)throw Error(uiText('Підключися до інтернету, щоб прибрати підсумок.'));
      if(S.people?.uid!==S.user.uid)throw Error(uiText('Можна змінювати лише свій профіль.'));
      const path=`publicProfiles/${S.user.uid}/monthlySummaries/featured`;
      await db.remove(path);const remaining=await db.getLive(path);
      if(remaining)throw Error(uiText('Не вдалося прибрати підсумок. Спробуй ще раз.'));
      S.people.monthlySummary=null;render();toast(uiText('Підсумок прибрано з профілю'));break;
    }
    case 'toggle-auth-password': {
      const input=b.closest('label').querySelector('input'),visible=input.type==='password';input.type=visible?'text':'password';b.setAttribute('aria-label',authText(visible?'hide':'show'));b.setAttribute('aria-pressed',String(visible));break;
    }
    case 'exercise-note':captureSetInputs();await editExerciseNote(b);break;
    case 'result-card':await openResultCard(id);break;
    case 'download-result': {
      if(!resultCardPages.length)throw Error('Спершу відкрий картку результатів.');
      const {resultPNG,resultPDF,downloadResult}=await import('./result-card.js');
      const format=b.dataset.format==='pdf'?'pdf':'png';
      downloadResult(format==='pdf'?resultPDF(resultCardPages):await resultPNG(resultCardPages),`GymB-${b.dataset.date}.${format}`);break;
    }
    case 'rep-record-count':S.recordReps=Number(b.dataset.count);render();break;
    case 'activity-filter':if(['all','main','home'].includes(id)){S.activityFilter=id;render();}break;
    case 'activity-day':
      S.calendarDate=id;S.calendarMonth=id.slice(0,7);S.activityYear=Number(id.slice(0,4));
      if(S.route!=='home'){navigate('home',`?date=${encodeURIComponent(id)}`);break;}
      updateUnifiedCalendar();document.getElementById('calendar-day-details')?.scrollIntoView({block:'nearest'});break;
    case 'new-meeting-poll':await newMeetingPoll(id||'');break;
    case 'refresh-meeting-polls':await refreshMeetingPolls();render();toast('Опитування оновлено');break;
    case 'add-poll-slot': {
      const list=modal.querySelector('#meeting-poll-slots');if(list.children.length>=6)throw Error('Можна додати до 6 варіантів.');list.insertAdjacentHTML('beforeend',pollSlotRow());break;
    }
    case 'remove-poll-slot':
      if(modal.querySelector('#meeting-poll-slots').children.length<=2)throw Error('Залиш щонайменше два варіанти.');b.closest('.poll-slot-row').remove();break;
    case 'close-meeting-poll':await db.closeMeetingPoll(id,Number(b.dataset.index));await refreshMeetingPolls();render();toast('Підсумковий час обрано');break;
    case 'cancel-meeting-poll':await db.cancelMeetingPoll(id);await refreshMeetingPolls();render();toast('Опитування скасовано');break;
    case 'poll-training-invite': {
      const poll=S.meetingPolls.find(value=>value.id===id);if(!poll||poll.status!=='closed')throw Error('Опитування недоступне.');
      inviteWorkoutDialog(poll.partnerId,poll.options[poll.selectedIndex],poll.id);break;
    }

    case 'weekly-goal':await editWeeklyGoal();break;
    case 'workout-reflection':await editWorkoutReflection(id);break;
    case 'delete-reflection':
      await db.remove(privatePath(`workoutReflections/${id}`));S.reflections=S.reflections.filter(r=>r.id!==id);modal.close();render();toast('Запис видалено');break;
    case 'new-challenge':await newChallenge();break;
    case 'refresh-challenges':await refreshChallengeList();render();toast('Прогрес викликів оновлено');break;
    case 'respond-challenge':await db.respondChallenge(id,b.dataset.status);await refreshChallengeList();render();toast('Виклик оновлено');break;
    case 'compare-workout': {
      const session=profileSessions().find(s=>s.id===id&&s.status==='completed');if(!session)throw Error('Тренування недоступне.');
      openModal(`<div class="sectionhead"><h2>Порівняння результатів</h2>${btn('Закрити','close','','ghost')}</div>${comparisonCard(session,profileSessions(),S.comparisonIds[id]||'')}`);break;
    }
    case 'edit-profile-blocks':openModal(layoutEditor(await db.getLive(`publicProfiles/${S.user.uid}/layout/display`)),'profile-layout-title');break;
    case 'move-profile-block': {
      const row=b.closest('[data-layout-key]'),list=row.parentElement,direction=Number(b.dataset.direction);
      if(direction<0&&row.previousElementSibling)list.insertBefore(row,row.previousElementSibling);
      if(direction>0&&row.nextElementSibling)list.insertBefore(row.nextElementSibling,row);
      [...list.children].forEach((item,index)=>{item.querySelector('[data-direction="-1"]').disabled=index===0;item.querySelector('[data-direction="1"]').disabled=index===list.children.length-1;});break;
    }
    case 'reset-profile-blocks':openModal(layoutEditor(null),'profile-layout-title');break;
    case 'read-medal-events':
      await db.readAchievementEvents(S.achievementEvents.filter(e=>!e.read).map(e=>e.id));S.achievementEvents.forEach(e=>e.read=true);updateNoticeBadge();render();break;
    case 'open-medal-notice':
      await db.readAchievementEvents([id]);location.assign(new URL('achievements.html#achievement-history',appBase).href);break;

    case 'edit-exercise-result':editExerciseResult(id,b.dataset.session,Number(b.dataset.log));break;
    case 'admin-load-awards':await loadAdminAwards(b.dataset.uid);break;
    case 'admin-revoke-achievement': {
      if(!owner())throw Error('Немає доступу.');
      const data=await db.adminAchievementAwards(b.dataset.uid,'revoke',id);
      await loadAdminAwards(b.dataset.uid,data);toast('Ручну видачу відкликано');break;
    }
    case 'toggle-achievement': {
      const state=S.achievements,selected=state.display.selectedIds||[];
      if(!state.progress?.earnedIds.includes(id))throw Error('Цю медаль ще не отримано.');
      state.display.selectedIds=achievementSelection(selected.includes(id)?selected.filter(value=>value!==id):[...selected,id],state.progress.earnedIds);
      state.dirty=true;render();break;
    }
    case 'save-achievement-display': {
      const state=S.achievements;
      if(!state.progress)throw Error('Спочатку синхронізуй досягнення.');
      const selectedIds=achievementSelection(state.display.selectedIds,state.progress.earnedIds);
      await db.saveAchievementDisplay(selectedIds,state.display.rankingEnabled);
      state.dirty=false;render();toast('Вітрину збережено. Профіль і рейтинг оновлюються.');break;
    }
    case 'achievement-motion': {
      S.achievements.motionPaused=!S.achievements.motionPaused;
      try { localStorage.setItem('nexus:achievements-motion',S.achievements.motionPaused?'paused':'running'); } catch {}
      const page=document.querySelector('.achievements-page');
      if(page)page.dataset.motion=S.achievements.motionPaused?'paused':'running';
      b.setAttribute('aria-pressed',String(S.achievements.motionPaused));
      b.querySelector('path').setAttribute('d',S.achievements.motionPaused?'M6 4 15 10 6 16Z':'M7 5v10m6-10v10');
      b.querySelector('span').textContent=S.achievements.motionPaused?'Відновити анімацію':'Зупинити анімацію';
      break;
    }
    case 'achievement-refresh':await loadAchievements({force:true});break;
    case 'achievement-leaderboard-refresh':
      try{S.achievements.leaders=await db.achievementLeaderboard(true);S.achievements.leaderError='';}
      catch{S.achievements.leaderError='Не вдалося оновити рейтинг. Спробуй ще раз.';}render();break;
    case 'achievement-info': {
      const medal=achievementCatalog.find(medal=>medal.id===id);if(!medal)break;
      openModal(`<div class="achievement-info">${medalIcon(medal)}<span class="achievement-kicker">GymB ACHIEVEMENT</span><h2>${esc(medal.name)}</h2><p>${esc(medal.description)}</p><strong>${medal.points} балів</strong><div class="actions">${btn('Закрити','close','','secondary')}</div></div>`);break;
    }
    case 'export-catalog-json': downloadCatalogJson(); break;
    case 'open-catalog-json': catalogJsonDraft=null; openCatalogJson(id || ''); break;
    case 'back-catalog-json':
      if (!owner() || !catalogJsonDraft) throw Error('Спочатку перевір JSON.');
      if (catalogJsonDraft.saved) throw Error('Частину змін уже збережено. Заверши поточне збереження.');
      openCatalogJson(catalogJsonDraft.targetId,catalogJsonDraft.text); break;
    case 'save-catalog-json': {
      if (!owner() || !catalogJsonDraft) throw Error('Спочатку перевір JSON.');
      const draft=catalogJsonDraft, changes=draft.plan.filter(entry=>entry.action!=='unchanged');
      if (!changes.length) throw Error('Немає змін для збереження.');
      try {
        for (let offset=draft.saved; offset<changes.length; offset+=100) {
          await db.saveMany(changes.slice(offset,offset+100).map(entry=>[`exercises/${entry.id}`,{...entry.data,updatedAt:Date.now()}]));
          draft.saved=Math.min(offset+100,changes.length);
          const status=document.querySelector('#catalog-json-save-status');if(status)status.textContent=`Збережено ${draft.saved} із ${changes.length}.`;
        }
        await refresh();catalogJsonDraft=null;modal.close();render();toast('Каталог оновлено з JSON');
      } catch (error) {
        throw Error(`Збережено ${draft.saved} із ${changes.length}. ${err(error)} Натисни «Зберегти зміни», щоб повторити решту.`);
      }
      break;
    }

    case 'catalog-add': addExercisePicker(id); break;
    case 'exercise-progress': exerciseProgress(id); break;
    case 'plate-calculator': openPlateCalculator();break;
    case 'add-plate-row': {
      const rows=modal.querySelector('#plate-inventory-rows');if(!rows || rows.children.length>=12)throw Error('До 12 розмірів дисків.');
      const next=Math.max(-1,...[...rows.children].map(row=>Number(row.dataset.plateRow)))+1;
      rows.insertAdjacentHTML('beforeend',plateInventoryRow({weight:1,pairs:1},next));clearPlateCalculation();break;
    }
    case 'remove-plate-row': b.closest('[data-plate-row]')?.remove();clearPlateCalculation();break;
    case 'apply-plate-result': {
      const session=ongoing(),form=document.querySelector('#set-form'),target=plateCalculationTarget;
      if(!plateCalculation || !target || !form || !session || session.id !== target.sessionId || session.index !== target.index || session.logs.length !== target.logs || !sameWeightDetails(readWeightDetails(new FormData(form)),target.details))throw Error('Підхід змінився. Відкрий калькулятор знову.');
      form.elements.weight.value=target.details.weightBasis === 'perSide'?plateCalculation.perSideWeight:plateCalculation.total;
      captureSetInputs();modal.close();toast('Вагу підставлено. Збережи підхід після виконання.');break;
    }
    case 'training-profiles': trainingProfilesDialog();break;
    case 'new-training-profile': trainingProfileForm();break;
    case 'rename-training-profile': trainingProfileForm(id);break;
    case 'select-training-profile': await selectTrainingProfile(id);modal.close();break;
    case 'edit-manual-set': editManualSet(id); break;
    case 'add-drop-set': openDropSet(Number(b.dataset.log)); break;
    case 'apply-weight-suggestion': {
      const session=ongoing(), item=session?.items[session.index], form=document.querySelector('#set-form');
      if (!item || !form || workingSetCount(session) >= item.sets) throw Error('Обери незавершений підхід.');
      const suggestion=nextWeightSuggestion(S.sessions,{...item,...readWeightDetails(new FormData(form))},{currentId:session.id,beforeDate:session.date});
      const weight=suggestion.weights[workingSetCount(session)];
      if (weight === undefined) throw Error(suggestion.reason);
      form.elements.weight.value=weight;captureSetInputs();toast('Вагу підставлено. Збережи підхід після виконання.');break;
    }
    case 'workout-load': captureSetInputs(); workoutLoadEditor(Number(b.dataset.index)); break;
    case 'quick-result': {
      const session = ongoing(), index = +b.dataset.index;
      const log = session?.logs.find(l => l.index === index && l.quickResult);
      openModal(`<h2>Найкращий результат · ${esc(session.items[index].name)}</h2><p class="muted">Один необов’язковий запис за вправу. Повторне збереження оновить його.</p><form id="quick-result-form" data-index="${index}"><div class="formgrid">${field('Вага: кг або плитки','weight',log?.weightText || log?.weight || '', 'text','required maxlength="30" placeholder="60, 6x10 або 6x?"')}${field('Повторення','reps',log ? repsLabel(log) : '', 'text','required maxlength="12" placeholder="10-12"')}</div>${weightDetailsFields(log || session.items[index])}<p class="small muted">6x10 = 6 плиток по 10 кг. 6x? = 6 плиток невідомої ваги; збережеться без перерахунку в кг.</p><button class="btn" type="submit">Зберегти результат</button><div class="form-error" role="alert"></div></form>`);
      break;
    }
    case 'reset-exercise': {
      const current=ongoing(), index=Number(b.dataset.index);
      if(current.logs.some(log=>log.index===index) && !confirm('Скасувати виконання цієї вправи та прибрати її записані результати?')) break;
      clearSetDraft(localStorage,S.user.uid,current.id);
      await saveSession(resetExercise(current,index),{undoLabel:'Скасування виконання'});toast('Позначку виконання скасовано');break;
    }
    case 'remove-workout-log': {
      const current=ongoing(), position=Number(b.dataset.log);
      if(current.logs.some(log=>log.dropOf===position) && !confirm('Скасувати підхід разом із його дропами?')) break;
      clearSetDraft(localStorage,S.user.uid,current.id);
      await saveSession(removeWorkoutLog(current,position),{undoLabel:'Видалення підходу'});toast('Запис скасовано');break;
    }
    case 'simple-done': await saveSession(simpleDone(ongoing(), +b.dataset.index),{undoLabel:'Позначка виконання'}); break;
    case 'finish-checklist': {
      const current = ongoing(), result = finishChecklist(current);
      if (result.skipped.length && !confirm('Є непозначені вправи. Завершити тренування та залишити їх пропущеними?')) return;
      await saveSession(result,{undoLabel:'Завершення тренування'}); break;
    }
    case 'workout-list': {
      const s = copy(ongoing()); s.detailedIndex = []; await saveSession(s); break;
    }
    case 'workout-detail': {
      const current=ongoing(),index=Number(b.dataset.index),s=current.deferred?.includes(index)?resumeExercise(current,index):copy(current);s.index=index;s.detailedIndex=[index];await saveSession(s);break;
    }
    case 'replace-exercise': {
      const exercise=S.exercises.find(e=>e.id===id&&!e.archived);
      const session=replaceForToday(ongoing(),Number(b.dataset.index),exercise,modal.querySelector('#replacement-reason')?.value||'busy');
      clearSetDraft(localStorage,S.user.uid,session.id);
      await saveSession(session,{undoLabel:'Заміна вправи'});modal.close();toast('Вправу замінено лише на сьогодні');break;
    }
    case 'restore-today-exercise': {
      const session=restoreForToday(ongoing(),Number(b.dataset.index));clearSetDraft(localStorage,S.user.uid,session.id);
      await saveSession(session,{undoLabel:'Повернення початкової вправи'});toast('Початкову вправу повернуто');break;
    }
    case 'choose-planned-exercise': {
      const current=ongoing(),index=Number(b.dataset.index);
      const original=current?.replacements?.[index]?.original||current?.items[index];
      if(!original?.alternativeExercise) throw Error('Варіанти вправи не знайдено.');
      let session;
      if(b.dataset.choice==='original') session=restoreForToday(current,index);
      else session=replaceForToday(current,index,original.alternativeExercise,'variation');
      const profile=profileForContext(session.items[index].machine,S.trainingProfiles);
      if(profile) {
        const load=applyTrainingProfile({...session,items:[session.items[index]],logs:[],simpleCompleted:[]},profile);
        session.items[index]=load.items[0];
      }
      clearSetDraft(localStorage,S.user.uid,session.id);
      await saveSession(session,{undoLabel:'Вибір вправи'});toast('Вправу обрано на сьогодні');break;
    }
    case 'workout-alternatives': {
      const s = ongoing(), index = +b.dataset.index;
      openModal(`<h2>Заміна · ${esc(s.items[index].name)}</h2>${workoutReplacementPicker(s.items[index], index)}`); break;
    }

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
        if(navigator.onLine)await db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions());
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
        modal.close(); render(); toast('Користувача заблоковано');
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
      if (!['user','appearance','privacy','security'].includes(b.dataset.section)) break;
      if (b.dataset.section === 'appearance' && !owner() && !S.customizationAccess) break;
      S.settingsSection = b.dataset.section;
      { const url=new URL(location.href);url.searchParams.set('section',S.settingsSection);url.searchParams.delete('focus');window.history.replaceState(null,'',url); }
      render();
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
    case 'older-notices': {
      const uid=S.user.uid,rows=await db.olderNotifications(S.noticeOldestId),enriched=await noticeActors(rows);
      if(S.user?.uid!==uid)break;
      S.noticeHasMore=rows.length===50;if(rows.length)S.noticeOldestId=rows.at(-1).id;
      S.noticeOlder=[...S.noticeOlder,...enriched];
      S.notices=[...new Map([...S.notices,...enriched].map(row=>[row.id,row])).values()];noticeInbox();break;
    }
    case 'read-all-notices':
      await Promise.all([db.readNotifications(S.notices.filter((n)=>!n.read).map((n)=>n.id)),db.readAchievementEvents(S.achievementEvents.filter(event=>!event.read).map(event=>event.id))]);
      S.achievementEvents.forEach(event=>{event.read=true;});
      S.notices.forEach((n)=>{ n.read = true; });S.noticeOlder.forEach(n=>{n.read=true;}); updateNoticeBadge(); noticeInbox();
      break;
    case 'open-notice': {
      const notice = S.notices.find((n)=>n.id === id);
      if (!notice) break;
      if (!notice.read){await db.readNotifications([id]);notice.read=true;const older=S.noticeOlder.find(n=>n.id===id);if(older)older.read=true;updateNoticeBadge();}
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
    case 'remove-avatar':
      await db.changeAvatar('');
      S.profile.photo='';S.selfPublic.photo='';if(S.people?.uid===S.user.uid)S.people.person.photo='';
      render();toast('Аватар прибрано');break;
    case 'remove-banner':
      await db.patch(`publicProfiles/${S.user.uid}`, { banner: '' });
      S.selfPublic.banner = ''; S.people.person.banner = ''; render(); toast('Банер прибрано');
      break;
    case 'appearance-preset': {
      const form=b.closest('form'), preset=appearancePresets.find(preset=>preset.id===id);
      if (!form || !preset) break;
      fillAppearanceForm(form,preset.values);b.setAttribute('aria-pressed','true');updateAppearancePreview(form);
      break;
    }
    case 'appearance-revert': {
      const form=b.closest('form');if(!form)break;
      fillAppearanceForm(form,S.selfPublic?.appearance || {});updateAppearancePreview(form,false);
      form.querySelector('.form-error').textContent='';
      break;
    }
    case 'appearance-readable': {
      const form=b.closest('form');if(!form)break;
      form.elements.text.value=readableText(form.elements.blocks.value);
      form.elements.buttonText.value=readableText(form.elements.accent.value);
      updateAppearancePreview(form);
      break;
    }
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
      await saveSession({ ...copy(session), warmupDone: true, warmupSkipped: a === 'warmup-skip' },{undoLabel:'Завершення розминки'});
      break;
    }
    case 'adjust-set': {
      const form = document.querySelector('#set-form'), name = b.dataset.field;
      if (!form || !['weight','reps'].includes(name)) return;
      const input = form.elements[name], delta = Number(b.dataset.delta);
      if (!Number.isFinite(delta)) return;
      const text = input.value.trim().replace(',', '.'), tiles = /^(\d+)\s*[xх×]\s*(\d+(?:\.\d+)?|\?)$/i.exec(text);
      if (name === 'weight' && tiles) {
        const value = `${Math.max(1,Math.min(1000,Number(tiles[1])+Math.sign(delta)))}x${tiles[2]}`;
        parseWeight(value); input.value = value;
      } else if (name === 'reps') {
        const parsed = parseReps(text);
        const shift = Math.max(-parsed.reps, Math.min(delta, 1000 - parsed.repsMax));
        input.value = repsLabel({ reps: parsed.reps + shift, repsMax: parsed.repsMax + shift });
      } else {
        const value = Number(text);
        if (!Number.isFinite(value)) { input.focus(); return; }
        input.value = String(Math.max(0,Math.min(1000,Math.round((value+delta)*100)/100)));
      }
      captureSetInputs();
      break;
    }
    case 'use-previous-set': {
      const session = ongoing(), item = session?.items[session.index];
      const inputForm=document.querySelector('#set-form');
      const previous = item && previousWorkingSet(S.sessions, {...item,...readWeightDetails(new FormData(inputForm))}, session.id, workingSetCount(session));
      if (!previous) throw Error('Попереднього робочого підходу немає.');
      const form = document.querySelector('#set-form');
      form.elements.reps.value = repsLabel(previous);
      form.elements.weight.value = previous.weightText || previous.weight;
      (item.metrics || []).forEach((metric, index) => {
        const value = previous.metrics?.find((m) => m.name === metric.name && m.unit === metric.unit);
        if (value) form.elements[`actual-metric-${index}`].value = value.value;
      });
      captureSetInputs();
      break;
    }
    case 'finish-early': {
      const session = ongoing();
      if (!session) throw Error('Немає активного тренування.');
      captureSetInputs();
      openModal(`<div class="sectionhead"><h2 id="finish-workout-title">Завершити тренування?</h2>${btn('Продовжити','close','','ghost')}</div><p class="muted">${esc(session.name)} · ${session.logs.filter(log=>isWorkingSet(log)).length} записаних підходів</p><div class="workout-finish-options"><section><h3>Зберегти виконане</h3><p>Завершити достроково та додати результат до історії й статистики профілю. Після цього дані можна виправити.</p>${btn('Завершити й зберегти','finish-early-save',`data-id="${esc(session.id)}"`,'wide')}</section><section><h3>Без запису в профіль</h3><p>Прибрати це тренування разом із його підходами. Воно не потрапить в історію, рекорди чи статистику. Останню дію можна буде скасувати.</p>${btn('Завершити без збереження','discard-workout',`data-id="${esc(session.id)}"`,'danger wide')}</section></div>`,'finish-workout-title','workout-finish-dialog');
      break;
    }
    case 'finish-early-save': {
      const session = ongoing();
      if (!session || session.id !== id) throw Error('Активне тренування змінилося. Відкрий його знову.');
      await saveSession(finishEarly(session),{undoLabel:'Завершення тренування'});
      modal.close();
      toast('Тренування завершено. Виконані підходи збережено.');
      break;
    }
    case 'discard-workout': {
      const session = ongoing();
      if (!session || session.id !== id) throw Error('Активне тренування змінилося. Відкрий його знову.');
      await db.remove(privatePath(`sessions/${id}`));
      actionUndo.remember(S.user.uid,{before:session,label:'Видалення тренування'});
      S.sessions = S.sessions.filter(entry=>entry.id !== id);
      try { clearSetDraft(localStorage,S.user.uid,id); } catch {}
      S.summaryId = '';
      S.workoutDiscarded = true;
      if (currentPage === 'session') window.history.replaceState(null,'',new URL('workout.html',appBase));
      modal.close();
      render();
      toast('Тренування завершено без збереження');
      break;
    }
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
      if(S.people?.uid!==S.user.uid||S.route!=='statistics')throw Error('Можна змінювати лише свої рекорди.');
      const result=await db.setRecordVisibility(b.dataset.key,b.dataset.visible==='true',profileSessions(),profileManualSets());
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
      if (!navigator.onLine) throw Error(uiText("Для створення посилання потрібен інтернет."));
      const program = S.programs.find((p) => p.id === id);
      requireHomeAccess(program);
      const snapshot = shareableProgram(program);
      const mappingPath = privatePath(ui`programShares/${id}`);
      const mapping = await db.get(mappingPath);
      const previous = shareToken(mapping?.token);
      const token = previous && await db.getLive(ui`sharedPrograms/${previous}`) ? previous : crypto.randomUUID();
      await db.saveMany([[ui`sharedPrograms/${token}`, { senderId: S.user.uid, program: snapshot }], [mappingPath, { token }]]);
      sharingDialog(token);
      break;
    }
    case "copy-share-link": {
      const input = document.querySelector("#program-share-link");
      try {
        await navigator.clipboard.writeText(input.value);
        toast(uiText("Посилання скопійовано"));
      } catch {
        input.focus(); input.select(); toast(uiText("Посилання виділено — скопіюй його."));
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
    case 'toggle-training-profiles-access':
    case 'toggle-customization-access':
    case 'toggle-nutrition-access':
    case 'toggle-home-access': {
      if (!owner() || !S.adminUsers.some(u => u.id === id)) throw Error('Немає доступу');
      const key = a === 'toggle-training-profiles-access' ? 'extraTrainingProfiles' : a === 'toggle-home-access' ? 'homeWorkouts' : a==='toggle-customization-access'?'profileCustomization':'nutrition';
      const data = await db.toggleAccess(id,key);
      S.adminAccess[id] = data;
      if (id === S.user.uid) { S.homeAccess = data.homeWorkouts; S.nutritionAccess = data.nutrition;S.customizationAccess=data.profileCustomization;S.trainingProfileLimit=trainingProfileLimit(data); }
      document.querySelector('#admin-users-list').innerHTML = adminUsersList(document.querySelector('#admin-user-search').value);
      const control = modal.querySelector('.admin-access-controls');
      if (control) control.outerHTML = homeAccessControl(id);
      toast(data[key] ? 'Доступ надано' : 'Доступ відкликано');
      break;
    }
    case 'admin-member-panel':
      modal.querySelectorAll('[data-member-panel]').forEach((panel) => { panel.hidden = panel.dataset.memberPanel !== b.dataset.panel; });
      modal.querySelectorAll('[data-action="admin-member-panel"]').forEach((button) => button.setAttribute('aria-pressed', String(button === b)));
      if(b.dataset.panel==='awards')await loadAdminAwards(modal.querySelector('[data-admin-awards]').dataset.uid);
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
      if(b.dataset.panel==='panel-community') {
        const box=modal.querySelector('#exercise-community');
        if(box&&!['loading','loaded'].includes(box.dataset.loadState))void loadCommunity(box.dataset.id);
      }
      break;
    }
    case "auth-mode":
      if (!["login", "register"].includes(id) || authMode === id) break;
      authMode = id;
      authNotice = "";
      login({animate:true});
      document.querySelector(".auth-panel h1")?.focus({preventScroll:true});
      break;
    case "reset-password": {
      const form = document.querySelector("#auth-form");
      const email = form.elements.email;
      email.value = email.value.trim();
      if (!email.reportValidity()) {
        email.focus();
        return;
      }
      if (!db) throw authFailure('connecting');
      const address = email.value;
      form.querySelector(".form-error").textContent = "";
      await db.resetPassword(address);
      openModal(`
        <h2 id="reset-email-title">${authText("resetTitle")}</h2>
        <p>${authText("resetBefore")} <b>${esc(address)}</b> ${authText("resetAfter")}</p>
        <p class="muted small">${authText("resetHint")}</p>
        ${btn(authText("gotIt"), "close", 'type="button" autofocus')}
      `, "reset-email-title");
      break;
    }
    case "resend-email":
      await db.sendVerification();
      authNotice = "sent";
      login();
      break;
    case "check-email": {
      const user = await db.checkVerification();
      if (!user?.emailVerified) throw authFailure('notVerified');
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
      S.calendarMonth = localDate().slice(0, 7); S.calendarDate = localDate();S.activityYear=Number(localDate().slice(0,4));render();
      break;
    case "calendar-date":
      S.calendarDate = id;S.calendarMonth=id.slice(0,7); render();
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
      if (!s || s.status !== 'completed') throw Error('Тренування не знайдено.');
      openModal(workoutDetails(s), 'workout-details-title', 'workout-details-dialog');
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
      if (!s) throw Error(uiText("Заплановане тренування не знайдено."));
      openModal(ui`<h2>Перенести тренування</h2><p>${esc(s.name)}</p><form id="reschedule-form" data-id="${esc(id)}">${field(uiText("Нова дата"), "date", s.date >= localDate() ? s.date : localDate(), "date", ui`required min="${localDate()}"`)}<div class="actions"><button type="submit" class="btn">Зберегти дату</button>${btn(uiText("Скасувати"), "close", 'type="button"', "ghost")}</div><div class="form-error" role="alert"></div></form>`);
      break;
    }
    case "edit-planned":
      navigate("editor", `?planned=1&id=${encodeURIComponent(id)}`);
      break;
    case "delete-planned": {
      const session=S.sessions.find((s) => s.id === id && s.status === "planned");
      if (!session) throw Error(uiText("Тренування не знайдено."));
      if (!confirm(uiText("Скасувати заплановане тренування?"))) break;
      await db.remove(privatePath(ui`sessions/${id}`));
      actionUndo.remember(S.user.uid,{before:session,label:'Скасування запланованого тренування'});
      S.sessions = S.sessions.filter((s) => s.id !== id);
      render();
      toast(uiText("Заплановане тренування скасовано"));
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
      b.textContent = favorite ? "♥ В улюблених" : "♡ До улюблених";
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
      if (key === "plans" && !selected.includes(key)) {
        item.setPlans = Array.from({length:item.sets},(_,k)=>({...setPlan(item,k)}));
        item.builderFeatures = [...new Set([...item.builderFeatures,"sets"])];
      }
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
      {
        const items=editor.days[n].items, group=items[j].superset;
        items.splice(j,1);
        if (group) for (const item of items) if (item.superset === group) delete item.superset;
      }
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
      toast(uiText("Програму скопійовано"));
      break;
    }
    case "activate":
      if (!S.programs.some((p) => p.id === id && p.scope !== "home")) break;
      await db.patch(`users/${S.user.uid}`, { activeProgramId: id });
      S.profile.activeProgramId = id;
      render();
      break;
    case "delete-program":
      if (confirm(uiText("Видалити програму? Історія тренувань залишиться."))) {
        await db.remove(privatePath(ui`programs/${id}`));
        await refresh();
        render();
      }
      break;
    case "choose-program-day": {
      const program = S.programs.find((p) => p.id === id);
      if (!program) throw Error(uiText("Програму не знайдено."));
      requireHomeAccess(program);
      openModal(ui`<h2>${esc(program.name)}</h2><p>Обери день програми, який хочеш виконати зараз. Можна тренуватися незалежно від дня тижня.</p>${program.days.map((d) => ui`<section class="exercise-row"><div class="grow"><h3>${esc(d.name)}</h3><p class="small muted">${esc(localizedDayLabel(program, d, true))} · ${esc(d.groups)}</p></div>${btn(uiText("Почати зараз"), "start", ui`data-program="${esc(program.id)}" data-day="${d.weekday}"`, "secondary")}</section>`).join("")}${btn(uiText("Закрити"), "close", "", "ghost")}`);
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
      if(a==='skip'){captureSetInputs();openModal(skipPicker(current,current.index),'skip-title');break;}
      if (
        a === "next" && current.setTrackingMode!=='free' &&
        workingSetCount(current) <
          current.items[current.index].sets
      )
        throw Error("Спочатку заверши підходи або пропусти вправу.");
      let s;
      if (current.executionMode === 'mixed') {
        s = copy(current); s.detailedIndex = []; s.restEnd = 0; s.timerEnd = 0;
        if (a === 'skip') { if (!s.skipped.includes(s.index)) s.skipped.push(s.index); }
        else if(current.setTrackingMode==='free'&&!workingSetCount(current)){if(!s.skipped.includes(s.index))s.skipped.push(s.index);}
        else s.simpleCompleted = [...new Set([...(s.simpleCompleted || []), s.index])];
        const next=nextExerciseChoices(s,s.index)[0];if(next!==undefined)s.index=next;
      } else s = advance(current, a === "skip");
      await saveSession(s,{undoLabel:s.status==='completed'?'Завершення тренування':'Перехід до наступної вправи'});
      if (s.status === "completed") toast("Тренування збережено");
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
  if(event.target.closest('#plate-calculator-form'))clearPlateCalculation();
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
    if(f.id==='warmup-template-form') {
      const id=f.dataset.id||crypto.randomUUID(),before=S.warmupTemplates.find(item=>item.id===id)||null;
      if(!before&&S.warmupTemplates.length>=30)throw Error('Можна зберегти до 30 шаблонів.');
      const data=warmupTemplateData(Object.fromEntries(v),before),after={...data,id};
      await db.save(privatePath(`warmupTemplates/${id}`),data);S.warmupTemplates=[...S.warmupTemplates.filter(item=>item.id!==id),after];
      actionUndo.remember(S.user.uid,{before,after,id,type:'warmup',label:before?'Редагування шаблону':'Створення шаблону'});
      render();openWarmupLibrary(f.dataset.target,Number(f.dataset.day));toast('Шаблон збережено');
    }
    if(f.classList.contains('shared-streak-form')) {
      const shared=v.has('shared');await db.save(privatePath('trainingProfileSettings/streak'),{shared,updatedAt:Date.now()});S.sharedStreak=shared;
      if(navigator.onLine)await db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions());
      render();if(modal.open&&modal.querySelector('.shared-streak-form'))trainingProfilesDialog();toast('Налаштування серії збережено');
    }
    if(f.id==='skip-exercise-form') {
      const current=ongoing(),index=Number(f.dataset.index),skipped=skipExercise(current,index,String(v.get('reason')||''),String(v.get('note')||''));
      skipped.index=index;
      let next;
      if(current.executionMode==='mixed'||current.executionMode==='simple'){
        next=skipped;next.detailedIndex=[];next.index=nextExerciseChoices(next,index)[0]??index;
      } else next=advance(skipped,true);
      await saveSession(next,{undoLabel:'Пропуск вправи'});modal.close();toast('Вправу пропущено');
    }
    if(f.id==='gym-settings-form') {
      const previous=gymPrefs();
      const prefs=saveGymPreferences(localStorage,S.user.uid,{enabled:v.has('enabled'),keepAwake:navigator.wakeLock?.request?v.has('keepAwake'):previous.keepAwake,panels:Object.fromEntries(Object.keys(gymPanels).map(key=>[key,String(v.get(`panel-${key}`)||'show')]))});
      captureSetInputs();
      if(ongoing())await saveSession(gymTimerSession(ongoing(),prefs));else render();
      modal.close();toast('Екран тренування налаштовано');
    }
    if(f.id==='profile-music-form') {
      const music=profileMusicData({visible:v.has('visible'),playlists:[0,1,2].map(index=>({url:String(v.get(`playlist-url-${index}`)||''),title:String(v.get(`playlist-title-${index}`)||'')}))});
      await db.save(`publicProfiles/${S.user.uid}/music/playlists`,music);
      if(S.selfPublic)S.selfPublic.music=music;
      if(S.people?.uid===S.user.uid)S.people.person.music=music;
      render();toast('Плейлісти збережено');
    }
    if(f.id==='support-create-form') {
      const id=await db.createSupportThread(Object.fromEntries(v));await openSupportThread(id);toast(uiText('Звернення надіслано адміністрації'));
    }
    if(f.id==='support-reply-form') {
      await db.replySupportThread(f.dataset.id,String(v.get('body')));f.reset();toast(uiText('Відповідь надіслано'));
    }
    if(f.id==='meeting-poll-form') {
      const options=v.getAll('slot').map(value=>{const [date,time]=String(value).split('T');return {date,time};});
      await db.createMeetingPoll(String(v.get('partnerId')),{title:v.get('title'),options});await refreshMeetingPolls();modal.close();render();toast('Опитування створено');
    }
    if(f.classList.contains('meeting-vote-form')) {
      await db.voteMeetingPoll(f.dataset.id,v.getAll('choice').map(Number));await refreshMeetingPolls();render();toast('Відповідь збережено');
    }

    if(f.id==='exercise-note-form') {
      const value=exerciseNoteData({exerciseId:f.dataset.exerciseKey},v.get('note'));
      const path=privatePath(`exerciseNotes/${f.dataset.key}`);
      if(value.note){await db.save(path,value);S.exerciseNotes[f.dataset.key]=value;}
      else {await db.remove(path);delete S.exerciseNotes[f.dataset.key];}
      modal.close();render();toast(value.note?'Нотатку збережено':'Нотатку видалено');
    }
    if(f.id==='weekly-goal-form') {
      const goal=await db.saveWeeklyGoal(weekStart(localDate()),v.get('target'),f.dataset.profile||S.activeTrainingProfileId);S.weeklyGoals=[goal,...S.weeklyGoals.filter(g=>g.id!==goal.id)];modal.close();render();toast('Ціль збережено');
    }
    if(f.id==='workout-reflection-form') {
      const value=await db.saveWorkoutReflection(f.dataset.id,Object.fromEntries(v));S.reflections=[value,...S.reflections.filter(r=>r.id!==value.id)];modal.close();render();toast('Самопочуття збережено');
    }
    if(f.id==='gym-challenge-form') {
      await db.createChallenge(String(v.get('partnerId')),Object.fromEntries(v));await refreshChallengeList();modal.close();render();toast('Запрошення до виклику надіслано');
    }
    if(f.id==='profile-layout-form') {
      const value={order:[...f.querySelectorAll('[data-layout-key]')].map(row=>row.dataset.layoutKey),visible:v.getAll('visible')};
      const layout=await db.saveProfileLayout(value);if(S.people)S.people.layout=layout;modal.close();render();toast('Блоки профілю збережено');
    }

    if (f.id === 'plate-calculator-form') {
      clearPlateCalculation();
      const plates=[...f.querySelectorAll('[data-plate-row]')].map(row=>({weight:v.get(`plate-weight-${row.dataset.plateRow}`),pairs:v.get(`plate-pairs-${row.dataset.plateRow}`)}));
      const config={target:v.get('target'),mode:String(v.get('mode')),barWeight:v.get('barWeight'),plates};
      const result=calculatePlates(config);
      plateCalculation=result;
      try{localStorage.setItem(plateCalculatorKey(),JSON.stringify({mode:String(v.get('mode')),barWeight:Number(v.get('barWeight')),plates:plateInventory(plates)}));}catch{}
      modal.querySelector('#plate-calculator-result').innerHTML=plateCalculatorResult(result);
    }
    if (f.id === 'training-profile-form') {
      if (S.trainingProfilesError) throw Error('Спочатку завантаж профілі тренувань.');
      const name=profileName(String(v.get('name') || '')),id=f.dataset.id;
      if (S.trainingProfiles.some(profile=>profile.id !== id && profile.name.toLocaleLowerCase('uk') === name.toLocaleLowerCase('uk'))) throw Error('Профіль із такою назвою вже є.');
      if (id) {
        const previous=assertProfileAvailable(S.trainingProfiles,id,S.trainingProfileLimit),record={...previous,name,updatedAt:Math.max(Date.now(),previous.createdAt)};
        await db.save(privatePath(`trainingProfiles/${id}`),stripId(record));
        S.trainingProfiles=S.trainingProfiles.map(profile=>profile.id === id?record:profile);
        if (!S.trainingProfilesStoredIds.includes(id)) S.trainingProfilesStoredIds.push(id);
      } else {
        if (availableProfiles(S.trainingProfiles,S.trainingProfileLimit).length >= S.trainingProfileLimit) throw Error('Досягнуто ліміту профілів тренувань.');
        const created=await db.createTrainingProfile(name,String(v.get('legacyMachine') || ''));
        S.trainingProfiles=trainingProfiles([...S.trainingProfiles,created]);
        S.trainingProfilesStoredIds=[...new Set([...S.trainingProfilesStoredIds,defaultProfileId,created.id])];
        Object.assign(S,normalizeProfileContexts(S.sessions,S.manualSets,S.trainingProfiles));
      }
      render();trainingProfilesDialog();toast(id?'Назву профілю оновлено':'Профіль створено. Обери його для тренування.');
    }
    if (f.id === 'drop-set-form') {
      const session=ongoing();
      if (!session || session.id !== f.dataset.session || session.logs.length !== Number(f.dataset.logs)) throw Error('Підходи змінилися. Відкрий запис дропу знову.');
      await saveSession(appendDropSet(session,Number(f.dataset.parent),v.get('reps'),parseWeight(v.get('weight'))));
      modal.close();toast('Дроп збережено окремо від основних підходів');
    }
    if (f.id === 'workout-load-form') {
      const session = copy(ongoing()), index = Number(f.dataset.index), item = session?.items[index];
      if (!item || session.id !== f.dataset.session) throw Error('Тренування змінилося. Відкрий налаштування знову.');
      const machine = machineName(String(v.get('machine') || ''));
      const plans = Array.from({length:item.sets},(_,k)=>({ ...setPlan(item,k), ...readWeightDetails(v), weight:Number(v.get(`weight-${k}`)), reps:repsLabel(parseReps(v.get(`reps-${k}`))) }));
      Object.assign(item,{ ...readWeightDetails(v), machine, weightStep:Number(v.get('weightStep')), weight:plans[0].weight, reps:plans[0].reps, setPlans:plans });
      Object.assign(session,configureSuperset(session,index,Number(v.get('supersetPartner'))));
      if (!validProgram({ name:session.name, type:'Власна програма', days:[{weekday:0,name:session.name,groups:'',items:session.items}] })) throw Error('Перевір вагу й повторення.');
      const writes=[],now=Date.now();let updatedProgram=null,updatedProfile=null;
      if (v.has('rememberProfile')) {
        const profile=profileForContext(machine,S.trainingProfiles);
        if (!profile) throw Error('Спочатку прив’яжи архівні записи до профілю тренувань.');
        assertProfileAvailable(S.trainingProfiles,profile.id,S.trainingProfileLimit);
        updatedProfile=withProfileLoad(profile,item,now);
        writes.push([privatePath(`trainingProfiles/${profile.id}`),stripId(updatedProfile)]);
      }
      if (v.has('remember')) {
        const program = copy(S.programs.find(p=>p.id === session.programId));
        const matches = program?.days.find(day=>day.weekday === session.dayId)?.items.filter(entry=>exerciseKey(entry) === exerciseKey(item)) || [];
        if (matches.length !== 1) throw Error('Вправу в програмі змінено. Відкрий налаштування знову.');
        // Match set counts independently: today's exercise may have been changed.
        const target = matches[0];
        Object.assign(target,{...weightDetails(item),machine,weightStep:item.weightStep,weight:item.weight,reps:item.reps,setPlans:Array.from({length:target.sets},(_,k)=>({...setPlan(target,k),...plans[Math.min(k,plans.length-1)]}))});
        if (program.builderMode === 'cross') target.builderFeatures = [...new Set([...itemFeatures(target),'sets','reps','weight','plans'])];
        const day=program.days.find(day=>day.weekday === session.dayId), targetIndex=day.items.indexOf(target);
        const partner=supersetPartner(session.items,index);
        let targetPartner=-1;
        if (partner >= 0) {
          const candidates=day.items.flatMap((entry,k)=>exerciseKey(entry) === exerciseKey(session.items[partner]) ? [k] : []);
          if (candidates.length !== 1) throw Error('Не вдалося визначити парну вправу в програмі. Збережи налаштування лише для цього тренування.');
          targetPartner=candidates[0];
        }
        day.items=configureSuperset({status:'active',items:day.items,logs:[]},targetIndex,targetPartner).items;
        if (!validProgram(program)) throw Error('Перевір параметри програми.');
        updatedProgram=program;
        writes.push([privatePath(`programs/${program.id}`),{...stripId(program),updatedAt:now}]);
      }
      writes.push([privatePath(`sessions/${session.id}`),{...stripId(session),updatedAt:now}]);
      await db.saveMany(writes);
      if (updatedProgram) S.programs=S.programs.map(profile=>profile.id === updatedProgram.id?updatedProgram:profile);
      if (updatedProfile) {S.trainingProfiles=S.trainingProfiles.map(profile=>profile.id === updatedProfile.id?updatedProfile:profile);if(!S.trainingProfilesStoredIds.includes(updatedProfile.id))S.trainingProfilesStoredIds.push(updatedProfile.id);}
      S.sessions=S.sessions.map(value=>value.id === session.id?session:value);
      try { clearSetDraft(localStorage,S.user.uid,session.id); } catch {}
      modal.close();render();toast('Навантаження профілю оновлено');
    }
    if (f.id === 'edit-manual-set-form') {
      const entry = S.manualSets.find(record=>record.id === f.dataset.id);
      if (!entry) throw Error('Підхід не знайдено.');
      const data = manualSetData({...entry,...Object.fromEntries(v),...readWeightDetails(v),...parseReps(v.get('reps'),{min:1})});
      const record = {...data,createdAt:entry.createdAt,updatedAt:Math.max(Date.now(),entry.createdAt)};
      await db.save(privatePath(`manualSets/${entry.id}`),record);
      S.manualSets=S.manualSets.map(item=>item.id===entry.id?{...record,id:entry.id}:item);
      if(navigator.onLine)await db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions());
      modal.close();render();toast('Підхід оновлено');
    }
    if(f.id==='manual-set-form') {
      const name=String(v.get('exercise')||'');
      const data=manualSetData({exercise:name,exerciseKey:manualExerciseKey(name),weight:v.get('weight'),...readWeightDetails(v),...parseReps(v.get('reps'), { min: 1 }),machine:String(v.get('machine') || ''),date:v.get('date')});
      const id=crypto.randomUUID(),now=Date.now(),record={...data,createdAt:now,updatedAt:now};
      await db.save(privatePath(`manualSets/${id}`),record);
      S.manualSets.push({...record,id});
      if(navigator.onLine)await db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions());
      render();toast('Підхід збережено');
    }
    if(f.id==='measurement-form') {
      const data=measurementData({...Object.fromEntries(v),profileId:f.dataset.profile||S.activeTrainingProfileId});
      const record={...data,updatedAt:Date.now()};
      const id=profileRecordId(data.profileId,data.date);
      await db.save(privatePath(`measurements/${id}`),record);
      S.measurements=[...S.measurements.filter((m)=>m.id!==id),{...record,id}];
      modal.close(); render(); toast('Приватні заміри збережено');
    }
    if(f.id==='report-form') {
      const added=await db.submitReport(f.dataset.target,f.dataset.profile,f.dataset.comment,String(v.get('reason')),String(v.get('detail')||''));
      modal.close(); toast(added ? 'Скаргу надіслано власнику.' : 'Ти вже надіслав скаргу на цей профіль або коментар.');
    }
    if(f.id==='training-invite-form') {
      const program=S.programs.find((p)=>p.id===v.get('program'));
      const plan=invitePlan(program,v.get('day'),String(v.get('date')),String(v.get('time')||''),String(v.get('note')||''));
      await (f.dataset.poll?db.sendPollInvite(f.dataset.poll,plan):db.sendTrainingInvite(f.dataset.to,plan)); await refresh(); modal.close(); render(); toast('Запрошення надіслано Gym Bro');
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
      if(f.elements.backgroundImage.files[0])image=appearanceImageDrafts.get(f) || await prepareProfileBackground(f.elements.backgroundImage.files[0]);
      const appearance=profileAppearance({...Object.fromEntries(v),angle:Number(v.get('angle')),image});
      if(appearance.mode==='image'&&!appearance.image)throw Error('Обери фонове зображення.');
      await db.patch(`publicProfiles/${S.user.uid}`,{appearance});S.selfPublic.appearance=appearance;if(S.people?.uid===S.user.uid)S.people.person.appearance=appearance;render();toast('Оформлення профілю збережено');
    }
    if(f.id==='admin-award-form') {
      if(!owner())throw Error('Немає доступу.');
      const data=await db.adminAchievementAwards(f.dataset.uid,'grant',v.get('medalId'),String(v.get('note')||''));
      await loadAdminAwards(f.dataset.uid,data);toast('Досягнення видано');
    }
    if (f.id === 'profile-name-form') {
      const name=await db.changeName(v.get('name'));
      S.profile.name=name;S.selfPublic.name=name;if(S.people?.uid===S.user.uid)S.people.person.name=name;
      render();toast('Ім’я профілю збережено');
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
      visibility.calendarScope=String(v.get('calendarScope') || 'all');
      const calendar=await db.setProfileVisibility(visibility,profileSessions(),S.programs,profileManualSets(),ownStreakSessions());
      S.selfPublic.visibility = visibility; S.people.person.visibility = visibility;
      if(S.people.stats)S.people.stats.calendar=calendar;
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
    if(f.id==='exercise-result-form') {
      const exerciseId=f.dataset.exercise,session=S.sessions.find(s=>s.id===f.dataset.session&&s.status==='completed'),index=Number(f.dataset.log);
      const log=session?.logs[index];
      if(!log||exerciseKey(session.items[log.index])!==exerciseId)throw Error('Результат змінився або недоступний. Відкрий його знову.');
      const logs=session.logs.map((entry,k)=>k===index?{...entry,...parseWeight(v.get('weight')),...readWeightDetails(v),...parseReps(v.get('reps')),machine:machineName(String(v.get('machine') || '')),seconds:Number(v.get('seconds'))}:entry);
      const updated=editCompletedSession(session,{name:session.name,date:session.date,description:session.description||'',minutes:(session.endedAt-session.startedAt)/60000,logs});
      await saveSession(updated);detail(exerciseId);toast('Результат тренування оновлено');
    }
    if (f.id === "history-edit-form") {
      const session = S.sessions.find((s) => s.id === f.dataset.id);
      const logs = session.logs.map((l, k) => ({ ...l, ...parseReps(v.get(`log-reps-${k}`)), ...readWeightDetails(v,`log-${k}-`), machine: machineName(String(v.get(`log-machine-${k}`) || "")), ...parseWeight(v.get(`log-weight-${k}`)), seconds: +v.get(`log-seconds-${k}`),
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
      if (!db) throw authFailure('connecting');
      const email = String(v.get("email") || "").trim(),
        password = String(v.get("password") || "");
      if (authMode === "register") {
        const name = String(v.get("name") || "").trim();
        if (!name) throw authFailure('enterName');
        if (password !== v.get("confirm")) throw authFailure('passwordMismatch');
        await db.register(name, email, password);
        authNotice = "created";
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
        navigate("statistics");
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
    if (f.id === 'quick-result-form') {
      await saveSession(saveQuickResult(ongoing(), +f.dataset.index, v.get('reps'), v.get('weight'),readWeightDetails(v)),{undoLabel:'Запис результату'});
      modal.close(); toast('Результат вправи збережено');
    }
    if (f.id === 'catalog-add-form') {
      const e = S.exercises.find(e => e.id === f.dataset.exercise && !e.archived);
      if (!e) throw Error('Вправу не знайдено.');
      const target = String(v.get('target')), [kind, programId, dayIndex] = target.split('|');
      const item = { exerciseId:e.id, name:e.name, primary:e.primary, sets:3, reps:'10–12', weight:0, seconds:0, rest:60, metrics:[], note:'', snapshot:stripId(e) };
      if (kind === 'active') {
        const session = copy(ongoing()); if (!session || session.items.length >= 30) throw Error('Немає активного тренування або вже є 30 вправ.');
        session.items.push(item); await saveSession(session);
      } else {
        const program = copy(S.programs.find(p => p.id === programId && !p.archived));
        if (!program?.days[+dayIndex]) throw Error('Обери день програми.');
        requireHomeAccess(program);
        if (program.days[+dayIndex].items.length >= 30) throw Error('До 30 вправ у тренуванні.');
        program.days[+dayIndex].items.push(item);
        if (!validProgram(program)) throw Error('Перевір параметри програми.');
        await db.save(privatePath(`programs/${program.id}`), {...stripId(program), updatedAt:Date.now()});
        await refresh(); render();
      }
      modal.close(); toast('Вправу додано до тренування');
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
      const record = personalRecords(S.sessions.map((s) => s.id === current.id ? { ...s, status: 'completed' } : s),item.machine || '').find((r) => r.key === exerciseKey(item));
      const parsedWeight = parseWeight(v.get('weight'));
      const actualReps = parseReps(v.get('reps')).reps;
      const newRecord = !warmup && !parsedWeight.weightUnknown && actualReps > 0 && (!record || totalWeight({...parsedWeight,...readWeightDetails(v)}) > totalWeight(record) || totalWeight({...parsedWeight,...readWeightDetails(v)}) === totalWeight(record) && actualReps > record.reps);
      const s = completeSet(current, v.get("reps"), parsedWeight.weight, metrics, warmup,readWeightDetails(v));
      Object.assign(s.logs.at(-1), parsedWeight);
      await saveSession(s,{undoLabel:warmup?'Запис розминочного підходу':'Запис підходу'});
      toast(warmup ? "Розминочний підхід збережено" : newRecord ? '🏆 Новий найкращий результат! Заверши тренування, щоб зберегти рекорд.' : "Підхід збережено");
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
    if (f.id === 'catalog-json-form') {
      if (!owner()) throw Error('Немає доступу.');
      previewCatalogJson(String(v.get('json') || ''),f.dataset.target || '');
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
document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.id === 'catalog-json-file') {
    const file=target.files?.[0], form=target.form, status=form.querySelector('#catalog-json-file-status'), error=form.querySelector('.form-error');
    error.textContent=''; if (!file) return;
    const submit=form.querySelector('button[type="submit"]');submit.disabled=true;
    try {
      if (!owner()) throw Error('Немає доступу.');
      if (file.size>catalogJsonLimit) throw Error('Файл завеликий. Максимум 15 МБ.');
      const text=await file.text();if(form.isConnected){form.elements.json.value=text;status.textContent=`Завантажено: ${file.name}. Натисни «Перевірити зміни».`;}
    } catch (e) { error.className='form-error error';error.textContent=err(e); }
    finally { if(submit.isConnected)submit.disabled=false; }
    return;
  }
  if (target.matches('[data-weight-basis]')) {
    updateWeightDetailsFields(target.closest('form'));
    if (target.closest('#set-form')) {
      captureSetInputs();
      const form=target.closest('form'),session=ongoing(),panel=document.querySelector('.weight-suggestion');
      if(session && panel)panel.outerHTML=weightSuggestionPanel({...session.items[session.index],...readWeightDetails(new FormData(form))},session,session.index,true);
    }
    return;
  }
  if(target.id==='calendar-agenda-date') {
    const date=target.value,year=Number(date.slice(0,4));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||year<1900||year>2200||localDate(new Date(`${date}T12:00:00`))!==date){target.value=S.calendarDate;return;}
    S.calendarDate=date;S.calendarMonth=date.slice(0,7);S.activityYear=year;updateUnifiedCalendar();document.getElementById('calendar-agenda-date')?.focus({preventScroll:true});return;
  }
  if(target.id==='monthly-summary-month') {
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(target.value)||target.value>localDate().slice(0,7)){target.value=S.monthSummaryMonth;return;}
    S.monthSummaryMonth=target.value;document.getElementById('monthly-summary').outerHTML=monthlySummaryPanel();return;
  }
  if (target.matches('[data-training-profile-select]')) {
    if (busy) {target.value=S.activeTrainingProfileId;return;}
    busy=true;
    try {captureSetInputs();await selectTrainingProfile(target.value);}catch(error){target.value=S.activeTrainingProfileId;toast(err(error));}finally{busy=false;}
    return;
  }
  if (target.matches('[data-alternative-equipment]')) {
    target.closest('.exercise-alternatives').querySelectorAll('.alternative-row').forEach(row=>{row.hidden=!!target.value && row.dataset.equipment!==target.value;}); return;
  }
  if (target.matches('[data-replacement-filter]')) { filterWorkoutReplacements(target); return; }
  if (target.id === 'execution-mode') {
    const session = copy(ongoing());
    if (!session || !['simple','advanced','mixed'].includes(target.value)) return;
    session.executionMode = target.value; session.detailedIndex = []; session.restEnd = 0; session.timerEnd = 0;
    try {
      await saveSession(session);
      rememberExecutionMode(localStorage, S.user.uid, session.executionMode);
    } catch (error) { toast(error.message); render(); } return;
  }
  if(target.dataset.nutritionProduct){S.nutritionChecked=target.checked?[...new Set([...(S.nutritionChecked||[]),target.dataset.nutritionProduct])]:(S.nutritionChecked||[]).filter(id=>id!==target.dataset.nutritionProduct);saveNutritionChecks();const count=document.querySelector('[data-shopping-count]');if(count)count.textContent=`Куплено ${S.nutritionChecked.length} із ${S.nutritionResult.groceries.length}`;return;}
  if(target.closest('#nutrition-generator-form')){updateNutritionPreview(target);return;}
  if(target.id==='measurement-metric' || target.id==='measurement-period') {
    if(target.id==='measurement-metric')S.measurementMetric=target.value;else S.measurementPeriod=target.value;
    const panel=document.querySelector('#measurements-view');if(panel)panel.innerHTML=measurementsPanel();return;
  }
  if(target.id==='measurement-date' && !target.readOnly) {
    const record=profileMeasurements().find((m)=>m.date===target.value),form=target.form;
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
  if (["progress-metric", "progress-period", "progress-exercise", "progress-source", "progress-machine"].includes(target.id)) {
    if (target.id === "progress-metric") S.progressMetric = target.value;
    else if (target.id === "progress-period") S.progressPeriod = target.value;
    else if (target.id === "progress-source") S.progressSource = target.value;
    else if (target.id === "progress-machine") S.progressMachine = target.value;
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
window.addEventListener("pagehide", () => { gymWakeLock.sync(false);stopTurnWatch(); captureSetInputs(); persistEditorDraft(true); });
window.addEventListener("pageshow",event=>{if(event.persisted)render();});
modal.addEventListener('close',()=>{disposeImageEdit();stopSupportView();supportRevision++;});
document.addEventListener('change',(event)=>{if(event.target.id==='invite-program')updateInviteDays();});

window.addEventListener("nexus-sync", (event) => { S.syncError = event.detail.error || ""; updateSyncNotice(); });
window.addEventListener("offline", updateSyncNotice);
window.addEventListener("online", async () => {
  if (!S.user?.emailVerified || !db?.sync) return;
  try {
    await db.sync(); S.syncError = ""; await refresh();
    if (!['nutrition','achievements'].includes(S.route)) await db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions()).catch(()=>{});
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
    document.querySelectorAll('[data-local-clock]').forEach(clock=>{
      const now=new Date();clock.dateTime=now.toISOString();clock.textContent=formatInstant(now,uiLocale());
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
  S.authReady=true;
  const revision = ++userLoadRevision;
  const isCurrent = () => revision === userLoadRevision && db.auth.currentUser?.uid === user?.uid;
  stopSupportView();supportRevision++;
  stopNotices?.(); stopNotices = null;
  stopAchievementWatch?.();stopAchievementWatch=null;
  stopMedalEvents?.();stopMedalEvents=null;S.achievementEvents=[];S.meetingPolls=[];S.weeklyGoals=[];S.reflections=[];S.challenges=[];S.trainingExtrasError='';
  S.achievements={progress:null,display:{selectedIds:[],rankingEnabled:false},leaders:[],motionPaused:achievementMotionPaused(),onlyEarned:false,dirty:false,loading:false,error:'',leaderError:''};
  S.notices = [];S.noticeOlder=[];S.noticeHasMore=false;S.noticeOldestId=''; S.noticeError = ''; S.selfPublic = null; replyingTo = null;
  S.blocked=[]; S.blockedProfiles={}; S.reports=[]; S.reportProfiles={}; S.invites=[];
  editorDraftKey = "";
  editor = null;
  S.user = user;
  S.workoutDiscarded = false;
  S.isOwner = false;
  S.nutritionInput={...generatorDefaults};S.nutritionResult=null;S.nutritionHydrated=false;S.nutritionShopping=false;S.nutritionEditing=false;S.nutritionChecked=[];
  S.nutritionPlans=[]; S.nutritionAccess=false; S.nutritionError=""; S.nutritionId=""; S.nutritionDay=0;
  S.trainingProfiles=[defaultTrainingProfile()];S.trainingProfilesStoredIds=[];S.activeTrainingProfileId=defaultProfileId;S.trainingProfileLimit=3;S.trainingProfilesError='';
  S.homeAccess = false;
  S.customizationAccess=false;
  S.adminAccess = {};
  S.loaded = false;
  S.communityLoading = ['profile', 'settings','statistics'].includes(currentPage);
  S.publicProfileReady = false;
  S.route = currentPage;
  S.profile = null;
  S.people = null;S.warmupTemplates=[];
  S.programs = [];
  S.sessions = [];
  S.measurements=[];S.measurementsError='';
  S.manualSets=[];S.manualSetsError='';
  S.exercises = [];
  S.exercisePreferences = {};
  S.exerciseNotes = {};
  resultCardPages=[];
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
  if (currentPage === 'admin' && (!user || !user.emailVerified)) {
    location.replace(new URL('home.html', appBase).href);
    return;
  }
  if (!user || !user.emailVerified || authPages.includes(currentPage)) {
    render();
    return;
  }
  render();
  try {
    await db.prepareAccess();
    if (!isCurrent()) return;
    const isOwner = await db.isOwner();
    if (!isCurrent()) return;
    S.isOwner = isOwner;
    if (currentPage === 'admin' && !isOwner) {
      location.replace(new URL('home.html', appBase).href);
      return;
    }
    const [profile] = await Promise.all([db.profile(user), refresh({ isCurrent })]);
    if (!isCurrent()) return;
    S.profile = profile;
    if(currentPage==='achievements')await loadAchievements({isCurrent});
    activity.pulse();
    if (currentPage === "editor") prepareEditor();
    expiredTimers(gymTimerSession(ongoing(),gymPrefs()), notifiedTimers);
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
      if (ready && !['nutrition','achievements'].includes(S.route)) return db.publishProfileStats(profileSessions(),profileManualSets(),S.programs,ownStreakSessions());
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
  S.authReady=false;unsubscribeAuth?.();unsubscribeAuth=null;
  if(!authPages.includes(currentPage))applyInterfaceLanguage();
  bootError = "";
  if (authPages.includes(currentPage)) login();
  else
    root.innerHTML = ui`
      <main class="loading">Завантаження Nexus GymB…</main>
    `;
  try {
    db = await connect();
    if (authPages.includes(currentPage)) login();
    unsubscribeAuth?.();
    unsubscribeAuth = db.watch(handleUser);
  } catch (e) {
    bootError = uiText("Не вдалося завантажити Firebase. Перевір інтернет і спробуй ще раз.");
    if(authPages.includes(currentPage))login();
    else renderAuthPending();
  }
}
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="reload"]')) location.reload();
});
boot();

document.addEventListener('change',event=>{
  const input=event.target;if(!input.matches('[data-compare-workout]'))return;
  const id=input.dataset.compareWorkout,session=S.sessions.find(s=>s.id===id);if(!session)return;
  S.comparisonIds[id]=input.value;
  const card=input.closest('.workout-comparison');card.outerHTML=comparisonCard(profileSessions().find(value=>value.id===id)||session,profileSessions(),input.value);
});

document.addEventListener('change',event=>{
  const input=event.target;
  if(input.id==='rep-record-count') {const count=Number(input.value);if(!Number.isInteger(count)||count<1||count>1000){input.setCustomValidity('Вкажи від 1 до 1000 повторень.');input.reportValidity();return;}input.setCustomValidity('');S.recordReps=count;render();}
  if(input.id==='public-activity-year'){const year=Number(input.value);if(Number.isInteger(year)&&year>=1900&&year<=2200){S.publicActivityYear=year;render();}}
  if(input.id==='activity-year') {const year=Number(input.value);if(year>=1900&&year<=2200){S.activityYear=year;render();}}
});
document.addEventListener('keydown',event=>{
  const button=event.target.closest?.('.activity-heatmap button');if(!button)return;
  const buttons=[...button.parentElement.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(button),step={ArrowRight:7,ArrowLeft:-7,ArrowDown:1,ArrowUp:-1};
  if(!(event.key in step)&&!['Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+step[event.key]));
  buttons.forEach(item=>item.tabIndex=-1);buttons[next].tabIndex=0;buttons[next].focus();
});

// Language is a device preference controlled from Settings.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-interface-language]');
  if(!button || button.dataset.interfaceLanguage===getLanguage())return;
  captureSetInputs();
  persistEditorDraft(true);
  if(!setLanguage(button.dataset.interfaceLanguage))return;
  const inboxOpen=modal.open&&modal.classList.contains('notifications-dialog');
  const formDrafts=S.route==='settings'?[...root.querySelectorAll('form')].filter(form=>form.id!=='profile-appearance-form').map(form=>({id:form.id,values:[...form.elements].filter(field=>field.name&&!['file','password','submit','button'].includes(field.type)).map(field=>({name:field.name,value:field.value,checked:field.checked}))})):[];
  const appearanceForm=root.querySelector('#profile-appearance-form');
  let appearanceDraft=null;
  try {if(appearanceForm)appearanceDraft=appearanceFormData(appearanceForm);} catch {}
  const appearanceInputs=appearanceForm?[...appearanceForm.elements].filter(field=>field.name&&field.type!=='file').map(field=>({name:field.name,value:field.value,checked:field.checked})):[];
  render();
  for(const draft of formDrafts)for(const value of draft.values){const field=document.getElementById(draft.id)?.elements.namedItem(value.name);if(field){field.value=value.value;if(field.type==='checkbox')field.checked=value.checked;}}
  if(appearanceDraft&&root.querySelector('#profile-appearance-form'))fillAppearanceForm(root.querySelector('#profile-appearance-form'),appearanceDraft);
  const restoredAppearance=root.querySelector('#profile-appearance-form');
  if(restoredAppearance)for(const value of appearanceInputs){const field=restoredAppearance.elements.namedItem(value.name);if(field){field.value=value.value;if(field.type==='checkbox')field.checked=value.checked;}}
  if(inboxOpen)noticeInbox();
  document.querySelector(`[data-interface-language="${getLanguage()}"]`)?.focus({preventScroll:true});
});
