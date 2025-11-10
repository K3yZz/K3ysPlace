const containers = {
  unported: document.getElementById("notportedContent"),
  ported: document.getElementById("portedContent"),
  emulator: document.getElementById("emulatorsContent"),
};

const unportedRadio = document.getElementById("unported");
const portedRadio = document.getElementById("ported");
const emulatorRadio = document.getElementById("emulator");
const radioButtons = [unportedRadio, portedRadio, emulatorRadio];
const slider = document.querySelector(".slider");

function updateGameView() {
  containers.unported.style.display = unportedRadio.checked ? "flex" : "none";
  containers.ported.style.display = portedRadio.checked ? "flex" : "none";
  containers.emulator.style.display = emulatorRadio.checked ? "flex" : "none";

  const index = radioButtons.findIndex((r) => r.checked);
  slider.style.transform = `translateX(${index * 35}px)`; // adjust if buttons are wider
}

radioButtons.forEach((radio) =>
  radio.addEventListener("change", updateGameView)
);
updateGameView();

async function loadGames() {
  const COVER_URL = "/globalassets/gameIcons";
  const HTML_URL = "portedgames/";

  const replacePlaceholders = (str) =>
    typeof str === "string"
      ? str.replace(/\{COVER_URL\}/g, COVER_URL).replace(/\{HTML_URL\}/g, HTML_URL)
      : str;

  try {
    const res = await fetch("games.json");
    const data = await res.json();

    for (const [category, list] of Object.entries(data)) {
      const container = containers[category];
      if (!container) continue;

      // Flatten nested lists like [["game1", "game2"]]
      const games = Array.isArray(list[0]) ? list.flat() : list;

      const frag = document.createDocumentFragment();

      for (const game of games) {
        const btn = document.createElement("div");
        btn.classList.add("game-button", "blur");

        const href = replacePlaceholders(game.link ?? game.href ?? game.url ?? "#");
        const icon = replacePlaceholders(
          game.icon ?? game.cover ?? "globalassets/gameIcons/placeholder.png"
        );
        const titleText = game.title ?? game.name ?? "Untitled";

        btn.dataset.href = href;

        const img = document.createElement("img");
        img.src = icon;
        img.loading = "lazy";
        img.onerror = () => (img.src = "/globalassets/gameIcons/placeholder.png");
        btn.appendChild(img);

        const title = document.createElement("span");
        title.classList.add("title");
        title.textContent = titleText;
        btn.appendChild(title);

        btn.addEventListener("click", (e) => {
          if (e.ctrlKey || e.metaKey || e.button !== 0) return; // allow new tab clicks
          if (href && href !== "#") window.location.href = href;
        });

        frag.appendChild(btn);
      }

      container.appendChild(frag);
    }
  } catch (err) {
    console.error("Failed to load games:", err);
  }
}

loadGames();
