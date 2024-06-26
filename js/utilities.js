/**
 * Resizes an square SVG and returns the new data URL
 * 
 * @param {DataURL} dataURL The data URL of the SVG
 * @returns {Canvas} The resized element on a canvas
 */
function resizeSquareSVGToCanvas(dataURL, sideLength) {
    return new Promise((resolve, reject) => {
        var fabcan = document.createElement("canvas");
        var fabctx = fabcan.getContext("2d");
        var img = new Image();
    
        img.addEventListener("load", () => {
            fabctx.drawImage(img, 0, 0, sideLength, sideLength);
            resolve(fabcan);
        })
    
        fabcan.width = sideLength;
        fabcan.height = sideLength;
        img.src = dataURL;
    });
}

/**
 * Converts a canvas to black and white for better comparison
 * 
 * @param {Canvas} canvas The canvas element to process
 * @returns {Canvas} The monochrome canvas
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
    return fabcan;
}

/**
 * Because cors is one of the dumbest things humans have ever invented
 * 
 * @param {URL} url The url to request via cors proxy
 * @returns The url page contents
 */
async function fetchUrlViaCorsProxy(url) {
    var resp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    var json = await resp.json();

    return json.contents;
}

/**
 * Creates a new blank canvas of dimensons widthxheight
 * 
 * @param {Integer} width The width of the canvas
 * @param {Integer} height The height of the canvas
 */
function newBlankCanvas(width, height) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    return canvas;
}

/**
 * Takes the user's canvas drawing and the drawing guide video and
 * compares them to evaluate the user's drawing. This process factors
 * in the complexity of the character when grading.
 * 
 * @returns {Float} The user's score between 0 and 100
 */
export async function checkRembrandt() {
    var kanji = selectedkanji.selectedOptions[0].innerText;

    var kanjiDetails = await fetchKanjiDetails(kanji);
    var posterUrl = kanjiDetails.kanji.video.poster;
    var posterDataUrl = await fetchUrlViaCorsProxy(posterUrl);
    var resizedPosterCanvas = await resizeSquareSVGToCanvas(posterDataUrl, 248);
    var posterDataUrl = convertCanvasToBlackAndWhite(resizedPosterCanvas).toDataURL();
        
    // Compare drawing with video, and blank with video
    var checkrem = new Rembrandt({
        imageA: posterDataUrl,
        imageB: convertCanvasToBlackAndWhite(canvas).toDataURL(),
        maxOffset: 2,
        renderComposition: true,
    });

    var blankrem = new Rembrandt({
        imageA: posterDataUrl,
        imageB: newBlankCanvas(248, 248).toDataURL(),
        maxOffset: 2,
    });

    var blank = await blankrem.compare();
    var check = await checkrem.compare();
    console.image(check.compositionImage.src);

    // Find the drawing score relative to the complexity of the kanji
    var score = (1 - check.percentageDifference / blank.percentageDifference - blank.percentageDifference);

    return Math.max(score, 0) * 100;
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
