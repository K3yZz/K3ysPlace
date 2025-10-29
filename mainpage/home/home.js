function annoyingMessage() {
    if (localStorage.getItem("suppressAlerts") === "true") {
        return;
    }
    alert(
        "Huge Update! However 'Casino' update was delayed."
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

function displayTime() {
  const now = new Date();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  const weekday = weekdays[now.getDay()];
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const formattedTime = now.toLocaleTimeString();
  const time = `${weekday} ${day}/${month}/${year} ${formattedTime}`;
  document.getElementById("timeText").textContent = time;
}

function assignID() {
    if (!localStorage.getItem("userID")) {
        const userID = 'user-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("userID", userID);
    }
}

//unused dev code
// const secretCode = 'dev.get';
// let inputBuffer = '';

// window.addEventListener('keydown', e => {
//     if (e.key.length === 1) inputBuffer += e.key;
//     else return;

//     if (inputBuffer.length > secretCode.length) {
//         inputBuffer = inputBuffer.slice(-secretCode.length);
//     }

//     if (inputBuffer === secretCode) {
//         let userID = localStorage.getItem("userID");
//         if (!userID.endsWith('-dev')) {
//             userID += '-niko-dev';
//             localStorage.setItem("userID", userID);
//             console.log('UserID updated:', userID);
//         }
//         inputBuffer = '';
//     }
// });

assignID();
annoyingMessage();
setInterval(displayTime, 1000);