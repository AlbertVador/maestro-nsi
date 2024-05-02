document.onkeydown = (e) => {
    switch (e.key) {
        case "a":
            arrows[0].push(new Arrow(0, -50));
            break;
        case "s":
            arrows[1].push(new Arrow(1, -50));
            break;
        case "d":
            arrows[2].push(new Arrow(2, -50));
            break;
        case "f":
            arrows[3].push(new Arrow(3, -50));
            break;
        case "v":
            rateAction(0);
            break;
        case "b":
            rateAction(1);
            break;
        case "n":
            rateAction(2);
            break;
        case "m":
            rateAction(3);
            break;
    }
}

const rateAction = (lane) => {
    if (arrows[lane].length === 0) {
        console.log("Aucune flèche");
        return 0;
    }
    const altitude = arrows[lane][0].y;
    const difference = Math.abs(canvasHeight/2 - arrows[lane][0].y - 25);
    arrows[lane].splice(0, 1);
    arrows[4].push(new Arrow(lane, altitude, true));
    console.log(difference);
    if (difference <= 10) {
        console.log("Parfait!");
        return 100;
    }
    else if (difference <= 30) {
        console.log("Bien.")
        return 75;
    }
    else {
        console.log("Mauvais :(");
        return 0;
    }
}

let arrierePlan;
const renderStatic = () => {
    arrierePlan.render();
    ctx.lineWidth = 1;
    const firstLaneX = canvasWidth/2 - 2 * laneWidth;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    // for (let i = 0; i < 5; i++) {
    //     ctx.moveTo(firstLaneX + i*laneWidth, 0);
    //     ctx.lineTo(firstLaneX + i*laneWidth, canvasHeight);
    // }
    ctx.moveTo(firstLaneX, canvasHeight/2);
    ctx.lineTo(firstLaneX + 4*laneWidth, canvasHeight/2);
    ctx.stroke();
    ctx.closePath();
}

const arrows = [[], [], [], [], []]; // Une liste de 5 listes: les 4 premières pour les flèches actives, et la dernière pour les flèches mortes (en gris)
const renderArrows = (dt) => {
    for (i = 0; i < 5; i++) {
        for (j = arrows[i].length - 1; j >= 0; j--) { // Commence à la fin de la liste pour empêcher un bug des flèches
            if (arrows[i][j].updatePosition(dt)) { // arrows[i].updatePosition() renvoie true quand la flèche n'est pas sur l'écran
                arrows[i].splice(j, 1);
            }
            else {
                arrows[i][j].render();
            }
        }
    }
}

const musiciens = [];
const renderMusiciens = (dt, temps) => {
    for (i = 0; i < musiciens.length; i++) {
        musiciens[i].update(dt, temps);
        musiciens[i].render();
    }
}

let tempsFleches;
let timestampCount = 0;
const arrowSpeed = 200/1000; // px/ms
const arrowDelay = (canvasHeight + 25) / (2*arrowSpeed); // v = d / t | t = d / v
let previousTime = performance.now();
const gameLoop = (currentTime) => {
    dt = currentTime - previousTime;
    previousTime = currentTime;
    if (timestampCount < tempsFleches.length) {
        if (audioContext.currentTime*1000 + arrowDelay >= tempsFleches[timestampCount]["temps"]) {
            for (i = 0; i < nombreTelephones; i++) {
                arrows[tempsFleches[timestampCount]["directions"][i]].push(new Arrow(tempsFleches[timestampCount]["directions"][i], -50));
            }
            timestampCount++;
        }
    }
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    renderStatic();
    renderMusiciens(dt, audioContext.currentTime);
    renderArrows(dt);
    requestAnimationFrame(gameLoop);
}

let webSocket;
let nombreTelephones = 0;
const bouttonCommencer = document.getElementById("commencer");
const codeConnect = document.getElementById("codeConnect");
const conteneur = document.getElementById("conteneur");
const divsEtats = [document.getElementById("etat1"), document.getElementById("etat2")];
const bouttonJouer = document.getElementById("jouer");
bouttonCommencer.onclick = () => {
    conteneur.removeChild(bouttonCommencer);
    webSocket = new WebSocket(`ws://${window.location.hostname}:8080/`);
    webSocket.onmessage = (reponse) => {
        codeConnect.innerHTML = reponse.data;
        webSocket.onmessage = (infoTelephone) => {
            if (infoTelephone.data === "connecté") {
                divsEtats[nombreTelephones].innerHTML = "Lié";
                nombreTelephones++;
            }
            else if (infoTelephone.data === "déconnecté") {
                nombreTelephones--;
                divsEtats[nombreTelephones].innerHTML = "...";
            }
            bouttonJouer.style.display = nombreTelephones > 0 ? "block" : "none";
        }
    }
    conteneurConnect.style.display = "block";
}

const conteneurChoixChanson = document.getElementById("conteneurChoixChanson");
bouttonJouer.onclick = () => {
    document.getElementById("conteneurConnect").style.display = "none";
    bouttonJouer.style.display = "none";
    conteneurChoixChanson.style.display = "block";
    webSocket.onmessage = (message) => {
        rateAction(message);
    }
}

const audioContext = new AudioContext();
let source;
const joueAudio = async (nomAudio) => {
    source = audioContext.createBufferSource();
    const audioBuffer = await fetch(`/audio/${nomAudio}`)
      .then(res => res.arrayBuffer())
      .then(ArrayBuffer => audioContext.decodeAudioData(ArrayBuffer));
  
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
};

const commenceJeu = async (fichierChanson) => {
    const reponse = await fetch(`/chanson/${fichierChanson}`);
    const json = await reponse.json();
    tempsFleches = json["fleches"];
    arrierePlan = new Sprite("imagesJeu/Stage.png", 0, 0, canvasWidth, canvasHeight);

    //
    const infoInstruments = json["instruments"];
    for (const [instrument, intervallesActions] of Object.entries(infoInstruments)) {
        switch (instrument) {
            case "violon":
                musiciens.push(new Musicien("/imagesJeu/violon/0", intervallesActions, 100, 400))
        }
    }
    
    //

    joueAudio(json["fichier"]);
    requestAnimationFrame(gameLoop);
}

const titre = document.getElementById("titre");
const listeChansons = document.getElementById("listeChansons");
const preparerListeChansons = async () => {
    const reponse = await fetch("/chansonsPossibles");
    const chansons = await reponse.json();
    chansons.forEach(chanson => {
        const element = document.createElement("div");
        element.classList.add("chanson");
        element.innerHTML = chanson[0];
        // element.nomFichier = chanson[1];

        element.onclick = () => {
            canvas.style.display = "block";
            conteneurChoixChanson.style.display = "none";
            titre.style.display = "none";
            commenceJeu(chanson[1]);
        }
        listeChansons.appendChild(element);
    })
}
preparerListeChansons();