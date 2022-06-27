function getLastFrameOfVideo(url) {
    // Take in a video URL and get the last frame from that video.
    // Used to compare video to canvas drawing via Rembrandt.

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

function contentURLToDataURL(url) {
    // Takes the video URL and fully downloads the
    // video, before converting it to a Data URL

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

function convertCanvasToBlackAndWhite(canvas) {
    // Convert the canvas to black and white for better comparison
    
    var pixels = canvas.getContext("2d").getImageData(0, 0, 248, 248);
    var fabcan = document.createElement("canvas");
    [fabcan.width, fabcan.height] = [248, 248];

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

    var fabctx = fabcan.getContext("2d");
    fabctx.putImageData(pixels, 0, 0, 0, 0, pixels.width, pixels.height);
    return fabcan.toDataURL("image/png")
}

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
    [blankcanv.width, blankcanv.height] = [248, 248];
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

export async function fetchKanjiDetails(kanji) {
    // Make request for resource - either cache or online
    const rapidAPI = atob("bjZ2SVQ5ZDU0Wm1zaEVlSlk1ZUdBSFpNQmt0cXAxV1V1Tmdqc253OWxpYXVRRVVFVXU");
    const infosection = document.getElementById("infosection");
    const options = {
        headers: {"x-rapidapi-key": rapidAPI},
        cache: "force-cache",
    };

    try {
        var resp = await fetch("https://kanjialive-api.p.rapidapi.com/api/public/kanji/" + kanji, options);
        var json = await resp.json();
        infosection.classList.remove("offline");
    } catch (error) {
        infosection.classList.add("offline");
        return {};
    }

    if (!resp.ok) {
        console.error(`Received status code ${resp.status} from `, resp);
        infosection.classList.add("offline");
        return;
    }

    return json;
}

// Fetching sets utility functions
export async function fetchSetFromID(id) {
    // Finds a set from a given ID
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    return sets.find(x => x.id == id);
}

export async function fetchAnySet() {
    // Fetch any set in the event that we cannot find the desired one
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    return sets[0];
}

export async function fetchRandomSet() {
    // Fetch a random set
    var sets = (await chrome.storage.local.get("customsets")).customsets;
    return sets[Math.floor(Math.random() * sets.length)];
}

export async function fetchAllSets() {
    return (await chrome.storage.local.get("customsets")).customsets;
}
