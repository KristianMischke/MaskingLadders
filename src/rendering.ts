import p5 from 'p5';
import {SetupScreen} from "./setupScreen";
import {drawGame} from "./drawGame";

const sketch = (p: p5) => {
    let setupScreen: SetupScreen;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        setupScreen = new SetupScreen(p);
    };

    p.draw = () => {
        if (window.game) {
            drawGame(p);
            return;
        }
        p.background(220);
        p.ellipse(p.mouseX, p.mouseY, 50, 50);
        setupScreen.draw(p);
    };

    p.mouseClicked = () => {
        setupScreen.mouseClicked(p);
    };
};

new p5(sketch);
