// Classe Sprite représentant un élément graphique du jeu
class Sprite {
    constructor(imgSrc, sx, sy, sWidth, sHeight, posX, posY, width, height) {
        this.img = new Image();  // Crée un nouvel objet Image
        this.img.src = imgSrc;   // Définit la source de l'image
        this.sx = sx;            // Position X du sprite dans l'image source
        this.sy = sy;            // Position Y du sprite dans l'image source
        this.sWidth = sWidth;    // Largeur du sprite dans l'image source
        this.sHeight = sHeight;  // Hauteur du sprite dans l'image source
        this.x = posX;           // Position X du sprite dans le canvas
        this.y = posY;           // Position Y du sprite dans le canvas
        this.width = width;      // Largeur du sprite à dessiner sur le canvas
        this.height = height;    // Hauteur du sprite à dessiner sur le canvas
    }

    // Méthode pour dessiner le sprite sur le canvas
    render() {
        ctx.drawImage(
            this.img,     // Image source à dessiner
            this.sx,      // Position X du sprite source dans l'image source
            this.sy,      // Position Y du sprite source dans l'image source
            this.sWidth,  // Largeur du sprite source dans l'image source
            this.sHeight, // Hauteur du sprite source dans l'image source
            this.x,       // Position X où dessiner le sprite sur le canvas
            this.y,       // Position Y où dessiner le sprite sur le canvas
            this.width,   // Largeur du sprite à dessiner sur le canvas
            this.height   // Hauteur du sprite à dessiner sur le canvas
        );
    }
}

// Dimensions des instruments pour les musiciens
const instrumentDimensions = {
    trompette: [16, 32],
    cor: [21, 32],
    violon: [16, 32],
    piano: [32, 32],
    flute: [22, 32],
    violoncelle: [16, 32],
};

// Classe Musicien étendue à partir de Sprite pour représenter un musicien dans le jeu
class Musicien extends Sprite {
    constructor(image, instrument, posX, posY, width, height) {
        const [sWidth, sHeight] = instrumentDimensions[instrument];
        // Appel du constructeur de la classe parent (Sprite) avec des valeurs spécifiques
        super(image, 2 * sWidth, 0, sWidth, sHeight, posX, posY, width, height);
    }
}

// Classe Groupe pour gérer un groupe de musiciens dans le jeu
class Groupe {
    constructor(musiciens, intervallesActions) {
        this.active = false;                   // Indique si le groupe est actif ou non
        this.timeElapsed = 0;                  // Temps écoulé depuis le début de l'activité du groupe
        this.prevDansIntervalle = false;       // Indique si le groupe était dans un intervalle précédent
        this.intervalleAtteint = 0;            // Index de l'intervalle d'actions actuel
        this.intervallesActions = intervallesActions; // Liste des intervalles d'actions
        this.musiciens = musiciens;            // Liste des musiciens dans le groupe
    }

    // Méthode pour mettre à jour le groupe en fonction du temps écoulé
    update(dt, temps) {
        let dansIntervalle = false;
        if (this.intervalleAtteint < this.intervallesActions.length) {
            // Vérifie si le temps actuel est dans l'intervalle d'actions actuel
            dansIntervalle =
                this.intervallesActions[this.intervalleAtteint][0] <= temps &&
                temps <= this.intervallesActions[this.intervalleAtteint][1];
        }

        // Gestion de l'activation/désactivation du groupe en fonction de l'intervalle
        if (!this.prevDansIntervalle && dansIntervalle) {
            this.active = true;
        } else if (this.prevDansIntervalle && !dansIntervalle) {
            // Réinitialisation des musiciens lorsque l'intervalle se termine
            this.musiciens.forEach((musicien) => {
                musicien.sx = 2 * musicien.sWidth;
            });
            this.timeElapsed = 0;
            this.active = false;
            this.intervalleAtteint++;
        }

        // Mise à jour des musiciens actifs dans le groupe
        if (this.active) {
            this.timeElapsed += dt;
            this.musiciens.forEach((musicien) => {
                // Animation des musiciens en alternance
                musicien.sx =
                    (Math.floor(this.timeElapsed / 500) % 2) * musicien.sWidth;
            });
        }

        // Affichage des musiciens du groupe
        this.musiciens.forEach((musicien) => {
            musicien.render(); // Appel à la méthode render() de chaque musicien
        });
        this.prevDansIntervalle = dansIntervalle;
    }
}

// Classe Arrow étendue à partir de Sprite pour représenter une flèche dans le jeu
class Arrow extends Sprite {
    constructor(lane, altitude, dead = false) {
        // Appel du constructeur de la classe parent (Sprite) avec des valeurs spécifiques
        super(
            "imagesJeu/arrows.png",
            lane * 16,
            dead ? 16 : 0,
            16,
            16,
            laneCenters[lane] - 25,
            altitude,
            50,
            50,
        );
    }
    
    // Méthode pour mettre à jour la position de la flèche en fonction du temps écoulé
    updatePosition(dt) {
        this.y += arrowSpeed * dt; // Déplacement vertical de la flèche en fonction de la vitesse
    }
}
