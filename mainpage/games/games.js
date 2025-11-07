// ===== games.js (fixed) =====
// Responsible for: loading games.json, rendering game-buttons into category containers,
// switching categories via radio inputs + slider, search filtering, and lazy-loading images.

// Configuration / defaults
const coverURL = "/globalassets/gameIcons";
const htmlURL = "/portedgames";
const DEFAULT_ICON_SIZE = 128; // used when no explicit icon size is provided by the games.json entry

// Grab elements (IDs now intentionally match HTML: unportedContent, portedContent, emulatorContent)
const containers = {
  unported: document.getElementById("unportedContent"),
  ported: document.getElementById("portedContent"),
  emulator: document.getElementById("emulatorContent"),
};

const radios = [
  document.getElementById("unported"),
  document.getElementById("ported"),
  document.getElementById("emulator"),
];

const slider = document.querySelector(".slider");
const searchInput = document.getElementById("gameSearch");

// Utility: debounce (single implementation used in this module)
function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Update which category container is visible and position the slider
function updateGameView() {
  const index = radios.findIndex(r => r && r.checked);
  // show/hide containers based on the same ordering as `radios`
  const containerValues = Object.values(containers);
  containerValues.forEach((c, i) => {
    if (!c) return;
    c.style.display = i === index ? "flex" : "none";
  });

  // position the slider more robustly: center the slider under the corresponding label
  if (slider && slider.parentElement) {
    const parent = slider.parentElement;
    const labels = parent.querySelectorAll("label");
    if (labels && labels[index]) {
      const target = labels[index].getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const sliderRect = slider.getBoundingClientRect();
      // compute translateX relative to the parent's left edge
      const offsetLeft = (target.left - parentRect.left) + (target.width - sliderRect.width) / 2;
      slider.style.transform = `translateX(${Math.round(offsetLeft)}px)`;
    } else {
      // fallback: divide parent width by number of radios (keeps it functional if labels aren't available)
      const step = parent.offsetWidth / Math.max(radios.length, 1);
      slider.style.transform = `translateX(${Math.round(index * step)}px)`;
    }
  }

  // re-run filtering to ensure only visible items are shown in the visible container
  filterGames();
  // ensure images for the active container are requested
  lazyLoadVisibleImages();
}

// attach change listeners
radios.forEach(r => r && r.addEventListener("change", updateGameView));
window.addEventListener("resize", debounce(updateGameView, 80));

// Search filtering (case-insensitive)
function filterGames() {
  const q = (searchInput.value || "").trim().toLowerCase();
  Object.values(containers).forEach(container => {
    if (!container) return;
    container.querySelectorAll(".game-button").forEach(btn => {
      const title = (btn.dataset.title || "").toLowerCase();
      btn.style.display = title.includes(q) ? "flex" : "none";
    });
  });
}
searchInput.addEventListener("input", debounce(filterGames, 150));

// Lazy-load images only for the active (visible) container. Uses resolvePathForResource if available.
function lazyLoadVisibleImages() {
  const active = Object.values(containers).find(c => c && c.style.display !== "none");
  if (!active) return;
  const imgs = active.querySelectorAll('img[data-fallback="true"]');
  imgs.forEach(async img => {
    try {
      if (!img.dataset.src || img.src) return; // nothing to do
      if (typeof window.resolvePathForResource === "function") {
        // resolvePathForResource may try several candidate URLs (loader.js)
        try {
          const resolved = await window.resolvePathForResource(img.dataset.src);
          img.src = resolved || img.dataset.src;
        } catch {
          img.src = img.dataset.src;
        }
      } else {
        // fallback: set src directly
        img.src = img.dataset.src;
      }
    } catch (e) {
      // fail silently but log useful info during dev
      // console.debug("lazyLoadVisibleImages error", e);
      if (!img.src) img.src = img.dataset.src || "";
    }
  });
}

// load games.json and build DOM nodes
async function loadGames() {
  let data;
  try {
    const res = await fetch("games.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`games.json fetch failed: ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.error("Failed to load games.json:", e);
    return;
  }

  const idParam = new URLSearchParams(window.location.search).get("id");
  const wantedId = idParam !== null ? parseInt(idParam, 10) : null; // explicit radix
  let globalIndex = 0;

  // iterate categories present in JSON
  for (const category in data) {
    const container = containers[category];
    if (!container) {
      // defensive: if JSON has an unexpected key, skip it
      console.warn(`No container found for category "${category}" — skipping.`);
      continue;
    }

    let gamesArray = data[category] || [];
    // handle nested arrays gracefully (flatten one level)
    if (Array.isArray(gamesArray[0])) gamesArray = gamesArray.flat(1);

    for (const game of gamesArray) {
      const btn = document.createElement("div");
      btn.className = "game-button blur";
      btn.dataset.globalId = String(globalIndex);
      btn.dataset.title = (game.title || game.name || "Untitled").toString().toLowerCase();

      const titleText = game.title || game.name || "Untitled";
      const href = game.link || (game.url ? game.url.replace("{HTML_URL}", htmlURL) : "#");
      btn.dataset.href = href;

      // create image element and set width/height to avoid CLS
      const img = document.createElement("img");
      img.dataset.fallback = "true";
      // allow games.json to provide icon/cover and optional iconWidth/iconHeight
      const srcPath = (game.icon || game.cover || `${coverURL}/default.png`)
        .toString()
        .replace(/{COVER_URL}/g, coverURL)
        .replace(/{HTML_URL}/g, htmlURL);
      img.dataset.src = srcPath;
      // prefer explicit sizes from JSON if present; otherwise fall back to default square
      const w = Number(game.iconWidth || game.coverWidth) || DEFAULT_ICON_SIZE;
      const h = Number(game.iconHeight || game.coverHeight) || w;
      img.width = w;
      img.height = h;
      img.loading = "lazy"; // native lazy loading as an extra hint
      btn.appendChild(img);

      const title = document.createElement("span");
      title.className = "title";
      title.textContent = titleText;
      btn.appendChild(title);

      // click behavior: open external links in new tab, internal links in same tab
      btn.addEventListener("click", () => {
        const h = btn.dataset.href;
        if (!h) return;
        if (/^https?:\/\//i.test(h)) window.open(h, "_blank", "noopener");
        else window.location.href = h;
      });

      container.appendChild(btn);

      // if this globalIndex matches the id param, navigate to it (small timeout to allow DOM insertion)
      if (wantedId !== null && !Number.isNaN(wantedId) && wantedId === globalIndex) {
        setTimeout(() => {
          const h = btn.dataset.href;
          if (!h) return;
          if (/^https?:\/\//i.test(h)) window.open(h, "_blank", "noopener");
          else window.location.href = h;
        }, 50);
      }

      globalIndex++;
    }
  }

  // after population, ensure UI reflects current radio selection and images are triggered
  updateGameView();

  // if loader provided a global helper to attach fallbacks to newly added images, call it
  if (typeof window.attachFallbacksToImages === "function") {
    // this may set srcset or rewrite srcs using resolved candidates
    window.attachFallbacksToImages();
  }
}

// initialize
loadGames();
if (typeof window.attachFallbacksToMenu === "function") window.attachFallbacksToMenu();
