// loader.js with debug logs

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

async function initialize() {
  console.log('[initialize] starting loader.js initialization...');
  fallbackBases = buildFallbackBases();

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
  console.log('[initialize] loader.js initialization complete.');
}

await initialize();

export {getFirstAvailable, makeCandidates, resourceExists };
