import {
    encodeStringToBinary, decodeBinaryToString,
    encodeBinaryToHex, decodeHexToBinary,
} from "./binary.js";

const KANJI_REGEX = /^[\u4E00-\u9FAF]+$/;
generateSettingsPage();

/**
 * The function which generates the settings page and is automatically
 * run when the page is loaded
 */
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

    // Attach event listeners to each editable element
    [...container.querySelectorAll("span, b")].forEach(item => {
        item.addEventListener("keydown", event => {
            if (event.code == "Enter") {
                event.path[1].children[3].click();
                event.preventDefault();
            }
        });

        // Stop it pasting with all that stupid formatting
        item.addEventListener("paste", event => {
            var paste = (event.clipboardData || window.clipboardData).getData("text");
            var selection = window.getSelection();

            if (!selection.rangeCount) return false;
            selection.deleteFromDocument();
            selection.getRangeAt(0).insertNode(document.createTextNode(paste));
        
            event.preventDefault();
        })
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

/**
 * Generate misc settings (show settings button and video slider)
 */
async function generateMisc() {
    var { settingsbtn, videoSpeed } = await chrome.storage.local.get(["settingsbtn", "videoSpeed"]);
    
    document.getElementById("showsettings").checked = settingsbtn;
    document.getElementById("videoslider").value = videoSpeed * 100;
}

async function generateSettingsPage() {
    // Ensure default settings are available
    await ensureDefaultConfiguration();

    document.getElementById("tipsbutton").addEventListener("click", () => {
        window.open("/tips.html");
    });    

    generateKanjiSets();
    generateMisc();
}

/**
 * Ensures that the default configuration is loaded if no other
 * configuration can be found in the storage API.
 */
function ensureDefaultConfiguration() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "ensureDefaultConfig"}, resolve);

        setTimeout(() => {
            resolve(); // Just resolve if it's been hanging too long
        }, 500);
    });
}

// Set editing functions
/**
 * Retrieves a set from an ID
 * 
 * @param {Integer} id The ID of the set to retrieve
 * @returns {CustomSet} The desired set
 */
function retrieveSet(id) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var target = sets.find(x => x.id == id);

        target ? resolve(target) : reject(`No set with ID ${id} exists`);
    });
}

/**
 * Creates a new set via a user interface. Also runs checks on the inputs
 * to ensure that the user has entered valid data.
 * 
 * @param {String} name The name of the set (1-12 chars)
 * @param {String} setstr The kanji which will be contained in the set
 */
function createSet(name, setstr) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var id = sets.slice(-1)[0].id + 1;
        var kanji = setstr.replace(" ", "");

        // Ensure set is correct
        if (!(name.length >= 1 && name.length <= 12)) return reject("Name must be 12 or less characters");
        if (!KANJI_REGEX.test(kanji)) return reject("Invalid kanji string");

        sets.push({ id, name, kanji, enabled: true });
        chrome.storage.local.set({customsets: sets}, resolve);
    });
}

/**
 * Deletes a set by its ID
 * 
 * @param {Number} id The ID of the set to delete
 */
function deleteSet(id) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var updated = sets.filter(value => value.id != id);

        chrome.storage.local.set({ customsets: updated }, resolve);
    });
}

/**
 * Renames a set. Checks are run on the input to ensure data is valid
 * 
 * @param {Number} id The ID of the set to rename
 * @param {String} name The new name (1-12 chars)
 */
function renameSet(id, name) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var target = sets.find(x => x.id == id);
        var index = sets.indexOf(target);
        
        if (!(name.length >= 1 && name.length <= 12)) return reject("Name must be 12 or less characters");
        if (target == undefined) return reject(`Set with ID ${id} does not exist`);

        target.name = name;
        sets[index] = target;

        chrome.storage.local.set({ customsets: sets }, resolve);
    });
}

/**
 * Updates the kanji which are stored in a particular set
 * 
 * @param {Number} id The ID of the set
 * @param {String} kanji The new kanji which will be contained in the set
 */
function editSetKanji(id, kanji) {
    return new Promise(async (resolve, reject) => {
        var sets = (await chrome.storage.local.get("customsets")).customsets;
        var target = sets.find(x => x.id == id);
        var index = sets.indexOf(target);
        
        // Ensure set is correct
        if (!KANJI_REGEX.test(kanji)) return reject("Invalid kanji string");
        if (target == undefined) return reject(`Set with ID ${id} does not exist`);

        target.kanji = kanji;
        sets[index] = target;

        chrome.storage.local.set({ customsets: sets }, resolve);
    });
}

// Event listeners
document.getElementById("createset").addEventListener("click", async () => {
    await createSet(prompt("Unit name:"), prompt("Kanji in unit:")).then(() => {
        generateKanjiSets();
    }).catch(err => {
        alert(err);
    });
});

window.addEventListener("beforeunload", event => {
    if (document.querySelector("[contentEditable=true]") !== null) {
        return event.returnValue = "Are you sure you want to exit? You have unsaved changes";
    }
});

document.getElementById("export").addEventListener("click", async () => {
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    var encoded = encodeBinaryToHex(encodeStringToBinary(JSON.stringify(sets)));

    navigator.clipboard.writeText(encoded);
    alert("Your exported configuration has been copied to your clipboard in hex format");
});

document.getElementById("import").addEventListener("click", async () => {
    try {
        var encoded = prompt("Paste in your configuration string below");
        var decoded = JSON.parse(decodeBinaryToString(decodeHexToBinary(encoded)));
    } catch (error) {
        alert("Invalid configuration string. Couldn't import configuration");
        return console.error("Error while attempting to parse import string: " + encoded + "\n\n" + error);
    }

    await chrome.storage.local.set({ customsets: decoded });
    generateKanjiSets();
});

document.getElementById("reset").addEventListener("click", async () => {
    if (!confirm("Are you sure you want to reset your sets to the default?")) return;
    chrome.runtime.sendMessage({type: "resetKanjiSets"}, generateKanjiSets);
});

document.getElementById("showsettings").addEventListener("change", async (event) => {
    var settingsbtn = event.target.checked;
    chrome.storage.local.set({ settingsbtn });
});

document.getElementById("videoslider").addEventListener("change", async (event) => {
    var videoSpeed = event.target.value / 100;
    chrome.storage.local.set({ videoSpeed });
});

// Refresh content on the screen if anything changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (!"customsets" in changes) return;

    generateSettingsPage();
});
