(function() {
    const errOverlay = document.createElement('div');
    errOverlay.id = 'errOverlay';
    Object.assign(errOverlay.style, {
        position: 'fixed',
        inset: '12px',
        zIndex: '99999',
        pointerEvents: 'none',
        overflow: 'hidden',
        maxHeight: '60vh',
    });

    const errBox = document.createElement('div');
    errBox.id = 'errBox';
    Object.assign(errBox.style, {
        display: 'none',
        pointerEvents: 'auto',
        background: '#2b0e0e',
        color: '#fff',
        padding: '14px',
        borderRadius: '8px',
        maxWidth: 'calc(100% - 48px)',
        maxHeight: '100%',
        overflowY: 'auto',
        fontFamily: 'system-ui,Segoe UI,Arial',
        fontSize: '13px',
        boxSizing: 'border-box',
    });

    errOverlay.appendChild(errBox);
    document.body.appendChild(errOverlay);

    function showErr(msg) {
        errBox.style.display = 'block';
        const errorLine = document.createElement('div');
        errorLine.textContent = msg;
        errBox.appendChild(errorLine);
        errBox.scrollTop = errBox.scrollHeight;
    }

    // Capture JS Errors
    window.addEventListener('error', e => {
        showErr('JS Error: ' + (e.message || e.error) + ' — ' + (e.filename || e.error?.stack || 'unknown'));
    });

    // Capture Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', ev => {
        showErr('Unhandled promise rejection: ' + (ev.reason?.message || JSON.stringify(ev.reason)));
    });

    // Capture Image Load Failures
    function trackImages() {
        const imgs = document.images;
        for (let img of imgs) {
            if (!img.complete || img.naturalWidth === 0) {
                showErr('Image failed to load: ' + img.src);
            }
            img.addEventListener('error', () => showErr('Image failed to load: ' + img.src));
        }
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        trackImages();
    } else {
        document.addEventListener('DOMContentLoaded', trackImages);
    }

    // Fonts and CSS
    function trackFontsAndCSS() {
        document.fonts.ready.then(fonts => {
            fonts.forEach(fontFace => {
                if (fontFace.status === 'error') {
                    showErr('Font failed to load: ' + fontFace.family);
                }
            });
        }).catch(e => showErr('Font load error: ' + e));

        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            link.addEventListener('error', () => showErr('CSS failed to load: ' + link.href));
        });
    }
    if (document.readyState === 'complete') {
        trackFontsAndCSS();
    } else {
        window.addEventListener('load', trackFontsAndCSS);
    }

    // Script load failures
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        script.addEventListener('error', () => showErr('Script failed to load: ' + script.src));
    });
})();
