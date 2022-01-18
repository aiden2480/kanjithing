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
