import p5 from "p5";
import {Card, GameActionType, GameState, RevealedCard} from "../gamelogic";
import {BoardRenderer} from "./boardRenderer";
import {HandRenderer} from "./handRenderer";
import {COIN_COLOR, COIN_OUTLINE} from "./pieceRenderer";

const SCOREBOARD_WIDTH = 200;

function drawScoreboard(p: p5, game: GameState, elapsedTimeSeconds: number = 0) {
    p.push();
    p.translate(p.width - SCOREBOARD_WIDTH, 10);
    for (let player of game.players) {
        p.strokeWeight(2);
        p.fill(255);
        p.stroke(player.color);
        p.rect(0, 0, SCOREBOARD_WIDTH, 40, 30);
        p.noStroke();

        if (player.id === game.currentPlayerId) {
            p.push();
            p.fill(player.color);
            p.translate(-50 + p.sin(elapsedTimeSeconds*3) * 5, 0);
            p.triangle(10, 10, 10, 30, 30, 20);
            p.pop();
        }

        p.push();
        {
            let headDiameter = SCOREBOARD_WIDTH / 10;
            let bodyDiameter = headDiameter * 2;
            p.fill(player.color);
            p.noStroke();
            p.translate(0, bodyDiameter);
            p.circle(0, -headDiameter, headDiameter);
            p.arc(0, 0, bodyDiameter, bodyDiameter, p.PI, 0);
        }
        p.pop();

        p.push();
        {
            p.fill(0);
            p.textAlign(p.LEFT, p.CENTER);
            p.translate(20, 12);
            p.text(player.name, 0, 0);
        }
        p.pop();

        p.push();
        {
            p.translate(20, 25);
            for (let i = 0; i < player.hand.length; i++) {
                p.translate(10, 0);
                p.fill(player.color);
                p.stroke(0);
                p.strokeWeight(3);
                p.rect(0, 0, 20, 30, 6);
            }
        }
        p.pop();

        p.push();
        {
            p.translate(120, 20);

            p.fill(COIN_COLOR);
            p.stroke(COIN_OUTLINE);
            p.strokeWeight(2);
            p.ellipse(0, 0, 25 * p.sin(elapsedTimeSeconds), 25);

            p.fill(0);
            p.noStroke();
            p.translate(25, 0);
            p.textSize(15);
            p.textStyle(p.BOLD);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(player.score, 0, 0);
        }
        p.pop();

        p.translate(0, 50);
    }
    p.pop();
}

export class GameRenderer {
    p: p5
    game: GameState;
    boardRenderer: BoardRenderer;
    handRenderer: HandRenderer;

    hoveredCard: Card | undefined = undefined;
    revealedCard: RevealedCard | undefined = undefined;
    rollDie: boolean = false;

    elapsedTimeSeconds: number = 0;

    constructor(p: p5) {
        this.p = p;
        this.boardRenderer = new BoardRenderer(p.width, p.height);
        this.handRenderer = new HandRenderer(p.width, p.height, p.width);
    }

    update() {
        this.game = window.game;
        if (!this.game) return;
        let p = this.p;
        let game = this.game;

        this.elapsedTimeSeconds += p.deltaTime / 1000;

        let lastLeger = game.leger[game.leger.length-1];
        if (lastLeger && lastLeger.action === GameActionType.PlayCard) {
            this.revealedCard = lastLeger.revealedCard;
        } else {
            this.revealedCard = undefined;
        }

        // rescale board
        this.boardRenderer.update(p, game);
        this.handRenderer.update(p, game);
    }

    draw() {
        if (!this.game) return;
        let p = this.p;
        p.background("#5c5a5a");

        p.push();
        let marginX = p.width - SCOREBOARD_WIDTH - this.boardRenderer.w;
        p.translate(marginX/2, 0);
        this.boardRenderer.draw(this);
        p.pop();

        this.handRenderer.x = p.width/2;
        this.handRenderer.y = p.height;
        this.handRenderer.draw(this);

        // render scoreboard
        drawScoreboard(this.p, this.game, this.elapsedTimeSeconds);
    }

    handleClick() {
        if (!this.game) return;
        this.boardRenderer.handleClick(this);

        if (!this.revealedCard) {
            // don't allow selecting new card when one is being played
            this.handRenderer.handleClick(this);
        }
    }
}