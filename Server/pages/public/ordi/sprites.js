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