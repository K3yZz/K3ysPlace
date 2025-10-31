const BASE_PATH = '/K3ysPlace/';
const resourceCache = new Map();

function normalizePath(p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p) || /^\/\//.test(p)) return p;
  return p.replace(/^\.\//, '').replace(/^\/+/, '');
}

function getDir(p) {
  if (!p) return '';
  const n = normalizePath(p);
  const parts = n.split('/');
  parts.pop();
  return parts.length ? parts.join('/') + '/' : '';
}

function getFilename(p) {
  if (!p) return '';
  return p.split(/[\/\\]/).pop();
}

async function resourceExists(url) {
  if (resourceCache.has(url)) return resourceCache.get(url);
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const ok = res.ok || (await fetch(url, { method: 'GET', cache: 'no-store' })).ok;
    resourceCache.set(url, ok);
    console.log(`[resourceExists] ${url}: ${ok ? 'found' : 'missing'}`);
    return ok;
  } catch {
    resourceCache.set(url, false);
    console.warn(`[resourceExists] ${url}: failed to fetch`);
    return false;
  }
}

function buildFallbackBases() {
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
  console.log('[makeCandidates] candidates for', orig, ':', list);
  return Array.from(new Set(list));
}

async function getFirstAvailable(orig) {
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    if (await resourceExists(url)) {
      console.log(`[getFirstAvailable] using ${url} for ${orig}`);
      return url;
    }
  }
  console.warn(`[getFirstAvailable] all fallbacks failed for ${orig}`);
  return null;
}

async function tryLoadScript(old) {
  const orig = old.getAttribute('src');
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    if (await resourceExists(url)) {
      const s = document.createElement('script');
      if (old.type) s.type = old.type;
      if (old.hasAttribute('async')) s.async = true;
      if (old.hasAttribute('defer')) s.defer = true;
      if (old.hasAttribute('nomodule') !== null) s.noModule = true;
      if (old.crossOrigin) s.crossOrigin = old.crossOrigin;
      if (old.integrity) s.integrity = old.integrity;
      for (const k of Object.keys(old.dataset)) s.dataset[k] = old.dataset[k];
      s.src = url;
      old.parentNode.insertBefore(s, old);
      old.parentNode.removeChild(old);
      console.log(`[tryLoadScript] Loaded script ${url}`);
      return;
    }
  }
  console.warn('[tryLoadScript] All fallbacks failed for script:', orig);
}

async function tryLoadLink(old) {
  const orig = old.getAttribute('href');
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    if (await resourceExists(url)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = url;
      if (old.crossOrigin) l.crossOrigin = old.crossOrigin;
      old.parentNode.insertBefore(l, old);
      old.parentNode.removeChild(old);
      console.log(`[tryLoadLink] Loaded stylesheet ${url}`);
      return;
    }
  }
  console.warn('[tryLoadLink] All fallbacks failed for stylesheet:', orig);
}

function extractHrefFromOnclick(onclick) {
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
  console.log('[attachFallbacksToMenu] found buttons:', buttons.map(b => b.id));
  for (const btn of buttons) {
    const onclick = btn.getAttribute('onclick');
    const origHref = extractHrefFromOnclick(onclick);
    if (!origHref) continue;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', async e => {
      e.preventDefault();
      console.log(`[MenuButton] clicking ${btn.id} -> ${origHref}`);
      const linkUrl = await getFirstAvailable(origHref);
      window.location.href = linkUrl || origHref;
    });
  }
}

function attachFallbacksToLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  console.log('[attachFallbacksToLinks] found links:', links.map(l => l.href));
  for (const a of links) {
    let href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    if (href.startsWith('/')) href = BASE_PATH + href.slice(1);
    a.addEventListener('click', async e => {
      e.preventDefault();
      console.log(`[Link] clicking <a> href=${href}`);
      const linkUrl = await getFirstAvailable(href);
      window.location.href = linkUrl || href;
    });
  }
}

async function injectRunnerResources() {
  const allowedPages = ['/index.html', '/apps.html', '/games.html', '/settings.html'];
  const pathname = window.location.pathname;

  // Only run injections on allowed pages
  if (!allowedPages.includes(pathname)) {
    console.log(`[injectRunnerResources] Skipping injections for ${pathname}`);
    return;
  }

  const head = document.head || document.getElementsByTagName("head")[0];
  const body = document.body || document.getElementsByTagName("body")[0];
  if (!head || !body) return;

  const alreadyInjected = (id) => document.querySelector(`[data-injected-resource="${id}"]`);

  if (!alreadyInjected("favicons")) {
    const faviconData = [
      { rel: "apple-touch-icon", sizes: "180x180", href: "/globalassets/favicon/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/globalassets/favicon/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/globalassets/favicon/favicon-16x16.png" },
      { rel: "manifest", href: "/globalassets/favicon/site.webmanifest" },
      { rel: "mask-icon", href: "/globalassets/favicon/safari-pinned-tab.svg" },
      { rel: "shortcut icon", href: "/globalassets/favicon/favicon.ico" },
    ];
    faviconData.forEach(attrs => {
      const link = document.createElement("link");
      Object.keys(attrs).forEach(k => link.setAttribute(k, attrs[k]));
      link.setAttribute("data-injected-resource", "favicons");
      head.appendChild(link);
    });
    const metaData = [
      { name: "theme-color", content: "#ffffff" },
      { name: "msapplication-TileColor", content: "#2d89ef" },
      { name: "msapplication-TileImage", content: "/mstile-144x144.png" },
    ];
    metaData.forEach(attrs => {
      const meta = document.createElement("meta");
      Object.keys(attrs).forEach(k => meta.setAttribute(k, attrs[k]));
      meta.setAttribute("data-injected-resource", "favicons");
      head.appendChild(meta);
    });
  }

  if (!alreadyInjected("theme-css")) {
    const themeLink = document.createElement("link");
    themeLink.rel = "stylesheet";
    themeLink.href = "/globalassets/css/theme.css";
    themeLink.setAttribute("data-injected-resource", "theme-css");
    head.appendChild(themeLink);
  }

  const scripts = [
    { id: "particles-js", src: "/globalassets/js/particles.js" },
    { id: "debug-js", src: "/globalassets/js/debug.js" },
    { id: "theme-js", src: "/globalassets/js/theme.js" },
  ];

  scripts.forEach(({ id, src }) => {
    if (!alreadyInjected(id)) {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.setAttribute("data-injected-resource", id);
      body.appendChild(script);
    }
  });

  if (!alreadyInjected("particles-canvas")) {
    const canvas = document.createElement("canvas");
    canvas.id = "particles";
    canvas.setAttribute("data-injected-resource", "particles-canvas");
    body.insertBefore(canvas, body.firstChild);
  }

  console.log(`[injectRunnerResources] Resources injected for ${pathname}`);
}

async function initialize() {
  console.log('[initialize] starting loader + runner initialization...');
  fallbackBases = buildFallbackBases();

  await injectRunnerResources();

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'));

  for (const link of links) await tryLoadLink(link);
  for (const script of scripts) await tryLoadScript(script);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attachFallbacksToMenu();
      attachFallbacksToLinks();
    });
  } else {
    attachFallbacksToMenu();
    attachFallbacksToLinks();
  }

  console.log('[initialize] loader + runner initialization complete.');
}

await initialize();
console.log('[loader + runner] Loaded successfully.');

export { getFirstAvailable, makeCandidates, resourceExists };
