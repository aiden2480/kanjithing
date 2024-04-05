/**
 * Takes in a video URL and gets the last frame from that video.
 * Used to compare video to canvas drawing via Rembrandt.
 * 
 * @param {URL} url The URL (data or otherwise) of a video resource
 * @returns {DataURL} The last frame of that video as a data URL
 */
function getLastFrameOfVideo(url) {
    return new Promise(async (resolve, reject) => {
        var video = document.createElement("video");
        var fabcan = document.createElement("canvas");
        var fabctx = fabcan.getContext("2d");

        video.addEventListener("error", reject);
        video.addEventListener("loadedmetadata", () => {
            fabcan.width = video.videoWidth;
            fabcan.height = video.videoHeight;

            video.addEventListener("seeked", () => {
                fabctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                resolve(fabcan.toDataURL());
            });

            video.currentTime = video.duration;
        });

        video.src = await contentURLToDataURL(url);
        video.load();
    });
}

/**
 * Resizes an SVG from its original size to 248x248
 * 
 * @param {DataURL} dataURL The data URL of the SVG
 * @returns {DataURL} The resized element
 */
function resizeSVG(dataURL) {
    return new Promise((resolve, reject) => {
        var fabcan = document.createElement("canvas");
        var fabctx = fabcan.getContext("2d");
        var img = new Image();
    
        img.addEventListener("load", () => {
            fabctx.drawImage(img, 0, 0, 248, 248);
            resolve(fabcan.toDataURL());
        })
    
        img.src = dataURL;
        fabcan.width = 248;
        fabcan.height = 248;
    });
}

/**
 * Takes a content URL and fully downloads the content,
 * before converting it back to a data URL
 * 
 * @param {URL} url The URL of a resource on the internet
 * @returns {DataURL} The downloaded resource
 */
function contentURLToDataURL(url) {
    return new Promise(async (resolve, reject) => {
        var resp = await fetch(url, {cache: "force-cache"});
        var reader = new FileReader();

        reader.addEventListener("load", () => {
            // console.debug(reader.result);
            resolve(reader.result);
        });

        reader.addEventListener("error", reject);
        reader.readAsDataURL(await resp.blob());
    });
}

/**
 * Converts a canvas to black and white for better comparison
 * 
 * @param {HTMLCanvas} canvas The canvas element to process
 * @returns {HTMLCanvas} The monochrome canvas
 */
function convertCanvasToBlackAndWhite(canvas) {
    var pixels = canvas.getContext("2d").getImageData(0, 0, 248, 248);
    var fabcan = document.createElement("canvas");
    var fabctx = fabcan.getContext("2d");

    fabcan.width = 248;
    fabcan.height = 248;

    for (var y=0; y < pixels.height; y++) {
        for (var x=0; x < pixels.width; x++) {
            var i = (y * 4) * pixels.width + x * 4;
            var avg = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;

            if (pixels.data[i + 3] > 0 && avg < 255) {
                for (let a=0; a < 3; a++) {pixels.data[i + a] = 0}
            } else {
                for (let a=0; a < 4; a++) {pixels.data[i + a] = 255}
            }
        }
    }

    fabctx.putImageData(pixels, 0, 0, 0, 0, pixels.width, pixels.height);
    return fabcan.toDataURL("image/png")
}

/**
 * Takes the user's canvas drawing and the drawing guide video and
 * compares them to evaluate the user's drawing. This process factors
 * in the complexity of the character when grading.
 * 
 * @returns {Float} The user's score as a percentage between 0 and 1
 */
export async function checkRembrandt() {
    var kanji = selectedkanji.selectedOptions[0].innerText;

    // Replit backend method
    var kanjiID = (await fetchKanjiDetails(kanji)).kanji.video.mp4.split("/").at(-1);
    var comparison = await getLastFrameOfVideo("https://kanjithing-backend.chocolatejade42.repl.co/video/" + kanjiID);
    
    // SVG data URL method (broken)
    // var kanjisvg = (await fetchKanjiDetails(kanji)).kanji.video.poster;
    // var kanjisvgid = kanjisvg.split("/").at(-1);
    // var svgBase64 = await contentURLToDataURL("https://kanjithing-backend.chocolatejade42.repl.co/svg/" + kanjisvgid);
    // var comparison = await resizeSVG(svgBase64);
    
    var blankcanv = document.createElement("canvas");
    var blankctx = blankcanv.getContext("2d");
    
    // Draw 248x248 white on a canvas
    blankcanv.width = 248;
    blankcanv.height = 248;
    blankctx.fillStyle = "white";
    blankctx.fillRect(0, 0, 248, 248);
    
    // Compare drawing with video, and blank with video
    var checkrem = new Rembrandt({
        imageA: comparison,
        imageB: convertCanvasToBlackAndWhite(canvas),
        thresholdType: Rembrandt.THRESHOLD_PERCENT,
        maxThreshold: 0.2,
        maxDelta: 20,
        maxOffset: 0,
        // renderComposition: true,
        // compositionMaskColor: new Rembrandt.Color(0.54, 0.57, 0.62)
    });

    var blankrem = new Rembrandt({
        imageA: comparison,
        imageB: blankcanv.toDataURL(),
        // renderComposition: true,
        // compositionMaskColor: new Rembrandt.Color(0.54, 0.57, 0.62)
    });

    var blank = await blankrem.compare();
    var check = await checkrem.compare();

    // Find the drawing score relative to the complexity of the kanji
    return Math.max(1 - check.percentageDifference / blank.percentageDifference, 0) * 100;
}

/**
 * Looks up information on a character via the KanjiAlive
 * RapidAPI interface. This returns information such as
 * the character grade, pronunciations, and sample words. 
 * 
 * @param {Char} kanji The kanji to lookup in the API
 * @returns {Object} The information stored on the kanji
 */
export async function fetchKanjiDetails(kanji) {
    // Make request for resource - either cache or online
    const rapidAPI = atob("bjZ2SVQ5ZDU0Wm1zaEVlSlk1ZUdBSFpNQmt0cXAxV1V1Tmdqc253OWxpYXVRRVVFVXU");
    const infosection = document.getElementById("infosection");
    const options = {
        headers: { "x-rapidapi-key": rapidAPI },
        cache: "force-cache",
    };

    // Attempt to make the Fetch request
    try {
        var resp = await fetch("https://kanjialive-api.p.rapidapi.com/api/public/kanji/" + kanji, options);
        var json = await resp.json();
        infosection.classList.remove("offline");
    } catch (error) {
        infosection.classList.add("offline");
        return {};
    }

    // Fallback to offline mode if the request failed
    if (!resp.ok) {
        console.error(`Received status code ${resp.status} from `, resp);
        infosection.classList.add("offline");
        return;
    }

    return json;
}

/**
 * Looks up a set based on its ID. Returns undefined if not found.
 * 
 * @param {Integer} id The set ID
 * @returns {CustomSet} The retrieved set
 */
export async function fetchSetFromID(id) {
    // Finds a set from a given ID
    var { customsets } = await chrome.storage.local.get("customsets");

    return customsets.find(x => x.id == id);
}

/**
 * Fetches any enabled set in the event that the desired one cannot be found
 * or is disabled. 
 * 
 * @returns {CustomSet} Any currently enabled set
 */
export async function fetchAnySet() {
    var { customsets } = await chrome.storage.local.get("customsets");
    var pass = customsets.find(item => item.enabled);

    // Return if any are already enabled
    if (pass) return pass;

    // If none are found, we enable the first set and return that one
    customsets[0].enabled = true;
    await chrome.storage.local.set({ customsets });

    return customsets[0];
}

/**
 * Returns a random set from the user's custom sets.
 * 
 * @returns {CustomSet} A random set
 */
export async function fetchRandomSet() {
    // Fetch a random set
    var { customsets } = await chrome.storage.local.get("customsets");

    return customsets[Math.floor(Math.random() * customsets.length)];
}

/**
 * Returns all of the user's custom sets.
 * 
 * @returns {Array<CustomSet>} All sets
 */
export async function fetchAllSets() {
    return (await chrome.storage.local.get("customsets")).customsets;
}

/**
 * Prints an image to the console. Credit to @adriancooney
 * https://github.com/adriancooney/console.image
 * 
 * @param {URL} url The URL of the image to print to the console
 */
console.image = function(url) {
    var img = new Image();

    img.onload = function() {
        var properties = [
            `font-size: 1px`,
            `padding: 0px ${Math.floor(this.width / 2)}px`,
            `line-height: ${this.height}px`,
            `background: url(${url})`,
            `background-size: ${this.width}px ${this.height}px`,
            `color: transparent`,
        ];

        console.log("%c.", properties.join(";"));
    };

    img.src = url;
};
