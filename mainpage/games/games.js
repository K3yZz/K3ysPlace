import {
  resolvePathForResource,
  attachFallbacksToImages,
  attachFallbacksToClickableDivs
} from '../../loader.js';

const containers = {
  unported: document.getElementById('notportedContent'),
  ported: document.getElementById('portedContent'),
  emulator: document.getElementById('emulatorsContent')
};

const unportedRadio = document.getElementById('unported');
const portedRadio = document.getElementById('ported');
const emulatorRadio = document.getElementById('emulator');
const radioButtons = [unportedRadio, portedRadio, emulatorRadio];
const slider = document.querySelector('.slider');
const switchEl = document.querySelector('.three-way-switch');

// ---------------------------
// Slider + Game category switch
// ---------------------------
function updateSlider() {
  if (!switchEl || !slider) return;
  const labels = Array.from(switchEl.querySelectorAll('label'));
  const index = radioButtons.findIndex(r => r && r.checked);
  if (index === -1 || !labels[index]) return;

  const targetLabel = labels[index];
  const parentRect = switchEl.getBoundingClientRect();
  const labelRect = targetLabel.getBoundingClientRect();

  // Center the circle over the label
  const leftOffset = labelRect.left - parentRect.left + (labelRect.width - slider.offsetWidth) / 2;

  slider.style.transform = `translateX(${leftOffset}px)`;
}

function updateGameView() {
  if (containers.unported) containers.unported.style.display = unportedRadio && unportedRadio.checked ? 'flex' : 'none';
  if (containers.ported) containers.ported.style.display = portedRadio && portedRadio.checked ? 'flex' : 'none';
  if (containers.emulator) containers.emulator.style.display = emulatorRadio && emulatorRadio.checked ? 'flex' : 'none';
  updateSlider();
}

radioButtons.forEach(r => {
  if (r) r.addEventListener('change', updateGameView);
});
window.addEventListener('resize', () => requestAnimationFrame(updateSlider));
requestAnimationFrame(updateSlider);
updateGameView();

// ---------------------------
// Flatten nested game arrays
// ---------------------------
function flattenGames(list) {
  if (!Array.isArray(list)) return [];
  return list.reduce((acc, item) => {
    if (Array.isArray(item)) return acc.concat(flattenGames(item));
    if (item == null) return acc;
    return acc.concat(item);
  }, []);
}

// ---------------------------
// Load games
// ---------------------------
async function loadGames() {
  const COVER_URL = '../../globalassets/gameIcons';
  const HTML_URL = '/portedgames';

  const replacePlaceholders = str =>
    typeof str === 'string'
      ? str.replace(/\{COVER_URL\}/g, COVER_URL).replace(/\{HTML_URL\}/g, HTML_URL)
      : str;

  try {
    const res = await fetch(new URL('./games.json', import.meta.url));
    if (!res.ok) throw new Error(`games.json not found (status ${res.status})`);
    const data = await res.json();

    for (const [category, list] of Object.entries(data)) {
      const container = containers[category];
      if (!container) continue;

      const games = flattenGames(list);
      const frag = document.createDocumentFragment();

      for (const game of games) {
        const href = replacePlaceholders(game.link ?? game.href ?? game.url ?? '#');
        const icon = replacePlaceholders(game.icon ?? game.cover ?? '../../globalassets/gameIcons/placeholder.png');
        const titleText = game.title ?? game.name ?? game.id ?? 'Untitled';

        const btn = document.createElement('a');
        btn.classList.add('game-button', 'blur');
        btn.href = href;
        btn.target = '_self';
        btn.rel = 'noopener';

        const img = document.createElement('img');
        img.loading = 'lazy';
        // resolvePathForResource may throw; guard it
        try {
          const resolved = await resolvePathForResource(icon);
          img.src = resolved || icon;
        } catch (e) {
          img.src = icon;
        }
        img.onerror = () => {
          img.src = '../../globalassets/gameIcons/placeholder.png';
        };
        btn.appendChild(img);

        const title = document.createElement('span');
        title.classList.add('title');
        title.textContent = titleText;
        btn.appendChild(title);

        frag.appendChild(btn);
      }

      container.appendChild(frag);
    }

    // Apply loader fallbacks to the dynamically added elements
    try {
      await attachFallbacksToImages();
      await attachFallbacksToClickableDivs();
    } catch (e) {
      console.warn('Loader fallback functions threw an error:', e);
    }

    // ---------------------------
    // Search bar functionality
    // ---------------------------
    const searchInput = document.getElementById('gameSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        document.querySelectorAll('.game-button').forEach(btn => {
          const title = (btn.querySelector('.title')?.textContent || '').toLowerCase();
          btn.style.display = q === '' || title.includes(q) ? '' : 'none';
        });
      });
    }

    // One final layout pass for the slider now that elements are added
    requestAnimationFrame(updateSlider);

  } catch (err) {
    console.error('Failed to load games:', err);
    // Helpful debug info
    if (err && err.message) console.error('Error message:', err.message);
  }
}

loadGames();
