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

    function displayLocalStorage() {
        if (localStorageDisplay.innerHTML.trim() !== '') {
            localStorageDisplay.innerHTML = '';
            showStorageBtn.textContent = 'Show Local Storage';
            return;
        }

        const keys = Object.keys(localStorage);
        if (keys.length === 0) {
            localStorageDisplay.textContent = 'Local Storage is empty.';
            showStorageBtn.textContent = 'Hide Local Storage';
            return;
        }

        showStorageBtn.textContent = 'Hide Local Storage';
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';

        const header = document.createElement('tr');
        header.innerHTML = '<th>Key</th><th>Value</th>';
        table.appendChild(header);

        keys.forEach(key => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${key}</td><td>${localStorage.getItem(key)}</td>`;
            table.appendChild(row);
        });

        localStorageDisplay.appendChild(table);
    }

    clearStorageBtn.addEventListener('click', () => {
        const input = prompt('Type "delete" to confirm clearing all local storage. You will lose all progress and your peer ID will be reset:');
        if (input && input.toLowerCase() === 'delete') {
            localStorage.clear();
            displayLocalStorage();
            alert('Local Storage has been cleared.');
        } else {
            alert('Action canceled.');
        }
    });

    showStorageBtn.addEventListener('click', displayLocalStorage);

    // -------------------- Initialize --------------------
    setupBugReport();
});