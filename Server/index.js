// Import des modules nécessaires
import * as path from "path"; // Pour gérer les chemins de fichiers
import express from "express"; // Framework pour les applications web en Node.js
import cors from "cors"; // Middleware pour gérer les requêtes CORS
import * as url from "url"; // Pour analyser les URL

// Initialisation de l'application Express
const app = express();

// Import des middlewares
import bodyParser from "body-parser"; // Middleware pour analyser le corps des requêtes HTTP
import device from 'express-device'; // Middleware pour détecter le type de dispositif

// Utilisation des middlewares
app.use(bodyParser()); // Analyse le corps des requêtes en JSON, texte brut, ou URL encodées
app.use(device.capture()); // Capture le type de dispositif (ordinateur, téléphone, etc.)

// Import des modules WebSocket et système de fichiers
import * as ws from "ws"; // Pour les WebSockets
import * as fs from "fs"; // Pour gérer les fichiers système
// Création des serveurs WebSocket sur différents ports
const clientServer = new ws.WebSocketServer({ port: 8008 }); // WebSocket pour les clients
const phoneServer = new ws.WebSocketServer({ port: 8080 }); // WebSocket pour les téléphones

// Port d'écoute pour le serveur Express
const port = 3000;

// Configuration des middlewares
app.use(cors()); // Autorise les requêtes CORS (Cross-Origin Resource Sharing)
app.use(express.static(path.join("./pages/public"))); // Définit le dossier des fichiers statiques (CSS, JS, etc.)

// Objets de stockage des connexions WebSocket
const phoneSockets = {}; // Stocke les connexions des téléphones
const clientSockets = {}; // Stocke les connexions des clients (ordinateurs)

// Fonction pour générer un identifiant unique
const createUniqueID = () => {
    return String.fromCharCode(
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26)
    );
}

// Gestion des connexions WebSocket des clients (ordinateurs)
clientServer.on("connection", (ws) => {
    let sID = createUniqueID();
    while (Object.keys(clientSockets).includes(sID)) {
        sID = createUniqueID();
    }
    // Stockage de la connexion client avec son identifiant et un compteur d'appareils connectés
    clientSockets[sID] = [ws, 0];
    console.log("code : ", sID);
    console.log(Object.keys(clientSockets).length);
    console.log("connected");

    // Gestion de la déconnexion du client
    ws.on("close", () => {
        delete clientSockets[sID];
        // Fermeture des connexions téléphoniques associées
        for (const [key, value] of Object.entries(phoneSockets)) {
            if (value[1] === sID) {
                phoneSockets[key][0].close();
            }
        }
        console.log("closed");
    });

    // Envoi de l'identifiant unique au client
    ws.send(sID);
});

// Gestion des connexions WebSocket des téléphones
phoneServer.on("connection", (ws, req) => {
    // Extraction du code d'identification depuis l'URL
    const parametresUrl = url.parse(req.url, true);
    const code = parametresUrl.query.code;

    // Vérification du code d'identification et du nombre maximal d'appareils connectés
    if (Object.keys(clientSockets).includes(code) && clientSockets[code][1] < 2) {
        let sID = createUniqueID();
        while (Object.keys(phoneSockets).includes(sID)) {
            sID = createUniqueID();
        }

        // Stockage de la connexion téléphone avec son identifiant et le code client associé
        phoneSockets[sID] = [ws, code];
        clientSockets[code][1]++; // Incrémentation du nombre d'appareils connectés au client

        // Envoi de message au client pour indiquer la connexion d'un téléphone
        clientSockets[code][0].send("connecté");

        // Gestion des messages reçus du téléphone
        ws.on("message", (data) => {
            const statutTel = parseInt(data.toString());
            console.log(statutTel);
            clientSockets[code][0].send(statutTel); // Transmission du statut au client
        });

        // Gestion de la déconnexion du téléphone
        ws.on("close", () => {
            delete phoneSockets[sID];
            if (Object.keys(clientSockets).includes(code)) {
                clientSockets[code][0].send("déconnecté");
                clientSockets[code][1]--; // Décrémentation du nombre d'appareils connectés au client
            }
            console.log("closed");
        });

        // Envoi d'un message de succès au téléphone
        ws.send("succes");
    } else {
        ws.close(); // Fermeture de la connexion si le code n'est pas valide ou le client a atteint le nombre maximal d'appareils connectés
    }
});

// Chemin pour renvoyer la page principale du jeu en fonction du type de dispositif
app.get("/", (req, res) => {
    if (req.device.type == 'phone') {
      res.sendFile("telephone.html", { root: "pages" }); // Envoi de la page pour les téléphones
    } else {
      res.sendFile("ordinateur.html", { root: "pages" }); // Envoi de la page pour les ordinateurs
    }
});

// Chemin pour renvoyer la page pour les téléphones
app.get("/telephone", (req, res) => {
    res.sendFile("telephone.html", { root: "pages" });
});

// Chemin pour renvoyer la liste des chansons possibles au format JSON
app.get("/chansonsPossibles", (req, res) => {
    const musiques = []
    fs.readdirSync("./infoChansons/").forEach(file => {
        if (file.endsWith(".json")) {
            let obj = JSON.parse(fs.readFileSync(`./infoChansons/${file}`, 'utf8'));
            musiques.push([`${obj["titre"]} - ${obj["artiste"]}`, file]);
        };
    });
    res.json(musiques);
});

// Chemin pour renvoyer les informations sur une chanson spécifique
app.get("/chanson/:nom", (req, res) => {
    const nom = req.params.nom
    res.sendFile(nom, { root: 'infoChansons' });
});

// Chemin pour renvoyer les fichiers audio
app.get("/audio/:nom", (req, res) => {
    const nom = req.params.nom
    res.sendFile(nom, { root: 'audio' });
});

// Démarrage du serveur Express
app.listen(port, () => {
    console.log(`Serveur écoute sur le port ${port}.`);
});