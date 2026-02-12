// ---------- STORAGE ----------
const KEY = "learningApp_v1";

const defaultState = {
  screen: "loading",
  name: "Player",
  character: null,
  points: 0,
  streak: 0,
  dailyCount: 0,
  dailyGoal: 5,
  correct: 0,
  total: 0
};

let state = loadState();
let currentQuiz = null;

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return {...defaultState};
    return { ...defaultState, ...JSON.parse(raw) };
  }catch{
    return {...defaultState};
  }
}
function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }

function $(id){ return document.getElementById(id); }

function show(screenId){
  const map = {
    loading:"screen-loading",
    welcome:"screen-welcome",
    character:"screen-character",
    home:"screen-home",
    learn:"screen-learn",
    quiz:"screen-quiz",
    progress:"screen-progress"
  };
  const target = map[screenId];
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(target).classList.add("active");
  state.screen = screenId;
  saveState();
}

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function avatarEmojiFor(name){
  const map = {
    Explorer:"🧭",
    Wizard:"🧙‍♂️",
    Ninja:"🥷",
    Princess:"👸",
    Robot:"🤖",
    Superhero:"🦸‍♀️"
  };
  return map[name] || "🙂";
}

function updateUI(){
  $("points").textContent = String(state.points);
  $("streak").textContent = String(state.streak);
  $("daily").textContent = `${state.dailyCount}/${state.dailyGoal}`;
  $("correct").textContent = String(state.correct);
  $("total").textContent = String(state.total);

  const acc = state.total === 0 ? 0 : Math.round((state.correct/state.total)*100);
  $("accuracy").textContent = `${acc}%`;

  $("playerName").textContent = state.name || "Player";
  $("characterName").textContent = state.character || "—";
  $("avatar").textContent = avatarEmojiFor(state.character);
}

function openSettings(){
  $("nameInput").value = state.name || "";
  $("dailyGoalSelect").value = String(state.dailyGoal || 5);
  $("settingsModal").classList.remove("hidden");
}
function closeSettings(){
  $("settingsModal").classList.add("hidden");
}
function saveSettings(){
  const name = $("nameInput").value.trim();
  state.name = name ? name : "Player";
  state.dailyGoal = Number($("dailyGoalSelect").value || 5);
  if(state.dailyCount > state.dailyGoal) state.dailyCount = state.dailyGoal;
  saveState();
  updateUI();
  closeSettings();
}

// ---------- LEARN ----------
function renderLearnCards(){
  const root = $("cards");
  root.innerHTML = "";
  countries.forEach(c=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="flag">${c.flag}</div>
      <h3>${c.country}</h3>
      <p class="kv"><b>Capital:</b> ${c.capital}</p>
      <p class="kv"><b>Language:</b> ${c.language}</p>
      <p class="kv"><b>Continent:</b> ${c.continent}</p>
    `;
    root.appendChild(div);
  });
}

// ---------- QUIZ ----------
const QUIZ_MODES = [
  { key:"flag_to_country", label:"Flag → Country" },
  { key:"country_to_capital", label:"Country → Capital" },
  { key:"country_to_continent", label:"Country → Continent" },
  { key:"country_to_language", label:"Country → Language" }
];

function renderQuizModeButtons(){
  $("quiz-prompt").textContent = "Choose a quiz mode:";
  $("quiz-feedback").textContent = "";
  const choices = $("quiz-choices");
  choices.innerHTML = "";
  QUIZ_MODES.forEach(m=>{
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = m.label;
    b.addEventListener("click", ()=> startQuiz(m.key));
    choices.appendChild(b);
  });
}

function buildQuestion(modeKey){
  const correct = pickRandom(countries);

  if(modeKey === "flag_to_country"){
    return {
      modeKey,
      prompt: `What country is this flag?  ${correct.flag}`,
      answer: correct.country,
      choices: shuffle([
        correct.country,
        ...shuffle(countries.filter(x=>x.country!==correct.country)).slice(0,3).map(x=>x.country)
      ])
    };
  }

  if(modeKey === "country_to_capital"){
    return {
      modeKey,
      prompt: `What is the capital of ${correct.country}?`,
      answer: correct.capital,
      choices: shuffle([
        correct.capital,
        ...shuffle(countries.filter(x=>x.country!==correct.country)).slice(0,3).map(x=>x.capital)
      ])
    };
  }

  if(modeKey === "country_to_continent"){
    const pool = shuffle([...new Set(countries.map(x=>x.continent))]);
    const wrong = shuffle(pool.filter(x=>x!==correct.continent)).slice(0,3);
    return { modeKey, prompt:`Which continent is ${correct.country} in?`, answer:correct.continent, choices:shuffle([correct.continent,...wrong]) };
  }

  const pool = shuffle([...new Set(countries.map(x=>x.language))]);
  const wrong = shuffle(pool.filter(x=>x!==correct.language)).slice(0,3);
  return { modeKey, prompt:`What language is most associated with ${correct.country}?`, answer:correct.language, choices:shuffle([correct.language,...wrong]) };
}

function startQuiz(modeKey){
  currentQuiz = buildQuestion(modeKey);
  renderQuizQuestion();
}

function renderQuizQuestion(){
  $("quiz-prompt").textContent = currentQuiz.prompt;
  $("quiz-feedback").textContent = "";
  const choicesEl = $("quiz-choices");
  choicesEl.innerHTML = "";

  currentQuiz.choices.forEach(choice=>{
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = choice;
    b.addEventListener("click", ()=> gradeAnswer(choice, b));
    choicesEl.appendChild(b);
  });
}

function gradeAnswer(choice, btn){
  state.total += 1;

  const buttons = Array.from(document.querySelectorAll("#quiz-choices .choice"));
  buttons.forEach(b=>b.disabled = true);

  if(choice === currentQuiz.answer){
    btn.classList.add("correct");
    state.correct += 1;
    state.streak += 1;
    state.points += 10;
    if(state.dailyCount < state.dailyGoal) state.dailyCount += 1;
    $("quiz-feedback").textContent = "✅ Correct! +10 points";
  } else {
    btn.classList.add("wrong");
    state.streak = 0;
    $("quiz-feedback").textContent = `❌ Correct: ${currentQuiz.answer}`;
  }

  saveState();
  updateUI();

  setTimeout(()=>{
    currentQuiz = buildQuestion(currentQuiz.modeKey);
    renderQuizQuestion();
  }, 700);
}

// ---------- NAV (HOME BUTTONS) ----------
function setupNav(){
  // Start flow
  $("btn-start").addEventListener("click", ()=>{
    if(state.character) show("home");
    else show("character");
  });

  // character pick
  document.querySelectorAll(".char").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      state.character = btn.dataset.char;
      saveState();
      updateUI();
      show("home");
    });
  });
  $("btn-character-back").addEventListener("click", ()=> show("welcome"));

  // home tiles
  $("go-learn").addEventListener("click", ()=> show("learn"));
  $("go-quiz").addEventListener("click", ()=> { show("quiz"); renderQuizModeButtons(); });
  $("go-progress").addEventListener("click", ()=> show("progress"));
  $("go-characters").addEventListener("click", ()=> show("character"));

  // back buttons
  document.querySelectorAll("[data-back]").forEach(b=>{
    b.addEventListener("click", ()=> show("home"));
  });

  // settings open buttons
  ["btn-settings-open-1","btn-settings-open-2","btn-settings-open-3","btn-settings-open-4","btn-settings-open-5","btn-settings-open-6"]
    .forEach(id => $(id).addEventListener("click", openSettings));

  $("btn-settings-close").addEventListener("click", closeSettings);
  $("btn-settings-save").addEventListener("click", saveSettings);

  $("btn-go-character").addEventListener("click", ()=>{
    closeSettings();
    show("character");
  });

  $("btn-reset").addEventListener("click", ()=>{
    state.points = 0;
    state.streak = 0;
    state.dailyCount = 0;
    state.correct = 0;
    state.total = 0;
    saveState();
    updateUI();
    closeSettings();
  });

  // close modal if tap outside
  $("settingsModal").addEventListener("click", (e)=>{
    if(e.target.id === "settingsModal") closeSettings();
  });
}

// ---------- INIT ----------
function init(){
  updateUI();
  renderLearnCards();
  setupNav();

  // Splash screen for 1.2s, then go to welcome/home based on saved state
  show("loading");
  setTimeout(()=>{
    if(state.character) show("home");
    else show("welcome");
  }, 1200);
}

document.addEventListener("DOMContentLoaded", init);
