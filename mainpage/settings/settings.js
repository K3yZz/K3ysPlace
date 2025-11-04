window.addEventListener("DOMContentLoaded", () => {
  emailjs.init("GahAe28-OZFZT7Z4F");

  // -------------------- Theme Selector --------------------
  function initThemeSettings() {
    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const customSection = document.getElementById("customThemeSection");
    const customBg1 = document.getElementById("customBg1");
    const customBg2 = document.getElementById("customBg2");
    const customBgImg = document.getElementById("customBgImg");
    const applyCustomBtn = document.getElementById("applyCustomTheme");

    const savedTheme = localStorage.getItem("theme") || "default";
    root.className = savedTheme;
    if (themeToggle) themeToggle.value = savedTheme;

    let savedCustom = {};
    try {
      savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}");
    } catch (e) {}

    if (savedTheme === "custom") {
      customSection.style.display = "flex";
      if (savedCustom.bg1)
        root.style.setProperty("--background-c1", savedCustom.bg1);
      if (savedCustom.bg2)
        root.style.setProperty("--background-c2", savedCustom.bg2);
      if (savedCustom.bgImg) {
        if (savedCustom.bgImg.startsWith("data:")) {
          document.body.style.backgroundImage = `url(${savedCustom.bgImg})`;
        } else {
          root.style.setProperty(
            "--background-img",
            `url(${savedCustom.bgImg})`
          );
        }
      }
      customBg1.value = savedCustom.bg1 || "#ffffff";
      customBg2.value = savedCustom.bg2 || "#000000";
      customBgImg.value = savedCustom.bgImg || "";
    } else {
      customSection.style.display = "none";
      root.style.removeProperty("--background-c1");
      root.style.removeProperty("--background-c2");
      root.style.removeProperty("--background-img");
    }

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
        root.style.setProperty(
          "--background-img",
          bgImg ? `url(${bgImg})` : "none"
        );
      }

      localStorage.setItem("theme", "custom");
      localStorage.setItem("customTheme", JSON.stringify({ bg1, bg2, bgImg }));

      if (typeof initParticles === "function") initParticles();
    }

    if (themeToggle) {
      themeToggle.addEventListener("change", () => {
        const selectedTheme = themeToggle.value;
        root.className = selectedTheme;

        if (selectedTheme === "custom") {
          customSection.style.display = "flex";
          const saved = JSON.parse(localStorage.getItem("customTheme") || "{}");
          customBg1.value = saved.bg1 || "#ffffff";
          customBg2.value = saved.bg2 || "#000000";
          customBgImg.value = saved.bgImg || "";
          applyCustomTheme();
        } else {
          customSection.style.display = "none";
          root.style.removeProperty("--background-c1");
          root.style.removeProperty("--background-c2");
          root.style.removeProperty("--background-img");
          document.body.style.backgroundImage = "";
          localStorage.setItem("theme", selectedTheme);
        }

        if (typeof initParticles === "function") initParticles();
      });
    }

    if (applyCustomBtn)
      applyCustomBtn.addEventListener("click", applyCustomTheme);

    [customBg1, customBg2, customBgImg].forEach((input) =>
      input.addEventListener("input", applyCustomTheme)
    );
  }

  initThemeSettings();

  // -------------------- Bug Report --------------------
  function setupBugReport() {
    const bugReportButton = document.getElementById("bugReportButton");
    const bugReportFormContainer = document.getElementById(
      "bugReportFormContainer"
    );
    const submitBug = document.getElementById("submitBug");
    const cancelBug = document.getElementById("cancelBug");
    const bugDescription = document.getElementById("bugDescription");
    const bugEmail = document.getElementById("bugEmail");
    const bugFeedback = document.getElementById("bugFeedback");

    bugReportButton.addEventListener("click", () => {
      bugReportFormContainer.style.display = "flex";
      bugReportButton.style.display = "none";
    });

    cancelBug.addEventListener("click", () => {
      bugReportFormContainer.style.display = "none";
      bugReportButton.style.display = "block";
      bugDescription.value = "";
      bugEmail.value = "";
      bugFeedback.style.display = "none";
    });

    submitBug.addEventListener("click", async () => {
      const description = bugDescription.value.trim();
      const email = bugEmail.value.trim();

      if (!description) {
        bugFeedback.style.display = "block";
        bugFeedback.style.color = "red";
        bugFeedback.textContent = "Please describe the bug!";
        return;
      }

      try {
        await emailjs.send("service_08aesw4", "template_1cis1r8", {
          title: "Bug Report",
          message: description,
          email: email,
          name: email,
          time: new Date().toLocaleString(),
        });

        bugFeedback.style.display = "block";
        bugFeedback.style.color = "lime";
        bugFeedback.textContent = "Bug report sent! Thank you!";
        setTimeout(() => {
          bugReportFormContainer.style.display = "none";
          bugReportButton.style.display = "block";
          bugDescription.value = "";
          bugEmail.value = "";
          bugFeedback.style.display = "none";
        }, 2000);
      } catch (err) {
        bugFeedback.style.display = "block";
        bugFeedback.style.color = "red";
        bugFeedback.textContent = "Failed to send bug report.";
        console.error(err);
      }
    });
  }

  setupBugReport();

  // -------------------- Local Storage --------------------
  const showStorageBtn = document.getElementById("showStorageBtn");
  const clearStorageBtn = document.getElementById("clearStorageBtn");
  const localStorageDisplay = document.getElementById("localStorageDisplay");

  function generateTable() {
    const keys = Object.keys(localStorage).filter(
      (key) =>
        !key.startsWith("IodineGBA") &&
        !key.startsWith("GA::") &&
        !key.startsWith("eruda")
    );

    if (!keys.length) {
      localStorageDisplay.innerHTML =
        "<div>Local Storage is empty (no visible keys).</div>";
      return;
    }

    const table = document.createElement("table");
    const header = document.createElement("tr");
    const thKey = document.createElement("th");
    thKey.textContent = "Key";
    const thValue = document.createElement("th");
    thValue.textContent = "Value";
    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "⟳";
    refreshBtn.style.marginLeft = "5px";
    thValue.appendChild(refreshBtn);
    header.appendChild(thKey);
    header.appendChild(thValue);
    table.appendChild(header);

    keys.forEach((key) => {
      const row = document.createElement("tr");
      const tdKey = document.createElement("td");
      tdKey.textContent = key;
      const tdValue = document.createElement("td");

      const fullValue = localStorage.getItem(key) || "";
      const shortValue =
        fullValue.length > 50 ? fullValue.slice(0, 50) + "…" : fullValue;

      const span = document.createElement("span");
      span.textContent = shortValue;
      span.style.cursor = "pointer";

      span.addEventListener("click", () => {
        const input = document.createElement("textarea");
        input.value = fullValue;
        input.style.width = "100%";
        input.style.height = "100px";
        tdValue.innerHTML = "";
        tdValue.appendChild(input);
        input.focus();

        input.addEventListener("blur", () => {
          localStorage.setItem(key, input.value);
          generateTable();
        });

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) input.blur();
        });
      });

      tdValue.appendChild(span);
      row.appendChild(tdKey);
      row.appendChild(tdValue);
      table.appendChild(row);
    });

    localStorageDisplay.innerHTML = "";
    localStorageDisplay.appendChild(table);

    refreshBtn.addEventListener("click", generateTable);
  }

  function displayLocalStorage() {
    if (localStorageDisplay.innerHTML.trim()) {
      localStorageDisplay.innerHTML = "";
      showStorageBtn.textContent = "Show Local Storage";
      document.body.style.overflowY = "hidden";
    } else {
      showStorageBtn.textContent = "Hide Local Storage";
      document.body.style.overflowY = "auto";
      generateTable();
    }
  }

  showStorageBtn.addEventListener("click", displayLocalStorage);

  clearStorageBtn.addEventListener("click", () => {
    const input = prompt(
      'Type "delete" to confirm clearing all local storage. You will lose all progress and only your userID (Not your peerID) will stay:'
    );
    if (input?.toLowerCase() === "delete") {
      const userID = localStorage.getItem("userID");
      localStorage.clear();
      localStorage.setItem("userID", userID);
      localStorageDisplay.innerHTML = "";
      alert("Local Storage has been cleared.");
    } else alert("Action canceled.");
  });
});
