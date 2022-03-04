/* Save the current kanji */
var current;
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
chrome.runtime.onInstalled.addListener(reason => {
    console.log("Install event fired with", reason);
    chrome.runtime.setUninstallURL("https://kanjithing-backend.chocolatejade42.repl.co/uninstall");

    // Create default sets
    chrome.storage.local.get("customsets", (result) => {
        if (result.customsets === undefined) {
            // {id: ..., name: ..., kanji: ..., enabled: ...}

            var names = ["one", "two", "three", "four", "five", "six",
                         "seven", "eight", "nine", "ten", "eleven", "twelve",
            ];
            
            var transformed = wakattaunits.map((item, index) => {
                return {id: index, name: "Unit " + names[index], enabled: true, kanji: item}
            });

            chrome.storage.local.set({customsets: transformed});
        }
    });
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
