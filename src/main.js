import "./style.css";
import { invoke } from "@tauri-apps/api/core";

const app = document.querySelector("#app");

const state = {
  screen: "intro",
  onboardingStep: "course",
  loginMode: "email",
  authError: "",
  forgotPassword: false,
  tab: "learn",
  course: "Spanish",
  courseFlag: "🇪🇸",
  streak: 7,
  gems: 120,
  xp: 640,
  selectedNode: 2,
  completedLessons: 2,
  sheet: false,
  coursePicker: false,
  settings: false,
  question: 0,
  answer: null,
  checked: false,
  correct: 0,
  lessonDone: false,
  animations: true,
  hearts: 5,
  questXp: 0,
  questStreak: 0,
  questLessons: 0,
  correctInRow: 0,
  lessonFailed: false,
  lastPracticeDate: "",
  questDate: "",
  questRewardClaimed: false,
  streakFreezes: 0,
  doubleXp: false,
  learnerName: "Learner",
  leagueWeekEndsAt: Date.now() + 4*86400000,
  accountSnapshot: null,
  accountJwt: "",
  accountBusy: false,
  accountError: "",
  showDeveloperSession: false,
  questTab: "daily",
  profileTab: "achievements",
};

// Keep preview progress across app restarts without pretending to sync an account.
try {
  const saved = JSON.parse(localStorage.getItem("duolingo-desktop-preview") || "null");
  if (saved && typeof saved === "object") {
    for (const key of ["course", "courseFlag", "streak", "gems", "xp", "selectedNode", "completedLessons", "animations", "hearts", "questXp", "questStreak", "questLessons", "lastPracticeDate", "questDate", "questRewardClaimed", "streakFreezes", "doubleXp", "learnerName", "leagueWeekEndsAt"]) {
      if (saved[key] !== undefined) state[key] = saved[key];
    }
  }
} catch { /* Ignore invalid or unavailable local storage. */ }

const localDay = () => {
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};
if (state.questDate !== localDay()) {
  state.questDate = localDay(); state.questXp = 0; state.questStreak = 0; state.questLessons = 0; state.correctInRow = 0; state.questRewardClaimed = false;
}
function hasAnswer() { return Array.isArray(state.answer) ? state.answer.length > 0 : state.answer !== null; }
function recordPracticeDay() {
  const today = localDay();
  if (state.lastPracticeDate === today) return;
  if (state.lastPracticeDate) {
    const previous = new Date(state.lastPracticeDate+"T00:00:00");
    const current = new Date(today+"T00:00:00");
    const days = Math.round((current-previous)/86400000);
    if (days === 1) state.streak += 1;
    else if (days === 2 && state.streakFreezes>0) state.streakFreezes -= 1;
    else state.streak = 1;
  }
  state.lastPracticeDate = today;
}

function persistState() {
  try {
    const { course, courseFlag, streak, gems, xp, selectedNode, completedLessons, animations, hearts, questXp, questStreak, questLessons, lastPracticeDate, questDate, questRewardClaimed, streakFreezes, doubleXp, learnerName, leagueWeekEndsAt } = state;
    localStorage.setItem("duolingo-desktop-preview", JSON.stringify({ course, courseFlag, streak, gems, xp, selectedNode, completedLessons, animations, hearts, questXp, questStreak, questLessons, lastPracticeDate, questDate, questRewardClaimed, streakFreezes, doubleXp, learnerName, leagueWeekEndsAt }));
  } catch { /* The app remains usable when storage is unavailable. */ }
}

const questionBank = {
  Spanish: [
    {prompt:"How do you say “hello”?",hint:"Select the correct translation",answers:["Hola","Gracias","Adiós","Por favor"],correct:"Hola",note:"Hola means hello."},
    {prompt:"What do you hear?",hint:"Listen, then choose the matching phrase",type:"listen",spoken:"El agua",answers:["El pan","El agua","La leche","El café"],correct:"El agua",note:"Agua is feminine, but uses “el” in the singular."},
    {prompt:"Write this in Spanish",hint:"I eat bread",type:"wordbank",bank:["Yo","como","pan","bebo","agua"],correct:"Yo como pan",note:"Como is the first-person form of comer (to eat)."},
    {prompt:"What does “gracias” mean?",hint:"Select the English meaning",answers:["Good morning","Please","Thank you","Excuse me"],correct:"Thank you",note:"Gracias means thank you."},
    {prompt:"Complete the phrase: “Buenos ___”",hint:"Good morning",answers:["noches","días","tardes","amigos"],correct:"días",note:"Buenos días is the common greeting for good morning."}
  ],
  French: [
    {prompt:"How do you say “hello”?",hint:"Select the correct translation",answers:["Bonjour","Merci","Au revoir","S'il vous plaît"],correct:"Bonjour",note:"Bonjour is the standard greeting for hello or good day."},
    {prompt:"What do you hear?",hint:"Listen, then choose the matching phrase",type:"listen",spoken:"De l'eau",answers:["Du pain","De l'eau","Du lait","Du café"],correct:"De l'eau",note:"De l'eau means some water."},
    {prompt:"Write this in French",hint:"I eat bread",type:"wordbank",bank:["Je","mange","du","pain","bois","eau"],correct:"Je mange du pain",note:"Mange is the first-person form of manger (to eat)."},
    {prompt:"What does “merci” mean?",hint:"Select the English meaning",answers:["Good morning","Please","Thank you","Excuse me"],correct:"Thank you",note:"Merci means thank you."},
    {prompt:"Complete the phrase: “Bonjour, comment ___-vous?”",hint:"Hello, how are you?",answers:["allez","mangez","parlez","faites"],correct:"allez",note:"Comment allez-vous? is a polite way to ask how someone is."}
  ],
  German: [
    {prompt:"How do you say “hello”?",hint:"Select the correct translation",answers:["Hallo","Danke","Tschüss","Bitte"],correct:"Hallo",note:"Hallo is a common German greeting."},
    {prompt:"What do you hear?",hint:"Listen, then choose the matching phrase",type:"listen",spoken:"Das Wasser",answers:["Das Brot","Das Wasser","Die Milch","Der Kaffee"],correct:"Das Wasser",note:"Das Wasser means the water."},
    {prompt:"Write this in German",hint:"I eat bread",type:"wordbank",bank:["Ich","esse","Brot","trinke","Wasser"],correct:"Ich esse Brot",note:"Esse is the first-person form of essen (to eat)."},
    {prompt:"What does “danke” mean?",hint:"Select the English meaning",answers:["Good morning","Please","Thank you","Excuse me"],correct:"Thank you",note:"Danke means thank you."},
    {prompt:"Complete the phrase: “Guten ___”",hint:"Good morning",answers:["Abend","Morgen","Nacht","Tag"],correct:"Morgen",note:"Guten Morgen is the common greeting for good morning."}
  ],
  Italian: [
    {prompt:"How do you say “hello”?",hint:"Select the correct translation",answers:["Ciao","Grazie","Arrivederci","Per favore"],correct:"Ciao",note:"Ciao is an informal hello and goodbye."},
    {prompt:"What do you hear?",hint:"Listen, then choose the matching phrase",type:"listen",spoken:"L'acqua",answers:["Il pane","L'acqua","Il latte","Il caffè"],correct:"L'acqua",note:"L'acqua means the water."},
    {prompt:"Write this in Italian",hint:"I eat bread",type:"wordbank",bank:["Io","mangio","il","pane","bevo","acqua"],correct:"Io mangio il pane",note:"Mangio is the first-person form of mangiare (to eat)."},
    {prompt:"What does “grazie” mean?",hint:"Select the English meaning",answers:["Good morning","Please","Thank you","Excuse me"],correct:"Thank you",note:"Grazie means thank you."},
    {prompt:"Complete the phrase: “Buon ___”",hint:"Good morning",answers:["sera","giorno","notte","pomeriggio"],correct:"giorno",note:"Buongiorno is the common greeting for good morning."}
  ],
  Portuguese: [
    {prompt:"How do you say “hello”?",hint:"Select the correct translation",answers:["Olá","Obrigado","Tchau","Por favor"],correct:"Olá",note:"Olá means hello."},
    {prompt:"What do you hear?",hint:"Listen, then choose the matching phrase",type:"listen",spoken:"A água",answers:["O pão","A água","O leite","O café"],correct:"A água",note:"Água means water."},
    {prompt:"Write this in Portuguese",hint:"I eat bread",type:"wordbank",bank:["Eu","como","pão","bebo","água"],correct:"Eu como pão",note:"Como is the first-person form of comer (to eat)."},
    {prompt:"What does “obrigado” mean?",hint:"Select the English meaning",answers:["Good morning","Please","Thank you","Excuse me"],correct:"Thank you",note:"Obrigado is thank you when spoken by a man; obrigada when spoken by a woman."},
    {prompt:"Complete the phrase: “Bom ___”",hint:"Good morning",answers:["noite","dia","tarde","amigo"],correct:"dia",note:"Bom dia is the common greeting for good morning."}
  ],
  Japanese: [
    {prompt:"How do you say “hello”?",hint:"Select the correct translation",answers:["こんにちは","ありがとう","さようなら","お願いします"],correct:"こんにちは",note:"こんにちは is a common daytime greeting."},
    {prompt:"What do you hear?",hint:"Listen, then choose the matching word",type:"listen",spoken:"水",answers:["パン","水","牛乳","コーヒー"],correct:"水",note:"水 (みず) means water."},
    {prompt:"Build the sentence",hint:"I eat bread",type:"wordbank",bank:["私","は","パン","を","食べます","水"],correct:"私 は パン を 食べます",note:"私はパンを食べます means I eat bread."},
    {prompt:"What does “ありがとう” mean?",hint:"Select the English meaning",answers:["Good morning","Please","Thank you","Excuse me"],correct:"Thank you",note:"ありがとう means thank you."},
    {prompt:"Complete the greeting: “おはよう ___”",hint:"Good morning (polite)",answers:["ございます","ありがとう","さようなら","ください"],correct:"ございます",note:"おはようございます is the polite form of good morning."}
  ]
};
function activeQuestions() { return questionBank[state.course] || questionBank.Spanish; }

function isAnswerCorrect(question = activeQuestions()[state.question]) {
  const answer = Array.isArray(state.answer) ? state.answer.join(" ") : state.answer;
  return answer === question.correct;
}

function speakSpanish(phrase) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = state.course === "Japanese" ? "ja-JP" : state.course === "French" ? "fr-FR" : state.course === "German" ? "de-DE" : state.course === "Italian" ? "it-IT" : state.course === "Portuguese" ? "pt-BR" : "es-ES";
  window.speechSynthesis.speak(utterance);
}

const icons = {
  learn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9a1.2 1.2 0 0 1-1.2 1.2h-5.1v-6.2H9.3V21H4.2A1.2 1.2 0 0 1 3 19.8z"/></svg>',
  leaderboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v3h4v3a5 5 0 0 1-4.4 5A6 6 0 0 1 13 17.8V20h4v2H7v-2h4v-2.2a6 6 0 0 1-3.6-3.8A5 5 0 0 1 3 9V6h4zm-2 5v1a3 3 0 0 0 2.1 2.9A13 13 0 0 1 7 8zm14 0h-2v4.9A3 3 0 0 0 19 9z"/></svg>',
  quests: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 14.2 8l6.3.2-4.9 4 1.7 6.1L12 14.8l-5.3 3.5 1.7-6.1-4.9-4L9.8 8z"/><path d="m19 15 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>',
  shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16l1.5 12H2.5zM8 8a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0z"/></svg>',
};

function header() {
  return `
    <header class="topbar">
      <button class="course-switch" data-action="course-picker" aria-label="Change course">
        <span class="flag">${state.courseFlag}</span><span class="course-name">${state.course}</span><span class="chevron">⌄</span>
      </button>
      <div class="top-stats">
        <button class="stat" data-action="streak" aria-label="Streak"><span class="stat-icon flame">🔥</span><b>${state.streak}</b></button>
        <button class="stat" data-action="gems" aria-label="Gems"><span class="gem">◆</span><b>${state.gems}</b></button>
      </div>
    </header>`;
}

function tabs() {
  const items = [
    ["learn", "Learn"], ["leaderboard", "Leagues"], ["quests", "Quests"], ["shop", "Shop"], ["profile", "Profile"],
  ];
  return `<nav class="bottom-tabs" aria-label="Main navigation">${items.map(([id,label]) => `
    <button class="tab ${state.tab === id ? "active" : ""}" data-tab="${id}">
      <span class="tab-icon">${icons[id]}</span><span class="tab-label">${label}</span>
    </button>`).join("")}</nav>`;
}

function unitHeader() {
  return `
    <section class="unit-header">
      <div class="unit-copy">
        <div class="eyebrow">SECTION 1 · UNIT 1</div>
        <h1>Say hello</h1>
        <p>Learn basic greetings and introduce yourself.</p>
      </div>
      <button class="guidebook" data-action="guidebook"><span>📖</span> Guidebook</button>
    </section>`;
}

function pathNode(node, index) {
  const locked = node.type === "locked";
  const active = node.type === "active";
  const chest = node.type === "chest";
  const cls = ["path-node", node.side || "center", node.type].join(" ");
  const label = chest ? "Unit chest" : node.type === "legendary" ? "Legendary level" : `Level ${index + 1}`;
  const art = chest
    ? '<svg class="node-art chest-art" viewBox="0 0 48 48" aria-hidden="true"><path d="M7 18h34v24H7z"/><path d="M5 13h38v9H5z"/><path d="M20 13c-9-13-17-2-7 3h11M28 13c9-13 17-2 7 3h-11"/><path d="M21 18h6v24h-6z"/></svg>'
    : locked
      ? '<svg class="node-art" viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="21" width="28" height="21" rx="5"/><path d="M16 21v-6a8 8 0 0 1 16 0v6"/><circle cx="24" cy="31" r="2.5"/></svg>'
      : node.type === "legendary"
        ? '<svg class="node-art" viewBox="0 0 48 48" aria-hidden="true"><path d="m7 14 10 8 7-13 7 13 10-8-4 25H11z"/><path d="M13 34h22"/></svg>'
        : '<svg class="node-art" viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 5.8 12 13.2 1.9-9.5 9.2 2.2 13L24 34l-11.7 6.1 2.2-13L5 17.9 18.2 16z"/></svg>';
  return `
    <div class="node-row ${node.side || "center"}">
      <div class="node-wrap">
        <button class="${cls}" data-node="${index}" aria-label="${label}" ${locked ? "disabled" : ""}>
          ${active ? '<svg class="node-ring" viewBox="0 0 82 78" aria-hidden="true"><ellipse cx="41" cy="39" rx="37" ry="34"/></svg>' : ""}
          <span class="node-face">${art}</span>
          ${active ? '<span class="node-caption">START</span>' : ""}
        </button>
        ${node.type === "done" ? '<span class="node-stars">★★★</span>' : ""}
      </div>
      ${chest ? '<span class="node-label">Unit chest</span>' : ""}
    </div>`;
}

function learnScreen() {
  const progress = state.completedLessons;
  const nodes = [
    { type: progress > 0 ? "done" : "active", side:"center" },
    { type: progress > 1 ? "done" : progress === 1 ? "active" : "locked", side:"left" },
    { type: progress > 2 ? "done" : progress === 2 ? "active" : "locked", side:"center" },
    { type: progress > 3 ? "done" : progress === 3 ? "active" : "locked", side:"right" },
    { type:"chest", side:"center" },
    { type: progress > 4 ? "done" : progress === 4 ? "active" : "locked", side:"left" },
    { type: progress > 5 ? "done" : progress === 5 ? "active" : "locked", side:"center" },
    { type:"legendary", side:"right" },
    { type:"locked", side:"center" },
  ];
  return `
    <main class="screen learn-screen">
      ${unitHeader()}
      <div class="path-area">
        <div class="path-spine"></div>
        <div class="path-nodes">${nodes.map(pathNode).join("")}</div>
        <div class="unit-end"><span>🏁</span><b>Unit 1 complete</b><small>Keep learning to unlock the next unit</small></div>
      </div>
    </main>`;
}

function leaderboardScreen() {
  const rivals = [{name:"Sofia",xp:2840,avatar:"👩🏻"},{name:"Lucas",xp:2410,avatar:"👨🏽"},{name:"Mia",xp:1980,avatar:"👩🏼"},{name:"Oliver",xp:1540,avatar:"👨🏻"},{name:"Ava",xp:1320,avatar:"👩🏾"},{name:"Noah",xp:810,avatar:"👨🏼"}];
  const people = [...rivals,{name:state.learnerName,xp:state.xp,avatar:"🦉",you:true}].sort((a,b)=>b.xp-a.xp);
  const rank = people.findIndex(p=>p.you)+1;
  const days = Math.max(0,Math.ceil((state.leagueWeekEndsAt-Date.now())/86400000));
  return `
    <main class="screen other-screen league-screen">
      <div class="league-hero"><div class="league-hero-art">🏆</div><div class="eyebrow">WEEKLY LEAGUE</div><h1>Amethyst League</h1><p>Compete with learners around the world.</p><div class="league-progress-summary"><span>⬆ Top 10 promote</span><span>⬇ Bottom 5 demote</span></div></div>
      <section class="league-podium"><div class="podium-person second"><span class="podium-avatar">${people[1]?.avatar||"👤"}</span><b>${people[1]?.name||"—"}</b><small>${(people[1]?.xp||0).toLocaleString()} XP</small><i>2</i></div><div class="podium-person first"><span class="podium-crown">👑</span><span class="podium-avatar">${people[0]?.avatar||"👤"}</span><b>${people[0]?.name||"—"}</b><small>${(people[0]?.xp||0).toLocaleString()} XP</small><i>1</i></div><div class="podium-person third"><span class="podium-avatar">${people[2]?.avatar||"👤"}</span><b>${people[2]?.name||"—"}</b><small>${(people[2]?.xp||0).toLocaleString()} XP</small><i>3</i></div></section>
      <section class="panel league-table"><div class="panel-title"><b>Leaderboard</b><span>Ends in ${days} days</span></div>
        ${people.map((p,i)=>`<div class="person-row ${p.you?"you":""}"><span class="rank">${i+1}</span><span class="person-avatar">${p.avatar}</span><span class="person-name">${p.name}${p.you?" (You)":""}</span><b class="person-xp">${p.xp.toLocaleString()} XP</b></div>`).join("")}
      </section><p class="fine-print">Local preview league. Real league membership and standings require an authenticated Duolingo account.</p>
    </main>`;
}

function dailyRefreshLabel() {
  const next = new Date(); next.setHours(24,0,0,0);
  const minutes = Math.max(0,Math.floor((next-Date.now())/60000));
  return `${Math.floor(minutes/60)}h ${minutes%60}m`;
}

function accountQuestList(category) {
  const snapshot = state.accountSnapshot;
  if (!snapshot) return [];
  const root = snapshot.quests;
  const raw = Array.isArray(root) ? root : (root?.quests || root?.items || root?.data?.quests || []);
  const schemaRoot = snapshot.schema;
  const schemas = Array.isArray(schemaRoot) ? schemaRoot : (schemaRoot?.goals || schemaRoot?.data?.goals || []);
  const progressRoot = snapshot.progress;
  const details = progressRoot?.goals?.details || progressRoot?.goals?.goals || progressRoot?.goals || {};
  const rows = Array.isArray(details) ? details : Object.values(details || {});
  const progressById = new Map(rows.filter(Boolean).map(item => [String(item.goalId || item.goal_id || ""), item]));
  return raw.filter(q => {
    const kind = String(q.goalCategory || q.goal_category || q.category || "").toUpperCase();
    return category === "daily"
      ? kind === "DAILY_QUESTS" || kind === "DAILY_QUEST"
      : kind === "MONTHLY_CHALLENGES" || kind === "MONTHLY_CHALLENGE" || kind === "MONTHLY_GOALS";
  }).map(q => {
    const id = String(q.goalId || q.goal_id || "");
    const schema = schemas.find(item => String(item.goalId || item.goal_id || "") === id) || {};
    const progress = q.goalDetails?.progress ?? q.goal_details?.progress ?? progressById.get(id)?.progress ?? 0;
    const target = q.questThreshold ?? q.quest_threshold ?? schema.threshold ?? 1;
    const titleValue = schema.title?.uiString || schema.title?.ui_string || schema.title || q.title?.uiString || q.title || id || "Duolingo goal";
    const title = typeof titleValue === "string" ? titleValue : String(titleValue);
    const numericProgress = Number(progress) || 0;
    const numericTarget = Math.max(1, Number(target) || 1);
    const complete = Boolean(q.completed || String(q.questState || q.quest_state || "").toUpperCase() === "FINISHED");
    const metric = String(schema.metric || q.goalDetails?.metric || "").toUpperCase();
    const icon = metric.includes("XP") ? "⚡" : metric.includes("LESSON") || metric.includes("SESSION") ? "📚" : "🎯";
    return {id, icon, title, detail: schema.category || q.goalCategory || "Duolingo quest", value: complete ? numericTarget : Math.min(numericProgress,numericTarget), goal:numericTarget, percent:complete?100:Math.min(100,numericProgress/numericTarget*100), complete};
  });
}

function questsScreen() {
  const localQuests = [
    {icon:"⚡",title:"Earn 20 XP",detail:"Earn XP by completing lessons",value:Math.min(state.questXp,20),goal:20},
    {icon:"🎯",title:"Get 5 in a row",detail:"Answer 5 questions correctly in a row",value:Math.min(state.questStreak,5),goal:5},
    {icon:"📚",title:"Complete 2 lessons",detail:"Finish any 2 learning sessions",value:Math.min(state.questLessons,2),goal:2},
  ].map(q=>({...q,percent:Math.min(100,q.value/q.goal*100),complete:q.value>=q.goal}));
  const daily = state.questTab === "daily";
  const liveQuests = accountQuestList(daily ? "daily" : "monthly");
  const quests = liveQuests.length ? liveQuests : localQuests;
  const completed = quests.filter(q=>q.complete || q.percent===100).length;
  if (!liveQuests.length && daily && completed===3 && !state.questRewardClaimed) { state.gems+=40; state.questRewardClaimed=true; }
  const monthlyLessons = Math.min(state.questLessons,20);
  return `
    <main class="screen other-screen quests-screen">
      <div class="page-heading"><div class="eyebrow">YOUR GOALS</div><h1>Quests</h1><p>Little goals make big progress.</p></div>
      <div class="quest-tabs" role="tablist" aria-label="Quest categories">
        <button role="tab" aria-selected="${daily}" class="${daily?"selected":""}" data-quest-tab="daily">Daily</button>
        <button role="tab" aria-selected="${!daily}" class="${!daily?"selected":""}" data-quest-tab="monthly">Monthly Challenge</button>
      </div>
      ${liveQuests.length ? '<div class="live-data-label"><span></span> Live from your Duolingo account</div>' : ""}
      ${daily ? `
        <section class="daily-quest-heading"><b>Daily Quests</b><span>${liveQuests.length ? "Synced from account" : "Refreshes in "+dailyRefreshLabel()}</span></section>
        <section class="quest-summary"><div class="quest-ring"><b>${completed}</b><small>/ ${quests.length}</small></div><div><b>${completed===quests.length?"All quests complete!":"Keep your momentum going"}</b><span>${liveQuests.length ? "Your live daily quest progress." : "Complete all three quests for a gem reward."}</span></div>${liveQuests.length ? "" : '<span class="reward">◆ 40</span>'}</section>
        <section class="daily-quest-list">${quests.map(q=>`<article class="daily-quest-card ${q.percent===100?"quest-complete":""}"><div class="quest-icon">${q.icon}</div><div class="quest-info"><b>${escapeHtml(q.title)}</b><span>${escapeHtml(String(q.detail))}</span><div class="progress-track"><i style="width:${q.percent}%"></i></div><small>${q.value} / ${q.goal}</small></div><span class="quest-reward">${q.percent===100?"✓":liveQuests.length?"":"◆ 10"}</span></article>`).join("")}</section>
        ${liveQuests.length ? "" : '<section class="friends-quest-card"><div class="friends-quest-art">🤝</div><div><b>Friends Quest</b><p>Team up with a friend and complete a shared weekly goal.</p><small>Sign in to find friends and start a quest.</small></div></section>'}
      ` : `
        ${liveQuests.length ? `<section class="daily-quest-list">${quests.map(q=>`<article class="daily-quest-card ${q.percent===100?"quest-complete":""}"><div class="quest-icon">${q.icon}</div><div class="quest-info"><b>${escapeHtml(q.title)}</b><span>${escapeHtml(String(q.detail))}</span><div class="progress-track"><i style="width:${q.percent}%"></i></div><small>${q.value} / ${q.goal}</small></div><span class="quest-reward">${q.percent===100?"✓":""}</span></article>`).join("")}</section>` : `
          <section class="monthly-hero"><div class="monthly-art">🏅</div><div class="eyebrow">MONTHLY CHALLENGE</div><h2>Build your learning streak</h2><p>Complete lessons throughout the month to earn a special badge.</p><div class="monthly-progress"><i style="width:${Math.min(100,monthlyLessons/20*100)}%"></i></div><b>${monthlyLessons} / 20 lessons</b></section>
          <section class="monthly-milestones"><h3>Milestones</h3><div><span>🌱</span><b>5 lessons</b><small>${state.questLessons>=5?"Complete":"Locked"}</small></div><div><span>⭐</span><b>10 lessons</b><small>${state.questLessons>=10?"Complete":"Locked"}</small></div><div><span>🏆</span><b>20 lessons</b><small>${state.questLessons>=20?"Complete":"Locked"}</small></div></section>
          <p class="fine-print">Monthly challenge progress is local preview data until the authenticated goals API returns matching Android goal categories.</p>
        `}
      `}
    </main>`;
}

function shopScreen() {
  const items = [
    {id:"freeze",icon:"🧊",name:"Streak Freeze",description:"Protect your streak if you miss a day.",price:200,owned:state.streakFreezes>0,ownedLabel:`${state.streakFreezes} owned`},
    {id:"double",icon:"💎",name:"2× XP Boost",description:"Double the XP earned from your next completed lesson.",price:50,owned:state.doubleXp,ownedLabel:"Active"},
    {id:"hearts",icon:"❤️",name:"Heart Refill",description:"Refill your hearts so you can keep learning.",price:350,owned:state.hearts>=5,ownedLabel:"Full"},
  ];
  return `
    <main class="screen other-screen shop-screen">
      <div class="shop-hero"><div class="eyebrow">DUOLINGO SHOP</div><h1>Shop</h1><p>Get items to help you on your learning journey.</p><div class="shop-wallet"><span class="gem big">◆</span><div><small>GEM BALANCE</small><b>${state.gems.toLocaleString()}</b></div></div></div>
      <section class="shop-section"><h2>Power-ups</h2><div class="panel shop-list">
        ${items.map(item=>`<article class="shop-item"><span class="shop-art ${item.id}">${item.icon}</span><div><b>${item.name}</b><p>${item.description}</p>${item.owned?`<small class="owned-label">${item.ownedLabel}</small>`:""}</div><button class="buy-button" data-buy="${item.id}" ${item.owned||state.gems<item.price?"disabled":""}>${item.owned?"Owned":`◆ ${item.price}`}</button></article>`).join("")}
      </div></section>
      <section class="shop-note"><span>🛍️</span><p>Purchases in this build only change local preview data. Real shop inventory, prices and purchases are controlled by Duolingo's authenticated service.</p></section>
    </main>`;
}

function guidebookScreen() {
  const words = [["Hola","Hello"],["Buenos días","Good morning"],["Buenas tardes","Good afternoon"],["Buenas noches","Good evening"],["¿Cómo estás?","How are you?"],["Me llamo…","My name is…"]];
  return `
    <main class="screen other-screen">
      <div class="page-heading">
        <button class="back-link" data-action="back-learn">‹ <span>Back to learning path</span></button>
        <div class="eyebrow">SECTION 1 · UNIT 1</div><h1>Say hello</h1><p>Key words and grammar for this unit.</p>
      </div>
      <section class="panel guidebook-intro"><span>📖</span><div><b>What you'll learn</b><p>Greet people, ask how someone is, and introduce yourself in Spanish.</p></div></section>
      <section class="panel">
        <div class="panel-title"><b>Key phrases</b><span>6 phrases</span></div>
        ${words.map(w=>`<div class="word-row"><b>${w[0]}</b><span>${w[1]}</span><button data-action="play-word" aria-label="Hear ${w[0]}">🔊</button></div>`).join("")}
      </section>
      <section class="panel guide-tip"><b>💡 Quick tip</b><p>In Spanish, the letter “h” is silent. Hola is pronounced “OH-lah”.</p></section>
      <p class="fine-print">This guidebook is a local sample based on the selected preview unit.</p>
    </main>`;
}

function introScreen() {
  return `
    <main class="welcome-screen">
      <div class="welcome-art" aria-hidden="true">
        <div class="welcome-cloud cloud-left"></div><div class="welcome-cloud cloud-right"></div>
        <div class="welcome-duo">🦉</div>
        <div class="welcome-spark spark-one">✦</div><div class="welcome-spark spark-two">✦</div>
      </div>
      <div class="welcome-brand"><span class="brand-owl">●</span><span>duolingo</span></div>
      <p class="welcome-tagline">The free, fun, and effective way to learn a language!</p>
      <div class="welcome-actions">
        <button class="welcome-primary" data-action="start-learning">GET STARTED</button>
        <button class="welcome-secondary" data-action="show-login">I ALREADY HAVE AN ACCOUNT</button>
      </div>
      <p class="welcome-legal">By continuing, you agree to Duolingo's Terms and Privacy Policy.</p>
    </main>`;
}

function onboardingScreen() {
  const courses = [["🇪🇸","Spanish","Learn Spanish"],["🇫🇷","French","Learn French"],["🇩🇪","German","Learn German"],["🇮🇹","Italian","Learn Italian"],["🇧🇷","Portuguese","Learn Portuguese"],["🇯🇵","Japanese","Learn Japanese"]];
  return `
    <main class="onboarding-screen">
      <header class="onboarding-header"><button class="back-link" data-action="welcome-back">‹</button><div class="onboarding-progress"><i></i></div><span></span></header>
      <div class="onboarding-content">
        <div class="onboarding-duo">🦉</div>
        <div class="eyebrow">LET'S GET STARTED</div><h1>What would you like to learn?</h1>
        <p>Choose a course to start your learning journey.</p>
        <div class="onboarding-course-list">
          ${courses.map(c=>`<button class="onboarding-course ${state.course===c[1]?"chosen":""}" data-course="${c[1]}" data-flag="${c[0]}"><span>${c[0]}</span><b>${c[2]}</b><i>${state.course===c[1]?"✓":"›"}</i></button>`).join("")}
        </div>
      </div>
      <footer class="onboarding-footer"><button class="welcome-primary" data-action="continue-onboarding">CONTINUE</button><small>This starts a local preview. It does not create or sign in to a Duolingo account.</small></footer>
    </main>`;
}

function loginScreen() {
  const phone = state.loginMode === "phone";
  return `
    <main class="signin-screen">
      <header class="signin-header"><button class="back-link" data-action="welcome-back" aria-label="Back">‹</button><div class="signin-wordmark">duolingo</div><span></span></header>
      <section class="signin-content">
        <div class="signin-owl">🦉</div>
        <h1>Welcome back!</h1>
        <p>Sign in to continue learning with Duolingo.</p>
        <div class="signin-mode-tabs">
          <button class="${!phone?"selected":""}" data-action="login-email-mode">Email</button>
          <button class="${phone?"selected":""}" data-action="login-phone-mode">Phone</button>
        </div>
        ${phone ? `
          <label for="login-phone">Phone number</label>
          <input id="login-phone" type="tel" autocomplete="tel" placeholder="Phone number" />
          <label for="login-code">Verification code</label>
          <input id="login-code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="Enter SMS code" />
          <p class="signin-help">Sign in with your verified phone number and SMS code.</p>
        ` : `
          <label for="login-identity">Email, phone, or username</label>
          <input id="login-identity" type="text" autocomplete="username" placeholder="Email, phone, or username" />
          <label for="login-password">Password</label>
          <input id="login-password" type="password" autocomplete="current-password" placeholder="Password" />
          <button class="signin-forgot" data-action="forgot-password">Forgot password?</button>
        `}
        ${state.authError?`<p class="signin-error" role="alert">${escapeHtml(state.authError)}</p>`:""}
        <button class="signin-submit" data-action="login-submit">SIGN IN</button>
        <div class="signin-divider"><span>OR</span></div>
        <button class="signin-provider" data-action="provider-google"><span class="google-g">G</span> CONTINUE WITH GOOGLE</button>
        <button class="signin-provider" data-action="provider-facebook"><span class="facebook-f">f</span> CONTINUE WITH FACEBOOK</button>
        <button class="signin-provider" data-action="provider-wechat"><span class="wechat-mark">微</span> CONTINUE WITH WECHAT</button>
        <p class="signin-footnote">New to Duolingo? <button data-action="start-learning">Get started</button></p>
      </section>
    </main>`;
}

function forgotPasswordScreen() {
  return `
    <main class="signin-screen">
      <header class="signin-header"><button class="back-link" data-action="show-login">‹</button><div class="signin-wordmark">duolingo</div><span></span></header>
      <section class="signin-content forgot-content">
        <div class="signin-owl">🦉</div><h1>Forgot your password?</h1>
        <p>Enter the email address associated with your Duolingo account.</p>
        <label for="reset-email">Email</label><input id="reset-email" type="email" autocomplete="email" placeholder="Email address" />
        ${state.authError?`<p class="signin-error" role="alert">${escapeHtml(state.authError)}</p>`:""}
        <button class="signin-submit" data-action="reset-password-submit">SEND RESET LINK</button>
      </section>
    </main>`;
}

function aboutScreen() {
  return `
    <main class="screen other-screen">
      <div class="page-heading"><button class="back-link" data-action="back-profile">‹ <span>Back to profile</span></button><div class="eyebrow">ABOUT</div><h1>Duolingo Desktop</h1><p>Desktop learning experience inspired by Duolingo for Android.</p></div>
      <section class="panel about-card"><div class="about-owl">🦉</div><b>Duolingo Desktop</b><span>Version 0.1.0 · Tauri 2</span><p>This independent desktop client is under active development. The current screens use local sample data and do not sync with a Duolingo account.</p></section>
      <section class="panel profile-menu"><button data-action="back-learn"><span>🏠</span> Learning path <b>›</b></button><button data-action="settings"><span>⚙️</span> Settings <b>›</b></button></section>
    </main>`;
}

function profileScreen() {
  const achievements = [["🔥","Wildfire","7 day streak"],["⚡","Scholar","Earn XP"],["🏆","Champion","League progress"],["🎯","Sharpshooter","Perfect lessons"]];
  const stats = [["Total XP",state.xp.toLocaleString()],["Day streak",state.streak],["Lessons",state.completedLessons],["Gems",state.gems]];
  const achievementTab = state.profileTab === "achievements";
  return `
    <main class="screen other-screen profile-screen">
      <div class="profile-head">
        <div class="profile-avatar">🦉</div><div><h1>${escapeHtml(state.learnerName)}</h1><p>@local_learner</p><small>Learning ${state.course} ${state.courseFlag}</small></div>
        <button class="icon-button" data-action="settings" aria-label="Settings">⚙</button>
      </div>
      <div class="profile-tabs" role="tablist" aria-label="Profile sections">
        <button role="tab" aria-selected="${achievementTab}" class="${achievementTab?"selected":""}" data-profile-tab="achievements">Achievements</button>
        <button role="tab" aria-selected="${!achievementTab}" class="${!achievementTab?"selected":""}" data-profile-tab="stats">Stats</button>
      </div>
      ${achievementTab ? `
        <section class="profile-section"><div class="profile-section-heading"><b>Achievements</b><span>4 badges</span></div><div class="achievement-grid">${achievements.map(a=>`<div><span>${a[0]}</span><b>${a[1]}</b><small>${a[2]}</small></div>`).join("")}</div></section>
        <section class="profile-section"><div class="profile-section-heading"><b>Learning language</b><span>${state.courseFlag} ${state.course}</span></div><button class="profile-course-row" data-action="course-picker"><span>Change course</span><b>›</b></button></section>
      ` : `
        <section class="profile-stat-grid">${stats.map(s=>`<article><b>${s[1]}</b><span>${s[0]}</span></article>`).join("")}</section>
        <section class="profile-section"><div class="profile-section-heading"><b>Learning activity</b><span>Local preview</span></div><div class="activity-chart">${Array.from({length:28},(_,i)=>`<i style="height:${8+((i*7+state.completedLessons*11)%38)}px"></i>`).join("")}</div><small class="activity-caption">Recent practice activity · sample visualization</small></section>
      `}
      <section class="panel profile-menu">
        <button data-action="settings"><span>⚙️</span> Settings <b>›</b></button>
        <button data-action="guidebook"><span>📖</span> Guidebook <b>›</b></button>
        <button data-action="about"><span>ℹ️</span> About <b>›</b></button>
      </section>
      <p class="fine-print">${state.accountSnapshot?"Connected account ID: "+state.accountSnapshot.userId:"Profile details are local preview data until account profile endpoints are connected."}</p>
    </main>`;
}

function lessonScreen() {
  const q = activeQuestions()[state.question];
  const percent = (state.question / activeQuestions().length) * 100;
  return `
    <main class="lesson-screen">
      <header class="lesson-header">
        <button class="close-lesson" data-action="exit-lesson" aria-label="Exit lesson">×</button>
        <div class="lesson-progress"><i style="width:${percent}%"></i></div>
        <span class="hearts">♥ ${state.hearts}</span>
      </header>
      <section class="question-area">
        <div class="eyebrow">TRANSLATE THIS PHRASE</div>
        <h1>${q.prompt}</h1><p>${q.hint}</p>
        ${q.type === "listen" ? `<button class="listen-card" data-action="play-question" aria-label="Play phrase"><span>🔊</span><b>Tap to listen</b><small>Normal speed</small></button>` : ""}
        ${q.type === "wordbank" ? `<div class="wordbank-answer" aria-label="Your answer">${(Array.isArray(state.answer)?state.answer:[]).map((word,i)=>`<button class="word-chip selected" data-remove-word="${i}" ${state.checked?"disabled":""}>${word}</button>`).join("") || `<span class="word-placeholder">Tap the words below to build your answer</span>`}</div><div class="wordbank-options">${q.bank.map((word,i)=>`<button class="word-chip" data-word="${word}" data-word-index="${i}" ${(Array.isArray(state.answer)&&state.answer.includes(word)&&q.bank.filter(x=>x===word).length===1)||state.checked?"disabled":""}>${word}</button>`).join("")}</div>` : `<div class="answer-list">${q.answers.map(a=>`<button class="answer-option ${state.answer===a?"selected":""} ${state.checked&&a===q.correct?"correct":state.checked&&state.answer===a?"incorrect":""}" data-answer="${a}" ${state.checked?"disabled":""}><span class="answer-dot"></span>${a}</button>`).join("")}</div>`}
      </section>
      ${state.checked ? `<div class="answer-feedback ${isAnswerCorrect(q)?"good":"bad"}"><div class="feedback-title">${isAnswerCorrect(q)?"Excellent!":"Correct answer: "+q.correct}</div><p>${q.note}</p><button class="primary-button" data-action="next-question">${state.question===activeQuestions().length-1?"Finish lesson":"Continue"}</button></div>` :
        `<footer class="lesson-footer"><button class="check-button" data-action="check-answer" ${hasAnswer()?"":"disabled"}>Check</button></footer>`}
    </main>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}

function accountSettingsPanel() {
  if (state.accountSnapshot) {
    const snapshot = state.accountSnapshot;
    const energy = snapshot.energy || {};
    const currentEnergy = energy.energy ?? energy.currentEnergy;
    const maxEnergy = energy.maxEnergy ?? energy.max_energy;
    return `
      <section class="account-connected">
        <div class="account-status"><span class="account-check">✓</span><div><b>Connected to Duolingo</b><small>Android API · user #${snapshot.userId}</small></div></div>
        ${currentEnergy !== undefined ? `<div class="account-energy"><b>${escapeHtml(String(currentEnergy))} / ${escapeHtml(String(maxEnergy ?? "—"))}</b><span>Account energy</span></div>` : ""}
        <p>Read-only account data is connected. Local practice lessons do not submit answers or change your Duolingo progress.</p>
        <div class="account-actions"><button data-action="refresh-account" ${state.accountBusy?"disabled":""}>${state.accountBusy?"Refreshing…":"Refresh account data"}</button><button data-action="disconnect-account">Disconnect</button></div>
        <details class="api-data"><summary>Quests response</summary><pre>${escapeHtml(JSON.stringify(snapshot.quests,null,2).slice(0,6000))}</pre></details>
        <details class="api-data"><summary>Progress response</summary><pre>${escapeHtml(JSON.stringify(snapshot.progress,null,2).slice(0,6000))}</pre></details>
        <details class="api-data"><summary>Schema response</summary><pre>${escapeHtml(JSON.stringify(snapshot.schema,null,2).slice(0,6000))}</pre></details>
        <details class="api-data"><summary>Energy info response</summary><pre>${escapeHtml(JSON.stringify(snapshot.energy,null,2).slice(0,6000))}</pre></details>
        <details class="api-data"><summary>XP summaries response</summary><pre>${escapeHtml(JSON.stringify(snapshot.xpSummaries,null,2).slice(0,6000))}</pre></details>
      </section>`;
  }
  const phone = state.loginMode === "phone";
  return `
    <section class="account-connect android-login">
      <div class="login-duo-mark">🦉</div>
      <h3>Welcome back!</h3>
      <p>Sign in to your Duolingo account to access your learning progress.</p>
      <div class="login-mode-tabs">
        <button class="${!phone?"selected":""}" data-action="login-email-mode">Email</button>
        <button class="${phone?"selected":""}" data-action="login-phone-mode">Phone</button>
      </div>
      ${phone ? `
        <label for="duo-phone">Phone number</label>
        <input id="duo-phone" type="tel" autocomplete="tel" placeholder="Phone number" />
        <label for="duo-sms">Verification code</label>
        <input id="duo-sms" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="SMS verification code" />
        <button class="account-connect-button" data-action="request-phone-code" disabled>Get code · authentication not connected</button>
      ` : `
        <label for="duo-email">Email</label>
        <input id="duo-email" type="email" autocomplete="username" placeholder="Email address" />
        <label for="duo-password">Password</label>
        <input id="duo-password" type="password" autocomplete="current-password" placeholder="Password" />
        <button class="login-forgot" data-action="forgot-password" disabled>Forgot password?</button>
        <button class="account-connect-button" disabled>Sign in · authentication not connected</button>
      `}
      <div class="login-divider"><span>OR</span></div>
      <div class="login-provider-row">
        <button disabled><b class="provider-google">G</b> Google</button>
        <button disabled><b class="provider-facebook">f</b> Facebook</button>
      </div>
      <small class="login-notice">This mirrors the Android sign-in choices, but credential, SMS, Google and Facebook authentication are not wired yet. No password or phone data is sent or stored.</small>
      <details class="developer-session">
        <summary>Developer account-data connection</summary>
        <p>The Android API read-only test can use an existing session token. This is separate from Android's normal sign-in.</p>
        <label for="duo-session-token">Session token</label>
        <input id="duo-session-token" type="password" autocomplete="off" spellcheck="false" placeholder="Paste session JWT" />
        ${state.accountError?`<p class="account-error">${escapeHtml(state.accountError)}</p>`:""}
        <button class="account-connect-button" data-action="connect-account" ${state.accountBusy?"disabled":""}>${state.accountBusy?"Connecting…":"Connect read-only account data"}</button>
      </details>
    </section>`;
}

async function connectAccount(refresh = false) {
  const field = app.querySelector("#duo-session-token");
  const jwt = refresh ? state.accountJwt : (field?.value || "").trim();
  if (!jwt) { state.accountError = "Enter a session token first."; render(); return; }
  state.accountBusy = true;
  state.accountError = "";
  render();
  try {
    const data = await invoke("connect_duolingo_account", {
      jwt,
      uiLanguage: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      startDate: (()=>{const d=new Date();d.setDate(d.getDate()-6);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`})(),
      endDate: (()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`})()
    });
    state.accountJwt = jwt;
    state.accountSnapshot = data;
    state.accountError = "";
  } catch (error) {
    state.accountError = String(error);
    if (refresh) state.accountSnapshot = null;
  } finally {
    state.accountBusy = false;
    render();
  }
}

function overlays() {
  let html = "";
  if (state.sheet) {
    html += `
      <div class="overlay" data-action="dismiss-overlay">
        <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div class="sheet-handle"></div><div class="sheet-art">🌟</div>
          <h2 id="sheet-title">Level ${state.selectedNode+1}</h2>
          <p>Practice greetings, introductions, and everyday phrases in this lesson.</p>
          <div class="sheet-details"><span>⚡ 10 XP</span><span>♥ ${state.hearts} hearts</span><span>⏱ 3 min</span></div>
          <button class="primary-button" data-action="start-lesson" ${state.hearts===0?"disabled":""}>${state.hearts===0?"No hearts available":"Start lesson"}</button>
          ${state.hearts===0?'<button class="text-button" data-action="go-shop">Get hearts in the Shop</button>':""}
          <button class="text-button" data-action="close-sheet">Not now</button>
        </section>
      </div>`;
  }
  if (state.coursePicker) {
    const courses = [["🇪🇸","Spanish"],["🇫🇷","French"],["🇩🇪","German"],["🇯🇵","Japanese"],["🇮🇹","Italian"],["🇧🇷","Portuguese"]];
    html += `
      <div class="overlay" data-action="dismiss-overlay"><section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>Choose a course</h2><button data-action="close-course" class="modal-close">×</button></div>
        <p>Pick the language you want to learn.</p>
        ${courses.map(c=>`<button class="course-option" data-course="${c[1]}" data-flag="${c[0]}"><span>${c[0]}</span><b>${c[1]}</b><span class="course-check">${state.course===c[1]?"✓":""}</span></button>`).join("")}
        <p class="fine-print">Course selection is local preview data; it does not change your Duolingo account.</p>
      </section></div>`;
  }
  if (state.settings) {
    html += `
      <div class="overlay" data-action="dismiss-overlay"><section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>Settings</h2><button data-action="close-settings" class="modal-close">×</button></div>
        <div class="setting-row"><div><b>Lesson audio</b><small>Audio playback is not integrated in this preview</small></div><span class="setting-value">Unavailable</span></div>
        <div class="setting-row"><div><b>Animations</b><small>Show learning path animations</small></div><button class="toggle ${state.animations?"on":""}" data-action="toggle-animations"></button></div>
        <div class="setting-row"><div><b>Account</b><small>Connect to read real account data</small></div><span class="setting-value">${state.accountSnapshot?"Connected":"Not connected"}</span></div>
        ${accountSettingsPanel()}
      </section></div>`;
  }
  if (state.lessonDone) {
    html += `
      <div class="overlay"><section class="bottom-sheet result-sheet" role="dialog" aria-modal="true">
        <div class="result-confetti">${state.lessonFailed?"💔":"🎉"}</div><div class="eyebrow">${state.lessonFailed?"SESSION ENDED":"LESSON COMPLETE"}</div><h2>${state.lessonFailed?"Out of hearts":"Great work!"}</h2><p>${state.lessonFailed?"You ran out of hearts. Try the lesson again to keep progressing.":"You finished this practice session."}</p>
        <div class="result-stats"><div><b>${state.lessonFailed?0:state.correct*2+4}</b><small>XP EARNED</small></div><div><b>${state.correct}/${activeQuestions().length}</b><small>ACCURACY</small></div><div><b>🔥 ${state.streak}</b><small>DAY STREAK</small></div></div>
        <button class="primary-button" data-action="finish-lesson">Continue</button>
      </section></div>`;
  }
  return html;
}

function render() {
  persistState();
  if (state.screen === "intro") { app.innerHTML = introScreen(); bind(); return; }
  if (state.screen === "onboarding") { app.innerHTML = onboardingScreen(); bind(); return; }
  if (state.screen === "login") { app.innerHTML = state.forgotPassword ? forgotPasswordScreen() : loginScreen(); bind(); return; }
  if (state.screen === "lesson") {
    app.innerHTML = lessonScreen() + overlays();
    bind();
    return;
  }
  let content = "";
  switch (state.screen) {
    case "learn": content = learnScreen(); break;
    case "leaderboard": content = leaderboardScreen(); break;
    case "quests": content = questsScreen(); break;
    case "shop": content = shopScreen(); break;
    case "profile": content = profileScreen(); break;
    case "guidebook": content = guidebookScreen(); break;
    case "about": content = aboutScreen(); break;
    default: content = learnScreen();
  }
  app.innerHTML = `
    <div class="app-shell ${state.animations ? "" : "reduce-motion"}">
      ${header()}
      <div class="content-frame" key="${state.screen}">${content}</div>
      ${state.screen === "learn" ? '<button class="path-jump" data-action="jump-current" aria-label="Jump to current lesson">⌄</button>' : ""}
      ${tabs()}
      ${overlays()}
    </div>`;
  persistState();
  bind();
}

function navigate(tab) {
  state.tab = tab;
  state.screen = tab;
  render();
}

function startLesson() {
  state.sheet = false;
  state.screen = "lesson";
  state.question = 0;
  state.answer = null;
  state.checked = false;
  state.correct = 0;
  state.lessonFailed = false;
  state.lessonDone = false;
  render();
}

function nextQuestion() {
  if (state.hearts === 0) { state.lessonFailed = true; state.lessonDone = true; render(); return; }
  if (state.question === activeQuestions().length - 1) {
    state.lessonDone = true;
    recordPracticeDay();
    const earnedXp = (state.correct * 2 + 4) * (state.doubleXp?2:1);
    state.xp += earnedXp;
    state.doubleXp = false;
    state.questXp += earnedXp;
    state.questLessons += 1;
  } else {
    state.question += 1;
    state.answer = null;
    state.checked = false;
  }
  render();
}

function bind() {
  const scrollFrame = app.querySelector(".content-frame");
  const jumpButton = app.querySelector(".path-jump");
  if (scrollFrame && jumpButton) scrollFrame.addEventListener("scroll", () => jumpButton.classList.toggle("visible", scrollFrame.scrollTop > 160), {passive:true});
  app.querySelectorAll("[data-tab]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.tab)));
  app.querySelectorAll("[data-quest-tab]").forEach(el => el.addEventListener("click", () => { state.questTab=el.dataset.questTab; render(); }));
  app.querySelectorAll("[data-profile-tab]").forEach(el => el.addEventListener("click", () => { state.profileTab=el.dataset.profileTab; render(); }));
  app.querySelectorAll("[data-node]").forEach(el => el.addEventListener("click", () => {
    state.selectedNode = Number(el.dataset.node);
    state.sheet = true;
    render();
  }));
  app.querySelectorAll("[data-answer]").forEach(el => el.addEventListener("click", () => {
    if (!state.checked) { state.answer = el.dataset.answer; render(); }
  }));
  app.querySelectorAll("[data-word]").forEach(el => el.addEventListener("click", () => {
    if (!state.checked) { state.answer = [...(Array.isArray(state.answer)?state.answer:[]), el.dataset.word]; render(); }
  }));
  app.querySelectorAll("[data-remove-word]").forEach(el => el.addEventListener("click", () => {
    if (!state.checked) { const words = [...(Array.isArray(state.answer)?state.answer:[])]; words.splice(Number(el.dataset.removeWord),1); state.answer = words; render(); }
  }));
  app.querySelectorAll("[data-buy]").forEach(el => el.addEventListener("click", () => {
    const item=el.dataset.buy;
    const costs={freeze:200,double:50,hearts:350};
    const cost=costs[item];
    if (!cost || state.gems<cost) return;
    if (item==="freeze") state.streakFreezes+=1;
    if (item==="double") state.doubleXp=true;
    if (item==="hearts") state.hearts=5;
    state.gems-=cost;
    render();
  }));
  app.querySelectorAll("[data-course]").forEach(el => el.addEventListener("click", () => {
    state.course = el.dataset.course;
    state.courseFlag = el.dataset.flag;
    state.coursePicker = false;
    render();
  }));
  app.querySelectorAll("[data-action]").forEach(el => el.addEventListener("click", event => {
    const action = el.dataset.action;
    if (action === "dismiss-overlay" && event.target !== el) return;
    switch (action) {
      case "course-picker": state.coursePicker = true; break;
      case "close-course": state.coursePicker = false; break;
      case "dismiss-overlay": state.sheet = false; state.coursePicker = false; state.settings = false; break;
      case "close-sheet": state.sheet = false; break;
      case "guidebook": state.settings = false; state.sheet = false; state.screen = "guidebook"; break;
      case "settings": state.settings = true; break;
      case "close-settings": state.settings = false; break;
      case "toggle-animations": state.animations = !state.animations; break;
      case "start-learning": state.screen="onboarding"; state.forgotPassword=false; state.authError=""; break;
      case "show-login": state.screen="login"; state.forgotPassword=false; state.authError=""; break;
      case "welcome-back": state.screen="intro"; state.forgotPassword=false; state.authError=""; break;
      case "continue-onboarding": state.screen="learn"; state.tab="learn"; break;
      case "login-email-mode": state.loginMode="email"; state.authError=""; break;
      case "login-phone-mode": state.loginMode="phone"; state.authError=""; break;
      case "forgot-password": state.forgotPassword=true; state.authError=""; break;
      case "login-submit": state.authError="Credential sign-in is not connected yet. Your details have not been sent. Use the separate developer account-data connection in Settings only if you already have a session token."; break;
      case "reset-password-submit": state.authError="Password-reset delivery is not connected yet. No email has been sent."; break;
      case "provider-google": case "provider-facebook": case "provider-wechat": state.authError="This sign-in provider is not configured in the desktop client yet."; break;
      case "connect-account": connectAccount(false); return;
      case "refresh-account": connectAccount(true); return;
      case "disconnect-account": state.accountJwt=""; state.accountSnapshot=null; state.accountError=""; state.screen="intro"; break;
      case "start-lesson": startLesson(); return;
      case "check-answer":
        if (hasAnswer()) {
          state.checked = true;
          if (isAnswerCorrect(activeQuestions()[state.question])) {
            state.correct += 1;
            state.correctInRow += 1;
            state.questStreak = Math.max(state.questStreak, state.correctInRow);
          } else {
            state.hearts = Math.max(0, state.hearts - 1);
            state.correctInRow = 0;
          }
        }
        break;
      case "next-question": nextQuestion(); return;
      case "exit-lesson":
        if (window.confirm("Leave this lesson? Your local practice progress will be lost.")) { state.screen = "learn"; state.tab = "learn"; state.answer = null; state.checked = false; }
        break;
      case "finish-lesson":
        state.lessonDone = false; state.screen = "learn"; state.tab = "learn"; state.answer = null; state.checked = false; if (!state.lessonFailed) { state.completedLessons = Math.min(6, state.completedLessons + 1); state.selectedNode = state.completedLessons; } state.lessonFailed = false;
        break;
      case "jump-current": app.querySelector("[data-node=\"2\"]")?.scrollIntoView({behavior:"smooth",block:"center"}); return;
      case "streak": state.screen = "profile"; state.tab = "profile"; break;
      case "gems": state.screen = "shop"; state.tab = "shop"; break;
      case "go-shop": state.sheet=false; state.screen="shop"; state.tab="shop"; break;
      case "earn-gems": state.screen="quests"; state.tab="quests"; break;
      case "buy-freeze": case "buy-double": case "buy-hearts":
        window.alert("Choose an item in the Shop to purchase it with preview gems."); return;
      case "about": state.screen = "about"; break;
      case "back-learn": state.screen = "learn"; state.tab = "learn"; break;
      case "back-profile": state.screen = "profile"; state.tab = "profile"; break;
      case "play-question": speakSpanish(activeQuestions()[state.question].spoken || activeQuestions()[state.question].correct); return;
      case "play-word": {
        const phrase = el.closest(".word-row")?.querySelector("b")?.textContent || "Hola";
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = state.course === "Japanese" ? "ja-JP" : state.course === "French" ? "fr-FR" : state.course === "German" ? "de-DE" : state.course === "Italian" ? "it-IT" : state.course === "Portuguese" ? "pt-BR" : "es-ES";
          window.speechSynthesis.speak(utterance);
        } else {
          window.alert("Speech playback is not available on this device.");
        }
        return;
      }
    }
    render();
  }));
}

render();
