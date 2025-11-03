import { animateText } from "../globalassets/js/textEffects.js";
emailjs.init("GahAe28-OZFZT7Z4F");

function annoyingDebug() {
    if (localStorage.getItem("suppressAlerts") === "true") {
        return;
    }
    alert(
        "Everything is fixed! That includes the chat. Stockmarket got a big update. Casino overhaul coming soon! Finally themes might look a bit weird they are a work in progress."
    );
    alert(
        "Are you sure you read the previous alert? If so, click OK to dismiss this message."
    );
    alert("Are you sure though?");
    alert("Are you sureeeeeee though?");
    alert("Are you sure enough yet?");
    alert("One more time for good measure?");
    alert("Last time I swear.");
    (function generateAndVerifyKey() {
        const length = 8;
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        function genKey(len) {
            const arr = new Uint8Array(len);
            crypto.getRandomValues(arr);
            let s = "";
            for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
            return s;
        }

        // Disable copy/paste/selection/context menu and common keyboard shortcuts, return a restore fn
        function disableCopyPaste() {
            const handlers = [];

            function add(type, handler, opts) {
                document.addEventListener(type, handler, opts);
                handlers.push({ type, handler, opts });
            }

            add("copy", (e) => e.preventDefault());
            add("cut", (e) => e.preventDefault());
            add("paste", (e) => e.preventDefault());
            add("contextmenu", (e) => e.preventDefault());
            add("selectstart", (e) => e.preventDefault());
            add("keydown", (e) => {
                const k = (e.key || "").toLowerCase();
                // block Ctrl/Cmd + C/V/X/A and Shift+Insert
                if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "a"].includes(k)) {
                    e.preventDefault();
                }
                if (e.shiftKey && k === "insert") e.preventDefault();
            });

            // also disable CSS selection
            const prevUserSelect = document.documentElement.style.userSelect;
            document.documentElement.style.userSelect = "none";
            handlers.push({
                restore: () => {
                    document.documentElement.style.userSelect = prevUserSelect;
                },
            });

            return function restore() {
                for (const h of handlers) {
                    if (h.restore) {
                        try {
                            h.restore();
                        } catch (e) { }
                    } else {
                        document.removeEventListener(h.type, h.handler, h.opts);
                    }
                }
            };
        }

        const restoreCopyPaste = disableCopyPaste();

        const key = genKey(length);
        let entry;
        do {
            entry = prompt(
                "Please type the following 8-character key to continue:\n\n" + key,
                ""
            );
            if (entry === null || entry.trim() === "") {
                alert("A response is required to continue.");
                entry = null; // force loop to continue
                continue;
            }
            if (entry.trim() !== key) {
                alert("Incorrect key. Please try again.");
                entry = null;
            }
        } while (entry === null);

        restoreCopyPaste();
        alert("Access granted.");
    })();
    if (confirm("Would you like to disable these messages in the future?")) {
        if (confirm("Are you absolutely sure?")) {
            localStorage.setItem("suppressAlerts", "true");
        }
    }
}

annoyingDebug();


























document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const bugReportButton = document.getElementById("bugReportButton");
    const bugReportFormContainer = document.getElementById("bugReportFormContainer");
    const submitBug = document.getElementById("submitBug");
    const cancelBug = document.getElementById("cancelBug");
    const bugDescription = document.getElementById("bugDescription");
    const bugEmail = document.getElementById("bugEmail");
    const bugFeedback = document.getElementById("bugFeedback");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const settingsButton = document.getElementById("settingsButton");
    const settingsPanel = document.getElementById("settingsPanel");

    // --- Game Data ---
    const games = [
        { title: "Stock Market", version: "V1.0.0", description: "Stonks.", place: "myGames", img: "./globalassets/gameIcons/stockMarket.png", link: "./games/stockmarketgame/game.html" },
        { title: "Casino", version: "V1.0.1-alpha", description: "Losing is only a mentality. Keep gambling.", place: "myGames", img: "./globalassets/gameIcons/casino.png", link: "./games/casinogame/game.html" },
        { title: "The wheel", version: "V1.0.1-alpha", description: "Tool for spins. (type 'rig' for rig menu)", place: "tools", img: "./globalassets/gameIcons/wheel.png", link: "./games/wheelgame/game.html" },
        { title: "Chat", version: "V1.0.0-alpha", description: "Chat here!", place: "tools", img: "./globalassets/gameIcons/chat.png", link: "./games/chatgame/game.html" },
        { title: "Stock Market Legacy", version: "V1.0.1-alpha", description: "Old Stock Market Game.", place: "legacyGames", img: "./globalassets/gameIcons/stockMarket.png", link: "./games/legacystockmarketgame/game.html" },
        { title: "Cube Game", version: "??", description: "Old orignal game.", place: "legacyGames", img: "./globalassets/gameIcons/placeholder.png", link: "./games/legacycubegame/game.html" },

        { title: "Undertale Yellow", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/undertaleyellow.png", link: "./portedgames/undertale-yellow/undertale_yellow.html" },
        { title: "Bitlife", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/bitlife.jpeg", link: "./portedgames/bitlife-life-simulator/play.html" },
        { title: "Chrome Dino", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/dino.png", link: "./portedgames/chrome-dino" },
        { title: "Cookie Clicker", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/cookieclicker.png", link: "./portedgames/cookie-clicker" },
        { title: "Drive Mad", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/drivemad.jpeg", link: "./portedgames/drive-mad" },
        { title: "Moto X3M", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/moto1.jpeg", link: "./portedgames/Moto-X3M" },
        { title: "Moto Pool", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/moto2.jpeg", link: "./portedgames/motox3m-pool" },
        { title: "Moto Spooky", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/moto3.jpeg", link: "./portedgames/motox3m-spooky" },
        { title: "Moto Winter", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/moto4.jpeg", link: "./portedgames/motox3m-winter" },
        { title: "Subway Surfers", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "./globalassets/gameIcons/portedgameIcons/subway.jpeg", link: "./ported/games/subwaysurfers-sf" },
    ];

    // --- Functions ---
    function populateGames() {
        games.forEach(game => {
            const container = document.getElementById(game.place);
            const gameDiv = document.createElement("div");
            gameDiv.className = "game";

            const img = document.createElement("img");
            img.src = game.img;
            img.alt = game.title;

            const card = document.createElement("div");
            card.className = "gameCard";
            card.innerHTML = `
                <span class="gameTitle">${game.title}<br></span>
                <span class="gameVersion, small">${game.version}<br></span>
                <span class="gameDescription">${game.description}</span>
            `;

            const startBtn = document.createElement("button");
            startBtn.className = "startGameButton";
            startBtn.textContent = "Start Game";
            startBtn.addEventListener("click", () => {
                window.location.href = game.link;
            });
            card.appendChild(startBtn);

            img.addEventListener("click", () => {
                document.querySelectorAll(".gameCard").forEach(c => {
                    if (c !== card) c.classList.remove("show");
                });
                card.classList.toggle("show");
            });

            gameDiv.appendChild(img);
            gameDiv.appendChild(card);
            container.appendChild(gameDiv);
        });
    }

    function animateGameButtons() {
        Array.from(document.getElementsByClassName("startGameButton")).forEach(btn => {
            animateText(btn, { hoverExplode: true });
        });
    }

    function animateTitle() {
        const title = document.getElementById("titleText");
        animateText(title, { wavy: true, rainbow: true });
    }

    function setupTabs() {
        tabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                tabButtons.forEach(b => {
                    b.classList.remove("active");
                    b.setAttribute("aria-selected", "false");
                });
                document.querySelectorAll(".tab-content").forEach(panel => {
                    panel.classList.remove("active");
                    panel.setAttribute("aria-hidden", "true");
                });

                btn.classList.add("active");
                btn.setAttribute("aria-selected", "true");
                const panelId = btn.dataset.tab;
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.classList.add("active");
                    panel.setAttribute("aria-hidden", "false");
                }
            });
        });
    }

    function setupSettingsPanel() {
        settingsButton.addEventListener("click", () => {
            const isOpen = settingsPanel.style.display === "block";
            if (isOpen) {
                settingsPanel.style.display = "none";
                settingsPanel.setAttribute("hidden", "");
                settingsButton.setAttribute("aria-expanded", "false");
            } else {
                settingsPanel.style.display = "block";
                settingsPanel.removeAttribute("hidden");
                settingsButton.setAttribute("aria-expanded", "true");
                settingsPanel.focus();
            }
        });

        settingsPanel.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                settingsPanel.style.display = "none";
                settingsPanel.setAttribute("hidden", "");
                settingsButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    function setupBugReport() {
        bugReportButton.addEventListener("click", () => {
            bugReportFormContainer.style.display = "block";
            bugReportButton.style.display = "none";
        });

        cancelBug.addEventListener("click", () => {
            bugReportFormContainer.style.display = "none";
            bugReportButton.style.display = "block";
            bugDescription.value = "";
            bugEmail.value = "";
            bugFeedback.style.display = "none";
        });

        submitBug.addEventListener("click", async () => {
            const description = bugDescription.value.trim();
            const email = bugEmail.value.trim();

            if (!description) {
                bugFeedback.style.display = "block";
                bugFeedback.style.color = "red";
                bugFeedback.textContent = "Please describe the bug!";
                return;
            }

            try {
                await emailjs.send("service_08aesw4", "template_1cis1r8", {
                    title: "Bug Report",
                    message: description,
                    email: email,
                    name: "bugReport",
                    time: Date.now()
                });

                bugFeedback.style.display = "block";
                bugFeedback.style.color = "lime";
                bugFeedback.textContent = "Bug report sent! Thank you!";
                setTimeout(() => {
                    bugReportFormContainer.style.display = "none";
                    bugReportButton.style.display = "block";
                    bugDescription.value = "";
                    bugEmail.value = "";
                    bugFeedback.style.display = "none";
                }, 2000);

            } catch (err) {
                bugFeedback.style.display = "block";
                bugFeedback.style.color = "red";
                bugFeedback.textContent = "Failed to send bug report.";
                console.error(err);
            }
        });
    }

    // --- Initialization ---
    populateGames();
    animateGameButtons();
    animateTitle();
    setupTabs();
    setupSettingsPanel();

    settingsPanel.setAttribute("tabindex", "-1");

    settingsPanel.style.display = "none";
    setupBugReport();

    // --- Optional: Secret Key Feature ---
    const secret = "theme1";
    let typed = "";
    document.addEventListener("keydown", e => {
        typed += e.key.toLowerCase();
        if (typed.length > secret.length) typed = typed.slice(-secret.length);
        if (typed === secret) {
            const themeToggle = document.getElementById("themeToggle");
            const newTheme = document.createElement("option");
            newTheme.value = "theme1";
            newTheme.textContent = "Theme 1 (Secret)";
            themeToggle.appendChild(newTheme);
            themeToggle.value = "theme1";
            themeToggle.dispatchEvent(new Event("change"));
            alert("Secret theme unlocked!");
            typed = "";
        }
    });
});
