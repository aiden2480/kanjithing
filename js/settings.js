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
});
