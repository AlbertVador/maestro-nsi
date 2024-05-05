import * as path from "path";
import express from "express";
import cors from "cors";
import * as url from "url";
const app = express();

import bodyParser from "body-parser" // npm install body-parser
import device from 'express-device'; // npm install express-device

app.use(bodyParser());
app.use(device.capture());

import * as ws from "ws";
import * as fs from "fs";
const clientServer = new ws.WebSocketServer({ port: 8008 });
const phoneServer = new ws.WebSocketServer({ port: 8080 });
const port = 3000;

app.use(cors());
app.use(express.static(path.join("./pages/public")));

const phoneSockets = {};
const clientSockets = {};

const createUniqueID = () => {
    return String.fromCharCode(
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26),
        65 + Math.floor(Math.random()*26)
    );
}

clientServer.on("connection", (ws) => {
    let sID = createUniqueID();
    while (Object.keys(clientSockets).includes(sID)) {
        sID = createUniqueID();
    }
    console.log("code : ", sID)
    clientSockets[sID] = [ws, 0];
    console.log(Object.keys(clientSockets).length);
    console.log("connected");
    ws.on("message", (data) => {})
    ws.on("close", () => {
        delete clientSockets[sID];
        for (const [key, value] of Object.entries(phoneSockets)) {
            if (value[1] === sID) {
                phoneSockets[key][0].close();
            }
        }
        console.log("closed");
    })
    ws.send(sID);
})

phoneServer.on("connection", (ws, req) => {
    const parametresUrl = url.parse(req.url, true);
    const code = parametresUrl.query.code;
    if (Object.keys(clientSockets).includes(code) && clientSockets[code][1] < 2) {
        let sID = createUniqueID();
        while (Object.keys(phoneSockets).includes(sID)) {
            sID = createUniqueID();
        }

        phoneSockets[sID] = [ws, code];
        clientSockets[code][1]++;
        clientSockets[code][0].send("connecté");
        ws.on("message", (data) => {
            const statutTel = parseInt(data.toString());
            console.log(statutTel);
            clientSockets[code][0].send(statutTel);
        })
    
        ws.on("close", () => {
            delete phoneSockets[sID];
            if (Object.keys(clientSockets).includes(code)) {
                clientSockets[code][0].send("déconnecté");
                clientSockets[code][1]--;
            }
            console.log("closed");
        })
        ws.send("succes");
    }
    else {
        ws.close();
    }
})

// Chemin pour envoyer la page principale du jeu
app.get("/", (req, res) => {
    if (req.device.type == 'phone') {
      res.sendFile("telephone.html", { root: "pages" })
    }
    else {
      res.sendFile("ordinateur.html", { root: "pages" });
    }
});

// Chemin pour envoyer la page telephone
app.get("/telephone", (req, res) => {
    res.sendFile("telephone.html", { root: "pages" });
});

// Chemin pour envoyer la liste de chansons possibles
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

// Chemin pour envoyer les informations sur les chansons
app.get("/chanson/:nom", (req, res) => {
    const nom = req.params.nom
    res.sendFile(nom, { root: 'infoChansons' });
});

// Chemin pour envoyer les audios
app.get("/audio/:nom", (req, res) => {
    const nom = req.params.nom
    res.sendFile(nom, { root: 'audio' });
});

app.listen(port, () => {
    console.log(`Serveur écoute sur le port ${port}.`);
});
