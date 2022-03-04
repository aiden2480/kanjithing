chrome.storage.local.get("customsets", result => {
    var container = document.getElementById("unitscontainer");

    // Load each unit into the container
    result.customsets.forEach(item => {
        var div = document.createElement("div");
        var input = document.createElement("input");
        var bold = document.createElement("b");
        var span = document.createElement("span");

        input.type = "checkbox";
        input.checked = item.enabled;
        bold.innerText = item.name;
        span.innerText = item.kanji;

        div.appendChild(input);
        div.appendChild(bold);
        div.appendChild(span);
        container.appendChild(div);
    });

    // Attach event listners to each checkbox
    [...container.getElementsByTagName("input")].forEach(item => {
        item.addEventListener("change", (event) => {
            chrome.storage.local.get("customsets", result => {
                var name = event.path[1].children[1].innerHTML;
                var sets = result.customsets;

                sets.find(i => i.name === name).enabled = event.target.checked;
                chrome.storage.local.set({ customsets: sets });
            })
        });
    });
});
