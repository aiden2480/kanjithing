/* The script that controls the canvas */
var canvas = document.getElementById("drawcanvas");
var ctx = canvas.getContext("2d");

window.addEventListener("load", () => {
    document.addEventListener("mousedown", startPainting);
    document.addEventListener("mouseup", stopPainting);
    document.addEventListener("mousemove", sketch);

    document.addEventListener("touchstart", startPainting);
    document.addEventListener("touchend", stopPainting);
    document.addEventListener("touchmove", sketch);
});

let coords = {x: 0, y: 0};
let paint = false;

function updatePosition(event) {
    if (event.type.startsWith("mouse")) {
        coords.x = event.clientX - canvas.offsetLeft;
        coords.y = event.clientY - canvas.offsetTop;    
    } else if (event.type.startsWith("touch")) {
        coords.x = Math.round(event.touches[0].clientX) - canvas.offsetLeft;
        coords.y = Math.round(event.touches[0].clientY) - canvas.offsetTop;
    }
}

function startPainting(event) {
    paint = true;
    updatePosition(event);
}

function stopPainting(event) {
    paint = false;
}

function sketch(event) {
    if (!paint) return;

    ctx.beginPath();  
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#7289da";
    ctx.moveTo(coords.x, coords.y);

    updatePosition(event);
    ctx.lineTo(coords.x , coords.y);
    ctx.stroke();
}
