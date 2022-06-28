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
    {"Unit twelve": "林黒羊地夕次体発馬才鳥茶歩鉄"},
    {"Prescribed": "大小新古高安多少長近広楽好赤青" +
                   "白黒正茶目口耳手体心元気足和洋" +
                   "神様私家族父母兄姉弟妹子男女友" +
                   "達海山川田天雨雪花春夏秋冬地空" +
                   "島一二三四五六七八九十百千万人" +
                   "才円番本員仕事社所町駅店京都道" +
                   "県市区州場公園寺屋上下中外左右" +
                   "東西南北学校勉強国語文字漢英理" +
                   "科化室日月火水木金土曜毎年週間" +
                   "朝昼晩夜午前後時分半今先電車旅" +
                   "行来帰着乗入出売買特見読書聞話" +
                   "会知思言立使作住生食飲休洗動働" +
                   "通歩待泊教始終何物自名方紙全活飯色"
    },
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
    
    // Register context menus
    chrome.contextMenus.removeAll(() => {
        generateContextMenus();
    });

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
/**
 * Ensures that the correct browser icon is being displayed
 */
async function ensureCorrectKanjiIcon() {
    var { customsets, selectedset, selectedkanji } = await chrome.storage.local.get();
    if ([ customsets, selectedset, selectedkanji ].includes(undefined)) return;

    setBrowserIcon(customsets[selectedset].kanji[selectedkanji], bypass=true);
}

/**
 * Ensures the "Beta" badge is displayed if necessary
 */
async function ensureBetaBadge() {
    if ((await chrome.management.getSelf()).installType === "development") {
        chrome.action.setBadgeText({ text: "B" });
        chrome.action.setBadgeBackgroundColor({ color: "#304db6" });
    }
}

/**
 * Ensures that the default configuration is present if no data can be found
 * within the chrome storage API.
 */
async function ensureDefaultConfiguration() {
    // Create default sets
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    (sets === undefined) && await createKanjiSets();

    // Create default settings
    var { config } = await chrome.storage.local.get("config");
    (config === undefined) && await createDefaultConfig();
}

/**
 * Sets the browser icon to the currently selected character
 * 
 * @param {Char} kanji The character to set the browser icon to
 * @param {Boolean} bypass Bypass same-kanji check
 */
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

/**
 * Creates defult configuration as required by ensureDefaultConfiguration
 */
async function createKanjiSets() {
    // {id: ..., name: ..., kanji: ..., enabled: ...}
    
    var customsets = defaultsets.map((item, index) => {
        var name = Object.keys(item)[0];
        var value = Object.values(item)[0];

        return {id: index, name: name, kanji: value, enabled: true}
    });

    await chrome.storage.local.set({ customsets });
}

/**
 * Creates the default configuration if need be
 */
async function createDefaultConfig() {
    var { videoSpeed, settingsbtn } = await chrome.storage.local.get(["videoSpeed", "settingsbtn"]);
    (videoSpeed !== undefined) || await chrome.storage.local.set({ videoSpeed: 0.8 });
    (settingsbtn !== undefined) || await chrome.storage.local.set({ settingsbtn: true });
}

/* Context menus */
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (!("customsets" in changes)) return;

    chrome.contextMenus.removeAll(() => {
        generateContextMenus();
    });
});

/**
 * Generates the context menus required for each of the sets, as well as a button
 * to create a new unnamed set with the selected characters.
 */
async function generateContextMenus() {
    var sets = (await chrome.storage.local.get("customsets")).customsets || [];

    // Create parent element
    var parent = chrome.contextMenus.create({
        title: "Add kanji to custom set",
        contexts: ["selection"],
        id: "addtocustomset"
    });

    // Create new set menu
    chrome.contextMenus.create({
        title: "Create new set with kanji",
        contexts: ["selection"],
        id: "createnewset",
        parentId: parent,
    });

    // Add to existing set menu
    sets.forEach(set => {
        chrome.contextMenus.create({
            title: "Add to " + set.name,
            parentId: parent,
            id: "addtoset" + set.id,
            contexts: ["selection"],
        });
    });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!info.selectionText) return;

    const ANY_REGEX = /[\u4E00-\u9FAF]+/g;
    const match = info.selectionText.match(ANY_REGEX)?.join("");
    const isPopup = tab.url == chrome.runtime.getURL("popup.html");
    
    // Show a little x for a second if an error occured
    if (!match) return await displayBadge(tab, "X", "#D9381E", 3000);
    var sets = (await chrome.storage.local.get("customsets")).customsets;

    if (info.menuItemId === "createnewset") {
        sets.push({
            id: sets.slice(-1)[0].id + 1,
            name: "Unnamed set",
            kanji: match,
            enabled: true
        });
        
        await chrome.storage.local.set({ customsets: sets });
        await displayBadge(tab, "✓", "#32CD32", 3000);

        if (isPopup) await chrome.storage.local.set({
            selectedunit: sets.at(-1).id,
            selectedkanji: 0,
        });
    }

    if (info.menuItemId.startsWith("addtoset")) {
        var setid = info.menuItemId.match(/addtoset(.+)/)[1];

        var set = sets.find(x => x.id == setid);
        set.kanji += match;

        await chrome.storage.local.set({ customsets: sets });
        await displayBadge(tab, "✓", "#32CD32", 3000);

        if (isPopup) await chrome.storage.local.set({
            selectedunit: set.id,
            selectedkanji: 0,
        });
    }

    // TODO If the ctx menu is being used from inside the extension,
    // Automatically add the kanji to the currently selected set and
    // load it
});

/**
 * Shows a badge on the extenion for a specified amount of time
 * 
 * @param {Tab} tab The tab to show the badge for
 * @param {String} text The badge text
 * @param {Colour} colour The badge colour
 * @param {Number} milliseconds The number of ms to show the badge for
 */
async function displayBadge(tab, text, colour, milliseconds) {
    if (tab.id < 0) tab = await chrome.tabs.query({ active: true });

    var current = {
        colour: await chrome.action.getBadgeBackgroundColor({ tabId: tab.id }),
        text:  await chrome.action.getBadgeText({ tabId: tab.id }),
    }

    // Set text cross
    await chrome.action.setBadgeBackgroundColor({ color: colour });
    await chrome.action.setBadgeText({ text })

    // Schedule return to current
    return setTimeout(async () => {
        await chrome.action.setBadgeBackgroundColor({ color: current.colour });
        await chrome.action.setBadgeText({ text: current.text });
    }, milliseconds);
}
