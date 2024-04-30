const entree = document.getElementById("entree");
const bouttonJoindre = document.getElementById("bouttonJoindre");
bouttonJoindre.onclick = () => {
    const webSocket = new WebSocket(`ws://${window.location.hostname}:8008?code=${document.getElementById("entree").value}`);
    webSocket.onclose = () => {
        entree.style.borderColor = "red";
    }
    webSocket.onmessage = () => {
        document.body.removeChild(document.getElementById("conteneur"));
        DeviceMotionEvent.requestPermission().then((response) => {
            if (response == "granted") {
                window.addEventListener("devicemotion", (event) => {
                    accelX = event.acceleration.x; // Haut - bas
                    accelY = event.acceleration.y;
                    accelZ = event.acceleration.z; // Droite - gauche
                    webSocket.send([accelX, accelY, accelZ]);
                })
            }
        })
    }
};