import p5 from 'p5';
import { Button } from "./ui";
import { startPassAndPlayGame } from './app'
// import { copyShareUrl } from "./networking";

export class SetupScreen {
    showSetupScreen = true;

    playerUpButton: Button;
    playerDownButton: Button;
    playerCount: number = 2;

    startPassAndPlayButton: Button;
    startPBEMButton: Button;
    startP2PButton: Button;

    copyIdButton: Button;

    constructor(p: p5) {
        this.playerUpButton = new Button(p.windowWidth/2+40, 80, 40, 30, "+");
        this.playerDownButton = new Button(p.windowWidth/2+40, 110, 40, 30, "-");

        this.startPassAndPlayButton = new Button(p.windowWidth/2-120, 200, 240, 30, "Start Pass & Play");
        this.startPBEMButton = new Button(p.windowWidth/2-120, 250, 240, 30, "Start PBEM");
        this.startP2PButton = new Button(p.windowWidth/2-120, 300, 240, 30, "Start P2P");

        this.copyIdButton = new Button(p.windowWidth/2-60, 30, 120, 30, "Copy Share URL");
    }

    draw(p: p5) {
        if (!this.showSetupScreen) return;

        // Player count & buttons
        p.circle(p.windowWidth/2 - 30, 100, 30);
        p.arc(p.windowWidth/2 - 30, 130, 50, 50, p.PI, 0);
        p.textSize(30);
        p.text(this.playerCount, p.windowWidth/2 + 10, 110);
        p.fill(127, 127, 220);
        this.playerUpButton.draw(p);
        p.fill(127, 127, 220);
        this.playerDownButton.draw(p);

        p.fill(127, 220, 127, 127);
        this.startPassAndPlayButton.draw(p);
        p.fill(127, 220, 127, 127);
        this.startPBEMButton.draw(p);
        p.fill(127, 127, 127, 127);
        this.startP2PButton.draw(p)


        // p.fill(127, 127, 220);
        // this.copyIdButton.draw(p);
    }

    mouseClicked(p: p5) {
        if (!this.showSetupScreen) return;

        if (this.playerUpButton.isHovered(p)) this.playerCount++;
        if (this.playerDownButton.isHovered(p)) this.playerCount--;
        this.playerCount = Math.max(Math.min(this.playerCount, 6), 2);

        if (this.startPassAndPlayButton.isHovered(p)) {
            this.showSetupScreen = false;
            startPassAndPlayGame(this.playerCount);
        }

        // if (this.copyIdButton.isHovered(p)) copyShareUrl();
    }
}