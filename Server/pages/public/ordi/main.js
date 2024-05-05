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

let performanceJoueur = {
    "parfait" : 0,
    "bien": 0
}
const rateAction = (lane) => {
    if (arrows[lane].length === 0) {
        console.log("Aucune flèche");
        return 0;
    }
    const altitude = arrows[lane][0].y;
    const difference = Math.abs(canvasHeight/2 - altitude - 25);
    arrows[lane].splice(0, 1);
    arrows[4].push(new Arrow(lane, altitude, true));
    if (difference <= 20) {
        console.log("Parfait!");
        performanceJoueur["parfait"]++;
        lineColour = "green"
        renderStatic()
    }
    else if (difference <= 60) {
        console.log("Bien.")
        performanceJoueur["bien"]++;
        lineColour = "orange"
        renderStatic()
    }
    else {
        console.log("Mauvais :(");
        lineColour = "red"
        renderStatic()
    }
}

let arrowCount = 0;
const titre = document.getElementById("titre");
const conteneurGameOver = document.getElementById("gameOver");
const chiffresScore = document.getElementsByClassName("chiffreScore");
const bouttonRejouer = document.getElementById("rejouer");
const gameOver = () => {
    canvas.style.display = "none";
    titre.style.display = "block";
    conteneurGameOver.style.display = "block";
    bouttonRejouer.style.display = "block";
    const score = Math.floor(100000* (performanceJoueur["parfait"] + 0.75 * performanceJoueur["bien"]) / arrowCount); // 100000 = maximum possibles de points
    console.log(score);
    setTimeout(() => {
        for (i = 5; i >= 0; i--) {
            chiffresScore[i].style.translate = `0rem ${-Math.floor(score/(10**(5-i))%10)*6 - 0.5}rem`;
        }
    }, 1500);
}

bouttonRejouer.onclick = () => {
    bouttonRejouer.style.display = "none";
    conteneurGameOver.style.display = "none";
    conteneurChoixChanson.style.display = "block";
    chansonFinit = false;
    arrowCount = 0;
    arrows.forEach(lane => lane.length = 0);
    performanceJoueur = {
        "parfait" : 0,
        "bien": 0
    }
    for (i = 0; i < 6; i++) {
        chiffresScore[i].style.translate = "0rem -0.5rem";
    }
    timestampCount = 0;
    source.stop();
    audioContext.close();
    audioContext = new AudioContext();
    audioContext.suspend();
}

let arrierePlan;
let lineColour = "black"
const renderStatic = () => {
    arrierePlan.render();
    ctx.lineWidth = 2;
    const firstLaneX = canvasWidth/2 - 2 * laneWidth;
    ctx.strokeStyle = lineColour;
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
    for (i = 0; i < 4; i++) {
        if (arrows[i].length > 0 && canvasHeight/2 - arrows[i][0].y - 25 < -60) {
            const altitude = arrows[i][0].y;
            arrows[i].splice(0, 1);
            arrows[4].push(new Arrow(i, altitude, true));
            arrows[4][arrows[4].length - 1].render();
        }
        for (j=arrows[i].length - 1; j >= 0; j--) {
            arrows[i][j].updatePosition(dt);
            arrows[i][j].render();
        }
    }
    for (i=arrows[4].length - 1; i >= 0; i--) {
        arrows[4][i].updatePosition(dt);
        if (arrows[4][i].y > canvasHeight) {
            arrows[4].splice(i, 1);
        }
        else {
            arrows[4][i].render();
        }
    }
}

const groupes = [];
const renderMusiciens = (dt, temps) => {
    groupes.forEach(groupe => {
        groupe.update(dt, temps);
    });
}

let chansonFinit = false;
const statusToLane = ["rien", 2, 1, 3, 0];
let tempsFleches;
let timestampCount = 0;
let lastDirection = null;
const arrowSpeed = 200/1000; // px/ms
const arrowDelay = (canvasHeight + 25) / (2*arrowSpeed); // v = d / t | t = d / v
let previousTime = performance.now();
const gameLoop = (currentTime) => {
    dt = currentTime - previousTime;
    previousTime = currentTime;
    if (timestampCount < tempsFleches.length) {
        if (audioContext.currentTime*1000 + arrowDelay >= tempsFleches[timestampCount]["temps"]) {
            for (i = 0; i < Math.min(nombreTelephones, tempsFleches[timestampCount]["directions"].length); i++) {
                arrows[tempsFleches[timestampCount]["directions"][i]].push(new Arrow(tempsFleches[timestampCount]["directions"][i], -50));
                arrowCount++;
            }
            if (tempsFleches[timestampCount]["directions"].length == 0) {
                let dir = [1,2,3,4];
                dir.splice(lastDirection-1,1)
                dir = dir[Math.floor(Math.random()*3)]
                arrows[statusToLane[dir]].push(new Arrow(statusToLane[dir], -50));
                arrowCount++;
                lastDirection = dir;
            }
            timestampCount++;
        }
    }
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    renderStatic();
    renderMusiciens(dt, audioContext.currentTime);
    renderArrows(dt);
    if (chansonFinit) {
        gameOver();
    }
    else {
        requestAnimationFrame(gameLoop);
    }
}

let webSocket;
let nombreTelephones = 0;
const bouttonCommencer = document.getElementById("commencer");
const codeConnect = document.getElementById("codeConnect");
const conteneur = document.getElementById("conteneur");
const divsEtats = [document.getElementById("etat1"), document.getElementById("etat2")];
const bouttonJouer = document.getElementById("jouer");
const conteneurConnect = document.getElementById("conteneurConnect");
bouttonCommencer.onclick = () => {
    conteneur.removeChild(document.getElementById("regles"));
    conteneur.removeChild(bouttonCommencer);
    webSocket = new WebSocket(`wss://${window.location.hostname}:8008`);
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
    conteneurConnect.style.display = "none";
    bouttonJouer.style.display = "none";
    conteneurChoixChanson.style.display = "block";
    webSocket.onmessage = (message) => {
        if (message.data != "rien") {
            rateAction(message.data);
        }
    }
}

let audioContext = new AudioContext();
let source;
const joueAudio = async (nomAudio) => {
    source = audioContext.createBufferSource();
    const audioBuffer = await fetch(`/audio/${nomAudio}`)
      .then(res => res.arrayBuffer())
      .then(ArrayBuffer => audioContext.decodeAudioData(ArrayBuffer));

    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
        chansonFinit = true;
    }
    source.start();
    audioContext.resume();
};

const commenceJeu = async (fichierChanson) => {
    const reponse = await fetch(`/chanson/${fichierChanson}`);
    const json = await reponse.json();
    tempsFleches = json["fleches"];
    arrierePlan = new Sprite("imagesJeu/Stage.png", 0, 0, 64, 36, 0, 0, canvasWidth, canvasHeight);
    const infoInstruments = json["instruments"];
    [
        ["trompette", [[275, 220], [200, 250], [125, 300], [660, 120, true], [770, 150, true], [880, 190, true]], [80, 160]],
        ["cor", [[640, 230], [725, 250], [810, 280]], [105, 160]],
        ["violon", [[0, 325], [10, 425], [100, 425], [720, 335, true], [650, 375, true], [720, 425, true]], [80, 160]],
        ["piano", [[100, 175]], [160, 160]],
        ["flute", [[270, 335], [200, 375], [270, 425]], [120, 160]],
        ["violoncelle", [[884, 355], [914, 425], [824, 425]], [80, 160]]
    ].forEach(element => {
        const musiciens = [];
        element[1].forEach(musicien => {
            musiciens.push(new Musicien(`/imagesJeu/musiciens/${element[0]}${musicien[2] ? "Flipped" : ""}/${Math.floor(Math.random() * 4)}.png`, element[0], musicien[0], musicien[1], element[2][0], element[2][1]));
        });
        groupes.push(new Groupe(musiciens, Object.keys(infoInstruments).includes(element[0]) ? infoInstruments[element[0]] : []));
    });
    joueAudio(json["fichier"]);
    requestAnimationFrame(gameLoop);
}

const listeChansons = document.getElementById("listeChansons");
const preparerListeChansons = async () => {
    const reponse = await fetch("/chansonsPossibles");
    const chansons = await reponse.json();
    chansons.forEach(chanson => {
        const element = document.createElement("div");
        element.classList.add("chanson");
        element.innerHTML = chanson[0];

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
