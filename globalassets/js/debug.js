function createErrorOverlay() {
    const errOverlay = document.createElement('div');
    errOverlay.id = 'errOverlay';
    errOverlay.style.position = 'fixed';
    errOverlay.style.inset = '12px';
    errOverlay.style.zIndex = '99999';
    errOverlay.style.pointerEvents = 'none';

    const errBox = document.createElement('div');
    errBox.id = 'errBox';
    errBox.style.display = 'none';
    errBox.style.pointerEvents = 'auto';
    errBox.style.background = '#2b0e0e';
    errBox.style.color = '#fff';
    errBox.style.padding = '14px';
    errBox.style.borderRadius = '8px';
    errBox.style.maxWidth = 'calc(100% - 48px)';
    errBox.style.maxHeight = '60vh';
    errBox.style.overflow = 'auto';
    errBox.style.fontFamily = 'system-ui,Segoe UI,Arial';
    errBox.style.fontSize = '13px';

    errOverlay.appendChild(errBox);
    document.body.appendChild(errOverlay);
}

createErrorOverlay();

const errBox = document.getElementById('errBox');
function showErr(msg) {
    errBox.style.display = 'block';
    errBox.textContent += msg +  '\n';
}

// JS Errors
window.addEventListener('error', e => {
    showErr('JS Error: ' + (e.message || e.error) + ' — ' + (e.filename || e.error?.stack || 'unknown'));
});

// Promise Rejections
window.addEventListener('unhandledrejection', ev => {
    showErr('Unhandled promise rejection: ' + (ev.reason?.message || JSON.stringify(ev.reason)));
});

// Image load errors
document.addEventListener('DOMContentLoaded', () => {
    const imgs = document.images;
    for (let img of imgs) {
        if (!img.complete || img.naturalWidth === 0) {
            showErr('Image failed to load: ' + img.src);
        }
        img.addEventListener('error', () => showErr('Image failed to load: ' + img.src));
    }
});

// Fonts and CSS
window.addEventListener('load', () => {
    document.fonts.ready.then(fonts => {
        fonts.forEach(fontFace => {
            if (!fontFace.status || fontFace.status === 'error') {
                showErr('Font failed to load: ' + fontFace.family);
            }
        });
    }).catch(e => showErr('Font load error: ' + e));

    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        link.addEventListener('error', () => showErr('CSS failed to load: ' + link.href));
    });
});

// Optional: failed script detection
const scripts = document.querySelectorAll('script[src]');
scripts.forEach(script => {
    script.addEventListener('error', () => showErr('Script failed to load: ' + script.src));
});
