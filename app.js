const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "learning_app_v1";

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    return {
      points:0, streak:0,
      correct:0, total:0,
      dailyGoal:5, dailyDone:0, dailyDate: todayKey(),
      weekly: { date: null, done:false, score:0, total:0 }
    };
  }
  return JSON.parse(raw);
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// reset daily if date changed
function refreshDaily(){
  const t = todayKey();
  if(state.dailyDate !== t){
    state.dailyDate = t;
    state.dailyDone = 0;
    saveState();
  }
}

function updateTopStats(){
  refreshDaily();
  $("points").textContent = state.points;
  $("streak").textContent = state.streak;
  $("daily").textContent = `${state.dailyDone}/${state.dailyGoal}`;
}

function setTab(tab){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  $(`tab-${tab}`).classList.add("active");
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=> setTab(btn.dataset.tab));
});

// LEARN
function renderCards(filter=""){
  const q = filter.trim().toLowerCase();
  const list = window.COUNTRIES.filter(c => c.country.toLowerCase().includes(q));
  const cards = $("cards");
  cards.innerHTML = "";
  list.forEach(c=>{
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <div class="flag">${c.flag}</div>
      <h3>${c.country}</h3>
      <p class="kv"><b>Capital:</b> ${c.capital}</p>
      <p class="kv"><b>Language:</b> ${c.language}</p>
      <p class="kv"><b>Continent:</b> ${c.continent}</p>
      <p class="kv"><b>Currency:</b> ${c.currency}</p>
      <span class="pill">Tap “Quiz” to test</span>
    `;
    cards.appendChild(el);
  });
}

$("search").addEventListener("input", (e)=> renderCards(e.target.value));
$("btn-random-card").addEventListener("click", ()=>{
  const pick = window.COUNTRIES[Math.floor(Math.random()*window.COUNTRIES.length)];
  $("search").value = pick.country;
  renderCards(pick.country);
});

renderCards();

// QUIZ
let quizMode = null; // "flag" | "capital"
let currentQ = null;
let locked = false;

function shuffle(arr){
  return arr.map(v=>({v, r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
}

function pickChoices(correctText, field){
  // field is "country" or "capital"
  const pool = window.COUNTRIES.map(c=>c[field]);
  const wrong = shuffle(pool.filter(x=>x !== correctText)).slice(0,3);
  return shuffle([correctText, ...wrong]);
}

function makeQuestion(){
  const c = window.COUNTRIES[Math.floor(Math.random()*window.COUNTRIES.length)];
  if(quizMode === "flag"){
    return {
      prompt: `Which country has this flag?  <span style="font-size:42px">${c.flag}</span>`,
      answer: c.country,
      choices: pickChoices(c.country, "country"),
      reward: 10
    };
  }
  if(quizMode === "capital"){
    return {
      prompt: `What is the capital of <b>${c.country}</b>?`,
      answer: c.capital,
      choices: pickChoices(c.capital, "capital"),
      reward: 10
    };
  }
  return null;
}

function renderQuestion(){
  locked = false;
  currentQ = makeQuestion();
  $("quiz-prompt").innerHTML = currentQ.prompt;
  $("quiz-feedback").textContent = "";
  $("quiz-choices").innerHTML = "";

  currentQ.choices.forEach(text=>{
    const b = document.createElement("button");
    b.className = "choice";
    b.innerHTML = text;
    b.addEventListener("click", ()=> chooseAnswer(b, text));
    $("quiz-choices").appendChild(b);
  });

  $("btn-skip").disabled = false;
  $("btn-next").disabled = true;
}

function award(correct){
  refreshDaily();

  state.total += 1;
  state.dailyDone = Math.min(state.dailyGoal, state.dailyDone + 1);

  if(correct){
    state.correct += 1;
    state.points += currentQ.reward;

    // streak logic: streak increments when you answer at least 1/day (we count dailyDone)
    // simple: if dailyDone becomes 1, keep streak (already handled daily reset). If it resets, streak drops.
    // We'll treat "streak" as consecutive days with at least 1 correct answer.
  }

  saveState();
  updateTopStats();
  renderProgress();
  checkBadges();
}

function streakOnCorrect(){
  // streak = consecutive days with at least 1 correct
  // store lastCorrectDate in weekly field to avoid new key
  const key = "lastCorrectDate";
  if(!state[key]) state[key] = null;

  const t = todayKey();
  if(state[key] === t) return; // already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;

  if(state[key] === yKey){
    state.streak += 1;
  } else {
    state.streak = 1;
  }
  state[key] = t;
  saveState();
  updateTopStats();
}

function chooseAnswer(btn, value){
  if(locked) return;
  locked = true;

  const all = Array.from(document.querySelectorAll(".choice"));
  all.forEach(x=> x.disabled = true);

  const correct = value === currentQ.answer;

  all.forEach(x=>{
    if(x.textContent === currentQ.answer) x.classList.add("correct");
  });

  if(!correct) btn.classList.add("wrong");

  if(correct){
    $("quiz-feedback").textContent = `✅ Correct! +${currentQ.reward} points`;
    award(true);
    streakOnCorrect();
  } else {
    $("quiz-feedback").textContent = `❌ Not quite. Correct: ${currentQ.answer}`;
    award(false);
  }

  $("btn-next").disabled = false;
}

$("mode-flag").addEventListener("click", ()=>{
  quizMode = "flag";
  renderQuestion();
});
$("mode-capital").addEventListener("click", ()=>{
  quizMode = "capital";
  renderQuestion();
});

$("btn-skip").addEventListener("click", ()=>{
  if(!currentQ) return;
  $("quiz-feedback").textContent = "Skipped.";
  award(false);
  renderQuestion();
});
$("btn-next").addEventListener("click", ()=>{
  if(!currentQ) return;
  renderQuestion();
});

// PROGRESS
function renderProgress(){
  $("correct").textContent = state.correct;
  $("total").textContent = state.total;
  const acc = state.total ? Math.round((state.correct/state.total)*100) : 0;
  $("accuracy").textContent = `${acc}%`;

  if(state.weekly.done){
    $("weekly-status").textContent = `Done ✅ Score: ${state.weekly.score}/${state.weekly.total}`;
  } else {
    $("weekly-status").textContent = "Not started";
  }
}

function checkBadges(){
  const badges = [];
  if(state.points >= 50) badges.push("⭐ Starter (50 points)");
  if(state.points >= 200) badges.push("🌟 Explorer (200 points)");
  if(state.streak >= 3) badges.push("🔥 3-day streak");
  if(state.streak >= 7) badges.push("🏆 7-day streak");
  if(state.correct >= 25) badges.push("🎯 25 correct answers");
  if(state.correct >= 100) badges.push("🧠 100 correct answers");

  const ul = $("badges");
  ul.innerHTML = "";
  if(badges.length === 0){
    const li = document.createElement("li");
    li.textContent = "No badges yet — keep going!";
    ul.appendChild(li);
    return;
  }
  badges.forEach(b=>{
    const li = document.createElement("li");
    li.textContent = b;
    ul.appendChild(li);
  });
}

renderProgress();
checkBadges();

// Weekly test (10 questions)
let weeklyActive = false;
let weeklyCount = 0;
let weeklyScore = 0;

$("btn-weekly").addEventListener("click", ()=>{
  setTab("quiz");
  quizMode = "flag";
  weeklyActive = true;
  weeklyCount = 0;
  weeklyScore = 0;
  $("quiz-feedback").textContent = "Weekly test started (10 questions).";
  renderQuestion();
});

function finishWeekly(){
  weeklyActive = false;
  state.weekly = { date: todayKey(), done:true, score: weeklyScore, total: 10 };
  state.points += weeklyScore * 5; // bonus
  saveState();
  updateTopStats();
  renderProgress();
  checkBadges();
  $("quiz-feedback").textContent = `Weekly test finished ✅ Score ${weeklyScore}/10 (+${weeklyScore*5} bonus points)`;
}

// hook into award to track weekly
const originalAward = award;
award = function(correct){
  originalAward(correct);
  if(weeklyActive){
    weeklyCount += 1;
    if(correct) weeklyScore += 1;
    if(weeklyCount >= 10) finishWeekly();
  }
};

// SETTINGS
$("daily-goal").value = state.dailyGoal;

$("btn-save-settings").addEventListener("click", ()=>{
  const val = Number($("daily-goal").value || 5);
  state.dailyGoal = Math.max(1, Math.min(50, val));
  saveState();
  updateTopStats();
  alert("Saved ✅");
});

$("btn-reset").addEventListener("click", ()=>{
  if(confirm("Reset points, streak, progress?")){
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    $("daily-goal").value = state.dailyGoal;
    updateTopStats();
    renderProgress();
    checkBadges();
    renderCards();
    $("quiz-prompt").textContent = "Pick a mode to start.";
    $("quiz-choices").innerHTML = "";
    $("quiz-feedback").textContent = "";
  }
});

updateTopStats();
