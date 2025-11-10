import { initParticles, toggleParticles, toggleParticleMode } from '../../globalassets/js/particles.js';

window.addEventListener("DOMContentLoaded", () => {
  emailjs.init("GahAe28-OZFZT7Z4F");

  // -------------------- Theme Selector --------------------
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const selectBtn = themeToggle.querySelector(".select-btn");
  const options = themeToggle.querySelectorAll(".option");
  const customSection = document.getElementById("customThemeSection");
  const customBg1 = document.getElementById("customBg1");
  const customBg2 = document.getElementById("customBg2");
  const customBgImg = document.getElementById("customBgImg");
  const applyCustomBtn = document.getElementById("applyCustomTheme");

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "default";
  root.className = savedTheme;
  selectBtn.textContent = savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1);

  let savedCustom = {};
  try { savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}"); } catch { }

  function applyCustomTheme() {
    const bg1 = customBg1.value || "";
    const bg2 = customBg2.value || "";
    const bgImg = customBgImg.value.trim() || "";

    if (bg1) root.style.setProperty("--background-c1", bg1);
    else root.style.removeProperty("--background-c1");

    if (bg2) root.style.setProperty("--background-c2", bg2);
    else root.style.removeProperty("--background-c2");

    if (bgImg.startsWith("data:")) {
      document.body.style.backgroundImage = `url(${bgImg})`;
    } else {
      root.style.setProperty("--background-img", bgImg ? `url(${bgImg})` : "none");
    }

    localStorage.setItem("theme", "custom");
    localStorage.setItem("customTheme", JSON.stringify({ bg1, bg2, bgImg }));
    if (typeof initParticles === "function") initParticles();
  }

  function initCustomTheme() {
    customSection.style.display = "flex";
    customBg1.value = savedCustom.bg1 || "#ffffff";
    customBg2.value = savedCustom.bg2 || "#000000";
    customBgImg.value = savedCustom.bgImg || "";
    applyCustomTheme();
  }

  if (savedTheme === "custom") initCustomTheme();
  else customSection.style.display = "none";

  // Dropdown
  selectBtn.addEventListener("click", e => { themeToggle.classList.toggle("active"); e.stopPropagation(); });
  document.addEventListener("click", e => { if (!themeToggle.contains(e.target)) themeToggle.classList.remove("active"); });

  options.forEach(option => {
    option.addEventListener("click", e => {
      const selected = option.dataset.value;
      selectBtn.textContent = option.textContent;
      themeToggle.classList.remove("active");
      root.className = selected;

      if (selected === "custom") initCustomTheme();
      else {
        customSection.style.display = "none";
        root.style.removeProperty("--background-c1");
        root.style.removeProperty("--background-c2");
        root.style.removeProperty("--background-img");
        document.body.style.backgroundImage = "";
        localStorage.setItem("theme", selected);
        initParticles();
      }
      e.stopPropagation();
    });
  });

  if (applyCustomBtn) applyCustomBtn.addEventListener("click", applyCustomTheme);
  [customBg1, customBg2, customBgImg].forEach(input => input.addEventListener("input", applyCustomTheme));

  // -------------------- Particle Buttons --------------------
  const toggleParticlesBtn = document.getElementById('toggleParticlesBtn');
  const toggleModeBtn = document.getElementById('toggleModeBtn');

  if (toggleParticlesBtn) toggleParticlesBtn.addEventListener('click', () => toggleParticles());
  if (toggleModeBtn) toggleModeBtn.addEventListener('click', () => {
    toggleParticleMode();
    toggleModeBtn.textContent = localStorage.getItem("particleMode") === "normal" ? "Switch to Gooey Blobs" : "Switch to Normal Particles";
  });

  // -------------------- Bug Report --------------------
  const bugReportButton = document.getElementById("bugReportButton");
  const bugForm = document.getElementById("bugReportFormContainer");
  const submitBug = document.getElementById("submitBug");
  const cancelBug = document.getElementById("cancelBug");
  const bugDescription = document.getElementById("bugDescription");
  const bugEmail = document.getElementById("bugEmail");
  const bugFeedback = document.getElementById("bugFeedback");

  bugReportButton.addEventListener("click", () => { bugForm.style.display = "flex"; bugReportButton.style.display = "none"; });
  cancelBug.addEventListener("click", () => {
    bugForm.style.display = "none";
    bugReportButton.style.display = "block";
    bugDescription.value = ""; bugEmail.value = ""; bugFeedback.style.display = "none";
  });

  submitBug.addEventListener("click", async () => {
    const description = bugDescription.value.trim();
    const email = bugEmail.value.trim();
    if (!description) { bugFeedback.style.display = "block"; bugFeedback.style.color = "red"; bugFeedback.textContent = "Please describe the bug!"; return; }

    try {
      await emailjs.send("service_08aesw4", "template_1cis1r8", { title: "Bug Report", message: description, email, name: email, time: new Date().toLocaleString() });
      bugFeedback.style.display = "block"; bugFeedback.style.color = "lime"; bugFeedback.textContent = "Bug report sent! Thank you!";
      setTimeout(() => { bugForm.style.display = "none"; bugReportButton.style.display = "block"; bugDescription.value = ""; bugEmail.value = ""; bugFeedback.style.display = "none"; }, 2000);
    } catch (err) { bugFeedback.style.display = "block"; bugFeedback.style.color = "red"; bugFeedback.textContent = "Failed to send bug report."; console.error(err); }
  });

  // -------------------- Local Storage Display --------------------
  const showStorageBtn = document.getElementById("showStorageBtn");
  const clearStorageBtn = document.getElementById("clearStorageBtn");
  const localStorageDisplay = document.getElementById("localStorageDisplay");

  function generateTable() {
    const keys = Object.keys(localStorage).filter(k => !k.startsWith("IodineGBA") && !k.startsWith("eruda"));
    if (!keys.length) { localStorageDisplay.innerHTML = "<div>Local Storage is empty.</div>"; return; }

    const table = document.createElement("table");
    const header = document.createElement("tr");
    const thKey = document.createElement("th"); thKey.textContent = "Key";
    const thValue = document.createElement("th"); thValue.textContent = "Value";
    header.appendChild(thKey); header.appendChild(thValue); table.appendChild(header);

    keys.forEach(key => {
      const row = document.createElement("tr");
      const tdKey = document.createElement("td"); tdKey.textContent = key;
      const tdValue = document.createElement("td");
      const fullValue = localStorage.getItem(key) || "";
      const shortValue = fullValue.length > 50 ? fullValue.slice(0, 50) + "…" : fullValue;
      const span = document.createElement("span"); span.textContent = shortValue; span.style.cursor = "pointer";

      span.addEventListener("click", () => {
        const input = document.createElement("textarea");
        input.value = fullValue;
        input.style.width = "100%"; input.style.height = "100px";
        tdValue.innerHTML = ""; tdValue.appendChild(input); input.focus();
        input.addEventListener("blur", () => { localStorage.setItem(key, input.value); generateTable(); });
        input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) input.blur(); });
      });

      tdValue.appendChild(span); row.appendChild(tdKey); row.appendChild(tdValue); table.appendChild(row);
    });

    localStorageDisplay.innerHTML = ""; localStorageDisplay.appendChild(table);
  }

  showStorageBtn.addEventListener("click", () => {
    if (localStorageDisplay.innerHTML.trim()) { localStorageDisplay.innerHTML = ""; showStorageBtn.textContent = "Show Local Storage"; }
    else { showStorageBtn.textContent = "Hide Local Storage"; generateTable(); }
  });

  clearStorageBtn.addEventListener("click", () => {
    const input = prompt('Type "delete" to clear all local storage. Only your userID will stay:');
    if (input?.toLowerCase() === "delete") {
      const userID = localStorage.getItem("userID");
      localStorage.clear();
      if (userID) localStorage.setItem("userID", userID);
      localStorageDisplay.innerHTML = ""; alert("Local Storage cleared.");
    } else alert("Action canceled.");
  });
});
