import p5 from "p5";
import {GameRenderer} from "./gameRenderer";
import {GameAction, GameActionType} from "../gamelogic";

export class DieRenderer {
    x: number;
    y: number;
    w: number;
    rotation: number = 0;
    value: number = 5;
    isHovered: boolean = false;
    elapsedTimeSeconds: number = 0;
    didStartRolling: boolean = false;
    dieRollTimeSeconds: number = 0;

    constructor(x: number, y: number, w: number) {
        this.x = x;
        this.y = y;
        this.w = w;
    }

    update(gameRenderer: GameRenderer) {
        let p = gameRenderer.p;
        let game = gameRenderer.game!;

        this.isHovered = false;
        this.elapsedTimeSeconds += p.deltaTime / 1000;
        if (gameRenderer.isRollingDie && !this.didStartRolling) {
            this.elapsedTimeSeconds = 0;
            this.dieRollTimeSeconds = p.random(0.3, 1.2);
            this.didStartRolling = true;
        } else if (gameRenderer.isRollingDie && this.didStartRolling && this.elapsedTimeSeconds > this.dieRollTimeSeconds) {
            gameRenderer.isRollingDie = false;
            this.didStartRolling = false;
            try {
                game.submitAction({
                    playerId: game.currentPlayerId,
                    action: GameActionType.MovePawn
                } as GameAction);
                this.value = game.leger[game.leger.length - 1].dieRollResult;
            } catch (e) {
                console.error(e);
            }
        }
    }

    draw(p: p5, isRolling: boolean) {
        p.push();
        p.translate(this.x, this.y);

        let dieSize = this.w / 2;
        let mouse = p.screenToWorld(p.mouseX, p.mouseY);
        if (mouse.x > -dieSize/2 && mouse.x < dieSize/2 && mouse.y > -dieSize/2 && mouse.y < dieSize/2) {
            p.rotate(p.radians(-10));
            this.isHovered = true;
        }

        let dieState = this.value;
        if (isRolling) {
            p.rotate(p.radians(360 * this.elapsedTimeSeconds * 3.5));
            dieState = Math.floor(this.elapsedTimeSeconds * 6) % 6 + 1;
        }

        let roundedness = this.w / 6;
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(3);
        p.rectMode(p.CENTER);
        p.rect(0, 0, dieSize, dieSize, roundedness);

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
                p.circle(-dotSize*2, -dotSize*2, dotSize);
                p.circle(0, 0, dotSize);
                p.circle(dotSize*2, dotSize*2, dotSize);
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
                p.circle(-dotSize*1.7, -dotSize*2, dotSize);
                p.circle(dotSize*1.7, -dotSize*2, dotSize);
                p.circle(-dotSize*1.7, 0, dotSize);
                p.circle(dotSize*1.7, 0, dotSize);
                p.circle(-dotSize*1.7, dotSize*2, dotSize);
                p.circle(dotSize*1.7, dotSize*2, dotSize);
                break;
        }
        p.pop();
    }
}