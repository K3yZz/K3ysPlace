// loader.js

// --- CONFIG ---
// GitHub Pages repository folder (adjust if needed)
const BASE_PATH = '/K3ysPlace/';

// --- Resource cache ---
const resourceCache = new Map();

// --- Path utilities ---
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

// --- Check if resource exists ---
async function resourceExists(url) {
  if (resourceCache.has(url)) return resourceCache.get(url);
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const ok = res.ok || (await fetch(url, { method: 'GET', cache: 'no-store' })).ok;
    resourceCache.set(url, ok);
    return ok;
  } catch {
    resourceCache.set(url, false);
    return false;
  }
}

// --- Build fallback directories ---
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
  return Array.from(new Set(bases));
}

let fallbackBases = [];

// --- Generate fallback candidates with relative paths ---
function makeCandidates(orig) {
  const normalized = normalizePath(orig);
  const filename = getFilename(orig);
  const list = [];

  if (orig) list.push(orig); // original

  if (normalized && filename) {
    for (const b of fallbackBases) {
      const base = b.endsWith('/') ? b : b + '/';
      list.push(base + filename);            // base + filename
      list.push('./' + base + filename);     // current directory
      list.push('../' + base + filename);    // one level up
      list.push('../../' + base + filename); // two levels up
    }
  }

  list.push('/' + filename); // root fallback
  return Array.from(new Set(list));
}

// --- Get first available URL ---
async function getFirstAvailable(orig) {
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    if (await resourceExists(url)) return url;
  }
  return null;
}

// --- Load script with fallback ---
async function tryLoadScript(old) {
  const orig = old.getAttribute('src');
  const candidates = makeCandidates(orig);
  for (const url of candidates) {
    if (await resourceExists(url)) {
      const s = document.createElement('script');
      if (old.type) s.type = old.type;
      if (old.hasAttribute('async')) s.async = true;
      if (old.hasAttribute('defer')) s.defer = true;
      if (old.getAttribute('nomodule') !== null) s.noModule = true;
      if (old.crossOrigin) s.crossOrigin = old.crossOrigin;
      if (old.integrity) s.integrity = old.integrity;
      for (const k of Object.keys(old.dataset)) s.dataset[k] = old.dataset[k];
      s.src = url;
      old.parentNode.insertBefore(s, old);
      old.parentNode.removeChild(old);
      return;
    }
  }
  console.warn('All fallbacks failed for script:', orig);
}

// --- Load CSS with fallback ---
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
      return;
    }
  }
  console.warn('All fallbacks failed for stylesheet:', orig);
}

// --- Extract href from inline onclick ---
function extractHrefFromOnclick(onclick) {
  if (!onclick) return null;
  const m = /window\.location\.href\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (!m) return null;
  let href = m[1];
  // Prepend base path for GitHub Pages if it starts with '/'
  if (href.startsWith('/')) href = BASE_PATH + href.slice(1);
  return href;
}

// --- Fallbacks for menu buttons ---
function attachFallbacksToMenu() {
  const buttons = Array.from(document.querySelectorAll('.menuButton[onclick]'));
  for (const btn of buttons) {
    const onclick = btn.getAttribute('onclick');
    const origHref = extractHrefFromOnclick(onclick);
    if (!origHref) continue;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', async e => {
      e.preventDefault();
      const linkUrl = await getFirstAvailable(origHref);
      window.location.href = linkUrl || origHref;
    });
  }
}

// --- Fallbacks for <a> links ---
function attachFallbacksToLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  for (const a of links) {
    let href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    if (href.startsWith('/')) href = BASE_PATH + href.slice(1);
    a.addEventListener('click', async e => {
      e.preventDefault();
      const linkUrl = await getFirstAvailable(href);
      window.location.href = linkUrl || href;
    });
  }
}

// --- Initialization ---
async function initialize() {
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
}

// --- Exports ---
export { initialize, getFirstAvailable, makeCandidates, resourceExists };
