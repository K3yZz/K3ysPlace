function displayTime() {
  const now = new Date();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekday = weekdays[now.getDay()];
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const formattedTime = now.toLocaleTimeString();
  const time = `${weekday} ${day}/${month}/${year} ${formattedTime}`;
  document.getElementById("timeText").textContent = time;
}

function assignID() {
  if (!localStorage.getItem("userID")) {
    const userID = "user-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("userID", userID);
  }
}

//* mainpage stuff idk
const versionUpdates = {
  "1.3.3":
    "<br>- Added music player - Added over 600 new games. <br>- New emulator. <br>- New particle effect.",
  "1.3.2":
    "- Added a password wall.<br>- Redesigned dropdowns.<br>-Added notification to save in emulator.<br>-Modified changelog and worklog.<br>-Game/app buttons are hardcoded for faster loading.<br>-New theme.<br>-Images for emulator and download.<br>-New rom games in downloads.",
  "1.3.1": "- Fixed custom theme not persisting.",
  "1.3.0": "- New design.<br>- Added new games and a new app.",
};

const worklogUpdates = {
  TODO: "🎁 Upcoming Features: <br> - Complete Casino overhaul with new games and improved UI. <br>- Add more apps to the platform. <br>",
  "Known Problems":
    "🚫 Known Issues:<br>-Loading for ported games is a bit odd. <br>- Custom image background not working. <br>- Stockmarket dropdowns broken design wise?",
};

// --- Version Select ---
const versionSelect = document.getElementById("version-select-container");
const versionBtn = versionSelect.querySelector(".select-btn");
const versionOptions = versionSelect.querySelectorAll(".option");
const versionDetails = document.getElementById("version-details");

versionDetails.innerHTML =
  versionUpdates[versionOptions[0].dataset.value] || "";

versionBtn.addEventListener("click", () => {
  versionSelect.classList.toggle("active");
});

versionOptions.forEach((option) => {
  option.addEventListener("click", () => {
    versionBtn.textContent = option.textContent;
    versionDetails.innerHTML = versionUpdates[option.dataset.value] || "";
    versionSelect.classList.remove("active");
  });
});

document.addEventListener("click", (e) => {
  if (!versionSelect.contains(e.target)) {
    versionSelect.classList.remove("active");
  }
});

// --- Work Log Select ---
const worklogSelect = document.getElementById("worklog-select-container");
const worklogBtn = worklogSelect.querySelector(".select-btn");
const worklogOptions = worklogSelect.querySelectorAll(".option");
const worklogDetails = document.getElementById("worklog-details");

worklogDetails.innerHTML = worklogUpdates["TODO"];

worklogBtn.addEventListener("click", () => {
  worklogSelect.classList.toggle("active");
});

worklogOptions.forEach((option) => {
  option.addEventListener("click", () => {
    worklogBtn.textContent = option.textContent;
    if (option.dataset.value === "TODO") {
      worklogDetails.innerHTML = worklogUpdates["TODO"];
    } else {
      worklogDetails.innerHTML = worklogUpdates["Known Problems"];
    }
    worklogSelect.classList.remove("active");
  });
});

document.addEventListener("click", (e) => {
  if (!worklogSelect.contains(e.target)) {
    worklogSelect.classList.remove("active");
  }
});

//* --- Password ---
const passwordWall = document.getElementById("passwordWallContainer");
const passwordLogin = document.getElementById("passwordLogin");
const stayLoggedIn = document.getElementById("stayLoggedIn");
const loginButton = document.getElementById("loginButton");

// === CONFIG ===
const CURRENT_PASSWORD = "lemon"; // your new password
const PASSWORD_VERSION = "v2"; // change this whenever password changes

function handleLogin() {
  const password = passwordLogin.value.trim();
  if (password === CURRENT_PASSWORD) {
    passwordWall.style.display = "none";
    if (stayLoggedIn.checked) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("passwordVersion", PASSWORD_VERSION);
    } else {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("passwordVersion");
    }
  } else {
    alert("Incorrect password!");
  }
}

loginButton.addEventListener("click", handleLogin);

passwordLogin.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

// === AUTO LOGIC ON PAGE LOAD ===
const storedLoggedIn = localStorage.getItem("loggedIn") === "true";
const storedVersion = localStorage.getItem("passwordVersion");

if (storedLoggedIn && storedVersion === PASSWORD_VERSION) {
  passwordWall.style.display = "none";
} else {
  // force logout if old password version
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("passwordVersion");
  passwordWall.style.display = "flex";
}

assignID();
displayTime();
setInterval(displayTime, 1000);
