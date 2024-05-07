// Récupération du canvas et du contexte 2D pour dessiner
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Désactivation du lissage d'image pour un rendu pixelisé
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// Récupération de la largeur et de la hauteur du canvas
const canvasWidth = ctx.canvas.width;
const canvasHeight = ctx.canvas.height;

// Largeur d'une voie (lane) dans le jeu
const laneWidth = 65;

// Calcul des centres des voies (lanes) pour le placement des flèches
const laneCenters = [canvasWidth/2 - (3/2)*(laneWidth)]; // Position du centre de la première voie
for (i = 1; i < 4; i++) {
    // Calcul de la position du centre de chaque voie suivante en ajoutant la largeur de la voie
    laneCenters.push(laneCenters[i-1] + laneWidth);
}
