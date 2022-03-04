/* Save the current kanji */
var current;
var defaultsets = [
    {"Unit one": "学校名前父母生高姉妹兄弟住所色"},
    {"Unit two": "好同手紙英語何年私友行毎教場"},
    {"Unit three": "早新家入出思来島午後朝夜牛魚族"},
    {"Unit four": "会社持待道近町番屋店駅神様区"},
    {"Unit five": "時間国先長話見言休聞今食勉強"},
    {"Unit six": "帰買電車左右目口書物飲肉昼乗"},
    {"Unit seven": "曜気分多少元半使天病心楽方作文"},
    {"Unit eight": "週夏立自赤外西川旅州晩洗持活去"},
    {"Unit nine": "正冬着安広海古寺東京都北市県"},
    {"Unit ten": "森山知雪雨字読急洋服動止院漢和"},
    {"Unit eleven": "春秋花南田売耳青白仕事銀犬飯"},
    {"Unit twelve": "林黒羊地夕次体発馬才鳥茶歩鉄"}
];


/* Set up a listener so we can receive messages from the console */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // {type: ..., data: ...}

    switch (message.type) {
        case "log":
            console.log(message.data);
            break;
        case "setIcon":
            setBrowserIcon(message.data);
            break;
        default:
            break;
    }
});

/* Set up a listener for when the extension is installed */
chrome.runtime.onInstalled.addListener(async reason => {
    console.log("Install event fired with", reason);
    chrome.runtime.setUninstallURL("https://kanjithing-backend.chocolatejade42.repl.co/uninstall");

    // Create default sets
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    
    if (sets === undefined) {
        // {id: ..., name: ..., kanji: ..., enabled: ...}
        
        var customsets = defaultsets.map((item, index) => {
            var name = Object.keys(item)[0];
            var value = Object.values(item)[0];

            return {id: index, name: name, kanji: value, enabled: true}
        });

        chrome.storage.local.set({ customsets });
    }
});

/* Script to change the browser icon */
function setBrowserIcon(kanji) {
    // https://jsfiddle.net/1u37ovj9/
    if (current === kanji) return;

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
