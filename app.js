const KEY = "learning_apps_v1";

const defaultState = {
  name: "Player",
  avatarName: null,
  avatarEmoji: "🙂",
  points: 0,
  streak: 0,
  dailyGoal: 5,
  dailyCount: 0,
  correct: 0,
  total: 0,
  selectedContinent: "ALL"
};

let state = loadState();
let currentQuestion = null;

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  }catch{
    return { ...defaultState };
  }
}
function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }

const $ = (id) => document.getElementById(id);

const screens = {
  loading: "screen-loading",
  welcome: "screen-welcome",
  avatar: "screen-avatar",
  home: "screen-home",
  map: "screen-map",
  learn: "screen-learn",
  quiz: "screen-quiz",
  rewards: "screen-rewards"
};

function show(screenKey){
  Object.values(screens).forEach(id => $(id).classList.remove("active"));
  $(screens[screenKey]).classList.add("active");
}

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function formatPopulation(n){
  if(n >= 1000000000) return `${(n/1000000000).toFixed(1)}B`;
  if(n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  return `${n}`;
}

function popRange(n){
  if(n < 10000000) return "Under 10M";
  if(n < 50000000) return "10M–50M";
  if(n < 150000000) return "50M–150M";
  if(n < 300000000) return "150M–300M";
  return "300M+";
}

function filteredCountries(){
  if(state.selectedContinent === "ALL") return countries;
  return countries.filter(c => c.continent === state.selectedContinent);
}

function updateHeader(){
  $("playerName").textContent = state.name || "Player";
  $("avatarName").textContent = state.avatarName || "—";
  $("avatarEmoji").textContent = state.avatarEmoji || "🙂";
  $("points").textContent = String(state.points);
  $("streak").textContent = String(state.streak);
  $("daily").textContent = `${state.dailyCount}/${state.dailyGoal}`;
}

function openSettings(){
  $("nameInput").value = state.name || "";
  $("dailyGoal").value = String(state.dailyGoal || 5);
  $("settingsModal").classList.remove("hidden");
}
function closeSettings(){
  $("settingsModal").classList.add("hidden");
}
function saveSettings(){
  const name = $("nameInput").value.trim();
  state.name = name ? name : "Player";
  state.dailyGoal = Number($("dailyGoal").value || 5);
  if(state.dailyCount > state.dailyGoal) state.dailyCount = state.dailyGoal;
  saveState();
  updateHeader();
  closeSettings();
}

function renderContinentFilter(){
  const sel = $("filterContinent");
  sel.innerHTML = `<option value="ALL">All Continents</option>`;
  CONTINENTS.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  sel.value = state.selectedContinent || "ALL";
}

function renderLearn(){
  const list = $("learnCards");
  const data = filteredCountries();

  $("learnTitle").textContent = state.selectedContinent === "ALL"
    ? "Learn"
    : `Learn • ${state.selectedContinent}`;

  list.innerHTML = "";
  data.forEach(c=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="flag">${c.flag}</div>
      <h3>${c.country}</h3>
      <div class="kv"><b>Capital:</b> ${c.capital}</div>
      <div class="kv"><b>Language:</b> ${c.language}</div>
      <div class="kv"><b>Continent:</b> ${c.continent}</div>
      <div class="kv"><b>Currency:</b> ${c.currency}</div>
      <div class="kv"><b>Population:</b> ${formatPopulation(c.population)}</div>
      <div class="fact"><b>Fun fact:</b> ${c.funFact}</div>
    `;
    list.appendChild(div);
  });
}

function rewardsFor(points){
  return [
    { name:"Starter Star", need: 50, emoji:"⭐" },
    { name:"Quiz Champ", need: 150, emoji:"🏅" },
    { name:"World Explorer", need: 300, emoji:"🗺️" },
    { name:"Globe Master", need: 600, emoji:"🌍" },
  ].map(b => ({...b, unlocked: points >= b.need}));
}

function renderRewards(){
  const root = $("rewardsList");
  const badges = rewardsFor(state.points);
  root.innerHTML = "";
  badges.forEach(b=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="flag">${b.emoji}</div>
      <h3>${b.name}</h3>
      <div class="kv"><b>Unlock at:</b> ${b.need} points</div>
      <div class="kv"><b>Status:</b> ${b.unlocked ? "✅ Unlocked" : "🔒 Locked"}</div>
    `;
    root.appendChild(div);
  });
}

// QUIZ
function buildQuestion(mode){
  const pool = filteredCountries();
  const correct = pick(pool);

  const base = { correct, mode };

  if(mode === "flag_country"){
    const choices = shuffle([correct.country, ...shuffle(pool.filter(x=>x.country!==correct.country)).slice(0,3).map(x=>x.country)]);
    return { ...base, prompt: `Which country has this flag? ${correct.flag}`, answer: correct.country, choices };
  }
  if(mode === "country_capital"){
    const choices = shuffle([correct.capital, ...shuffle(pool.filter(x=>x.country!==correct.country)).slice(0,3).map(x=>x.capital)]);
    return { ...base, prompt: `What is the capital of ${correct.country}?`, answer: correct.capital, choices };
  }
  if(mode === "country_continent"){
    const choices = shuffle([correct.continent, ...shuffle(CONTINENTS.filter(x=>x!==correct.continent)).slice(0,3)]);
    return { ...base, prompt: `Which continent is ${correct.country} in?`, answer: correct.continent, choices };
  }
  if(mode === "country_language"){
    const langs = [...new Set(pool.map(x=>x.language))];
    const wrong = shuffle(langs.filter(x=>x!==correct.language)).slice(0,3);
    const choices = shuffle([correct.language, ...wrong]);
    return { ...base, prompt: `Which language is most associated with ${correct.country}?`, answer: correct.language, choices };
  }
  if(mode === "country_currency"){
    const currencies = [...new Set(pool.map(x=>x.currency))];
    const wrong = shuffle(currencies.filter(x=>x!==correct.currency)).slice(0,3);
    const choices = shuffle([correct.currency, ...wrong]);
    return { ...base, prompt: `What currency is used in ${correct.country}?`, answer: correct.currency, choices };
  }

  // population range
  const ranges = ["Under 10M","10M–50M","50M–150M","150M–300M","300M+"];
  const answer = popRange(correct.population);
  const wrong = shuffle(ranges.filter(x=>x!==answer)).slice(0,3);
  const choices = shuffle([answer, ...wrong]);
  return { ...base, prompt: `Population range for ${correct.country}?`, answer, choices };
}

function renderQuestion(){
  $("quizFeedback").textContent = "";
  $("quizPrompt").textContent = currentQuestion.prompt;
  const root = $("quizChoices");
  root.innerHTML = "";
  currentQuestion.choices.forEach(ch=>{
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = ch;
    b.addEventListener("click", ()=> grade(ch, b));
    root.appendChild(b);
  });
}

function awardCorrect(){
  state.correct += 1;
  state.total += 1;
  state.streak += 1;
  state.points += 10;
  if(state.dailyCount < state.dailyGoal) state.dailyCount += 1;
}

function awardWrong(){
  state.total += 1;
  state.streak = 0;
}

function grade(choice, btn){
  const buttons = Array.from(document.querySelectorAll("#quizChoices .choice"));
  buttons.forEach(b=> b.disabled = true);

  if(choice === currentQuestion.answer){
    btn.classList.add("correct");
    $("quizFeedback").textContent = "✅ Correct! +10 points";
    awardCorrect();
  }else{
    btn.classList.add("wrong");
    $("quizFeedback").textContent = `❌ Correct answer: ${currentQuestion.answer}`;
    awardWrong();
  }

  saveState();
  updateHeader();
  renderRewards();

  setTimeout(()=>{
    currentQuestion = buildQuestion($("quizMode").value);
    renderQuestion();
  }, 700);
}

// NAV + EVENTS
function wireButtons(){
  // back buttons
  document.querySelectorAll("[data-back]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const target = b.getAttribute("data-back");
      show(target);
    });
  });

  // settings open buttons
  ["btnOpenSettings1","btnOpenSettings2","btnOpenSettings3","btnOpenSettings4","btnOpenSettings5","btnOpenSettings6","btnOpenSettings7"]
    .forEach(id => $(id).addEventListener("click", openSettings));
  $("btnCloseSettings").addEventListener("click", closeSettings);
  $("btnSaveSettings").addEventListener("click", saveSettings);

  $("settingsModal").addEventListener("click", (e)=>{
    if(e.target.id === "settingsModal") closeSettings();
  });

  $("btnChangeAvatar").addEventListener("click", ()=>{
    closeSettings();
    show("avatar");
  });

  $("btnReset").addEventListener("click", ()=>{
    state.points = 0;
    state.streak = 0;
    state.dailyCount = 0;
    state.correct = 0;
    state.total = 0;
    saveState();
    updateHeader();
    renderRewards();
    closeSettings();
  });

  // Start flow
  $("btnStart").addEventListener("click", ()=>{
    if(state.avatarName) show("home");
    else show("avatar");
  });

  // avatar choose
  document.querySelectorAll(".avatarCard").forEach(card=>{
    card.addEventListener("click", ()=>{
      state.avatarName = card.dataset.avatar;
      state.avatarEmoji = card.dataset.emoji;
      saveState();
      updateHeader();
      show("home");
    });
  });

  // menu
  $("goMap").addEventListener("click", ()=> show("map"));
  $("goLearn").addEventListener("click", ()=> { show("learn"); renderLearn(); });
  $("goQuiz").addEventListener("click", ()=>{
    show("quiz");
    currentQuestion = buildQuestion($("quizMode").value);
    renderQuestion();
  });
  $("goRewards").addEventListener("click", ()=> { show("rewards"); renderRewards(); });

  // map continent buttons
  document.querySelectorAll(".continentBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      state.selectedContinent = btn.dataset.continent;
      saveState();
      renderContinentFilter();
      renderLearn();
      show("learn");
    });
  });

  // learn filter
  $("filterContinent").addEventListener("change", ()=>{
    state.selectedContinent = $("filterContinent").value;
    saveState();
    renderLearn();
  });

  $("btnQuickQuiz").addEventListener("click", ()=>{
    show("quiz");
    currentQuestion = buildQuestion($("quizMode").value);
    renderQuestion();
  });

  // quiz new question
  $("btnNewQ").addEventListener("click", ()=>{
    currentQuestion = buildQuestion($("quizMode").value);
    renderQuestion();
  });

  $("quizMode").addEventListener("change", ()=>{
    currentQuestion = buildQuestion($("quizMode").value);
    renderQuestion();
  });
}

function init(){
  updateHeader();
  renderContinentFilter();
  renderRewards();
  wireButtons();

  show("loading");
  setTimeout(()=>{
    if(state.avatarName) show("home");
    else show("welcome");
  }, 900);
}

document.addEventListener("DOMContentLoaded", init);
