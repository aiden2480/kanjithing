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


/* Set up a listener so we can receive messages from the console
    Because chrome is incredibly dumb and stupid, they won't allow
    the listener to be an async function, so we have to instead put
    the async code inside an immediately invoked function, and then
    return true so that chrome knows to wait for a callback to complete
    before continuing. The wrapper looks really ugly but it's the best
    I can do without weird indentation so it's the lesser of two evils
*/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {(async () => {
    // {type: ..., data: ...}

    switch (message.type) {
        case "log":
            console.log(message.data);
            break;
        case "setIcon":
            setBrowserIcon(message.data);
            break;
        case "resetKanjiSets":
            await chrome.storage.local.remove("customsets");
            await createKanjiSets();
            sendResponse();
            break;
        case "ensureDefaultConfig":
            await ensureDefaultConfiguration();
            sendResponse();
            break;
    }

})(); return true});

/* Set up a listener for when the extension is installed/chrome restarts */
chrome.runtime.onInstalled.addListener(async reason => {
    console.log("Install event fired with", reason);
    
    // Bugfix Issue #21
    var { selectedkanji } = await chrome.storage.local.get();
    if (typeof selectedkanji !== "number") {
        await chrome.storage.local.set({ selectedkanji: 0 });
    }

    if ((await chrome.management.getSelf()).installType !== "development")
        chrome.runtime.setUninstallURL("https://kanjithing-backend.chocolatejade42.repl.co/uninstall");
    
    await ensureDefaultConfiguration();
    await ensureCorrectKanjiIcon();
    await ensureBetaBadge();
});

chrome.runtime.onStartup.addListener(async () => {
    await ensureDefaultConfiguration();
    await ensureCorrectKanjiIcon();    
    await ensureBetaBadge();
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
    // Console log when storage values change
    if ((await chrome.management.getSelf()).installType !== "development") return;

    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.debug(`${key} : ${oldValue} -> ${newValue}`);
    }
});

/* Configuration functions called above */
async function ensureCorrectKanjiIcon() {
    var { customsets, selectedset, selectedkanji } = await chrome.storage.local.get();
    if ([ customsets, selectedset, selectedkanji ].includes(undefined)) return;

    setBrowserIcon(customsets[selectedset].kanji[selectedkanji], bypass=true);
}

async function ensureBetaBadge() {
    // Ensure that the "Beta" badge is present if necessary

    if ((await chrome.management.getSelf()).installType === "development") {
        chrome.action.setBadgeText({ text: "B" });
        chrome.action.setBadgeBackgroundColor({ color: "#304db6" });
    }
}

async function ensureDefaultConfiguration() {
    // Create default sets
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    (sets === undefined) && await createKanjiSets();

    // Create default settings
    var { config } = await chrome.storage.local.get("config");
    (config === undefined) && await createDefaultConfig();
}

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
    chrome.action.setIcon({ imageData }, () => console.log(`Set browser icon to %c${kanji}`, "color: #7289da"));
}

/* Creates defult configuration as required by ensureDefaultConfiguration */
async function createKanjiSets() {
    // {id: ..., name: ..., kanji: ..., enabled: ...}
    
    var customsets = defaultsets.map((item, index) => {
        var name = Object.keys(item)[0];
        var value = Object.values(item)[0];

        return {id: index, name: name, kanji: value, enabled: true}
    });

    await chrome.storage.local.set({ customsets });
}

async function createDefaultConfig() {
    var { videoSpeed, settingsbtn } = await chrome.storage.local.get(["videoSpeed", "settingsbtn"]);
    (videoSpeed !== undefined) || await chrome.storage.local.set({ videoSpeed: 0.8 });
    (settingsbtn !== undefined) || await chrome.storage.local.set({ settingsbtn: true });
}
