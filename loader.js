const BASE_PATH = '/K3ysPlace/';
const resourceCache = new Map();

function normalizePath(p) {
  console.log('[normalizePath] input:', p);
  if (!p) return p;
  if (/^https?:\/\//i.test(p) || /^\/\//.test(p)) return p;
  const normalized = p.replace(/^\.\//, '').replace(/^\/+/, '');
  console.log('[normalizePath] normalized:', normalized);
  return normalized;
}

function getDir(p) {
  console.log('[getDir] input:', p);
  if (!p) return '';
  const n = normalizePath(p);
  const parts = n.split('/');
  parts.pop();
  const dir = parts.length ? parts.join('/') + '/' : '';
  console.log('[getDir] result:', dir);
  return dir;
}

function getFilename(p) {
  console.log('[getFilename] input:', p);
  if (!p) return '';
  const filename = p.split(/[\/\\]/).pop();
  console.log('[getFilename] result:', filename);
  return filename;
}

async function resourceExists(url) {
  console.log('[resourceExists] checking url:', url);
  if (resourceCache.has(url)) {
    console.log('[resourceExists] cache hit:', resourceCache.get(url));
    return resourceCache.get(url);
  }
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const ok = res.ok || (await fetch(url, { method: 'GET', cache: 'no-store' })).ok;
    resourceCache.set(url, ok);
    console.log(`[resourceExists] ${url}: ${ok ? 'found' : 'missing'}`);
    return ok;
  } catch (err) {
    console.warn(`[resourceExists] ${url}: fetch failed`, err);
    resourceCache.set(url, false);
    return false;
  }
}

function buildFallbackBases() {
  console.log('[buildFallbackBases] building fallback bases...');
  const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map(l => l.getAttribute('href'));
  const all = scripts.concat(links).map(normalizePath).filter(Boolean);
  const dirs = new Set();
  for (const p of all) dirs.add(getDir(p));
  const bases = [];
  for (const d of dirs) {
    if (!d) continue;
    bases.push(d);
    bases.push(window.location.origin + '/' + d);
  }
  bases.push('/');
  console.log('[buildFallbackBases] fallback bases:', bases);
  return Array.from(new Set(bases));
}

let fallbackBases = [];

function makeCandidates(orig) {
  console.log('[makeCandidates] generating candidates for:', orig);
  const normalized = normalizePath(orig);
  const filename = getFilename(orig);
  const list = [];

  if (orig) list.push(orig);

  if (normalized && filename) {
    for (const b of fallbackBases) {
      const base = b.endsWith('/') ? b : b + '/';
      list.push(base + filename);
      list.push('./' + base + filename);
      list.push('../' + base + filename);
      list.push('../../' + base + filename);
    }
  }

  list.push('/' + filename);
  console.log('[makeCandidates] candidates:', list);
  return Array.from(new Set(list));
}

async function getFirstAvailable(orig) {
  console.log('[getFirstAvailable] finding first available for:', orig);
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    console.log('[getFirstAvailable] checking candidate:', url);
    if (await resourceExists(url)) {
      console.log(`[getFirstAvailable] selected ${url} for ${orig}`);
      return url;
    }
  }
  console.warn(`[getFirstAvailable] all fallbacks failed for ${orig}`);
  return null;
}

async function tryLoadScript(old) {
  console.log('[tryLoadScript] processing script:', old.src);
  const orig = old.getAttribute('src');
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    console.log('[tryLoadScript] trying candidate:', url);
    if (await resourceExists(url)) {
      console.log('[tryLoadScript] loading script from:', url);
      const s = document.createElement('script');
      if (old.type) s.type = old.type;
      if (old.hasAttribute('async')) s.async = true;
      if (old.hasAttribute('defer')) s.defer = true;
      if (old.hasAttribute('nomodule') !== null) s.noModule = true;
      if (old.crossOrigin) s.crossOrigin = old.crossOrigin;
      if (old.integrity) s.integrity = old.integrity;
      for (const k of Object.keys(old.dataset)) s.dataset[k] = old.dataset[k];
      s.src = url;
      s.onerror = () => console.error('[tryLoadScript] failed to load script:', url);
      old.parentNode.insertBefore(s, old);
      old.parentNode.removeChild(old);
      console.log(`[tryLoadScript] Loaded script ${url}`);
      return;
    }
  }
  console.warn('[tryLoadScript] All fallbacks failed for script:', orig);
}

async function tryLoadLink(old) {
  console.log('[tryLoadLink] processing link:', old.href);
  const orig = old.getAttribute('href');
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    console.log('[tryLoadLink] trying candidate:', url);
    if (await resourceExists(url)) {
      console.log('[tryLoadLink] loading stylesheet from:', url);
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = url;
      if (old.crossOrigin) l.crossOrigin = old.crossOrigin;
      l.onerror = () => console.error('[tryLoadLink] failed to load stylesheet:', url);
      old.parentNode.insertBefore(l, old);
      old.parentNode.removeChild(old);
      return;
    }
  }
  console.warn('[tryLoadLink] All fallbacks failed for stylesheet:', orig);
}

function extractHrefFromOnclick(onclick) {
  console.log('[extractHrefFromOnclick] onclick content:', onclick);
  if (!onclick) return null;
  const m = /window\.location\.href\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (!m) return null;
  let href = m[1];
  if (href.startsWith('/')) href = BASE_PATH + href.slice(1);
  console.log('[extractHrefFromOnclick] extracted href:', href);
  return href;
}

function attachFallbacksToMenu() {
  const buttons = Array.from(document.querySelectorAll('.menuButton[onclick]'));
  console.log('[attachFallbacksToMenu] buttons found:', buttons.map(b => b.id));
  for (const btn of buttons) {
    const onclick = btn.getAttribute('onclick');
    const origHref = extractHrefFromOnclick(onclick);
    if (!origHref) continue;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', async e => {
      e.preventDefault();
      console.log(`[MenuButton] clicked ${btn.id}, original href: ${origHref}`);
      const linkUrl = await getFirstAvailable(origHref);
      console.log(`[MenuButton] navigating to: ${linkUrl || origHref}`);
      window.location.href = linkUrl || origHref;
    });
  }
}

function attachFallbacksToLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  console.log('[attachFallbacksToLinks] links found:', links.map(l => l.href));
  for (const a of links) {
    let href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    if (href.startsWith('/')) href = BASE_PATH + href.slice(1);
    a.addEventListener('click', async e => {
      e.preventDefault();
      console.log(`[Link] clicked <a> href=${href}`);
      const linkUrl = await getFirstAvailable(href);
      console.log(`[Link] navigating to: ${linkUrl || href}`);
      window.location.href = linkUrl || href;
    });
  }
}

async function injectRunnerResources() {
  console.log('[injectRunnerResources] injecting runner resources...');

  const head = document.head || document.getElementsByTagName("head")[0];
  const body = document.body || document.getElementsByTagName("body")[0];
  if (!head || !body) {
    console.warn('[injectRunnerResources] head or body not ready yet.');
    return;
  }

  const alreadyInjected = (id) => document.querySelector(`[data-injected-resource="${id}"]`);

  // Favicons and meta tags
  if (!alreadyInjected("favicons")) {
    console.log('[injectRunnerResources] injecting favicons...');
    const faviconData = [
      { rel: "apple-touch-icon", sizes: "180x180", href: BASE_PATH + "globalassets/favicon/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: BASE_PATH + "globalassets/favicon/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: BASE_PATH + "globalassets/favicon/favicon-16x16.png" },
      { rel: "manifest", href: BASE_PATH + "globalassets/favicon/site.webmanifest" },
      { rel: "mask-icon", href: BASE_PATH + "globalassets/favicon/safari-pinned-tab.svg" },
      { rel: "shortcut icon", href: BASE_PATH + "globalassets/favicon/favicon.ico" },
    ];
    faviconData.forEach(attrs => {
      const link = document.createElement("link");
      Object.keys(attrs).forEach(k => link.setAttribute(k, attrs[k]));
      link.setAttribute("data-injected-resource", "favicons");
      head.appendChild(link);
      console.log('[injectRunnerResources] added favicon link:', attrs.href);
    });

    const metaData = [
      { name: "theme-color", content: "#ffffff" },
      { name: "msapplication-TileColor", content: "#2d89ef" },
      { name: "msapplication-TileImage", content: BASE_PATH + "mstile-144x144.png" },
    ];
    metaData.forEach(attrs => {
      const meta = document.createElement("meta");
      Object.keys(attrs).forEach(k => meta.setAttribute(k, attrs[k]));
      meta.setAttribute("data-injected-resource", "favicons");
      head.appendChild(meta);
      console.log('[injectRunnerResources] added meta tag:', attrs.name || attrs.rel);
    });
  }

  // Theme CSS
  if (!alreadyInjected("theme-css")) {
    const themeLink = document.createElement("link");
    themeLink.rel = "stylesheet";
    themeLink.href = BASE_PATH + "globalassets/css/theme.css";
    themeLink.setAttribute("data-injected-resource", "theme-css");
    themeLink.onerror = () => console.error('[injectRunnerResources] failed to load theme CSS:', themeLink.href);
    head.appendChild(themeLink);
    console.log('[injectRunnerResources] injected theme CSS');
  }

  // Scripts
  const scripts = [
    { id: "particles-js", src: BASE_PATH + "globalassets/js/particles.js" },
    { id: "debug-js", src: BASE_PATH + "globalassets/js/debug.js" },
    { id: "theme-js", src: BASE_PATH + "globalassets/js/theme.js" },
  ];

  scripts.forEach(({ id, src }) => {
    if (!alreadyInjected(id)) {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.setAttribute("data-injected-resource", id);
      script.onerror = () => console.error('[injectRunnerResources] failed to load script:', src);
      body.appendChild(script);
      console.log(`[injectRunnerResources] injected script: ${src}`);
    }
  });

  // Particles canvas
  if (!alreadyInjected("particles-canvas")) {
    const canvas = document.createElement("canvas");
    canvas.id = "particles";
    canvas.setAttribute("data-injected-resource", "particles-canvas");
    body.insertBefore(canvas, body.firstChild);
    console.log('[injectRunnerResources] injected particles canvas');
  }

  console.log('[injectRunnerResources] injection complete.');
}

async function initialize() {
  console.log('[initialize] starting loader + runner initialization...');
  fallbackBases = buildFallbackBases();
  console.log('[initialize] fallbackBases:', fallbackBases);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      console.log('[initialize] DOMContentLoaded event fired');
      await injectRunnerResources();
      attachFallbacksToMenu();
      attachFallbacksToLinks();
      console.log('[initialize] initialization after DOM ready complete');
    });
  } else {
    await injectRunnerResources();
    attachFallbacksToMenu();
    attachFallbacksToLinks();
    console.log('[initialize] initialization immediate complete');
  }

  console.log('[initialize] loader + runner initialization setup done.');
}

await initialize();
console.log('[loader + runner] Loaded successfully.');

export { getFirstAvailable, makeCandidates, resourceExists };
