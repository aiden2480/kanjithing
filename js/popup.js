/* Define elements */
var canvas = document.getElementById("drawcanvas");
var video = document.getElementById("kanjiguide");
var playpause = document.getElementById("playpause");
var eraseall = document.getElementById("eraseall");
var selectedkanji = document.getElementById("selectedkanji");
var ctx = canvas.getContext("2d");

/* Main function to load a selected kanji */
function loadKanji(kanji) {
    // TODO Check if the kanji isn't in dropdown list, and add it if so.
    console.log(`loading kanji ${kanji}.`);
    eraseall.click();

    // Get video URL and set source
    getKanjiVideoURL(kanji).then(url => {
        console.log(`setting video url to ${url}`);
        video.src = url;
    })

    // Update in chrome storage
    chrome.storage.local.set({current: kanji}, () => {
        console.log("set chrome thing");
    });

    // Update browser icon
    chrome.runtime.sendMessage({
        type: "setIcon",
        data: kanji,
    });
}

function loadKanjiSet(set, replace=true) {
    if (replace) selectedkanji.innerHTML = "";
    
    for (let index in set) {
        let elem = document.createElement("option");
        
        elem.textContent = set[index];
        selectedkanji.appendChild(elem);
    };
}

/* Add event listeners for the various elements */
window.addEventListener("load", () => {
    // Load the selected kanji once prepared
    loadKanjiSet("時間国先長話見言休聞今食勉強");
    chrome.storage.local.get(["current"], result => {
        selectedkanji.value = result.current;
        loadKanji(result.current);
    });
});

selectedkanji.addEventListener("change", () => {
    // Load the selected kanji upon dropdown value change
    loadKanji(selectedkanji.value);
});

video.addEventListener("play", () => {
    // Sets the options for the video element (once only)
    video.playbackRate = 0.8;
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
