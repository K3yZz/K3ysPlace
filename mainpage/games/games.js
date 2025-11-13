/* games.js — v2.0 (with loader finalize/fade)
   - Slider fixed (uses bounding rect)
   - Label text hidden but accessible (aria-label)
   - Worker + streaming-fallback loader with visible progress
   - Virtualized ported list + lazy images + search
   - Loader now fades out and is reliably hidden after load/error
*/

const BASE_PATH = location.hostname.includes("github.io") ? "/K3ysPlace/" : "/";

/* -------------------- DOM refs -------------------- */
const containers = {
  unported: document.getElementById("notportedContent"),
  ported: document.getElementById("portedContent"),
  emulator: document.getElementById("emulatorsContent"),
};
const radios = {
  unported: document.getElementById("unported"),
  ported: document.getElementById("ported"),
  emulator: document.getElementById("emulator"),
};
const radioButtons = Object.values(radios).filter(Boolean);

const switchEl = document.querySelector(".three-way-switch");
const slider = document.querySelector(".slider");

const loaderWrap = document.getElementById("loaderWrap");
const loaderProgress = document.getElementById("loaderProgress");
const loaderPct = document.getElementById("loaderPct");
const loaderLabel = document.getElementById("loaderLabel");

const searchStatus = document.getElementById("searchStatus");

let smallButtons = []; // DOM nodes for unported + emulator lists
let portedGames = []; // data for ported games
let virtual = null; // virtualization controller
let imageObserver = null;
let worker = null;

/* -------------------- Loader show/hide helpers -------------------- */
function showLoader() {
  if (!loaderWrap) return;
  // ensure visible and reset opacity
  loaderWrap.style.transition = "";
  loaderWrap.style.display = ""; // let stylesheet decide (or block by default)
  loaderWrap.style.opacity = "1";
  loaderWrap.setAttribute("aria-hidden", "false");
}

function finalizeLoader({ fade = true, delay = 120 } = {}) {
  if (!loaderWrap) return;
  // give a tiny delay so UI can settle (and users see 100%)
  setTimeout(() => {
    // fade out then hide
    if (fade) {
      loaderWrap.style.transition = "opacity 240ms ease";
      loaderWrap.style.opacity = "0";
      // after transition end hide fully
      setTimeout(() => {
        try {
          loaderWrap.setAttribute("aria-hidden", "true");
        } catch {}
        // remove from layout to avoid covering interactive elements
        loaderWrap.style.display = "none";
        // reset inline transition to avoid interfering with future shows
        loaderWrap.style.transition = "";
      }, 280);
    } else {
      try {
        loaderWrap.setAttribute("aria-hidden", "true");
      } catch {}
      loaderWrap.style.display = "none";
      loaderWrap.style.opacity = "0";
    }
  }, delay);
}

/* -------------------- Slider positioning --------------------
   Use bounding rects so we can position even when labels have no text.
*/
function updateSlider() {
  const index = radioButtons.findIndex(r => r.checked);
  if (index === -1) return;

  // Compute the position of the radio relative to the switch container
  const target = radioButtons[index];
  const rect = target.getBoundingClientRect();
  const switchRect = switchEl.getBoundingClientRect();
  const left = rect.left - switchRect.left + rect.width / 2 - slider.offsetWidth / 2;

  slider.style.transform = `translateX(${left}px)`;
}

/* -------------------- Show/hide panels -------------------- */
function updateGameView() {
  Object.entries(containers).forEach(([cat, el]) => {
    if (!el) return;
    const isVisible = radios[cat] && radios[cat].checked;
    el.style.display = isVisible
      ? el.classList.contains("virtualized")
        ? "block"
        : "flex"
      : "none";
    if (isVisible) el.setAttribute("tabindex", "0");
    else el.removeAttribute("tabindex");
  });
  requestAnimationFrame(updateSlider);
}

/* wire radio changes to UI & history */
radioButtons.forEach((r) =>
  r.addEventListener("change", () => {
    updateGameView();
    const current = radioButtons.find((rb) => rb.checked)?.id;
    if (current) {
      try {
        history.replaceState({}, "", `?tab=${current}${getSearchParam()}`);
      } catch {}
    }
  })
);

window.addEventListener("resize", () => {
  requestAnimationFrame(updateSlider);
  if (virtual && virtual.onResize) virtual.onResize();
});

/* keyboard for switch */
document.addEventListener("keydown", (e) => {
  if (!document.activeElement) return;
  if (document.activeElement.matches(".three-way-switch label")) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveSwitch(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveSwitch(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveSwitchTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      moveSwitchTo(2);
    }
  }
});

function moveSwitch(dir) {
  const labels = Array.from(switchEl.querySelectorAll("label"));
  const curIndex = labels.findIndex((l) => l.tabIndex === 0);
  if (curIndex === -1) return;
  moveSwitchTo(Math.max(0, Math.min(labels.length - 1, curIndex + dir)));
}
function moveSwitchTo(index) {
  const labels = Array.from(switchEl.querySelectorAll("label"));
  const next = labels[index];
  if (!next) return;
  const radio = document.getElementById(next.getAttribute("for"));
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  }
  next.focus();
}

/* -------------------- Lazy image observer -------------------- */
function lazyImageInit() {
  if ("IntersectionObserver" in window && !imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const img = e.target;
          const src = img.dataset.src;
          if (src && img.src !== src) img.src = src;
          try {
            imageObserver.unobserve(img);
          } catch {}
        });
      },
      { root: null, rootMargin: "400px", threshold: 0.01 }
    );
  } else {
    imageObserver = null;
  }
}

/* -------------------- Element factories -------------------- */
function createButtonElement(game, placeholder) {
  const a = document.createElement("a");
  a.className = "game-button blur";
  a.href = game.link || "#";
  a.target = "_self";
  a.rel = "noopener";
  a.setAttribute("role", "link");
  a.setAttribute("aria-label", game.title || "");

  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.src = game.icon || placeholder;
  img.alt = game.title || "";
  a.appendChild(img);

  const span = document.createElement("span");
  span.className = "title";
  span.textContent = game.title || "Untitled";
  a.appendChild(span);

  return a;
}

function createPoolItem(placeholder) {
  const a = document.createElement("a");
  a.className = "game-button blur";
  a.target = "_self";
  a.rel = "noopener";
  a.setAttribute("role", "link");

  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.alt = "";
  img.dataset.src = placeholder;
  imgWrap.appendChild(img);
  a.appendChild(imgWrap);

  const span = document.createElement("span");
  span.className = "title";
  a.appendChild(span);

  return { el: a, img, titleEl: span };
}

/* -------------------- Virtualized recycled container -------------------- */
function setupVirtualRecycled(container, games, placeholder) {
  if (!container) return;
  if (virtual && virtual.container === container) {
    virtual.setData(games);
    return virtual;
  }
  if (virtual && virtual.destroy) {
    virtual.destroy();
    virtual = null;
  }

  container.classList.add("virtualized");
  container.style.position = "relative";
  container.style.overflowY = "auto";

  const sample = createButtonElement(
    { title: "M", icon: placeholder, link: "#" },
    placeholder
  );
  sample.style.position = "absolute";
  sample.style.visibility = "hidden";
  document.body.appendChild(sample);
  const itemWidth = sample.offsetWidth || 160;
  const itemHeight = sample.offsetHeight || 160;
  document.body.removeChild(sample);

  const cs = getComputedStyle(container);
  const gap = Math.max(8, parseFloat(cs.columnGap || cs.gap || "16") || 16);

  const spacer = document.createElement("div");
  spacer.style.width = "1px";
  spacer.style.height = "0px";
  container.appendChild(spacer);

  const poolEls = document.createElement("div");
  poolEls.style.position = "absolute";
  poolEls.style.top = "0";
  poolEls.style.left = "0";
  poolEls.style.right = "0";
  poolEls.style.display = "block";
  container.appendChild(poolEls);

  let itemsPerRow = Math.max(
    1,
    Math.floor((container.clientWidth + gap) / (itemWidth + gap))
  );
  let rowHeight = itemHeight + gap;
  let viewportHeight = container.clientHeight || 600;

  const poolSize = Math.min(
    300,
    Math.max(48, Math.ceil((viewportHeight / rowHeight) * itemsPerRow) * 4)
  );
  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    const item = createPoolItem(placeholder);
    item.el.style.position = "absolute";
    item.el.style.willChange = "transform";
    poolEls.appendChild(item.el);
    pool.push(item);
  }

  let gamesData = games.slice();
  let scrollTop = 0;
  let totalRows = 0;
  let raf = 0;

  function recompute() {
    viewportHeight = container.clientHeight || 600;
    itemsPerRow = Math.max(
      1,
      Math.floor((container.clientWidth + gap) / (itemWidth + gap))
    );
    rowHeight = itemHeight + gap;
    totalRows = Math.ceil(gamesData.length / itemsPerRow);
    spacer.style.height = Math.max(0, totalRows * rowHeight - gap) + "px";
  }

  function render() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const startRow = Math.floor(scrollTop / rowHeight);
      const visibleRows = Math.ceil(viewportHeight / rowHeight) + 3;
      const startIndex = Math.max(0, startRow * itemsPerRow - itemsPerRow * 2);
      const endIndex = Math.min(
        gamesData.length,
        (startRow + visibleRows) * itemsPerRow + itemsPerRow * 2
      );
      const contentWidth =
        itemsPerRow * itemWidth + Math.max(0, itemsPerRow - 1) * gap;
      const containerWidth = container.clientWidth;
      const leftOffset = Math.max(0, (containerWidth - contentWidth) / 2);

      let poolIndex = 0;
      for (let i = startIndex; i < endIndex; i++) {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        const x = leftOffset + col * (itemWidth + gap);
        const y = row * rowHeight + gap / 2;
        const item = pool[poolIndex++];
        if (!item) continue; // <- change here
        const g = gamesData[i] || {};
        item.el.href = g.link || "#";
        item.el.setAttribute("aria-label", g.title || "");
        item.titleEl.textContent = g.title || "Untitled";
        item.img.alt = g.title || "";
        if (imageObserver) {
          item.img.dataset.src = g.icon || placeholder;
          imageObserver.observe(item.img);
        } else {
          item.img.src = g.icon || placeholder;
        }
        item.el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(
          y
        )}px, 0)`;
        item.el.style.display = "";
      }

      for (let j = poolIndex; j < pool.length; j++)
        pool[j].el.style.display = "none";
    });
  }

  function onScroll() {
    scrollTop = container.scrollTop;
    render();
  }
  function onResize() {
    recompute();
    render();
  }

  container.addEventListener("scroll", onScroll, { passive: true });
  const ro = new ResizeObserver(() => {
    onResize();
  });
  ro.observe(container);

  gamesData = games.slice();
  recompute();
  render();

  virtual = {
    container,
    setData(newGames) {
      gamesData = newGames.slice();
      recompute();
      render();
    },
    onResize,
    destroy() {
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
      try {
        if (imageObserver) {
          poolEls.querySelectorAll("img").forEach((img) => {
            try {
              imageObserver.unobserve(img);
            } catch {}
          });
        }
      } catch {}
      poolEls.remove();
      spacer.remove();
      virtual = null;
    },
  };

  return virtual;
}

/* -------------------- Helper: build small lists (unported + emulator) -------------------- */
function buildSmallList(node, list, placeholder) {
  const frag = document.createDocumentFragment();
  list.forEach((g) => {
    const obj = {
      title: g.title ?? g.name ?? g.id,
      icon: g.icon ?? g.cover,
      link: g.link ?? g.href ?? g.url ?? "#",
    };
    const el = createButtonElement(
      {
        title: obj.title,
        icon: replacePath(obj.icon) || placeholder,
        link: obj.link,
      },
      placeholder
    );
    smallButtons.push(el);
    frag.appendChild(el);
  });
  node.appendChild(frag);
}

/* -------------------- Loader: Worker + streaming fallback -------------------- */
function startWorker(url) {
  // show loader
  showLoader();
  if (loaderProgress) loaderProgress.value = 0;
  if (loaderPct) loaderPct.textContent = "0%";
  if (loaderLabel) loaderLabel.textContent = "Downloading games…";

  if (worker) {
    try {
      worker.terminate();
    } catch {}
    worker = null;
  }

  let workerUrl;
  try {
    workerUrl = new URL("./games.worker.js", import.meta.url).href;
  } catch {
    workerUrl = "games.worker.js";
  }

  if (typeof Worker !== "undefined") {
    try {
      worker = new Worker(workerUrl);
      worker.postMessage({ cmd: "load", url });
      worker.onmessage = (e) => {
        const m = e.data;
        if (!m) return;
        if (m.type === "progress") {
          if (loaderProgress) loaderProgress.value = m.pct;
          if (loaderPct) loaderPct.textContent = Math.round(m.pct) + "%";
        } else if (m.type === "ready") {
          if (loaderProgress) loaderProgress.value = 100;
          if (loaderPct) loaderPct.textContent = "100%";
          if (loaderLabel) loaderLabel.textContent = "Finalizing…";
          try {
            onDataReady(m.data);
          } catch (err) {
            console.error(err);
            finalizeLoader();
          }
        } else if (m.type === "error") {
          console.error("Worker error:", m.message);
          if (loaderLabel) loaderLabel.textContent = "Error loading games";
          // hide after brief pause
          setTimeout(() => finalizeLoader(), 700);
        }
      };
      worker.onerror = (err) => {
        console.error("Worker failed:", err);
        if (loaderLabel) loaderLabel.textContent = "Error loading games";
        // fallback to fetch streaming
        fetchWithProgress(url).catch((err2) => {
          console.error(err2);
          if (loaderLabel) loaderLabel.textContent = "Error loading games";
          setTimeout(() => finalizeLoader(), 800);
        });
      };
      return;
    } catch (err) {
      console.warn("Worker creation failed, falling back to fetch:", err);
      // fall through to fetch fallback
    }
  }
  // fallback: fetch with streaming progress
  fetchWithProgress(url).catch((err) => {
    console.error(err);
    if (loaderLabel) loaderLabel.textContent = "Error loading games";
    setTimeout(() => finalizeLoader(), 800);
  });
}

/* streaming fetch in main thread with progress updates */
async function fetchWithProgress(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("games.json not found");
  const reader = res.body && res.body.getReader ? res.body.getReader() : null;
  if (!reader) {
    const data = await res.json();
    onDataReady(data);
    return;
  }
  const contentLength = +res.headers.get("Content-Length") || 0;
  let received = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const pct = contentLength
      ? Math.min(99, Math.round((received / contentLength) * 100))
      : Math.min(99, Math.round((received / 1000000) * 10));
    if (loaderProgress) loaderProgress.value = pct;
    if (loaderPct) loaderPct.textContent = Math.round(pct) + "%";
  }
  const totalLen = chunks.reduce((p, c) => p + c.length, 0);
  const full = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    full.set(chunk, offset);
    offset += chunk.length;
  }
  const text = new TextDecoder("utf-8").decode(full);
  try {
    const data = JSON.parse(text);
    if (loaderProgress) loaderProgress.value = 100;
    if (loaderPct) loaderPct.textContent = "100%";
    if (loaderLabel) loaderLabel.textContent = "Finalizing…";
    onDataReady(data);
  } catch (err) {
    throw new Error("Failed to parse games.json: " + err.message);
  }
}

/* -------------------- Data ready: populate UI -------------------- */
function replacePath(s) {
  if (!s) return s;
  return String(s)
    .replace(/\{COVER_URL\}/g, BASE_PATH + "globalassets/gameIcons")
    .replace(/\{HTML_URL\}/g, BASE_PATH + "portedgames");
}

function onDataReady(data) {
  // populate UI
  try {
    const placeholder = BASE_PATH + "globalassets/gameIcons/placeholder.png";

    ["unported", "emulator"].forEach((cat) => {
      const node = containers[cat];
      if (!node) return;
      const list = flattenGames(data[cat] ?? []);
      const fragList = list.map((g) => ({
        title: g.title ?? g.name ?? g.id,
        icon: replacePath(g.icon ?? g.cover) || placeholder,
        link: replacePath(g.link ?? g.href ?? g.url ?? "#"),
      }));
      buildSmallList(node, fragList, placeholder);
    });

    portedGames = flattenGames(data.ported ?? []).map((g) => ({
      title: g.title ?? g.name ?? g.id,
      icon: replacePath(g.icon ?? g.cover) || placeholder,
      link: replacePath(g.link ?? g.href ?? g.url ?? "#"),
    }));

    lazyImageInit();
    if (containers.ported) {
      virtual = setupVirtualRecycled(
        containers.ported,
        portedGames,
        placeholder
      );
    }

    // search wiring
    const searchInput = document.getElementById("gameSearch");
    if (searchInput) {
      const debounced = debounce((value) => {
        const q = (value || "").trim().toLowerCase();
        let visibleCount = 0;
        smallButtons.forEach((btn) => {
          const title =
            btn.querySelector(".title")?.textContent.toLowerCase() || "";
          const show = !q || title.includes(q);
          btn.style.display = show ? "" : "none";
          if (show) visibleCount++;
        });
        const filtered = q
          ? portedGames.filter((g) => g.title.toLowerCase().includes(q))
          : portedGames;
        if (virtual) virtual.setData(filtered);
        if (searchStatus)
          searchStatus.textContent = `${visibleCount} small · ${filtered.length} ported`;
      }, 140);

      searchInput.addEventListener("input", (e) => {
        debounced(e.target.value);
        try {
          history.replaceState(
            {},
            "",
            `?tab=${currentTab()}${getSearchParam()}`
          );
        } catch {}
      });
    }

    applyInitialStateFromURL();
    updateGameView();
  } finally {
    // always finalize/hide the loader after UI is ready (or in case of partial failures)
    finalizeLoader();
  }
}

/* -------------------- Entry: start loading games -------------------- */
function loadGames() {
  if (containers.ported) containers.ported.classList.add("virtualized");
  const url = new URL("./games.json", import.meta.url).href;
  startWorker(url);
}

/* -------------------- Utilities -------------------- */
function flattenGames(list) {
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) =>
    Array.isArray(item) ? flattenGames(item) : item == null ? [] : [item]
  );
}
function debounce(fn, wait) {
  let t = null;
  return function (...args) {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
function getSearchParam() {
  const s = document.getElementById("gameSearch")?.value || "";
  return s ? `&q=${encodeURIComponent(s)}` : "";
}
function currentTab() {
  return radioButtons.find((rb) => rb.checked)?.id || "unported";
}

function applyInitialStateFromURL() {
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  const q = params.get("q") ?? "";
  if (q && document.getElementById("gameSearch")) {
    const el = document.getElementById("gameSearch");
    el.value = q;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (tab && radios[tab]) {
    radios[tab].checked = true;
    radios[tab].dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/* -------------------- Kick off -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (switchEl) {
    switchEl.querySelectorAll("label").forEach((l) => {
      l.addEventListener("click", () => {
        const radio = document.getElementById(l.getAttribute("for"));
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }

  requestAnimationFrame(updateSlider);
  loadGames();
});
