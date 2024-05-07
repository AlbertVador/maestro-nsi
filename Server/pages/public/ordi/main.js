// Si on est en local, alors le WebSocket ne sera pas sécurisé (il y aura un s en moins)
let wssOrNot;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    wssOrNot = ''
}
else {
    wssOrNot = 's'
}

// Suivi des performances du joueur
let performanceJoueur = {
  "parfait" : 0,
  "bien": 0
}

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

// Fonction appelée lorsque le jeu est terminé
const gameOver = () => {
  // Affichage des éléments de fin de jeu
  canvas.style.display = "none";
  titre.style.display = "block";
  conteneurGameOver.style.display = "block";
  bouttonRejouer.style.display = "block";

  // Calcul du score du joueur en fonction des performances
  const score = Math.floor(100000* (performanceJoueur["parfait"] + 0.75 * performanceJoueur["bien"]) / arrowCount); // 100000 = maximum possibles de points
  console.log(score);

  // Animation des chiffres du score
  setTimeout(() => {
      for (i = 5; i >= 0; i--) {
          chiffresScore[i].style.translate = `0rem ${-Math.floor(score/(10**(5-i))%10)*6 - 0.5}rem`;
      }
  }, 1500);
}

// Gestion du clic sur le bouton "Rejouer"
bouttonRejouer.onclick = () => {
  // Réinitialisation des éléments pour une nouvelle partie
  bouttonRejouer.style.display = "none";
  conteneurGameOver.style.display = "none";
  conteneurChoixChanson.style.display = "block";
  lineColour = "black"
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
}

// Initialisation de la liste des flèches (actives et mortes)
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

// Boucle principale de jeu
const gameLoop = (currentTime) => {
  dt = currentTime - previousTime;
  previousTime = currentTime;

  // Gestion du timing des flèches
  if (timestampCount < tempsFleches.length) {
      // Ajout des nouvelles flèches selon le temps de la chanson
      if (audioContext.currentTime*1000 + arrowDelay >= tempsFleches[timestampCount]["temps"]) {
          for (i = 0; i < Math.min(nombreTelephones, tempsFleches[timestampCount]["directions"].length); i++) {
              arrows[tempsFleches[timestampCount]["directions"][i]].push(new Arrow(tempsFleches[timestampCount]["directions"][i], -50));
              arrowCount++;
          }
          // Génération aléatoire de flèches si aucune direction n'est spécifiée
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
   // Effacement du canvas et rendu des éléments du jeu
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  renderStatic(); // Changer la couleur de la ligne au millieu
  renderMusiciens(dt, audioContext.currentTime);
  renderArrows(dt);

  // Vérification de la fin de la chanson
  if (chansonFinit) {
      gameOver();
  }
  else {
      requestAnimationFrame(gameLoop); // Appel récursif pour la prochaine frame
  }
}

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
  webSocket = new WebSocket(`ws${wssOrNot}://${window.location.hostname}:8008`);

  // Que faire quand on reçoit le code du jeu
  webSocket.onmessage = (reponse) => {
      codeConnect.innerHTML = reponse.data;

      // Que faire quand le téléphone déconnecte ou connecte
      webSocket.onmessage = (infoTelephone) => {
          if (infoTelephone.data === "connecté") {
              divsEtats[nombreTelephones].innerHTML = "Lié";
              nombreTelephones++;
          }
          else if (infoTelephone.data === "déconnecté") {
              nombreTelephones--;
              divsEtats[nombreTelephones].innerHTML = "...";
          }

          // Affichage ou non du bouton "Jouer" en fonction du nombre de téléphones connectés
          bouttonJouer.style.display = nombreTelephones > 0 ? "block" : "none";
      }
  }
  // Affichage du conteneur de connexion
  conteneurConnect.style.display = "block";
}

const conteneurChoixChanson = document.getElementById("conteneurChoixChanson");

// Gestion du clic sur le bouton "Jouer"
bouttonJouer.onclick = () => {
  // Affichage du conteneur de choix de chanson et omo masque des autres éléments
  conteneurConnect.style.display = "none";
  bouttonJouer.style.display = "none";
  conteneurChoixChanson.style.display = "block";
  webSocket.onmessage = (message) => { // On définit quand on reçoit un message
      if (message.data != "rien") {
          rateAction(message.data); // Le message contient la direction
      }
  }
}

let audioContext = new AudioContext();
audioContext.suspend();
let source;

// Fonction pour jouer un fichier audio (asynchrone)
const joueAudio = async (nomAudio) => {
  source = audioContext.createBufferSource();
  const audioBuffer = await fetch(`/audio/${nomAudio}`)
    .then(res => res.arrayBuffer())
    .then(ArrayBuffer => audioContext.decodeAudioData(ArrayBuffer));

  // Connexion du buffer audio à la destination de l'AudioContext
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);

  // Musique se finit lorsque l'audio se termine
  source.onended = () => {
      chansonFinit = true;
  }

  // Démarrage de la lecture audio
  source.start();
  audioContext.resume();
};

// Fonction pour commencer le jeu
const commenceJeu = async (fichierChanson) => {
  // Récupération des données de la chanson
  const reponse = await fetch(`/chanson/${fichierChanson}`);
  const json = await reponse.json();

  // Initialisation des données de jeu (positions des musiciens, temps des flèches, etc.)
  tempsFleches = json["fleches"];
  arrierePlan = new Sprite("imagesJeu/Stage.png", 0, 0, 64, 36, 0, 0, canvasWidth, canvasHeight);
  const infoInstruments = json["instruments"];
    
  // Placements des musiciens :
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
      groupes.push(new Groupe(musiciens, Object.keys(infoInstruments).includes(element[0]) ? infoInstruments[element[0]] : []));
  });
    
  // Lecture de la chanson audio qui a été choisie
  joueAudio(json["fichier"]);

  // Début de la boucle principale du jeu
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

      // Gestion du clic sur une musique pour commencer le jeu
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