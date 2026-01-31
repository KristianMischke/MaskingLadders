import p5 from "p5";

export class Button {
    private x: number;
    private y: number;
    private w: number;
    private h: number;
    private text: string;
    constructor(x: number, y: number, w: number, h: number, text: string) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text;
    }
    draw(p: p5) {
        let offset = 0;
        let size = 12;
        if (this.isHovered(p)) {
            offset = 5;
            size = 16;
        }
        p.rect(this.x-offset, this.y-offset, this.w+offset*2, this.h+offset*2, 20);

        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(size);
        p.text(this.text, this.x + this.w/2, this.y + this.h/2);
    }
    isHovered(p: p5) {
        return p.mouseX > this.x && p.mouseY > this.y && p.mouseX < this.x + this.w && p.mouseY < this.y + this.h;
    }
}
