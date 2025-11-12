const BASE_PATH = location.hostname.includes("github.io") ? "/K3ysPlace/" : "/";

function log(type, msg) {
  const colors = {
    info: "color:blue",
    success: "color:green",
    error: "color:red",
  };
  console.log(`%c[ResourceInjector] ${msg}`, colors[type] || colors.info);
}

function alreadyInjected(id) {
  const exists = !!document.querySelector(`[data-injected-resource="${id}"]`);
  log("info", `Check injected: ${id} → ${exists}`);
  return exists;
}

async function injectScript(src, id, place = "body", module = false) {
  if (alreadyInjected(id)) return;
  const fullSrc = BASE_PATH + src;
  log("info", `Injecting script: ${id} from ${fullSrc}`);
  const s = document.createElement("script");
  s.src = fullSrc;
  if (module) s.type = "module";
  else if (place === "body") s.defer = true;
  s.setAttribute("data-injected-resource", id);
  const start = performance.now();
  return new Promise((r) => {
    s.onload = () => {
      log(
        "success",
        `Loaded script: ${id} in ${(performance.now() - start).toFixed(1)}ms`
      );
      r();
    };
    s.onerror = () => {
      log("error", `Failed script: ${id}`);
      r();
    };
    (place === "head" ? document.head : document.body).appendChild(s);
  });
}

async function injectRunnerResources() {
  const h = document.head,
    b = document.body;
  if (!h || !b) {
    log("error", "No head or body found");
    return;
  }
  log("info", "Starting resource injection");

  if (!alreadyInjected("favicons")) {
    [
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: BASE_PATH + "globalassets/favicon/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: BASE_PATH + "globalassets/favicon/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: BASE_PATH + "globalassets/favicon/favicon-16x16.png",
      },
      {
        rel: "manifest",
        href: BASE_PATH + "globalassets/favicon/site.webmanifest",
      },
      {
        rel: "mask-icon",
        href: BASE_PATH + "globalassets/favicon/safari-pinned-tab.svg",
      },
      {
        rel: "shortcut icon",
        href: BASE_PATH + "globalassets/favicon/favicon.ico",
      },
      { name: "theme-color", content: "#ffffff" },
      { name: "msapplication-TileColor", content: "#2d89ef" },
      { name: "msapplication-TileImage", content: "mstile-144x144.png" },
    ].forEach((a) => {
      const e = a.rel
        ? document.createElement("link")
        : document.createElement("meta");
      Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v));
      e.setAttribute("data-injected-resource", "favicons");
      h.appendChild(e);
    });
    log("success", "Favicons and meta injected");
  }

  if (!alreadyInjected("theme-css")) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = BASE_PATH + "globalassets/css/theme.css";
    log("info", `Injecting CSS theme from ${l.href}`);
    l.setAttribute("data-injected-resource", "theme-css");
    h.appendChild(l);
  }

  await injectScript("globalassets/js/theme.js", "theme-js", "head");
  await injectScript("globalassets/js/particles.js", "particles-js", "", true);
  await injectScript("globalassets/js/debug.js", "debug-js");

  if (!alreadyInjected("particles-canvas")) {
    const c = document.createElement("canvas");
    c.id = "particles";
    c.setAttribute("data-injected-resource", "particles-canvas");
    b.prepend(c);
    log("success", "Particles canvas added");
  }

  if (typeof window.initParticles === "function")
    try {
      window.initParticles();
      log("success", "Particles initialized");
    } catch {}
  log("info", "Resource injection complete");
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", injectRunnerResources);
else injectRunnerResources();
