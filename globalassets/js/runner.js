(function injectResources() {
  try {
    const head = document.head || document.getElementsByTagName("head")[0];
    const body = document.body || document.getElementsByTagName("body")[0];
    if (!head || !body) return;

    const alreadyInjected = (id) => document.querySelector(`[data-injected-resource="${id}"]`);

    // ---- Favicons ----
    if (!alreadyInjected("favicons")) {
      const faviconData = [
        { rel: "apple-touch-icon", sizes: "180x180", href: "globalassets/favicon/apple-touch-icon.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "globalassets/favicon/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "globalassets/favicon/favicon-16x16.png" },
        { rel: "manifest", href: "globalassets/favicon/site.webmanifest" },
        { rel: "mask-icon", href: "globalassets/favicon/safari-pinned-tab.svg" },
        { rel: "shortcut icon", href: "globalassets/favicon/favicon.ico" },
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

    // ---- CSS ----
    if (!alreadyInjected("theme-css")) {
      const themeLink = document.createElement("link");
      themeLink.rel = "stylesheet";
      themeLink.href = "globalassets/css/theme.css";
      themeLink.setAttribute("data-injected-resource", "theme-css");
      head.appendChild(themeLink);
    }

    // ---- JS ----
    const scripts = [
      { id: "particles-js", src: "globalassets/js/particles.js" },
      { id: "debug-js", src: "globalassets/js/debug.js" },
      { id: "theme-js", src: "globalassets/js/theme.js" },
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

    // ---- HTML Tags ----
    if (!alreadyInjected("particles-canvas")) {
      const customDiv = document.createElement("canvas");
      customDiv.id = "particles";
      customDiv.setAttribute("data-injected-resource", "particles-canvas");
      body.insertBefore(customDiv, body.firstChild);
    }

  } catch (e) {
    console.warn("Could not inject resources:", e);
  }
})();
