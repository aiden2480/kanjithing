/* Define elements */
var canvas = document.getElementById("drawcanvas");
var video = document.getElementById("kanjiguide");
var playpause = document.getElementById("playpause");
var eraseall = document.getElementById("eraseall");
var selectedkanji = document.getElementById("selectedkanji");
var randomkanji = document.getElementById("randomkanji");
var ctx = canvas.getContext("2d");
var currentlyPressedKeys = {};

/* TODO: Find a better home for this variable */
var wakattaunits = [
    "学校名前父母生高姉妹兄弟住所色",
    "好同手紙英語何年私友行毎教場",
    "早新家入出思来島午後朝夜牛魚族",
    "会社持待道近町番屋店駅神様区",
    "時間国先長話見言休聞今食勉強",
    "帰買電車左右目口書物飲肉昼乗",
    "曜気分多少元半使天病心楽方作文",
    "週夏立自赤外西川旅州晩洗持活去",
    "正冬着安広海古寺東京都北市県",
    "森山知雪雨字読急洋服動止院漢和",
    "春秋花南田売耳青白仕事銀犬飯",
    "林黒羊地夕次体発馬才鳥茶歩鉄"
];
wakattaunits.unshift(wakattaunits.join(""));

/* Main function to load a selected kanji */
function loadKanji(kanji) {
    // TODO Check if the kanji isn't in dropdown list, and add it if so.
    console.log(`Loading kanji %c${kanji}`, "color: #3498db");
    eraseall.click();
    selectedkanji.value = kanji;

    // Load in examples
    populateInformation(kanji);

    // Update saved kanji in database
    chrome.storage.local.set({ "selectedkanji": kanji });

    // Get video URL and set source
    vidloading = true;
    video.src = "/media/loading.png";
    fetchKanjiDetails(kanji).then(details => {
        video.src = details.video;
    })

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
        let unit = result.selectedunit !== undefined ? parseInt(result.selectedunit) : wakattaunits.length - 1;
        let kanji = result.selectedkanji !== undefined ? result.selectedkanji : wakattaunits[unit][0];

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

randomkanji.addEventListener("click", () => {
    // Load a random kanji from the selected set
    var set = wakattaunits[selectedunit.value].replace(selectedkanji.value, "");
    var index = Math.floor(Math.random() * set.length);
    loadKanji(set[index]);
})

document.addEventListener("keydown", (event) => {
    // Disable custom key events when special keys held
    if (event.ctrlKey || event.shiftKey) return;

    // Suppress Chrome default behaviour (Issue #16)
    if (event.code.startsWith("Arrow")) event.preventDefault();

    // Ignore duplicate presses less than 200ms apart (Issue #15)
    if (new Date().getTime() - currentlyPressedKeys[event.code] < 200) return;
    currentlyPressedKeys[event.code] = new Date().getTime();

    // Hotkey callbacks for each key
    switch (event.code) {
        case "KeyR":
            var set = wakattaunits[selectedunit.value].replace(selectedkanji.value, "");
            var index = Math.floor(Math.random() * set.length);
            
            loadKanji(set[index]);
            break;
        case "ArrowUp":
            var thispos = parseInt(selectedunit.value);
            var nextpos = thispos - 1 < 0 ? wakattaunits.length - 1 : thispos - 1;

            selectedunit.value = nextpos;
            loadKanjiSet(nextpos);
            break;
        case "ArrowDown":
            var thispos = parseInt(selectedunit.value);
            var nextpos = thispos + 1 >= wakattaunits.length ? 0 : thispos + 1;

            selectedunit.value = nextpos;
            loadKanjiSet(nextpos);
            break;
        case "ArrowLeft":
            var thispos = wakattaunits[selectedunit.value].indexOf(selectedkanji.value);
            var nextpos = thispos > 0 ? thispos - 1 : wakattaunits[selectedunit.value].length - 1;
            
            loadKanji(wakattaunits[selectedunit.value][nextpos]);
            break;
        case "ArrowRight":
            var thispos = wakattaunits[selectedunit.value].indexOf(selectedkanji.value);
            var nextpos = thispos >= wakattaunits[selectedunit.value].length - 1 ? 0 : thispos + 1;
            
            loadKanji(wakattaunits[selectedunit.value][nextpos]);
            break;
        case "Backspace":
        case "Delete":
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            break;
    }
});

document.addEventListener("keyup", (event) => {
    delete currentlyPressedKeys[event.code];
});

/* API call functions */
async function fetchKanjiDetails(kanji) {
    // Make request for resource - either cache or online
    var baseurl = "https://kanjithing-backend.chocolatejade42.repl.co";
    var version = (await chrome.management.getSelf()).version.split(".").slice(0, 2).join(".");
    var infosection = document.getElementById("infosection");
    
    try {
        var resp = await fetch(`${baseurl}/kanji/${encodeURI(kanji)}?q=${version}`);
        var json = await resp.json();
        infosection.classList.remove("offline");
    } catch (error) {
        infosection.classList.add("offline");
        return {};
    }

    if (json.status !== 200) {
        console.error(json.error, resp);
        infosection.classList.add("offline");
        return {};
    }

    return json;
}

async function populateInformation(kanji) {
    var json = await fetchKanjiDetails(kanji)
    var listelem = document.getElementById("exampleslist");
    console.debug("populating kanji", kanji, JSON.parse(JSON.stringify(json)));

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
    listelem.textContent = "";
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
