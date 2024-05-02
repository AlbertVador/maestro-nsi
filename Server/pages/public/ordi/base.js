const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

const canvasWidth = ctx.canvas.width;
const canvasHeight = ctx.canvas.height;

const laneWidth = 65;
const laneCenters = [canvasWidth/2 - (3/2)*(laneWidth)];
for (i = 1; i < 4; i++) {
    laneCenters.push(laneCenters[i-1] + laneWidth);
}