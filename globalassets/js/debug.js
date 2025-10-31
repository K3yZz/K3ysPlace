function loadDebug() {
    let userID = localStorage.getItem("userID");
    //if (userID.endsWith("-niko-dev")) {
        const erudaScript = document.createElement('script');
        erudaScript.src = 'https://cdn.jsdelivr.net/npm/eruda';
        erudaScript.onload = () => {
            eruda.init();
        };
        document.body.appendChild(erudaScript);
    //}
}

loadDebug();