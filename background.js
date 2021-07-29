/* Store the current kanji */
var current = "時";

/* Set up a listener so we can receive messages from the console */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // {type: ..., data: ...}

    switch (message.type) {
        case "log":
            console.log(message.data);
            break;
        case "setIcon":
            setBrowserIcon(message.data);
        default:
            break;
    }
});

/* Set up a listener for when the extension is installed */
chrome.runtime.onInstalled.addListener(reason => {
    console.log("oh shit this actually fired", reason);

    // Set current kanji to default
    chrome.storage.local.set({ current }, () => {
        console.log("Set default kanji to", current);
    });

    setBrowserIcon(current, true);
    chrome.runtime.setUninstallURL("https://kanjithing-backend.chocolatejade42.repl.co/uninstall");
});

/* Script to change the browser icon */
function setBrowserIcon(kanji, bypass=false) {
    // https://jsfiddle.net/1u37ovj9/
    if (current === kanji && !bypass) return;

    var canvas = new OffscreenCanvas(64, 64);
    var context = canvas.getContext("2d");

    context.font = "60px Arial";
    context.clearRect(0, 0, 64, 64);

    context.fillStyle = "#7289DA";
    context.fillRect(0, 0, 64, 64);

    context.textAlign = "center";
    context.fillStyle = "#FFFAFA";
    context.fillText(kanji, 0.5 * canvas.width, 0.825 * canvas.height);

    current = kanji;
    var imageData = context.getImageData(0, 0, 64, 64);
    chrome.action.setIcon({imageData}, () => console.log(`Set browser icon to %c${kanji}`, "color: #7289da"));
};
