function getLastFrameOfVideo(url) {
    // Take in a video URL and get the last frame from that video.
    // Used to compare video to canvas drawing via Rembrandt.

    return new Promise((resolve, reject) => {
        var video = document.createElement("video");
        var fabcan = document.createElement("canvas");
        var fabctx = fabcan.getContext("2d");

        video.preload = "auto";
        video.crossOrigin = "anonymous";

        video.addEventListener("loadedmetadata", () => {
            fabcan.width = video.videoWidth;
            fabcan.height = video.videoHeight;

            var callback = function () {
                if (video.currentTime != video.duration) return getLastFrameOfVideo(url).then(resp => {
                    video.removeEventListener("seeked", callback);
                    resolve(resp);
                });

                video.removeEventListener("seeked", callback);
                fabctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                resolve(fabcan.toDataURL());
            }

            video.addEventListener("seeked", callback);
            video.currentTime = video.duration;
        });

        video.src = url;
        video.load();
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
    var videoBase64 = await getLastFrameOfVideo((await fetchKanjiDetails(selectedkanji.value)).video);
    var blankcanv = document.createElement("canvas");
    var blankctx = blankcanv.getContext("2d");
    
    // Draw 248x248 white on a canvas
    [blankcanv.width, blankcanv.height] = [248, 248];
    blankctx.fillStyle = "white";
    blankctx.fillRect(0, 0, 248, 248);
    
    // Compare drawing with video, and blank with video
    var checkrem = new Rembrandt({
        imageA: videoBase64,
        imageB: convertCanvasToBlackAndWhite(canvas),
        thresholdType: Rembrandt.THRESHOLD_PERCENT,
        maxThreshold: 0.08,
        maxDelta: 20,
        maxOffset: 0,
        // renderComposition: true,
        // compositionMaskColor: new Rembrandt.Color(0.54, 0.57, 0.62)
    });

    var blankrem = new Rembrandt({
        imageA: videoBase64,
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
    var baseurl = "https://kanjithing-backend.chocolatejade42.repl.co";
    var version = (await chrome.management.getSelf()).version.split(".").slice(0, 2).join(".");
    var infosection = document.getElementById("infosection");
    
    try {
        var resp = await fetch(`${baseurl}/kanji/${encodeURI(kanji)}?q=${version}`);
        var json = await resp.json();
        infosection.classList.remove("offline");
    } catch (error) {
        infosection.classList.add("offline");
        return {};
    }

    if (json.status !== 200) {
        console.error(json.error, resp);
        return;
    }

    return json;
}
