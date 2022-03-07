const KANJI_REGEX = /^[\u4E00-\u9FAF]+$/;

async function generateKanjiSets() {
    var container = document.getElementById("setscontainer");
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    container.innerHTML = null;

    sets.forEach(item => {
        var div = document.createElement("div");
        var input = document.createElement("input");
        var bold = document.createElement("b");
        var span = document.createElement("span");
        var editbtn = document.createElement("button");
        var delbtn = document.createElement("button");

        div.title = "Set #" + item.id;
        div.id = "set" + item.id;
        input.type = "checkbox";
        input.checked = item.enabled;
        bold.innerText = item.name;
        span.innerText = item.kanji;
        editbtn.innerText = "✏️";
        delbtn.innerText = "🗑️";
        editbtn.classList.add("edit");
        delbtn.classList.add("del");

        div.appendChild(input);
        div.appendChild(bold);
        div.appendChild(span);
        div.appendChild(editbtn);
        div.appendChild(delbtn);
        container.appendChild(div);    
    });

    // Attach event listeners to each checkbox
    [...container.getElementsByTagName("input")].forEach(item => {
        item.addEventListener("change", async (event) => {
            var sets = (await chrome.storage.local.get("customsets")).customsets;
            var id = event.path[1].id.slice(3);
            var target = sets.find(x => x.id == id);

            target.enabled = event.target.checked;
            chrome.storage.local.set({ customsets: sets });
        });
    });

    // Attach event listeners to edit button
    [...container.getElementsByClassName("edit")].forEach(item => {
        item.addEventListener("click", async (event) => {
            if (item.classList.contains("editing")) return;

            event.path[0].innerText = "✔️";
            item.classList.add("editing");
            var targetdiv = event.path[1];
            var id = targetdiv.id.slice(3);

            // Find target elements
            var namenode = targetdiv.getElementsByTagName("b")[0];
            var kanjinode = targetdiv.getElementsByTagName("span")[0];
            document.createElement("a").contentEditable

            // Mutate elements
            namenode.contentEditable = true;
            kanjinode.contentEditable = true;

            // Attach new event listener
            async function callback(event) {
                var oldset = await retrieveSet(id);
                var error = false;

                // Check if errors, otherwise update
                (namenode.innerText !== oldset.name) && await renameSet(id, namenode.innerText).catch(err => {
                    error = true;
                    alert(err);
                });
                
                (kanjinode.innerText !== oldset.kanji) && await editSetKanji(id, kanjinode.innerText).catch(err => {
                    error = true;
                    alert(err);
                });

                // In the event of an error
                if (error) {
                    namenode.innerText = oldset.name;
                    kanjinode.innerText = oldset.kanji;
                    return;
                }

                // Disable editing
                namenode.contentEditable = false;
                kanjinode.contentEditable = false;

                // Update state
                event.path[0].innerText = "✏️";
                item.classList.remove("editing");
                item.removeEventListener("click", callback);
            }

            item.addEventListener("click", callback);
        });
    });

    // Attach event listeners to delete button
    [...container.getElementsByClassName("del")].forEach(item => {
        item.addEventListener("click", async (event) => {
            var id = event.path[1].id.slice(3);
            var target = await retrieveSet(id);

            if (!confirm(`Are you sure you want to delete this set?\n${target.name} ${target.kanji}`)) return;
            await deleteSet(id);
            generateKanjiSets();
        })
    });
}

function retrieveSet(id) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var target = sets.find(x => x.id == id);

        target ? resolve(target) : reject(`No set with ID ${id} exists`);
    });
}

function createSet(name, setstr) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var id = sets.slice(-1)[0].id + 1;
        var kanji = setstr.replace(" ", "");

        // Ensure set is correct
        if (!KANJI_REGEX.test(kanji)) return reject("Invalid kanji string");

        sets.push({ id, name, kanji, enabled: true });
        chrome.storage.local.set({customsets: sets}, resolve);
    });
}

function deleteSet(id) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var updated = sets.filter(value => value.id != id);

        chrome.storage.local.set({ customsets: updated }, resolve);
    });
}

function renameSet(id, name) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var target = sets.find(x => x.id == id);
        var index = sets.indexOf(target);
        
        if (target == undefined) return reject(`Set with ID ${id} does not exist`);

        target.name = name;
        sets[index] = target;

        chrome.storage.local.set({ customsets: sets }, resolve);
    });
}

function editSetKanji(id, kanji) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var target = sets.find(x => x.id == id);
        var index = sets.indexOf(target);
        
        if (target == undefined) return reject(`Set with ID ${id} does not exist`);

        target.kanji = kanji;
        sets[index] = target;

        chrome.storage.local.set({ customsets: sets }, resolve);
    });
}

// Create kanji set nodes
generateKanjiSets();
