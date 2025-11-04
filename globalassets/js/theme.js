// theme.js
(function() {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme") || "default";

  root.className = savedTheme;

  if (savedTheme === "custom") {
    let savedCustom = {};
    try { savedCustom = JSON.parse(localStorage.getItem("customTheme") || "{}"); } catch(e){}
    if (savedCustom.bg1) root.style.setProperty("--background-c1", savedCustom.bg1);
    if (savedCustom.bg2) root.style.setProperty("--background-c2", savedCustom.bg2);
    if (savedCustom.bgImg) root.style.setProperty("--background-img", `url("${savedCustom.bgImg}")`);
  }
})();
