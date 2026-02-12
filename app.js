// ---------- STATE ----------
const state = {
  points: 0,
  streak: 0,
  dailyCount: 0,
  dailyGoal: 5,
  correct: 0,
  total: 0
};

let currentQuiz = null;

// ---------- HELPERS ----------
function $(id){ return document.getElementById(id); }

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function pickRandom(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function updateStats(){
  $("points").textContent = String(state.points);
  $("streak").textContent = String(state.streak);
  $("daily").textContent = `${state.dailyCount}/${state.dailyGoal}`;
  $("correct").textContent = String(state.correct);
  $("total").textContent = String(state.total);

  const acc = state.total === 0 ? 0 : Math.round((state.correct / state.total) * 100);
  $("accuracy").textContent = `${acc}%`;
}

// ---------- TABS ----------
function setupTabs(){
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      tabs.forEach(t=>t.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
      const tabName = btn.dataset.tab;
      const panel = document.getElementById(`tab-${tabName}`);
      if(panel) panel.classList.add("active");
    });
  });
}

// ---------- LEARN CARDS ----------
function renderLearnCards(){
  const root = $("cards");
  if(!root) return;

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
  const choices = $("quiz-choices");
  const prompt = $("quiz-prompt");
  if(!choices || !prompt) return;

  prompt.textContent = "Choose a quiz mode:";
  choices.innerHTML = "";

  QUIZ_MODES.forEach(m=>{
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = m.label;
    b.addEventListener("click", ()=> startQuiz(m.key));
    choices.appendChild(b);
  });

  $("quiz-feedback").textContent = "";
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
    return {
      modeKey,
      prompt: `Which continent is ${correct.country} in?`,
      answer: correct.continent,
      choices: shuffle([correct.continent, ...wrong])
    };
  }

  if(modeKey === "country_to_language"){
    const pool = shuffle([...new Set(countries.map(x=>x.language))]);
    const wrong = shuffle(pool.filter(x=>x!==correct.language)).slice(0,3);
    return {
      modeKey,
      prompt: `What language is most associated with ${correct.country}?`,
      answer: correct.language,
      choices: shuffle([correct.language, ...wrong])
    };
  }

  return null;
}

function startQuiz(modeKey){
  currentQuiz = buildQuestion(modeKey);
  renderQuizQuestion();
}

function renderQuizQuestion(){
  const choicesEl = $("quiz-choices");
  const promptEl = $("quiz-prompt");
  const feedback = $("quiz-feedback");

  if(!currentQuiz || !choicesEl || !promptEl) return;

  promptEl.textContent = currentQuiz.prompt;
  feedback.textContent = "";
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
  const feedback = $("quiz-feedback");
  state.total += 1;

  const buttons = Array.from(document.querySelectorAll("#quiz-choices .choice"));
  buttons.forEach(b=>b.disabled = true);

  if(choice === currentQuiz.answer){
    btn.classList.add("correct");
    state.correct += 1;
    state.streak += 1;
    state.points += 10;

    // daily progress
    if(state.dailyCount < state.dailyGoal) state.dailyCount += 1;

    feedback.textContent = `✅ Correct! +10 points`;
  } else {
    btn.classList.add("wrong");
    state.streak = 0;
    feedback.textContent = `❌ Not quite. Correct: ${currentQuiz.answer}`;
  }

  updateStats();

  // next question after short pause
  setTimeout(()=>{
    currentQuiz = buildQuestion(currentQuiz.modeKey);
    renderQuizQuestion();
  }, 800);
}

// ---------- INIT ----------
function init(){
  setupTabs();
  renderLearnCards();
  renderQuizModeButtons();
  updateStats();
}

document.addEventListener("DOMContentLoaded", init);
