import p5 from "p5";
import {Card, CardAction, Direction, GameState, PieceType, SelectObjectType, SelectPieceType} from "../gamelogic";
import {CardRenderer} from "./cardRenderer";
import {BoardRenderer} from "./boardRenderer";
import {HandRenderer} from "./handRenderer";

function drawScoreboard(p: p5, game: GameState) {
    let scoreBoardX = p.width - 100;
    let scoreBoardY = 10;
    let scoreBoardWidth = p.width - scoreBoardX;
    let yOffset = 0;
    for (let player of game.players) {
        // p.fill(player.color);
        // p.rect(scoreBoardX, scoreBoardY + yOffset, 100, 20);

        let headDiameter = scoreBoardWidth / 10;
        let bodyDiameter = headDiameter * 2;
        p.fill(player.color);
        p.noStroke();
        p.circle(scoreBoardX, scoreBoardY + bodyDiameter + yOffset - headDiameter, headDiameter);
        p.arc(scoreBoardX, scoreBoardY + bodyDiameter + yOffset, bodyDiameter, bodyDiameter, p.PI, 0);

        p.fill(0);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(player.name + " Cards: " + player.hand.length, scoreBoardX, scoreBoardY + 12 + yOffset);
        yOffset += 20;
    }
}

export class GameRenderer {
    p: p5
    game: GameState;
    boardRenderer: BoardRenderer;
    handRenderer: HandRenderer;
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

        // rescale board
        this.boardRenderer.update(p, game);
        this.handRenderer.update(p, game);
    }

    draw() {
        if (!this.game) return;
        this.p.background("#FFFFFF");
        this.boardRenderer.draw(this.p, this.game);

        this.handRenderer.x = this.p.width/2;
        this.handRenderer.y = this.p.height;
        this.handRenderer.draw(this.p, this.game);

        // render scoreboard
        drawScoreboard(this.p, this.game);
    }

    handleClick() {
        if (!this.game) return;

    }
}