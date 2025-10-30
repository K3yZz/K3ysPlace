// =======================
// THEME SCRIPT
// =======================
(function() {
  function initThemeScript() {
    console.log("Theme script initialized ✅");

    const themeToggle = document.getElementById("themeToggle");
    const customSection = document.getElementById("customThemeSection");
    const customBg1 = document.getElementById("customBg1");
    const customBg2 = document.getElementById("customBg2");
    const customBgImg = document.getElementById("customBgImg");
    const applyCustomBtn = document.getElementById("applyCustomTheme");

    if (!themeToggle) {
      console.warn("Theme toggle not found!");
    }

    // --------------------------
    // Apply saved theme on load
    // --------------------------
    const savedTheme = localStorage.getItem("theme") || "default";
    document.documentElement.className = savedTheme;
    themeToggle.value = savedTheme;

    if (savedTheme === "custom") {
      customSection.style.display = "flex";
      const savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}");
      if (savedCustom.bg1) document.documentElement.style.setProperty("--background-c1", savedCustom.bg1);
      if (savedCustom.bg2) document.documentElement.style.setProperty("--background-c2", savedCustom.bg2);
      if (savedCustom.bgImg)
        document.documentElement.style.setProperty("--background-img", savedCustom.bgImg ? `url(${savedCustom.bgImg})` : "none");

      customBg1.value = savedCustom.bg1 || "#ffffff";
      customBg2.value = savedCustom.bg2 || "#000000";
      customBgImg.value = savedCustom.bgImg || "";
    } else {
      customSection.style.display = "none";
      document.documentElement.style.removeProperty("--background-c1");
      document.documentElement.style.removeProperty("--background-c2");
      document.documentElement.style.removeProperty("--background-img");
    }

    // --------------------------
    // Handle theme changes
    // --------------------------
    themeToggle.addEventListener("change", () => {
      const selectedTheme = themeToggle.value;
      document.documentElement.className = selectedTheme;

      if (selectedTheme === "custom") {
        customSection.style.display = "flex";
        const savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}");
        customBg1.value = savedCustom.bg1 || "#ffffff";
        customBg2.value = savedCustom.bg2 || "#000000";
        customBgImg.value = savedCustom.bgImg || "";
      } else {
        customSection.style.display = "none";
        document.documentElement.style.removeProperty("--background-c1");
        document.documentElement.style.removeProperty("--background-c2");
        document.documentElement.style.removeProperty("--background-img");
        localStorage.setItem("theme", selectedTheme);
      }

      // 🔥 Restart particles when theme changes
      if (typeof initParticles === "function") initParticles();
    });

    // --------------------------
    // Apply custom theme
    // --------------------------
    function applyCustomTheme() {
      const bg1 = customBg1.value;
      const bg2 = customBg2.value;
      const bgImg = customBgImg.value;

      document.documentElement.style.setProperty("--background-c1", bg1);
      document.documentElement.style.setProperty("--background-c2", bg2);
      document.documentElement.style.setProperty("--background-img", bgImg ? `url(${bgImg})` : "none");

      localStorage.setItem("theme", "custom");
      localStorage.setItem("customTheme", JSON.stringify({ bg1, bg2, bgImg }));
      console.log("Custom theme applied ✅");

      // 🔥 Restart particles when custom theme updates
      if (typeof initParticles === "function") initParticles();
    }

    applyCustomBtn.addEventListener("click", applyCustomTheme);

    // Live preview as user types/chooses
    [customBg1, customBg2, customBgImg].forEach(input => {
      input.addEventListener("input", applyCustomTheme);
    });

    // --------------------------
    // Special effects for specific themes
    // --------------------------
    const specialThemes = ["dexter", "harry-styles"];
    document.addEventListener("click", (event) => {
      const currentTheme = document.documentElement.className;
      if (!specialThemes.includes(currentTheme)) return;

      const explosion = document.createElement("img");
      explosion.src = "/globalassets/images/explosion.gif";
      explosion.alt = "Explosion";
      explosion.style.position = "absolute";
      explosion.style.zIndex = "1000";
      explosion.style.pointerEvents = "none";
      explosion.style.left = `${event.pageX}px`;
      explosion.style.top = `${event.pageY}px`;
      explosion.style.transform = "translate(-50%, -50%)";

      document.body.appendChild(explosion);
      setTimeout(() => explosion.remove(), 1000);
    });
  }

  // Run script on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeScript);
  } else {
    initThemeScript();
  }
})();
