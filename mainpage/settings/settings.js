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
    const clearStorageBtn = document.getElementById('clearStorageBtn');
    const showStorageBtn = document.getElementById('showStorageBtn');
    const localStorageDisplay = document.getElementById('localStorageDisplay');
    const body = document.body;

    // Generate the localStorage table
    function generateTable() {
        const keys = Object.keys(localStorage)
            .filter(key => !key.startsWith('IodineGBA') && !key.startsWith('GA::'));

        if (keys.length === 0) {
            localStorageDisplay.innerHTML = '<div>Local Storage is empty (no visible keys).</div>';
            return;
        }

        const table = document.createElement('table');

        // Table header row
        const header = document.createElement('tr');

        // Key header
        const thKey = document.createElement('th');
        thKey.textContent = 'Key';

        // Value header with refresh button
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

        // Table body
        keys.forEach(key => {
            const row = document.createElement('tr');

            const tdKey = document.createElement('td');
            tdKey.textContent = key;
            tdKey.style.overflowWrap = 'break-word';

            const tdValue = document.createElement('td');
            tdValue.textContent = localStorage.getItem(key);
            tdValue.style.overflowWrap = 'break-word';

            row.appendChild(tdKey);
            row.appendChild(tdValue);
            table.appendChild(row);
        });

        localStorageDisplay.innerHTML = '';
        localStorageDisplay.appendChild(table);

        // Refresh functionality
        refreshBtn.addEventListener('click', generateTable);
    }

    // Toggle table visibility
    function displayLocalStorage() {
        const isVisible = localStorageDisplay.innerHTML.trim() !== '';
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
        const input = prompt('Type "delete" to confirm clearing all local storage. You will lose all progress and your peer ID will be reset:');
        if (input?.toLowerCase() === 'delete') {
            localStorage.clear();
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