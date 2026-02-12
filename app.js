const screens = {
  loading: document.getElementById("loading"),
  welcome: document.getElementById("welcome"),
  home: document.getElementById("home"),
};

function show(screenName) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[screenName].classList.add("active");
}

// START FLOW
document.addEventListener("DOMContentLoaded", () => {
  // Always show loading first
  show("loading");

  // Move to welcome after loading
  setTimeout(() => {
    show("welcome");
  }, 1200);
});

// BUTTONS
document.getElementById("startBtn").addEventListener("click", () => {
  show("home");
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  alert("Settings screen coming next 👀");
});
