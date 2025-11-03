const resourceCache = new Map();
const normalizedCache = new Map();

// Detect the "app base" folder if present, fallback to root '/'
const detectedBase = (() => {
  const path = window.location.pathname;
  const segments = path.split('/');
  if (segments.length > 1 && segments[1] && !segments[1].includes('.')) {
    return '/' + segments[1] + '/';
  }
  return '/';
})();

function normalizePath(p) {
  if (!p) return p;
  if (normalizedCache.has(p)) return normalizedCache.get(p);
  if (/^https?:\/\//i.test(p) || /^\/\//.test(p)) return p;
  const normalized = p.replace(/^\.\//, '').replace(/^\/+/, '');
  normalizedCache.set(p, normalized);
  return normalized;
}

function makeCandidateUrls(path) {
  const normalized = normalizePath(path);
  return [detectedBase + normalized, '/' + normalized];
}

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

// Persistent cache for first-available URLs
function getCachedFirstAvailable(path) {
  return sessionStorage.getItem(`firstAvailable:${path}`);
}

function cacheFirstAvailable(path, url) {
  sessionStorage.setItem(`firstAvailable:${path}`, url);
}

async function getFirstAvailable(path) {
  const cached = getCachedFirstAvailable(path);
  if (cached) return cached;

  const candidates = makeCandidateUrls(path);
  const checks = candidates.map(url =>
    resourceExists(url).then(ok => (ok ? url : null))
  );
  const results = await Promise.all(checks);
  const first = results.find(Boolean);
  if (first) cacheFirstAvailable(path, first);
  return first || null;
}

function extractHrefFromOnclick(onclick) {
  if (!onclick) return null;
  const m = /window\.location\.href\s*=\s*['"]([^'"]+)['"]/i.exec(onclick);
  if (!m) return null;
  let href = m[1];
  if (href.startsWith('/')) href = href.slice(1);
  return href;
}

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

function attachFallbacksToLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  for (const a of links) {
    let href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    if (href.startsWith('/')) href = href.slice(1);
    a.addEventListener('click', async e => {
      e.preventDefault();
      const linkUrl = await getFirstAvailable(href);
      window.location.href = linkUrl || href;
    });
  }
}

// Inject a script and wait for it to load
async function injectScript(src, id) {
  return new Promise(async resolve => {
    if (document.querySelector(`[data-injected-resource="${id}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = await getFirstAvailable(src) || src;
    script.defer = true;
    script.setAttribute('data-injected-resource', id);
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

async function injectRunnerResources() {
  const head = document.head || document.getElementsByTagName('head')[0];
  const body = document.body || document.getElementsByTagName('body')[0];
  if (!head || !body) return;

  const alreadyInjected = (id) => document.querySelector(`[data-injected-resource="${id}"]`);

  // Favicons
  if (!alreadyInjected('favicons')) {
    const faviconData = [
      { rel: 'apple-touch-icon', sizes: '180x180', href: 'globalassets/favicon/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'globalassets/favicon/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'globalassets/favicon/favicon-16x16.png' },
      { rel: 'manifest', href: 'globalassets/favicon/site.webmanifest' },
      { rel: 'mask-icon', href: 'globalassets/favicon/safari-pinned-tab.svg' },
      { rel: 'shortcut icon', href: 'globalassets/favicon/favicon.ico' },
    ];
    faviconData.forEach(attrs => {
      const link = document.createElement('link');
      Object.keys(attrs).forEach(k => link.setAttribute(k, attrs[k]));
      link.setAttribute('data-injected-resource', 'favicons');
      head.appendChild(link);
    });

    const metaData = [
      { name: 'theme-color', content: '#ffffff' },
      { name: 'msapplication-TileColor', content: '#2d89ef' },
      { name: 'msapplication-TileImage', content: 'mstile-144x144.png' },
    ];
    metaData.forEach(attrs => {
      const meta = document.createElement('meta');
      Object.keys(attrs).forEach(k => meta.setAttribute(k, attrs[k]));
      meta.setAttribute('data-injected-resource', 'favicons');
      head.appendChild(meta);
    });
  }

  // Theme CSS
  if (!alreadyInjected('theme-css')) {
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = await getFirstAvailable('globalassets/css/theme.css') || 'globalassets/css/theme.css';
    themeLink.setAttribute('data-injected-resource', 'theme-css');
    head.appendChild(themeLink);
  }

  // Inject theme.js first in head (prevents flash)
  await injectScript('globalassets/js/theme.js', 'theme-js', true);

  // Other scripts in body
  await injectScript('globalassets/js/particles.js', 'particles-js');
  await injectScript('globalassets/js/debug.js', 'debug-js');

  // Particles canvas
  if (!alreadyInjected('particles-canvas')) {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles';
    canvas.setAttribute('data-injected-resource', 'particles-canvas');
    body.insertBefore(canvas, body.firstChild);
  }

  // Initialize particles
  if (typeof initParticles === 'function') initParticles();
}

async function initialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await injectRunnerResources();
      attachFallbacksToMenu();
      attachFallbacksToLinks();
    });
  } else {
    await injectRunnerResources();
    attachFallbacksToMenu();
    attachFallbacksToLinks();
  }
}

await initialize();

export { getFirstAvailable, makeCandidateUrls, resourceExists };
