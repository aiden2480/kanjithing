import * as utils from "/js/utilities.js";

/* Define elements */
var canvas = document.getElementById("drawcanvas");
var video = document.getElementById("kanjiguide");
var playpause = document.getElementById("playpause");
var eraseall = document.getElementById("eraseall");
var selectedset = document.getElementById("selectedset");
var selectedkanji = document.getElementById("selectedkanji");
var remcheck = document.getElementById("remcheck");
var ctx = canvas.getContext("2d");

/* Volitile variables */
var lastPopupTimestamp = 0;
var currentlyPressedKeys = {};

/* Main function to load a selected kanji */
async function loadKanjiIndex(index) {
    var kanji = (await utils.fetchSetFromID(selectedset.value)).kanji[index];

    console.log(`Loading kanji %c${kanji}`, "color: #3498db");
    selectedkanji.value = index;
    eraseall.click();

    // Load in examples
    populateInformation(kanji);

    // Update saved kanji in database
    chrome.storage.local.set({ "selectedkanji": index });

    // Get video URL and set source
    vidloading = true;
    video.src = "/media/loading.png";
    utils.fetchKanjiDetails(kanji).then(details => {
        video.src = details.video;
    })

    // Update browser icon
    chrome.runtime.sendMessage({
        type: "setIcon",
        data: kanji,
    });
}

async function loadKanjiSet(setID, index=0) {
    selectedset.value = setID;
    var set = await utils.fetchSetFromID(setID);

    console.log("Loading set ", set);
    selectedkanji.innerHTML = null;
    
    // Update current unit in database
    chrome.storage.local.set({ "selectedset": setID });

    set.kanji.split("").forEach((char, index) => {
        let elem = document.createElement("option");
        elem.value = index;
        
        elem.textContent = char;
        selectedkanji.appendChild(elem);
    });

    // Load the kanji
    loadKanjiIndex(index);
}

/* Add event listeners for the various elements */
window.addEventListener("load", async () => {
    // Load the custom sets into the selector menu
    (await utils.fetchAllSets()).forEach(set => {
        if (!set.enabled) return;
        let elem = document.createElement("option");

        elem.value = set.id;
        elem.innerText = set.name;
        selectedset.appendChild(elem);
    });

    // Hide/show settings button
    var { settingsbtn } = await chrome.storage.local.get("settingsbtn");
    document.getElementById("settings").style.visibility = settingsbtn ? "visible" : "hidden";

    // Load the selected kanji once prepared
    var result = await chrome.storage.local.get(["selectedset", "selectedkanji"]);
    let setID = result.selectedset !== undefined ? parseInt(result.selectedset) : (await utils.fetchAnySet()).id;
    let kanjiIndex = result.selectedkanji !== undefined ? parseInt(result.selectedkanji) : 0;

    await loadKanjiSet(setID, kanjiIndex);
    selectedset.value = setID;
    selectedkanji.value = kanjiIndex;
});

video.addEventListener("loadeddata", () => {
    // Update `vidloading` state when content has finished loading
    eraseall.click();
    vidloading = false;
});

selectedkanji.addEventListener("change", () => {
    // Load the selected kanji upon dropdown value change
    loadKanjiIndex(selectedkanji.value);
});

selectedset.addEventListener("change", () => {
    // Load the selected unit upon dropdown value change
    loadKanjiSet(selectedset.value);
});

video.addEventListener("play", async () => {
    // Sets the options for the video element (once only)
    var { videoSpeed } = await chrome.storage.local.get("videoSpeed");
    video.playbackRate = videoSpeed;

    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;
}, {once: true});

video.addEventListener("ended", () => {
    // Update play button icon when the video ends
    playpause.value = "🔁";
});

playpause.addEventListener("click", () => {
    // Control the video with a play/pause button
    if (video.paused) {
        video.play();
        playpause.value = "⏸";
    } else {
        video.pause();
        playpause.value = "▶️";
    }
});

eraseall.addEventListener("click", () => {
    // Erases the user's drawing from the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

remcheck.addEventListener("click", async () => {
    var percent = await utils.checkRembrandt();
    var style = document.getElementById("popup-outer").style;
    var inner = document.getElementById("popup-inner");
    var result = "Try again";

    switch (true) {
        case (percent > 90):
            result = "Outstanding!";
            break;
        case (percent > 80):
            result = "Excellent!";
            break;
        case (percent > 70):
            result = "Great!";
            break;
        case (percent > 60):
            result = "Good!";
            break;
    }

    // Set style properties
    inner.children[0].innerText = `You scored ${percent.toFixed(2)}%. ${result}`;
    style.marginTop = "15px";
    style.opacity = 1;
    style.display = "inherit";
    lastPopupTimestamp = new Date();
    
    // Fade up and out after two seconds
    setTimeout(() => {
        (function fadeUp() {
            var doAgain = false;
            if (new Date() - lastPopupTimestamp < 2000) return;
            
            (style.opacity > 0.01 && (style.opacity *= 0.8)) ? doAgain = true : null;
            (parseFloat(style.marginTop) > 1 && (style.marginTop = parseFloat(style.marginTop) * 0.8 + "px")) ? doAgain = true : null;
            
            doAgain ? setTimeout(fadeUp, 40) : style.display = "none";
        })();
    }, 2000);
});

document.addEventListener("keydown", event => {
    // Disable custom key events when special keys held
    if (event.ctrlKey || event.shiftKey) return;

    // Suppress Chrome default behaviour (Issue #16)
    if (event.code.startsWith("Arrow")) event.preventDefault();

    // Ignore duplicate presses less than 200ms apart (Issue #15)
    if (new Date().getTime() - currentlyPressedKeys[event.code] < 200) return;
    currentlyPressedKeys[event.code] = new Date().getTime();

    // Pull out the IDs from the two select elements
    var setopts = Array.from(selectedset.children).map(item => item.value);
    var pickopts = Array.from(selectedkanji.children).map(item => item.value);

    // Hotkey callbacks for each key
    switch (event.code) {
        // TODO Use modulo for ArrowDown and ArrowRight

        case "KeyR":
            var removed = pickopts.filter(item => item != selectedkanji.value);
            loadKanjiIndex(parseInt(removed.random()));
            break;
        case "ArrowUp":
            var thispos = setopts.indexOf(selectedset.value);
            var nextpos = setopts.at(thispos - 1);

            loadKanjiSet(nextpos);
            break;
        case "ArrowDown":
            var thispos = setopts.indexOf(selectedset.value);
            var nextpos = thispos < setopts.length - 1 ? setopts.at(thispos + 1) : 0;

            loadKanjiSet(nextpos);
            break;
        case "ArrowLeft":
            var thispos = pickopts.indexOf(selectedkanji.value);
            var nextpos = pickopts.at(thispos - 1);
            
            loadKanjiIndex(nextpos);
            break;
        case "ArrowRight":
            var thispos = pickopts.indexOf(selectedkanji.value);
            var nextpos = thispos < pickopts.length - 1 ? pickopts.at(thispos + 1) : 0;
            
            loadKanjiIndex(nextpos);
            break;
        case "Backspace":
        case "Delete":
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            break;
        case "Slash":
            document.getElementById("settings").click();
            break;
    }
});

document.addEventListener("keyup", (event) => {
    delete currentlyPressedKeys[event.code];
});

document.getElementById("settings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

// Add random function to the array prototype
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
}

/* API call functions */
async function populateInformation(kanji) {
    // TODO move this to the utilities.js function
    var json = await utils.fetchKanjiDetails(kanji);
    if (selectedkanji.selectedOptions[0].innerText != kanji) return;

    var listelem = document.getElementById("exampleslist");

    // Establish readings
    var on = json.onyomi_ja ? json.onyomi_ja.split("、") : [];
    var kun = json.kunyomi_ja ? json.kunyomi_ja.split("、") : [];
    var readings = on.concat(kun).join("、");

    // Populate kanji details
    document.getElementById("selectedkanjidetails").textContent = kanji;
    document.getElementById("selectedkanjimeaning").textContent = json.kmeaning;
    document.getElementById("strokecount").innerText = json.kstroke;
    document.getElementById("grade").innerText = json.kgrade;
    document.getElementById("onkunyomi").innerText = readings;

    // Add title to reading parent element
    var parent = document.getElementById("onkunyomi").parentElement;
    parent.title = `おん：${json.onyomi_ja || "none"}\nくん：${json.kunyomi_ja || "none"}\n\n`;
    parent.title += "Onyomi are in katakana, while kunyomi are in hiragana";

    // Populate examples
    listelem.textContent = null;
    (json.examples || []).splice(0, 6).map(item => {
        let elem = document.createElement("li");
        let reading = document.createElement("b");
        let meaning = document.createTextNode(item[1]);
        reading.innerText = item[0];

        elem.appendChild(reading);
        elem.appendChild(meaning);
        elem.title = item[0] + item[1];

        listelem.appendChild(elem);
    });
};
