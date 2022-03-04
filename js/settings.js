chrome.storage.local.get("customsets", result => {
    var container = document.getElementById("unitscontainer");

    // Load each unit into the container
    result.customsets.forEach(item => {
        var div = document.createElement("div");
        var input = document.createElement("input");
        var bold = document.createElement("b");
        var span = document.createElement("span");

        div.title = "Set #" + item.id;
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

function createSet(name, kanji) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("customsets", result => {
            var sets = result.customsets;
            var id = result.customsets.slice(-1)[0].id + 1;

            sets.push({ id, name, kanji, enabled: true });
            chrome.storage.local.set({customsets: sets}, resolve);
        });
    });
}

function deleteSet(id) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("customsets", result => {
            var sets = result.customsets;
            var updated = sets.filter(value => value.id != id);

            chrome.storage.local.set({ customsets: updated }, resolve);
        });
    });
}

function renameSet(id, name) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("customsets", result => {
            var sets = result.customsets;
            var target = sets.find(x => x.id == id);
            var index = sets.indexOf(target);
            
            if (target == undefined) return reject(`Set with ID ${id} does not exist`);

            target.name = name;
            sets[index] = target;

            chrome.storage.local.set({ customsets: sets }, resolve);
        });
    });
}

function editSetKanji(id, kanji) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("customsets", result => {
            var sets = result.customsets;
            var target = sets.find(x => x.id == id);
            var index = sets.indexOf(target);
            
            if (target == undefined) return reject(`Set with ID ${id} does not exist`);

            target.kanji = kanji;
            sets[index] = target;

            chrome.storage.local.set({ customsets: sets }, resolve);
        });
    });
}
