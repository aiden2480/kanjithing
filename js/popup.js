/* Define elements */
var canvas = document.getElementById("drawcanvas");
var video = document.getElementById("kanjiguide");
var playpause = document.getElementById("playpause");
var eraseall = document.getElementById("eraseall");
var selectedkanji = document.getElementById("selectedkanji");
var ctx = canvas.getContext("2d");

/* TODO: Find a better home for this variable */
var wakattaunits = [
    "学校名前父母生高姉妹兄弟住所色",
    "好同紙英語何年私友行毎教場",
    "早新家入出思来島午後朝夜牛魚族",
    "会社持待道近町番屋店駅神様区",
    "時間国先長話見言休聞今食勉強",
];
wakattaunits.unshift(wakattaunits.join(""));

/* Main function to load a selected kanji */
function loadKanji(kanji) {
    // TODO Check if the kanji isn't in dropdown list, and add it if so.
    console.log(`Loading kanji %c${kanji}`, "color: #3498db");
    eraseall.click();

    // Update saved kanji in database
    chrome.storage.local.set({ "selectedkanji": kanji });

    // Get video URL and set source
    vidloading = true;
    video.src = "/media/loading.png";
    getKanjiVideoURL(kanji).then(url => {
        video.src = url;
    });

    // Update browser icon
    chrome.runtime.sendMessage({
        type: "setIcon",
        data: kanji,
    });
}

function loadKanjiSet(setindex, defaultkanji=null) {
    var set = wakattaunits[parseInt(setindex)];

    console.log(`Loading set %c${setindex} %c${set}`, "color: #9b59b6", "color: #2ecc71");
    selectedkanji.innerHTML = "";
    
    // Update current unit in database
    chrome.storage.local.set({ "selectedunit": setindex });

    for (let index in set) {
        let elem = document.createElement("option");
        
        elem.textContent = set[index];
        selectedkanji.appendChild(elem);
    };

    // Load the kanji
    defaultkanji ? loadKanji(defaultkanji) : loadKanji(set[0]);
}

/* Add event listeners for the various elements */
window.addEventListener("load", () => {
    // Load the selected kanji once prepared
    chrome.storage.local.get(["selectedunit", "selectedkanji"], result => {
        console.log(`Retrieved from storage %cset ${result.selectedunit} %ckanji ${result.selectedkanji}`, "color: #e67e22", "color: #fee75c");
        let unit = parseInt(result.selectedunit) || wakattaunits.length - 1;
        let kanji = result.selectedkanji || wakattaunits[unit][0];

        loadKanjiSet(unit, kanji);
        selectedunit.value = unit;
        selectedkanji.value = kanji;
    });
});

video.addEventListener("loadeddata", () => {
    // Update `vidloading` state when content has finished loading
    eraseall.click();
    vidloading = false;
});

selectedkanji.addEventListener("change", () => {
    // Load the selected kanji upon dropdown value change
    loadKanji(selectedkanji.value);
});

selectedunit.addEventListener("change", () => {
    // Load the selected unit upon dropdown value change
    loadKanjiSet(selectedunit.value);
});

video.addEventListener("play", () => {
    // Sets the options for the video element (once only)
    video.playbackRate = 0.85;
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

async function getKanjiVideoURL(kanji) {
    // TODO Error handling in case replit decides it wants to break :(
    var baseurl = "https://kanjithing-backend.chocolatejade42.repl.co/kanji/";
    var resp = await fetch(baseurl + encodeURI(kanji));
    var json = await resp.json();
    
    if (json.status !== 200) {
        console.error(json.error, resp);
    }

    return json.video;
};
