const entree = document.getElementById("entree");
const bouttonJoindre = document.getElementById("bouttonJoindre");
bouttonJoindre.style.display = "none"
const bouttonPerms = document.getElementById("bouttonPerms");
bouttonJoindre.onclick = () => {
    const webSocket = new WebSocket(`ws://${window.location.hostname}:8008?code=${document.getElementById("entree").value}`);
    webSocket.onclose = () => {
        entree.style.borderColor = "red";
    }
    webSocket.onmessage = () => {
      document.body.removeChild(document.getElementById("conteneur"));
      window.sendStatus = function() {webSocket.send(window.status);}
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
  const l = [accelX*-1, 0, accelZ];
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
          //sendStatus();
        }
      });
    }
  });
}
