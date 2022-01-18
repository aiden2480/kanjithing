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
                pixels.data[i] = 0
                pixels.data[i + 1] = 0
                pixels.data[i + 2] = 0
            } else {
                pixels.data[i] = 255
                pixels.data[i + 1] = 255
                pixels.data[i + 2] = 255
                pixels.data[i + 3] = 255
            }
        }
    }

    var fabctx = fabcan.getContext("2d");
    fabctx.putImageData(pixels, 0, 0, 0, 0, pixels.width, pixels.height);
    return fabcan.toDataURL("image/png")
}
