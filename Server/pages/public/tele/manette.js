const entree = document.getElementById("entree");
const bouttonJoindre = document.getElementById("bouttonJoindre");
const bouttonMain = document.getElementById("bouttonMain");
// bouttonJoindre.style.display = "none";
const bouttonPerms = document.getElementById("bouttonPerms");
const statusToLane = ["rien", 2, 1, 3, 0];
bouttonJoindre.onclick = () => {
    const webSocket = new WebSocket(`ws://${window.location.hostname}:8080?code=${document.getElementById("entree").value}`);
    webSocket.onclose = () => {
        entree.style.borderColor = "red";
    }
    webSocket.onmessage = () => {
      document.body.removeChild(document.getElementById("conteneur"));
      window.sendStatus = function() {webSocket.send(statusToLane[window.status]);}
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
  if (main == "Droite") {changement = -1}
  const l = [accelX*changement, 0, accelZ*changement*-1];
  lAbs = l.map(Math.abs);
  const max = Math.max.apply(Math,lAbs)
  if (max < 8) {
    return 0;
  }
  const i = lAbs.indexOf(max);
  if (l[i] >= 0) {
    return i + 1;
  } else {
    return i + 2;
  }
}

const getPerms = () => {
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