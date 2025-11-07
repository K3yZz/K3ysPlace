const resourceCache = new Map();
const normalizedCache = new Map();

const detectedBase = (() => {
  const path = window.location.pathname || '/';
  const segments = path.split('/');
  if (segments.length > 1 && segments[1] && !segments[1].includes('.')) {
    return '/' + segments[1] + '/';
  }
  return '/';
})();

function normalizePath(p) {
  if (!p) return p;
  if (normalizedCache.has(p)) return normalizedCache.get(p);
  if (/^https?:\/\//i.test(p) || /^\/\//.test(p)) {
    normalizedCache.set(p, p);
    return p;
  }
  try {
    const url = new URL(p, document.baseURI);
    const normalized = url.pathname.replace(/^\//, '');
    normalizedCache.set(p, normalized);
    return normalized;
  } catch {
    const normalized = p.replace(/^\.\//, '').replace(/^\/+/, '');
    normalizedCache.set(p, normalized);
    return normalized;
  }
}

function makeCandidateUrls(path) {
  const normalized = normalizePath(path);
  return [detectedBase + normalized, '/' + normalized, normalized];
}

async function resourceExists(url) {
  if (resourceCache.has(url)) return resourceCache.get(url);
  try {
    const head = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) {
      resourceCache.set(url, true);
      return true;
    }
    const get = await fetch(url, { method: 'GET', cache: 'no-store' });
    const ok = get.ok;
    resourceCache.set(url, ok);
    if (!ok) console.debug('resourceExists failed for', url, 'status', get.status);
    return ok;
  } catch (err) {
    console.debug('resourceExists error for', url, err);
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

function extractHrefFromOnclick(onclick) {
  if (!onclick) return null;
  const m1 = /window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (m1) return m1[1];
  const m2 = /location\.href\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (m2) return m2[1];
  return null;
}

async function resolvePathForResource(path) {
  if (!path) return null;
  if (path.startsWith('data:')) return path;
  const p = path.startsWith('/') ? path.slice(1) : path;
  const found = await getFirstAvailable(p);
  return found || path;
}

async function attachFallbacksToMenu() {
  const buttons = Array.from(document.querySelectorAll('.menuButton[onclick]'));
  for (const btn of buttons) {
    const onclick = btn.getAttribute('onclick') || '';
    const origHref = extractHrefFromOnclick(onclick);
    if (!origHref) continue;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', async e => {
      e.preventDefault();
      const candidate = await resolvePathForResource(origHref);
      window.location.href = candidate || origHref;
    });
  }
}

function shouldIgnoreHref(href) {
  if (!href) return true;
  const trimmed = href.trim();
  return trimmed.startsWith('#') || trimmed.startsWith('mailto:') || /^javascript:/i.test(trimmed);
}

async function attachFallbacksToLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  for (const a of links) {
    const href = a.getAttribute('href');
    if (shouldIgnoreHref(href)) continue;
    a.addEventListener('click', async e => {
      e.preventDefault();
      const candidate = await resolvePathForResource(href);
      window.location.href = candidate || href;
    });
  }
}

async function attachFallbacksToClickableDivs() {
  const divs = Array.from(document.querySelectorAll('[onclick]'));
  for (const el of divs) {
    const onclick = el.getAttribute('onclick');
    if (!onclick) continue;
    const match = /window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
    if (!match) continue;
    const originalHref = match[1];
    el.removeAttribute('onclick');
    el.addEventListener('click', async e => {
      e.preventDefault();
      const candidate = await resolvePathForResource(originalHref);
      window.location.href = candidate || originalHref;
    });
  }
}

async function attachFallbacksToImages() {
  const imgs = Array.from(document.querySelectorAll('img'));
  for (const img of imgs) {
    const dataSrc = img.getAttribute('data-src');
    const src = img.getAttribute('src') || dataSrc || '';
    if (!src || src.startsWith('data:')) continue;
    const resolved = await resolvePathForResource(src);
    if (resolved) {
      if (dataSrc) img.setAttribute('data-src', resolved);
      img.src = resolved;
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

async function attachFallbacksToBackgrounds() {
  const els = Array.from(document.querySelectorAll('[data-bg], [style*="background-image"]'));
  for (const el of els) {
    const dataBg = el.getAttribute('data-bg');
    if (dataBg && !dataBg.startsWith('data:')) {
      const candidate = await resolvePathForResource(dataBg);
      if (candidate) el.style.backgroundImage = `url("${candidate}")`;
      continue;
    }
    const styleBg = el.style.backgroundImage || '';
    const m = /url\(["']?([^"')]+)["']?\)/.exec(styleBg);
    if (!m) continue;
    const path = m[1];
    if (path.startsWith('data:')) continue;
    const candidate = await resolvePathForResource(path);
    if (candidate) el.style.backgroundImage = `url("${candidate}")`;
  }
}

function alreadyInjected(id) {
  return Boolean(document.querySelector(`[data-injected-resource="${id}"]`));
}

async function injectScript(src, id, place = 'body') {
  if (alreadyInjected(id)) return;
  const resolved = await resolvePathForResource(src);
  const script = document.createElement('script');
  script.src = resolved || src;
  if (place === 'body') script.defer = true;
  script.setAttribute('data-injected-resource', id);
  return new Promise(resolve => {
    script.onload = () => resolve();
    script.onerror = () => resolve();
    if (place === 'head') (document.head || document.getElementsByTagName('head')[0]).appendChild(script);
    else (document.body || document.getElementsByTagName('body')[0]).appendChild(script);
  });
}

async function injectRunnerResources() {
  const head = document.head || document.getElementsByTagName('head')[0];
  const body = document.body || document.getElementsByTagName('body')[0];
  if (!head || !body) return;

  if (!alreadyInjected('favicons')) {
    const faviconData = [
      { rel: 'apple-touch-icon', sizes: '180x180', href: 'globalassets/favicon/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'globalassets/favicon/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'globalassets/favicon/favicon-16x16.png' },
      { rel: 'manifest', href: 'globalassets/favicon/site.webmanifest' },
      { rel: 'mask-icon', href: 'globalassets/favicon/safari-pinned-tab.svg' },
      { rel: 'shortcut icon', href: 'globalassets/favicon/favicon.ico' }
    ];
    for (const attrs of faviconData) {
      const link = document.createElement('link');
      for (const k of Object.keys(attrs)) link.setAttribute(k, attrs[k]);
      link.setAttribute('data-injected-resource', 'favicons');
      head.appendChild(link);
    }
    const metaData = [
      { name: 'theme-color', content: '#ffffff' },
      { name: 'msapplication-TileColor', content: '#2d89ef' },
      { name: 'msapplication-TileImage', content: 'mstile-144x144.png' }
    ];
    for (const attrs of metaData) {
      const meta = document.createElement('meta');
      for (const k of Object.keys(attrs)) meta.setAttribute(k, attrs[k]);
      meta.setAttribute('data-injected-resource', 'favicons');
      head.appendChild(meta);
    }
  }

  if (!alreadyInjected('theme-css')) {
    const themeHref = await resolvePathForResource('globalassets/css/theme.css') || 'globalassets/css/theme.css';
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = themeHref;
    themeLink.setAttribute('data-injected-resource', 'theme-css');
    head.appendChild(themeLink);
  }

  await injectScript('globalassets/js/theme.js', 'theme-js', 'head');
  await injectScript('globalassets/js/particles.js', 'particles-js');
  await injectScript('globalassets/js/debug.js', 'debug-js');

  if (!alreadyInjected('particles-canvas')) {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles';
    canvas.setAttribute('data-injected-resource', 'particles-canvas');
    body.insertBefore(canvas, body.firstChild);
  }

  if (typeof window.initParticles === 'function') {
    try {
      window.initParticles();
    } catch {}
  }
}

function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

const reprocessAddedNodes = debounce(async () => {
  await attachFallbacksToMenu();
  await attachFallbacksToLinks();
  await attachFallbacksToImages();
  await attachFallbacksToBackgrounds();
  await attachFallbacksToClickableDivs();
}, 200);

const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length) {
      reprocessAddedNodes();
      return;
    }
  }
});

async function initialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await injectRunnerResources();
      attachFallbacksToMenu();
      attachFallbacksToLinks();
      await attachFallbacksToImages();
      await attachFallbacksToBackgrounds();
      await attachFallbacksToClickableDivs();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    await injectRunnerResources();
    attachFallbacksToMenu();
    attachFallbacksToLinks();
    await attachFallbacksToImages();
    await attachFallbacksToBackgrounds();
    await attachFallbacksToClickableDivs();
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

await initialize();

export { getFirstAvailable, makeCandidateUrls, resourceExists };
