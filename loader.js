// ===== loader.js (fixed / annotated) =====
// Provides resource resolution and helpers for fallbacks (images, backgrounds, links).
// It attempts to discover the correct path for resources by checking candidate URLs
// (e.g. current folder, root, detected base), caches results, and exposes:
//   - resolvePathForResource(path)  (async, returns a working URL or the original path)
//   - getFirstAvailable(path) (async) and helpers used internally.
// Also attaches fallback click handlers for menu buttons and links.

const resourceCache = new Map();    // url -> boolean (exists)
const normalizedCache = new Map();  // inputPath -> normalized path string

// detect a base path from the current URL (e.g., /folder/)
const detectedBase = (() => {
  try {
    const path = window.location.pathname || "/";
    const segments = path.split("/").filter(Boolean);
    if (segments.length > 0 && !segments[0].includes(".")) return "/" + segments[0] + "/";
    return "/";
  } catch {
    return "/";
  }
})();

function normalizePath(p) {
  if (!p) return p;
  if (normalizedCache.has(p)) return normalizedCache.get(p);

  // if absolute URL, return as-is
  if (/^https?:\/\//i.test(p) || /^\/\//.test(p)) {
    normalizedCache.set(p, p);
    return p;
  }
  try {
    const url = new URL(p, document.baseURI);
    const normalized = url.pathname.replace(/^\//, "");
    normalizedCache.set(p, normalized);
    return normalized;
  } catch {
    const normalized = p.replace(/^\.\//, "").replace(/^\/+/, "");
    normalizedCache.set(p, normalized);
    return normalized;
  }
}

function makeCandidateUrls(path) {
  const normalized = normalizePath(path);
  // prefer detectedBase, then root, then relative
  return [detectedBase + normalized, "/" + normalized, normalized];
}

// check whether a resource exists at a URL. caches results in resourceCache
async function resourceExists(url) {
  if (resourceCache.has(url)) return resourceCache.get(url);
  try {
    // try HEAD first for speed (some servers may not support HEAD)
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (head && head.ok) {
      resourceCache.set(url, true);
      return true;
    }
    // fallback to GET
    const get = await fetch(url, { method: "GET", cache: "no-store" });
    const ok = !!(get && get.ok);
    resourceCache.set(url, ok);
    return ok;
  } catch {
    resourceCache.set(url, false);
    return false;
  }
}

function getCachedFirstAvailable(path) {
  try {
    return sessionStorage.getItem(`firstAvailable:${path}`);
  } catch {
    return null;
  }
}
function cacheFirstAvailable(path, url) {
  try {
    sessionStorage.setItem(`firstAvailable:${path}`, url);
  } catch {}
}

async function getFirstAvailable(path) {
  if (!path) return null;
  const cached = getCachedFirstAvailable(path);
  if (cached) return cached;
  const candidates = makeCandidateUrls(path);
  const checks = candidates.map(async url => (await resourceExists(url)) ? url : null);
  const results = await Promise.all(checks);
  const first = results.find(Boolean) || null;
  if (first) cacheFirstAvailable(path, first);
  return first;
}

async function resolvePathForResource(path) {
  if (!path) return null;
  // data: URLs are already resolved
  if (path.startsWith("data:")) return path;
  // strip leading slash for normalization helpers
  const p = path.startsWith("/") ? path.slice(1) : path;
  return await getFirstAvailable(p) || path;
}

// helpers to extract href from inline onclick handlers (legacy patterns)
function extractHrefFromOnclick(onclick) {
  if (!onclick) return null;
  const m1 = /window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (m1) return m1[1];
  const m2 = /location\.href\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (m2) return m2[1];
  return null;
}

function alreadyInjected(id) { return !!document.querySelector(`[data-injected-resource="${id}"]`); }

// script injection helper (non-blocking by default)
async function injectScript(src, id, place = "body", options = { blocking: false }) {
  if (alreadyInjected(id)) return;
  const resolvedPromise = (typeof window.resolvePathForResource === "function")
    ? window.resolvePathForResource(src).catch(() => src)
    : Promise.resolve(src);

  if (options.blocking) {
    const resolved = await resolvedPromise;
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = resolved || src;
      s.defer = true;
      s.setAttribute("data-injected-resource", id);
      s.onload = () => resolve();
      s.onerror = () => resolve();
      if (place === "head") (document.head || document.getElementsByTagName("head")[0]).appendChild(s);
      else (document.body || document.getElementsByTagName("body")[0]).appendChild(s);
    });
  } else {
    resolvedPromise.then(resolved => {
      try {
        const s = document.createElement("script");
        s.src = resolved || src;
        s.defer = true;
        s.setAttribute("data-injected-resource", id);
        if (place === "head") (document.head || document.getElementsByTagName("head")[0]).appendChild(s);
        else (document.body || document.getElementsByTagName("body")[0]).appendChild(s);
      } catch {}
    }).catch(() => {});
    return;
  }
}

// attach fallback behaviour to images that have data-fallback="true"
// it resolves their dataset.src and sets src/srcset accordingly
async function attachFallbacksToImages() {
  const imgs = Array.from(document.querySelectorAll('img[data-fallback="true"]'));
  for (const img of imgs) {
    if (!img.dataset.src || img.src) continue;
    try {
      img.src = await resolvePathForResource(img.dataset.src);
    } catch {
      img.src = img.dataset.src;
    }

    const srcset = img.getAttribute('srcset') || '';
    if (srcset) {
      const parts = srcset.split(',').map(s => s.trim()).filter(Boolean);
      const descriptors = parts.map(p => {
        const m = p.match(/^\s*([^\s]+)(\s+.+)?$/);
        return { url: m ? m[1] : p, desc: (m && m[2] ? m[2].trim() : '') };
      });
      const resolvedEntries = await Promise.all(descriptors.map(async d => {
        if (!d.url || d.url.startsWith('data:')) return null;
        const r = await resolvePathForResource(d.url);
        return r ? (d.desc ? `${r} ${d.desc}` : r) : null;
      }));
      const final = resolvedEntries.filter(Boolean).join(', ');
      if (final) img.setAttribute('srcset', final);
    }
  }
}

async function attachFallbacksToMenu() {
  const buttons = Array.from(document.querySelectorAll('.menuButton[onclick]'));
  for (const btn of buttons) {
    const onclick = btn.getAttribute('onclick') || '';
    const href = extractHrefFromOnclick(onclick);
    if (!href) continue;
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (/^https?:\/\//i.test(href)) window.open(href, '_blank');
      else window.location.href = href;
      // also kick off a background resolution attempt
      if (typeof window.resolvePathForResource === "function") window.resolvePathForResource(href).catch(() => {});
    });
  }
}

async function attachFallbacksToLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  for (const a of links) {
    const href = a.getAttribute('href');
    if (!href || href.trim().startsWith('#') || href.trim().startsWith('mailto:') || /^javascript:/i.test(href)) continue;
    a.addEventListener('click', async e => {
      e.preventDefault();
      const candidate = await resolvePathForResource(href);
      window.location.href = candidate || href;
    });
  }
}

async function attachFallbacksToBackgrounds() {
  const els = Array.from(document.querySelectorAll('[data-bg], [style*="background-image"]'));
  for (const el of els) {
    const dataBg = el.getAttribute('data-bg');
    if (dataBg && !dataBg.startsWith('data:')) {
      try {
        const candidate = await resolvePathForResource(dataBg);
        if (candidate) el.style.backgroundImage = `url("${candidate}")`;
      } catch {}
      continue;
    }
    const styleBg = el.style.backgroundImage || '';
    const m = /url\(["']?([^"')]+)["']?\)/.exec(styleBg);
    if (!m) continue;
    const path = m[1];
    if (path.startsWith('data:')) continue;
    try {
      const candidate = await resolvePathForResource(path);
      if (candidate) el.style.backgroundImage = `url("${candidate}")`;
    } catch {}
  }
}

async function attachFallbacksToCSSBackgrounds() {
  if (!document.styleSheets) return;
  const urlRegex = /url\(["']?([^"')]+)["']?\)/i;
  const tasks = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (!rule || !rule.style) continue;
        const bg = rule.style.backgroundImage || rule.style.background;
        if (!bg) continue;
        const m = urlRegex.exec(bg);
        if (!m) continue;
        const foundUrl = m[1];
        if (!foundUrl || foundUrl.startsWith('data:')) continue;
        const task = (async () => {
          try {
            const resolved = await resolvePathForResource(foundUrl);
            if (resolved && resolved !== foundUrl) {
              const newBg = bg.replace(urlRegex, `url("${resolved}")`);
              rule.style.backgroundImage = newBg;
              if (rule.style.background) rule.style.background = newBg;
            }
          } catch {}
        })();
        tasks.push(task);
      }
    } catch {
      continue; // some stylesheets (cross-origin) will throw; ignore them
    }
  }
  try { await Promise.all(tasks); } catch {}
}

// debounce helper local to this module (used by mutation reprocessing)
function debounceLocal(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

const reprocessAddedNodes = debounceLocal(async (nodes) => {
  const needImages = [];
  const needBackgrounds = [];
  for (const node of nodes) {
    if (node.nodeType !== 1) continue;
    if (node.matches && node.matches('img[data-fallback="true"], [data-bg], [style*="background-image"]')) {
      if (node.matches('img[data-fallback="true"]')) needImages.push(node);
      else needBackgrounds.push(node);
    }
    const imgs = node.querySelectorAll ? node.querySelectorAll('img[data-fallback="true"]') : [];
    imgs.forEach(i => needImages.push(i));
    const bgs = node.querySelectorAll ? node.querySelectorAll('[data-bg], [style*="background-image"]') : [];
    bgs.forEach(b => needBackgrounds.push(b));
  }
  if (needImages.length) {
    try {
      await Promise.all(needImages.map(async i => {
        if (!i.dataset.src || i.src) return;
        try { i.src = await resolvePathForResource(i.dataset.src); } catch { i.src = i.dataset.src; }
      }));
    } catch {}
  }
  if (needBackgrounds.length) {
    try {
      await Promise.all(needBackgrounds.map(async el => {
        const dataBg = el.getAttribute('data-bg');
        if (dataBg && !dataBg.startsWith('data:')) {
          try {
            const candidate = await resolvePathForResource(dataBg);
            if (candidate) el.style.backgroundImage = `url("${candidate}")`;
            return;
          } catch {}
        }
        const styleBg = el.style.backgroundImage || '';
        const m = /url\(["']?([^"')]+)["']?\)/.exec(styleBg);
        if (!m) return;
        const path = m[1];
        if (path.startsWith('data:')) return;
        try {
          const candidate = await resolvePathForResource(path);
          if (candidate) el.style.backgroundImage = `url("${candidate}")`;
        } catch {}
      }));
    } catch {}
  }
}, 200);

const observer = new MutationObserver(mutations => {
  const added = [];
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length) m.addedNodes.forEach(n => added.push(n));
  }
  if (added.length) reprocessAddedNodes(added);
});

// initialize fallbacks and attach observer
async function initialize() {
  attachFallbacksToMenu();
  attachFallbacksToLinks();
  attachFallbacksToImages();
  attachFallbacksToBackgrounds();
  attachFallbacksToCSSBackgrounds();

  // OPTIONAL: inject additional scripts if you want them (theme, particles, debug).
  // They are useful but can be commented out if you don't need them on the games page:
  // injectScript('globalassets/js/theme.js', 'theme-js', 'head');
  // injectScript('globalassets/js/particles.js', 'particles-js');
  // injectScript('globalassets/js/debug.js', 'debug-js');

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

initialize().catch(() => {});

// exports (also attach to window for non-module consumers)
export { getFirstAvailable, makeCandidateUrls, resourceExists, resolvePathForResource as getFirstAvailablePath };
window.resolvePathForResource = resolvePathForResource;
window.attachFallbacksToImages = attachFallbacksToImages;
window.attachFallbacksToMenu = attachFallbacksToMenu;
