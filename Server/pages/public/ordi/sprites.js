class Sprite {
    constructor(imgSrc, sx, sy, sWidth, sHeight, posX, posY, width, height) {
        this.img = new Image();
        this.img.src = imgSrc;
        this.sx = sx;
        this.sy = sy;
        this.sWidth = sWidth;
        this.sHeight = sHeight;
        this.x = posX;
        this.y = posY;
        this.width = width;
        this.height = height;
    }
    render() {
        ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, this.x, this.y, this.width, this.height);
    }
}

const instrumentDimensions = {
    "trompette": [16, 32],
    "cor": [21, 32],
    "violon": [16, 32],
    "piano": [32, 32],
    "flute": [22, 32],
    "violoncelle": [16, 32]
}
class Musicien extends Sprite {
    constructor(image, instrument, posX, posY, width, height) {
        const [sWidth, sHeight] = instrumentDimensions[instrument];
        super(image, 0, 0, sWidth, sHeight, posX, posY, width, height);
    }
}

class Groupe {
    constructor(musiciens, intervallesActions) {
        this.active = false;
        this.timeElapsed = 0;
        this.prevDansIntervalle = false;
        this.intervalleAtteint = 0;
        this.intervallesActions = intervallesActions;
        this.musiciens = musiciens;
    }

    update(dt, temps) {
        let dansIntervalle = false;
        if (this.intervalleAtteint < this.intervallesActions.length) {
            dansIntervalle = this.intervallesActions[this.intervalleAtteint][0] <= temps && temps <= this.intervallesActions[this.intervalleAtteint][1];
        }
        if (!this.prevDansIntervalle && dansIntervalle) {
            this.active = true;
        }
        else if (this.prevDansIntervalle && !dansIntervalle) {
            this.musiciens.forEach(musicien => {
                musicien.sx = 2*musicien.sWidth;
            });
            this.timeElapsed = 0;
            this.active = false;
            this.intervalleAtteint++;
        }
        if (this.active) {
            this.timeElapsed += dt;
            this.musiciens.forEach(musicien => {
                musicien.sx = (Math.floor(this.timeElapsed/500)%2) * musicien.sWidth;
            });
        }
        this.musiciens.forEach(musicien => {
            musicien.render();
        })
        this.prevDansIntervalle = dansIntervalle;
    }
}

class Arrow extends Sprite {
    constructor(lane, altitude, dead=false) {
        super("imagesJeu/arrows.png", lane*16, dead ? 16 : 0, 16, 16, laneCenters[lane]-25, altitude, 50, 50);
    }
    updatePosition(dt) {
        this.y += arrowSpeed * dt;
    }
}