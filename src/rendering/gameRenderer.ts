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

function renderDeck(p: p5, game: GameState) {
    let cardWidth = p.width / 8;
    let cardHeight = cardWidth * 1.5;
    let isHovered = false;
    p.push();

    let roundedness = cardWidth / 6;
    let mouse = p.screenToWorld(p.mouseX, p.mouseY);
    p.rectMode(p.CENTER);
    p.strokeWeight(3)
    p.stroke("#212a2c");
    p.fill("#2b3f68");

    p.rect(0, 0, cardWidth, cardHeight, roundedness);
    if (mouse.x > -cardWidth/2 && mouse.x < cardWidth/2 && mouse.y > -cardHeight/2 && mouse.y < cardHeight/2) {
        // hovered
        isHovered = true;
        p.rotate(p.radians(-5));
    }
    p.rect(0, 0, cardWidth, cardHeight, roundedness);

    p.pop();
    return isHovered;
}

export class GameRenderer {
    p: p5
    game: GameState;
    boardRenderer: BoardRenderer;
    handRenderer: HandRenderer;

    hoveredCard: Card | undefined = undefined;
    revealedCard: RevealedCard | undefined = undefined;
    isRollingDie: boolean = false;
    isDeckHovered: boolean = false;

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
        this.handRenderer.update(this);
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

        p.push();
        let marginY = p.height - this.game.players.length * 50 - 100;
        p.translate(p.width - SCOREBOARD_WIDTH/2, this.game.players.length * 50 + marginY/2);
        this.isDeckHovered = renderDeck(p, this.game);
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

        // don't allow selecting new card when one is being played
        if (this.revealedCard) return;

        this.handRenderer.handleClick(this);

        if (this.isDeckHovered) {

        }
    }
}