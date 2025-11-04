(function () {
  function initThemeScript() {
    console.log("Theme script initialized ✅");

    const themeToggle = document.getElementById("themeToggle");
    const customSection = document.getElementById("customThemeSection");
    const customBg1 = document.getElementById("customBg1");
    const customBg2 = document.getElementById("customBg2");
    const customBgImg = document.getElementById("customBgImg");
    const applyCustomBtn = document.getElementById("applyCustomTheme");

    // --------------------------
    // Apply saved theme on load
    // --------------------------
    const savedTheme = localStorage.getItem("theme") || "default";
    document.documentElement.className = savedTheme;

    if (themeToggle) themeToggle.value = savedTheme;

    if (savedTheme === "custom") {
      const savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}");
      if (savedCustom.bg1) document.documentElement.style.setProperty("--background-c1", savedCustom.bg1);
      if (savedCustom.bg2) document.documentElement.style.setProperty("--background-c2", savedCustom.bg2);
      if (savedCustom.bgImg) document.documentElement.style.setProperty("--background-img", `url(${savedCustom.bgImg})`);

      if (customSection) customSection.style.display = "flex";
      if (customBg1) customBg1.value = savedCustom.bg1 || "#ffffff";
      if (customBg2) customBg2.value = savedCustom.bg2 || "#000000";
      if (customBgImg) customBgImg.value = savedCustom.bgImg || "";
    } else {
      if (customSection) customSection.style.display = "none";
      document.documentElement.style.removeProperty("--background-c1");
      document.documentElement.style.removeProperty("--background-c2");
      document.documentElement.style.removeProperty("--background-img");
    }

    // --------------------------
    // Handle theme changes
    // --------------------------
    if (themeToggle) {
      themeToggle.addEventListener("change", () => {
        const selectedTheme = themeToggle.value;
        document.documentElement.className = selectedTheme;

        if (selectedTheme === "custom") {
          if (customSection) customSection.style.display = "flex";
          const savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}");
          if (customBg1) customBg1.value = savedCustom.bg1 || "#ffffff";
          if (customBg2) customBg2.value = savedCustom.bg2 || "#000000";
          if (customBgImg) customBgImg.value = savedCustom.bgImg || "";
        } else {
          if (customSection) customSection.style.display = "none";
          document.documentElement.style.removeProperty("--background-c1");
          document.documentElement.style.removeProperty("--background-c2");
          document.documentElement.style.removeProperty("--background-img");
          localStorage.setItem("theme", selectedTheme);
        }

        if (typeof initParticles === "function") initParticles();
      });
    }

    // --------------------------
    // Apply custom theme
    // --------------------------
    function applyCustomTheme() {
      if (!customBg1 || !customBg2 || !customBgImg) return;

      const bg1 = customBg1.value;
      const bg2 = customBg2.value;
      const bgImg = customBgImg.value;

      document.documentElement.style.setProperty("--background-c1", bg1);
      document.documentElement.style.setProperty("--background-c2", bg2);
      document.documentElement.style.setProperty("--background-img", bgImg ? `url(${bgImg})` : "none");

      localStorage.setItem("theme", "custom");
      localStorage.setItem("customTheme", JSON.stringify({ bg1, bg2, bgImg }));
      console.log("Custom theme applied ✅");

      if (typeof initParticles === "function") initParticles();
    }

    if (applyCustomBtn) applyCustomBtn.addEventListener("click", applyCustomTheme);

    if (customBg1 && customBg2 && customBgImg) {
      [customBg1, customBg2, customBgImg].forEach(input => {
        input.addEventListener("input", applyCustomTheme);
      });
    }

    // --------------------------
    // Special effects for specific themes
    // --------------------------
    const specialThemes = ["dexter", "harry-styles"];
    document.addEventListener("click", (event) => {
      const currentTheme = document.documentElement.className;
      if (!specialThemes.includes(currentTheme)) return;

      const explosion = document.createElement("img");
      explosion.src = "../images/explosion.gif";
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeScript);
  } else {
    initThemeScript();
  }
})();
