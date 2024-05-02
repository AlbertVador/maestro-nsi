class Sprite {
    constructor(imgSrc, posX, posY, width, height) {
        this.img = new Image();
        this.img.src = imgSrc;
        this.x = posX;
        this.y = posY;
        this.width = width;
        this.height = height;
    }
    render() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}

class Musicien extends Sprite {
    constructor(directory, intervallesActions, posX, posY) {
        super(`${directory}/actif0.png`, posX, posY, 80, 160); // (80, 160) = (16*5, 32*5), (16, 32) étant les dimensions des images pour les musiciens
        this.directory = directory;
        this.active = false;
        this.timeElapsed = 0;
        this.prevDansIntervalle = false;
        this.intervalleAtteint = 0;
        this.intervallesActions = intervallesActions;
    }
    update(dt, temps) {
        console.log(temps);
        const dansIntervalle = this.intervallesActions[this.intervalleAtteint][0] <= temps && temps <= this.intervallesActions[this.intervalleAtteint][1];
        if (!this.prevDansIntervalle && dansIntervalle) {
            this.active = true;
        }
        else if (this.prevDansIntervalle && !dansIntervalle) {
            this.active = false;
            this.intervalleAtteint++;
            this.img.src = `${this.directory}/passif.png`;
            this.timeElapsed = 0;
        }
        if (this.active) {
            this.timeElapsed += dt;
            this.img.src = `${this.directory}/actif${Math.floor(this.timeElapsed/500)%2}.png`;
        }
        this.prevDansIntervalle = dansIntervalle;
    }
}

class Arrow extends Sprite {
    constructor(lane, altitude, dead=false) {
        let imgSrc;
        const directory = "imagesJeu/" + (dead ? "deadArrows" : "activeArrows");
        switch (lane) {
            case 0:
                imgSrc = `${directory}/LeftArrow.png`;
                break;
            case 1:
                imgSrc = `${directory}/DownArrow.png`;
                break;
            case 2:
                imgSrc = `${directory}/UpArrow.png`;
                break;
            case 3:
                imgSrc = `${directory}/RightArrow.png`;
                break;
        }
        super(imgSrc, laneCenters[lane]-25, altitude, 50, 50);
    }
    updatePosition(dt) {
        this.y += arrowSpeed * dt;
        return this.y > canvasHeight;
    }
}