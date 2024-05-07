// Suivi des performances du joueur
let performanceJoueur = {
    "parfait" : 0,
    "bien": 0
};

// Fonction pour évaluer l'action du joueur sur une voie spécifique
const rateAction = (lane) => {
    if (arrows[lane].length === 0) {
        console.log("Aucune flèche");
        return 0;
    }

    // Calcul de la différence entre la position de la flèche et la position cible
    const altitude = arrows[lane][0].y;
    const difference = Math.abs(canvasHeight/2 - altitude - 25);

    // Suppression de la première flèche de la voie active et ajout dans les flèches mortes
    arrows[lane].splice(0, 1);
    arrows[4].push(new Arrow(lane, altitude, true));

    // Évaluation de la précision de l'action et mise à jour des performances du joueur
    if (difference <= 20) {
        console.log("Parfait!");
        performanceJoueur["parfait"]++;
        lineColour = "green";
    }
    else if (difference <= 60) {
        console.log("Bien.");
        performanceJoueur["bien"]++;
        lineColour = "orange";
    }
    else {
        console.log("Mauvais :(");
        lineColour = "red";
    }
};

// Fonction appelée lorsque le jeu est terminé
const gameOver = () => {
    // Affichage des éléments de fin de jeu
    canvas.style.display = "none";
    titre.style.display = "block";
    conteneurGameOver.style.display = "block";
    bouttonRejouer.style.display = "block";

    // Calcul du score du joueur en fonction des performances
    const score = Math.floor(100000 * (performanceJoueur["parfait"] + 0.75 * performanceJoueur["bien"]) / arrowCount); // 100000 = maximum possibles de points
    console.log(score);

    // Animation des chiffres du score
    setTimeout(() => {
        for (i = 5; i >= 0; i--) {
            chiffresScore[i].style.translate = `0rem ${-Math.floor(score/(10**(5-i))%10)*6 - 0.5}rem`;
        }
    }, 1500);
};

// Gestion du clic sur le bouton "Rejouer"
bouttonRejouer.onclick = () => {
    // Réinitialisation des éléments pour une nouvelle partie
    bouttonRejouer.style.display = "none";
    conteneurGameOver.style.display = "none";
    conteneurChoixChanson.style.display = "block";
    lineColour = "black";
    chansonFinit = false;
    arrowCount = 0;
    arrows.forEach(lane => lane.length = 0);
    performanceJoueur = {
        "parfait" : 0,
        "bien": 0
    };
    for (i = 0; i < 6; i++) {
        chiffresScore[i].style.translate = "0rem -0.5rem";
    }
    timestampCount = 0;
    source.stop();
    audioContext.close();
    audioContext = new AudioContext();
    audioContext.suspend();
};

// Fonction de rendu de la ligne centrale et de l'arrière-plan
const renderStatic = () => {
    arrierePlan.render(); // Affichage de l'arrière-plan
    ctx.lineWidth = 2;
    const firstLaneX = canvasWidth/2 - 2 * laneWidth;
    ctx.strokeStyle = lineColour;
    ctx.beginPath();
    ctx.moveTo(firstLaneX, canvasHeight/2);
    ctx.lineTo(firstLaneX + 4*laneWidth, canvasHeight/2);
    ctx.stroke();
    ctx.closePath();
};

// Initialisation de la liste des flèches (actives et mortes)
const arrows = [[], [], [], [], []]; // 4 premieres listes pour les 4 lignes, 5eme pour toutes les fleches mortes

// Boucle principale de jeu
const gameLoop = (currentTime) => {
    dt = currentTime - previousTime;
    previousTime = currentTime;

    // Gestion du timing des flèches
    if (timestampCount < tempsFleches.length) {
        // Ajout des nouvelles flèches selon le temps de la chanson
        if (audioContext.currentTime * 1000 + arrowDelay >= tempsFleches[timestampCount]["temps"]) {
            for (i = 0; i < Math.min(nombreTelephones, tempsFleches[timestampCount]["directions"].length); i++) {
                arrows[tempsFleches[timestampCount]["directions"][i]].push(new Arrow(tempsFleches[timestampCount]["directions"][i], -50));
                arrowCount++;
            }
            // Génération aléatoire de flèches si aucune direction n'est spécifiée
            if (tempsFleches[timestampCount]["directions"].length == 0) {
                let dir = [1,2,3,4];
                dir.splice(lastDirection-1,1);
                dir = dir[Math.floor(Math.random()*3)];
                arrows[statusToLane[dir]].push(new Arrow(statusToLane[dir], -50));
                arrowCount++;
                lastDirection = dir;
            }
            timestampCount++;
        }
    }

    // Effacement du canvas et rendu des éléments du jeu
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    renderStatic();
    renderMusiciens(dt, audioContext.currentTime);
    renderArrows(dt);

    // Vérification de la fin de la chanson
    if (chansonFinit) {
        gameOver();
    } else {
        requestAnimationFrame(gameLoop); // Appel récursif pour la prochaine frame
    }
};


// Initialisation des variables liées au WebSocket et aux éléments HTML
let webSocket;
let nombreTelephones = 0;
const bouttonCommencer = document.getElementById("commencer");
const codeConnect = document.getElementById("codeConnect");
const conteneur = document.getElementById("conteneur");
const divsEtats = [document.getElementById("etat1"), document.getElementById("etat2")];
const bouttonJouer = document.getElementById("jouer");
const conteneurConnect = document.getElementById("conteneurConnect");

// Gestion du clic sur le bouton "Commencer"
bouttonCommencer.onclick = () => {
    // Suppression des éléments de règles et du bouton "Commencer"
    conteneur.removeChild(document.getElementById("regles"));
    conteneur.removeChild(bouttonCommencer);

    // Ouverture d'une connexion WebSocket avec le serveur
    webSocket = new WebSocket(`wss://${window.location.hostname}:8008`);
    
    // Gestion des messages reçus sur le WebSocket
    webSocket.onmessage = (reponse) => {
        // Mise à jour de l'élément HTML avec le code reçu du serveur
        codeConnect.innerHTML = reponse.data;
        
        // Gestion des messages ultérieurs sur le WebSocket
        webSocket.onmessage = (infoTelephone) => {
            if (infoTelephone.data === "connecté") {
                // Mise à jour de l'état du téléphone connecté
                divsEtats[nombreTelephones].innerHTML = "Lié";
                nombreTelephones++;
            } else if (infoTelephone.data === "déconnecté") {
                // Mise à jour de l'état du téléphone déconnecté
                nombreTelephones--;
                divsEtats[nombreTelephones].innerHTML = "...";
            }
            // Affichage ou non du bouton "Jouer" en fonction du nombre de téléphones connectés
            bouttonJouer.style.display = nombreTelephones > 0 ? "block" : "none";
        };
    };

    // Affichage du conteneur de connexion
    conteneurConnect.style.display = "block";
};

// Gestion du clic sur le bouton "Jouer"
bouttonJouer.onclick = () => {
    // Affichage du conteneur de choix de chanson et masquage des autres éléments
    conteneurConnect.style.display = "none";
    bouttonJouer.style.display = "none";
    conteneurChoixChanson.style.display = "block";

    // Gestion des messages reçus sur le WebSocket lors du jeu
    webSocket.onmessage = (message) => {
        // Vérification du message reçu et appel de la fonction rateAction en conséquence
        if (message.data != "rien") {
            rateAction(message.data); // Le message contient la direction de l'action
        }
    };
};

// Fonction pour jouer un fichier audio
let audioContext = new AudioContext();
let source;
const joueAudio = async (nomAudio) => {
    source = audioContext.createBufferSource();
    const audioBuffer = await fetch(`/audio/${nomAudio}`)
      .then(res => res.arrayBuffer())
      .then(ArrayBuffer => audioContext.decodeAudioData(ArrayBuffer));

    // Connexion du buffer audio à la destination de l'AudioContext
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // Déclenchement de l'événement lorsque l'audio se termine
    source.onended = () => {
        chansonFinit = true;
    };

    // Démarrage de la lecture audio
    source.start();
    audioContext.resume(); // Réactivation du contexte audio si nécessaire
};

// Fonction pour commencer le jeu avec une chanson spécifique
const commenceJeu = async (fichierChanson) => {
    // Récupération des données de la chanson depuis le serveur
    const reponse = await fetch(`/chanson/${fichierChanson}`);
    const json = await reponse.json();
    
    // Initialisation des données de jeu (positions des musiciens, temps des flèches, etc.)
    tempsFleches = json["fleches"];
    arrierePlan = new Sprite("imagesJeu/Stage.png", 0, 0, 64, 36, 0, 0, canvasWidth, canvasHeight);
    const infoInstruments = json["instruments"];
    
    // Création des groupes de musiciens en fonction des données récupérées
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
            // Création et ajout des musiciens dans chaque groupe
            musiciens.push(new Musicien(`/imagesJeu/musiciens/${element[0]}${musicien[2] ? "Flipped" : ""}/${Math.floor(Math.random() * 4)}.png`, element[0], musicien[0], musicien[1], element[2][0], element[2][1]));
        });
        // Création et ajout des groupes dans le jeu
        groupes.push(new Groupe(musiciens, Object.keys(infoInstruments).includes(element[0]) ? infoInstruments[element[0]] : []));
    });

    // Lecture de la chanson audio
    joueAudio(json["fichier"]);

    // Début de la boucle principale du jeu
    requestAnimationFrame(gameLoop);
};

// Préparation de la liste des chansons disponibles
const listeChansons = document.getElementById("listeChansons");
const preparerListeChansons = async () => {
    const reponse = await fetch("/chansonsPossibles");
    const chansons = await reponse.json();
    
    // Création des éléments de liste pour chaque chanson disponible
    chansons.forEach(chanson => {
        const element = document.createElement("div");
        element.classList.add("chanson");
        element.innerHTML = chanson[0];

        // Gestion du clic sur une chanson pour commencer le jeu
        element.onclick = () => {
            canvas.style.display = "block";
            conteneurChoixChanson.style.display = "none";
            titre.style.display = "none";
            commenceJeu(chanson[1]);
        };

        // Ajout de l'élément à la liste des chansons affichées
        listeChansons.appendChild(element);
    });
};

// Appel de la fonction pour préparer la liste des chansons
preparerListeChansons();
