function loadDebug() {
    if (location.hostname === 'k3yzz.github.io' || location.hostname === 'localhost') {
        const erudaScript = document.createElement('script');
        erudaScript.src = 'https://cdn.jsdelivr.net/npm/eruda';
        erudaScript.onload = () => {
            eruda.init();
        };
        document.body.appendChild(erudaScript);
    }
}

loadDebug();