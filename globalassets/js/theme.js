document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  // Apply saved theme (even if no toggle is found yet)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.className = savedTheme;
    if (themeToggle) themeToggle.value = savedTheme;
  }

  // If toggle exists, handle changes
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      const selectedTheme = themeToggle.value;
      document.documentElement.className = selectedTheme;
      localStorage.setItem("theme", selectedTheme);
    });
  }
});
