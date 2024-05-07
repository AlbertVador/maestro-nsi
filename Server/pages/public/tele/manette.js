// Si on est en local, alors le WebSocket ne sera pas sécurisé (il y aura un s en moins)
let wssOrNot;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    wssOrNot = ''
}
else {
    wssOrNot = 's'
}

const entree = document.getElementById("entree"); // endroit où on met le code
// on enlève les trucs qui nous énervent
entree.setAttribute('autocomplete', 'off')
entree.setAttribute('autocorrect', 'off')
entree.setAttribute('autocapitalize', 'off')
entree.setAttribute('spellcheck', false)
const bouttonJoindre = document.getElementById("bouttonJoindre");
const bouttonMain = document.getElementById("bouttonMain");
const bouttonPerms = document.getElementById("bouttonPerms");
const statusToLane = ["rien", 2, 1, 3, 0]; // transférer la direction en colonne
bouttonJoindre.onclick = () => {
    const webSocket = new WebSocket(`ws${wssOrNot}://${window.location.hostname}:8080?code=${document.getElementById("entree").value.toUpperCase()}`); // on ouvre une connection webSocket en donnant le code
    webSocket.onclose = () => { // si le code n'est pas bon
        entree.style.borderColor = "red";
    }
    webSocket.onmessage = () => { // si le code est bon
      document.body.removeChild(document.getElementById("conteneur"));
      window.sendStatus = function() {webSocket.send(statusToLane[window.status]);} // définir la fonction sendStatus pour envoyer le mouvement du téléphone
      bouttonMain.style.display = "block";
    }
};

window.status = 0;
// Rien = 0, blanc
// Haut = 1, rouge
// Bas = 2, bleu
// Gauche = 4, noir
// Droite = 3, jaune
let lastStatus = 0;
let relapse = 0;

const getStatus = () => {
  let changement = 1
  if (main == "Droite") {changement = -1} // haut / bas, gauche / droite change dépendant de la main
  const l = [accelX*changement, 0, accelZ*changement*-1];
  lAbs = l.map(Math.abs); // prendre la valeur absolue
  const max = Math.max.apply(Math,lAbs) // prendre la plus grande valeur
  if (max < 8) {
    return 0; // ne bouge pas assez
  }
  const i = lAbs.indexOf(max);
  if (l[i] >= 0) { // si la valeur est positive
    return i + 1;
  } else {
    return i + 2;
  }
}

const getPerms = () => {
  if (typeof DeviceMotionEvent == "undefined" || typeof DeviceMotionEvent.requestPermission == "undefined") {
    alert("Votre appareil ne possède pas d'accéléromètre, ou il n'est pas accessible.")
    return null
  }
  DeviceMotionEvent.requestPermission().then((response) => {
    if (response == "granted") {
      bouttonJoindre.style.display = "block"
      bouttonPerms.style.display = "none"
      window.addEventListener("devicemotion", (event) => {       
        accelX = event.acceleration.x; // Haut - bas
        accelZ = event.acceleration.z; // Droite - gauche

        if (window.status == 0 && performance.now() >= relapse) {
            window.status = getStatus();
          if (window.status == 1 && lastStatus != 1) {
            // Haut
            document.getElementById("direc").innerHTML = "haut";
          } else if (window.status == 2 && lastStatus != 2) {
            // Bas
            document.getElementById("direc").innerHTML = "bas";
          } else if (window.status == 3 && lastStatus != 3) {
            // Droite
            document.getElementById("direc").innerHTML = "droite";
          } else if (window.status == 4 && lastStatus != 4) {
            // Gauche
            document.getElementById("direc").innerHTML = "gauche";
          }
          if (window.status != 0) {
            relapse = performance.now() + 400;
            sendStatus();
          }
        } else if (window.status != 0 && performance.now() >= relapse) {
          lastStatus = window.status;
          window.status = 0;
        }
      });
    }
    else {
      bouttonPerms.style.display = "none"
      alert("Nous n'avons pas réussi à accéder aux permissions de l'accéléromètre, veuillez rafraichir la page.")
    }
  });
}

let main = "Droite"

const changerMain = () => {
  if (main == "Droite") {
    main = "Gauche"
    bouttonMain.innerHTML = "Main : " + main
  }
  else {
    main = "Droite"
    bouttonMain.innerHTML = "Main : " + main
  }
}

const debuging = false;
if (debuging) {
  document.getElementById("direc").style.display = "block"
}