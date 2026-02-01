import p5 from 'p5';
import {SetupScreen} from "./setupScreen";
import {GameRenderer} from "./gameRenderer";

const sketch = (p: p5) => {
    let setupScreen: SetupScreen;
    let gameRenderer: GameRenderer;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        setupScreen = new SetupScreen(p);
        gameRenderer = new GameRenderer(p);
    };

    p.draw = () => {
        p.background(220);
        if (window.game) {
            gameRenderer.update();
            gameRenderer.draw();
            return;
        }
        setupScreen.draw(p);
    };

    p.mouseClicked = () => {
        gameRenderer.handleClick();
        setupScreen.mouseClicked(p);
    };
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
};

new p5(sketch);
