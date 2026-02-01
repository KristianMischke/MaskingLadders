import p5 from "p5";

export class DieRenderer {
    x: number;
    y: number;
    w: number;
    rotation: number = 0;
    value: number = 5;
    isHovered: boolean = false;

    constructor(x: number, y: number, w: number) {
        this.x = x;
        this.y = y;
        this.w = w;
    }

    update(p: p5) {
        this.isHovered = false;
    }

    draw(p: p5) {
        p.push();
        p.translate(this.x, this.y);

        let dieSize = this.w / 2;
        let mouse = p.screenToWorld(p.mouseX, p.mouseY);
        if (mouse.x > -dieSize/2 && mouse.x < dieSize/2 && mouse.y > -dieSize/2 && mouse.y < dieSize/2) {
            p.rotate(p.radians(-10));
            this.isHovered = true;
        }

        let roundedness = this.w / 6;
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(3);
        p.rectMode(p.CENTER);
        p.rect(0, 0, dieSize, dieSize, roundedness);

        let dieState = 5;
        let dotSize = dieSize/8;
        p.fill(0);
        switch (dieState) {
            case 1:
                p.circle(0, 0, dotSize);
                break;
            case 2:
                p.circle(-dotSize*2, -dotSize*2, dotSize);
                p.circle(dotSize*2, dotSize*2, dotSize);
                break;
            case 3:
                p.circle(-dotSize*3, -dotSize*3, dotSize);
                p.circle(0, 0, dotSize);
                p.circle(dotSize*3, dotSize*3, dotSize);
                break;
            case 4:
                p.circle(-dotSize*2, -dotSize*2, dotSize);
                p.circle(dotSize*2, dotSize*2, dotSize);
                p.circle(-dotSize*2, dotSize*2, dotSize);
                p.circle(dotSize*2, -dotSize*2, dotSize);
                break;
            case 5:
                p.circle(-dotSize*2, -dotSize*2, dotSize);
                p.circle(dotSize*2, dotSize*2, dotSize);
                p.circle(-dotSize*2, dotSize*2, dotSize);
                p.circle(dotSize*2, -dotSize*2, dotSize);
                p.circle(0, 0, dotSize);
                break;
            case 6:
                p.circle(-dotSize*2, -dotSize*3, dotSize);
                p.circle(dotSize*2, -dotSize*3, dotSize);
                p.circle(-dotSize*2, 0, dotSize);
                p.circle(-dotSize*2, 0, dotSize);
                p.circle(dotSize*2, dotSize*3, dotSize);
                p.circle(dotSize*2, dotSize*3, dotSize);
                break;
        }
        p.pop();
    }
}