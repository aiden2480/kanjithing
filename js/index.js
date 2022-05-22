(async () => {
    var resp = await fetch("https://api.github.com/repos/aiden2480/kanjithing/releases");
    var data = await resp.json();
    var table = document.getElementById("changelog");

    data.forEach((element, index) => {
        let one = document.createElement("td");
        let two = document.createElement("td");
        let tr = document.createElement("tr");

        let rel = document.createElement("a");
        rel.href = element.html_url
        rel.innerText = "Releases page";

        let zip = document.createElement("a");
        zip.href = element.zipball_url;
        zip.innerText = "Download ZIP";

        one.innerHTML += `<h2>${element.name}</h2>`;
        one.innerHTML += "Released " + howLongAgo(element.published_at);
        one.innerHTML += "<br>";
        one.innerHTML += rel.outerHTML;
        one.innerHTML += "<br>";
        one.innerHTML += zip.outerHTML;

        two.innerHTML += makeHTML(escapeHTML(element.body));

        tr.appendChild(one);
        tr.appendChild(two);
        table.appendChild(tr);
    });
})();

// Display extension install button if needed
chrome.extension || document.getElementById("installbutton").classList.add("available");
chrome.extension || document.getElementById("installbutton").addEventListener("click", () => {
    window.open("https://chrome.google.com/webstore/detail/kanjithing/nccfelhkfpbnefflolffkclhenplhiab/");
});

// Helper function to transform date to human readable time
function howLongAgo(datestamp) {
    var delta = (new Date() - new Date(datestamp)) / 1000;
    const plural = (s) => s !== 1 ? "s" : "";
    let value;
    
    var minute = 60;
    var hour = 60 * minute;
    var day = 24 * hour;
    var month = 30 * day;
    var year = 12 * month;

    if (delta / year >= 1)
        return (value = Math.round(delta / year)) + ` year${plural(value)} ago`;
    if (delta / month >= 1)
        return (value = Math.round(delta / month)) + ` month${plural(value)} ago`;
    if (delta / day >= 1)
        return (value = Math.round(delta / day)) + ` day${plural(value)} ago`;
    if (delta / hour >= 1)
        return (value = Math.round(delta / hour)) + ` hour${plural(value)} ago`;
    if (delta / minute >= 1)
        return (value = Math.round(delta / minute)) + ` minute${plural(value)} ago`;
    
    delta = Math.round(delta);
    return `${delta} second${plural(delta)} ago`
}

function makeHTML(soup) {
    const urls = /\[`(\w+)`]\((\S+)\)/gm;       // Any URLS referencing Git commits
    const bold = /\*{2}(.+)\*{2}/gm;            // Text surrounded by asterisks
    const comp = /https.+\/compare\/(\S+)/gm;   // The compare x with y commit links
    const tick = /`([^`]+)`/gm;                 // Code snippets encased in backticks
    const bol2 = /^## (.+)$/gm;                 // Two hashtags preceeding H2 text
    const pull = /https.+\/pull\/(\d+)/gm;      // GitHub Pulls URL

    // Convert URLS with commits
    let match = urls.exec(soup);
    while (match !== null) {
        let elem = document.createElement("a");
        
        elem.href = match[2];
        elem.innerHTML = `<code>${match[1]}</code>`;
        soup = soup.replace(match[0], elem.outerHTML);

        match = urls.exec(soup);
    }

    // Convert links
    match = comp.exec(soup);
    while (match !== null) {
        soup = soup.replace(match[0], `<a href="${match[0]}" >${match[1]}</a>`);
        match = comp.exec(soup);
    }

    // Convert **bold** to <b>bold</b>
    match = bold.exec(soup);
    while (match !== null) {
        soup = soup.replace(match[0], `<b>${match[1]}</b>`);
        match = bold.exec(soup);
    }

    // Convert `backticks` to <code>backticks</code>
    match = tick.exec(soup);
    while (match !== null) {
        soup = soup.replace(match[0], `<code>${match[1]}</code>`);
        match = tick.exec(soup);
    }

    // H2 elements (actually parsed as h4)
    match = bol2.exec(soup);
    while (match !== null) {
        soup = soup.replace(match[0], `<h4>${match[1]}</h4>`);
        match = bol2.exec(soup);
    }

    // GitHub pulls URLs
    match = pull.exec(soup);
    while (match !== null) {
        soup = soup.replace(match[0], `<a href="https://github.com/aiden2480/kanjithing/pull/${match[1]}">#${match[1]}</a>`);
        match = pull.exec(soup);
    }

    // Replace the comparison link for v0.0.1
    soup = soup.replace(
        "https://github.com/aiden2480/kanjithing/commits/v0.0.1",
        "<a href='https://github.com/aiden2480/kanjithing/commits/v0.0.1'>v0.0.1</a>",
    );

    // Replace all new line characters with <br>
    do {
        soup = soup.replace("\n\n\n", "\n\n");
    } while (soup.indexOf("\n\n\n") !== -1);

    do {
        soup = soup.replace("\n", "<br>");
    } while (soup.indexOf("\n") !== -1);

    
    return soup;
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;")
}
