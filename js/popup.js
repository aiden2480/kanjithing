/* Redirect stdout to dev console */
console.log = function(msg) {
    chrome.runtime.sendMessage({
        type: "log",
        data: msg,
    });
};

/* Define elements */
var canvas = document.getElementById("drawcanvas");
var video = document.getElementById("kanjiguide");
var playpause = document.getElementById("playpause");
var eraseall = document.getElementById("eraseall");
var selectedkanji = document.getElementById("selectedkanji");
var ctx = canvas.getContext("2d");

/* Main function to load a selected kanji */
function loadKanji(kanji) {
    console.log(`loading kanji ${kanji}.`);
    eraseall.click();

    // TODO: The magic to get the video URL goes here
    getKanjiVideoURL(kanji).then(url => {
        console.log(`setting video url to ${url}`);
        video.src = url;
    })

    // selectedkanji.value = kanji;
    chrome.runtime.sendMessage({
        type: "setIcon",
        data: kanji,
    });
}

/* Add event listeners for the various elements */
window.addEventListener("load", () => {     // Load the selected kanji once prepared
    loadKanji(selectedkanji.value);
});

selectedkanji.addEventListener("change", () => {
    loadKanji(selectedkanji.value);
});

video.addEventListener("play", () => {      // Sets the controls for the video element (once only)
    video.playbackRate = 0.8;
    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;
}, {once: true});

video.addEventListener("ended", () => {     // Update play button icon when the video ends
    playpause.value = "🔁";
});

playpause.addEventListener("click", () => { // Control the video with a play/pause button
    if (video.paused) {
        video.play();
        playpause.value = "⏸";
    } else {
        video.pause();
        playpause.value = "▶️";
    }
});

eraseall.addEventListener("click", () => {  // Erases the user's drawing from the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

async function getKanjiVideoURL(kanji) {
    var baseurl = "https://kanjithing-backend.chocolatejade42.repl.co/kanji/"
    var resp = await fetch(baseurl + encodeURI(kanji));
    var json = await resp.json();
    
    if (json.status !== 200) {
        console.error(json.error, resp);
    }

    return json.video;
};
