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
var current = "番"; // We're just using the same kanji because
                    // I'm lazy and haven't found a good free api yet

/* Main function to load a selected kanji */
function loadKanji(kanji) {
    // TODO: The magic to get the video URL goes here
    video.src = "https://media.kanjialive.com/kanji_animations/kanji_mp4/ban(gou)_00.mp4";
    selectedkanji.textContent = kanji;

    chrome.runtime.sendMessage({
        type: "setIcon",
        data: kanji,
    });
}

/* Add event listeners for the various elements */
window.addEventListener("load", () => {     // Load the selected kanji once prepared
    loadKanji(current);
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
