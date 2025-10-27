emailjs.init("GahAe28-OZFZT7Z4F");

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

setupBugReport();