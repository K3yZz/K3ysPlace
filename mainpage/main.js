import { animateText } from "/globalassets/js/textEffects.js";
emailjs.init("GahAe28-OZFZT7Z4F");

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
        { title: "Stock Market", version: "V1.0.1-alpha", description: "Stonks.", place: "myGames", img: "/globalassets/gameIcons/stockMarket.png", link: "/games/stockmarketgame/game.html" },
        { title: "Casino", version: "V1.0.1-alpha", description: "Losing is only a mentality. Keep gambling.", place: "myGames", img: "/globalassets/gameIcons/casino.png", link: "/games/casinogame/game.html" },
        { title: "The wheel", version: "V1.0.1-alpha", description: "Tool for spins. (type 'rig' for rig menu)", place: "tools", img: "/globalassets/gameIcons/wheel.png", link: "/games/wheelgame/game.html" },
        { title: "Chat", version: "V1.0.0-alpha", description: "Chat here!", place: "tools", img: "/globalassets/gameIcons/chat.png", link: "/games/chatgame/game.html" },
        { title: "Undertale Yellow", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/undertaleyellow.png", link: "/games/portedgames/undertale-yellow/undertale_yellow.html" },
        { title: "Bitlife", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/bitlife.jpeg", link: "/portedgames/bitlife-life-simulator/play.html" },
        { title: "Chrome Dino", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/dino.png", link: "/portedgames/chrome-dino" },
        { title: "Cookie Clicker", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/cookieclicker.png", link: "/portedgames/cookie-clicker" },
        { title: "Drive Mad", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/drivemad.jpeg", link: "/portedgames/drive-mad" },
        { title: "Moto X3M", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/moto1.jpeg", link: "/portedgames/Moto-X3M" },
        { title: "Moto Pool", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/moto2.jpeg", link: "/portedgames/motox3m-pool" },
        { title: "Moto Spooky", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/moto3.jpeg", link: "/portedgames/motox3m-spooky" },
        { title: "Moto Winter", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/moto4.jpeg", link: "/portedgames/motox3m-winter" },
        { title: "Subway Surfers", version: "V1.0.0", description: "Ported Game.", place: "portedGames", img: "/globalassets/gameIcons/portedgameIcons/subway.jpeg", link: "/ported/games/subwaysurfers-sf" },
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
        animateText(title, { wavy: true, rainbow: true});
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
    // const secret = "idk";
    // let typed = "";
    // document.addEventListener("keydown", e => {
    //     typed += e.key.toLowerCase();
    //     if (typed.length > secret.length) typed = typed.slice(-secret.length);
    //     if (typed === secret) { window.location.href = 'stockmarket.html'; typed = ""; }
    // });
});