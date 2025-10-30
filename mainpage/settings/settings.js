window.addEventListener("DOMContentLoaded", () => {
    emailjs.init("GahAe28-OZFZT7Z4F");

    // -------------------- Bug Report --------------------
    function setupBugReport() {
        const bugReportButton = document.getElementById("bugReportButton");
        const bugReportFormContainer = document.getElementById("bugReportFormContainer");
        const submitBug = document.getElementById("submitBug");
        const cancelBug = document.getElementById("cancelBug");
        const bugDescription = document.getElementById("bugDescription");
        const bugEmail = document.getElementById("bugEmail");
        const bugFeedback = document.getElementById("bugFeedback");

        bugReportButton.addEventListener("click", () => {
            bugReportFormContainer.style.display = "flex";
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
                    time: new Date().toLocaleString()
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

    // -------------------- Local Storage --------------------
function generateTable() {
    const keys = Object.keys(localStorage)
        .filter(key => !key.startsWith('IodineGBA') && !key.startsWith('GA::') && !key.startsWith('eruda'));

    if (keys.length === 0) {
        localStorageDisplay.innerHTML = '<div>Local Storage is empty (no visible keys).</div>';
        return;
    }

    const table = document.createElement('table');

    const header = document.createElement('tr');
    const thKey = document.createElement('th');
    thKey.textContent = 'Key';

    const thValue = document.createElement('th');
    thValue.style.display = 'flex';
    thValue.style.justifyContent = 'space-between';
    thValue.style.alignItems = 'center';
    thValue.textContent = 'Value';

    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'refreshStorageBtn';
    refreshBtn.title = 'Refresh';
    refreshBtn.textContent = '⟳';
    Object.assign(refreshBtn.style, {
        padding: '2px 5px',
        fontSize: '0.9em',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        lineHeight: 'normal'
    });

    thValue.appendChild(refreshBtn);
    header.appendChild(thKey);
    header.appendChild(thValue);
    table.appendChild(header);

    keys.forEach(key => {
        const row = document.createElement('tr');

        const tdKey = document.createElement('td');
        tdKey.textContent = key;
        tdKey.style.overflowWrap = 'break-word';

        const tdValue = document.createElement('td');
        tdValue.style.overflowWrap = 'break-word';

        const valueSpan = document.createElement('span');
        valueSpan.textContent = localStorage.getItem(key);
        valueSpan.style.cursor = 'text';

        valueSpan.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = valueSpan.textContent;
            input.style.width = '100%';
            tdValue.innerHTML = '';
            tdValue.appendChild(input);
            input.focus();

            input.addEventListener('blur', () => {
                localStorage.setItem(key, input.value);
                location.reload(); 
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });

        tdValue.appendChild(valueSpan);
        row.appendChild(tdKey);
        row.appendChild(tdValue);
        table.appendChild(row);
    });

    localStorageDisplay.innerHTML = '';
    localStorageDisplay.appendChild(table);

    refreshBtn.addEventListener('click', generateTable);
}

    // Toggle table visibility
    function displayLocalStorage() {
        const isVisible = localStorageDisplay.innerHTML.trim() !== '';
        const body = document.body;
        if (isVisible) {
            localStorageDisplay.innerHTML = '';
            showStorageBtn.textContent = 'Show Local Storage';
            body.style.overflowY = 'hidden';
            return;
        }

        showStorageBtn.textContent = 'Hide Local Storage';
        body.style.overflowY = 'auto';
        generateTable();
    }

    // Clear localStorage
    clearStorageBtn.addEventListener('click', () => {
        const input = prompt('Type "delete" to confirm clearing all local storage. You will lose all progress and only your userID (Not your peerID) will stay:');
        if (input?.toLowerCase() === 'delete') {
            userID = localStorage.getItem("userID");
            localStorage.clear();
            localStorage.setItem("userID", userID);

            localStorageDisplay.innerHTML = '';
            alert('Local Storage has been cleared.');
        } else {
            alert('Action canceled.');
        }
    });

    showStorageBtn.addEventListener('click', displayLocalStorage);

    // -------------------- Initialize --------------------
    setupBugReport();
});