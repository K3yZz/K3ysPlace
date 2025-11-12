const BASE_PATH = location.hostname.includes("github.io") ? "/K3ysPlace/" : "/";

const containers = {
  unported: document.getElementById('notportedContent'),
  ported: document.getElementById('portedContent'),
  emulator: document.getElementById('emulatorsContent')
};

const radios = {
  unported: document.getElementById('unported'),
  ported: document.getElementById('ported'),
  emulator: document.getElementById('emulator')
};

const radioButtons = Object.values(radios).filter(Boolean);
const slider = document.querySelector('.slider');
const switchEl = document.querySelector('.three-way-switch');

let smallButtons = [];           // buttons for unported/emulator (small lists)
let portedGames = [];            // data for ported
let virtualState = null;         // holds virtual container state (so we can tear down and reinit)

// ---------------------------
// Slider logic
// ---------------------------
function updateSlider() {
  if (!slider || !switchEl) return;
  const labels = Array.from(switchEl.querySelectorAll('label'));
  const index = radioButtons.findIndex(r => r.checked);
  if (index === -1 || !labels[index]) return;
  const target = labels[index];
  // offsetLeft is relative to offsetParent (three-way-switch should be positioned)
  const left = target.offsetLeft + target.offsetWidth / 2 - slider.offsetWidth / 2;
  slider.style.transform = `translateX(${left}px)`;
}

function updateGameView() {
  Object.entries(containers).forEach(([cat, el]) => {
    if (!el) return;
    el.style.display = radios[cat]?.checked ? 'flex' : 'none';
  });
  requestAnimationFrame(updateSlider);
}

radioButtons.forEach(r => r.addEventListener('change', updateGameView));
window.addEventListener('resize', () => {
  requestAnimationFrame(updateSlider);
  // if virtual active, recompute layout
  if (virtualState) virtualState.reinit();
});
requestAnimationFrame(updateSlider);
updateGameView();

// ---------------------------
// Utilities
// ---------------------------
const flattenGames = list => Array.isArray(list)
  ? list.flatMap(item => Array.isArray(item) ? flattenGames(item) : item == null ? [] : [item])
  : [];

function createButtonElement(game, placeholder) {
  const a = document.createElement('a');
  a.className = 'game-button blur';
  a.href = game.link;
  a.target = '_self';
  a.rel = 'noopener';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = game.icon || placeholder;
  img.onerror = () => { img.src = placeholder; };
  a.appendChild(img);

  const span = document.createElement('span');
  span.className = 'title';
  span.textContent = game.title || 'Untitled';
  a.appendChild(span);

  return a;
}

// ---------------------------
// Virtualization that preserves flex grid
// ---------------------------
function setupVirtualPorted(container, games, placeholder) {
  // Tear down previous
  if (virtualState && virtualState.container === container) {
    // update backing data and rerender
    virtualState.games = games;
    virtualState.reinit();
    return;
  }
  // If a different container had virtual, remove its listeners
  if (virtualState) virtualState.teardown();

  // compute styles
  const cs = getComputedStyle(container);
  const gap = parseFloat(cs.columnGap || cs.gap || '20') || 20;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight || container.offsetHeight || 400;

  // create a temp measuring element to get item size (avoids hardcoding)
  const meas = document.createElement('div');
  meas.style.visibility = 'hidden';
  meas.style.position = 'absolute';
  meas.style.left = '-9999px';
  const sample = createButtonElement(games.length ? games[0] : { title: 'M', icon: placeholder, link: '#' }, placeholder);
  meas.appendChild(sample);
  document.body.appendChild(meas);
  const itemWidth = sample.offsetWidth || 160;
  const itemHeight = sample.offsetHeight || 160;
  document.body.removeChild(meas);

  // compute layout
  const itemsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(games.length / itemsPerRow);
  const spacerHeight = Math.max(0, totalRows * rowHeight - gap);

  // build DOM structure: spacer + visibleContainer (visibleContainer is flex to preserve wrapping)
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflowY = 'auto';

  const spacer = document.createElement('div');
  spacer.style.width = '1px';
  spacer.style.height = spacerHeight + 'px';
  container.appendChild(spacer);

  const visibleContainer = document.createElement('div');
  // make visibleContainer follow same flex/grid layout visually
  visibleContainer.style.position = 'absolute';
  visibleContainer.style.top = '0';
  visibleContainer.style.left = '0';
  visibleContainer.style.right = '0';
  visibleContainer.style.display = 'flex';
  visibleContainer.style.flexWrap = 'wrap';
  visibleContainer.style.justifyContent = 'center';
  visibleContainer.style.gap = `${gap}px`;
  visibleContainer.style.padding = cs.padding;
  // ensure pointer events flow to children
  container.appendChild(visibleContainer);

  // state and helpers
  let raf = null;
  function render() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const scrollTop = container.scrollTop;
      const startRow = Math.floor(scrollTop / rowHeight);
      const visibleRows = Math.ceil(container.clientHeight / rowHeight) + 2;
      const startIndex = Math.max(0, startRow * itemsPerRow - itemsPerRow * 1); // small prebuffer
      const endIndex = Math.min(games.length, (startRow + visibleRows) * itemsPerRow + itemsPerRow * 1);

      // position visibleContainer
      visibleContainer.style.top = (startRow * rowHeight) + 'px';

      // clear and populate
      visibleContainer.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (let i = startIndex; i < endIndex; i++) {
        frag.appendChild(createButtonElement(games[i], placeholder));
      }
      visibleContainer.appendChild(frag);
    });
  }

  function onScroll() { render(); }

  container.addEventListener('scroll', onScroll, { passive: true });

  // expose state for reinit/teardown
  virtualState = {
    container,
    games,
    teardown() {
      container.removeEventListener('scroll', onScroll);
      // clear DOM (restore empty container)
      container.innerHTML = '';
      virtualState = null;
    },
    reinit() {
      // recompute sizes in case of resize
      const w = container.clientWidth;
      const itemsPerRowNew = Math.max(1, Math.floor((w + gap) / (itemWidth + gap)));
      // if itemsPerRow changed significantly, recompute spacer
      const totalRowsNew = Math.ceil(games.length / itemsPerRowNew);
      spacer.style.height = Math.max(0, totalRowsNew * rowHeight - gap) + 'px';
      render();
    },
    games
  };

  // initial render
  render();
  // return virtualState for external use if needed
  return virtualState;
}

// ---------------------------
// Load and render everything
// ---------------------------
async function loadGames() {
  const placeholder = BASE_PATH + 'globalassets/gameIcons/placeholder.png';
  const coverBase = BASE_PATH + 'globalassets/gameIcons';
  const htmlBase = BASE_PATH + 'portedgames';
  const replace = s => typeof s === 'string' ? s.replace(/\{COVER_URL\}/g, coverBase).replace(/\{HTML_URL\}/g, htmlBase) : s;

  try {
    const res = await fetch(new URL('./games.json', import.meta.url));
    if (!res.ok) throw new Error(`games.json not found (status ${res.status})`);
    const data = await res.json();

    // small sections: unported & emulator (render fully)
    ['unported', 'emulator'].forEach(cat => {
      const node = containers[cat];
      if (!node) return;
      const list = flattenGames(data[cat] ?? []);
      const frag = document.createDocumentFragment();
      list.forEach(g => {
        const obj = {
          title: g.title ?? g.name ?? g.id,
          icon: replace(g.icon ?? g.cover) || placeholder,
          link: replace(g.link ?? g.href ?? g.url ?? '#')
        };
        const el = createButtonElement(obj, placeholder);
        smallButtons.push(el);
        frag.appendChild(el);
      });
      node.appendChild(frag);
    });

    // ported: keep data, and initialize virtual view
    const portedFlat = flattenGames(data.ported ?? []).map(g => ({
      title: g.title ?? g.name ?? g.id,
      icon: replace(g.icon ?? g.cover) || placeholder,
      link: replace(g.link ?? g.href ?? g.url ?? '#')
    }));
    portedGames = portedFlat;
    if (containers.ported) setupVirtualPorted(containers.ported, portedGames, placeholder);

    // ---------------------------
    // Search: filter small lists and virtual ported (debounced)
    // ---------------------------
    const searchInput = document.getElementById('gameSearch');
    if (searchInput) {
      let t = 0;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const q = searchInput.value.trim().toLowerCase();
          // small lists
          smallButtons.forEach(btn => {
            const title = btn.querySelector('.title')?.textContent.toLowerCase() || '';
            btn.style.display = (!q || title.includes(q)) ? '' : 'none';
          });
          // ported: filter data and reinit virtual
          const filtered = q ? portedGames.filter(g => g.title.toLowerCase().includes(q)) : portedGames;
          if (containers.ported) setupVirtualPorted(containers.ported, filtered, placeholder);
        }, 120);
      });
    }

    // ensure slider placed after DOM changes
    requestAnimationFrame(updateSlider);
  } catch (err) {
    console.error('Failed to load games:', err);
  }
}

loadGames();
