function getLastFrameOfVideo(url) {
    // Take in a video URL and get the last frame from that video.
    // Used to compare video to canvas drawing via Rembrandt.

    return new Promise((resolve, reject) => {
        var vid = document.createElement("video");
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
    
        vid.addEventListener("canplaythrough", () => {
            vid.addEventListener("canplay", () => {
                ctx.drawImage(vid, 0, 0);
            
                resolve(canvas.toDataURL());
            });

            vid.currentTime = vid.duration;
        }, {once: true});
    
        [canvas.width, canvas.height] = [248, 248];
        vid.crossOrigin = "anonymous";
        vid.src = url;    
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
    var canv = document.createElement("canvas");
    [canv.width, canv.height] = [248, 248];
    
    var rem = new Rembrandt({
        imageA: await getLastFrameOfVideo((await fetchKanjiDetails(selectedkanji.value)).video),
        imageB: convertCanvasToBlackAndWhite(canvas),
        thresholdType: Rembrandt.THRESHOLD_PERCENT,
        maxThreshold: 0.10,
        maxDelta: 20,
        maxOffset: 0,
        renderComposition: true,
        compositionMaskColor: new Rembrandt.Color(0.54, 0.57, 0.62)
    });

    var blank = new Rembrandt({
        imageA: await getLastFrameOfVideo((await fetchKanjiDetails(selectedkanji.value)).video),
        imageB: canv.toDataURL()
    });

    blank.compare().then(result => {
        console.debug("Pixel Difference:", result.differences, "Percentage difference", result.percentageDifference * 100 + "%");

        window.diff = result.percentageDifference;
    }).catch((e) => {
        console.error(e);
    });

    rem.compare().then(result => {
        console.debug("Pixel Difference:", result.differences, "Percentage difference", result.percentageDifference * 100 + "%");
        console.debug("Passed:", result.passed);
        // document.body.appendChild(result.compositionImage);

        console.debug(result.percentageDifference / window.diff * 100);        
    }).catch((e) => {
        console.error(e);
    });
}

export async function fetchKanjiDetails(kanji) {
    // Make request for resource - either cache or online
    var baseurl = "https://kanjithing-backend.chocolatejade42.repl.co";
    var version = (await chrome.management.getSelf()).version;
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
