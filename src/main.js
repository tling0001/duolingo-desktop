import "./style.css";

const app = document.querySelector("#app");

const state = {
  screen: "learn",
  tab: "learn",
  course: "Spanish",
  courseFlag: "🇪🇸",
  streak: 7,
  gems: 120,
  xp: 640,
  selectedNode: 2,
  sheet: false,
  coursePicker: false,
  settings: false,
  question: 0,
  answer: null,
  checked: false,
  correct: 0,
  lessonDone: false,
  sound: true,
  animations: true,
};

const questions = [
  { prompt: "How do you say “hello”?", hint: "Select the correct translation", answers: ["Hola", "Gracias", "Adiós", "Por favor"], correct: "Hola", note: "Hola means hello." },
  { prompt: "Translate “the water”", hint: "Choose the Spanish phrase", answers: ["El pan", "El agua", "La leche", "El café"], correct: "El agua", note: "Agua is feminine, but uses “el” in the singular." },
  { prompt: "Choose the correct sentence", hint: "I eat bread", answers: ["Yo bebo pan", "Yo como pan", "Yo tengo pan", "Yo quiero agua"], correct: "Yo como pan", note: "Como is the first-person form of comer (to eat)." },
  { prompt: "What does “gracias” mean?", hint: "Select the English meaning", answers: ["Good morning", "Please", "Thank you", "Excuse me"], correct: "Thank you", note: "Gracias means thank you." },
  { prompt: "Complete the phrase: “Buenos ___”", hint: "Good morning", answers: ["noches", "días", "tardes", "amigos"], correct: "días", note: "Buenos días is the common greeting for good morning." },
];

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
    ["learn", "Learn"], ["leaderboard", "League"], ["quests", "Quests"], ["shop", "Shop"], ["profile", "Profile"],
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
  const done = node.type === "done";
  const active = node.type === "active";
  const locked = node.type === "locked";
  const chest = node.type === "chest";
  const cls = [ "path-node", node.side || "center", node.type ].join(" ");
  const icon = chest ? "🎁" : done ? "★" : locked ? "🔒" : node.type === "legendary" ? "👑" : "★";
  const label = chest ? "Unit chest" : node.type === "legendary" ? "Legendary" : `Level ${index + 1}`;
  return `
    <div class="node-row ${node.side || "center"}">
      <div class="node-wrap">
        <button class="${cls}" data-node="${index}" aria-label="${label}" ${locked ? "disabled" : ""}>
          <span class="node-symbol">${icon}</span>
          ${active ? '<span class="node-shine"></span>' : ""}
        </button>
        ${active ? '<span class="node-caption">START</span>' : ""}
      </div>
      ${chest ? '<span class="node-label">Unit chest</span>' : ""}
    </div>`;
}

function learnScreen() {
  const nodes = [
    { type:"done", side:"center" },
    { type:"done", side:"left" },
    { type:"active", side:"center" },
    { type:"locked", side:"right" },
    { type:"chest", side:"center" },
    { type:"locked", side:"left" },
    { type:"locked", side:"center" },
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
  const people = [
    ["🥇","Sofia","2,840 XP","you are 2,200 XP behind"],
    ["🥈","Lucas","2,410 XP",""],
    ["🥉","Mia","1,980 XP",""],
    ["4","Oliver","1,540 XP",""],
    ["5","Ava","1,320 XP",""],
    ["6","You","640 XP",""],
  ];
  return `
    <main class="screen other-screen">
      <div class="page-heading"><div class="eyebrow">WEEKLY LEAGUE</div><h1>Amethyst League</h1><p>Earn XP to climb the leaderboard.</p></div>
      <section class="league-banner"><div class="league-gem">💎</div><div><b>Top 10 advance</b><span>Finish in the top 10 to move up a league.</span></div></section>
      <section class="panel">
        <div class="panel-title"><b>Leaderboard</b><span>Ends in 3d 14h</span></div>
        ${people.map(p=>`<div class="person-row ${p[1]==="You"?"you":""}"><span class="rank">${p[0]}</span><span class="person-avatar">${p[1]==="You"?"🦉":"👤"}</span><span class="person-name">${p[1]} ${p[1]==="You"?"(You)":""}</span><b class="person-xp">${p[2]}</b></div>`).join("")}
      </section>
      <p class="fine-print">League standings shown here are sample data in this local preview.</p>
    </main>`;
}

function questsScreen() {
  const quests = [
    ["⭐","Earn 20 XP","Earn 20 XP in lessons","12 / 20",60],
    ["🎯","Get 5 in a row","Answer 5 questions correctly in a row","3 / 5",60],
    ["📚","Complete 2 lessons","Finish any 2 learning sessions","1 / 2",50],
  ];
  return `
    <main class="screen other-screen">
      <div class="page-heading"><div class="eyebrow">DAILY GOALS</div><h1>Quests</h1><p>A little practice goes a long way.</p></div>
      <section class="quest-summary"><div class="quest-ring"><b>2</b><small>/ 3</small></div><div><b>Daily Quests</b><span>Complete your quests to earn gems.</span></div><span class="reward">◆ 40</span></section>
      <section class="panel quest-list">${quests.map(q=>`<article class="quest-row"><span class="quest-icon">${q[0]}</span><div class="quest-info"><b>${q[1]}</b><span>${q[2]}</span><div class="progress-track"><i style="width:${q[4]}%"></i></div><small>${q[3]}</small></div><span class="quest-reward">◆ ${q[4]===60?10:15}</span></article>`).join("")}</section>
      <section class="streak-card"><span>🔥</span><div><b>${state.streak}-day streak</b><p>You're building a great learning habit. Come back tomorrow!</p></div></section>
    </main>`;
}

function shopScreen() {
  return `
    <main class="screen other-screen">
      <div class="page-heading"><div class="eyebrow">POWER UP YOUR LEARNING</div><h1>Shop</h1><p>Get helpful items for your learning journey.</p></div>
      <section class="gems-balance"><span class="gem big">◆</span><div><small>YOUR GEM BALANCE</small><b>${state.gems}</b></div><button data-action="earn-gems">Earn gems</button></section>
      <section class="panel shop-list">
        <article class="shop-item"><span class="shop-art">🧊</span><div><b>Streak Freeze</b><p>Protect your streak for one missed day.</p><small>Available in the official app</small></div><button class="buy-button" data-action="buy-freeze">◆ 200</button></article>
        <article class="shop-item"><span class="shop-art">⏱️</span><div><b>Double or Nothing</b><p>Make a gem wager to keep your streak.</p><small>Preview item</small></div><button class="buy-button" data-action="buy-double">◆ 50</button></article>
        <article class="shop-item"><span class="shop-art">💚</span><div><b>Heart refill</b><p>Get back to learning with full hearts.</p><small>Preview item</small></div><button class="buy-button" data-action="buy-hearts">◆ 350</button></article>
      </section>
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

function aboutScreen() {
  return `
    <main class="screen other-screen">
      <div class="page-heading"><button class="back-link" data-action="back-profile">‹ <span>Back to profile</span></button><div class="eyebrow">ABOUT</div><h1>Duolingo Desktop</h1><p>Desktop learning experience inspired by Duolingo for Android.</p></div>
      <section class="panel about-card"><div class="about-owl">🦉</div><b>Duolingo Desktop</b><span>Version 0.1.0 · Tauri 2</span><p>This independent desktop client is under active development. The current screens use local sample data and do not sync with a Duolingo account.</p></section>
      <section class="panel profile-menu"><button data-action="back-learn"><span>🏠</span> Learning path <b>›</b></button><button data-action="settings"><span>⚙️</span> Settings <b>›</b></button></section>
    </main>`;
}

function profileScreen() {
  return `
    <main class="screen other-screen">
      <div class="profile-head">
        <div class="profile-avatar">🦉</div><div><h1>Learner</h1><p>@duolingo_learner</p><small>Learning ${state.course} 🇪🇸</small></div>
        <button class="icon-button" data-action="settings" aria-label="Settings">⚙</button>
      </div>
      <section class="profile-stats panel">
        <div><b>${state.xp}</b><span>Total XP</span></div><div><b>${state.streak}</b><span>Day streak</span></div><div><b>1</b><span>League</span></div>
      </section>
      <section class="panel achievement-panel"><div class="panel-title"><b>Achievements</b><span>View all</span></div><div class="achievement-grid"><div>🔥<small>Wildfire</small></div><div>⚡<small>Scholar</small></div><div>🏆<small>Champion</small></div><div>🎯<small>Sharpshooter</small></div></div></section>
      <section class="panel profile-menu">
        <button data-action="settings"><span>⚙️</span> Settings <b>›</b></button>
        <button data-action="guidebook"><span>📖</span> Guidebook <b>›</b></button>
        <button data-action="about"><span>ℹ️</span> About <b>›</b></button>
      </section>
      <p class="fine-print">This profile is a local preview. Sign-in and account sync are not connected.</p>
    </main>`;
}

function lessonScreen() {
  const q = questions[state.question];
  const percent = (state.question / questions.length) * 100;
  return `
    <main class="lesson-screen">
      <header class="lesson-header">
        <button class="close-lesson" data-action="exit-lesson" aria-label="Exit lesson">×</button>
        <div class="lesson-progress"><i style="width:${percent}%"></i></div>
        <span class="hearts">♥ 5</span>
      </header>
      <section class="question-area">
        <div class="eyebrow">TRANSLATE THIS PHRASE</div>
        <h1>${q.prompt}</h1><p>${q.hint}</p>
        <div class="question-illustration">${state.question===0?"👋":state.question===1?"💧":state.question===2?"🍞":state.question===3?"💬":"🌞"}</div>
        <div class="answer-list">${q.answers.map(a=>`<button class="answer-option ${state.answer===a?"selected":""} ${state.checked&&a===q.correct?"correct":state.checked&&state.answer===a?"incorrect":""}" data-answer="${a}" ${state.checked?"disabled":""}><span class="answer-dot"></span>${a}</button>`).join("")}</div>
      </section>
      ${state.checked ? `<div class="answer-feedback ${state.answer===q.correct?"good":"bad"}"><div class="feedback-title">${state.answer===q.correct?"Excellent!":"Correct answer: "+q.correct}</div><p>${q.note}</p><button class="primary-button" data-action="next-question">${state.question===questions.length-1?"Finish lesson":"Continue"}</button></div>` :
        `<footer class="lesson-footer"><button class="check-button" data-action="check-answer" ${state.answer===null?"disabled":""}>Check</button></footer>`}
    </main>`;
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
          <div class="sheet-details"><span>⚡ 10 XP</span><span>♥ 5 hearts</span><span>⏱ 3 min</span></div>
          <button class="primary-button" data-action="start-lesson">Start +10 XP</button>
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
        <div class="setting-row"><div><b>Sound effects</b><small>Play sounds during lessons</small></div><button class="toggle ${state.sound?"on":""}" data-action="toggle-sound"></button></div>
        <div class="setting-row"><div><b>Animations</b><small>Show learning path animations</small></div><button class="toggle ${state.animations?"on":""}" data-action="toggle-animations"></button></div>
        <div class="setting-row"><div><b>Account</b><small>Account sign-in is not connected yet</small></div><span class="setting-value">Preview</span></div>
      </section></div>`;
  }
  if (state.lessonDone) {
    html += `
      <div class="overlay"><section class="bottom-sheet result-sheet" role="dialog" aria-modal="true">
        <div class="result-confetti">🎉</div><div class="eyebrow">LESSON COMPLETE</div><h2>You're on a roll!</h2><p>You finished this practice session.</p>
        <div class="result-stats"><div><b>+${state.correct*2+4}</b><small>XP EARNED</small></div><div><b>${state.correct}/5</b><small>ACCURACY</small></div><div><b>🔥 ${state.streak+1}</b><small>DAY STREAK</small></div></div>
        <button class="primary-button" data-action="finish-lesson">Continue</button>
      </section></div>`;
  }
  return html;
}

function render() {
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
    case "profile": content = profileScreen(); break;\n    case "guidebook": content = guidebookScreen(); break;\n    case "about": content = aboutScreen(); break;
    default: content = learnScreen();
  }
  app.innerHTML = `
    <div class="app-shell">
      ${header()}
      <div class="content-frame" key="${state.screen}">${content}</div>
      ${tabs()}
      ${overlays()}
    </div>`;
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
  state.lessonDone = false;
  render();
}

function nextQuestion() {
  if (state.question === questions.length - 1) {
    state.lessonDone = true;
    state.streak += 1;
    state.xp += state.correct * 2 + 4;
  } else {
    state.question += 1;
    state.answer = null;
    state.checked = false;
  }
  render();
}

function bind() {
  app.querySelectorAll("[data-tab]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.tab)));
  app.querySelectorAll("[data-node]").forEach(el => el.addEventListener("click", () => {
    state.selectedNode = Number(el.dataset.node);
    state.sheet = true;
    render();
  }));
  app.querySelectorAll("[data-answer]").forEach(el => el.addEventListener("click", () => {
    if (!state.checked) { state.answer = el.dataset.answer; render(); }
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
      case "toggle-sound": state.sound = !state.sound; break;
      case "toggle-animations": state.animations = !state.animations; break;
      case "start-lesson": startLesson(); return;
      case "check-answer":
        if (state.answer !== null) { state.checked = true; if (state.answer === questions[state.question].correct) state.correct += 1; }
        break;
      case "next-question": nextQuestion(); return;
      case "exit-lesson":
        if (window.confirm("Leave this lesson? Your local practice progress will be lost.")) { state.screen = "learn"; state.tab = "learn"; state.answer = null; state.checked = false; }
        break;
      case "finish-lesson":
        state.lessonDone = false; state.screen = "learn"; state.tab = "learn"; state.answer = null; state.checked = false; state.selectedNode = 3;
        break;
      case "streak": state.screen = "profile"; state.tab = "profile"; break;
      case "gems": state.screen = "shop"; state.tab = "shop"; break;
      case "earn-gems": window.alert("Gems are earned by completing lessons and quests in Duolingo. This preview does not connect to an account."); return;
      case "buy-freeze": case "buy-double": case "buy-hearts":
        window.alert("Purchases are disabled in this local preview. No gems have been spent."); return;
      case "about": state.screen = "about"; break;\n      case "back-learn": state.screen = "learn"; state.tab = "learn"; break;\n      case "back-profile": state.screen = "profile"; state.tab = "profile"; break;\n      case "play-word": window.alert("Audio playback will be added with the lesson audio integration."); return;
    }
    render();
  }));
}

render();
